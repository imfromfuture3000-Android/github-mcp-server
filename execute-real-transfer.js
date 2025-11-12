#!/usr/bin/env node
const { Connection, PublicKey, Keypair, Transaction, TransactionInstruction, sendAndConfirmTransaction } = require('@solana/web3.js');
const bs58 = require('bs58');

const HELIUS_RPC = 'https://mainnet.helius-rpc.com/?api-key=4fe39d22-5043-40d3-b2a1-dd8968ecf8a6';
const PROGRAM_DATA = '4Ec7ZxZS6Sbdg5UGSLHbAnM7GQHp2eFd4KYWRexAipQT';
const CURRENT_AUTHORITY = 'CvQZZ23qYDWF2RUpxYJ8y9K4skmuvYEEjH7fK58jtipQ';
const NEW_CONTROLLER = 'GLzZk1sczzW6fM4uPFeQCtTZQaf8H5VaBt99tUMbJAAW';
const NEW_CONTROLLER_KEY = 'f2a29d46687020f38c36e1299da68ac03c01e660254b8bc9c8166b39945c1e76e3fe6d7ba360580cffa9601eafad20f01044eded4deea9f83dac3e9607d2e5f3';
const BPF_LOADER = 'BPFLoaderUpgradeab1e11111111111111111111111';

async function execute() {
  const connection = new Connection(HELIUS_RPC, 'confirmed');
  const newController = Keypair.fromSecretKey(Buffer.from(NEW_CONTROLLER_KEY, 'hex'));
  
  console.log('🚀 Executing Real Transfer Transaction\n');
  console.log('Program Data:', PROGRAM_DATA);
  console.log('Current Authority:', CURRENT_AUTHORITY);
  console.log('New Controller:', newController.publicKey.toBase58());
  console.log('━'.repeat(60));

  // Check if new controller exists
  const balance = await connection.getBalance(newController.publicKey);
  console.log(`\nNew Controller Balance: ${balance / 1e9} SOL`);
  
  if (balance === 0) {
    console.log('⚠️  Account needs funding. Creating account...');
    // Account will be created automatically when receiving SOL
  }

  // Create SetAuthority instruction
  const ix = new TransactionInstruction({
    programId: new PublicKey(BPF_LOADER),
    keys: [
      { pubkey: new PublicKey(PROGRAM_DATA), isSigner: false, isWritable: true },
      { pubkey: new PublicKey(CURRENT_AUTHORITY), isSigner: true, isWritable: false },
      { pubkey: newController.publicKey, isSigner: false, isWritable: false }
    ],
    data: Buffer.from([4, 0, 0, 0])
  });

  const tx = new Transaction().add(ix);
  tx.feePayer = newController.publicKey;

  console.log('\n📝 Transaction created');
  console.log('Instruction: SetAuthority (BPF Upgradeable Loader)');
  console.log('Fee Payer:', newController.publicKey.toBase58());
  
  console.log('\n⚠️  CRITICAL: This requires CURRENT_AUTHORITY to sign!');
  console.log('Current implementation only has NEW_CONTROLLER key.');
  console.log('\n✅ Use Squads multisig to execute this transaction.');
  
  const message = tx.serializeMessage();
  console.log('\nSerialized Message (Base58):', bs58.default.encode(message));
  
  return {
    status: 'READY_FOR_MULTISIG',
    message: bs58.default.encode(message),
    requiresMultisig: true
  };
}

execute().then(r => console.log('\n✅', r)).catch(console.error);
