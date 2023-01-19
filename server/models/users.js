const Sequelize = require('sequelize')

const users = (db, seasons) => {
    return db.define('users', {
        user_id: {
            type: Sequelize.STRING,
            allowNull: false,
            primaryKey: true
        },
        username: {
            type: Sequelize.STRING
        },
        avatar: {
            type: Sequelize.STRING
        },
        ...Object.fromEntries(seasons.map(season => {
            return [`${season}_leagues`, { type: Sequelize.JSONB }]
        }))
    })
}

module.exports = {
    users: users
}