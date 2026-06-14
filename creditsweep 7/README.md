# CreditSweep — Credit Cleaning Software

## Project Structure
```
creditsweep/
├── src/
│   ├── CreditSweep.jsx           ← Full app (all pages, admin, distributor portal)
│   ├── CreditSweep_Flowcharts.jsx ← Customer & partner flowcharts
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
├── .gitignore
└── .env.example
```

## Deploy to Vercel
1. npm install
2. npm run dev  (preview at localhost:5173)
3. Push to GitHub → connect at vercel.com → deploy

## Before going live
1. Change OWNER_PASSWORD in CreditSweep.jsx
2. Add Stripe publishable key to PaymentForm
3. Add LetterStream API key to send() function
4. Apply for LetterStream Monetization Mode: support@letterstream.com

## Pricing — edit anytime
Change the PRICING object at top of CreditSweep.jsx — everything updates automatically.

## Passwords (demo)
- Admin: owner123
- Partner portal: dist123
