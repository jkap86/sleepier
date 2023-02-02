const { Sequelize } = require("sequelize");

const trades = (db, season) => {
    return db.define(`${season}_trades`, {
        transaction_id: {
            type: Sequelize.STRING,
            allowNull: false,
            primaryKey: true
        },
        league: {
            type: Sequelize.JSONB
        },
        users: {
            type: Sequelize.JSONB,
        },
        rosters: {
            type: Sequelize.JSONB,
        },
        status_updated: {
            type: Sequelize.STRING
        },
        managers: {
            type: Sequelize.JSONB
        },
        adds: {
            type: Sequelize.JSONB
        },
        drops: {
            type: Sequelize.JSONB
        },
        draft_picks: {
            type: Sequelize.JSONB
        }
    })
}

module.exports = {
    trades: trades
}