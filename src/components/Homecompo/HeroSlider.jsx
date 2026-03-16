import React, { useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

// Icons as simple SVG components
const ChevronLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const Pause = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
  </svg>
);

const Play = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
  </svg>
);

const HeroSlider = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const swiperRef = useRef(null);

  // Sample hero images with titles and descriptions
  const slides = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      title: 'Discover Amazing Landscapes',
      description: 'Explore the most breathtaking views around the world',
      buttonText: 'Explore Now',
      buttonLink: '#'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?ixlib=rb-4.0.3&auto=format&fit=crop&w=1948&q=80',
      title: 'Adventure Awaits You',
      description: 'Start your journey with unforgettable experiences',
      buttonText: 'Get Started',
      buttonLink: '#'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1426604966841-d7adac402bff?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      title: 'Nature at Its Best',
      description: 'Immerse yourself in the beauty of nature',
      buttonText: 'Learn More',
      buttonLink: '#'
    }
  ];

  const toggleAutoplay = () => {
    if (swiperRef.current) {
      if (isPlaying) {
        swiperRef.current.autoplay.stop();
      } else {
        swiperRef.current.autoplay.start();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const goNext = () => {
    if (swiperRef.current) {
      swiperRef.current.slideNext();
    }
  };

  const goPrev = () => {
    if (swiperRef.current) {
      swiperRef.current.slidePrev();
    }
  };

  // Add custom animations
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-fade-in-up {
        animation: fadeInUp 0.8s ease-out forwards;
      }
      .animation-delay-200 {
        animation-delay: 0.2s;
        opacity: 0;
      }
      .animation-delay-400 {
        animation-delay: 0.4s;
        opacity: 0;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    // <div className="relative w-full h-screen overflow-hidden group">
        <div className="relative w-full h-[50vh] overflow-hidden group">

      {/* Swiper Component */}
      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectFade]}
        effect="fade"
        spaceBetween={0}
        slidesPerView={1}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        loop={true}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        className="w-full h-full"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className="relative w-full h-full">
              {/* Background Image */}
              <img
                src={slide.image}
                alt={slide.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-40" />
              
              {/* Content */}
              <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-4 text-center text-white">
                <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-fade-in-up">
                  {slide.title}
                </h1>
                <p className="text-lg md:text-xl mb-8 max-w-2xl animate-fade-in-up animation-delay-200">
                  {slide.description}
                </p>
                <a
                  href={slide.buttonLink}
                  className="px-8 py-3 bg-white text-gray-900 rounded-full font-semibold hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105 animate-fade-in-up animation-delay-400"
                >
                  {slide.buttonText}
                </a>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Navigation Buttons */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={goPrev}
          className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-opacity-40 transition-all duration-300 focus:outline-none"
          aria-label="Previous slide"
        >
          <ChevronLeft />
        </button>
      </div>
      
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={goNext}
          className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-opacity-40 transition-all duration-300 focus:outline-none"
          aria-label="Next slide"
        >
          <ChevronRight />
        </button>
      </div>

      {/* Play/Pause Button */}
      <div className="absolute bottom-24 right-4 z-20">
        <button
          onClick={toggleAutoplay}
          className="w-10 h-10 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-opacity-40 transition-all duration-300 focus:outline-none"
          aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
        >
          {isPlaying ? <Pause /> : <Play />}
        </button>
      </div>

      {/* Custom Pagination Styles */}
      <style>{`
        .swiper-pagination-bullet {
          background: white !important;
          opacity: 0.5;
        }
        .swiper-pagination-bullet-active {
          background: white !important;
          opacity: 1;
        }
        .swiper-pagination {
          bottom: 20px !important;
        }
      `}</style>
    </div>
  );
};

export default HeroSlider;