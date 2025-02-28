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
    type: 'string',
    default: StrategyType.SpotImBalanced,
    required: false,
    displayOptions: {
      show: {
        operation: ['openPosition'],
      },
    },
    options: [
      {
        name: 'SpotImBalanced',
        value: StrategyType.SpotImBalanced,
      },
      {
        name: 'CurveImBalanced',
        value: StrategyType.CurveImBalanced,
      },
      {
        name: 'BidAskImBalanced',
        value: StrategyType.BidAskImBalanced,
      },
      {
        name: 'SpotBalanced',
        value: StrategyType.SpotBalanced,
      },
      {
        name: 'CurveBalanced',
        value: StrategyType.CurveBalanced,
      },
      {
        name: 'BidAskBalanced',
        value: StrategyType.BidAskBalanced,
      },
    ],
    description: 'The Meteora pool strategy to get info for',
  }
];


