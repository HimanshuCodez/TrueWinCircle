import React from 'react'
import Navbar from '../components/Navbar'
import FixNumber from './FixNumber'
import NextResultTimer from '../components/NextResultTimer'
import LiveBettingHighlights from '../components/LiveSlider'
import WinGame from './WinGame'
import CasinoRoulette from './SpinWheel'
import Footer from '../components/Footer'

import HarufGrid from './Haruf'
import MarketCard from '../components/MarketCard'

const Home = () => {
  return (
    <div>
      <NextResultTimer/>

      <LiveBettingHighlights/>
      <div className='mb-10'>   <MarketCard/></div>
    
   
        <FixNumber/>
        <WinGame/>
<CasinoRoulette/>

<Footer/>
    </div>
  )
}

export default Home