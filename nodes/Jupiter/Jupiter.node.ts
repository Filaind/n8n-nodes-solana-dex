import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { Connection, Keypair } from "@solana/web3.js";
import bs58 from 'bs58';
import { jupiterNodeDescription } from './descriptions/jupiter-node-descriptions';
import { getQuote, swapTokens, getTokenBalances, getRoutes } from './jupiter.functions';

export class Jupiter implements INodeType {
  description: INodeTypeDescription = jupiterNodeDescription;

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

      switch (operation) {
        case 'getQuote':
          const inputMintQuote = this.getNodeParameter('inputMint', i) as string;
          const outputMintQuote = this.getNodeParameter('outputMint', i) as string;
          const amountQuote = this.getNodeParameter('amount', i) as string;
          const slippageBpsQuote = this.getNodeParameter('slippageBps', i) as number;
          
          returnData.push(...await getQuote(
            inputMintQuote,
            outputMintQuote,
            amountQuote,
            slippageBpsQuote
          ));
          break;

        case 'swapTokens':
          const inputMintSwap = this.getNodeParameter('inputMint', i) as string;
          const outputMintSwap = this.getNodeParameter('outputMint', i) as string;
          const amountSwap = this.getNodeParameter('amount', i) as string;
          const slippageBpsSwap = this.getNodeParameter('slippageBps', i) as number;
          
          returnData.push(...await swapTokens(
            connection,
            user,
            inputMintSwap,
            outputMintSwap,
            amountSwap,
            slippageBpsSwap
          ));
          break;

        case 'getTokenBalances':
          const tokenMints = this.getNodeParameter('tokenMints', i) as string[];
          
          returnData.push(...await getTokenBalances(
            connection,
            user.publicKey,
            tokenMints
          ));
          break;

        case 'getRoutes':
          const inputMintRoutes = this.getNodeParameter('inputMint', i) as string;
          const outputMintRoutes = this.getNodeParameter('outputMint', i) as string;
          
          returnData.push(...await getRoutes(
            inputMintRoutes,
            outputMintRoutes
          ));
          break;
      }
    }

    return [returnData];
  }
} 