import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { login } from '../Functions/misc';
import sleeperLogo from '../../images/sleeper_icon.png';
import axios from 'axios';


const Homepage = () => {
    const [username, setUsername] = useState('')
    const [user_id, setUser_id] = useState(null)
    const [isLogin, setIsLogin] = useState(false)
    const [seasons_options, setSeasons_options] = useState([])
    const [season, setSeason] = useState('')

    const browser_type = Object.keys(window).includes('chrome') ? 'chrome'
        : Object.keys(window).includes('InstallTrigger') ? 'firefox'
            : Object.keys(window).includes('safari') ? 'safari'
                : null

    useEffect(() => {
        const fetchHome = async () => {
            const home = await axios.get('/home')
            setSeasons_options(home.data.seasons.sort((a, b) => b - a))
            setSeason(home.data.state.league_season)
        }
        fetchHome()
    }, [])

    const handleLogin = async () => {

    }

    return <div id='homepage'>
        <div className='home_wrapper'>
            <img
                alt='sleeper_logo'
                className='home'
                src={sleeperLogo}
            />

            <div className='home'>
                <strong className='home'>
                    Sleepier
                </strong>
                <div className='user_input'>
                    <input
                        className='home'
                        type="text"
                        placeholder="Username"
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <select
                        className='home click'
                        onChange={(e) => setSeason(e.target.value)}
                    >
                        {
                            seasons_options.map(s =>
                                <option
                                    key={s}
                                >
                                    {s}
                                </option>
                            )
                        }
                    </select>
                </div>
                <Link to={`/${username}/${season}`}>
                    <button
                        className='home click'
                    >
                        Submit
                    </button>
                </Link>
            </div>
        </div>
    </div>
}

export default Homepage;