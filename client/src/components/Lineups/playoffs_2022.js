import React, { useEffect, useState } from "react";
import axios from 'axios';
import { useParams } from "react-router-dom";
import TableMain from "../Home/tableMain";


const Playoffs = () => {
    const params = useParams();
    const [isLoading, setIsLoading] = useState(false)
    const [league, setLeague] = useState({})
    const [scoring, setScoring] = useState({})
    const [itemActive, setItemActive] = useState('');
    const [playerActive, setPlayerActive] = useState('')
    const [allplayers, setAllPlayers] = useState({})
    const [stateWeek, setStateWeek] = useState(['WC'])
    const [optimalLineups, setOptimalLineups] = useState({})

    const getPlayerScore = (player_id, w) => {
        const scoring_settings = league.league.scoring_settings

        let total_points = 0;

        const player_breakdown = scoring[w][player_id]
        const points_week = Object.keys(player_breakdown || {})
            .filter(x => Object.keys(scoring_settings).includes(x))
            .reduce((acc, cur) => acc + player_breakdown[cur] * scoring_settings[cur], 0)

        total_points += points_week

        return total_points.toFixed(2) || '0.00'
    }

    const getPlayerBreakdown = (player_id, w) => {
        const scoring_settings = league.league.scoring_settings

        let breakdown = {}
        const player_breakdown = scoring[w][player_id]
        Object.keys(player_breakdown || {})
            .filter(x => Object.keys(scoring_settings).includes(x))
            .map(key => {
                return breakdown[key] = Object.keys(breakdown).includes(key) ? breakdown[key] + (player_breakdown[key] * scoring_settings[key]) : (player_breakdown[key] * scoring_settings[key])
            })
        return breakdown
    }

    const getOptimalLineup = (roster, w) => {
        const position_map = {
            'QB': ['QB'],
            'RB': ['RB', 'FB'],
            'WR': ['WR'],
            'TE': ['TE'],
            'FLEX': ['RB', 'FB', 'WR', 'TE'],
            'SUPER_FLEX': ['QB', 'RB', 'FB', 'WR', 'TE'],
            'WRRB_FLEX': ['RB', 'FB', 'WR'],
            'REC_FLEX': ['WR', 'TE']
        }

        const position_abbrev = {
            'QB': 'QB',
            'RB': 'RB',
            'WR': 'WR',
            'TE': 'TE',
            'SUPER_FLEX': 'SF',
            'FLEX': 'WRT',
            'WRRB_FLEX': 'W R',
            'WRRB_WRT': 'W R',
            'REC_FLEX': 'W T'
        }

        const starting_slots = league.league.roster_positions?.filter(x => Object.keys(position_map).includes(x))

        let optimalLineup_week = []

        let players = []
        roster.players?.map(player_id => {
            players.push({
                id: player_id,
                points: getPlayerScore(player_id, w)
            })
        })

        starting_slots
            ?.sort((a, b) => position_map[a].length - position_map[b].length)
            ?.map((slot, index) => {
                const slot_options = players
                    .filter(x => position_map[slot].includes(allplayers[x.id]?.position))
                    .sort((a, b) => parseFloat(b.points) - parseFloat(a.points))

                const optimal_player = slot_options[0]
                players = players.filter(x => x.id !== optimal_player?.id)
                optimalLineup_week.push({
                    index: league.league.roster_positions.indexOf(slot) + index,
                    slot: position_abbrev[slot],
                    player: optimal_player?.id,
                    points: optimal_player?.points,
                    breakdown: getPlayerBreakdown(optimal_player?.id, w)
                })
            })

        return optimalLineup_week
    }





    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            const scores = await axios.get('/playoffscores')
            setScoring(scores.data.scoring)
            setAllPlayers(scores.data.allplayers)

            const league_data = await axios.get('/playoffs/league', {
                params: {
                    league_id: params.league_id
                }
            })

            setLeague(league_data.data)
            console.log(league_data.data)

            setIsLoading(false)
        }
        fetchData()

        const getScoringUpdates = setInterval(async () => {
            const scores = await axios.get('/playoffscores')
            setScoring(scores.data.scoring)
        }, 60 * 1000)

        return () => {
            clearInterval(getScoringUpdates)
        }
    }, [params.league_id])

    useEffect(() => {
        let optimalLineups_all = {}

        league.rosters?.map(roster => {
            let optimalLineups_user = {}
            Object.keys(scoring).map(week => {
                const optimalLineup_week = getOptimalLineup(roster, week)
                optimalLineups_user[week] = optimalLineup_week
            })
            optimalLineups_all[roster.owner_id] = {
                ...optimalLineups_user,
                players: roster.players
            }
        })
        console.log(optimalLineups_all)
        setOptimalLineups(optimalLineups_all)
    }, [league, scoring])

    const tertiary_headers = [
        [
            {
                text: 'Category',
                colSpan: 5
            },
            {
                text: 'Points',
                colSpan: 2
            }
        ]
    ]

    const secondary_headers = [
        [

            {
                text: 'Pos',
                colSpan: 1
            },
            {
                text: 'Player',
                colSpan: 4
            },
            {
                text: 'Points',
                colSpan: 2
            }
        ]
    ]

    const summary_headers = [
        [
            {
                text: 'Manager',
                colSpan: 5
            },
            {
                text: 'Points',
                colSpan: 2
            }
        ]
    ]

    /*
        const summary_body = league.rosters
            ?.sort((a, b) => b.players.reduce((acc, cur) => acc + parseFloat(getPlayerScore(cur)), 0) - a.players.reduce((acc, cur) => acc + parseFloat(getPlayerScore(cur)), 0))
            ?.map(roster => {
                const secondary_body = roster.players
                    ?.sort((a, b) => parseFloat(getPlayerScore(b)) - parseFloat(getPlayerScore(a)))
                    ?.map(player_id => {
                        const breakdown = getPlayerBreakdown(player_id) || {}
                        const tertiary_body = Object.keys(breakdown || {})
                            ?.map(key => {
                                return {
                                    id: key,
                                    list: [
                                        {
                                            text: key,
                                            colSpan: 5
                                        },
                                        {
                                            text: breakdown[key].toFixed(2),
                                            colSpan: 2
                                        }
                                    ]
                                }
                            })
    
                        return {
                            id: player_id,
                            list: [
                                {
                                    text: allplayers[player_id]?.full_name,
                                    colSpan: 5
                                },
                                {
                                    text: getPlayerScore(player_id),
                                    colSpan: 2
                                }
                            ],
                            secondary_table: (
                                <TableMain
                                    type={'tertiary'}
                                    headers={tertiary_headers}
                                    body={tertiary_body}
                                />
                            )
                        }
                    })
    
                return {
                    id: roster.roster_id,
                    list: [
                        {
                            text: league.users.find(u => u.user_id === roster.owner_id)?.display_name || '-',
                            colSpan: 5
                        },
                        {
                            text: roster.players.reduce((acc, cur) => acc + parseFloat(getPlayerScore(cur)), 0).toFixed(2) || '0.00',
                            colSpan: 2
                        }
                    ],
                    secondary_table: (
                        <>
                            <div className="secondary nav">
                                {
                                    Array.from(new Set(roster.players.map(player_id => allplayers[player_id]?.team)))
                                        .sort((a, b) => roster.players.filter(player_id => allplayers[player_id]?.team === b).length - roster.players.filter(player_id => allplayers[player_id]?.team === a).length)
                                        .map(team =>
                                            <button className="active small">
                                                {team}: {roster.players.filter(player_id => allplayers[player_id]?.team === team).length}
                                            </button>
                                        )
                                }
                            </div>
                            <TableMain
                                type={'secondary'}
                                headers={secondary_headers}
                                body={secondary_body}
                                itemActive={playerActive}
                                setItemActive={setPlayerActive}
                            />
                        </>
                    )
                }
            })
    */

    const getRosterTotal = (optimal_lineup) => {
        const team_total = stateWeek
            .map(week => {
                return optimal_lineup[week].reduce((acc, cur) => acc + parseFloat(cur.points), 0)
            })

        return team_total
    }

    const summary_body = Object.keys(optimalLineups)
        .sort((a, b) => getRosterTotal(optimalLineups[b]) - getRosterTotal(optimalLineups[a]))
        .map(user_id => {
            let total_optimal = {}

            stateWeek.map(week => {
                optimalLineups[user_id][week].map(slot => {
                    if (Object.keys(total_optimal).includes(slot.player)) {
                        total_optimal[slot.player].points += parseFloat(slot.points)
                    } else {
                        total_optimal[slot.player] = {
                            index: slot.index,
                            slot: slot.slot,
                            points: parseFloat(slot.points) || '0.00',
                            points_bench: '0.00'
                        }
                    }
                })
                optimalLineups[user_id].players
                    .filter(x => !Object.keys(total_optimal).includes(x))
                    .map(player_id => {
                        if (Object.keys(total_optimal).includes(player_id)) {
                            total_optimal[player_id].points_bench += parseFloat(getPlayerScore(player_id, week))
                        } else {
                            total_optimal[player_id] = {
                                index: 999,
                                slot: 'BN',
                                points: '0.00',
                                points_bench: getPlayerScore(player_id, week) || '0.00'
                            }
                        }

                    })
            })


            const secondary_body = Object.keys(total_optimal)
                .sort(
                    (a, b) => stateWeek.length === 1 ?
                        (total_optimal[a].index - total_optimal[b].index)
                        : total_optimal[b].points - total_optimal[a].points

                )
                .map(player_id => {

                    return {
                        id: player_id,
                        list: [
                            {
                                text: stateWeek.length === 1 ? total_optimal[player_id].slot : allplayers[player_id]?.position,
                                colSpan: 1
                            },
                            {
                                text: allplayers[player_id]?.full_name,
                                colSpan: 4
                            },
                            {
                                text: total_optimal[player_id].points,
                                colSpan: 2
                            }
                        ]
                    }
                })

            return {
                id: user_id,
                list: [
                    {
                        text: league.users.find(u => u.user_id === user_id)?.display_name || '-',
                        colSpan: 5
                    },
                    {
                        text: Object.keys(total_optimal).reduce((acc, cur) => acc + parseFloat(total_optimal[cur].points), 0).toFixed(2),
                        colSpan: 2
                    }
                ],
                secondary_table: (
                    <TableMain
                        type={'secondary'}
                        headers={secondary_headers}
                        body={secondary_body}
                        itemActive={playerActive}
                        setItemActive={setPlayerActive}
                    />
                )
            }
        })

    return isLoading ? 'Loading' : <>

        <h1>{league.league?.name}</h1>
        <div className="primary nav">
            {
                Object.keys(scoring)
                    .sort((a, b) => scoring[a].index - scoring[b].index)
                    .map((key, index) =>
                        <button
                            key={key}
                            className={stateWeek.includes(key) ? 'active click' : 'click'}
                            onClick={stateWeek.includes(key) ? () => setStateWeek(prevState => prevState.filter(x => x !== key)) : () => setStateWeek(prevState => [...prevState, key])}
                        >
                            {key.replace('_', ' ')}
                        </button>
                    )
            }
        </div>
        <TableMain
            type={'main'}
            headers={summary_headers}
            body={summary_body}
            itemActive={itemActive}
            setItemActive={setItemActive}
        />
    </>
}

export default Playoffs;