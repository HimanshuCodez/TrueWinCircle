import React from 'react';
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';

// import required modules
import { Pagination, Navigation, Autoplay } from 'swiper/modules';

// Using images with a more standard aspect ratio
const slides = [
  'https://i.postimg.cc/76bn3FpN/wheel.jpg', // 2:1 ratio
  'https://i.postimg.cc/bN0ktYsV/eghit.jpg',
  'https://i.postimg.cc/44YTynFs/number.jpg',
  'https://i.postimg.cc/G2NVGJS2/ninty.jpg',
];

export default function Carousel() {
  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-2 lg:px-2 py-4">
      <Swiper
        // The 'h-56 sm:h-64 md:h-80 lg:h-96' classes make the carousel responsive in height
        className="mySwiper rounded-lg shadow-lg h-56 sm:h-64 md:h-80 lg:h-96"
        spaceBetween={30}
        centeredSlides={true}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
        }}
        navigation={true}
        modules={[Autoplay, Pagination, Navigation]}
        style={{
          '--swiper-navigation-color': '#fff',
          '--swiper-pagination-color': '#fff',
        }}
      >
        {slides.map((slideUrl, index) => (
          <SwiperSlide key={index}>
            <img 
              src={slideUrl} 
              alt={`Slide ${index + 1}`} 
              className="w-full h-full object-cover" // object-cover ensures the image fills the slide
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}