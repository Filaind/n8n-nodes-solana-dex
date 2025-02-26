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
            }
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const credentials = await this.getCredentials('solanaApi');
        const connection = new Connection(credentials.rpcUrl as string, {
            commitment: "confirmed",
            wsEndpoint: credentials.wsEndpoint as string
        });

        const user = Keypair.fromSecretKey(bs58.decode(credentials.privateKey as string))


        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        for (let i = 0; i < items.length; i++) {
            const operation = this.getNodeParameter('operation', i) as string;
            const poolAddress = this.getNodeParameter('poolAddress', i) as string;
            const dlmmPool = await DLMM.create(connection, new PublicKey(poolAddress));


            if (operation === 'getUserPositions') {
                try {
                    const { userPositions } = await dlmmPool.getPositionsByUserAndLbPair(
                        user.publicKey
                    );

                    const activeBin = await dlmmPool.getActiveBin();
                    const activeBinPrice = Number(activeBin.pricePerToken)

                    for (let userPosition of userPositions) {
                        const position = userPosition

                        const startPrice = Number(position.positionData.positionBinData[0].pricePerToken)
                        const endPrice = Number(position.positionData.positionBinData[position.positionData.positionBinData.length - 1].pricePerToken)


                        const xAmount = Number(position.positionData.totalXAmount) / 10 ** 9
                        const yAmount = Number(position.positionData.totalYAmount) / 10 ** 6


                        const newItem: INodeExecutionData = {
                            json: {
                                startPrice,
                                endPrice,
                                xAmount,
                                yAmount,
                                activeBinPrice,
                            },
                        };

                        returnData.push(newItem);
                    }
                } catch (error) {
                    const newItem: INodeExecutionData = {
                        json: {
                            error: true,
                            message: JSON.stringify(error),
                        },
                    };
                    returnData.push(newItem);
                }
            }

            if (operation === 'closeAllPositions') {
                try {
                    const { userPositions } = await dlmmPool.getPositionsByUserAndLbPair(
                        user.publicKey
                    );


                    for (let userPosition of userPositions) {
                        const binIdsToRemove = userPosition.positionData.positionBinData.map(
                            (bin) => bin.binId
                        );
                        const removeLiquidityTx = await dlmmPool.removeLiquidity({
                            position: userPosition.publicKey,
                            user: user.publicKey,
                            binIds: binIdsToRemove,
                            bps: new BN(100 * 100), // 100% (range from 0 to 100)
                            shouldClaimAndClose: true, // should claim swap fee and close position together
                        });


                        for (let tx of Array.isArray(removeLiquidityTx)
                            ? removeLiquidityTx
                            : [removeLiquidityTx]) {

                            tx.add(ComputeBudgetProgram.setComputeUnitPrice({
                                microLamports: 1000000
                            }))

                            const removeBalanceLiquidityTxHash = await sendAndConfirmTransaction(
                                connection,
                                tx,
                                [user],
                                { skipPreflight: true }
                            );

                            const newItem: INodeExecutionData = {
                                json: {
                                    txHash: removeBalanceLiquidityTxHash,
                                },
                            };
                            returnData.push(newItem);
                        }
                    }
                } catch (error) {
                    const newItem: INodeExecutionData = {
                        json: {
                            error: true,
                            message: JSON.stringify(error),
                        },
                    };
                }
            }

            if (operation === 'openPosition') {
                try {
                    const userSolBalance = await connection.getBalance(user.publicKey)

                    const usdtUserBalance = await connection.getTokenAccountBalance(new PublicKey('4A4Ka9HX82j7ToaSFhDGqgGQhgSqtVJ5UChpU2N5sm8Q'))
                    const usdtForDeposit = Number(usdtUserBalance.value.amount) / 10 ** 6

                    const activeBin = await dlmmPool.getActiveBin();

                    const minBinId = activeBin.binId - 33;
                    const maxBinId = activeBin.binId + 33;

                    const totalXAmount = new BN(userSolBalance * 0.9);
                    const totalYAmount = new BN(usdtForDeposit);

                    const newBalancePosition = Keypair.generate();

                    // Create Position (Spot Balance deposit, Please refer ``example.ts` for more example)
                    const createPositionTx =
                        await dlmmPool.initializePositionAndAddLiquidityByStrategy({
                            positionPubKey: newBalancePosition.publicKey,
                            user: user.publicKey,
                            totalXAmount,
                            totalYAmount,
                            slippage: 0.03,
                            strategy: {
                                maxBinId,
                                minBinId,
                                strategyType: StrategyType.SpotImBalanced,
                            },
                        });

                    createPositionTx.add(ComputeBudgetProgram.setComputeUnitPrice({
                        microLamports: 1000000
                    }))

                    const createBalancePositionTxHash = await sendAndConfirmTransaction(
                        connection,
                        createPositionTx,
                        [user, newBalancePosition]
                    );

                    const newItem: INodeExecutionData = {
                        json: {
                            txHash: createBalancePositionTxHash,
                        },
                    };
                    returnData.push(newItem);
                } catch (error) {
                    const newItem: INodeExecutionData = {
                        json: {
                            error: true,
                            message: JSON.stringify(error),
                        },
                    };
                    returnData.push(newItem);
                }
            }


        }

        return [returnData];
    }
}