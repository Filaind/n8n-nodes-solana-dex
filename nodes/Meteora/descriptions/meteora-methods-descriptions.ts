import { INodeProperties } from 'n8n-workflow';
import { StrategyType } from "@meteora-ag/dlmm";

export const getUserPositions: INodeProperties[] = [
  {
    displayName: 'Pool Address',
    name: 'poolAddress',
    type: 'string',
    default: '',
    required: true,
    description: 'The Meteora pool address to get user positions for',
    displayOptions: {
      show: {
        operation: ['getUserPositions'],
      },
    },
  },
];

export const closeAllPositions: INodeProperties[] = [
  {
    displayName: 'Pool Address',
    name: 'poolAddress',
    type: 'string',
    default: '',
    required: true,
    description: 'The Meteora pool address to close all positions for',
    displayOptions: {
      show: {
        operation: ['closeAllPositions'],
      },
    },
  },
];

export const openPosition: INodeProperties[] = [
  {
    displayName: 'Pool Address',
    name: 'poolAddress',
    type: 'string',
    default: '',
    required: true,
    description: 'The Meteora pool address to open a position for',
    displayOptions: {
      show: {
        operation: ['openPosition'],
      },
    },
  },
  {
    displayName: 'Pool strategy',
    name: 'poolStrategy',
    type: 'options',
    default: StrategyType.SpotImBalanced,
    required: true,
    noDataExpression: true,
    displayOptions: {
      show: {
        operation: ['openPosition'],
      },
    },
    options: [
      {
        name: 'SpotImBalanced',
        value: StrategyType.SpotImBalanced,
        description: 'Spot imbalanced',
      },
      {
        name: 'CurveImBalanced',
        value: StrategyType.CurveImBalanced,
        description: 'Curve imbalanced',
      },
      {
        name: 'BidAskImBalanced',
        value: StrategyType.BidAskImBalanced,
        description: 'Bid-ask imbalanced',
      },
      {
        name: 'SpotBalanced',
        value: StrategyType.SpotBalanced,
        description: 'Auto-balanced spot',
      },
      {
        name: 'CurveBalanced',
        value: StrategyType.CurveBalanced,
        description: 'Auto-balanced curve',
      },
      {
        name: 'BidAskBalanced',
        value: StrategyType.BidAskBalanced,
        description: 'Auto-balanced bid-ask',
      },
    ],
    description: 'The Meteora pool strategy to get info for',
  }
];


export const claimAllRewards: INodeProperties[] = [
  {
    displayName: 'Pool Address',
    name: 'poolAddress',
    type: 'string',
    default: '',
    required: true,
    description: 'The Meteora pool address to claim all rewards for',
    displayOptions: {
      show: {
        operation: ['claimAllRewards'],
      },
    },
  },
];