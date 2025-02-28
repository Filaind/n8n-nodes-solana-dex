import { INodeTypeDescription } from 'n8n-workflow';
import {
  getQuote,
  swapTokens,
  getTokenBalances,
  getRoutes,
} from './jupiter-methods-descriptions';

export const jupiterNodeDescription: INodeTypeDescription = {
  displayName: 'Jupiter',
  name: 'jupiter',
  icon: 'file:logo.svg',
  group: ['blockchain'],
  version: 1,
  description: 'Jupiter token swap operations',
  defaults: {
    name: 'Jupiter',
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
      displayName: 'Operation',
      name: 'operation',
      type: 'options',
      options: [
        {
          name: 'Get Quote',
          value: 'getQuote',
          description: 'Get a quote for swapping tokens',
        },
        {
          name: 'Swap Tokens',
          value: 'swapTokens',
          description: 'Swap tokens using Jupiter',
        },
        {
          name: 'Get Token Balances',
          value: 'getTokenBalances',
          description: 'Get token balances for a user',
        },
        {
          name: 'Get Routes',
          value: 'getRoutes',
          description: 'Get available routes for swapping tokens',
        },
      ],
      default: 'getQuote',
      noDataExpression: true,
      required: true,
      description: 'Operation to perform',
    },
    ...getQuote,
    ...swapTokens,
    ...getTokenBalances,
    ...getRoutes,
  ],
}; 