// import React, { useState, useRef } from 'react';
// import { ShoppingBag, Zap, Flame, Trophy, ArrowRight, Star, MessageSquare } from 'lucide-react';

// const HeroSection = () => {
//     const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
//     const sectionRef = useRef(null);
//       const phoneNumber = "919320001717";
//     const message = "Hello! Baba, let me into the Loot! I want VIP access. 🔥"; // Customize your message here, make sure to URL encode it if needed 
//           // WhatsApp SVG
//     const WhatsAppIcon = () => (
//         <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
//     );
//     const handleMouseMove = (e) => {
//         if (!sectionRef.current) return;
//         const rect = sectionRef.current.getBoundingClientRect();
//         setMousePos({
//             x: e.clientX - rect.left,
//             y: e.clientY - rect.top,
//         });
//     };

//     return (
//         <>
//             <style>
//                 {`
//                 /* FUSE BLINK EFFECT */
//                 @keyframes fuseBlink {
//                     0%, 100% { opacity: 1; text-shadow: 0 0 20px rgba(247,162,33,0.8); }
//                     10% { opacity: 0.4; text-shadow: none; }
//                     12% { opacity: 1; text-shadow: 0 0 20px rgba(247,162,33,0.8); }
//                     20% { opacity: 0.2; text-shadow: none; }
//                     22% { opacity: 1; }
//                 }
//                 .hover-fuse:hover { animation: fuseBlink 0.4s infinite; }

//                 /* STAR WAVE ANIMATION */
//                 @keyframes starWave {
//                     0%, 100% { transform: translateY(0); opacity: 1; color: #f7a221; }
//                     50% { transform: translateY(8px); opacity: 0.5; color: #ffffff; }
//                 }
//                 .star-animate { animation: starWave 1.5s ease-in-out infinite; }
                
//                 /* TROPHY BEND TRANSITIONS */
//                 .trophy-main { transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
//                 .trophy-side { opacity: 0; transition: all 0.4s ease-out; transform: scale(0) translateY(20px); }
//                 .parent-card:hover .trophy-side-left { opacity: 1; transform: scale(1) translateX(-35px) translateY(-10px) rotate(-45deg); }
//                 .parent-card:hover .trophy-side-right { opacity: 1; transform: scale(1) translateX(35px) translateY(-10px) rotate(45deg); }
//                 .parent-card:hover .trophy-main { transform: translateY(-15px) scale(1.1); }
//                 `}
//             </style>

//             <section 
//                 ref={sectionRef}
//                 onMouseMove={handleMouseMove}
//                 className="relative w-full min-h-screen lg:min-h-[90vh] p-4 md:p-8 lg:p-12 bg-[#050505] overflow-hidden flex flex-col justify-center"
//             >
//                 {/* INTERACTIVE GLOW */}
//                 <div 
//                     className="absolute inset-0 z-0 pointer-events-none opacity-40"
//                     style={{
//                         background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(247, 162, 33, 0.12), transparent 80%)`
//                     }}
//                 />

//                 <div className="relative z-10 max-w-[1500px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
                    
//                     {/* LEFT COLUMN: MAIN CONTENT */}
//                     <div className="lg:col-span-7 flex flex-col justify-between min-h-[500px] md:min-h-[600px] p-8 md:p-16 rounded-[3rem] bg-[#0a0a0a] border border-white/5 relative overflow-hidden group">
//                         <div className="space-y-6 relative z-10">
//                             <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
//                                 <span className="flex h-2 w-2 rounded-full bg-[#f7a221] animate-pulse"></span>
//                                 <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Wholesale Kingdom</span>
//                             </div>

//                             <h1 className="text-6xl md:text-8xl lg:text-[9rem] font-black text-white leading-[0.8] tracking-tighter">
//                                 LOOT <br />
//                                 <span className="text-transparent" style={{ WebkitTextStroke: '1.5px #f7a221' }}>HARDER.</span>
//                             </h1>
                            
//                             <p className="text-gray-400 text-base md:text-xl max-w-md font-medium leading-relaxed">
//                                 India's most aggressive prices on viral gadgets. Join the club of 10k+ smart shoppers.
//                             </p>
//                         </div>

//                         <div className="flex flex-wrap gap-4 relative z-10 mt-8">
//                             <button className="w-full md:w-auto px-10 py-5 bg-[#f7a221] text-black font-black rounded-2xl hover:bg-white transition-all duration-300 flex items-center justify-center gap-3 shadow-xl shadow-[#f7a221]/10 uppercase">
//                                 SHOP THE LOOT <ShoppingBag size={20} />
//                             </button>
//                             <button className="w-full md:w-auto px-8 py-5 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-all border border-white/10 uppercase text-xs tracking-widest">
//                                 BABA'S CATALOG
//                             </button>
//                         </div>
//                     </div>

//                     {/* RIGHT COLUMN: INTERACTIVE GRID */}
//                     <div className="lg:col-span-5 flex flex-col gap-4 lg:gap-6">
                        
//                         {/* 1. HOT DROPS CARD */}
//                         <div className="flex-1 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 flex items-center justify-between group cursor-default relative overflow-hidden">
//                             <div className="relative z-10">
//                                 <div className="bg-[#f7a221]/10 text-[#f7a221] p-3 rounded-2xl w-fit mb-4">
//                                     <Flame size={24} fill="currentColor" />
//                                 </div>
//                                 <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Hot Drops</h3>
//                                 <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Refreshed Every 24h</p>
//                             </div>
//         <div className="text-7xl md:text-9xl font-black text-[#f7a221] hover-fuse transition-all duration-300 select-none cursor-default">
//     #01
// </div>


//                         </div>

//                         {/* 2. STATS & RATING GRID */}
//                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                            
//                             {/* --- TROPHY EFFECT START --- */}
//                             <div className="parent-card bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-[#f7a221]/40 transition-all duration-500 cursor-pointer">
//                                 <div className="relative flex items-center justify-center mb-6 h-12 w-full">
//                                     {/* Left Bending Trophy */}
//                                     <Trophy className="trophy-side trophy-side-left absolute text-[#f7a221]/40" size={28} />
//                                     {/* Main Rising Trophy */}
//                                     <Trophy className="trophy-main text-[#f7a221] z-10" size={40} />
//                                     {/* Right Bending Trophy */}
//                                     <Trophy className="trophy-side trophy-side-right absolute text-[#f7a221]/40" size={28} />
//                                 </div>
//                                 <p className="text-4xl font-black text-white group-hover:text-[#f7a221] hover-fuse transition-colors">10K+</p>
//                                 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Looters Joined</p>
//                             </div>
//                             {/* --- TROPHY EFFECT END --- */}
                            
//                             {/* --- STAR WAVE START --- */}
//                             <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center group">
//                                 <div className="flex gap-1 mb-4">
//                                     {[...Array(5)].map((_, i) => (
//                                         <Star 
//                                             key={i} 
//                                             size={16} 
//                                             fill="currentColor" 
//                                             className="star-animate"
//                                             style={{ animationDelay: `${i * 0.15}s` }} 
//                                         />
//                                     ))}
//                                 </div>
//                                 <p className="text-4xl font-black text-white">4.9</p>
//                                 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Customer Rating</p>
//                             </div>
//                             {/* --- STAR WAVE END --- */}
//                         </div>

//                         {/* 3. PROFESSIONAL WHATSAPP VIP CARD */}
//                         <a 
//                             // href="https://wa.me/yournumber?text=Baba,%20let%20me%20into%20the%20Loot!"
//                              onClick={() => window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank')}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                             className="relative bg-gradient-to-br from-[#0d1b15] to-[#050505] border border-[#25d366]/20 rounded-[2.5rem] p-8 group cursor-pointer overflow-hidden transition-all hover:border-[#25d366]/50"
//                         >
//                             <div className="absolute top-0 right-0 w-64 h-64 bg-[#25d366]/5 blur-[80px] rounded-full group-hover:bg-[#25d366]/10 transition-all duration-700" />
                            
//                             <div className="flex justify-between items-start mb-6 relative z-10">
//                                 <div className="p-4 bg-[#25d366] text-black rounded-2xl shadow-lg shadow-[#25d366]/20">
//                                     {/* <MessageSquare size={32} fill="currentColor" /> */}
//                                        <WhatsAppIcon size={32} fill="currentColor" />
//                                 </div>
//                                 <div className="flex flex-col items-end">
//                                     <span className="flex h-2 w-2 rounded-full bg-[#25d366] animate-ping mb-2"></span>
//                                     <p className="text-[10px] font-black text-[#25d366] uppercase tracking-[0.2em] bg-[#25d366]/10 px-3 py-1 rounded-full border border-[#25d366]/20">VIP Portal</p>
//                                 </div>
//                             </div>

//                             <div className="space-y-2 relative z-10">
//                                 <h4 className="text-3xl font-black text-white uppercase tracking-tight">VIP WHATSAPP ACCESS</h4>
//                                 <p className="text-gray-400 text-xs leading-relaxed max-w-[280px] font-medium">
//                                     Join <span className="text-white font-bold">5,000+ members</span> and get instant loot alerts before items sell out on the site.
//                                 </p>
//                             </div>

//                             <div className="mt-8 flex items-center gap-3 text-[#25d366] font-black text-xs uppercase tracking-[0.2em] group-hover:gap-5 transition-all relative z-10">
//                                 CLAIM YOUR INVITE <ArrowRight size={16} />
//                             </div>
//                         </a>
//                     </div>
//                 </div>

//                 {/* SCROLL INDICATOR */}
//                 <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2 opacity-20">
//                     <p className="text-[9px] font-bold text-white uppercase tracking-[0.5em]">Loot Protocol</p>
//                     <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent" />
//                 </div>
//             </section>


//             <style jsx>{`
//               .hover-fuse {
//   animation: flicker 1.5s infinite;
// }
//             `}</style>
//         </>
//     );
// };

// export default HeroSection;

// import React, { useState, useRef } from 'react';
// import { ShoppingBag, Zap, Flame, Trophy, ArrowRight, Star } from 'lucide-react';

// const HeroSection = () => {
//     const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
//     const sectionRef = useRef(null);

//     const handleMouseMove = (e) => {
//         if (!sectionRef.current) return;
//         const rect = sectionRef.current.getBoundingClientRect();
//         setMousePos({
//             x: e.clientX - rect.left,
//             y: e.clientY - rect.top,
//         });
//     };

//     // WhatsApp Redirect
//     const joinWhatsApp = () => {
//         const message = encodeURIComponent("Baba, let me into the Loot! I want VIP access. 🔥");
//         window.open(`https://wa.me/91XXXXXXXXXX?text=${message}`, '_blank');
//     };

//     return (
//         <>
//             <style>
//                 {`
//                 @keyframes fuseBlink {
//                     0%, 100% { opacity: 1; text-shadow: 0 0 20px rgba(247,162,33,0.8); }
//                     10% { opacity: 0.4; text-shadow: none; }
//                     12% { opacity: 1; text-shadow: 0 0 20px rgba(247,162,33,0.8); }
//                     20% { opacity: 0.2; text-shadow: none; }
//                     22% { opacity: 1; }
//                     70% { opacity: 1; }
//                     72% { opacity: 0.3; }
//                     74% { opacity: 1; }
//                 }
//                 .hover-fuse:hover {
//                     animation: fuseBlink 0.4s infinite;
//                 }
//                 /* WhatsApp Brand Color */
//                 .wa-green { color: #25D366; }
//                 .bg-wa { background-color: #25D366; }
//                 `}
//             </style>

//             <section 
//                 ref={sectionRef}
//                 onMouseMove={handleMouseMove}
//                 className="relative w-full min-h-screen p-4 md:p-8 lg:p-12 bg-[#050505] overflow-hidden flex flex-col justify-center selection:bg-[#f7a221] selection:text-black"
//             >
//                 {/* INTERACTIVE GLOW LAYER */}
//                 <div 
//                     className="absolute inset-0 z-0 pointer-events-none opacity-40 transition-opacity duration-500"
//                     style={{
//                         background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(247, 162, 33, 0.1), transparent 80%)`
//                     }}
//                 />

//                 <div className="relative z-10 max-w-[1500px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 h-full">
                    
//                     {/* LEFT PANEL: MAIN BRANDING */}
//                     <div className="lg:col-span-7 flex flex-col justify-between min-h-[500px] md:min-h-[650px] p-8 md:p-16 rounded-[3rem] bg-[#0a0a0a] border border-white/5 relative overflow-hidden group transition-all duration-500 hover:border-white/10">
//                         <div className="absolute top-0 right-0 w-96 h-96 bg-[#f7a221]/5 blur-[120px] rounded-full pointer-events-none" />
                        
//                         <div className="space-y-6 md:space-y-8 relative z-10">
//                             <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
//                                 <span className="flex h-2.5 w-2.5 rounded-full bg-[#f7a221] animate-pulse shadow-[0_0_10px_#f7a221]"></span>
//                                 <span className="text-[10px] md:text-xs font-black text-white uppercase tracking-[0.3em]">Direct Wholesale Access</span>
//                             </div>

//                             <h1 className="text-6xl md:text-[8rem] lg:text-[10.5rem] font-black text-white leading-[0.8] tracking-tighter uppercase">
//                                 LOOT <br />
//                                 <span className="text-transparent" style={{ WebkitTextStroke: '1.5px #f7a221' }}>HARDER.</span>
//                             </h1>
                            
//                             <p className="text-gray-400 text-base md:text-xl max-w-md font-medium leading-relaxed">
//                                 India's most aggressive wholesale prices. Grab viral gadgets before the fuse blows and stock vanishes.
//                             </p>
//                         </div>

//                         <div className="flex flex-col sm:flex-row gap-4 relative z-10 pt-8">
//                             <button className="px-10 py-5 bg-[#f7a221] text-black font-black rounded-2xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(247,162,33,0.2)]">
//                                 SHOP THE LOOT <ShoppingBag size={20} />
//                             </button>
//                             <button className="px-8 py-5 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-all border border-white/10 flex items-center justify-center gap-2">
//                                 VIEW CATALOG <ArrowRight size={18} />
//                             </button>
//                         </div>
//                     </div>

//                     {/* RIGHT PANEL: INTERACTIVE GRID */}
//                     <div className="lg:col-span-5 flex flex-col gap-4 lg:gap-6">
                        
//                         {/* 1. HOT DROP CARD */}
//                         <div className="flex-1 min-h-[200px] bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 flex items-center justify-between group cursor-default relative overflow-hidden transition-all hover:border-[#f7a221]/30">
//                             <div className="relative z-10">
//                                 <div className="bg-[#f7a221]/10 text-[#f7a221] p-4 rounded-2xl w-fit mb-4">
//                                     <Flame size={28} fill="currentColor" className="animate-bounce" />
//                                 </div>
//                                 <h3 className="text-2xl font-black text-white uppercase tracking-tight">Hot Drops</h3>
//                                 <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Refreshed Every 24h</p>
//                             </div>
//                             <div className="text-7xl md:text-9xl font-black text-white/5 group-hover:text-[#f7a221] hover-fuse transition-all duration-300 select-none">
//                                 #01
//                             </div>
//                         </div>

//                         {/* 2. STATS GRID (TRIPLE TROPHY) */}
//                         <div className="grid grid-cols-2 gap-4 lg:gap-6">
//                             {/* THE TRIPLE TROPHY BOX */}
//                             <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center group transition-all duration-500 relative overflow-hidden">
//                                 <div className="relative h-12 mb-6 flex items-center justify-center w-full">
//                                     {/* Main Trophy */}
//                                     <Trophy 
//                                         className="text-[#f7a221] relative z-20 transition-transform duration-500 group-hover:-translate-y-2 scale-125" 
//                                         size={32} 
//                                     />
//                                     {/* Left Trophy - Pops on hover */}
//                                     <Trophy 
//                                         className="text-[#f7a221]/40 absolute z-10 -translate-x-0 opacity-0 group-hover:-translate-x-8 group-hover:-rotate-[45deg] group-hover:opacity-100 transition-all duration-500 delay-75" 
//                                         size={24} 
//                                     />
//                                     {/* Right Trophy - Pops on hover */}
//                                     <Trophy 
//                                         className="text-[#f7a221]/40 absolute z-10 translate-x-0 opacity-0 group-hover:translate-x-8 group-hover:rotate-[45deg] group-hover:opacity-100 transition-all duration-500 delay-75" 
//                                         size={24} 
//                                     />
//                                 </div>
//                                 <p className="text-3xl font-black text-white group-hover:text-[#f7a221] hover-fuse transition-colors duration-300">10K+</p>
//                                 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active Looters</p>
//                             </div>
                            
//                             <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center group">
//                                 <div className="flex text-[#f7a221] mb-4 gap-0.5 animate-pulse">
//                                     {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
//                                 </div>
//                                 <p className="text-3xl font-black text-white tracking-tighter italic">4.9/5</p>
//                                 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Baba Trusted</p>
//                             </div>
//                         </div>

//                         {/* 3. VIP WHATSAPP CARD */}
//                         <div 
//                             onClick={joinWhatsApp}
//                             className="group relative bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 cursor-pointer overflow-hidden transition-all duration-500 hover:border-[#25D366]/40"
//                         >
//                             <div className="absolute inset-0 bg-gradient-to-br from-[#25D366]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            
//                             <div className="flex justify-between items-start relative z-10 mb-8">
//                                 <div className="p-4 bg-[#25D366]/10 text-[#25D366] rounded-2xl group-hover:scale-110 transition-transform duration-500">
//                                     {/* Swapped to Official Sized WhatsApp SVG look icon */}
//                                     <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current" xmlns="http://www.w3.org/2000/svg">
//                                         <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.63 1.438h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
//                                     </svg>
//                                 </div>
//                                 <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/10 group-hover:border-[#25D366]/50 transition-colors">
//                                     <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">VIP Priority Access</p>
//                                 </div>
//                             </div>

//                             <div className="space-y-3 relative z-10">
//                                 <h4 className="text-3xl font-black text-white uppercase tracking-tighter italic">Join The Circle.</h4>
//                                 <p className="text-gray-400 text-sm font-medium max-w-[300px] leading-relaxed">
//                                     Get secret deals <span className="wa-green font-bold underline">15 minutes before</span> they go live on the store. 
//                                 </p>
//                             </div>

//                             <div className="mt-8 flex items-center gap-2 wa-green font-black text-xs uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
//                                 Secure Invite <ArrowRight size={16} />
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {/* SCROLL INDICATOR */}
//                 <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-3 opacity-20 hover:opacity-100 transition-opacity">
//                     <p className="text-[9px] font-bold text-white uppercase tracking-[0.6em] animate-pulse">Loot Below</p>
//                     <div className="w-[1px] h-16 bg-gradient-to-b from-[#f7a221] to-transparent" />
//                 </div>
//             </section>
//         </>
//     );
// };

// export default HeroSection;


// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import { ShoppingBag, Zap, TrendingUp, ChevronLeft, ChevronRight, Play ,ArrowRight } from 'lucide-react';

// const HeroSection = () => {
//     const [currentIndex, setCurrentIndex] = useState(0);
//     const [isHovered, setIsHovered] = useState(false);
//     const mousePosRef = useRef({ x: 0, y: 0 });
//     const smoothPosRef = useRef({ x: 0, y: 0 });
//     const animationFrameRef = useRef(null);

//     const slides = [
//         {
//             title: "EASY SHOPPING.",
//             subtitle: "HONEST PRICES.",
//             tag: "Budget Friendly",
//             desc: "India's most trusted wholesale destination. No hidden charges.",
//             color: "#f7a221",
//             video: "https://www.pexels.com/download/video/5889062/", 
//             image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=1000",
//             stats: "₹0 Extra Charges"
//         },
//         {
//             title: "MISSED THE LIVE?",
//             subtitle: "WATCH RECAP.",
//             tag: "Live Ecosystem",
//             desc: "Catch up on our viral product demonstrations and exclusive loot.",
//             color: "#ffffff",
//             // Add your video path here
//             video: "https://www.pexels.com/download/video/5889062/", 
//             image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=1000",
//             stats: "Live 24/7"
//         },
//         {
//             title: "WINTER SALE.",
//             subtitle: "COLLECTION.",
//             tag: "Limited Time",
//             desc: "Get up to 70% OFF on premium kitchen and home gadgets.",
//             color: "#f7a221",
//             video: "https://www.pexels.com/download/video/5889062/", 
//             image: "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&q=80&w=1000",
//             stats: "70% OFF"
//         }
//     ];

//     // Autoplay logic
//     useEffect(() => {
//         if (isHovered) return;
//         const interval = setInterval(() => {
//             setCurrentIndex((prev) => (prev + 1) % slides.length);
//         }, 6000);
//         return () => clearInterval(interval);
//     }, [isHovered]);

//     // Parallax logic
//     const handleMouseMove = useCallback((e) => {
//         const { clientX, clientY } = e;
//         const { innerWidth, innerHeight } = window;
//         mousePosRef.current = {
//             x: (clientX / innerWidth) - 0.5,
//             y: (clientY / innerHeight) - 0.5
//         };
//     }, []);

//     useEffect(() => {
//         const updateParallax = () => {
//             smoothPosRef.current = {
//                 x: smoothPosRef.current.x + (mousePosRef.current.x - smoothPosRef.current.x) * 0.05,
//                 y: smoothPosRef.current.y + (mousePosRef.current.y - smoothPosRef.current.y) * 0.05
//             };
//             document.documentElement.style.setProperty('--px', `${smoothPosRef.current.x * 25}px`);
//             document.documentElement.style.setProperty('--py', `${smoothPosRef.current.y * 25}px`);
//             animationFrameRef.current = requestAnimationFrame(updateParallax);
//         };
//         animationFrameRef.current = requestAnimationFrame(updateParallax);
//         return () => cancelAnimationFrame(animationFrameRef.current);
//     }, []);

//     return (
//         <section 
//             onMouseMove={handleMouseMove}
//             onMouseEnter={() => setIsHovered(true)}
//             onMouseLeave={() => setIsHovered(false)}
//             className="relative w-full h-[70vh] md:h-[85vh] min-h-[600px] overflow-hidden bg-[#050505] rounded-b-[3rem] md:rounded-b-[5rem] shadow-2xl"
//         >
//             {/* Background Layer */}
//             <div className="absolute inset-0 z-0">
//                 {slides.map((slide, index) => (
//                     <div 
//                         key={index}
//                         className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${currentIndex === index ? 'opacity-100' : 'opacity-0'}`}
//                     >
//                         {slide.video ? (
//                             <video 
//                                 autoPlay muted loop playsInline 
//                                 className="w-full h-full object-cover grayscale-[0.3]"
//                             >
//                                 <source src={slide.video} type="video/mp4" />
//                             </video>
//                         ) : (
//                             <img 
//                                 src={slide.image} 
//                                 alt="" 
//                                 className="w-full h-full object-cover scale-110"
//                                 style={{ transform: `translate(calc(var(--px) * -1), calc(var(--py) * -1))` }}
//                             />
//                         )}
//                         {/* Overlay for readability */}
//                         <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
//                         <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
//                     </div>
//                 ))}
//             </div>

//             {/* Content Layer */}
//             <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-16 lg:px-24">
//                 <div className="max-w-4xl space-y-6 md:space-y-8 transition-all duration-700">
//                     <div className="inline-flex items-center gap-2 bg-[#f7a221] text-black px-4 py-2 rounded-full shadow-lg shadow-[#f7a221]/20">
//                         <Zap size={14} fill="currentColor" />
//                         <span className="text-[10px] font-black uppercase tracking-widest">{slides[currentIndex].tag}</span>
//                     </div>

//                     <h1 className="text-5xl md:text-8xl lg:text-9xl font-black text-white leading-[0.85] tracking-tighter uppercase italic">
//                         {slides[currentIndex].title}<br />
//                         <span style={{ WebkitTextStroke: '2px #f7a221', color: 'transparent' }}>
//                             {slides[currentIndex].subtitle}
//                         </span>
//                     </h1>

//                     <p className="text-gray-300 text-sm md:text-xl max-w-xl font-medium leading-relaxed opacity-90">
//                         {slides[currentIndex].desc}
//                     </p>

//                     <div className="flex flex-wrap gap-4 pt-4">
//                         <button className="group bg-[#f7a221] hover:bg-white text-black font-black py-4 px-10 rounded-2xl transition-all flex items-center gap-3 active:scale-95">
//                             <ShoppingBag size={20} /> 
//                             {slides[currentIndex].video ? 'WATCH & SHOP' : 'SHOP COLLECTION'}
//                             <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
//                         </button>
//                     </div>
//                 </div>
//             </div>

//             {/* The 3-Part Interactive Board (Desktop Only) */}
//             <div className="absolute bottom-0 left-0 w-full hidden lg:grid grid-cols-3 z-30 border-t border-white/10 bg-black/40 backdrop-blur-xl">
//                 {slides.map((slide, i) => (
//                     <button 
//                         key={i}
//                         onClick={() => setCurrentIndex(i)}
//                         className={`group relative p-8 text-left transition-all duration-500 border-r border-white/10 last:border-0 ${currentIndex === i ? 'bg-[#f7a221]/10' : 'hover:bg-white/5'}`}
//                     >
//                         {/* Progress bar for active slide */}
//                         {currentIndex === i && (
//                             <div className="absolute top-0 left-0 h-[2px] bg-[#f7a221] animate-progress-glow" />
//                         )}
                        
//                         <div className="flex justify-between items-start mb-2">
//                             <span className={`text-xs font-black transition-colors ${currentIndex === i ? 'text-[#f7a221]' : 'text-gray-500'}`}>0{i+1}</span>
//                             {slide.video && <Play size={14} className="text-[#f7a221] animate-pulse" fill="currentColor" />}
//                         </div>
//                         <h4 className="text-white font-black text-sm uppercase tracking-tight group-hover:text-[#f7a221] transition-colors">{slide.title}</h4>
//                         <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mt-1">{slide.stats}</p>
//                     </button>
//                 ))}
//             </div>

//             {/* Mobile Controls */}
//             <div className="absolute bottom-8 right-8 z-40 flex lg:hidden items-center gap-4">
//                 <button 
//                     onClick={() => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)}
//                     className="p-4 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/10 active:bg-[#f7a221]"
//                 >
//                     <ChevronLeft size={24} />
//                 </button>
//                 <button 
//                     onClick={() => setCurrentIndex((prev) => (prev + 1) % slides.length)}
//                     className="p-4 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/10 active:bg-[#f7a221]"
//                 >
//                     <ChevronRight size={24} />
//                 </button>
//             </div>
//         </section>
//     );
// };

// export default HeroSection;


// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import { Sparkles, ArrowRight, Star, Zap, TrendingUp, Flame, ShoppingBag } from 'lucide-react';

// const HeroSection = () => {
//     // KEPT: Your high-performance refs
//     const mousePosRef = useRef({ x: 0, y: 0 });
//     const smoothPosRef = useRef({ x: 0, y: 0 });
//     const animationFrameRef = useRef(null);
//     const lastUpdateTimeRef = useRef(0);
    
//     // State for UI
//     const [gradientIndex, setGradientIndex] = useState(0);
//     const [parallaxTransform, setParallaxTransform] = useState({ x: 0, y: 0 });

//     // KEPT: Your throttled mouse handler
//     const handleMouseMove = useCallback((e) => {
//         const now = Date.now();
//         if (now - lastUpdateTimeRef.current < 33) return;
        
//         lastUpdateTimeRef.current = now;
//         const { clientX, clientY } = e;
//         const { innerWidth, innerHeight } = window;
        
//         mousePosRef.current = {
//             x: (clientX / innerWidth) - 0.5,
//             y: (clientY / innerHeight) - 0.5
//         };
//     }, []);

//     // KEPT: Your optimized animation loop
//     useEffect(() => {
//         const updateParallax = () => {
//             smoothPosRef.current = {
//                 x: smoothPosRef.current.x + (mousePosRef.current.x - smoothPosRef.current.x) * 0.08,
//                 y: smoothPosRef.current.y + (mousePosRef.current.y - smoothPosRef.current.y) * 0.08
//             };

//             const layer1X = smoothPosRef.current.x * 40;  
//             const layer1Y = smoothPosRef.current.y * 40;  
//             const layer2X = smoothPosRef.current.x * -20; 
//             const layer2Y = smoothPosRef.current.y * -20; 

//             setParallaxTransform({
//                 layer1X, layer1Y, layer2X, layer2Y
//             });

//             animationFrameRef.current = requestAnimationFrame(updateParallax);
//         };

//         animationFrameRef.current = requestAnimationFrame(updateParallax);
//         return () => {
//             if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
//         };
//     }, []);

//     // UPDATED: Brand Gradients (#f7a221 and Black)
//     const gradients = [
//         "radial-gradient(circle at 20% 50%, rgba(247,162,33,0.15) 0%, transparent 50%)",
//         "radial-gradient(circle at 80% 50%, rgba(255,255,255,0.08) 0%, transparent 50%)",
//         "radial-gradient(circle at 50% 80%, rgba(247,162,33,0.1) 0%, transparent 50%)",
//         "radial-gradient(circle at 20% 50%, rgba(247,162,33,0.15) 0%, transparent 50%)"
//     ];

//     useEffect(() => {
//         const gradientInterval = setInterval(() => {
//             setGradientIndex(prev => (prev + 1) % 4);
//         }, 5000);
//         return () => clearInterval(gradientInterval);
//     }, []);

//     return (
//         <section
//             onMouseMove={handleMouseMove}
//             className="relative min-h-[600px] md:min-h-[700px] rounded-[2.5rem] md:rounded-[4rem] overflow-hidden group bg-[#050505] selection:bg-[#f7a221] selection:text-black"
//             style={{
//                 willChange: 'transform',
//                 transform: 'translateZ(0)'
//             }}
//         >
//             {/* --- THEME MATCHED BACKGROUND --- */}
//             <div className="absolute inset-0 overflow-hidden">
//                 <div 
//                     style={{ 
//                         background: gradients[gradientIndex],
//                         transition: 'background 2s ease'
//                     }}
//                     className="absolute inset-0"
//                 />

//                 {/* Brand Orbs */}
//                 <div className="absolute -top-10 -left-10 w-[60%] h-[150%] bg-[#f7a221]/10 rounded-full blur-[100px] opacity-30" />
//                 <div className="absolute -bottom-10 -right-10 w-[70%] h-[150%] bg-white/5 rounded-full blur-[120px] opacity-20" />

//                 {/* Subtle Grid */}
//                 <div className="absolute inset-0 opacity-[0.03] bg-[size:60px_60px]"
//                     style={{
//                         backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
//                                         linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`
//                     }}>
//                 </div>
//             </div>

//             <div className="relative z-10 grid md:grid-cols-[1.2fr_0.8fr] h-full min-h-[600px] md:min-h-[700px] items-center">
                
//                 {/* Content Side */}
//                 <div className="flex flex-col justify-center p-6 md:p-16 space-y-8">
//                     <div className="flex items-center gap-4 flex-wrap">
//                         <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 text-[#f7a221] text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-[0.3em]">
//                             <Zap size={12} fill="currentColor" /> Exclusive Drop
//                         </div>

//                         <div className="flex items-center gap-2 bg-white/5 border border-white/10 backdrop-blur-md px-4 py-2 rounded-full">
//                             <div className="w-2 h-2 rounded-full bg-[#f7a221] animate-pulse"></div>
//                             <span className="text-[9px] font-black text-white uppercase tracking-wider">Live Ecosystem</span>
//                         </div>
//                     </div>

//                     <div className="space-y-4">
//                         <h1 className="text-5xl md:text-8xl font-black leading-[0.85] tracking-tighter text-white uppercase">
//                             SHOP SMART.<br />
//                             <span className="text-transparent" style={{ WebkitTextStroke: '2px #f7a221' }}>
//                                 LIVE BIG.
//                             </span>
//                         </h1>
//                         <p className="text-gray-400 text-sm md:text-lg max-w-xl leading-relaxed font-semibold">
//                             India's #1 destination for viral innovations. Premium quality tools and gadgets at 
//                             <span className="text-white"> wholesale prices.</span>
//                         </p>
//                     </div>

//                     <div className="flex flex-wrap gap-4 pt-2">
//                         <button
//                             className="bg-[#f7a221] hover:bg-white text-black font-black py-4 px-10 rounded-full text-sm transition-all duration-300 flex items-center gap-3 shadow-[0_10px_20px_-5px_rgba(247,162,33,0.3)] hover:shadow-white/10"
//                         >
//                             <ShoppingBag size={18} /> SHOP NOW
//                         </button>
//                         <button
//                             className="bg-transparent border-2 border-white/10 text-white font-black px-8 py-4 rounded-full text-[10px] tracking-[0.2em] transition-all duration-300 flex items-center gap-2 hover:bg-white/5"
//                         >
//                             VIEW CATALOG <ArrowRight size={16} />
//                         </button>
//                     </div>
//                 </div>

//                 {/* Visual Side (KEPT: Parallax Logic) */}
//                 <div className="hidden md:flex items-center justify-end relative pr-12 h-full">
//                     <div className="relative w-full max-w-[320px] h-full flex items-center justify-center">
                        
//                         {/* Trending Card */}
//                         <div
//                             style={{ 
//                                 transform: `translate(${parallaxTransform.layer2X * 0.5}px, ${parallaxTransform.layer2Y * 0.5}px)`
//                             }}
//                             className="absolute top-10 right-0 bg-white/5 backdrop-blur-xl p-5 rounded-2xl z-30 border border-white/10 transition-transform duration-200"
//                         >
//                             <div className="flex items-center gap-3">
//                                 <div className="bg-[#f7a221] p-3 rounded-xl shadow-lg shadow-[#f7a221]/20">
//                                     <TrendingUp className="text-black" size={20} />
//                                 </div>
//                                 <div>
//                                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Trending</p>
//                                     <p className="text-xl font-black text-white">#1 STYLE</p>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Flash Sale Card */}
//                         <div
//                             style={{ 
//                                 transform: `translate(${parallaxTransform.layer1X * 0.5}px, ${parallaxTransform.layer1Y * 0.5}px)`
//                             }}
//                             className="absolute bottom-10 left-0 bg-black/40 backdrop-blur-xl p-5 rounded-2xl z-20 border border-[#f7a221]/20 transition-transform duration-200"
//                         >
//                             <div className="flex items-center gap-3">
//                                 <div className="bg-white p-3 rounded-xl">
//                                     <Flame className="text-black" size={20} />
//                                 </div>
//                                 <div>
//                                     <p className="text-[9px] font-black text-[#f7a221] uppercase tracking-wider">Flash Sale</p>
//                                     <p className="text-xl font-black text-white">70% OFF</p>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Rating Badge */}
//                         <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
//                             <div className="flex flex-col items-center gap-3">
//                                 <div className="flex items-center gap-1 text-[#f7a221]">
//                                     {[...Array(5)].map((_, i) => (
//                                         <Star key={i} size={16} fill="currentColor" />
//                                     ))}
//                                 </div>
//                                 <p className="text-5xl font-black text-white">4.9</p>
//                                 <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Verified Trust</p>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </section>
//     );
// };

// export default HeroSection;



import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Star, ShieldCheck, Tag, Download } from 'lucide-react';
import bannerDeals from "../../assets/banner-deals.jpg";
import bannerTrending from '../../assets/banner-season.jpg';
import bannerSeason from '../../assets/banner-trending.jpg';

const banners = [
  { id: 1, image: bannerDeals, alt: 'Premium Gift Collection - Up to 80% Off' },
  { id: 2, image: bannerTrending, alt: 'Trending Viral Gadgets & Kitchen - New Arrivals' },
  { id: 3, image: bannerSeason, alt: 'End of Season Clearance Sale' },
];

const trustBadges = [
  { icon: Star, label: '1Cr+ Happy Customers' },
  { icon: ShieldCheck, label: 'Fast & Secure Payment' },
  { icon: Tag, label: 'Lowest Price Guaranteed' },
  { icon: Download, label: 'Top App Download' },
];

const HeroSection = () => {
  const [current, setCurrent] = useState(0);
  const next = useCallback(() => setCurrent((p) => (p + 1) % banners.length), []);
  const prev = useCallback(() => setCurrent((p) => (p - 1 + banners.length) % banners.length), []);

  useEffect(() => { const t = setInterval(next, 4500); return () => clearInterval(t); }, [next]);

  return (
    <section className="w-full">
      <div className="relative w-full overflow-hidden rounded-none md:rounded-xl mx-auto max-w-7xl md:mt-4">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${current * 100}%)` }}>
          {banners.map((b) => (
            <div key={b.id} className="w-full flex-shrink-0">
              <img src={b.image} alt={b.alt} className="w-full aspect-[2.4/1] object-cover" loading="lazy" />
            </div>
          ))}
        </div>
        <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center shadow-md hover:bg-background" aria-label="Previous">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center shadow-md hover:bg-background" aria-label="Next">
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === current ? 'bg-primary w-7' : 'bg-background/60'}`} />
          ))}
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-background/20">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${((current + 1) / banners.length) * 100}%` }} />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap justify-center gap-4">
          {trustBadges.map((badge, i) => (
            <div key={i} className="trust-badge">
              <badge.icon className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-sm font-medium text-foreground whitespace-nowrap">{badge.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;





















