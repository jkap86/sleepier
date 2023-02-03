const { Op } = require("sequelize")

const getTrades = async (app, req) => {
    const state = app.get('state')
    const trades_table = app.get('trades_table')

    const leagues = req.leagues
    let players = {
        owned: {},
        unowned: {}
    }

    leagues.map(league => {
        return league.rosters
            .filter(r => r.roster_id !== league.userRoster.roster_id)
            .map(roster => {
                if (!Object.keys(players.owned).includes(roster.user_id)) {
                    players.owned[roster.user_id] = {}
                }
                if (!Object.keys(players.unowned).includes(roster.user_id)) {
                    players.unowned[roster.user_id] = {}
                }

                league.userRoster.players?.map(player_id => {
                    if (!Object.keys(players.owned[roster.user_id]).includes(player_id)) {
                        players.owned[roster.user_id][player_id] = []
                    }
                    players.owned[roster.user_id][player_id].push(league.name)
                })

                roster.players?.map(player_id => {
                    if (!Object.keys(players.unowned[roster.user_id]).includes(player_id)) {
                        players.unowned[roster.user_id][player_id] = []
                    }
                    players.unowned[roster.user_id][player_id].push(league.name)
                })
            })
    })



    let trades;

    let arr = []

    for (let lm of req.leaguemate_ids) {
        arr.push({
            [Op.contains]: [lm],
        });
    }



    try {

        trades = await trades_table[state.league_season].findAndCountAll({
            where: {
                users: {
                    [Op.or]: arr
                }
            }
        })

        // trades = await trades_table[state.league_season].findAndCountAll({})
    } catch (error) {
        console.log(error)
    }

    return {
        trades: trades.rows.map(row => row.dataValues),
        count: trades.count,
        players_to_trade: players
    }
}

module.exports = {
    getTrades: getTrades
}