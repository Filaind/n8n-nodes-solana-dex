import { INodeProperties } from "n8n-workflow";

export const getBalance: INodeProperties[] = [
    {
        displayName: 'Wallet Address',
        name: 'walletAddress',
        type: 'string',
        default: '',
        required: true,
        description: 'The Solana wallet address to get the balance for',
        displayOptions: {
            show: {
                operation: ['getBalance'],
            },
        },
    },
];

export const transferSol: INodeProperties[] = [
    {
        displayName: 'Wallet Address To',
        name: 'walletAddressTo',
        type: 'string',
        default: '',
        required: true,
        description: 'The Solana wallet address to transfer the SOL to',
        displayOptions: {
            show: {
                operation: ['transferSol'],
            },
        },
    },
    {
        displayName: 'Amount',
        name: 'amount',
        type: 'number',
        default: 0,
        required: true,
        description: 'The amount of LAMPORTS to transfer',
        displayOptions: {
            show: {
                operation: ['transferSol'],
            },
        },
    },
];


export const getTokenAccountBalance: INodeProperties[] = [
    {
        displayName: 'Mint Address',
        name: 'mintAddress',
        type: 'string',
        default: '',
        required: true,
        description: 'The Solana mint address to get the balance for',
        displayOptions: {
            show: {
                operation: ['getTokenAccountBalance'],
            },
        },
    },
    {
        displayName: 'Wallet Address',
        name: 'walletAddress',
        type: 'string',
        default: '',
        required: true,
        description: 'The Solana wallet address to get the balance for',
        displayOptions: {
            show: {
                operation: ['getTokenAccountBalance'],
            },
        },
    },
];