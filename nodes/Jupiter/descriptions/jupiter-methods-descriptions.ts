import { INodeProperties } from 'n8n-workflow';

export const getQuote: INodeProperties[] = [
  {
    displayName: 'Input Mint',
    name: 'inputMint',
    type: 'string',
    default: 'So11111111111111111111111111111111111111112', // SOL
    required: true,
    description: 'The mint address of the token to swap from',
    displayOptions: {
      show: {
        operation: ['getQuote'],
      },
    },
  },
  {
    displayName: 'Output Mint',
    name: 'outputMint',
    type: 'string',
    default: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    required: true,
    description: 'The mint address of the token to swap to',
    displayOptions: {
      show: {
        operation: ['getQuote'],
      },
    },
  },
  {
    displayName: 'Amount',
    name: 'amount',
    type: 'string',
    default: '100000000', // 0.1 SOL
    required: true,
    description: 'The amount of input token to swap (in lamports/smallest unit)',
    displayOptions: {
      show: {
        operation: ['getQuote'],
      },
    },
  },
  {
    displayName: 'Slippage (Basis Points)',
    name: 'slippageBps',
    type: 'number',
    default: 50, // 0.5%
    required: true,
    description: 'The maximum slippage allowed for the swap in basis points (1% = 100)',
    displayOptions: {
      show: {
        operation: ['getQuote'],
      },
    },
  },
];

export const swapTokens: INodeProperties[] = [
  {
    displayName: 'Input Mint',
    name: 'inputMint',
    type: 'string',
    default: 'So11111111111111111111111111111111111111112', // SOL
    required: true,
    description: 'The mint address of the token to swap from',
    displayOptions: {
      show: {
        operation: ['swapTokens'],
      },
    },
  },
  {
    displayName: 'Output Mint',
    name: 'outputMint',
    type: 'string',
    default: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    required: true,
    description: 'The mint address of the token to swap to',
    displayOptions: {
      show: {
        operation: ['swapTokens'],
      },
    },
  },
  {
    displayName: 'Amount',
    name: 'amount',
    type: 'string',
    default: '100000000', // 0.1 SOL
    required: true,
    description: 'The amount of input token to swap (in lamports/smallest unit)',
    displayOptions: {
      show: {
        operation: ['swapTokens'],
      },
    },
  },
  {
    displayName: 'Slippage (Basis Points)',
    name: 'slippageBps',
    type: 'number',
    default: 50, // 0.5%
    required: true,
    description: 'The maximum slippage allowed for the swap in basis points (1% = 100)',
    displayOptions: {
      show: {
        operation: ['swapTokens'],
      },
    },
  },
];

export const getTokenBalances: INodeProperties[] = [
  {
    displayName: 'Token Mints',
    name: 'tokenMints',
    type: 'string',
    typeOptions: {
      multipleValues: true,
    },
    default: ['So11111111111111111111111111111111111111112', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'],
    required: true,
    description: 'The mint addresses of the tokens to get balances for',
    displayOptions: {
      show: {
        operation: ['getTokenBalances'],
      },
    },
  },
];

export const getRoutes: INodeProperties[] = [
  {
    displayName: 'Input Mint',
    name: 'inputMint',
    type: 'string',
    default: 'So11111111111111111111111111111111111111112', // SOL
    required: true,
    description: 'The mint address of the token to swap from',
    displayOptions: {
      show: {
        operation: ['getRoutes'],
      },
    },
  },
  {
    displayName: 'Output Mint',
    name: 'outputMint',
    type: 'string',
    default: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    required: true,
    description: 'The mint address of the token to swap to',
    displayOptions: {
      show: {
        operation: ['getRoutes'],
      },
    },
  },
]; 