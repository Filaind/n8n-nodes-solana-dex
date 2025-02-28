import { Connection, sendAndConfirmTransaction, Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey, Signer, ComputeBudgetProgram } from "@solana/web3.js";


export async function getBalance(connection: Connection, wallet: string): Promise<{ wallet: string, balanceInLamports: number, balance: number }> {
    const publicKey = new PublicKey(wallet);
    const balanceInLamports = await connection.getBalance(publicKey);
    return {
        wallet: wallet,
        balanceInLamports: balanceInLamports,
        balance: balanceInLamports / LAMPORTS_PER_SOL,
    };
}

export async function transferSol(connection: Connection, user: Signer, walletAddressTo: string, amount: number): Promise<string> {
    const transaction = new Transaction().add(
        ComputeBudgetProgram.setComputeUnitLimit({
            units: 200000
        }),
        SystemProgram.transfer({ fromPubkey: user.publicKey, toPubkey: new PublicKey(walletAddressTo), lamports: amount }),
    );
    const txHash = await sendAndConfirmTransaction(connection, transaction, [user]);
    return txHash;
}

export async function findTokenAccountForMint(connection: Connection, owner: PublicKey, mintAddress: string): Promise<PublicKey | null> {
    try {
        const tokenAccounts = await connection.getTokenAccountsByOwner(
            owner,
            { mint: new PublicKey(mintAddress) }
        );

        if (tokenAccounts.value.length > 0) {
            return tokenAccounts.value[0].pubkey;
        }
        return null;
    } catch (error) {
        console.error("Error finding token account:", error);
        return null;
    }
}


export async function getTokenAccountBalance(connection: Connection, mintAddress: string, walletAddress: string): Promise<number> {
    const tokenAccount = await findTokenAccountForMint(connection, new PublicKey(walletAddress), mintAddress);
    if (!tokenAccount) {
        return 0;
    }
    const tokenAccountBalance = await connection.getTokenAccountBalance(tokenAccount);
    return Number(tokenAccountBalance.value.amount);
}