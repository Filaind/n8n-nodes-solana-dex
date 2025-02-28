import { INodeTypeDescription } from 'n8n-workflow';
import {
    getBalance,
    transferSol,
} from './solana-methods-descriptions';


export const solanaNodeDescription: INodeTypeDescription = {
    displayName: 'Solana',
    name: 'solana',
    icon: 'file:logo.svg',
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
                {
                    name: 'Transfer SOL',
                    value: 'transferSol',
                    description: 'Transfer SOL to a wallet address',
                },
            ],
            default: 'getBalance',
            noDataExpression: true,
            required: true,
            description: 'Operation to perform',
        },
        ...getBalance,
        ...transferSol,
    ],
};