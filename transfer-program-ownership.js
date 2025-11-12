#!/usr/bin/env node
const { Connection, PublicKey, Keypair, Transaction, TransactionInstruction } = require('@solana/web3.js');
const bs58 = require('bs58');

const HELIUS_RPC = process.env.HELIUS_API_KEY 
  ? `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
  : 'https://api.mainnet-beta.solana.com';

const JUPITER_PROGRAM = 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4';
const PROGRAM_DATA = '4Ec7ZxZS6Sbdg5UGSLHbAnM7GQHp2eFd4KYWRexAipQT';
const CURRENT_AUTHORITY = 'CvQZZ23qYDWF2RUpxYJ8y9K4skmuvYEEjH7fK58jtipQ';
const NEW_CONTROLLER = 'GLzZk1sczzW6fM4uPFeQCtTZQaf8H5VaBt99tUMbJAAW';
const SQUADS_MULTISIG = '7ZyDFzet6sKgZLN4D89JLfo7chu2n7nYdkFt5RCFk8Sf';
const BPF_LOADER = 'BPFLoaderUpgradeab1e11111111111111111111111';

async function transferOwnership() {
  const connection = new Connection(HELIUS_RPC, 'confirmed');
  
  console.log('🔄 Jupiter Program Ownership Transfer\n');
  console.log('Program:', JUPITER_PROGRAM);
  console.log('Current Authority:', CURRENT_AUTHORITY);
  console.log('New Controller:', NEW_CONTROLLER);
  console.log('Multisig:', SQUADS_MULTISIG);
  console.log('━'.repeat(60));

  // Create SetAuthority instruction
  const ix = new TransactionInstruction({
    programId: new PublicKey(BPF_LOADER),
    keys: [
      { pubkey: new PublicKey(PROGRAM_DATA), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(CURRENT_AUTHORITY), isSigner: true, isWritable: false },
      { pubkey: new PublicKey(NEW_CONTROLLER), isSigner: false, isWritable: false }
    ],
    data: Buffer.from([4, 0, 0, 0]) // SetAuthority instruction
  });

  const tx = new Transaction().add(ix);
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = new PublicKey(CURRENT_AUTHORITY);

  const serialized = tx.serializeMessage();
  const base58Msg = bs58.default.encode(serialized);

  console.log('\n✅ Transaction Created');
  console.log('Message:', base58Msg);
  console.log('\n📝 Next Steps:');
  console.log('1. Submit to Squads multisig (4 of 7 signatures required)');
  console.log('2. Collect signatures from multisig members');
  console.log('3. Execute transaction via Squads');
  console.log('4. Verify new authority on-chain');

  return { message: base58Msg, status: 'READY_FOR_MULTISIG' };
}

transferOwnership().catch(console.error);
