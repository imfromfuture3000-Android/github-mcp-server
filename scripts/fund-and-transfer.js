#!/usr/bin/env node
const { Connection, PublicKey, Transaction, SystemProgram, Keypair, sendAndConfirmTransaction } = require('@solana/web3.js');

const HELIUS_RPC = 'https://mainnet.helius-rpc.com/?api-key=4fe39d22-5043-40d3-b2a1-dd8968ecf8a6';
const SOURCE = 'CvQZZ23qYDWF2RUpxYJ8y9K4skmuvYEEjH7fK58jtipQ'; // Has 0.332269 SOL
const NEW_MASTER_CONTROLLER = 'GLzZk1sczzW6fM4uPFeQCtTZQaf8H5VaBt99tUMbJAAW';
const TREASURY = '4eJZVbbsiLAG6EkWvgEYEWKEpdhJPFBYMeJ6DBX98w6a';

async function fundAndTransfer() {
  const connection = new Connection(HELIUS_RPC, 'confirmed');
  
  console.log('💸 Fund Master Controller & Execute Transfer\n');
  console.log('Source:', SOURCE);
  console.log('Master Controller:', NEW_MASTER_CONTROLLER);
  console.log('Treasury:', TREASURY);
  console.log('━'.repeat(60));

  try {
    const sourceBalance = await connection.getBalance(new PublicKey(SOURCE));
    console.log('\n💰 Source Balance:', (sourceBalance / 1e9).toFixed(6), 'SOL');

    if (sourceBalance === 0) {
      console.log('❌ Source has no funds');
      return;
    }

    console.log('\n⚠️  Note: Source wallet signature required');
    console.log('   Use Phantom/Solflare to send 0.01 SOL from:');
    console.log('   ', SOURCE);
    console.log('   To:', NEW_MASTER_CONTROLLER);
    console.log('\n   Then run this script again to execute transfer');

    const report = {
      timestamp: new Date().toISOString(),
      source: SOURCE,
      sourceBalance: sourceBalance / 1e9,
      destination: NEW_MASTER_CONTROLLER,
      treasury: TREASURY,
      status: 'AWAITING_FUNDING',
      action: 'Send 0.01 SOL to master controller to enable transfers'
    };

    console.log('\n📋 Status Report:');
    console.log(JSON.stringify(report, null, 2));

    return report;

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

fundAndTransfer().catch(console.error);
