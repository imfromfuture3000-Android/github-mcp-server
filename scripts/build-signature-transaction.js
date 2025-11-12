#!/usr/bin/env node
const { Connection, PublicKey, Transaction, TransactionInstruction, Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');

const HELIUS_RPC = 'https://mainnet.helius-rpc.com/?api-key=4fe39d22-5043-40d3-b2a1-dd8968ecf8a6';
const CONTROLLER_PRIVATE = 'f2a29d46687020f38c36e1299da68ac03c01e660254b8bc9c8166b39945c1e76e3fe6d7ba360580cffa9601eafad20f01044eded4deea9f83dac3e9607d2e5f3';

// Our Programs
const OUR_PROGRAMS = {
  geneMint: 'GENEtH5amGSi8kHAtQoezp1XEXwZJ8vcuePYnXdKrMYz',
  dexProgram: 'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1',
  daoController: 'CvQZZ23qYDWF2RUpxYJ8y9K4skmuvYEEjH7fK58jtipQ'
};

const NEW_MASTER_CONTROLLER = 'GLzZk1sczzW6fM4uPFeQCtTZQaf8H5VaBt99tUMbJAAW';
const TREASURY = '4eJZVbbsiLAG6EkWvgEYEWKEpdhJPFBYMeJ6DBX98w6a';

async function buildSignatureTransaction() {
  const connection = new Connection(HELIUS_RPC, 'confirmed');
  const controller = Keypair.fromSecretKey(Buffer.from(CONTROLLER_PRIVATE, 'hex'));
  
  console.log('🔨 Building Signature Transaction\n');
  console.log('Signer:', controller.publicKey.toBase58());
  console.log('Master Controller:', NEW_MASTER_CONTROLLER);
  console.log('━'.repeat(60));

  const transactions = [];

  // Build transaction for each program
  for (const [name, programAddr] of Object.entries(OUR_PROGRAMS)) {
    try {
      const programInfo = await connection.getAccountInfo(new PublicKey(programAddr));
      
      if (!programInfo) {
        console.log(`\n❌ ${name}: Not found`);
        continue;
      }

      console.log(`\n✅ ${name}: ${programAddr}`);
      console.log(`   Owner: ${programInfo.owner.toBase58()}`);
      console.log(`   Data Size: ${programInfo.data.length} bytes`);

      // Create custom instruction to separate data
      const instruction = new TransactionInstruction({
        programId: new PublicKey(programAddr),
        keys: [
          { pubkey: controller.publicKey, isSigner: true, isWritable: true },
          { pubkey: new PublicKey(NEW_MASTER_CONTROLLER), isSigner: false, isWritable: true },
          { pubkey: new PublicKey(TREASURY), isSigner: false, isWritable: true }
        ],
        data: Buffer.from([0]) // Custom instruction data
      });

      const transaction = new Transaction().add(instruction);
      transaction.feePayer = controller.publicKey;
      
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      // Sign transaction
      transaction.sign(controller);
      
      // Get signature
      const signature = transaction.signature ? bs58.default.encode(transaction.signature) : 'unsigned';
      
      console.log(`   Signature: ${signature.slice(0, 32)}...`);
      console.log(`   Blockhash: ${blockhash.slice(0, 16)}...`);

      transactions.push({
        program: name,
        address: programAddr,
        signature,
        blockhash,
        signer: controller.publicKey.toBase58(),
        newAuthority: NEW_MASTER_CONTROLLER,
        treasury: TREASURY
      });

    } catch (error) {
      console.log(`\n❌ ${name}: ${error.message}`);
    }
  }

  console.log('\n' + '━'.repeat(60));
  console.log(`\n📊 Built ${transactions.length} transactions`);
  console.log('   All signed and ready for submission');

  const report = {
    timestamp: new Date().toISOString(),
    totalTransactions: transactions.length,
    signer: controller.publicKey.toBase58(),
    newMasterController: NEW_MASTER_CONTROLLER,
    treasury: TREASURY,
    transactions,
    status: 'READY_FOR_SUBMISSION'
  };

  console.log('\n📋 Transaction Report:');
  console.log(JSON.stringify(report, null, 2));

  return report;
}

buildSignatureTransaction().catch(console.error);
