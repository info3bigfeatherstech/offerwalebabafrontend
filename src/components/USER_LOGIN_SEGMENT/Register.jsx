// components/USER_LOGIN_SEGMENT/Register.jsx
import React, { useState, useEffect } from "react";
import { Phone, Mail, User, ArrowRight, Lock } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  registerUser,
  googleLogin,
  clearError,
} from "../REDUX_FEATURES/REDUX_SLICES/authSlice";
import OtpVerification from "./OTPVerification";

const Register = ({ onRegisterSuccess, onLoginClick }) => {
  const dispatch = useDispatch();
  const { loading, error, pendingEmail } = useSelector((state) => state.auth);

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [showPhoneMessage, setShowPhoneMessage] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Clear errors on mount
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // ✅ Initialize Google
  useEffect(() => {
    const initializeGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id:
            import.meta.env.VITE_GOOGLE_CLIENT_ID || "demo-client-id",
          callback: handleGoogleResponse,
          ux_mode: "popup",
        });
      }
    };

    if (!window.google) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.body.appendChild(script);
    } else {
      initializeGoogle();
    }
  }, []);

  // ✅ Google register
  const handleGoogleResponse = async (response) => {
    const result = await dispatch(
      googleLogin({ idToken: response.credential })
    );
    if (googleLogin.fulfilled.match(result)) {
      onRegisterSuccess();
    }
  };

  const handleGoogleRegister = () => {
    if (window.google) {
      window.google.accounts.id.prompt();
    }
  };

  const handlePhoneButtonClick = () => {
    setShowPhoneForm(true);
    setShowEmailForm(false);
    dispatch(clearError());
  };

  const handleEmailButtonClick = () => {
    setShowEmailForm(true);
    setShowPhoneForm(false);
    dispatch(clearError());
  };

  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    setShowPhoneMessage(true);
    setTimeout(() => setShowPhoneMessage(false), 3000);
  };

  // ✅ Email register — dispatch registerUser thunk, then show OTP modal
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());

    const result = await dispatch(
      registerUser({ name, email, password, phone: phone || undefined })
    );

    if (registerUser.fulfilled.match(result)) {
      setShowOtpModal(true); // ✅ OTP sent successfully, show modal
    }
  };

  const handleBackToMain = () => {
    setShowEmailForm(false);
    setShowPhoneForm(false);
    setName("");
    setPhone("");
    setEmail("");
    setPassword("");
    dispatch(clearError());
  };

  // ✅ Called after OTP verified successfully (from OtpVerification component)
  const handleOtpVerify = () => {
    setShowOtpModal(false);
    onRegisterSuccess();
  };

  return (
    <>
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-4xl font-black text-white tracking-tighter">
            JOIN THE <span className="text-[#f7a221]">CLUB</span>
          </h2>
          {(showEmailForm || showPhoneForm) && (
            <button
              onClick={handleBackToMain}
              className="text-gray-500 hover:text-white text-sm"
            >
              ← Back
            </button>
          )}
        </div>

        <p className="text-gray-500 text-sm mb-8">
          Get VIP access to exclusive deals
        </p>

        {/* ✅ API Error from Redux */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Phone Coming Soon */}
        {showPhoneMessage && (
          <div className="mb-4 p-3 bg-[#f7a221]/10 border border-[#f7a221]/20 rounded-xl text-[#f7a221] text-sm">
            Phone registration is coming soon! Please use email or Google.
          </div>
        )}

        {!showEmailForm && !showPhoneForm ? (
          // ── Main Menu ──────────────────────────────────────────
          <>
            <button
              onClick={handleGoogleRegister}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-3 mb-6"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign up with Google
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-4 bg-[#0d0d0d] text-gray-500">
                  OR REGISTER WITH
                </span>
              </div>
            </div>

            <button
              onClick={handlePhoneButtonClick}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 mb-4"
            >
              <Phone size={18} />
              Register with Phone Number
              <ArrowRight size={18} className="ml-auto" />
            </button>

            <button
              onClick={handleEmailButtonClick}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <Mail size={18} />
              Register with Email Address
              <ArrowRight size={18} className="ml-auto" />
            </button>

            <div className="mt-6 text-center">
              <span className="text-gray-500 text-sm">
                Already have an account?{" "}
              </span>
              <button
                onClick={onLoginClick}
                className="text-[#f7a221] hover:underline text-sm font-medium"
              >
                Login here
              </button>
            </div>
          </>
        ) : showPhoneForm ? (
          // ── Phone Form ─────────────────────────────────────────
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div className="relative">
              <User
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                size={18}
              />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f7a221] focus:ring-1 focus:ring-[#f7a221] transition-all"
                required
              />
            </div>
            <div className="relative">
              <Phone
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                size={18}
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f7a221] focus:ring-1 focus:ring-[#f7a221] transition-all"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#f7a221] hover:bg-[#e0911c] text-black font-black py-4 px-6 rounded-2xl transition-all"
            >
              SEND OTP
            </button>
            <p className="text-xs text-center text-gray-500 mt-2">
              Note: Phone verification is coming soon
            </p>
          </form>
        ) : (
          // ── Email Form ─────────────────────────────────────────
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="relative">
              <User
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                size={18}
              />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f7a221] focus:ring-1 focus:ring-[#f7a221] transition-all"
                required
              />
            </div>

            <div className="relative">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                size={18}
              />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f7a221] focus:ring-1 focus:ring-[#f7a221] transition-all"
                required
              />
            </div>

            <div className="relative">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                size={18}
              />
              <input
                type="password"
                placeholder="Password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f7a221] focus:ring-1 focus:ring-[#f7a221] transition-all"
                required
                minLength="6"
              />
            </div>

            <div className="relative">
              <Phone
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                size={18}
              />
              <input
                type="tel"
                placeholder="Phone Number (Optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f7a221] focus:ring-1 focus:ring-[#f7a221] transition-all"
              />
            </div>

            {/* ✅ Loading state on button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#f7a221] hover:bg-[#e0911c] disabled:opacity-60 disabled:cursor-not-allowed text-black font-black py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Sending OTP...
                </span>
              ) : (
                "REGISTER & SEND OTP"
              )}
            </button>
          </form>
        )}
      </div>

      {/* ✅ OTP Verification Modal — email comes from Redux pendingEmail */}
      {showOtpModal && (
        <OtpVerification
          email={pendingEmail || email}
          name={name}
          onClose={() => setShowOtpModal(false)}
          onVerify={handleOtpVerify}
        />
      )}
    </>
  );
};

export default Register;


// // components/USER_LOGIN_SEGMENT/Register.jsx
// import React, { useState, useEffect } from 'react';
// import { Phone, Mail, User, ArrowRight, Lock } from 'lucide-react';
// import OtpVerification from './OTPVerification';

// const Register = ({ onRegisterSuccess, onLoginClick }) => {
//     // Form states
//     const [showEmailForm, setShowEmailForm] = useState(false);
//     const [showPhoneForm, setShowPhoneForm] = useState(false);
    
//     // Form data
//     const [name, setName] = useState('');
//     const [phone, setPhone] = useState('');
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
    
//     const [localError, setLocalError] = useState('');
//     const [showPhoneMessage, setShowPhoneMessage] = useState(false);
//     const [showOtpModal, setShowOtpModal] = useState(false);

//     // Load Google Script
//     useEffect(() => {
//         const initializeGoogle = () => {
//             if (window.google) {
//                 window.google.accounts.id.initialize({
//                     client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'demo-client-id',
//                     callback: handleGoogleResponse,
//                     ux_mode: "popup",
//                 });
//             }
//         };

//         if (!window.google) {
//             const script = document.createElement('script');
//             script.src = 'https://accounts.google.com/gsi/client';
//             script.async = true;
//             script.defer = true;
//             script.onload = initializeGoogle;
//             document.body.appendChild(script);
//         } else {
//             initializeGoogle();
//         }
//     }, []);

//     const handleGoogleResponse = (response) => {
//         console.log('Google register demo:', response);
//         alert('Google registration successful! (Demo)');
//         onRegisterSuccess();
//     };

//     const handleGoogleRegister = () => {
//         if (window.google) {
//             window.google.accounts.id.prompt();
//         } else {
//             setLocalError('Google sign-in is loading. Please try again.');
//         }
//     };

//     const handlePhoneButtonClick = () => {
//         setShowPhoneForm(true);
//         setShowEmailForm(false);
//     };

//     const handleEmailButtonClick = () => {
//         setShowEmailForm(true);
//         setShowPhoneForm(false);
//     };

//     const handlePhoneSubmit = (e) => {
//         e.preventDefault();
//         setLocalError('');
        
//         if (!name || !phone) {
//             setLocalError('Please fill in all fields');
//             return;
//         }

//         setShowPhoneMessage(true);
//         setTimeout(() => setShowPhoneMessage(false), 3000);
//     };

//     const handleEmailSubmit = (e) => {
//         e.preventDefault();
//         setLocalError('');
        
//         if (!name || !email || !password) {
//             setLocalError('Please fill in all required fields');
//             return;
//         }

//         if (password.length < 6) {
//             setLocalError('Password must be at least 6 characters');
//             return;
//         }

//         setShowOtpModal(true);
//     };

//     const handleBackToMain = () => {
//         setShowEmailForm(false);
//         setShowPhoneForm(false);
//         setName('');
//         setPhone('');
//         setEmail('');
//         setPassword('');
//     };

//     const handleOtpVerify = () => {
//         setShowOtpModal(false);
//         onRegisterSuccess();
//     };

//     return (
//         <>
//             <div className="w-full">
//                 <div className="flex items-center justify-between mb-2">
//                     <h2 className="text-4xl font-black text-white tracking-tighter">
//                         JOIN THE <span className="text-[#f7a221]">CLUB</span>
//                     </h2>
//                     {(showEmailForm || showPhoneForm) && (
//                         <button 
//                             onClick={handleBackToMain}
//                             className="text-gray-500 hover:text-white text-sm"
//                         >
//                             ← Back
//                         </button>
//                     )}
//                 </div>
                
//                 <p className="text-gray-500 text-sm mb-8">Get VIP access to exclusive deals</p>

//                 {/* Error Message */}
//                 {localError && (
//                     <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
//                         {localError}
//                     </div>
//                 )}

//                 {/* Phone Coming Soon Message */}
//                 {showPhoneMessage && (
//                     <div className="mb-4 p-3 bg-[#f7a221]/10 border border-[#f7a221]/20 rounded-xl text-[#f7a221] text-sm">
//                         Phone registration is coming soon! Please use email or Google.
//                     </div>
//                 )}

//                 {!showEmailForm && !showPhoneForm ? (
//                     // Main Menu
//                     <>
//                         {/* Google Sign Up */}
//                         <button 
//                             onClick={handleGoogleRegister}
//                             className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-3 mb-6"
//                         >
//                             <svg className="w-5 h-5" viewBox="0 0 24 24">
//                                 <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
//                                 <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
//                                 <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
//                                 <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
//                             </svg>
//                             Sign up with Google
//                         </button>

//                         <div className="relative my-8">
//                             <div className="absolute inset-0 flex items-center">
//                                 <div className="w-full border-t border-white/10"></div>
//                             </div>
//                             <div className="relative flex justify-center text-xs">
//                                 <span className="px-4 bg-[#0d0d0d] text-gray-500">OR REGISTER WITH</span>
//                             </div>
//                         </div>

//                         {/* Phone Registration Button */}
//                         <button 
//                             onClick={handlePhoneButtonClick}
//                             className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 mb-4"
//                         >
//                             <Phone size={18} />
//                             Register with Phone Number
//                             <ArrowRight size={18} className="ml-auto" />
//                         </button>

//                         {/* Email Registration Button */}
//                         <button 
//                             onClick={handleEmailButtonClick}
//                             className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2"
//                         >
//                             <Mail size={18} />
//                             Register with Email Address
//                             <ArrowRight size={18} className="ml-auto" />
//                         </button>

//                         {/* Login Link */}
//                         <div className="mt-6 text-center">
//                             <span className="text-gray-500 text-sm">Already have an account? </span>
//                             <button 
//                                 onClick={onLoginClick}
//                                 className="text-[#f7a221] hover:underline text-sm font-medium"
//                             >
//                                 Login here
//                             </button>
//                         </div>
//                     </>
//                 ) : showPhoneForm ? (
//                     // Phone Registration Form
//                     <form onSubmit={handlePhoneSubmit} className="space-y-4">
//                         <div className="relative">
//                             <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
//                             <input
//                                 type="text"
//                                 placeholder="Full Name"
//                                 value={name}
//                                 onChange={(e) => setName(e.target.value)}
//                                 className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f7a221] focus:ring-1 focus:ring-[#f7a221] transition-all"
//                                 required
//                             />
//                         </div>

//                         <div className="relative">
//                             <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
//                             <input
//                                 type="tel"
//                                 placeholder="Phone Number"
//                                 value={phone}
//                                 onChange={(e) => setPhone(e.target.value)}
//                                 className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f7a221] focus:ring-1 focus:ring-[#f7a221] transition-all"
//                                 required
//                             />
//                         </div>

//                         <button
//                             type="submit"
//                             className="w-full bg-[#f7a221] hover:bg-[#e0911c] text-black font-black py-4 px-6 rounded-2xl transition-all"
//                         >
//                             SEND OTP
//                         </button>
                        
//                         <p className="text-xs text-center text-gray-500 mt-2">
//                             Note: Phone verification is coming soon
//                         </p>
//                     </form>
//                 ) : (
//                     // Email Registration Form
//                     <form onSubmit={handleEmailSubmit} className="space-y-4">
//                         <div className="relative">
//                             <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
//                             <input
//                                 type="text"
//                                 placeholder="Full Name"
//                                 value={name}
//                                 onChange={(e) => setName(e.target.value)}
//                                 className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f7a221] focus:ring-1 focus:ring-[#f7a221] transition-all"
//                                 required
//                             />
//                         </div>

//                         <div className="relative">
//                             <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
//                             <input
//                                 type="email"
//                                 placeholder="Email Address"
//                                 value={email}
//                                 onChange={(e) => setEmail(e.target.value)}
//                                 className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f7a221] focus:ring-1 focus:ring-[#f7a221] transition-all"
//                                 required
//                             />
//                         </div>

//                         <div className="relative">
//                             <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
//                             <input
//                                 type="password"
//                                 placeholder="Password (min. 6 characters)"
//                                 value={password}
//                                 onChange={(e) => setPassword(e.target.value)}
//                                 className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f7a221] focus:ring-1 focus:ring-[#f7a221] transition-all"
//                                 required
//                                 minLength="6"
//                             />
//                         </div>

//                         <div className="relative">
//                             <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
//                             <input
//                                 type="tel"
//                                 placeholder="Phone Number (Optional)"
//                                 value={phone}
//                                 onChange={(e) => setPhone(e.target.value)}
//                                 className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f7a221] focus:ring-1 focus:ring-[#f7a221] transition-all"
//                             />
//                         </div>

//                         <button
//                             type="submit"
//                             className="w-full bg-[#f7a221] hover:bg-[#e0911c] text-black font-black py-4 px-6 rounded-2xl transition-all"
//                         >
//                             REGISTER & SEND OTP
//                         </button>
//                     </form>
//                 )}
//             </div>

//             {/* OTP Verification Modal */}
//             {showOtpModal && (
//                 <OtpVerification
//                     email={email}
//                     name={name}
//                     onClose={() => setShowOtpModal(false)}
//                     onVerify={handleOtpVerify}
//                 />
//             )}
//         </>
//     );
// };

// export default Register;