## Installation and Deployment

This package provides custom nodes for n8n that allow integration with Solana blockchain and decentralized exchanges (DEX) like Jupiter and Meteora. It enables operations such as token swaps, getting quotes, checking token balances, and more on the Solana blockchain.

### Local Build

1. Install dependencies:
   ```
   npm i
   ```

2. Build the project:
   ```
   npm run build
   ```

### Installation on n8n Server

1. Copy the contents of the `dist` folder and the `package.json` file to the `custom-nodes` folder of your n8n server.

2. Connect to the server via SSH.

3. Navigate to the `custom-nodes` folder:
   ```
   cd path/to/custom-nodes
   ```

4. Install dependencies:
   ```
   npm i
   ```

5. Restart the n8n container:
   ```
   docker restart n8n_container_name
   ```
