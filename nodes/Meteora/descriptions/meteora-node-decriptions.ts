import { INodeTypeDescription } from 'n8n-workflow';
import {
  getUserPositions,
  closeAllPositions,
  openPosition,
  claimAllRewards,
} from './meteora-methods-descriptions';


export const meteoraNodeDescription: INodeTypeDescription = {
  displayName: 'Meteora DLLM',
  name: 'meteora',
  group: ['blockchain'],
  version: 1,
  description: 'Meteora DLLM operations',
  defaults: {
    name: 'Meteora',
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
      displayName: "Operation",
      name: "operation",
      type: "options",
      options: [
        {
          name: "Get user positions",
          value: "getUserPositions",
          description: "Get user positions for a pool address",
        },
        {
          name: "Close all positions",
          value: "closeAllPositions",
          description: "Close all positions",
        },
        {
          name: "Open position",
          value: "openPosition",
          description: "Open a position",
        },
        {
          name: "Claim all rewards",
          value: "claimAllRewards",
          description: "Claim all rewards",
        }
      ],
      default: 'getUserPositions',
      noDataExpression: true,
      required: true,
      description: 'Operation to perform',
    },
    ...getUserPositions,
    ...closeAllPositions,
    ...openPosition,
    ...claimAllRewards,
  ],
};