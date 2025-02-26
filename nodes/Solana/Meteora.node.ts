import { IExecuteFunctions } from 'n8n-core';
import {
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
} from 'n8n-workflow';
import DLMM, { StrategyType } from "@meteora-ag/dlmm";
import BN from 'bn.js';
import bs58 from 'bs58';
import { ComputeBudgetProgram, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";

const USDC_MINT_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

async function findTokenAccountForMint(connection: Connection, owner: PublicKey, mintAddress: string): Promise<PublicKey | null> {
    try {
        const tokenAccounts = await connection.getTokenAccountsByOwner(
            owner,
            { mint: new PublicKey(mintAddress) }
        );

        if (tokenAccounts.value.length > 0) {
            return tokenAccounts.value[0].pubkey;
        }
        return null;
    } catch (error) {
        console.error("Error finding token account:", error);
        return null;
    }
}

export class Meteora implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Meteora DLLM',
        name: 'meteora',
        group: ['blockchain'],
        version: 1,
        description: 'Meteora DLLM operations',
        defaults: {
            name: 'Meteora',
        },
        inputs: ['main'],
        credentials: [
            {
                name: 'solanaApi',
                required: true,
            }
        ],
        outputs: ['main'],
        properties: [
            {
                displayName: "Operation",
                name: "operation",
                type: "options",
                options: [
                    {
                        name: "Get user positions",
                        value: "getUserPositions",
                        description: "Get user positions for a pool address",
                    },
                    {
                        name: "Close all positions",
                        value: "closeAllPositions",
                        description: "Close all positions",
                    },
                    {
                        name: "Open position",
                        value: "openPosition",
                        description: "Open a position",
                    }
                ],
                default: 'getUserPositions',
                noDataExpression: true,
                required: true,
                description: 'Operation to perform',
            },
            {
                displayName: 'Pool Address',
                name: 'poolAddress',
                type: 'string',
                default: '',
                required: true,
                description: 'The Meteora pool address to get info for',
            },

            {
                displayName: 'Pool strategy',
                name: 'poolStrategy',
                type: 'string',
                default: 'SpotImBalanced',
                required: false,
                displayOptions: {
                    show: {
                        operation: ['openPosition'],
                    },
                },
                options: [
                    {
                        name: 'CurveImBalanced',
                        value: 'CurveImBalanced',
                    },
                    {
                        name: 'SpotImBalanced',
                        value: 'SpotImBalanced',
                    },
                    {
                        name: 'BidAskImBalanced',
                        value: 'BidAskImBalanced',
                    },
                ],
                description: 'The Meteora pool strategy to get info for',
            }
        ],
    };

    private async getUserPositions(dlmmPool: DLMM, user: PublicKey): Promise<INodeExecutionData[]> {
        const returnData: INodeExecutionData[] = [];
        try {
            const { userPositions } = await dlmmPool.getPositionsByUserAndLbPair(user);
            const activeBin = await dlmmPool.getActiveBin();
            const activeBinPrice = Number(activeBin.pricePerToken);

            for (let userPosition of userPositions) {
                const position = userPosition;
                const startPrice = Number(position.positionData.positionBinData[0].pricePerToken);
                const endPrice = Number(position.positionData.positionBinData[position.positionData.positionBinData.length - 1].pricePerToken);
                const xAmount = Number(position.positionData.totalXAmount) / 10 ** 9;
                const yAmount = Number(position.positionData.totalYAmount) / 10 ** 6;

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

    private async closeAllPositions(dlmmPool: DLMM, connection: Connection, user: Keypair): Promise<INodeExecutionData[]> {
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
                    binIds: binIdsToRemove,
                    bps: new BN(100 * 100),
                    shouldClaimAndClose: true,
                });

                for (let tx of Array.isArray(removeLiquidityTx) ? removeLiquidityTx : [removeLiquidityTx]) {
                    tx.add(ComputeBudgetProgram.setComputeUnitPrice({
                        microLamports: 1000000
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

    private async openPosition(dlmmPool: DLMM, connection: Connection, user: Keypair, poolStrategy: StrategyType): Promise<INodeExecutionData[]> {
        const returnData: INodeExecutionData[] = [];
        try {
            const userSolBalance = await connection.getBalance(user.publicKey);
            const usdcTokenAccount = await findTokenAccountForMint(connection, user.publicKey, USDC_MINT_ADDRESS);

            if (!usdcTokenAccount) {
                throw new Error("USDC token account not found for this user");
            }

            const usdcUserBalance = await connection.getTokenAccountBalance(usdcTokenAccount);
            const usdcForDeposit = Number(usdcUserBalance.value.amount) / 10 ** 6;

            const activeBin = await dlmmPool.getActiveBin();
            const minBinId = activeBin.binId - 33; //ВЫЧИСЛИТЬ ОФФСЕТ НА ОСНОВЕ КОЛИЧЕСТВА ТОКЕНОВ В АККАУНТЕ ЮЗЕРА
            const maxBinId = activeBin.binId + 33; //ВЫЧИСЛИТЬ ОФФСЕТ НА ОСНОВЕ КОЛИЧЕСТВА ТОКЕНОВ В АККАУНТЕ ЮЗЕРА

            const totalXAmount = new BN(userSolBalance * 0.9);
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

            createPositionTx.add(ComputeBudgetProgram.setComputeUnitPrice({
                microLamports: 1000000
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

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const credentials = await this.getCredentials('solanaApi');
        const connection = new Connection(credentials.rpcUrl as string, {
            commitment: "confirmed",
            wsEndpoint: credentials.wsEndpoint as string
        });

        const user = Keypair.fromSecretKey(bs58.decode(credentials.privateKey as string));
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        for (let i = 0; i < items.length; i++) {
            const operation = this.getNodeParameter('operation', i) as string;
            const poolAddress = this.getNodeParameter('poolAddress', i) as string;
            const dlmmPool = await DLMM.create(connection, new PublicKey(poolAddress));

            const meteora = new Meteora();
            switch (operation) {
                case 'getUserPositions':
                    returnData.push(...await meteora.getUserPositions(dlmmPool, user.publicKey));
                    break;
                case 'closeAllPositions':
                    returnData.push(...await meteora.closeAllPositions(dlmmPool, connection, user));
                    break;
                case 'openPosition':
                    const poolStrategy = this.getNodeParameter('poolStrategy', i) as StrategyType;
                    returnData.push(...await meteora.openPosition(dlmmPool, connection, user, poolStrategy));
                    break;
            }
        }

        return [returnData];
    }
}