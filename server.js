// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);
const app = express();
const port = process.env.PORT || 3000;

// ------------------ CORS Configuration ------------------
// Allow all origins for educational/demo purposes.
app.use(cors()); // Allows all origins – fine for testing.

app.use(express.json());
app.use(express.static('public')); // Only needed if you serve frontend from same origin.

// ------------------ MOCK DATA (replace with DB later) ------------------
let accounts = {
  inv: { name: 'Investment Account', balance: 900000000000, acct: '0023847100' },
  cur: { name: 'Current Account', balance: 780000000000, acct: '0058391204' },
  sav: { name: 'Savings Account', balance: 680000000000, acct: '0091205637' }
};

// Sample transactions (copied from original HTML)
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

// Sample beneficiaries
let beneficiaries = [
  { name:'Chidi Okonkwo',  bank:'GTBank',   acct:'0041728391', initials:'CO', color:'#7C3AED' },
  { name:'Amaka Eze',      bank:'Zenith',   acct:'2019837456', initials:'AE', color:'#0D9488' },
  { name:'Emeka Nwosu',    bank:'UBA',      acct:'3028471039', initials:'EN', color:'#D97706' },
  { name:'Fatima Al-Saud', bank:'Access',   acct:'0091827364', initials:'FA', color:'#DC2626' },
  { name:'Bola Tinubu Jr', bank:'First Bank',acct:'3001827465',initials:'BT', color:'#1A56DB' },
];

// ------------------ API ROUTES ------------------

// 1. Verify bank account (uses Paystack resolve account)
app.post('/api/verify-account', async (req, res) => {
  const { accountNumber, bankCode } = req.body;
  if (!accountNumber || !bankCode) {
    return res.status(400).json({ error: 'accountNumber and bankCode required' });
  }
  try {
    const response = await Paystack.verification.resolveAccount(accountNumber, bankCode);
    if (response.status) {
      return res.json({ success: true, data: response.data });
    } else {
      return res.status(400).json({ success: false, message: response.message });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Verification failed' });
  }
});

// 2. Initiate transfer (single) – with improved error handling and amount cleaning
app.post('/api/transfer', async (req, res) => {
  const { sourceAccount, recipientBank, recipientAcct, narration, saveBenef } = req.body;
  // Clean amount: remove commas, parse to float
  const rawAmount = req.body.amount;
  const cleanedAmount = typeof rawAmount === 'string' ? rawAmount.replace(/,/g, '') : rawAmount;
  const amountNum = parseFloat(cleanedAmount);

  // Validate inputs
  if (!sourceAccount || !recipientBank || !recipientAcct || !amountNum || amountNum <= 0) {
    return res.status(400).json({ error: 'Missing or invalid transfer details (amount must be > 0)' });
  }

  // Convert amount to kobo (Paystack uses smallest currency unit)
  const amountInKobo = Math.round(amountNum * 100);

  try {
    // 1. Create a transfer recipient
    const recipientResponse = await Paystack.transfer.createRecipient({
      type: 'nuban',
      name: 'Recipient Name', // Ideally we should get name from verification
      account_number: recipientAcct,
      bank_code: recipientBank,
      currency: 'NGN'
    });
    if (!recipientResponse.status) {
      // If recipient creation fails, return the error message from Paystack
      return res.status(400).json({ error: recipientResponse.message });
    }
    const recipientCode = recipientResponse.data.recipient_code;

    // 2. Initiate the transfer
    const transferResponse = await Paystack.transfer.initiate({
      source: 'balance',
      amount: amountInKobo,
      recipient: recipientCode,
      reason: narration || 'Fund Transfer',
      reference: 'PS-' + Date.now()
    });
    if (transferResponse.status) {
      // In a real app, save transaction to database
      // For demo, we'll just return success
      return res.json({
        success: true,
        transfer: transferResponse.data,
        reference: transferResponse.data.reference
      });
    } else {
      // Transfer initiation failed, return Paystack's message
      return res.status(400).json({ error: transferResponse.message });
    }
  } catch (error) {
    console.error('Paystack error:', error);
    // Extract more detailed error if available
    let errorMsg = 'Transfer failed';
    if (error.response && error.response.data && error.response.data.message) {
      errorMsg = error.response.data.message;
    } else if (error.message) {
      errorMsg = error.message;
    }
    return res.status(500).json({ error: errorMsg });
  }
});

// 3. Get account balances (for dashboard)
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
  console.log(`PayStack Cloud backend running on port ${port}`);
});