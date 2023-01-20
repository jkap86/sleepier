const bootServer = require("./bootServer")


const Playoffs_Scoring = async (axios, app) => {
    const state = await app.get('state')
    if (!state) {
        console.log('server boot not complete')
        return 1000
    }
    const rounds = ['Week_18', 'WC', 'DIV', 'CONF', 'SB']
    const week = state.season_type === 'post' ? state.week : state.week - 18
    let schedule = await app.get('schedule')
    if (!schedule) {
        let schedule = {}
        let i = week

        while (i >= 0) {
            const schedule_week = await axios.get(`https://api.myfantasyleague.com/${state.season}/export?TYPE=nflSchedule&W=${i + 18}&JSON=1`)
            schedule[rounds[i]] = schedule_week.data.nflSchedule.matchup
            i -= 1
        }
        await app.set('schedule', schedule)

        let player_scores = {}

        await Promise.all(Array.from(Array(4).keys())
            .slice(0, state.week + 1)
            .map(async key => {
                let scores_dict_week = {};
                let scores_week;
                if (key === 0) {
                    scores_week = await axios.get(`https://api.sleeper.com/stats/nfl/2022/18?season_type=regular`)
                } else {
                    scores_week = await axios.get(`https://api.sleeper.com/stats/nfl/2022/${key}?season_type=post`)
                }

                scores_week.data.map(player => {
                    return scores_dict_week[player.player_id] = {
                        id: player.player_id,
                        ...player.stats
                    }
                })

                player_scores[rounds[key]] = {
                    index: key,
                    ...scores_dict_week
                }
            }))

        app.set('playoffs_scoring', player_scores)
        return 5000
    }





    const games_in_progress = schedule[rounds[week]]
        ?.filter(m => m.gameSecondsRemaining !== "0" && m.gameSecondsRemaining !== "3600")

    const nextKickoff = Math.min(...schedule[rounds[week]].map(m => parseInt(m.kickoff)))
    if (games_in_progress.length === 0) {
        console.log('No Games in Progress..')


        return (nextKickoff * 1000) - Date.now()

    }

    console.log(`${games_in_progress.length} Games in Progress...`)









    return (60 * 1000)
}

module.exports = {
    Playoffs_Scoring: Playoffs_Scoring
}