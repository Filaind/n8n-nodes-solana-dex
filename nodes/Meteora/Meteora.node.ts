import { IExecuteFunctions } from 'n8n-core';
import {
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
} from 'n8n-workflow';
import DLMM, { StrategyType } from "@meteora-ag/dlmm";
import bs58 from 'bs58';
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { meteoraNodeDescription } from './descriptions/meteora-node-decriptions';
import { getUserPositions, closeAllPositions, openPosition, claimAllRewards } from './meteora.functions';


export class Meteora implements INodeType {
    description: INodeTypeDescription = meteoraNodeDescription


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


            switch (operation) {
                case 'getUserPositions':
                    returnData.push(...await getUserPositions(dlmmPool, user.publicKey));
                    break;
                case 'closeAllPositions':
                    returnData.push(...await closeAllPositions(dlmmPool, connection, user));
                    break;
                case 'openPosition':
                    const poolStrategy = this.getNodeParameter('poolStrategy', i) as StrategyType;
                    const minBinIdOffset = this.getNodeParameter('minBinIdOffset', i) as number;
                    const maxBinIdOffset = this.getNodeParameter('maxBinIdOffset', i) as number;    
                    returnData.push(...await openPosition(dlmmPool, connection, user, poolStrategy, minBinIdOffset, maxBinIdOffset));
                    break;
                case 'claimAllRewards':
                    returnData.push(...await claimAllRewards(dlmmPool, connection, user));
                    break;
            }
        }

        return [returnData];
    }
}