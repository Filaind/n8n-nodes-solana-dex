import { Connection, PublicKey, Keypair, VersionedTransaction } from '@solana/web3.js';
import { INodeExecutionData } from 'n8n-workflow';
import fetch from 'cross-fetch';
import BN from 'bn.js';
import { findTokenAccountForMint } from '../Solana/solana.functions';

interface IJupiterQuote {
  inputMint: string,
  inAmount: string,
  outputMint: string,
  outAmount: string,
  otherAmountThreshold: string,
  swapMode: string,
  slippageBps: number,
  platformFee: unknown | null,
  priceImpactPct: string,
  routePlan: object[],
  scoreReport: unknown | null,
  contextSlot: number,
  timeTaken: number,
  swapUsdValue: string,
  simplerRouteUsed: string,
  mostReliableAmmsQuoteReport: object[]
}

async function jupiterGetQuote(
  timeout: number,
  inputMint: string = "So11111111111111111111111111111111111111112",
  outputMint: string = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  amount: string = "1000000",
  slippageBps: number = 50): Promise<IJupiterQuote | null> {
  try {
    let resp = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`, { signal: AbortSignal.timeout(timeout) });
    return (await resp.json()) as IJupiterQuote;
  } catch (e) {
    return null;
  }
}

async function jupiterGetBestQuote(
  count: number = 10,
  timeout: number = 1000,
  inputMint: string = "So11111111111111111111111111111111111111112",
  outputMint: string = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  amount: string = "1000000",
  slippageBps: number = 50): Promise<IJupiterQuote | null> {
  
  let tasks = [];
  for (let i = 0; i < count; i++) {
    tasks.push(jupiterGetQuote(timeout, inputMint, outputMint, amount, slippageBps));
  }
  let quotes = await Promise.all(tasks)

  let bestQuote = quotes[0];
  let bestAmount = bestQuote && new BN(bestQuote.outAmount);
  
  for (let i = 1; i < count; i++) {
    if (quotes[i] != null) {
      let outAmount = new BN(quotes[i]!.outAmount);
      console.log(outAmount.toString());

      console.log(outAmount.toString());
      if (!bestQuote
        || outAmount > bestAmount!
        || (outAmount == bestAmount && bestQuote.routePlan.length > quotes[i]!.routePlan.length)) {

        bestQuote = quotes[i];
        bestAmount = outAmount;
      }
    }
  }

  return bestQuote;
}

/**
 * Get a quote for swapping tokens using Jupiter API
 */
export async function getQuote(
  count: number,
  timeout: number,
  inputMint: string,
  outputMint: string,
  amount: string,
  slippageBps: number = 50
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];

  const quoteResponse = await jupiterGetBestQuote(count, timeout, inputMint, outputMint, amount, slippageBps);

  returnData.push({
    json: quoteResponse as {[key: string]: any},
  });
  return returnData;
}

/**
 * Swap tokens using Jupiter API
 */
export async function swapTokens(
  count: number,
  timeout: number,
  connection: Connection,
  user: Keypair,
  inputMint: string,
  outputMint: string,
  amount: string,
  slippageBps: number = 50
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];

  let txid = null;

  for (let attempts = 3; attempts >= 0; attempts--) {
    try {
      // Get quote
      const quoteResponse = await jupiterGetBestQuote(count, timeout, inputMint, outputMint, amount, slippageBps);
      if (!quoteResponse) {
        continue;
      }

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
      txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: false,
        maxRetries: 2
      });

      await connection.confirmTransaction(txid);
      
      attempts = 0;
    } catch (e) {
      if (attempts == 0) {
        throw e;
      }
    }
  }

  returnData.push({
    json: {
      txHash: txid,
      inputMint,
      outputMint,
      amount,
    },
  });
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
  return returnData;
} 