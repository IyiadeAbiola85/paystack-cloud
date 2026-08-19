// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// --- DEBUG: log the key (first 10 chars) ---
const secretKey = process.env.PAYSTACK_SECRET_KEY;
console.log('🔍 DEBUG: PAYSTACK_SECRET_KEY =', secretKey ? secretKey.slice(0, 10) + '... (length ' + secretKey.length + ')' : '❌ NOT FOUND');

// ... rest of your code (same as the previous updated server.js)

const app = express();
const port = process.env.PORT || 3000;

// ------------------ Paystack Initialisation ------------------
let paystackClient = null;
let useMock = false;

const secretKey = process.env.PAYSTACK_SECRET_KEY;
if (secretKey) {
  console.log(`🔑 PAYSTACK_SECRET_KEY found (starts with: ${secretKey.slice(0, 10)}...)`);
  try {
    // Dynamic require to avoid issues if package is missing
    const paystackModule = require('paystack');
    paystackClient = paystackModule(secretKey);
    // Quick check to see if it's functional
    if (paystackClient.verification && paystackClient.transfer) {
      console.log('✅ Paystack client initialised successfully.');
      useMock = false;
    } else {
      console.warn('⚠️ Paystack client initialised but missing methods – switching to mock mode.');
      useMock = true;
    }
  } catch (err) {
    console.error('❌ Failed to initialise Paystack:', err.message);
    useMock = true;
  }
} else {
  console.warn('⚠️ No PAYSTACK_SECRET_KEY found in environment. Running in MOCK mode.');
  useMock = true;
}

console.log(`⚙️  Mock mode: ${useMock ? 'ON' : 'OFF'}`);

// ------------------ CORS & Middleware ------------------
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ------------------ MOCK DATA ------------------
let accounts = {
  inv: { name: 'Investment Account', balance: 900000000000, acct: '0023847100' },
  cur: { name: 'Current Account', balance: 780000000000, acct: '0058391204' },
  sav: { name: 'Savings Account', balance: 680000000000, acct: '0091205637' }
};

let transactions = [
  { name:'Dangote Industries', bank:'Zenith Bank', acct:'3029410056', date:'31 Jul 2026', amount:-85000000000, type:'debit', status:'success', ref:'PSC-2026-0072341', from:'Investment Account' },
  { name:'Federal Inland Revenue', bank:'UBA', acct:'2018730045', date:'30 Jul 2026', amount:-12500000, type:'debit', status:'success', ref:'PSC-2026-0072105', from:'Current Account' },
  { name:'Lagos State Govt', bank:'First Bank', acct:'3091837261', date:'29 Jul 2026', amount:250000000000, type:'credit', status:'success', ref:'PSC-2026-0071899', from:'Investment Account' },
  { name:'Eko Electricity', bank:'GTBank', acct:'0192837465', date:'28 Jul 2026', amount:-450000, type:'debit', status:'success', ref:'PSC-2026-0071654', from:'Savings Account' },
  { name:'MTN Nigeria', bank:'Access Bank', acct:'0091837465', date:'27 Jul 2026', amount:-10000, type:'debit', status:'success', ref:'PSC-2026-0071432', from:'Savings Account' },
  { name:'Nestle Nigeria', bank:'Stanbic IBTC', acct:'0028471023', date:'26 Jul 2026', amount:500000000, type:'credit', status:'success', ref:'PSC-2026-0071291', from:'Current Account' },
  { name:'James Adewale', bank:'GTBank', acct:'0059281047', date:'25 Jul 2026', amount:-50000000, type:'debit', status:'pending', ref:'PSC-2026-0071184', from:'Current Account' },
  { name:'TechInvest Ltd', bank:'UBA', acct:'0047291038', date:'24 Jul 2026', amount:-120000000, type:'debit', status:'pending', ref:'PSC-2026-0071092', from:'Investment Account' },
];

let beneficiaries = [
  { name:'Chidi Okonkwo',  bank:'GTBank',   acct:'0041728391', initials:'CO', color:'#7C3AED' },
  { name:'Amaka Eze',      bank:'Zenith',   acct:'2019837456', initials:'AE', color:'#0D9488' },
  { name:'Emeka Nwosu',    bank:'UBA',      acct:'3028471039', initials:'EN', color:'#D97706' },
  { name:'Fatima Al-Saud', bank:'Access',   acct:'0091827364', initials:'FA', color:'#DC2626' },
  { name:'Bola Tinubu Jr', bank:'First Bank',acct:'3001827465',initials:'BT', color:'#1A56DB' },
];

// ------------------ API ROUTES ------------------

// 1. Verify Account
app.post('/api/verify-account', async (req, res) => {
  const { accountNumber, bankCode } = req.body;
  console.log(`[VERIFY] accountNumber=${accountNumber}, bankCode=${bankCode}`);

  if (!accountNumber || !bankCode) {
    return res.status(400).json({ error: 'accountNumber and bankCode required' });
  }

  if (useMock) {
    console.warn('[VERIFY] Mock mode – returning fake verification.');
    return res.json({
      success: true,
      data: {
        account_name: 'Mock Account (real mode would verify)',
        account_number: accountNumber,
        bank_code: bankCode
      }
    });
  }

  // Real Paystack verification
  try {
    const response = await paystackClient.verification.resolveAccount(accountNumber, bankCode);
    if (response.status) {
      console.log('[VERIFY] Real Paystack: success');
      return res.json({ success: true, data: response.data });
    } else {
      console.warn('[VERIFY] Real Paystack failed:', response.message);
      return res.status(400).json({ success: false, message: response.message });
    }
  } catch (error) {
    console.error('[VERIFY] Error:', error.message);
    const msg = error.response?.data?.message || error.message || 'Verification failed';
    return res.status(500).json({ error: msg });
  }
});

// 2. Initiate Transfer
app.post('/api/transfer', async (req, res) => {
  const { sourceAccount, recipientBank, recipientAcct, amount, narration, saveBenef } = req.body;
  const cleanedAmount = typeof amount === 'string' ? amount.replace(/,/g, '') : amount;
  const amountNum = parseFloat(cleanedAmount);

  console.log(`[TRANSFER] source=${sourceAccount}, bank=${recipientBank}, acct=${recipientAcct}, amount=${amountNum}`);

  if (!sourceAccount || !recipientBank || !recipientAcct || !amountNum || amountNum <= 0) {
    return res.status(400).json({ error: 'Missing or invalid transfer details' });
  }

  if (useMock) {
    console.warn('[TRANSFER] Mock mode – returning fake success.');
    return res.json({
      success: true,
      transfer: { reference: 'MOCK-' + Date.now() },
      reference: 'MOCK-' + Date.now()
    });
  }

  const amountInKobo = Math.round(amountNum * 100);
  try {
    // Create recipient
    const recipientResponse = await paystackClient.transfer.createRecipient({
      type: 'nuban',
      name: 'Recipient Name',
      account_number: recipientAcct,
      bank_code: recipientBank,
      currency: 'NGN'
    });
    if (!recipientResponse.status) {
      console.warn('[TRANSFER] Recipient creation failed:', recipientResponse.message);
      return res.status(400).json({ error: recipientResponse.message });
    }
    const recipientCode = recipientResponse.data.recipient_code;

    // Initiate transfer
    const transferResponse = await paystackClient.transfer.initiate({
      source: 'balance',
      amount: amountInKobo,
      recipient: recipientCode,
      reason: narration || 'Fund Transfer',
      reference: 'PS-' + Date.now()
    });
    if (transferResponse.status) {
      console.log('[TRANSFER] Real Paystack: success, ref:', transferResponse.data.reference);
      return res.json({
        success: true,
        transfer: transferResponse.data,
        reference: transferResponse.data.reference
      });
    } else {
      console.warn('[TRANSFER] Initiation failed:', transferResponse.message);
      return res.status(400).json({ error: transferResponse.message });
    }
  } catch (error) {
    console.error('[TRANSFER] Error:', error.message);
    const msg = error.response?.data?.message || error.message || 'Transfer failed';
    return res.status(500).json({ error: msg });
  }
});

// 3. Get account balances
app.get('/api/accounts', (req, res) => {
  res.json(accounts);
});

// 4. Get recent transactions
app.get('/api/transactions', (req, res) => {
  res.json(transactions.slice(0, 10));
});

// 5. Get beneficiaries
app.get('/api/beneficiaries', (req, res) => {
  res.json(beneficiaries);
});

// 6. Save beneficiary (optional)
app.post('/api/beneficiaries', (req, res) => {
  const { name, bank, acct } = req.body;
  if (name && bank && acct) {
    const newBenef = {
      name, bank, acct,
      initials: name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase(),
      color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
    };
    beneficiaries.push(newBenef);
    res.json({ success: true, beneficiary: newBenef });
  } else {
    res.status(400).json({ error: 'Missing fields' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 PayStack Cloud backend running on port ${port}`);
  console.log(`🔮 Mock mode: ${useMock ? 'ON (all transactions will be simulated)' : 'OFF (using real Paystack API)'}`);
});