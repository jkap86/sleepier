const { users } = require('../models/users');
const { leagues } = require('../models/leagues');
const { trades } = require('../models/trades');
const { getAllPlayers } = require('../helpers/getAllPlayers');

const bootServer = async (app, axios, db) => {
    const state = await axios.get('https://api.sleeper.app/v1/state/nfl')
    await app.set('state', state.data)

    const allplayers = await getAllPlayers(axios, state.data)
    app.set('allplayers', allplayers)



    let leagues_table = {};
    let trades_table = {};
    let season = Math.max(parseInt(state.data.league_season), parseInt(state.data.league_create_season));

    while (season >= 2018) {
        leagues_table[season] = leagues(db, season)
        await leagues_table[season].sync({ alter: true })

        trades_table[season] = trades(db, season)
        await trades_table[season].sync({ alter: true })

        season -= 1
    }

    const users_table = users(db, Object.keys(leagues_table))
    await users_table.sync({ alter: true })

    app.set('users_table', users_table)
    app.set('leagues_table', leagues_table)
    app.set('trades_table', trades_table)
    app.set('leaguemates', {})
    app.set('new_leagues', {})
    app.set('trades_sync_counter', 0)
}

module.exports = {
    bootServer: bootServer
}