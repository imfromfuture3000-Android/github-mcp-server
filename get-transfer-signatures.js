#!/usr/bin/env node
const https = require('https');

const HELIUS_RPC = 'https://mainnet.helius-rpc.com/?api-key=4fe39d22-5043-40d3-b2a1-dd8968ecf8a6';

const ADDRESSES = {
  jupiterProgram: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
  programData: '4Ec7ZxZS6Sbdg5UGSLHbAnM7GQHp2eFd4KYWRexAipQT',
  currentAuthority: 'CvQZZ23qYDWF2RUpxYJ8y9K4skmuvYEEjH7fK58jtipQ',
  newController: 'GLzZk1sczzW6fM4uPFeQCtTZQaf8H5VaBt99tUMbJAAW',
  squadsProgram: 'SMPLecH534NA9acpos4G6x7uf3LWbCAwZQE9e8ZekMu',
  multisig: '7ZyDFzet6sKgZLN4D89JLfo7chu2n7nYdkFt5RCFk8Sf'
};

const MULTISIG_MEMBERS = [
  '2MgqMXdwSf3bRZ6S8uKJSffZAaoZBhD2mjst3phJXE7p',
  '89FnbsKH8n6FXCghGUijxh3snqx3e6VXJ7q1fQAHWkQQ',
  'BYidGfUnfoQtqi4nHiuo57Fjreizbej6hawJLnbwJmYr',
  'CHRDWWqUs6LyeeoD7pJb3iRfnvYeMfwMUtf2N7zWk7uh',
  'Dg5NLa5JuwfRMkuwZEguD9RpVrcQD3536GxogUv7pLNV',
  'EhJqf1p39c8NnH5iuZAJyw778LQua1AhZWxarT5SF8sT',
  'GGG2JyBtwbPAsYwUQED8GBbj9UMi7NQa3uwN3DmyGNtz'
];

function rpcCall(method, params) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });
    const url = new URL(HELIUS_RPC);
    
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function getSignatures(address, limit = 10) {
  const res = await rpcCall('getSignaturesForAddress', [address, { limit }]);
  return res.result || [];
}

async function getTransaction(signature) {
  const res = await rpcCall('getTransaction', [signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }]);
  return res.result;
}

async function checkAddress(address, name) {
  const res = await rpcCall('getAccountInfo', [address, { encoding: 'base64' }]);
  const exists = res.result?.value !== null && res.result?.value !== undefined;
  const balance = exists ? res.result.value.lamports / 1e9 : 0;
  return { name, address, exists, balance };
}

async function main() {
  console.log('🔍 Transfer Ownership Signature Check\n');
  console.log('Using Helius RPC:', HELIUS_RPC.split('?')[0]);
  console.log('━'.repeat(70));

  // Check all addresses
  console.log('\n📋 Address Status:');
  for (const [key, addr] of Object.entries(ADDRESSES)) {
    const info = await checkAddress(addr, key);
    console.log(`${info.exists ? '✅' : '❌'} ${info.name}: ${info.address.slice(0, 8)}... (${info.balance} SOL)`);
  }

  // Check multisig members
  console.log('\n👥 Multisig Members (4 of 7 required):');
  for (let i = 0; i < MULTISIG_MEMBERS.length; i++) {
    const info = await checkAddress(MULTISIG_MEMBERS[i], `Member ${i + 1}`);
    console.log(`${info.exists ? '✅' : '❌'} ${i + 1}. ${info.address} (${info.balance} SOL)`);
  }

  // Get signatures for key accounts
  console.log('\n📝 Recent Signatures:');
  
  const accounts = [
    ['Program Data', ADDRESSES.programData],
    ['Current Authority', ADDRESSES.currentAuthority],
    ['Multisig', ADDRESSES.multisig]
  ];

  for (const [name, addr] of accounts) {
    const sigs = await getSignatures(addr, 5);
    console.log(`\n${name} (${addr}):`);
    
    if (sigs.length === 0) {
      console.log('  No signatures found');
      continue;
    }

    for (const sig of sigs) {
      const tx = await getTransaction(sig.signature);
      const fee = tx?.meta?.fee ? (tx.meta.fee / 1e9).toFixed(6) : 'N/A';
      const status = sig.err ? '❌ ERROR' : '✅ SUCCESS';
      console.log(`  ${status} ${sig.signature.slice(0, 16)}... | Fee: ${fee} SOL`);
    }
  }

  console.log('\n━'.repeat(70));
  console.log('✅ Scan Complete');
}

main().catch(console.error);
