import React, { useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade, Parallax } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

const HeroSlider = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const swiperRef = useRef(null);

  const slides = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2070&q=80',
      subtitle: 'PREMIUM EXPERIENCE',
      title: 'Discover Amazing Landscapes',
      description: 'Explore the most breathtaking views around the world with our curated travel guides.',
      buttonText: 'Explore Now',
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1948&q=80',
      subtitle: 'ADVENTURE AWAITS',
      title: 'Journey Into The Wild',
      description: 'Start your journey with unforgettable experiences that redefine boundaries.',
      buttonText: 'Get Started',
    },
  ];

  const toggleAutoplay = () => {
    if (swiperRef.current) {
      isPlaying ? swiperRef.current.autoplay.stop() : swiperRef.current.autoplay.start();
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="relative w-full h-[70vh] md:h- overflow-hidden bg-[#0d0d0d] font-sans">
      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectFade, Parallax]}
        effect="fade"
        speed={1000}
        parallax={true}
        autoplay={{ delay: 6000, disableOnInteraction: false }}
        pagination={{ clickable: true, dynamicBullets: true }}
        loop={true}
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        className="w-full h-full"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className="relative w-full h-full overflow-hidden">
              {/* Image with Ken Burns Effect */}
              <img
                src={slide.image}
                alt={slide.title}
                className="absolute inset-0 w-full h-full object-cover scale-110 animate-kenburns"
              />
              
              {/* Sophisticated Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-black/30" />
              
              {/* Content Container */}
              <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-6 text-center text-white">
                <span className="block text-amber-500 font-bold tracking-[0.3em] text-xs md:text-sm mb-4 animate-fadeIn">
                  {slide.subtitle}
                </span>
                
                <h1 
                  data-swiper-parallax="-300"
                  className="text-4xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight drop-shadow-2xl max-w-5xl"
                >
                  {slide.title}
                </h1>
                
                <p 
                  data-swiper-parallax="-500"
                  className="text-sm md:text-lg lg:text-xl mb-10 max-w-2xl text-gray-300 font-light leading-relaxed"
                >
                  {slide.description}
                </p>
                
                <div data-swiper-parallax="-700">
                  <button className="group relative px-10 py-4 bg-[#f7a221] text-black font-bold uppercase tracking-wider overflow-hidden transition-all duration-300 hover:pr-14 active:scale-95">
                    <span className="relative z-10">{slide.buttonText}</span>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      →
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Play/Pause Minimalist UI */}
      <div className="absolute bottom-10 right-10 z-30 hidden md:block">
        <button
          onClick={toggleAutoplay}
          className="p-3 border border-white/20 rounded-full text-white hover:bg-white/10 transition-colors"
        >
          {isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>
      </div>

      <style>{`
        @keyframes kenburns {
          0% { transform: scale(1); }
          100% { transform: scale(1.15); }
        }
        .animate-kenburns {
          animation: kenburns 10s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
        .swiper-pagination-bullet {
          background: #f7a221 !important;
          width: 12px !important;
          height: 12px !important;
          margin: 0 6px !important;
        }
        .swiper-pagination {
          bottom: 40px !important;
        }
        @media (max-width: 768px) {
          .swiper-pagination {
            bottom: 20px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default HeroSlider;

// import { Heart, Plus, ShoppingCart, X } from 'lucide-react';
// import React, { useEffect, useRef, useState } from 'react';
// import { toast } from "react-toastify";

// // --- CONSTANTS ---
// const PRODUCTS = [
//   { id: 1, name: "Cloud Runner", price: "$120", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600", x: 10, y: 15 },
//   { id: 2, name: "Apex Watch", price: "$350", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600", x: 60, y: 10 },
//   { id: 3, name: "Noir Shades", price: "$180", img: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=600", x: 20, y: 55 },
//   { id: 4, name: "Sonic Buds", price: "$210", img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600", x: 70, y: 60 },
//     { id: 5, name: "Apex Watch", price: "$350", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600", x: 60, y: 10 },
//   { id: 6, name: "Noir Shades", price: "$180", img: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=600", x: 20, y: 55 },
//     { id: 7, name: "Apex Watch", price: "$350", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600", x: 60, y: 10 },
//   { id: 8, name: "Noir Shades", price: "$180", img: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=600", x: 20, y: 55 },
//     { id: 9, name: "Apex Watch", price: "$350", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600", x: 60, y: 10 },
//   { id: 10, name: "Noir Shades", price: "$180", img: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=600", x: 20, y: 55 },
//     { id: 11, name: "Apex Watch", price: "$350", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600", x: 60, y: 10 },
//   { id: 12, name: "Noir Shades", price: "$180", img: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=600", x: 20, y: 55 },
//     { id: 13, name: "Apex Watch", price: "$350", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600", x: 60, y: 10 },
//   { id: 14, name: "Noir Shades", price: "$180", img: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=600", x: 20, y: 55 },
//     { id: 15, name: "Apex Watch", price: "$350", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600", x: 60, y: 10 },
// ];

// const FloatingCard = ({ product, topZ, setTopZ }) => {
//   const cardRef = useRef(null);
//   const [localZ, setLocalZ] = useState(10);
//   const pos = useRef({ x: product.x, y: product.y, vx: 0, vy: 0 });
//   const isDragging = useRef(false);
//   const lastMouse = useRef({ x: 0, y: 0 });
//   const [showActions, setShowActions] = useState(false);
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const holdTimer = useRef(null);

//   useEffect(() => {
//     const card = cardRef.current;
//     let rafId;

//     const updatePhysics = () => {
//       if (!isDragging.current) {
//         pos.current.vx *= 0.94;
//         pos.current.vy *= 0.94;
//         pos.current.x += pos.current.vx;
//         pos.current.y += pos.current.vy;

//         // Dynamic boundaries for all screen widths
//         const maxX = window.innerWidth < 768 ? 40 : 80; 
//         if (pos.current.x < 0) { pos.current.x = 0; pos.current.vx *= -1; }
//         if (pos.current.x > maxX) { pos.current.x = maxX; pos.current.vx *= -1; }
//         if (pos.current.y < 5) { pos.current.y = 5; pos.current.vy *= -1; }
//         if (pos.current.y > 75) { pos.current.y = 75; pos.current.vy *= -1; }

//         card.style.transform = `translate3d(${pos.current.x}vw, ${pos.current.y}vh, 0) rotateX(${pos.current.vy * 3}deg) rotateY(${pos.current.vx * 3}deg)`;
//       }
//       rafId = requestAnimationFrame(updatePhysics);
//     };

//     rafId = requestAnimationFrame(updatePhysics);
//     return () => cancelAnimationFrame(rafId);
//   }, []);

//   const handleStart = (e) => {
//     isDragging.current = true;
//     setShowActions(false);
//     const newZ = topZ + 1;
//     setTopZ(newZ);
//     setLocalZ(newZ);

//     holdTimer.current = setTimeout(() => {
//         if (isDragging.current) setShowActions(true);
//     }, 500);

//     const clientX = e.touches ? e.touches[0].clientX : e.clientX;
//     const clientY = e.touches ? e.touches[0].clientY : e.clientY;
//     lastMouse.current = { x: clientX, y: clientY };
//   };

//   const handleMove = (e) => {
//     if (!isDragging.current) return;
//     const clientX = e.touches ? e.touches[0].clientX : e.clientX;
//     const clientY = e.touches ? e.touches[0].clientY : e.clientY;

//     const dx = ((clientX - lastMouse.current.x) / window.innerWidth) * 100;
//     const dy = ((clientY - lastMouse.current.y) / window.innerHeight) * 100;

//     pos.current.x += dx;
//     pos.current.y += dy;
//     pos.current.vx = dx;
//     pos.current.vy = dy;

//     cardRef.current.style.transform = `translate3d(${pos.current.x}vw, ${pos.current.y}vh, 0) scale(1.05)`;
//     lastMouse.current = { x: clientX, y: clientY };

//     if (Math.abs(dx) > 0.2 || Math.abs(dy) > 0.2) clearTimeout(holdTimer.current);
//   };

//   const handleEnd = () => {
//     isDragging.current = false;
//     clearTimeout(holdTimer.current);
//   };

//   const toggleMenu = (e) => {
//     e.stopPropagation();
//     setIsMenuOpen(!isMenuOpen);
//   };

//   const handleHeart = (e) => {
//     e.stopPropagation();
//     toast.info("Added to Wishlist!");
//   };

//   const handleCart = (e) => {
//     e.stopPropagation();
//     toast.success("Added to Cart!");
//   };

//   return (
//     <div
//       ref={cardRef}
//       onMouseDown={handleStart}
//       onTouchStart={handleStart}
//       onMouseMove={handleMove}
//       onTouchMove={handleMove}
//       onMouseUp={handleEnd}
//       onMouseLeave={handleEnd}
//       onTouchEnd={handleEnd}
//       className="absolute w-44 md:w-64 bg-white p-2 md:p-3 rounded-2xl shadow-2xl select-none cursor-grab active:cursor-grabbing border border-zinc-100 will-change-transform"
//       style={{
//         zIndex: localZ,
//         touchAction: 'none',
//         left: 0, top: 0
//       }}
//     >
//       <div className="relative overflow-hidden rounded-xl bg-zinc-100">
//         <img src={product.img} alt={product.name} className="w-full h-32 md:h-56 object-cover pointer-events-none" />
        
//         {/* Price on Left Side of Image */}
//         <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded-md text-[10px] md:text-xs font-bold backdrop-blur-sm pointer-events-none">
//           {product.price}
//         </div>

//         <div className={`absolute inset-0 bg-zinc-900/90 backdrop-blur-md flex flex-col items-center justify-center gap-3 transition-all duration-300 ${showActions ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
//              <button onClick={handleCart} className="bg-yellow-600 text-white text-[10px] font-black uppercase px-6 py-2 rounded-full hover:scale-105 active:scale-95">Add to Cart</button>
//              <button onClick={handleHeart} className="bg-white text-zinc-900 text-[10px] font-black uppercase px-6 py-2 rounded-full hover:scale-105 active:scale-95">Wishlist</button>
//              <button onClick={() => setShowActions(false)} className="text-white/40 text-[8px] font-bold uppercase tracking-widest mt-2">Close</button>
//         </div>
//       </div>
      
//       {/* Footer Area with Plus/Menu Toggle */}
//       <div className="mt-4 flex justify-center items-center h-10 relative">
//         {/* Expanding Icons Container */}
//         <div className="flex items-center justify-center w-full">
//             {/* Heart Icon (Slides Left) */}
//             <button 
//               onClick={handleHeart}
//               className={`absolute transition-all cursor-pointer duration-300 p-2 bg-zinc-100 rounded-full hover:text-red-500 z-10 ${isMenuOpen ? '-translate-x-12 opacity-100' : 'translate-x-0 opacity-0 pointer-events-none'}`}
//             >
//               <Heart size={16} />
//             </button>

//             {/* Toggle Plus/X Icon (Center) */}
//             <button 
//               onClick={toggleMenu}
//               className={`z-20 p-2 rounded-full cursor-pointer transition-all duration-300 shadow-md ${isMenuOpen ? 'bg-zinc-900 text-white rotate-90' : 'bg-yellow-600 text-white'}`}
//             >
//               {isMenuOpen ? <X size={20} /> : <Plus size={20} />}
//             </button>

//             {/* Cart Icon (Slides Right) */}
//             <button 
//               onClick={handleCart}
//               className={`absolute transition-all cursor-pointer duration-300 p-2 bg-zinc-100 rounded-full hover:text-yellow-600 z-10 ${isMenuOpen ? 'translate-x-12 opacity-100' : 'translate-x-0 opacity-0 pointer-events-none'}`}
//             >
//               <ShoppingCart size={16} />
//             </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default function InteractiveBazaar() {
//   const [topZ, setTopZ] = useState(100);

//   return (
//     <main className="bg-white overflow-x-hidden font-sans">
//       <section className="relative w-full h-screen overflow-hidden bg-zinc-50 z-20 border-b border-zinc-200">
//         <div className="absolute top-20 left-6 md:left-20 z-0 select-none">
//           <h1 className="text-5xl md:text-[8vw] font-black text-zinc-900 tracking-tighter uppercase leading-[0.8]">
//             OFFERS <br /> <span className="text-yellow-600">KE BADSHAH</span>
//           </h1>
//           <div className="flex items-center gap-3 mt-6">
//               <div className="w-12 h-[2px] bg-yellow-600" />
//               <p className="text-zinc-500 text-[10px] md:text-xs font-black tracking-[0.4em] uppercase">Drag to discover • Hold to buy</p>
//           </div>
//         </div>

//         <div className="relative w-full h-full">
//           {PRODUCTS.map(p => (
//             <FloatingCard key={p.id} product={p} topZ={topZ} setTopZ={setTopZ} />
//           ))}
//         </div>

//         <div className="absolute bottom-10 right-10 pointer-events-none opacity-[0.03] z-0 select-none">
//            <span className="text-[25vw] font-black text-black leading-none">2026</span>
//         </div>
//       </section>

//       <style>{`
//         body { 
//             overscroll-behavior-y: contain; 
//             margin: 0;
//             padding: 0;
//             overflow-x: hidden;
//         }
//         .opacity-100 { transform: scale(1); }
//         .opacity-0 { transform: scale(0.9); }
//       `}</style>
//     </main>
//   );
// }

// import { Heart, Plus, ShoppingCart } from 'lucide-react';
// import React, { useEffect, useRef, useState } from 'react';

// // --- CONSTANTS ---
// const PRODUCTS = [
//   { id: 1, name: "Cloud Runner", price: "$120", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600", x: 10, y: 15 },
//   { id: 2, name: "Apex Watch", price: "$350", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600", x: 60, y: 10 },
//   { id: 3, name: "Noir Shades", price: "$180", img: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=600", x: 20, y: 55 },
//   { id: 4, name: "Sonic Buds", price: "$210", img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600", x: 70, y: 60 },
//     { id: 5, name: "Apex Watch", price: "$350", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600", x: 60, y: 10 },
//   { id: 6, name: "Noir Shades", price: "$180", img: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=600", x: 20, y: 55 },
//     { id: 7, name: "Apex Watch", price: "$350", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600", x: 60, y: 10 },
//   { id: 8, name: "Noir Shades", price: "$180", img: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=600", x: 20, y: 55 },
//     { id: 9, name: "Apex Watch", price: "$350", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600", x: 60, y: 10 },
//   { id: 10, name: "Noir Shades", price: "$180", img: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=600", x: 20, y: 55 },
//     { id: 11, name: "Apex Watch", price: "$350", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600", x: 60, y: 10 },
//   { id: 12, name: "Noir Shades", price: "$180", img: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=600", x: 20, y: 55 },
//     { id: 13, name: "Apex Watch", price: "$350", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600", x: 60, y: 10 },
//   { id: 14, name: "Noir Shades", price: "$180", img: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=600", x: 20, y: 55 },
//     { id: 15, name: "Apex Watch", price: "$350", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600", x: 60, y: 10 },

  
// ];

// const FloatingCard = ({ product, topZ, setTopZ }) => {
//   const cardRef = useRef(null);
//   const [localZ, setLocalZ] = useState(10);
//   const pos = useRef({ x: product.x, y: product.y, vx: 0, vy: 0 });
//   const isDragging = useRef(false);
//   const lastMouse = useRef({ x: 0, y: 0 });
//   const [showActions, setShowActions] = useState(false);
//   const holdTimer = useRef(null);

//   useEffect(() => {
//     const card = cardRef.current;
//     let rafId;

//     const updatePhysics = () => {
//       if (!isDragging.current) {
//         pos.current.vx *= 0.94;
//         pos.current.vy *= 0.94;
//         pos.current.x += pos.current.vx;
//         pos.current.y += pos.current.vy;

//         // Dynamic boundaries for all screen widths
//         const maxX = window.innerWidth < 768 ? 40 : 80; 
//         if (pos.current.x < 0) { pos.current.x = 0; pos.current.vx *= -1; }
//         if (pos.current.x > maxX) { pos.current.x = maxX; pos.current.vx *= -1; }
//         if (pos.current.y < 5) { pos.current.y = 5; pos.current.vy *= -1; }
//         if (pos.current.y > 75) { pos.current.y = 75; pos.current.vy *= -1; }

//         card.style.transform = `translate3d(${pos.current.x}vw, ${pos.current.y}vh, 0) rotateX(${pos.current.vy * 3}deg) rotateY(${pos.current.vx * 3}deg)`;
//       }
//       rafId = requestAnimationFrame(updatePhysics);
//     };

//     rafId = requestAnimationFrame(updatePhysics);
//     return () => cancelAnimationFrame(rafId);
//   }, []);

//   const handleStart = (e) => {
//     isDragging.current = true;
//     setShowActions(false);
//     const newZ = topZ + 1;
//     setTopZ(newZ);
//     setLocalZ(newZ);

//     holdTimer.current = setTimeout(() => {
//         if (isDragging.current) setShowActions(true);
//     }, 500);

//     const clientX = e.touches ? e.touches[0].clientX : e.clientX;
//     const clientY = e.touches ? e.touches[0].clientY : e.clientY;
//     lastMouse.current = { x: clientX, y: clientY };
//   };

//   const handleMove = (e) => {
//     if (!isDragging.current) return;
//     const clientX = e.touches ? e.touches[0].clientX : e.clientX;
//     const clientY = e.touches ? e.touches[0].clientY : e.clientY;

//     const dx = ((clientX - lastMouse.current.x) / window.innerWidth) * 100;
//     const dy = ((clientY - lastMouse.current.y) / window.innerHeight) * 100;

//     pos.current.x += dx;
//     pos.current.y += dy;
//     pos.current.vx = dx;
//     pos.current.vy = dy;

//     cardRef.current.style.transform = `translate3d(${pos.current.x}vw, ${pos.current.y}vh, 0) scale(1.05)`;
//     lastMouse.current = { x: clientX, y: clientY };

//     if (Math.abs(dx) > 0.2 || Math.abs(dy) > 0.2) clearTimeout(holdTimer.current);
//   };

//   const handleEnd = () => {
//     isDragging.current = false;
//     clearTimeout(holdTimer.current);
//   };

//   return (
//     <div
//       ref={cardRef}
//       onMouseDown={handleStart}
//       onTouchStart={handleStart}
//       onMouseMove={handleMove}
//       onTouchMove={handleMove}
//       onMouseUp={handleEnd}
//       onMouseLeave={handleEnd}
//       onTouchEnd={handleEnd}
//       className="absolute w-44 md:w-64 bg-white p-2 md:p-3 rounded-2xl shadow-2xl select-none cursor-grab active:cursor-grabbing border border-zinc-100 will-change-transform"
//       style={{
//         zIndex: localZ,
//         touchAction: 'none',
//         left: 0, top: 0
//       }}
//     >
//       <div className="relative overflow-hidden rounded-xl bg-zinc-100">
//         <img src={product.img} alt={product.name} className="w-full h-32 md:h-56 object-cover pointer-events-none" />
//         <div className={`absolute inset-0 bg-zinc-900/90 backdrop-blur-md flex flex-col items-center justify-center gap-3 transition-all duration-300 ${showActions ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
//              <button className="bg-yellow-600 text-white text-[10px] font-black uppercase px-6 py-2 rounded-full hover:scale-105 active:scale-95">Add to Cart</button>
//              <button className="bg-white text-zinc-900 text-[10px] font-black uppercase px-6 py-2 rounded-full hover:scale-105 active:scale-95">Wishlist</button>
//              <button onClick={() => setShowActions(false)} className="text-white/40 text-[8px] font-bold uppercase tracking-widest mt-2">Close</button>
//         </div>
//       </div>
//       <div className="mt-4 flex justify-between items-end px-1">
//         <div>
//           <h3 className="font-black text-zinc-900 uppercase tracking-tighter text-xs md:text-sm">{product.name}</h3>
//           <p className="text-yellow-600 font-bold text-[10px] md:text-xs">{product.price}</p>
//         </div>
//         <div className="bg-zinc-100 p-1.5 rounded-full flex items-center gap-1">
//             <Heart/>
//             <Plus/>
//             <ShoppingCart/>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default function InteractiveBazaar() {
//   const [topZ, setTopZ] = useState(100);

//   return (
//     <main className="bg-white overflow-x-hidden font-sans">
//       <section className="relative w-full h-screen overflow-hidden bg-zinc-50 z-20 border-b border-zinc-200">
//         <div className="absolute top-20 left-6 md:left-20 z-0 select-none">
//           <h1 className="text-5xl md:text-[8vw] font-black text-zinc-900 tracking-tighter uppercase leading-[0.8]">
//             OFFERS <br /> <span className="text-yellow-600">KE BADSHAH</span>
//           </h1>
//           <div className="flex items-center gap-3 mt-6">
//               <div className="w-12 h-[2px] bg-yellow-600" />
//               <p className="text-zinc-500 text-[10px] md:text-xs font-black tracking-[0.4em] uppercase">Drag to discover • Hold to buy</p>
//           </div>
//         </div>

//         <div className="relative w-full h-full">
//           {PRODUCTS.map(p => (
//             <FloatingCard key={p.id} product={p} topZ={topZ} setTopZ={setTopZ} />
//           ))}
//         </div>

//         <div className="absolute bottom-10 right-10 pointer-events-none opacity-[0.03] z-0 select-none">
//            <span className="text-[25vw] font-black text-black leading-none">2026</span>
//         </div>
//       </section>

//       {/* <section className="relative z-30 py-32 bg-zinc-900 text-center px-6">
//          <h2 className="text-white font-black text-4xl md:text-6xl uppercase tracking-tighter mb-10 leading-none">
//             New arrivals <br /> <span className="text-yellow-600">every week.</span>
//          </h2>
//          <p className="text-zinc-500 max-w-xl mx-auto mb-12 text-sm md:text-base font-medium">
//             Experience commerce in motion. Our interactive bazaar allows you to feel the weight of design before you ever hit checkout.
//          </p>
//          <button className="bg-yellow-600 text-white px-16 py-5 rounded-full font-black uppercase tracking-[0.2em] text-xs hover:bg-white hover:text-zinc-900 transition-all transform hover:scale-110 active:scale-95 shadow-2xl">
//             View Full Catalog
//          </button>
//       </section> */}

//       <style>{`
//         body { 
//             overscroll-behavior-y: contain; 
//             margin: 0;
//             padding: 0;
//             overflow-x: hidden;
//         }
//         .opacity-100 { transform: scale(1); }
//         .opacity-0 { transform: scale(0.9); }
//       `}</style>
//     </main>
//   );
// }
// import React, { useRef, useState } from 'react';
// import { Swiper, SwiperSlide } from 'swiper/react';
// import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';

// // Import Swiper styles
// import 'swiper/css';
// import 'swiper/css/pagination';
// import 'swiper/css/navigation';
// import 'swiper/css/effect-fade';

// // Icons as simple SVG components
// const ChevronLeft = () => (
//   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
//     <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
//   </svg>
// );

// const ChevronRight = () => (
//   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
//     <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
//   </svg>
// );

// const Pause = () => (
//   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
//     <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
//   </svg>
// );

// const Play = () => (
//   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
//     <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
//   </svg>
// );

// const HeroSlider = () => {
//   const [isPlaying, setIsPlaying] = useState(true);
//   const swiperRef = useRef(null);

//   // Sample hero images with titles and descriptions
//   const slides = [
//     {
//       id: 1,
//       image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
//       title: 'Discover Amazing Landscapes',
//       description: 'Explore the most breathtaking views around the world',
//       buttonText: 'Explore Now',
//       buttonLink: '#'
//     },
//     {
//       id: 2,
//       image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?ixlib=rb-4.0.3&auto=format&fit=crop&w=1948&q=80',
//       title: 'Adventure Awaits You',
//       description: 'Start your journey with unforgettable experiences',
//       buttonText: 'Get Started',
//       buttonLink: '#'
//     },
//     {
//       id: 3,
//       image: 'https://images.unsplash.com/photo-1426604966841-d7adac402bff?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
//       title: 'Nature at Its Best',
//       description: 'Immerse yourself in the beauty of nature',
//       buttonText: 'Learn More',
//       buttonLink: '#'
//     }
//   ];

//   const toggleAutoplay = () => {
//     if (swiperRef.current) {
//       if (isPlaying) {
//         swiperRef.current.autoplay.stop();
//       } else {
//         swiperRef.current.autoplay.start();
//       }
//       setIsPlaying(!isPlaying);
//     }
//   };

//   const goNext = () => {
//     if (swiperRef.current) {
//       swiperRef.current.slideNext();
//     }
//   };

//   const goPrev = () => {
//     if (swiperRef.current) {
//       swiperRef.current.slidePrev();
//     }
//   };

//   // Add custom animations
//   React.useEffect(() => {
//     const style = document.createElement('style');
//     style.textContent = `
//       @keyframes fadeInUp {
//         from {
//           opacity: 0;
//           transform: translateY(30px);
//         }
//         to {
//           opacity: 1;
//           transform: translateY(0);
//         }
//       }
//       .animate-fade-in-up {
//         animation: fadeInUp 0.8s ease-out forwards;
//       }
//       .animation-delay-200 {
//         animation-delay: 0.2s;
//         opacity: 0;
//       }
//       .animation-delay-400 {
//         animation-delay: 0.4s;
//         opacity: 0;
//       }
//     `;
//     document.head.appendChild(style);
//     return () => {
//       document.head.removeChild(style);
//     };
//   }, []);

//   return (
//     // <div className="relative w-full h-screen overflow-hidden group">
//         <div className="relative w-full h-[50vh] overflow-hidden group">

//       {/* Swiper Component */}
//       <Swiper
//         modules={[Autoplay, Pagination, Navigation, EffectFade]}
//         effect="fade"
//         spaceBetween={0}
//         slidesPerView={1}
//         autoplay={{
//           delay: 5000,
//           disableOnInteraction: false,
//         }}
//         pagination={{
//           clickable: true,
//           dynamicBullets: true,
//         }}
//         loop={true}
//         onSwiper={(swiper) => {
//           swiperRef.current = swiper;
//         }}
//         className="w-full h-full"
//       >
//         {slides.map((slide) => (
//           <SwiperSlide key={slide.id}>
//             <div className="relative w-full h-full">
//               {/* Background Image */}
//               <img
//                 src={slide.image}
//                 alt={slide.title}
//                 className="absolute inset-0 w-full h-full object-cover"
//               />
              
//               {/* Overlay */}
//               <div className="absolute inset-0 bg-black bg-opacity-40" />
              
//               {/* Content */}
//               <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-4 text-center text-white">
//                 <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-fade-in-up">
//                   {slide.title}
//                 </h1>
//                 <p className="text-lg md:text-xl mb-8 max-w-2xl animate-fade-in-up animation-delay-200">
//                   {slide.description}
//                 </p>
//                 <a
//                   href={slide.buttonLink}
//                   className="px-8 py-3 bg-white text-gray-900 rounded-full font-semibold hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105 animate-fade-in-up animation-delay-400"
//                 >
//                   {slide.buttonText}
//                 </a>
//               </div>
//             </div>
//           </SwiperSlide>
//         ))}
//       </Swiper>

//       {/* Custom Navigation Buttons */}
//       <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
//         <button
//           onClick={goPrev}
//           className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-opacity-40 transition-all duration-300 focus:outline-none"
//           aria-label="Previous slide"
//         >
//           <ChevronLeft />
//         </button>
//       </div>
      
//       <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
//         <button
//           onClick={goNext}
//           className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-opacity-40 transition-all duration-300 focus:outline-none"
//           aria-label="Next slide"
//         >
//           <ChevronRight />
//         </button>
//       </div>

//       {/* Play/Pause Button */}
//       <div className="absolute bottom-24 right-4 z-20">
//         <button
//           onClick={toggleAutoplay}
//           className="w-10 h-10 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-opacity-40 transition-all duration-300 focus:outline-none"
//           aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
//         >
//           {isPlaying ? <Pause /> : <Play />}
//         </button>
//       </div>

//       {/* Custom Pagination Styles */}
//       <style>{`
//         .swiper-pagination-bullet {
//           background: white !important;
//           opacity: 0.5;
//         }
//         .swiper-pagination-bullet-active {
//           background: white !important;
//           opacity: 1;
//         }
//         .swiper-pagination {
//           bottom: 20px !important;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default HeroSlider;