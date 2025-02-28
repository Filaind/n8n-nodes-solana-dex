import { StrategyType } from "@meteora-ag/dlmm";
import DLMM from "@meteora-ag/dlmm";
import { PublicKey } from "@solana/web3.js";
import { INodeExecutionData } from "n8n-workflow";
import BN from "bn.js";
import { ComputeBudgetProgram, Connection, Keypair, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from "@solana/web3.js";
import { findTokenAccountForMint } from "../Solana/solana.functions";

const USDC_MINT_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";


export async function getUserPositions(dlmmPool: DLMM, user: PublicKey): Promise<INodeExecutionData[]> {
    const returnData: INodeExecutionData[] = [];
    try {
        const { userPositions } = await dlmmPool.getPositionsByUserAndLbPair(user);
        const activeBin = await dlmmPool.getActiveBin();
        const activeBinPrice = Number(activeBin.pricePerToken);

        for (let userPosition of userPositions) {
            const position = userPosition;
            const startPrice = Number(position.positionData.positionBinData[0].pricePerToken);
            const endPrice = Number(position.positionData.positionBinData[position.positionData.positionBinData.length - 1].pricePerToken);
            const xAmount = Number(position.positionData.totalXAmount) / 10 ** 9; //ПРИВОДИМ К ЧЕЛОВЕЧЕСКИМ ЕДИНИЦАМ
            const yAmount = Number(position.positionData.totalYAmount) / 10 ** 6; //ПРИВОДИМ К ЧЕЛОВЕЧЕСКИМ ЕДИНИЦАМ

            returnData.push({
                json: {
                    startPrice,
                    endPrice,
                    xAmount,
                    yAmount,
                    activeBinPrice,
                },
            });
        }
    } catch (error) {
        returnData.push({
            json: {
                error: true,
                message: JSON.stringify(error),
            },
        });
    }
    return returnData;
}

export async function closeAllPositions(dlmmPool: DLMM, connection: Connection, user: Keypair): Promise<INodeExecutionData[]> {
    const returnData: INodeExecutionData[] = [];
    try {
        const { userPositions } = await dlmmPool.getPositionsByUserAndLbPair(user.publicKey);

        for (let userPosition of userPositions) {
            const binIdsToRemove = userPosition.positionData.positionBinData.map(
                (bin) => bin.binId
            );
            const removeLiquidityTx = await dlmmPool.removeLiquidity({
                position: userPosition.publicKey,
                user: user.publicKey,
                binIds: binIdsToRemove, //КАКИЕ БИНЫ ЗАБИРАЕМ
                bps: new BN(100 * 100), //ЗАБИРАЕМ 100% ИЗ ВЫБРАННЫХ БИНОВ
                shouldClaimAndClose: true,
            });

            for (let tx of Array.isArray(removeLiquidityTx) ? removeLiquidityTx : [removeLiquidityTx]) {

                //ПРИОРИТЕТНАЯ ТРАНЗАКЦИЯ, ВЫЧИСЛИТЬ ОПТИМАЛЬНУЮ ЦЕНУ
                tx.add(ComputeBudgetProgram.setComputeUnitPrice({
                    microLamports: 10000
                }));

                const removeBalanceLiquidityTxHash = await sendAndConfirmTransaction(
                    connection,
                    tx,
                    [user],
                    { skipPreflight: true }
                );

                returnData.push({
                    json: {
                        txHash: removeBalanceLiquidityTxHash,
                    },
                });
            }
        }
    } catch (error) {
        returnData.push({
            json: {
                error: true,
                message: JSON.stringify(error),
            },
        });
    }
    return returnData;
}

export async function openPosition(dlmmPool: DLMM, connection: Connection, user: Keypair, poolStrategy: StrategyType): Promise<INodeExecutionData[]> {
    const returnData: INodeExecutionData[] = [];
    try {
        let userSolBalance = await connection.getBalance(user.publicKey);
        const usdcTokenAccount = await findTokenAccountForMint(connection, user.publicKey, USDC_MINT_ADDRESS);

        if (!usdcTokenAccount) {
            throw new Error("USDC token account not found for this user");
        }

        const usdcUserBalance = await connection.getTokenAccountBalance(usdcTokenAccount);
        const usdcForDeposit = Number(usdcUserBalance.value.amount) / 10 ** 6;

        const activeBin = await dlmmPool.getActiveBin();
        const minBinId = activeBin.binId - 33; //ВЫЧИСЛИТЬ ОФФСЕТ НА ОСНОВЕ КОЛИЧЕСТВА ТОКЕНОВ В АККАУНТЕ ЮЗЕРА
        const maxBinId = activeBin.binId + 33; //ВЫЧИСЛИТЬ ОФФСЕТ НА ОСНОВЕ КОЛИЧЕСТВА ТОКЕНОВ В АККАУНТЕ ЮЗЕРА

        //ОСТАВИТЬ 0.01 SOL НА ТРАНЗАКЦИИ и 0.06 SOL НА ОТКРЫТИЕ ПОЗИЦИИ
        userSolBalance -= LAMPORTS_PER_SOL * 0.01;
        userSolBalance -= LAMPORTS_PER_SOL * 0.06;

        const totalXAmount = new BN(userSolBalance);
        const totalYAmount = new BN(usdcForDeposit);

        const newBalancePosition = Keypair.generate();

        const createPositionTx = await dlmmPool.initializePositionAndAddLiquidityByStrategy({
            positionPubKey: newBalancePosition.publicKey,
            user: user.publicKey,
            totalXAmount,
            totalYAmount,
            slippage: 0.03,
            strategy: {
                maxBinId,
                minBinId,
                strategyType: poolStrategy,
            },
        });

        //ПРИОРИТЕТНАЯ ТРАНЗАКЦИЯ, ВЫЧИСЛИТЬ ОПТИМАЛЬНУЮ ЦЕНУ
        createPositionTx.add(ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: 10000
        }));

        const createBalancePositionTxHash = await sendAndConfirmTransaction(
            connection,
            createPositionTx,
            [user, newBalancePosition]
        );

        returnData.push({
            json: {
                txHash: createBalancePositionTxHash,
            },
        });
    } catch (error) {
        returnData.push({
            json: {
                error: true,
                message: JSON.stringify(error),
            },
        });
    }
    return returnData;
}

export async function claimAllRewards(dlmmPool: DLMM, connection: Connection, user: Keypair): Promise<INodeExecutionData[]> {
    const returnData: INodeExecutionData[] = [];
    try {
        const { userPositions } = await dlmmPool.getPositionsByUserAndLbPair(user.publicKey);

        for (let userPosition of userPositions) {
            
            const claimRewardsTx = await dlmmPool.claimAllRewardsByPosition({
                owner: user.publicKey,
                position: userPosition,
            });

            for (let tx of Array.isArray(claimRewardsTx) ? claimRewardsTx : [claimRewardsTx]) {

                //ПРИОРИТЕТНАЯ ТРАНЗАКЦИЯ, ВЫЧИСЛИТЬ ОПТИМАЛЬНУЮ ЦЕНУ
                tx.add(ComputeBudgetProgram.setComputeUnitPrice({
                    microLamports: 10000
                }));

                const claimRewardsTxHash = await sendAndConfirmTransaction(
                    connection,
                    tx,
                    [user],
                    { skipPreflight: true }
                );

                returnData.push({
                    json: {
                        txHash: claimRewardsTxHash,
                    },
                });
            }
        }

    } catch (error) {
        returnData.push({
            json: {
                error: true,
                message: JSON.stringify(error),
            },
        });
    }
    return returnData;
}