import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class SolanaApi implements ICredentialType {
	name = 'solanaApi';
	displayName = 'Solana API';
	documentationUrl = 'https://docs.solana.com/';
	properties: INodeProperties[] = [
		{
			displayName: 'RPC URL',
			name: 'rpcUrl',
			type: 'string',
			default: 'https://mainnet.helius-rpc.com/?api-key=dd25525a-2156-4164-8670-2efafbb96d7c',
			placeholder: 'https://api.mainnet-beta.solana.com',
			description: 'The Solana RPC URL to use for API calls',
			required: true,
		},
		{
			displayName: 'WebSocket Endpoint',
			name: 'wsEndpoint',
			type: 'string',
			default: 'wss://mainnet.helius-rpc.com/?api-key=dd25525a-2156-4164-8670-2efafbb96d7c',
			placeholder: 'wss://api.mainnet-beta.solana.com',
			description: 'The Solana WebSocket endpoint (optional)',
			required: false,
		},
		{
			displayName: 'Private Key',
			name: 'privateKey',
			type: 'string',
			default: '',
			description: 'The private key of the user',
		},
	];
} 