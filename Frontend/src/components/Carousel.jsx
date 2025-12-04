import React, { useEffect, useState } from 'react';
import { db } from '../firebase'; // Import db from firebase.js
import { collection, getDocs } from 'firebase/firestore'; // Import Firestore functions

import { Swiper, SwiperSlide } from 'swiper/react';


import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';

import { Pagination, Navigation, Autoplay } from 'swiper/modules';

export default function Carousel() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'carousel_slides'));
        const fetchedSlides = querySnapshot.docs.map(doc => doc.data().url);
        setSlides(fetchedSlides);
      } catch (err) {
        console.error("Error fetching carousel slides: ", err);
        setError("Failed to load carousel images.");
      } finally {
        setLoading(false);
      }
    };

    fetchSlides();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-2 sm:px-2 lg:px-2 py-4 text-center">
        <p>Loading carousel...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-2 sm:px-2 lg:px-2 py-4 text-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-2 sm:px-2 lg:px-2 py-4 text-center">
        <p>No carousel slides available.</p>
      </div>
    );
  }

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