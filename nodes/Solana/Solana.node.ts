import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { Connection, Keypair} from '@solana/web3.js';
import bs58 from 'bs58';
import { getBalance, transferSol, getTokenAccountBalance } from './solana.functions';
import { solanaNodeDescription } from './descriptions/solana-node-descriptions';


export class Solana implements INodeType {
  description: INodeTypeDescription = solanaNodeDescription;

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const credentials = await this.getCredentials('solanaApi');
    const connection = new Connection(credentials.rpcUrl as string, {
      commitment: "confirmed",
      wsEndpoint: credentials.wsEndpoint as string
    });

    const user = Keypair.fromSecretKey(bs58.decode(credentials.privateKey as string));

    for (let i = 0; i < items.length; i++) {
      const operation = this.getNodeParameter('operation', i) as string;

      switch (operation) {
        case 'getBalance':
          const balance = await getBalance(connection, user.publicKey.toBase58());
          returnData.push({ json: { balance } });
          break;
        case 'transferSol':
          const amount = this.getNodeParameter('amount', i) as number;
          const walletAddressTo = this.getNodeParameter('walletAddressTo', i) as string;

          const txHash = await transferSol(connection, user, walletAddressTo, amount);
          returnData.push({ json: { txHash } });
          break;
        case 'getTokenAccountBalance':
          const mintAddress = this.getNodeParameter('mintAddress', i) as string;
          const walletAddress = this.getNodeParameter('walletAddress', i) as string;
          const tokenAccountBalance = await getTokenAccountBalance(connection, mintAddress, walletAddress);
          returnData.push({ json: { tokenAccountBalance } });
          break;
      }
    }

    return [returnData];
  }
}