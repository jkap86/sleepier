const { Op } = require("sequelize")

const getUser = async (axios, req) => {
    let user;
    try {
        user = await axios.get(`http://api.sleeper.app/v1/user/${req.query.username}`)
    } catch (error) {
        console.log(error)
    }
    if (user.data) {
        return {
            avatar: user.data.avatar,
            user_id: user.data.user_id,
            username: user.data.display_name
        };
    } else {
        return 'ERROR'
    }
}

const updateUser = async (axios, app, req) => {
    const users_table = app.get('users_table');
    const state = app.get('state');
    if (!users_table) {
        return
    }

    const seasons = Object.keys(app.get('leagues_table'))

    const user = await users_table.findOne({ where: { user_id: req.user.user_id } });

    let user_db = user?.dataValues

    let new_user;
    let league_ids;
    if (req.query.season === state.league_create_season || !(user_db && user_db[`${req.query.season}_leagues`])) {

        const leagues = await axios.get(`http://api.sleeper.app/v1/user/${req.user.user_id}/leagues/nfl/${req.query.season}`)
        league_ids = leagues.data.map(league => league.league_id)

    } else {
        league_ids = user_db[`${req.query.season}_leagues`]
    }

    if (user_db) {
        await users_table.update({
            username: req.user.username,
            avatar: req.user.avatar,
            [`${req.query.season}_leagues`]: league_ids

        }, {
            where: {
                user_id: req.user.user_id
            }
        })
        user_db[`${req.query.season}_leagues`] = league_ids
    } else {
        new_user = {
            user_id: req.user.user_id,
            username: req.user.username,
            avatar: req.user.avatar,
            [`${req.query.season}_leagues`]: league_ids

        }
        await users_table.create(new_user)
    }

    return {
        ...(user_db ? user_db : new_user),
        new: user_db && user_db[`${req.query.season}_leagues`] ? -1 : 1
    }
}

const updateUser_Leagues = async (axios, app, req) => {
    const state = app.get('state')
    const cutoff = req.league_ids ? new Date(new Date() - (7 * 24 * 60 * 60 * 1000)) : new Date(new Date() - (24 * 60 * 60 * 1000))
    const league_ids = req.league_ids || req.user_db[`${req.query.season}_leagues`]

    const keys = ["name", "avatar", "best_ball", "type", "settings", "scoring_settings", "roster_positions",
        "users", "rosters", "drafts", "updatedAt"]

    let keys_to_update = keys
    if (req.query.season === state.league_season && state.season_type === 'regular' && state.week > 0 && state.week < 19) {
        keys_to_update.push(`matchups_${state.week}`)
    }

    const keys_to_add = [...keys, ...Array.from(Array(Math.min(18, 1)).keys()).map(key => `matchups_${key + 1}`)]


    let updated_leagues = []
    let new_leagues = []


    let leagues_user_db = await app.get('leagues_table')[req.query.season].findAll({
        where: {
            league_id: {
                [Op.in]: league_ids
            }
        }
    })

    leagues_user_db = leagues_user_db.map(league => league.dataValues)
    const leagues_up_to_date = leagues_user_db.filter(l_db => l_db.updatedAt >= cutoff)
    const leagues_to_update = leagues_user_db.filter(l_db => l_db.updatedAt < cutoff)
    const leagues_to_add = league_ids
        .filter(l => !leagues_user_db.find(l_db => l_db.league_id === l))

    let j = 0;
    const increment_new = 50;

    while (j < leagues_to_add?.length) {
        let new_leagues_batch = []

        await Promise.all(leagues_to_add
            .slice(j, Math.min(j + increment_new, leagues_to_add.length))
            .map(async league_to_add => {
                let league, users, rosters;
                try {
                    [league, users, rosters, drafts] = await Promise.all([
                        await axios.get(`https://api.sleeper.app/v1/league/${league_to_add}`),
                        await axios.get(`https://api.sleeper.app/v1/league/${league_to_add}/users`),
                        await axios.get(`https://api.sleeper.app/v1/league/${league_to_add}/rosters`),
                        await axios.get(`https://api.sleeper.app/v1/league/${league_to_add}/drafts`),
                    ])
                } catch (error) {
                    console.log(error)
                }

                const weeks = (state.league_season === req.query.season && state.season_type === 'regular') ? state.week
                    : state.league_season > req.query.season ? 18
                        : 0

                let matchups = {};

                await Promise.all(Array.from(Array(weeks).keys()).map(async key => {
                    let matchups_prev_week;
                    try {
                        matchups_prev_week = await axios.get(`https://api.sleeper.app/v1/league/${league_to_add}/matchups/${key + 1}`)
                    } catch (error) {
                        console.log({
                            code: error.code,
                            message: error.message,
                            stack: error.stack
                        })
                    }
                    matchups[`matchups_${key + 1}`] = matchups_prev_week?.data || []
                }))

                const new_league = {
                    league_id: league_to_add,
                    name: league.data.name,
                    avatar: league.data.avatar,
                    best_ball: league.data.settings.best_ball,
                    type: league.data.settings.type,
                    settings: league.data.settings,
                    scoring_settings: league.data.scoring_settings,
                    roster_positions: league.data.roster_positions,
                    users: users.data.map(user => user.user_id),
                    rosters: rosters.data
                        ?.sort((a, b) => b.settings?.wins - a.settings.wins || b.settings.fpts - a.settings.fpts)
                        ?.map((roster, index) => {
                            const user = users.data.find(u => u.user_id === roster.owner_id)
                            return {
                                rank: index + 1,
                                taxi: roster.taxi,
                                starters: roster.starters,
                                settings: roster.settings,
                                roster_id: roster.roster_id,
                                reserve: roster.reserve,
                                players: roster.players,
                                user_id: roster.owner_id,
                                username: user?.display_name,
                                avatar: user?.avatar,
                                co_owners: roster.co_owners?.map(co => {
                                    const co_user = users.data.find(u => u.user_id === co)
                                    return {
                                        user_id: co_user?.user_id,
                                        username: co_user?.display_name,
                                        avatar: co_user?.avatar
                                    }
                                })
                            }
                        }),
                    drafts: drafts.data.map(draft => {
                        return {
                            draft_id: draft.draft_id,
                            status: draft.status,
                            rounds: draft.settings.rounds,
                            draft_order: draft.draft_order
                        }
                    }),
                    ...matchups
                }

                let new_leagues_updated = app.get('new_leagues')
                if (!Object.keys(new_leagues_updated).includes(req.query.season)) {
                    new_leagues_updated[req.query.season] = {}
                }

                new_leagues_updated[req.query.season][new_league.league_id] = new_league

                app.set('new_leagues', new_leagues_updated)

                new_leagues_batch.push(new_league)

                if (!req.league_ids) {
                    new_leagues.push(new_league)
                } else {
                    new_leagues.push(new_league.league_id)
                }
            })
        )

        await app.get('leagues_table')[req.query.season].bulkCreate(new_leagues_batch, {
            ignoreDuplicates: true
        })

        j += increment_new
    }

    let i = 0;
    const increment = 250;

    while (i < leagues_to_update?.length) {
        let updated_leagues_batch = []

        await Promise.all(leagues_to_update
            .slice(i, Math.min(i + increment, leagues_to_update.length + 1))
            .map(async league_to_update => {
                const [league, users, rosters] = await Promise.all([
                    await axios.get(`https://api.sleeper.app/v1/league/${league_to_update.league_id}`),
                    await axios.get(`https://api.sleeper.app/v1/league/${league_to_update.league_id}/users`),
                    await axios.get(`https://api.sleeper.app/v1/league/${league_to_update.league_id}/rosters`)

                ])
                let drafts;

                if (!['in_season', 'complete'].includes(league_to_update.status)) {
                    drafts = await axios.get(`https://api.sleeper.app/v1/league/${league_to_update.league_id}/drafts`)
                }

                let matchups;

                if (req.query.season === state.league_season && state.week > 0 && state.week < 19 && state.season_type === 'regular') {
                    try {
                        matchups = await axios.get(`https://api.sleeper.app/v1/league/${league_to_update.league_id}/matchups/${state.week}`)
                    } catch (error) {
                        console.log(error)
                        matchups = {
                            data: []
                        }
                    }

                }
                const updated_league = {
                    league_id: league_to_update.league_id,
                    name: league.data.name,
                    avatar: league.data.avatar,
                    best_ball: league.data.settings.best_ball,
                    type: league.data.settings.type,
                    settings: league.data.settings,
                    scoring_settings: league.data.scoring_settings,
                    roster_positions: league.data.roster_positions,
                    users: users.data.map(user => user.user_id),
                    rosters: rosters.data
                        .sort((a, b) => b.settings?.wins - a.settings.wins || b.settings.fpts - a.settings.fpts)
                        .map((roster, index) => {
                            const user = users.data.find(u => u.user_id === roster.owner_id)
                            return {
                                rank: index + 1,
                                taxi: roster.taxi,
                                starters: roster.starters,
                                settings: roster.settings,
                                roster_id: roster.roster_id,
                                reserve: roster.reserve,
                                players: roster.players,
                                user_id: roster.owner_id,
                                username: user?.display_name,
                                avatar: user?.avatar,
                                co_owners: roster.co_owners?.map(co => {
                                    const co_user = users.data.find(u => u.user_id === co)
                                    return {
                                        user_id: co_user?.user_id,
                                        username: co_user?.display_name,
                                        avatar: co_user?.avatar
                                    }
                                })
                            }
                        }),
                    drafts: drafts?.data ? drafts.data.map(draft => {
                        return {
                            draft_id: draft.draft_id,
                            status: draft.status,
                            rounds: draft.settings.rounds,
                            draft_order: draft.draft_order
                        }
                    }) : league_to_update.drafts,
                    [`matchups_${state.week}`]: matchups?.data,
                    updatedAt: Date.now()
                }

                updated_leagues_batch.push(updated_league)

                if (!req.league_ids) {
                    updated_leagues.push(updated_league)
                } else {
                    updated_leagues.push(updated_league.league_id)
                }
            })
        )

        await app.get('leagues_table')[req.query.season].bulkCreate(updated_leagues_batch, {
            ignoreDuplicates: true
        })

        i += increment
    }


    return req.league_ids ? { new: new_leagues, updated: updated_leagues, up_to_date: leagues_up_to_date } : (
        [...leagues_up_to_date, ...updated_leagues, ...new_leagues]
            .map(league => {
                const userRoster = league.rosters.find(r => r.user_id === req.user_db.user_id || r.co_owners?.find(co => co?.user_id === req.user_db.user_id))
                return {
                    ...league,
                    index: league_ids.findIndex(l => {
                        return l === league.league_id
                    }),
                    userRoster: userRoster
                }
            })
            .filter(league => league.userRoster?.players?.length > 0)
            .sort((a, b) => a.index - b.index)
    )
}

module.exports = {
    getUser: getUser,
    updateUser: updateUser,
    updateUser_Leagues: updateUser_Leagues
}