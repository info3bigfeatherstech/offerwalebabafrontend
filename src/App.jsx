import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Homepage from "./pages/Homepage";
import CustomerCare from "./pages/CustomerCare";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import WhatsAppFloat from "./components/WHATSAPP_FLOAT/WhatsAppFloat";
import LogRegister from "./components/USER_LOGIN_SEGMENT/LogRegister";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser, fetchMe, forceLogout } from "./components/REDUX_FEATURES/REDUX_SLICES/authSlice";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminDashboard from "./components/ADMIN_SEGMENT/Admin_dashboard";

// Wrapper component to conditionally render Navbar based on route
const AppContent = () => {
  const dispatch = useDispatch();
  const { isLoggedIn, user } = useSelector((state) => state.auth);
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Check if current route is admin dashboard
  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/admindash');

  // ✅ On app load — if token exists in localStorage, fetch user profile silently
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      dispatch(fetchMe());
    }
  }, [dispatch]);

  // ✅ Listen for forced logout event (triggered by axiosInstance on refresh failure)
  useEffect(() => {
    const handleForceLogout = () => {
      dispatch(forceLogout());
    };
    window.addEventListener("auth:logout", handleForceLogout);
    return () => window.removeEventListener("auth:logout", handleForceLogout);
  }, [dispatch]);

  // ✅ Show auth popup after 2 seconds (only once per session)
  useEffect(() => {
    const hasVisited = sessionStorage.getItem("hasVisitedBABA");
    if (!hasVisited && !isLoggedIn && !isAdminRoute) {
      const timer = setTimeout(() => {
        setIsAuthOpen(true);
        sessionStorage.setItem("hasVisitedBABA", "true");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, isAdminRoute]);

  // ✅ Called after successful login/register — close the modal
  const handleLoginSuccess = () => {
    setIsAuthOpen(false);
  };

  // ✅ Logout — calls API + clears Redux state + localStorage
  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const openAuthModal = () => {
    setIsAuthOpen(true);
  };

  return (
    <div className="min-h-screen">
      {/* Conditionally render Navbar - hide on admin routes */}
      {!isAdminRoute && (
        <Navbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          isLoggedIn={isLoggedIn}
          user={user}
          onOpenAuth={openAuthModal}
          onLogout={handleLogout}
        />
      )}

      <Routes>
        <Route path="/" element={<Homepage onOpenAuth={openAuthModal} />} />
        <Route
          path="/customer-care"
          element={<CustomerCare onOpenAuth={openAuthModal} />}
        />

        {/* ADMIN_ROUTES */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admindash/*" element={<AdminDashboard />} /> {/* Catch all */}
      </Routes>

      {/* Conditionally render Footer - hide on admin routes */}
      {!isAdminRoute && <Footer />}

      {/* Auth Popup - only show on non-admin routes */}
      {!isAdminRoute && (
        <LogRegister
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      <WhatsAppFloat />
    </div>
  );
};

const App = () => {
  return (
    <Router>
      {/* Place ToastContainer here - outside the main layout flow */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        pauseOnHover
        theme="dark"
        toastClassName={() => 
          "relative flex p-1 min-h-10 rounded-xl justify-between overflow-hidden cursor-pointer bg-[#0d0d0d] border border-white/10 mb-2 shadow-2xl"
        }
        bodyClassName={() => "text-sm font-medium text-white block p-3"}
        progressClassName="bg-[#f7a221]"
      />
      <AppContent />
    </Router>
  );
};

export default App;
// import React, { useState, useEffect } from "react";
// import Navbar from "./components/Navbar";
// import Footer from "./components/Footer";
// import Homepage from "./pages/Homepage";
// import CustomerCare from "./pages/CustomerCare";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import WhatsAppFloat from "./components/WHATSAPP_FLOAT/WhatsAppFloat";
// import LogRegister from "./components/USER_LOGIN_SEGMENT/LogRegister";
// import { useDispatch, useSelector } from "react-redux";
// import { logoutUser, fetchMe, forceLogout } from "./components/REDUX_FEATURES/REDUX_SLICES/authSlice";
// import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import AdminDashboard from "./components/ADMIN_SEGMENT/Admin_dashboard";

// const App = () => {
//   const dispatch = useDispatch();
//   const { isLoggedIn, user } = useSelector((state) => state.auth);

//   const [searchQuery, setSearchQuery] = useState("");
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [isAuthOpen, setIsAuthOpen] = useState(false);

//   // ✅ On app load — if token exists in localStorage, fetch user profile silently
//   useEffect(() => {
//     const token = localStorage.getItem("accessToken");
//     if (token) {
//       dispatch(fetchMe());
//     }
//   }, [dispatch]);

//   // ✅ Listen for forced logout event (triggered by axiosInstance on refresh failure)
//   useEffect(() => {
//     const handleForceLogout = () => {
//       dispatch(forceLogout());
//     };
//     window.addEventListener("auth:logout", handleForceLogout);
//     return () => window.removeEventListener("auth:logout", handleForceLogout);
//   }, [dispatch]);

//   // ✅ Show auth popup after 2 seconds (only once per session)
//   useEffect(() => {
//     const hasVisited = sessionStorage.getItem("hasVisitedBABA");
//     if (!hasVisited && !isLoggedIn) {
//       const timer = setTimeout(() => {
//         setIsAuthOpen(true);
//         sessionStorage.setItem("hasVisitedBABA", "true");
//       }, 2000);
//       return () => clearTimeout(timer);
//     }
//   }, [isLoggedIn]);

//   // ✅ Called after successful login/register — close the modal
//   const handleLoginSuccess = () => {
//     setIsAuthOpen(false);
//   };

//   // ✅ Logout — calls API + clears Redux state + localStorage
//   const handleLogout = () => {
//     dispatch(logoutUser());
//   };

//   const openAuthModal = () => {
//     setIsAuthOpen(true);
//   };

//   return (
//     <Router>
//       {/* Place ToastContainer here - outside the main layout flow */}
//      <ToastContainer
//       position="top-right"
//       autoClose={3000}
//       hideProgressBar={false}
//       newestOnTop={true}
//       closeOnClick
//       pauseOnHover
//       theme="dark"
//       toastClassName={() => 
//         "relative flex p-1 min-h-10 rounded-xl justify-between overflow-hidden cursor-pointer bg-[#0d0d0d] border border-white/10 mb-2 shadow-2xl"
//       }
//       bodyClassName={() => "text-sm font-medium text-white block p-3"}
//       progressClassName="bg-[#f7a221]"
//     />
//       <div className="min-h-screen">
//         <Navbar
//           searchQuery={searchQuery}
//           setSearchQuery={setSearchQuery}
//           isMenuOpen={isMenuOpen}
//           setIsMenuOpen={setIsMenuOpen}
//           isLoggedIn={isLoggedIn}
//           user={user}
//           onOpenAuth={openAuthModal}
//           onLogout={handleLogout}
//         />

//         <Routes>
//           <Route path="/" element={<Homepage onOpenAuth={openAuthModal} />} />
//           <Route
//             path="/customer-care"
//             element={<CustomerCare onOpenAuth={openAuthModal} />}
//           />




//           {/* ADMIN_ROUTES */}
//           <Route path="/admin" element={<AdminDashboard />} />
//            <Route path="/admindash/*" element={<AdminDashboard />} /> {/* Catch all */}
//         </Routes>

//         <Footer />

//         {/* Auth Popup */}
//         <LogRegister
//           isOpen={isAuthOpen}
//           onClose={() => setIsAuthOpen(false)}
//           onLoginSuccess={handleLoginSuccess}
//         />

//         <WhatsAppFloat />
//       </div>
//     </Router>
//   );
// };

// export default App;

// // App.jsx
// import React, { useState, useEffect } from 'react';
// import Navbar from './components/Navbar';
// import Footer from './components/Footer';
// import Homepage from './pages/Homepage';
// import CustomerCare from './pages/CustomerCare';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import WhatsAppFloat from './components/WHATSAPP_FLOAT/WhatsAppFloat';
// import LogRegister from './components/USER_LOGIN_SEGMENT/LogRegister';

// const App = () => {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [isAuthOpen, setIsAuthOpen] = useState(false);
  
//   // Demo user state - always false for static UI
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [user, setUser] = useState(null);

//   // Show popup after 2 seconds (only once per session)
//   useEffect(() => {
//     const hasVisited = sessionStorage.getItem('hasVisitedBABA');
    
//     if (!hasVisited) {
//       const timer = setTimeout(() => {
//         setIsAuthOpen(true);
//         sessionStorage.setItem('hasVisitedBABA', 'true');
//       }, 2000);

//       return () => clearTimeout(timer);
//     }
//   }, []);

//   // Handle successful login/registration
//   const handleLoginSuccess = () => {
//     setIsLoggedIn(true);
//     setUser({ name: 'Demo User', email: 'demo@example.com' });
//     setIsAuthOpen(false);
//     alert('Logged in successfully! (Demo)');
//   };

//   // Handle logout
//   const handleLogout = () => {
//     setIsLoggedIn(false);
//     setUser(null);
//     alert('Logged out successfully! (Demo)');
//   };

//   // Function to open auth modal
//   const openAuthModal = () => {
//     setIsAuthOpen(true);
//   };

//   return (
//     <Router>
//       <div className="min-h-screen">
//         <Navbar
//           searchQuery={searchQuery}
//           setSearchQuery={setSearchQuery}
//           isMenuOpen={isMenuOpen}
//           setIsMenuOpen={setIsMenuOpen}
//           isLoggedIn={isLoggedIn}
//           user={user}
//           onOpenAuth={openAuthModal}
//           onLogout={handleLogout}
//         />
        
//         <Routes>
//           <Route path="/" element={<Homepage onOpenAuth={openAuthModal} />} />
//           <Route path="/customer-care" element={<CustomerCare onOpenAuth={openAuthModal} />} />
//         </Routes>
        
//         <Footer />

//         {/* Auth Popup */}
//         <LogRegister 
//           isOpen={isAuthOpen} 
//           onClose={() => setIsAuthOpen(false)}
//           onLoginSuccess={handleLoginSuccess}
//         />
        
//         <WhatsAppFloat />
//       </div>
//     </Router>
//   );
// };

// export default App;

// import React, { useState, useEffect } from 'react';
// import Navbar from './components/Navbar';
// import Footer from './components/Footer';
// import Homepage from './pages/Homepage';
// import CustomerCare from './pages/CustomerCare';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import WhatsAppFloat from './components/WHATSAPP_FLOAT/WhatsAppFloat';
// import LogRegister from './components/USER_LOGIN_SEGMENT/LogRegister';

// const App = () => {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
  
//   // Check sessionStorage for login status
//   const [isLoggedIn, setIsLoggedIn] = useState(() => {
//     return sessionStorage.getItem('isUserLoggedIn') === 'true';
//   });

//   // State to control the Login/Register Popup
//   const [isAuthOpen, setIsAuthOpen] = useState(false);

//   useEffect(() => {
//     const hasVisited = sessionStorage.getItem('hasVisitedBABA');

//     // Show popup only if user hasn't visited AND is not logged in
//     if (!hasVisited && !isLoggedIn) {
//       const timer = setTimeout(() => {
//         setIsAuthOpen(true);
//         sessionStorage.setItem('hasVisitedBABA', 'true');
//       }, 2000);

//       return () => clearTimeout(timer);
//     }
//   }, [isLoggedIn]);

//   // Simple login function - sets sessionStorage
//   const handleLogin = () => {
//     sessionStorage.setItem('isUserLoggedIn', 'true');
//     setIsLoggedIn(true);
//     setIsAuthOpen(false);
//   };

//   // Simple logout function
//   const handleLogout = () => {
//     sessionStorage.removeItem('isUserLoggedIn');
//     setIsLoggedIn(false);
//   };

//   return (
//     <Router>
//       <div className="min-h-screen">
//         <Navbar
//           searchQuery={searchQuery}
//           setSearchQuery={setSearchQuery}
//           isMenuOpen={isMenuOpen}
//           setIsMenuOpen={setIsMenuOpen}
//           isLoggedIn={isLoggedIn}
//           onLogout={handleLogout}
//         />
        
//         <Routes>
//           <Route path="/" element={<Homepage />} />
//           <Route path="/customer-care" element={<CustomerCare />} />
//         </Routes>
        
//         <Footer />

//         {/* Auth Popup */}
//         <LogRegister 
//           isOpen={isAuthOpen} 
//           onClose={() => setIsAuthOpen(false)}
//           onLoginSuccess={handleLogin}
//         />
        
//         <WhatsAppFloat />
//       </div>
//     </Router>
//   );
// };

// export default App;


// import React, { useState, useEffect } from 'react';
// import Navbar from './components/Navbar';
// import Footer from './components/Footer';
// import Homepage from './pages/Homepage';
// import CustomerCare from './pages/CustomerCare';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import WhatsAppFloat from './components/WHATSAPP_FLOAT/WhatsAppFloat';
// import LogRegister from './components/USER_LOGIN_SEGMENT/LogRegister';

// const App = () => {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [isLoginOpen, setIsLoginOpen] = useState(false);
//   // In the future, this 'false' will come from your Auth API/Context
//   const [isLoggedIn, setIsLoggedIn] = useState(false); 

//   // State to control the Login/Register Popup
//   const [isAuthOpen, setIsAuthOpen] = useState(false);

//   useEffect(() => {
//     const hasVisited = sessionStorage.getItem('hasVisitedBABA');

//     // PRACTICAL CHECK: Only trigger if NO session exists AND user is NOT logged in
//     if (!hasVisited && !isLoggedIn) {
//       const timer = setTimeout(() => {
//         setIsLoginOpen(true);
//         sessionStorage.setItem('hasVisitedBABA', 'true');
//       }, 2000);

//       return () => clearTimeout(timer);
//     }
//   }, [isLoggedIn]); // Added isLoggedIn here so if it changes, the effect re-evaluates

//   return (
//     <Router>
//       <div className="min-h-screen">
//         <Navbar
//           searchQuery={searchQuery}
//           setSearchQuery={setSearchQuery}
//           isMenuOpen={isMenuOpen}
//           setIsMenuOpen={setIsMenuOpen}
//         />
        
//         <Routes>
//           <Route path="/" element={<Homepage />} />
//           <Route path="/customer-care" element={<CustomerCare />} />
//         </Routes>
        
//         <Footer />

        
//         {/* 3. THE AUTH POPUP */}
//       {/* We pass the state and the closer function as props */}
//       <LogRegister 
//         isOpen={isAuthOpen} 
//         onClose={() => setIsAuthOpen(false)} 
//       />
//         <WhatsAppFloat />
//       </div>
//     </Router>
//   );
// };

// export default App;

// import React, { useState,useEffect } from 'react';
// import Navbar from './components/Navbar';
// import Footer from './components/Footer';
// import Homepage from './pages/Homepage';
// import CustomerCare from './pages/CustomerCare';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import WhatsAppFloat from './components/WHATSAPP_FLOAT/WhatsAppFloat';
// import loginPopup from './components/LOGIN_POPUP/loginPopup';
// const App = () => {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [isLoginOpen, setIsLoginOpen] = useState(false);
//   // In the future, this 'false' will come from your Auth API/Context
//   const [isLoggedIn, setIsLoggedIn] = useState(false); 

//   useEffect(() => {
//     const hasVisited = sessionStorage.getItem('hasVisitedBABA');

//     // PRACTICAL CHECK: Only trigger if NO session exists AND user is NOT logged in
//     if (!hasVisited && !isLoggedIn) {
//       const timer = setTimeout(() => {
//         setIsLoginOpen(true);
//         sessionStorage.setItem('hasVisitedBABA', 'true');
//       }, 2000);

//       return () => clearTimeout(timer);
//     }
//   }, [isLoggedIn]); // Added isLoggedIn here so if it changes, the effect re-evaluates

//   return (
//     <Router>
//       <div className="min-h-screen">
//         <Navbar
//           searchQuery={searchQuery}
//           setSearchQuery={setSearchQuery}
//           isMenuOpen={isMenuOpen}
//           setIsMenuOpen={setIsMenuOpen}
//         />
        
//         <Routes>
//           <Route path="/" element={<Homepage />} />
//           <Route path="/customer-care" element={<CustomerCare />} />
//         </Routes>
        
//         <Footer />

    
//         <loginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
//       <WhatsAppFloat />
//       </div>
//     </Router>
//   );
// };

// export default App;
