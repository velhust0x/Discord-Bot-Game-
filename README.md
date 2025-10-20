# Aura Economy Bot

Virtual currency bot for Discord: balance, daily reward, transfers, shop + role buying, games (HiLo, Blackjack, Baccarat), and currency giveaways.

## Prerequisites
- Node.js 18+ (or Docker)
- A Discord bot token

## Local Setup
1. Copy `.env.example` to `.env` and fill values.
2. Install deps and start:
```bash
npm install
npm run start
```

## Deploy (Docker, recommended)
- One command build & run (from project folder):
```bash
# first time
docker compose up -d --build
# start/stop
docker compose up -d
docker compose stop
```
- Data persistence: SQLite is mounted at `bot_data` volume → survives restarts and image updates.
- Environment: The container loads `.env` from the project directory.

### Update with Docker
```bash
git pull # or copy new files
docker compose pull || true
docker compose up -d --build
```
Data remains in the `bot_data` volume.

### Backup/Restore (Docker)
- Backup:
```bash
docker run --rm -v bot_data:/data -v %cd%:/backup busybox sh -c "cp /data/economy.db /backup/economy.db"
```
- Restore: stop the container, then copy the file back to the volume similarly.

## Deploy (PM2, non-Docker)
```bash
npm install --production
npx pm2 start ecosystem.config.js
npx pm2 save
npx pm2 startup # optional to boot on restart
```
- Logs: `pm2 logs meew-bot`
- Update:
```bash
git pull || true
npm install --production
pm2 reload meew-bot
```
- Database file: `data/economy.db`. Back it up by copying the file.

## Environment
```
DISCORD_TOKEN=...
CLIENT_ID=...
PREFIX=!
DAILY_REWARD=50
STARTING_BALANCE=0
CURRENCY_NAME=$Real
DATABASE_PATH=./data/economy.db
WHITELIST_ROLE_IDS=
``` 