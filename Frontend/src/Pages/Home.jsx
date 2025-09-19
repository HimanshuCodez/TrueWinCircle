import React from 'react'
import Navbar from '../components/Navbar'
import FixNumber from './FixNumber'
import NextResultTimer from '../components/NextResultTimer'
import LiveBettingHighlights from '../components/LiveSlider'
import WinGame from './WinGame'
import CasinoRoulette from './SpinWheel'
import Footer from '../components/Footer'
import MarketCard from '../components/Cards.jsx/MarketCard'
import GaliCard from '../components/Cards.jsx/GaliCard'
import DisawarCard from '../components/Cards.jsx/Disawar'
import DhanKuberCard from '../components/Cards.jsx/DhanKuber'
import ShreeGaneshCard from '../components/Cards.jsx/ShreeGanesh'
import FaridabadCard from '../components/Cards.jsx/Faridabad'
import DelhiBazaarCard from '../components/Cards.jsx/DelhiBazaar'
import Carousel from '../components/Carousel'
import Marquee from '../components/Marquee'





const Home = () => {
  return (
    <div className='pt-20'>
      <Marquee/>
<Carousel/>
      <NextResultTimer/>
      <LiveBettingHighlights/>
      <div className='mb-5'>   <MarketCard/></div>
      <div className='mb-5'>   <DelhiBazaarCard/></div>

      <div className='mb-5'>   <GaliCard/></div>
      <div className='mb-5'>   <DisawarCard/></div>
      <div className='mb-5'>   <DhanKuberCard/></div>
      <div className='mb-5'>   <ShreeGaneshCard/></div>
      <div className='mb-5'>   <FaridabadCard/></div>
    
   
        <WinGame/>
<CasinoRoulette/>

<Footer/>
    </div>
  )
}

export default Home