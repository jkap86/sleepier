const USER = require('../routes/user');

const leaguemateSync = async (app, axios) => {
    let interval = 1 * 60 * 1000


    setTimeout(async () => {
        await updateLeaguemates(app, axios)

        await leaguemateSync(app, axios)
        const used = process.memoryUsage()
        for (let key in used) {
            console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
        }
    }, interval)

}

const updateLeaguemates = async (app, axios) => {
    const state = app.get('state')
    const leaguemates = app.get('leaguemates')
    console.log(`updating leaguemates: ${Object.keys(leaguemates).reduce((acc, cur) => acc + Object.keys(leaguemates[cur]).length, 0)} to update`)

    let api_calls = 0
    let s = 0

    while (s < Object.keys(leaguemates).length) {
        const season = Object.keys(leaguemates)[s]


        while (api_calls < 300 && Object.keys(leaguemates[season]).length > 0) {

            const leaguemate_season = Object.keys(leaguemates[season]).sort((a, b) => a - b)[0]

            let lm_leagues = []

            const user_db = await USER.updateUser(axios, app, {
                user: {
                    user_id: leaguemate_season,
                    avatar: leaguemates[season][leaguemate_season]?.avatar,
                    username: leaguemates[season][leaguemate_season]?.username
                },
                query: {
                    season: season
                }
            })

            lm_leagues.push(user_db[`${season}_leagues`])

            const leagues_to_add = Array.from(new Set(lm_leagues.flat(2)))

            const added_leagues = await USER.updateUser_Leagues(axios, app, {
                league_ids: leagues_to_add,
                query: {
                    season: season
                }
            })

            api_calls += (added_leagues.updated.length * 5)
            api_calls += (added_leagues.new.length * ((season === state.season && state.season_type === 'regular') ? state.week : parseInt(season) > parseInt(state.season) ? 1 : 18))
            /*
                    let new_leagues = app.get('new_leagues')
                    if (!Object.keys(new_leagues).includes(req.query.season)) {
                        new_leagues[req.query.season] = []
                    }
            
                    app.set('new_leagues', {
                        ...new_leagues,
                        [season]: [...new_leagues[req.query.season]]
                    })
            */
            if (added_leagues.new.length > 0) {
                console.log({ username: leaguemates[season][leaguemate_season]?.username, added_leagues: added_leagues.new.length })
            }

            let leaguemates_pending = leaguemates
            delete leaguemates_pending[season][leaguemate_season]
            app.set('leaguemates', leaguemates_pending)

        }



        s += 1
    }

    console.log(`${Object.keys(leaguemates).reduce((acc, cur) => acc + Object.keys(leaguemates[cur]).length, 0)} Leaguemates remaining...`)
}

module.exports = {
    leaguemateSync: leaguemateSync
}