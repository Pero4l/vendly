# Vendly Production Deployment Guide

This guide details the procedures required to deploy the Vendly marketplace monorepo (Contracts, Backend, Web, and Mobile) to production environments on the Celo network.

---

## 1. Smart Contracts Deployment (Celo Mainnet)

### Configuration
1. Navigate to `/contracts`.
2. Ensure `hardhat.config.js` contains network definitions for Celo Mainnet:
   - RPC URL: `https://forno.celo.org`
   - Chain ID: `42220`
3. Set your deployment private key in `/contracts/.env`:
   ```env
   PRIVATE_KEY=your_production_deployer_wallet_private_key
   CELOSCAN_API_KEY=your_celoscan_verification_api_key
   ```

### Execution
Run the deployment script targets:
```bash
# Compile
npx hardhat compile

# Deploy to Celo Mainnet
npx hardhat run scripts/deploy.js --network celo

# Verify contract source code on Celoscan/Blockscout
npx hardhat verify --network celo DEPLOYED_CONTRACT_ADDRESS "CONSTRUCTOR_ARG_1"
```

Save the deployed `Marketplace` and `Escrow` proxy addresses to configure your backend.

---

## 2. Express Backend Deployment (e.g. AWS, Render, Heroku)

### Database Infrastructure
1. Provision a production PostgreSQL instance (AWS RDS or Render PostgreSQL) with SSL enabled.
2. Provision a production Redis instance (AWS ElastiCache or Redis Labs).

### Environment Variables
Configure the environment dashboard with:
```env
PORT=80
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@production-db-url:5432/dbname?ssl=true
REDIS_HOST=production-redis-url
REDIS_PORT=6379
JWT_SECRET=strong_jwt_signing_key
JWT_REFRESH_SECRET=strong_jwt_refresh_key
ENCRYPTION_KEY=32_character_aes_encryption_key
CELO_PROVIDER_URL=https://forno.celo.org
ADMIN_PRIVATE_KEY=production_signer_wallet_private_key
ESCROW_CONTRACT_ADDRESS=deployed_escrow_contract_address
```

### Run Migrations & Start
```bash
# Run database schema migrations
npm run db:migrate

# Start Server
npm run start
```

---

## 3. Next.js Web Frontend Hosting (e.g. Vercel)

The Next.js App Router project is optimized for deployment on Vercel.

### Vercel Environment Variables
Set the following variables in the Vercel dashboard:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_MARKETPLACE_ADDRESS=deployed_marketplace_contract_address
NEXT_PUBLIC_WC_PROJECT_ID=walletconnect_cloud_project_id
NEXT_PUBLIC_ENABLE_TESTNETS=false
```

---

## 4. Expo Mobile App Publishing (EAS)

Deploy the React Native mobile application using Expo Application Services (EAS).

### Build steps
1. Install EAS CLI globally:
   ```bash
   npm install -g eas-cli
   ```
2. Log into your Expo account:
   ```bash
   eas login
   ```
3. Initialize EAS configuration:
   ```bash
   eas build:configure
   ```
4. Build production binaries:
   ```bash
   # Android App Bundle (AAB)
   eas build --platform android --profile production

   # iOS App (IPA)
   eas build --platform ios --profile production
   ```
5. Submit to Google Play Store & Apple App Store:
   ```bash
   eas submit --platform all
   ```
