PayStack Cloud – Banking Portal
A full‑stack banking application built for educational purposes.
It demonstrates a modern banking dashboard with real‑time account management, fund transfers, beneficiary handling, and transaction history – all powered by Paystack’s Test API (no real money involved). The project combines a responsive HTML/CSS/JavaScript frontend with a Node.js/Express backend.

🚀 Features
Dashboard Overview – View account balances, transaction summaries, and quick action buttons.

Multi‑Account Support – Investment, Current, and Savings accounts with individual balances.

Fund Transfers – Send money to any Nigerian bank account (NIP/NIBSS) via Paystack.

Account Verification – Resolve beneficiary bank accounts in real‑time using Paystack’s API.

Transaction History – List recent and past transfers with status (success/pending/failed).

Beneficiary Management – Save, view, and reuse frequently used recipients.

PIN‑based Authorization – Simulate 4‑digit PIN confirmation for transfers.

Printable Receipts – Generate and print transaction receipts.

Fully Responsive – Works on desktop, tablet, and mobile devices.


🛠️ Tech Stack
Layer	Technology
Frontend	HTML5, CSS3, Vanilla JavaScript, Fetch API
Backend	Node.js, Express.js
Payments	Paystack Node.js SDK (test mode)
Environment	dotenv for configuration
Deployment	Render.com (or any Node.js hosting platform)


paystack-cloud/
├── public/
│   └── index.html          # Main frontend (modified)
├── server.js               # Express backend with API routes
├── package.json            # Dependencies & scripts
├── .env                    # Environment variables (secret keys)
├── .gitignore              # Ignore node_modules, .env, etc.
├── render.yaml             # Optional Render deployment config
└── README.md               # This file

🔧 Prerequisites
Node.js (v16 or newer)

Paystack test account – sign up at paystack.com and get your test secret key.

A code editor (VS Code recommended).

Setup Instructions
1. Clone the repository

git clone https://github.com/your-username/paystack-cloud.git
cd paystack-cloud

2. Install dependencies
npm install

3. Configure environment variables
Create a .env file in the root directory:
PORT=3000
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxx   # Your Paystack test secret
BASE_URL=http://localhost:3000                          # Change to your live URL later

4. Run the application locally

node server.js
# or with nodemon (if installed globally)
npx nodemon server.js

Open http://localhost:3000 in your browser – the frontend will be served automatically

🌐 API Endpoints (Backend)
All endpoints are prefixed with /api and return JSON.

Method	Endpoint	Description
POST	/api/verify-account	Resolves an account number + bank code via Paystack
POST	/api/transfer	Initiates a fund transfer (single transaction)
GET	/api/accounts	Returns current account balances (mock for demo)
GET	/api/transactions	Returns a list of recent transactions
GET	/api/beneficiaries	Returns saved beneficiary list
POST	/api/beneficiaries

Example POST to /api/transfer:

{
  "sourceAccount": "cur",
  "recipientBank": "058",
  "recipientAcct": "0123456789",
  "amount": 10000,
  "narration": "Test transfer",
  "saveBenef": true
}

Response (success):
{
  "success": true,
  "transfer": { ... },
  "reference": "PS-1640995200000"
}

☁️ Deployment (Render.com)
Push your code to a GitHub repository.

Log in to Render.com and select New Web Service.

Connect your GitHub repo.

Render will detect render.yaml (if provided) or you can manually configure:

Build Command: npm install

Start Command: npm start

Environment Variables: Add PAYSTACK_SECRET_KEY (your test secret) and PORT (optional).

Click Deploy. Your app will be live at https://your-app.onrender.com

Note: The frontend uses relative URLs (/api/...), so both frontend and backend must be served from the same origin. The provided server.js serves static files from public/, making this setup straightforward.

🧪 Testing with Paystack Test Mode
Use test secret keys (starting with sk_test_). Never use live keys in this demo.

Paystack provides a test bank account for funding your test wallet – check the Paystack documentation.

For transfer tests, ensure your test wallet has sufficient balance.

Use the test bank codes provided in the frontend (e.g., 058 for GTBank) – they are also listed in the HTML’s bank dropdown.

📝 Important Notes
This is not production‑ready. It lacks authentication, database persistence, proper error handling, and security measures.

All data (balances, transactions, beneficiaries) are stored in‑memory (mock) – they reset on server restart.

The PIN verification is simulated – no actual PIN validation occurs (for demo purposes).

The project is intended for educational use – to learn how to integrate a payment gateway, build a full‑stack app, and deploy to the cloud.

🤝 Contributing
Feel free to fork this repository and enhance it! Suggestions:

Add a database (MongoDB, PostgreSQL) for persistent storage.

Implement user authentication (JWT, sessions).

Add more Paystack features (recurring payments, bulk transfers, etc.).

Improve UI/UX with a modern framework (React, Vue).


📄 License
This project is licensed under the MIT License – see the LICENSE file for details.


🙏 Acknowledgements
Paystack for their excellent API and SDK.

Fontsource for the beautiful fonts.

The open‑source community for the tools and inspiration.

