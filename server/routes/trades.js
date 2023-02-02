const { Op } = require("sequelize")

const getTrades = async (app, req) => {
    const state = app.get('state')
    const trades_table = app.get('trades_table')
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
    } catch (error) {
        console.log(error)
    }

    return {
        trades: trades.rows.map(row => row.dataValues),
        count: trades.count
    }
}

module.exports = {
    getTrades: getTrades
}