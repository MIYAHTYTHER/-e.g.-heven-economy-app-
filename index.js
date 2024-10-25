// Install dependencies: Express, Mongoose, Web3, and Body-Parser
// Run: npm install express mongoose web3 body-parser

// Backend Setup
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Web3 = require('web3');  // For smart contract interaction

const app = express();
app.use(bodyParser.json());

// Connect to MongoDB (Replace <YOUR_MONGO_URI> with your connection string)
mongoose.connect('<YOUR_MONGO_URI>', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Smart Contract ABI and Address (Replace these with your actual contract details)
const contractABI = [ /* Your Smart Contract ABI here */ ];
const contractAddress = '0xYourSmartContractAddress';
const web3 = new Web3('https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID');  // Ethereum connection
const hevenContract = new web3.eth.Contract(contractABI, contractAddress);

// Mongoose Models
const User = mongoose.model('User', new mongoose.Schema({
  did: String,
  name: String,
  legal_name: String,
  currency_wallet: {
    balance: { type: Number, default: 0 },
    transactions: [{ type: String }]
  },
  document_registry: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
}));

// Routes

// 1. Create User Profile
app.post('/api/profile', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json({ message: 'User profile created', user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user profile' });
  }
});

// 2. Get User Profile by DID
app.get('/api/profile/:did', async (req, res) => {
  try {
    const user = await User.findOne({ did: req.params.did });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 3. Update Wallet Balance
app.post('/api/wallet', async (req, res) => {
  const { did, amount } = req.body;
  try {
    const user = await User.findOne({ did });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.currency_wallet.balance += amount;
    await user.save();
    res.json({ message: 'Wallet updated', balance: user.currency_wallet.balance });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update wallet' });
  }
});

// 4. Transfer Heven Currency via Smart Contract
app.post('/api/transfer', async (req, res) => {
  const { from, to, amount } = req.body;

  try {
    const receipt = await hevenContract.methods.transfer(to, amount).send({ from });
    res.json({ message: 'Transfer successful', receipt });
  } catch (err) {
    res.status(500).json({ error: 'Transfer failed', details: err.message });
  }
});

// Server Listening
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
