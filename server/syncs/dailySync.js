const { getAllPlayers } = require('../helpers/getAllPlayers');


const dailySync = (app, axios) => {
    const date = new Date()
    const tzOffset = date.getTimezoneOffset()
    const tzOffset_ms = tzOffset * 60 * 1000
    const date_tz = new Date(date + tzOffset_ms)
    const hour = date_tz.getHours()
    const minute = date_tz.getMinutes()

    let delay;
    if (hour < 3) {
        delay = (((3 - hour) * 60) + (60 - minute)) * 60 * 1000
    } else {
        delay = (((27 - hour) * 60) + (60 - minute)) * 60 * 1000
    }

    setTimeout(async () => {
        const state = await axios.get('https://api.sleeper.app/v1/state/nfl')
        app.set('state', state.data)

        const allplayers = await getAllPlayers(axios, state.data)
        app.set('allplayers', allplayers)
        console.log(`Daily Sync completed at ${new Date()}`)

        setInterval(async () => {

            const state = await axios.get('https://api.sleeper.app/v1/state/nfl')
            app.set('state', state.data)

            const allplayers = await getAllPlayers(axios, state.data)
            app.set('allplayers', allplayers)
            console.log(`Daily Sync completed at ${new Date()}`)

        }, 24 * 60 * 60 * 1 * 1000)

    }, delay)
    console.log(`Daily Sync in ${Math.floor(delay / (60 * 60 * 1000))} hours`)

}

module.exports = {
    dailySync: dailySync
}