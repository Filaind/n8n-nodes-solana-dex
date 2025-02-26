import { IExecuteFunctions } from 'n8n-core';
import {
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';

export class Solana implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Solana',
    name: 'solana',
    group: ['blockchain'],
    version: 1,
    description: 'Solana blockchain operations',
    defaults: {
      name: 'Solana',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        options: [
          {
            name: 'Get Balance',
            value: 'getBalance',
            description: 'Get SOL balance for a wallet address',
          },
        ],
        default: 'getBalance',
        noDataExpression: true,
        required: true,
        description: 'Operation to perform',
      },
      {
        displayName: 'Wallet Address',
        name: 'walletAddress',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            operation: ['getBalance'],
          },
        },
        description: 'The Solana wallet address to check balance for',
      },
      {
        displayName: 'Network',
        name: 'network',
        type: 'options',
        options: [
          {
            name: 'Mainnet',
            value: 'mainnet-beta',
          },
          {
            name: 'Testnet',
            value: 'testnet',
          },
          {
            name: 'Devnet',
            value: 'devnet',
          },
        ],
        default: 'devnet',
        description: 'The Solana network to connect to',
        displayOptions: {
          show: {
            operation: ['getBalance'],
          },
        },
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      const operation = this.getNodeParameter('operation', i) as string;
      
      if (operation === 'getBalance') {
        const walletAddress = this.getNodeParameter('walletAddress', i) as string;
        const network = this.getNodeParameter('network', i) as 'mainnet-beta' | 'testnet' | 'devnet';
        
        try {
          // Connect to the Solana network
          const connection = new Connection(clusterApiUrl(network));
          
          // Create a PublicKey object from the wallet address
          const publicKey = new PublicKey(walletAddress);
          
          // Get the balance in lamports
          const balanceInLamports = await connection.getBalance(publicKey);
          
          // Convert lamports to SOL
          const balanceInSOL = balanceInLamports / LAMPORTS_PER_SOL;
          
          const newItem: INodeExecutionData = {
            json: {
              walletAddress,
              network,
              balanceInLamports,
              balanceInSOL,
              formattedBalance: `${balanceInSOL} SOL`,
            },
          };
          
          returnData.push(newItem);
        } catch (error) {
          if (error instanceof Error) {
            const newItem: INodeExecutionData = {
              json: {
                error: true,
                message: error.message,
              },
            };
            returnData.push(newItem);
          } else {
            const newItem: INodeExecutionData = {
              json: {
                error: true,
                message: 'An unknown error occurred',
              },
            };
            returnData.push(newItem);
          }
        }
      }
    }

    return [returnData];
  }
}