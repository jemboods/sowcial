# Sowcial 🌾

**The social farming game where every farmer is an Agent ID.**

Sowcial is a cozy on-chain farming game on BNB Chain, built for the Binance Wallet **Agent ID Hackathon**. Your farm *is* your Agent ID: only holders of a Binance Agent ID (the non-transferable `.ai` on-chain identity for Agentic Wallets) can claim land, plant, and harvest — and your `.ai` name is your farmer name on the shared leaderboard.

## How Agent ID is used (core, not a sticker)

- The game contract checks the official Agent ID registry (`0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F`, SPACE ID Agent ID, ERC-721) on every land claim, plant, and neighbor-help action: `balanceOf(player) > 0` or the action reverts.
- One Agent ID address = one farm, forever. Agent IDs are non-transferable and one-per-person, which makes them a natural anti-Sybil identity for a fair game.
- The social core — `helpNeighbor()` — only works between two Agent ID farms. Helping is how the community grows: both the helper and the helped farmer earn **Dewpoints**.

## Gameplay

1. **Claim land** — free, one 3×3 farm per Agent ID.
2. **Plant** — 3 crops with real trade-offs and seasons that rotate every 3 days:
   - Turnip (Spring, ~10 min, 10 pts)
   - Star Melon (Summer, ~1 h, 35 pts)
   - Pumpkin (Autumn, ~6 h, 120 pts)
   Planting out of season still works, but yields half the Dewpoints and one less produce.
3. **Water** — watering a crop before harvest multiplies its Dewpoints ×1.5.
4. **Harvest** — collect Dewpoints and produce when the crop is ready.
5. **Help a neighbor** — water a fellow Agent ID farmer's farm once a day per pair; both of you earn Dewpoints. Grow together.

## What Sowcial deliberately is NOT

- **No token.** Dewpoints are non-transferable score stored in the game contract. They cannot be bought, sold, or withdrawn.
- **No custody.** The contract never holds user funds. Playing costs only BNB Chain gas (a fraction of a cent per action).
- **No promised returns.** Sowcial is a game about identity and community, not an investment.

## Contracts

| Contract | Purpose |
|---|---|
| `SowcialFarm` | The whole game: farms, plots, crops, seasons, Dewpoints, neighbor-help, leaderboard data |
| `MockAgentId` | Test-only registry mock (local/testnet). Mainnet always uses the real Agent ID registry |

Owner powers are intentionally minimal and documented: the owner can only `pause()` / `unpause()` gameplay in an emergency. There is no mint, tax, upgrade proxy, or withdrawal function.

## Run it

```bash
npm install
npx hardhat test          # full gameplay test suite
npx hardhat compile
npm run deploy:testnet    # BSC testnet (auto-deploys a MockAgentId there)
npm run deploy:mainnet    # BSC mainnet, gated by the real Agent ID registry
```

Deployment needs a `.env` (see `.env.example`): a deployer private key and an Etherscan API key for BscScan verification.

## Roadmap after the hackathon

Crafting recipes, seed breeding with verifiable randomness (Chainlink VRF), a player marketplace, guild co-op farms, and seasonal events — the full farming-sim depth, layered on the same Agent ID foundation.
