import { IExecuteFunctions } from 'n8n-core';
import {
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction, Signer } from '@solana/web3.js';
import bs58 from 'bs58';

export async function getBalance(connection: Connection, wallet: string): Promise<{ wallet: string, balanceInLamports: number, balance: number }> {
  const publicKey = new PublicKey(wallet);
  const balanceInLamports = await connection.getBalance(publicKey);
  return {
    wallet: wallet,
    balanceInLamports: balanceInLamports,
    balance: balanceInLamports / LAMPORTS_PER_SOL,
  };
}

export async function transferSol(connection: Connection, user: Signer, toWallet: string, amount: number): Promise<string> {
  const transaction = new Transaction().add(
    SystemProgram.transfer({ fromPubkey: user.publicKey, toPubkey: new PublicKey(toWallet), lamports: amount })
  );
  const txHash = await sendAndConfirmTransaction(connection, transaction, [user]);
  return txHash;
}

export async function findTokenAccountForMint(connection: Connection, owner: PublicKey, mintAddress: string): Promise<PublicKey | null> {
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
          const toWallet = this.getNodeParameter('toWallet', i) as string;

          const txHash = await transferSol(connection, user, toWallet, amount);
          returnData.push({ json: { txHash } });
          break;
      }
    }

    return [returnData];
  }
}