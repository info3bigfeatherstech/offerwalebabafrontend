import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    User, Package, Heart, MapPin, LogOut,
    ChevronRight, LifeBuoy, ShoppingCart,
} from 'lucide-react';

// Sub-page imports
import UserProfile from './UserSubPages/UserProfile';
import UserOrders from './UserSubPages/UserOrders';
import UserWishlist from './UserSubPages/UserWishlist';
import UserAddress from './UserSubPages/UserAddress';
import UserTicket from './UserSubPages/UserTicket';
import UserCart from './UserSubPages/UserCart';

// ── Import ONLY the profile fetch here ────────────────────────────────────────
// Replace this with your actual profile slice import
// import { fetchUserProfile } from '../REDUX_FEATURES/REDUX_SLICES/userProfileSlice';
import { logoutUser } from '../../components/REDUX_FEATURES/REDUX_SLICES/authSlice';

const UserDashboard = () => {
    const { activeTab } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // ── Pull user info from auth slice (already fetched in App.jsx via fetchMe) ──
    // No extra profile call needed if fetchMe already populates this
    const { user } = useSelector((state) => state.auth);

    // ── RULE: Dashboard itself fetches NOTHING except what the sidebar needs ──
    // user name & avatar come from auth slice which is already loaded on app start
    // via fetchMe() in App.jsx — zero extra API calls here.

    const menuItems = [
        { id: 'userprofile',  label: 'Personal Info',    icon: <User size={20} /> },
        { id: 'userorders',   label: 'My Orders',         icon: <Package size={20} /> },
        { id: 'userwishlist', label: 'My Wishlist',       icon: <Heart size={20} /> },
        { id: 'usercart',     label: 'My Cart',           icon: <ShoppingCart size={20} /> },
        { id: 'useraddress',  label: 'Manage Address',    icon: <MapPin size={20} /> },
        { id: 'usertickets',  label: 'Help & Support',    icon: <LifeBuoy size={20} /> },
    ];

    // ── Default tab guard ─────────────────────────────────────────────────────
    // If someone visits /account with no tab, send them to profile
    const currentTab = activeTab || 'userprofile';

    const renderContent = () => {
        switch (currentTab) {
            case 'userprofile':  return <UserProfile />;
            case 'userorders':   return <UserOrders />;
            case 'userwishlist': return <UserWishlist />;
            case 'useraddress':  return <UserAddress />;
            case 'usertickets':  return <UserTicket />;
            case 'usercart':     return <UserCart />;
            default:             return <UserProfile />;
        }
    };

    // ── Get initials for avatar ───────────────────────────────────────────────
    const getInitials = (name) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-[#f8f9fa] py-10 px-4 md:px-8">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">

                {/* ── SIDEBAR ─────────────────────────────────────────────── */}
                <aside className="w-full lg:w-80 space-y-4">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">

                        {/* User info — comes from auth slice, no extra fetch */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 bg-[#F7A221] rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-200">
                                {getInitials(user?.name)}
                            </div>
                            <div>
                                <h2 className="font-black text-gray-900 leading-tight">
                                    {user?.name || 'Guest'}
                                </h2>
                                <p className="text-xs text-gray-500 font-bold">
                                    {user?.role === 'admin' ? 'Admin' : 'Premium Member'}
                                </p>
                            </div>
                        </div>

                        <nav className="space-y-1">
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => navigate(`/account/${item.id}`)}
                                    className={`w-full flex items-center cursor-pointer justify-between p-4 rounded-2xl transition-all duration-300 group ${
                                        currentTab === item.id
                                            ? 'bg-black text-white shadow-xl translate-x-2'
                                            : 'hover:bg-orange-50 text-gray-600 hover:text-black'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`${currentTab === item.id ? 'text-[#F7A221]' : 'text-gray-400 group-hover:text-black'}`}>
                                            {item.icon}
                                        </span>
                                        <span className="font-bold text-sm tracking-tight">{item.label}</span>
                                    </div>
                                    <ChevronRight
                                        size={16}
                                        className={`${currentTab === item.id ? 'opacity-100' : 'opacity-0'}`}
                                    />
                                </button>
                            ))}
                        </nav>

                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 p-4 rounded-2xl text-red-500 hover:bg-red-50 transition-colors font-black text-sm uppercase tracking-wider"
                            >
                                <LogOut size={20} />
                                Logout
                            </button>
                        </div>
                    </div>

                    {/* Support Card */}
                    <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-6 text-white shadow-2xl overflow-hidden relative group">
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase text-orange-400 mb-1">Need help?</p>
                            <h3 className="font-black text-lg mb-4">24/7 Priority Support</h3>
                            <button
                                onClick={() => navigate('/account/usertickets')}
                                className="bg-white text-black px-6 py-2.5 rounded-xl font-black text-xs uppercase hover:bg-[#F7A221] hover:text-white transition-all"
                            >
                                Chat Now
                            </button>
                        </div>
                        <div className="absolute -right-4 -bottom-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
                            <Package size={100} />
                        </div>
                    </div>
                </aside>

                {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
                <main className="flex-1 bg-white rounded-[40px] shadow-sm border border-gray-100 p-6 md:p-10 min-h-[600px]">
                    <div className="animate-slideDown">
                        {renderContent()}
                    </div>
                </main>

            </div>
        </div>
    );
};

export default UserDashboard;

// import React from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import {
//     User, Package, Heart, MapPin, Settings, LogOut,
//     ChevronRight, CreditCard, Bell, ShieldCheck, LifeBuoy,
//     ShoppingCart,
// } from 'lucide-react';

// // Sub-page imports (You will create these next)
// import UserProfile from './UserSubPages/UserProfile';
// import UserOrders from './UserSubPages/UserOrders';
// import UserWishlist from './UserSubPages/UserWishlist';
// import UserAddress from './UserSubPages/UserAddress';
// import UserTicket from './UserSubPages/UserTicket';
// import UserCart from './UserSubPages/UserCart';

// const UserDashboard = () => {
//     const { activeTab } = useParams();
//     const navigate = useNavigate();

//     // Map your custom "user" paths to IDs
//     const menuItems = [
//         { id: 'userprofile', label: 'Personal Info', icon: <User size={20} /> },
//         { id: 'userorders', label: 'My Orders', icon: <Package size={20} /> },
//         { id: 'userwishlist', label: 'My Wishlist', icon: <Heart size={20} /> },
//         { id: 'usercart', label: 'My cart', icon: <ShoppingCart size={20} /> },
//         { id: 'useraddress', label: 'Manage Address', icon: <MapPin size={20} /> },
//         { id: 'usertickets', label: 'Help & Support', icon: <LifeBuoy size={20} /> },
//     ];

//     const renderContent = () => {
//         switch (activeTab) {
//             case 'userprofile': return <UserProfile />;
//             case 'userorders': return <UserOrders />;
//             case 'userwishlist': return <UserWishlist />;
//             case 'useraddress': return <UserAddress />;
//             case 'usertickets': return <UserTicket />;
//             case 'usercart': return <UserCart />;
//             default: return <UserProfile />;
//         }
//     };

//     return (
//         <div className="min-h-screen bg-[#f8f9fa] py-10 px-4 md:px-8">
//             <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">

//                 {/* --- SIDEBAR --- */}
//                 <aside className="w-full lg:w-80 space-y-4">
//                     <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
//                         <div className="flex items-center gap-4 mb-8">
//                             <div className="w-14 h-14 bg-[#F7A221] rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-200">
//                                 JD
//                             </div>
//                             <div>
//                                 <h2 className="font-black text-gray-900 leading-tight">John Doe</h2>
//                                 <p className="text-xs text-gray-500 font-bold">Premium Member</p>
//                             </div>
//                         </div>

//                         <nav className="space-y-1">
//                             {menuItems.map((item) => (
//                                 <button
//                                     key={item.id}
//                                     onClick={() => navigate(`/account/${item.id}`)}
//                                     className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${activeTab === item.id
//                                         ? 'bg-black text-white shadow-xl translate-x-2'
//                                         : 'hover:bg-orange-50 text-gray-600 hover:text-black'
//                                         }`}
//                                 >
//                                     <div className="flex items-center gap-3">
//                                         <span className={`${activeTab === item.id ? 'text-[#F7A221]' : 'text-gray-400 group-hover:text-black'}`}>
//                                             {item.icon}
//                                         </span>
//                                         <span className="font-bold text-sm tracking-tight">{item.label}</span>
//                                     </div>
//                                     <ChevronRight size={16} className={`${activeTab === item.id ? 'opacity-100' : 'opacity-0'}`} />
//                                 </button>
//                             ))}
//                         </nav>

//                         <div className="mt-8 pt-6 border-t border-gray-100">
//                             <button className="w-full flex items-center gap-3 p-4 rounded-2xl text-red-500 hover:bg-red-50 transition-colors font-black text-sm uppercase tracking-wider">
//                                 <LogOut size={20} />
//                                 Logout
//                             </button>
//                         </div>
//                     </div>

//                     {/* Support Card */}
//                     <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-6 text-white shadow-2xl overflow-hidden relative group">
//                         <div className="relative z-10">
//                             <p className="text-[10px] font-black uppercase text-orange-400 mb-1">Need help?</p>
//                             <h3 className="font-black text-lg mb-4">24/7 Priority Support</h3>
//                             <button className="bg-white text-black px-6 py-2.5 rounded-xl font-black text-xs uppercase hover:bg-[#F7A221] hover:text-white transition-all">
//                                 Chat Now
//                             </button>
//                         </div>
//                         <div className="absolute -right-4 -bottom-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
//                             <Package size={100} />
//                         </div>
//                     </div>
//                 </aside>

//                 {/* --- MAIN CONTENT AREA --- */}
//                 <main className="flex-1 bg-white rounded-[40px] shadow-sm border border-gray-100 p-6 md:p-10 min-h-[600px]">
//                     <div className="animate-slideDown">
//                         {renderContent()}
//                     </div>
//                 </main>

//             </div>
//         </div>
//     );
// };

// export default UserDashboard;