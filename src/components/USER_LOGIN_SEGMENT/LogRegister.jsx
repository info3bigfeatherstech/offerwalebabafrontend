// components/USER_LOGIN_SEGMENT/LogRegister.jsx
import React, { useState } from "react";
import { X } from "lucide-react";
import Login from "./Login";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";
import { useDispatch } from "react-redux";
import { clearError, clearSuccess } from "../REDUX_FEATURES/REDUX_SLICES/authSlice";

const LogRegister = ({ isOpen, onClose, onLoginSuccess }) => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("login");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  if (!isOpen) return null;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setShowForgotPassword(false);
    dispatch(clearError());
    dispatch(clearSuccess());
  };

  const handleClose = () => {
    dispatch(clearError());
    dispatch(clearSuccess());
    onClose();
  };

  const handleForgotPasswordClick = () => {
    dispatch(clearError());
    dispatch(clearSuccess());
    setShowForgotPassword(true);
  };

  const handleBackFromForgot = () => {
    dispatch(clearError());
    dispatch(clearSuccess());
    setShowForgotPassword(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[#0d0d0d] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden">

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 p-2 text-gray-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {!showForgotPassword ? (
          <>
            {/* Tabs */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => handleTabChange("login")}
                className={`flex-1 py-4 text-center font-medium transition-colors ${
                  activeTab === "login"
                    ? "text-[#f7a221] border-b-2 border-[#f7a221]"
                    : "text-gray-500 hover:text-white"
                }`}
              >
                LOGIN
              </button>
              <button
                onClick={() => handleTabChange("register")}
                className={`flex-1 py-4 text-center font-medium transition-colors ${
                  activeTab === "register"
                    ? "text-[#f7a221] border-b-2 border-[#f7a221]"
                    : "text-gray-500 hover:text-white"
                }`}
              >
                REGISTER
              </button>
            </div>

            {/* Content */}
            <div className="p-8">
              {activeTab === "login" ? (
                <Login
                  onLoginSuccess={onLoginSuccess}
                  onRegisterClick={() => handleTabChange("register")}
                  onForgotPasswordClick={handleForgotPasswordClick}
                />
              ) : (
                <Register
                  onRegisterSuccess={onLoginSuccess}
                  onLoginClick={() => handleTabChange("login")}
                />
              )}
            </div>
          </>
        ) : (
          <div className="p-8">
            <ForgotPassword
              onBack={handleBackFromForgot}
              onLoginClick={() => {
                handleBackFromForgot();
                handleTabChange("login");
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LogRegister;


// // components/USER_LOGIN_SEGMENT/LogRegister.jsx
// import React, { useState } from 'react';
// import { X } from 'lucide-react';
// import Login from './Login';
// import Register from './Register';
// import ForgotPassword from './ForgotPassword';

// const LogRegister = ({ isOpen, onClose }) => {
//     const [activeTab, setActiveTab] = useState('login');
//     const [showForgotPassword, setShowForgotPassword] = useState(false);

//     if (!isOpen) return null;

//     const handleLoginSuccess = () => {
//         alert('Login successful! (Demo)');
//         onClose();
//     };

//     const handleForgotPasswordClick = () => {
//         setShowForgotPassword(true);
//     };

//     const handleBackFromForgot = () => {
//         setShowForgotPassword(false);
//     };

//     return (
//         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
//             <div className="relative w-full max-w-md bg-[#0d0d0d] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden">
                
//                 {/* Close Button */}
//                 <button 
//                     onClick={onClose}
//                     className="absolute right-4 top-4 z-10 p-2 text-gray-500 hover:text-white transition-colors"
//                 >
//                     <X size={20} />
//                 </button>

//                 {!showForgotPassword ? (
//                     <>
//                         {/* Tabs */}
//                         <div className="flex border-b border-white/10">
//                             <button
//                                 onClick={() => setActiveTab('login')}
//                                 className={`flex-1 py-4 text-center font-medium transition-colors ${
//                                     activeTab === 'login' 
//                                         ? 'text-[#f7a221] border-b-2 border-[#f7a221]' 
//                                         : 'text-gray-500 hover:text-white'
//                                 }`}
//                             >
//                                 LOGIN
//                             </button>
//                             <button
//                                 onClick={() => setActiveTab('register')}
//                                 className={`flex-1 py-4 text-center font-medium transition-colors ${
//                                     activeTab === 'register' 
//                                         ? 'text-[#f7a221] border-b-2 border-[#f7a221]' 
//                                         : 'text-gray-500 hover:text-white'
//                                 }`}
//                             >
//                                 REGISTER
//                             </button>
//                         </div>

//                         {/* Content */}
//                         <div className="p-8">
//                             {activeTab === 'login' ? (
//                                 <Login 
//                                     onLoginSuccess={handleLoginSuccess}
//                                     onRegisterClick={() => setActiveTab('register')}
//                                     onForgotPasswordClick={handleForgotPasswordClick}
//                                 />
//                             ) : (
//                                 <Register 
//                                     onRegisterSuccess={handleLoginSuccess}
//                                     onLoginClick={() => setActiveTab('login')}
//                                 />
//                             )}
//                         </div>
//                     </>
//                 ) : (
//                     <div className="p-8">
//                         <ForgotPassword 
//                             onBack={handleBackFromForgot}
//                             onLoginClick={() => {
//                                 setShowForgotPassword(false);
//                                 setActiveTab('login');
//                             }}
//                         />
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default LogRegister;