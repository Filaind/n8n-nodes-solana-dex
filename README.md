# n8n-nodes-solana

This is an n8n community node for interacting with the Solana blockchain. It provides functionality to perform operations on the Solana network, such as checking account balances, sending transactions, and more.

## Installation

Follow these instructions to install this node package in your n8n instance:

### Community Nodes (Recommended)

For users on n8n v0.187+:

1. Go to **Settings > Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-solana` in **Enter npm package name**
4. Agree to the risks of using community nodes
5. Select **Install**

### Manual Installation

If you need to install this node manually:

```bash
cd YOUR_N8N_FOLDER
npm install n8n-nodes-solana
```

**Note:** n8n automatically detects and registers installed community nodes when it's restarted.

## Usage

After installation, you'll find the Solana node in the node panel under "Blockchain" category. 

### Credentials

To use the Solana node, you need to set up Solana API credentials:

1. **RPC Endpoint**: The Solana RPC endpoint to connect to (e.g., https://api.mainnet-beta.solana.com)
2. **Private Key** (optional): Your Solana wallet private key for operations that require signing

### Operations

Currently, the node supports the following operations:

#### Account
- **Get Balance**: Retrieve the balance of a Solana wallet address

## Resources

- [Solana Documentation](https://docs.solana.com/)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE.md) 