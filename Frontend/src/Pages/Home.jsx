import React from 'react'
import Navbar from '../components/Navbar'
import FixNumber from './FixNumber'
import NextResultTimer from '../components/NextResultTimer'
import LiveBettingHighlights from '../components/LiveSlider'
import WinGame from './WinGame'
import CasinoRoulette from './SpinWheel'
import Footer from '../components/Footer'

import HarufGrid from './Haruf'

const Home = () => {
  return (
    <div>
      <NextResultTimer/>
      <LiveBettingHighlights/>
        <FixNumber/>
        <WinGame/>
<CasinoRoulette/>
<HarufGrid/>
<Footer/>
    </div>
  )
}

export default Home