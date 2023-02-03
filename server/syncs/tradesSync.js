

const tradesSync = async (app, axios) => {
    let interval = 5 * 60 * 1000

    setTimeout(async () => {
        await updateTrades(app, axios)

        await tradesSync(app, axios)

        const used = process.memoryUsage()
        for (let key in used) {
            console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
        }
    }, interval)
}

const updateTrades = async (app, axios) => {
    console.log(`Begin transactions sync at ${new Date()}`)

    const state = app.get('state')

    let i = app.get('trades_sync_counter')
    const increment = 500

    const leagues_table = app.get('leagues_table')
    const trades_table = app.get('trades_table')

    const leagues_to_update = await leagues_table[Object.keys(leagues_table)[Object.keys(leagues_table).length - 1]].findAll({
        order: [['createdAt', 'ASC']],
        offset: i,
        limit: increment
    })

    console.log(`Updating trades for ${i + 1}-${Math.min(i + 1 + increment, i + leagues_to_update.length)} Leagues...`)


    let transactions_week = []

    await Promise.all(leagues_to_update
        .filter(x => x.dataValues.rosters)
        .map(async league => {
            let transactions_league;

            try {
                transactions_league = await axios.get(`https://api.sleeper.app/v1/league/${league.dataValues.league_id}/transactions/${state.season_type === 'regular' ? state.week : 1}`)
            } catch (error) {
                console.log(error)
                transactions_league = {
                    data: []
                }
            }

            return transactions_league.data
                .map(transaction => {
                    const draft_order = league.drafts.find(d => d.draft_order && d.status !== 'complete')?.draft_order
                    const managers = transaction.roster_ids.map(roster_id => {
                        const user = league.dataValues.rosters?.find(x => x.roster_id === roster_id)

                        return {
                            user_id: user?.user_id,
                            avatar: user?.avatar,
                            username: user?.username || 'Orphan',
                            roster_id: roster_id
                        }
                    })

                    const draft_picks = transaction.draft_picks.map(pick => {
                        const roster = league.dataValues.rosters.find(x => x.roster_id === pick.roster_id)

                        return {
                            ...pick,
                            original_user: {
                                user_id: roster?.user_id,
                                username: roster?.username,
                                avatar: roster?.avatar,
                            },
                            order: draft_order && roster?.user_id ? draft_order[roster?.user_id] : null
                        }
                    })

                    if (transaction.type === 'trade' && transaction.adds) {
                        return transactions_week.push({
                            transaction_id: transaction.transaction_id,
                            status_updated: transaction.status_updated,
                            managers: managers,
                            adds: transaction.adds,
                            drops: transaction.drops,
                            draft_picks: draft_picks,
                            league: {
                                league_id: league.league_id,
                                name: league.name,
                                avatar: league.avatar
                            },
                            users: league.users,
                            rosters: league.rosters,
                            drafts: league.drafts
                        })
                    }

                })
        })
    )

    try {
        await trades_table[state.league_season].bulkCreate(transactions_week, { updateOnDuplicate: ['drafts', 'draft_picks'] })
    } catch (error) {
        console.log(error)
    }

    if (leagues_to_update.length < increment) {
        app.set('trades_sync_counter', 0)
    } else {
        app.set('trades_sync_counter', i + increment)
    }

    console.log(`Transactions sync completed at ${new Date()}`)
}

module.exports = {
    tradesSync: tradesSync
}