import { Connection, PublicKey, Keypair, VersionedTransaction } from '@solana/web3.js';
import { INodeExecutionData } from 'n8n-workflow';
import fetch from 'cross-fetch';
import BN from 'bn.js';
import { findTokenAccountForMint } from '../Solana/solana.functions';

/**
 * Get a quote for swapping tokens using Jupiter API
 */
export async function getQuote(
  inputMint: string,
  outputMint: string,
  amount: string,
  slippageBps: number = 50
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];
  try {
    const quoteResponse = await (
      await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`)
    ).json();

    returnData.push({
      json: quoteResponse,
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

/**
 * Swap tokens using Jupiter API
 */
export async function swapTokens(
  connection: Connection,
  user: Keypair,
  inputMint: string,
  outputMint: string,
  amount: string,
  slippageBps: number = 50
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];
  try {
    // Get quote
    const quoteResponse = await (
      await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`)
    ).json();

    // Get serialized transactions for the swap
    const { swapTransaction } = await (
      await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey: user.publicKey.toString(),
          wrapAndUnwrapSol: true,
        })
      })
    ).json();

    // Deserialize the transaction
    const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

    // Sign the transaction
    transaction.sign([user]);

    // Execute the transaction
    const rawTransaction = transaction.serialize();
    const txid = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: true,
      maxRetries: 2
    });
    
    await connection.confirmTransaction(txid);

    returnData.push({
      json: {
        txHash: txid,
        inputMint,
        outputMint,
        amount,
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

/**
 * Get token balances for a user
 */
export async function getTokenBalances(
  connection: Connection,
  user: PublicKey,
  tokenMints: string[]
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];
  try {
    const balances = [];
    
    for (const mint of tokenMints) {
      const tokenAccount = await findTokenAccountForMint(connection, user, mint);
      
      if (tokenAccount) {
        const balance = await connection.getTokenAccountBalance(tokenAccount);
        balances.push({
          mint,
          balance: balance.value.amount,
          decimals: balance.value.decimals,
          uiAmount: balance.value.uiAmount,
        });
      } else {
        balances.push({
          mint,
          balance: '0',
          decimals: 0,
          uiAmount: 0,
        });
      }
    }
    
    returnData.push({
      json: {
        balances,
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

/**
 * Get available routes for swapping tokens
 */
export async function getRoutes(
  inputMint: string,
  outputMint: string
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];
  try {
    // Get indexed route map
    const indexedRouteMap = await (await fetch('https://quote-api.jup.ag/v6/indexed-route-map')).json();
    const getMint = (index: number) => indexedRouteMap.mintKeys[index];
    
    // Generate route map by replacing indexes with mint addresses
    const generatedRouteMap: Record<string, string[]> = {};
    Object.keys(indexedRouteMap.indexedRouteMap).forEach((key) => {
      generatedRouteMap[getMint(parseInt(key))] = indexedRouteMap.indexedRouteMap[key].map((index: number) => getMint(index));
    });
    
    // Check if the input mint exists in the route map
    if (generatedRouteMap[inputMint]) {
      // Check if the output mint is a possible swap destination
      const canSwap = generatedRouteMap[inputMint].includes(outputMint);
      
      returnData.push({
        json: {
          canSwap,
          possibleOutputs: generatedRouteMap[inputMint],
          inputMint,
          outputMint,
        },
      });
    } else {
      returnData.push({
        json: {
          canSwap: false,
          error: 'Input mint not found in route map',
          inputMint,
          outputMint,
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