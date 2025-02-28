import { INodeTypeDescription, NodeConnectionType } from 'n8n-workflow';
import {
  getUserPositions,
  closePositions,
  openPosition,
  claimAllRewards,
} from './meteora-methods-descriptions';


export const meteoraNodeDescription: INodeTypeDescription = {
  displayName: 'Meteora DLLM',
  name: 'meteora',
  icon: 'file:logo.svg',
  group: ['blockchain'],
  version: 1,
  description: 'Meteora DLLM operations',
  defaults: {
    name: 'Meteora',
  },
  inputs: [NodeConnectionType.Main],
  credentials: [
    {
      name: 'solanaApi',
      required: true,
    }
  ],
  outputs: [NodeConnectionType.Main],
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
          name: "Close positions",
          value: "closePositions",
          description: "Close positions",
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
    ...closePositions,
    ...openPosition,
    ...claimAllRewards,
  ],
};