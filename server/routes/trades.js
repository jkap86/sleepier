



const getTrades = async (app) => {
    const state = app.get('state')
    const trades_table = app.get('trades_table')
    const trades = await trades_table[state.league_season].findAll()

    return trades
}

module.exports = {
    getTrades: getTrades
}