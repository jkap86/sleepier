const express = require('express')
const app = express()
const cors = require('cors')
const compression = require('compression')
const path = require('path')
const NodeCache = require('node-cache');
const Sequelize = require('sequelize')
const https = require('https');
const axios = require('axios').create({
    headers: {
        'content-type': 'application/json'
    },
    httpsAgent: new https.Agent({ rejectUnauthorized: false, keepAlive: true })
})
axios.defaults.timeout = 5000;
const axiosRetry = require('axios-retry');
const puppeteer = require('puppeteer');
const http = require('http').Server(app)
const socketIO = require('socket.io')(http, {
    cors: {
        origin: "http://10.0.0.50:3000"
    }
})
const PuppeteerMassScreenshots = require("./screen.shooter");
const userAgent = require('user-agents');
const { bootServer } = require('./syncs/bootServer');
const { getUser, updateUser, updateUser_Leagues } = require('./routes/user');
const { trades_sync } = require('./syncs/trades_sync')
const { getTrades } = require('./routes/trades')
const { Playoffs_Scoring } = require('./syncs/playoffs_scoring')
const { getPlayoffLeague } = require('./routes/league')

const myCache = new NodeCache;

app.use(compression())
app.use(cors());
app.use(express.json());
app.use(express.static(path.resolve(__dirname, '../client/build')));

const connectionString = process.env.DATABASE_URL || 'postgres://dev:password123@localhost:5432/dev'
const ssl = process.env.HEROKU ? { rejectUnauthorized: false } : false
const db = new Sequelize(connectionString, { logging: false, dialect: 'postgres', dialectOptions: { ssl: ssl, useUTC: false } })


axiosRetry(axios, {
    retries: 3,
    retryCondition: (error) => {
        return error.code === 'ECONNABORTED' ||
            axiosRetry.isNetworkError(error) || axiosRetry.isRetryableError(error);
    },
    retryDelay: (retryCount) => {
        return retryCount * 3000
    },
    shouldResetTimeout: true
})

bootServer(app, axios, db)

setInterval(() => {
    trades_sync(axios, app)
}, 1000 * 60 * 60)


setInterval(() => {
    Playoffs_Scoring(axios, app)
}, 1000 * 60)

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
        const league = await getPlayoffLeague(axios, req.query.league_id)
        myCache.set(req.query.league_id, league, 60 * 60)
        res.send(league)
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
    const user = await getUser(axios, req)
    if (!Object.keys(app.get('leagues_table')).includes(req.query.season)) {
        res.send('Invalid Season')
    } else if (user?.user_id) {
        req.user = user
        next()
    } else {
        res.send('Username Not Found')
    }
}, async (req, res, next) => {
    const user_db = await updateUser(axios, app, req)
    req.user_db = user_db
    next();
}, async (req, res, next) => {
    const leagues_db = await updateUser_Leagues(axios, app, req)
    const data = {
        user_id: req.user_db.user.user_id,
        username: req.user_db.user.username,
        avatar: req.user_db.user.avatar,
        seasons: Object.keys(app.get('leagues_table')),
        leagues: leagues_db,
        state: app.get('state')
    }
    res.send(data)
})

app.get('/trades', async (req, res, next) => {
    const trades_db = await getTrades(app)
    res.send(trades_db)
})

app.get('*', async (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
})

const PORT = process.env.PORT || 5000;
http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});