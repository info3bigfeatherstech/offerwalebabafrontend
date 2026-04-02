import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const PriceBanners = () => {
    const [isInView, setIsInView] = useState(false);
    const sectionRef = useRef(null);

    const darkBanners = [
        {
            label: "Under ₹9",
            tag: "CRAZY DEAL",
            icon: <Sparkles size={20} />,
            gradient: "from-[#111111] to-[#000000]",
            accentColor: "from-[#f7a221]/20 to-transparent"
        },
        {
            label: "Under ₹29",
            tag: "BEST VALUE",
            icon: <Zap size={20} />,
            gradient: "from-[#1a1a1a] to-[#080808]",
            accentColor: "from-[#f7a221]/20 to-transparent"
        },
        {
            label: "Under ₹49",
            tag: "MUST BUY",
            icon: <Sparkles size={20} />,
            gradient: "from-[#0d0d0d] to-[#000000]",
            accentColor: "from-[#f7a221]/20 to-transparent"
        },
        {
            label: "Under ₹99",
            tag: "SUPER SAVER",
            icon: <Zap size={20} />,
            gradient: "from-[#1a1a1a] to-[#111111]",
            accentColor: "from-[#f7a221]/20 to-transparent"
        },
         {
            label: "Under ₹99",
            tag: "SUPER SAVER",
            icon: <Zap size={20} />,
            gradient: "from-[#1a1a1a] to-[#111111]",
            accentColor: "from-[#f7a221]/20 to-transparent"
        },
         {
            label: "Under ₹99",
            tag: "SUPER SAVER",
            icon: <Zap size={20} />,
            gradient: "from-[#1a1a1a] to-[#111111]",
            accentColor: "from-[#f7a221]/20 to-transparent"
        },
    ];

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                }
            },
            { threshold: 0.1 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <section
            ref={sectionRef}
            className={`container mx-auto px-4 py-10 transition-all duration-700 ease-out ${
                isInView 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-8'
            }`}
        >
            <div className="flex items-center justify-between mb-6 md:mb-10">
                <h3 className="text-xl sm:text-2xl md:text-4xl font-rubik flex items-center gap-3 md:gap-4 text-gray-900  tracking-tight">
                    <span className="w-2 h-8 md:h-12 bg-[#f7a221] rounded-full shadow-[0_0_15px_rgba(247,162,33,0.4)]"></span>
                    Shop By Price
                </h3>
                <button className="text-[#f7a221] font-black flex items-center gap-2 text-[10px] md:text-sm uppercase tracking-[0.2em] hover:opacity-80 transition-opacity">
                    View All <ArrowRight size={16} />
                </button>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                {darkBanners.map((banner, idx) => (
                    <Link to={`/shopbyprice/${banner.label.toLowerCase().replace(/\s/g, '-')}`}
                        key={idx}
                        className={`group relative h-36 sm:h-44 md:h-52 lg:h-60 bg-gradient-to-br ${banner.gradient} rounded-2xl md:rounded-[2.5rem] overflow-hidden cursor-pointer border border-white/5 hover:border-[#f7a221]/40 transition-all duration-500 ${
                            isInView 
                                ? 'opacity-100 scale-100' 
                                : 'opacity-0 scale-95'
                        }`}
                        style={{ transitionDelay: `${idx * 100}ms` }}
                    >
                        {/* SHINE EFFECT ON HOVER */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000"></div>

                        <div className="h-full flex flex-col justify-between p-4 md:p-8 relative z-10">
                            <div className="flex items-center justify-between">
                                <span className="bg-[#f7a221] text-black text-[8px] md:text-[10px] font-black px-2 md:px-4 py-1 rounded-full uppercase tracking-tighter md:tracking-widest shadow-lg">
                                    {banner.tag}
                                </span>
                                <div className="text-[#f7a221]/40 group-hover:text-[#f7a221] transition-colors duration-500 hidden sm:block">
                                    {banner.icon}
                                </div>
                            </div>

                            <div className="space-y-1 md:space-y-3">
                                <h4 style={{fontSize:"35px"}} className="text-xl sm:text-3xl md:text-4xl lg:text-5xl text-white tracking-tighter">
                                    {banner.label}
                                </h4>
                                
                                {/* ANIMATED ORANGE UNDERLINE */}
                                <div className={`h-[2px] bg-gradient-to-r from-[#f7a221] to-transparent rounded-full transition-all duration-1000 delay-300 ${
                                    isInView ? 'w-full' : 'w-0'
                                }`} />
                                 <div className="flex items-center gap-1.5 md:gap-2 text-[8px] md:text-[14px] font-black uppercase tracking-wider text-gray-400 group-hover:text-white transition-colors duration-300">
                                    Explore <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
};

export default PriceBanners;
