## Install
- clone project with: `git clone https://github.com/retro-wavey/harvest-bot.git`
- switch to project directory with `cd harvest-bot`
- install dependencies with `npm install`
- make sure you have typscript installed with `npm install -g typescript`
- make sure you have ts-node installed with `npm install -g ts-node`

## Config
- set threshold for when to find harvests: 
    in `runner.ts` modify this line, replace X for number of hours to look back:
        `let oneHourAgo = currentTime - (1000*60*60*X);`

## Run
- run with `ts-node runner.ts`