## Install
- clone project with: `git clone https://github.com/retro-wavey/harvest-bot.git`
- switch to project directory with `cd harvest-bot`
- install dependencies with `npm install`
- make sure you have typscript installed with `npm install -g typescript`
- make sure you have ts-node installed with `npm install -g ts-node`

## Config
- copy `example.env` and rename to `.env` 
- set threshold for when to find harvests: 
    in `runner.ts` modify this line, replace X for number of hours to look back:
        `let oneHourAgo = currentTime - (1000*60*60*X);`

## Run
- run with `ts-node runner.ts`

# Docker

## Build the Docker container

```bash
> docker build -t harvest-bot .
```

## Run the harvest bot in the Docker container

```bash
> docker run --platform linux/x86_64 -e ENVIRONMENT=PROD -e DELAY_MINUTES=60 -e MINUTES=60 -e TELEGRAM_CHANNEL_ID="@yfitestchannel" -e HARVEST_COLLECTOR_BOT="bot1111111111:AAGf0rbw5Xfoo47D2M0VRCk1CdQ-81LPKHck" -e DISCORD_SECRET="111111111111/xjzzYp32aYrezyHmnojLy8SKqcvR9123r1q9uVJraO1_8is9SucE63SQ-RNjTegQ2p" -e INFURA_NODE="https://mainnet.infura.io/v3/cab1233Fffgbjk3n5dbjsoqz3qqn4" harvest-bot ts-node runner.ts
```