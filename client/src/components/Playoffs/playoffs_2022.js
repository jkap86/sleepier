import React, { useEffect, useState } from "react";
import axios, { all } from 'axios';
import { useParams } from "react-router-dom";
import TableMain from "../Home/tableMain";
import PlayoffsBreakdown from "./playoffs_breakdown";
import { team_abbrev } from '../Functions/misc';

const Playoffs = () => {
    const params = useParams();
    const [isLoading, setIsLoading] = useState(false)
    const [league, setLeague] = useState({})
    const [scoring, setScoring] = useState({})
    const [itemActive, setItemActive] = useState('');

    const [allplayers, setAllPlayers] = useState({})
    const [stateWeek, setStateWeek] = useState(['WC'])
    const [optimalLineups, setOptimalLineups] = useState({})

    const getPlayerScore = (player_id, w) => {
        const scoring_settings = league.league.scoring_settings

        let total_points = parseFloat(0);

        const player_breakdown = scoring[w][player_id]
        const points_week = Object.keys(player_breakdown || {})
            .filter(x => Object.keys(scoring_settings).includes(x))
            .reduce((acc, cur) => acc + parseFloat(player_breakdown[cur]) * parseFloat(scoring_settings[cur]), 0)

        total_points += parseFloat(points_week)

        return parseFloat(total_points).toFixed(2)
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
                    points: optimal_player?.points
                })
            })

        return optimalLineup_week
    }

    const start_week = stateWeek.sort((a, b) => league.schedule[a][0].kickoff - league.schedule[b][0].kickoff)[0]
    const recent_week = stateWeek.sort((a, b) => league.schedule[b][0].kickoff - league.schedule[a][0].kickoff)[0]
    let teams_left = []
    let teams_eliminated = []

    league.schedule && league.schedule[start_week]
        ?.map(matchup => {
            matchup.team.map(t => {
                return teams_left.push(team_abbrev[t.id] || t.id)
            })
        })
        ?.flat()

    stateWeek
        ?.filter(x => x !== 'Week_18')
        .map(week => {
            league.schedule && league.schedule[week]

                ?.map(matchup => {
                    if (matchup.gameSecondsRemaining === '0') {
                        const t = matchup.team.sort((a, b) => parseInt(a.score) - parseInt(b.score))[0]
                        return teams_eliminated.push(team_abbrev[t?.id] || t?.id)
                    }
                })
                ?.flat()
        })



    if (start_week === 'WC') {
        teams_left.push(...['KC', 'PHI'])
    }

    console.log({ teams_left: teams_left })
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            const scores = await axios.get('/playoffscores')
            console.log(scores)
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

        setOptimalLineups(optimalLineups_all)
    }, [league, scoring])

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
        let team_total = 0;
        stateWeek
            .map(week => {
                const week_total = optimal_lineup[week].reduce((acc, cur) => acc + parseFloat(cur.points), 0)
                team_total += week_total
            })

        return parseFloat(team_total)
    }

    const summary_headers = [
        [
            {
                text: 'Manager',
                colSpan: 4
            },
            {
                text: 'Points',
                colSpan: 2
            },
            {
                text: '# Left',
                colSpan: 1
            },
            {
                text: '# Elim',
                colSpan: 1
            }
        ]
    ]

    const summary_body = Object.keys(optimalLineups)
        .sort((a, b) => getRosterTotal(optimalLineups[b]) - getRosterTotal(optimalLineups[a]))
        .map(user_id => {
            const players_left = optimalLineups[user_id].players.filter(x => teams_left?.includes(allplayers[x]?.team))
            const players_eliminated = optimalLineups[user_id].players.filter(x => teams_eliminated?.includes(allplayers[x]?.team) || !teams_left.includes(allplayers[x]?.team))
            let total_optimal = {}

            stateWeek.map(week => {
                optimalLineups[user_id][week].map(slot => {
                    if (Object.keys(total_optimal).includes(slot.player)) {
                        total_optimal[slot.player].points += parseFloat(slot.points)
                    } else {
                        total_optimal[slot.player] = {
                            index: slot.index,
                            slot: slot.slot,
                            points: parseFloat(slot.points) || 0,
                            points_bench: '0.00'
                        }
                    }
                })
            })
            optimalLineups[user_id].players.filter(x => !Object.keys(total_optimal).includes(x)).map(player_id => {
                total_optimal[player_id] = {
                    index: players_left.includes(player_id) ? 999 : 1000,
                    slot: 'BN',
                    points: 0
                }
            })

            return {
                id: user_id,
                list: [
                    {
                        text: league.users.find(u => u.user_id === user_id)?.display_name || '-',
                        colSpan: 4
                    },
                    {
                        text: Object.keys(total_optimal).reduce((acc, cur) => acc + parseFloat(total_optimal[cur].points), 0).toFixed(2),
                        colSpan: 2
                    },
                    {
                        text: players_left.length.toString(),
                        colSpan: 1
                    },
                    {
                        text: players_eliminated.length.toString(),
                        colSpan: 1
                    }
                ],
                secondary_table: (
                    <PlayoffsBreakdown
                        total_optimal={total_optimal}
                        stateWeek={stateWeek}
                        allplayers={allplayers}
                        scoring={scoring}
                        schedule={league.schedule}
                        players_left={players_left}
                        players_eliminated={players_eliminated}
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