# Vendly: Escrow-Based Marketplace on Celo

Vendly is a secure, escrow-based marketplace built on the Celo blockchain, featuring native ERC-20 token support (CELO, cUSD, USDT, USDC) and an internal wallet management system.

## Project Structure

```
vendly/
├── backend/            # Express REST API, Websockets, BullMQ Workers
├── contracts/          # Hardhat Project, UUPS Upgradeable Solidity Contracts
├── frontend/           # Next.js 15 Web Application
├── mobile/             # React Native Expo Mobile App
├── docs/               # API Specification & User Guides
└── docker-compose.yml  # Local developer infrastructure (Postgres, Redis)
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (v18+ recommended)
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
- Expo Go app on mobile (for testing React Native mobile app)

### Development Setup

1. **Spin up Local Services**:
   ```bash
   docker-compose up -d
   ```

2. **Install Dependencies**:
   Install dependencies from the root directory using npm:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Follow instructions in each workspace (`backend`, `contracts`, `frontend`) to configure their respective `.env` files.

4. **Compile Smart Contracts**:
   ```bash
   npm run contracts:compile
   ```

5. **Run Services**:
   - Backend Dev Server: `npm run backend:dev`
   - Frontend Dev Server: `npm run frontend:dev`
   - Mobile Dev Client: `npm run mobile:start`
