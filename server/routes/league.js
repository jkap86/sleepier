const getPlayoffLeague = async (axios, league_id) => {
    const [league, rosters, users] = await Promise.all([
        await axios.get(`https://api.sleeper.app/v1/league/${league_id}`),
        await axios.get(`https://api.sleeper.app/v1/league/${league_id}/rosters`),
        await axios.get(`https://api.sleeper.app/v1/league/${league_id}/users`)
    ])

    return {
        league: league.data,
        rosters: rosters.data,
        users: users.data
    }
}

module.exports = {
    getPlayoffLeague: getPlayoffLeague
}