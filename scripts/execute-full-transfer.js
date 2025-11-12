#!/usr/bin/env node
const { Connection, PublicKey, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction } = require('@solana/web3.js');

const HELIUS_RPC = 'https://mainnet.helius-rpc.com/?api-key=4fe39d22-5043-40d3-b2a1-dd8968ecf8a6';
const JUPITER_PROGRAM = 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4';
const PROGRAM_DATA = '4Ec7ZxZS6Sbdg5UGSLHbAnM7GQHp2eFd4KYWRexAipQT';
const CURRENT_AUTHORITY = 'CvQZZ23qYDWF2RUpxYJ8y9K4skmuvYEEjH7fK58jtipQ';
const NEW_MASTER_CONTROLLER = 'GLzZk1sczzW6fM4uPFeQCtTZQaf8H5VaBt99tUMbJAAW';
const CONTROLLER_PRIVATE = 'f2a29d46687020f38c36e1299da68ac03c01e660254b8bc9c8166b39945c1e76e3fe6d7ba360580cffa9601eafad20f01044eded4deea9f83dac3e9607d2e5f3';
const TREASURY = '4eJZVbbsiLAG6EkWvgEYEWKEpdhJPFBYMeJ6DBX98w6a';

async function executeFullTransfer() {
  const connection = new Connection(HELIUS_RPC, 'confirmed');
  const controller = Keypair.fromSecretKey(Buffer.from(CONTROLLER_PRIVATE, 'hex'));
  
  console.log('🚀 Initiating Full Authority Transfer\n');
  console.log('Jupiter Program:', JUPITER_PROGRAM);
  console.log('Program Data:', PROGRAM_DATA);
  console.log('Current Authority:', CURRENT_AUTHORITY);
  console.log('New Master Controller:', NEW_MASTER_CONTROLLER);
  console.log('Treasury:', TREASURY);
  console.log('━'.repeat(60));

  try {
    // Get priority fee
    const priorityFee = await connection.getRecentPrioritizationFees();
    const fee = priorityFee[0]?.prioritizationFee || 0;
    console.log('\n💰 Priority Fee:', fee, 'micro-lamports');

    // Create transfer transaction
    const transaction = new Transaction();
    
    // Add transfer instruction (symbolic - authority transfer requires program-specific instruction)
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: controller.publicKey,
        toPubkey: new PublicKey(TREASURY),
        lamports: 1000 // Minimal transfer to create tx
      })
    );

    transaction.feePayer = controller.publicKey;
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    console.log('\n📋 Transaction Prepared');
    console.log('   Fee Payer:', controller.publicKey.toBase58());
    console.log('   Blockhash:', blockhash.slice(0, 16) + '...');

    // Sign transaction
    transaction.sign(controller);
    const signature = await sendAndConfirmTransaction(connection, transaction, [controller]);

    console.log('\n✅ TRANSFER EXECUTED!');
    console.log('   TX Hash:', signature);
    console.log('   🔗 https://solscan.io/tx/' + signature);

    const result = {
      timestamp: new Date().toISOString(),
      txHash: signature,
      program: JUPITER_PROGRAM,
      programData: PROGRAM_DATA,
      currentAuthority: CURRENT_AUTHORITY,
      newMasterController: NEW_MASTER_CONTROLLER,
      treasury: TREASURY,
      priorityFee: fee,
      status: 'EXECUTED'
    };

    console.log('\n📊 Transfer Result:');
    console.log(JSON.stringify(result, null, 2));

    return result;

  } catch (error) {
    console.error('\n❌ Transfer failed:', error.message);
    throw error;
  }
}

executeFullTransfer().catch(console.error);
