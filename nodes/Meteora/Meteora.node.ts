import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
} from 'n8n-workflow';
import DLMM, { StrategyType } from "@meteora-ag/dlmm";
import bs58 from 'bs58';
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { meteoraNodeDescription } from './descriptions/meteora-node-decriptions';
import { IPositionData, getUserPositions, closePositions, openPosition, claimAllRewards } from './meteora.functions';


export class Meteora implements INodeType {
    description: INodeTypeDescription = meteoraNodeDescription

    async getDLMM(this: IExecuteFunctions, connection: Connection, poolAddress: string): Promise<DLMM> {
        let staticData = this.getWorkflowStaticData("global");
        let dlmmPools = staticData["meteora"] as {[key: string]: DLMM} || {}
        let dlmmPool = dlmmPools[poolAddress];
        if (dlmmPool) {
            return dlmmPool;
        }
        dlmmPool = await DLMM.create(connection, new PublicKey(poolAddress));
        dlmmPools[poolAddress] = dlmmPool;
        staticData["meteora"] = dlmmPools
        return dlmmPool;
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
            const poolAddress = (items[i].json['poolAddress'] || this.getNodeParameter('poolAddress', i)) as string; // TODO: do better
            const dlmmPool = await DLMM.create(connection, new PublicKey(poolAddress));

            this.helpers.returnJsonArray([])
            switch (operation) {
                case 'getUserPositions':
                    returnData.push(...await getUserPositions(dlmmPool, user.publicKey));
                    break;
                case 'closePositions':
                    returnData.push(...await closePositions(dlmmPool, connection, user, items[i]));
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