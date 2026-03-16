
import React, { useState, useEffect } from 'react';

const BestSellers = () => {
  const products = [
    { 
      category: "Apparel", 
      name: "Classic Linen Shirt", 
      price: 2499, 
      img1: "https://images.pexels.com/photos/17791448/pexels-photo-17791448.jpeg?q=80&w=800"
    },
    { 
      category: "Home", 
      name: "Iconic Studio Lamp", 
      price: 4200, 
      img1: "https://images.pexels.com/photos/17791449/pexels-photo-17791449.jpeg?q=80&w=800"
    },
    { 
      category: "Fashion", 
      name: "Essential Silk Dress", 
      price: 6500, 
      img1: "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?q=80&w=800"
    },
    { 
      category: "Lifestyle", 
      name: "Artisan Ceramic Set", 
      price: 1850, 
      img1: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?q=80&w=800"
    }
  ];

  const [isVisible, setIsVisible] = useState(false);
  const [cardVisibility, setCardVisibility] = useState(Array(products.length).fill(false));

  useEffect(() => {
    // Trigger main section animation
    const timer = setTimeout(() => setIsVisible(true), 100);

    // Stagger card animations
    const cardTimers = products.map((_, index) => 
      setTimeout(() => {
        setCardVisibility(prev => {
          const newVis = [...prev];
          newVis[index] = true;
          return newVis;
        });
      }, 300 + (index * 200)) // Each card appears 200ms after the previous one
    );

    return () => {
      clearTimeout(timer);
      cardTimers.forEach(t => clearTimeout(t));
    };
  }, [products.length]);

  return (
    <section className="max-w-[1500px] mx-auto px-4 md:px-12 lg:px-20 py-12 md:py-20 font-sans">
      
      {/* HEADER SECTION */}
      <div className={`flex items-end justify-between mb-10 border-b border-zinc-100 pb-6 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="space-y-1">
          <h2 className="text-3xl md:text-5xl font-outfit tracking-tighter uppercase">
            Just   <span className="text-yellow-600 font-outfit">Arrived</span>
          </h2>
          <div className="flex items-center gap-2">
            <span className="w-4 h-[1px] bg-yellow-600"></span>
            <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-yellow-600 underline underline-offset-4">Community Favorites</p>
          </div>
        </div>
        <button className="hidden sm:block text-[9px] font-black uppercase tracking-widest bg-zinc-900 text-white px-6 py-3 hover:bg-yellow-600 transition-all">
          Explore All
        </button>
      </div>

      {/* PRODUCT GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-8">
        {products.map((product, index) => (
          <div 
            key={index} 
            className={`group flex flex-col cursor-pointer transition-all duration-1000 ease-out ${cardVisibility[index] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            
            {/* IMAGE AREA - SIMPLE SINGLE IMAGE */}
            <div style={{height:"310px" , width:"310px"}} className="relative aspect-[3/4] overflow-hidden bg-zinc-50 rounded-sm mb-4">
            
              {/* Single Static Image */}
              <img 
                src={product.img1} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
              
              {/* INTERACTIVE FLOATING BUTTONS */}
              <div className="absolute top-3 right-3 flex flex-col gap-2 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                <button className="w-9 h-9 bg-white/90 backdrop-blur-sm shadow-sm rounded-full flex items-center justify-center hover:bg-yellow-600 hover:text-white transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                <button className="w-9 h-9 bg-white/90 backdrop-blur-sm shadow-sm rounded-full flex items-center justify-center hover:bg-zinc-900 hover:text-white transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>

              {/* QUICK ADD ACTION */}
              {/* <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-10">
                 <button className="w-full py-3 bg-zinc-900 text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-yellow-600 transition-colors shadow-2xl">
                    Add To Bag
                 </button>
              </div> */}
            </div>

            {/* TEXT INFO: COMPACT & CLEAN */}
            <div className="space-y-1">
              <div className="flex justify-between items-start">
                <span className="text-[12px] font-black uppercase tracking-[0.2em] text-zinc-400">
                  {product.category}
                </span>
                <span className="text-[8px] font-bold text-yellow-600 uppercase">New Arrival</span>
              </div>
              <h3 className="text-[11px] md:text-xs font-black uppercase tracking-wider text-zinc-900 group-hover:text-yellow-600 transition-colors truncate">
                {product.name}
              </h3>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-sm md:text-base font-bold text-zinc-900">₹{product.price}</span>
                <span className="text-[8px] text-zinc-300 line-through font-bold">₹{product.price * 2}</span>
              </div>
                 <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full  transition-transform duration-500 ease-out z-10">
                 <button className="w-full py-3 bg-zinc-900 text-white text-[9px] font-black uppercase">
                    Add To Bag
                 </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MOBILE ONLY VIEW ALL */}
      <div className={`mt-10 sm:hidden transition-all duration-1000 ease-out delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <button className="w-full py-4 border-2 border-zinc-900 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-all">
          View All Best Sellers
        </button>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes slideUpFade {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-up {
          animation: slideUpFade 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>
    </section>
  );
};

export default BestSellers;

// import React, { useState, useEffect } from 'react';

// const BestSellers = () => {
//   const products = [
//     { 
//       category: "Apparel", 
//       name: "Classic Linen Shirt", 
//       price: 2499, 
//       img1: "https://images.pexels.com/photos/17791448/pexels-photo-17791448.jpeg?q=80&w=800"
//     },
//     { 
//       category: "Home", 
//       name: "Iconic Studio Lamp", 
//       price: 4200, 
//       img1: "https://images.pexels.com/photos/17791449/pexels-photo-17791449.jpeg?q=80&w=800"
//     },
//     { 
//       category: "Fashion", 
//       name: "Essential Silk Dress", 
//       price: 6500, 
//       img1: "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?q=80&w=800"
//     },
//     { 
//       category: "Lifestyle", 
//       name: "Artisan Ceramic Set", 
//       price: 1850, 
//       img1: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?q=80&w=800"
//     }
//   ];

//   const [isVisible, setIsVisible] = useState(false);
//   const [cardVisibility, setCardVisibility] = useState(Array(products.length).fill(false));

//   useEffect(() => {
//     // Trigger main section animation
//     const timer = setTimeout(() => setIsVisible(true), 100);

//     // Stagger card animations
//     const cardTimers = products.map((_, index) => 
//       setTimeout(() => {
//         setCardVisibility(prev => {
//           const newVis = [...prev];
//           newVis[index] = true;
//           return newVis;
//         });
//       }, 300 + (index * 200)) // Each card appears 200ms after the previous one
//     );

//     return () => {
//       clearTimeout(timer);
//       cardTimers.forEach(t => clearTimeout(t));
//     };
//   }, [products.length]);

//   return (
//     <section className="max-w-[1500px] mx-auto px-4 md:px-12 lg:px-20 py-12 md:py-20 font-sans">
      
//       {/* HEADER SECTION */}
//       <div className={`flex items-end justify-between mb-10 border-b border-zinc-100 pb-6 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
//         <div className="space-y-1">
//           <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">
//             Just <span className="text-yellow-600">Arrived</span>
//           </h2>
//           <div className="flex items-center gap-2">
//             <span className="w-4 h-[1px] bg-yellow-600"></span>
//             <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-yellow-600 underline underline-offset-4">Community Favorites</p>
//           </div>
//         </div>
//         <button className="hidden sm:block text-[9px] font-black uppercase tracking-widest bg-zinc-900 text-white px-6 py-3 hover:bg-yellow-600 transition-all">
//           Explore All
//         </button>
//       </div>

//       {/* PRODUCT GRID */}
//       <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-8">
//         {products.map((product, index) => (
//           <div 
//             key={index} 
//             className={`group flex flex-col cursor-pointer transition-all duration-1000 ease-out ${cardVisibility[index] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
//             style={{ transitionDelay: `${index * 100}ms` }}
//           >
            
//             {/* IMAGE AREA - SIMPLE SINGLE IMAGE */}
//             <div className="relative aspect-[3/4] overflow-hidden bg-zinc-50 rounded-sm mb-4">
              
//               {/* Single Static Image */}
//               <img 
//                 src={product.img1} 
//                 alt={product.name}
//                 className="w-full h-full object-cover"
//               />
              
//               {/* INTERACTIVE FLOATING BUTTONS */}
//               <div className="absolute top-3 right-3 flex flex-col gap-2 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 delay-100">
//                 <button className="w-9 h-9 bg-white/90 backdrop-blur-sm shadow-sm rounded-full flex items-center justify-center hover:bg-yellow-600 hover:text-white transition-all">
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
//                   </svg>
//                 </button>
//                 <button className="w-9 h-9 bg-white/90 backdrop-blur-sm shadow-sm rounded-full flex items-center justify-center hover:bg-zinc-900 hover:text-white transition-all">
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                   </svg>
//                 </button>
//               </div>

//               {/* QUICK ADD ACTION */}
//               <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-10">
//                  <button className="w-full py-3 bg-zinc-900 text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-yellow-600 transition-colors shadow-2xl">
//                     Add To Bag
//                  </button>
//               </div>
//             </div>

//             {/* TEXT INFO: COMPACT & CLEAN */}
//             <div className="space-y-1">
//               <div className="flex justify-between items-start">
//                 <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400">
//                   {product.category}
//                 </span>
//                 <span className="text-[8px] font-bold text-yellow-600 uppercase">New Arrival</span>
//               </div>
//               <h3 className="text-[11px] md:text-xs font-black uppercase tracking-wider text-zinc-900 group-hover:text-yellow-600 transition-colors truncate">
//                 {product.name}
//               </h3>
//               <div className="flex items-center gap-2 pt-0.5">
//                 <span className="text-sm md:text-base font-bold text-zinc-900">₹{product.price}</span>
//                 <span className="text-[8px] text-zinc-300 line-through font-bold">₹{product.price * 2}</span>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* MOBILE ONLY VIEW ALL */}
//       <div className={`mt-10 sm:hidden transition-all duration-1000 ease-out delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
//         <button className="w-full py-4 border-2 border-zinc-900 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-all">
//           View All Best Sellers
//         </button>
//       </div>

//       {/* Animation Styles */}
//       <style jsx>{`
//         @keyframes slideUpFade {
//           0% {
//             opacity: 0;
//             transform: translateY(30px);
//           }
//           100% {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
        
//         .animate-slide-up {
//           animation: slideUpFade 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
//         }
//       `}</style>
//     </section>
//   );
// };

// export default BestSellers;

