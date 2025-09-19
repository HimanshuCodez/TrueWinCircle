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
  'https://t4.ftcdn.net/jpg/12/50/85/03/240_F_1250850356_aXSDOinHdxSR4sOOBvW7bvaJfKfeg3Kd.jpg', // 2:1 ratio
  'https://t4.ftcdn.net/jpg/11/85/78/71/240_F_1185787115_cPMhkdZ4IAMsRpVIddbNZY3FFLaNUi0Y.jpg',
  'https://as1.ftcdn.net/v2/jpg/06/82/84/34/1000_F_682843481_oT0Sf1vLt7OG9q2UbLMZWfTdbUqzU6GX.jpg',
  'https://t3.ftcdn.net/jpg/08/29/59/16/240_F_829591667_VPaDq5xCTFNx5rVm3d7qQjuWxv4JzSlJ.jpg',
];

export default function Carousel() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-4">
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