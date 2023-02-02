'use strict'
const express = require('express')
const app = express()
const cors = require('cors')
const compression = require('compression')
const path = require('path')
const NodeCache = require('node-cache');
const Sequelize = require('sequelize');
const https = require('https');
const axios = require('axios').create({
    headers: {
        'content-type': 'application/json'
    },
    httpsAgent: new https.Agent({ rejectUnauthorized: false, keepAlive: true })
});
const axiosRetry = require('axios-retry');
const http = require('http').Server(app);
const { bootServer } = require('./syncs/bootServer');
const { dailySync } = require('./syncs/dailySync');
const { tradesSync } = require('./syncs/tradesSync');
const { leaguemateSync } = require('./syncs/leaguemateSync');
const { Playoffs_Scoring } = require('./syncs/playoffs_scoring');
const { getPlayoffLeague } = require('./routes/league')
const USER = require('./routes/user');
const TRADES = require('./routes/trades');

const myCache = new NodeCache;

app.use(compression())
app.use(cors());
app.use(express.json());
app.use(express.static(path.resolve(__dirname, '../client/build')));

const connectionString = process.env.DATABASE_URL || 'postgres://dev:password123@localhost:5432/dev'
const ssl = process.env.HEROKU ? { rejectUnauthorized: false } : false
const db = new Sequelize(connectionString, { pool: { max: 100, min: 0, acquire: 30000, idle: 1000 }, logging: false, dialect: 'postgres', dialectOptions: { ssl: ssl, useUTC: false } })

axiosRetry(axios, {
    retries: 3,
    retryCondition: (error) => {
        return error.code === 'ECONNABORTED' || error.code === 'ERR_BAD_REQUEST' ||
            axiosRetry.isNetworkError(error) || axiosRetry.isRetryableError(error);
    },
    retryDelay: (retryCount) => {
        return retryCount * 3000
    },
    shouldResetTimeout: true
})

bootServer(app, axios, db)

dailySync(app, axios)

leaguemateSync(app, axios)

tradesSync(app, axios)




const playoffs_sync = async () => {
    let scoring_interval = await Playoffs_Scoring(axios, app)
    console.log(`Next scoring update in ${Math.floor(scoring_interval / (60 * 60 * 1000))} hours, ${Math.floor(scoring_interval % (60 * 60 * 1000) / (60 * 1000))} minutes`)
    setTimeout(async () => {
        await playoffs_sync()
    }, scoring_interval)
}

playoffs_sync()

app.get('/playoffscores', async (req, res) => {
    const playoffs = app.get('playoffs_scoring')
    const allplayers = app.get('allplayers')
    res.send({
        scoring: playoffs,
        allplayers: allplayers
    })
})

app.get('/playoffs/league', async (req, res) => {
    const league_cache = myCache.get(req.query.league_id)
    if (league_cache) {
        console.log('From Cache...')
        res.send(league_cache)
    } else {
        const schedule = app.get('schedule')
        const league = await getPlayoffLeague(axios, req.query.league_id)
        myCache.set(req.query.league_id, {
            ...league,
            schedule: schedule
        }, 60 * 60)
        res.send({
            ...league,
            schedule: schedule
        })
    }
})


app.get('/home', (req, res) => {
    const leagues_table = app.get('leagues_table')
    if (leagues_table) {
        res.send({
            seasons: Object.keys(leagues_table),
            state: app.get('state')
        })
    }
})

app.get('/allplayers', (req, res) => {
    const allplayers = app.get('allplayers');
    res.send(allplayers);
})

app.get('/user', async (req, res, next) => {
    const user = await USER.getUser(axios, req)

    if (!Object.keys(app.get('leagues_table') || {}).includes(req.query.season)) {
        res.send('Invalid Season')
    } else if (!user?.user_id) {
        res.send('Username Not Found')

    } else {
        req.user = user
        next()
    }
}, async (req, res, next) => {
    const user_db = await USER.updateUser(axios, app, req)
    req.user_db = user_db
    next();
}, async (req, res, next) => {
    const leagues_db = await USER.updateUser_Leagues(axios, app, req)

    let leaguemates = app.get('leaguemates')
    if (!Object.keys(leaguemates).includes(req.query.season)) {
        leaguemates[req.query.season] = {}
    }

    let leaguemate_ids = []
    leagues_db.map(league => {
        return league.rosters
            .filter(r => r.user_id !== req.user_db.user_id)
            .map(async roster => {
                if (roster.user_id?.length > 1) {
                    leaguemate_ids.push(roster.user_id)
                    return leaguemates[req.query.season][roster.user_id] = {
                        avatar: roster.avatar,
                        user_id: roster.user_id,
                        username: roster.username
                    }
                }
            })
    })

    req.leagues = leagues_db
    req.leaguemate_ids = Array.from(new Set(leaguemate_ids))
    app.set('leaguemates', leaguemates)

    next()
}, async (req, res) => {
    const trades_db = await TRADES.getTrades(app, req)
    const data = {
        user_id: req.user_db.user_id,
        username: req.user_db.username,
        avatar: req.user_db.avatar,
        seasons: Object.keys(app.get('leagues_table')),
        leagues: req.leagues,
        state: app.get('state'),
        trades: trades_db
    }

    res.send(data)
})

app.get('*', async (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
})

const PORT = process.env.PORT || 5000;
http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});

