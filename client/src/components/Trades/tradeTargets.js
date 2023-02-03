import TableMain from "../Home/tableMain";


const TradeTargets = ({
    trade,
    stateAllPlayers,
    stateTradePlayers
}) => {

    const trade_targets_headers = [
        [
            {
                text: 'Manager',
                colSpan: 2
            },
            {
                text: 'Player',
                colSpan: 3
            },
            {
                text: 'League',
                colSpan: 4
            }

        ]
    ]

    const trade_targets_body = trade.managers.map(manager => {
        return Object.keys(stateTradePlayers.owned[manager.user_id] || {})
            .filter(player_id => trade.adds && trade.adds[player_id])
            .map(player_id => {
                return stateTradePlayers.owned[manager.user_id][player_id]
                    .filter(league => league !== trade.league.name)
                    .map(league => {
                        return {
                            id: `${manager.user_id}_${player_id}_${league}`,
                            list: [[
                                {
                                    text: manager.username,
                                    colSpan: 2
                                },
                                {
                                    text: stateAllPlayers[player_id]?.full_name,
                                    colSpan: 3
                                },
                                {
                                    text: league,
                                    colSpan: 4
                                }
                            ]]
                        }
                    })
            })
    }).flat(2)

    return <>
        <TableMain
            type={'secondary'}
            headers={trade_targets_headers}
            body={trade_targets_body}
        />
    </>
}

export default TradeTargets;