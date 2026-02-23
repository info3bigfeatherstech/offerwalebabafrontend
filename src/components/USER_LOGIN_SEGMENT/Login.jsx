// components/USER_LOGIN_SEGMENT/Login.jsx
import React, { useState, useEffect } from "react";
import { Mail, Lock, LogIn, Phone } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, googleLogin, clearError } from "../REDUX_FEATURES/REDUX_SLICES/authSlice";

const Login = ({ onLoginSuccess, onRegisterClick, onForgotPasswordClick }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPhoneMessage, setShowPhoneMessage] = useState(false);

  // Clear any previous errors when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // ✅ Initialize Google Sign-In button
  useEffect(() => {
    const initializeGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id:
            import.meta.env.VITE_GOOGLE_CLIENT_ID || "demo-client-id",
          callback: handleGoogleResponse,
          ux_mode: "popup",
        });

        const btnContainer = document.getElementById("google-login-btn");
        if (btnContainer) {
          window.google.accounts.id.renderButton(btnContainer, {
            theme: "filled_black",
            size: "large",
            width: btnContainer.offsetWidth,
            shape: "pill",
            text: "signin_with",
          });
        }
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

  // ✅ Handle Google response — dispatch googleLogin thunk
  const handleGoogleResponse = async (response) => {
    const result = await dispatch(googleLogin({ idToken: response.credential }));
    if (googleLogin.fulfilled.match(result)) {
      onLoginSuccess();
    }
  };

  // ✅ Handle email/password login — dispatch loginUser thunk
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    dispatch(clearError());

    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(result)) {
      onLoginSuccess();
    }
  };

  const handlePhoneLogin = () => {
    setShowPhoneMessage(true);
    setTimeout(() => setShowPhoneMessage(false), 3000);
  };

  return (
    <div className="w-full">
      <h2 className="text-4xl font-black text-white mb-2 tracking-tighter">
        WELCOME <span className="text-[#f7a221]">BACK</span>
      </h2>
      <p className="text-gray-500 text-sm mb-8">Login to access your VIP deals</p>

      {/* ✅ API Error from Redux */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* Phone Coming Soon */}
      {showPhoneMessage && (
        <div className="mb-4 p-3 bg-[#f7a221]/10 border border-[#f7a221]/20 rounded-xl text-[#f7a221] text-sm">
          Phone login is coming soon! Please use email or Google.
        </div>
      )}

      {/* Google Sign In */}
      <div className="mb-4 overflow-hidden flex justify-center">
        <div id="google-login-btn" className="w-full min-h-[50px]"></div>
      </div>

      {/* Phone Login Button */}
      <button
        onClick={handlePhoneLogin}
        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 mb-4"
      >
        <Phone size={18} />
        Login with Phone Number
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-4 bg-[#0d0d0d] text-gray-500">
            OR LOGIN WITH EMAIL
          </span>
        </div>
      </div>

      {/* Email Login Form */}
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div className="relative">
          <Mail
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
            size={18}
          />
          <input
            type="email"
            placeholder="Email address"
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
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f7a221] focus:ring-1 focus:ring-[#f7a221] transition-all"
            required
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onForgotPasswordClick}
            className="text-sm text-gray-500 hover:text-[#f7a221] transition-colors"
          >
            Forgot Password?
          </button>
        </div>

        {/* ✅ Shows loading spinner while API call is in progress */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#f7a221] hover:bg-[#e0911c] disabled:opacity-60 disabled:cursor-not-allowed text-black font-black py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 text-lg tracking-tight"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Logging in...
            </span>
          ) : (
            <>
              <LogIn size={20} />
              LOGIN
            </>
          )}
        </button>
      </form>

      {/* Register Link */}
      <div className="mt-6 text-center">
        <span className="text-gray-500 text-sm">Don't have an account? </span>
        <button
          onClick={onRegisterClick}
          className="text-[#f7a221] hover:underline text-sm font-medium"
        >
          Register here
        </button>
      </div>
    </div>
  );
};

export default Login;


// // components/USER_LOGIN_SEGMENT/Login.jsx
// import React, { useState, useEffect } from 'react';
// import { Mail, Lock, LogIn, Phone } from 'lucide-react';

// const Login = ({ onLoginSuccess, onRegisterClick, onForgotPasswordClick }) => {
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [showPhoneMessage, setShowPhoneMessage] = useState(false);
//     const [localError, setLocalError] = useState('');

//     // Load Google Script and initialize
//     useEffect(() => {
//         const initializeGoogle = () => {
//             if (window.google) {
//                 window.google.accounts.id.initialize({
//                     client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'demo-client-id',
//                     callback: handleGoogleResponse,
//                     ux_mode: "popup",
//                 });

//                 const btnContainer = document.getElementById('google-login-btn');
//                 if (btnContainer) {
//                     window.google.accounts.id.renderButton(btnContainer, {
//                         theme: 'filled_black',
//                         size: 'large',
//                         width: btnContainer.offsetWidth,
//                         shape: 'pill',
//                         text: 'signin_with',
//                     });
//                 }
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
//         console.log('Google login demo:', response);
//         alert('Google login successful! (Demo)');
//         onLoginSuccess();
//     };

//     const handleEmailLogin = (e) => {
//         e.preventDefault();
//         setLocalError('');
        
//         if (!email || !password) {
//             setLocalError('Please fill in all fields');
//             return;
//         }

//         // Demo login - just show success
//         alert('Login successful! (Demo)');
//         onLoginSuccess();
//     };

//     const handlePhoneLogin = () => {
//         setShowPhoneMessage(true);
//         setTimeout(() => setShowPhoneMessage(false), 3000);
//     };

//     return (
//         <div className="w-full">
//             <h2 className="text-4xl font-black text-white mb-2 tracking-tighter">
//                 WELCOME <span className="text-[#f7a221]">BACK</span>
//             </h2>
//             <p className="text-gray-500 text-sm mb-8">Login to access your VIP deals</p>

//             {/* Error Message */}
//             {localError && (
//                 <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
//                     {localError}
//                 </div>
//             )}

//             {/* Phone Coming Soon Message */}
//             {showPhoneMessage && (
//                 <div className="mb-4 p-3 bg-[#f7a221]/10 border border-[#f7a221]/20 rounded-xl text-[#f7a221] text-sm">
//                     Phone login is coming soon! Please use email or Google.
//                 </div>
//             )}

//             {/* Google Sign In Container */}
//             <div className="mb-4 overflow-hidden flex justify-center">
//                 <div 
//                     id="google-login-btn" 
//                     className="w-full min-h-[50px]"
//                 ></div>
//             </div>

//             {/* Phone Login Button */}
//             <button 
//                 onClick={handlePhoneLogin}
//                 className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 mb-4"
//             >
//                 <Phone size={18} />
//                 Login with Phone Number
//             </button>

//             <div className="relative my-6">
//                 <div className="absolute inset-0 flex items-center">
//                     <div className="w-full border-t border-white/10"></div>
//                 </div>
//                 <div className="relative flex justify-center text-xs">
//                     <span className="px-4 bg-[#0d0d0d] text-gray-500">OR LOGIN WITH EMAIL</span>
//                 </div>
//             </div>

//             {/* Email Login Form */}
//             <form onSubmit={handleEmailLogin} className="space-y-4">
//                 <div className="relative">
//                     <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
//                     <input
//                         type="email"
//                         placeholder="Email address"
//                         value={email}
//                         onChange={(e) => setEmail(e.target.value)}
//                         className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f7a221] focus:ring-1 focus:ring-[#f7a221] transition-all"
//                         required
//                     />
//                 </div>

//                 <div className="relative">
//                     <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
//                     <input
//                         type="password"
//                         placeholder="Password"
//                         value={password}
//                         onChange={(e) => setPassword(e.target.value)}
//                         className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f7a221] focus:ring-1 focus:ring-[#f7a221] transition-all"
//                         required
//                     />
//                 </div>

//                 <div className="flex justify-end">
//                     <button 
//                         type="button"
//                         onClick={onForgotPasswordClick}
//                         className="text-sm text-gray-500 hover:text-[#f7a221] transition-colors"
//                     >
//                         Forgot Password?
//                     </button>
//                 </div>

//                 <button
//                     type="submit"
//                     className="w-full bg-[#f7a221] hover:bg-[#e0911c] text-black font-black py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 text-lg tracking-tight"
//                 >
//                     <LogIn size={20} />
//                     LOGIN
//                 </button>
//             </form>

//             {/* Register Link */}
//             <div className="mt-6 text-center">
//                 <span className="text-gray-500 text-sm">Don't have an account? </span>
//                 <button 
//                     onClick={onRegisterClick}
//                     className="text-[#f7a221] hover:underline text-sm font-medium"
//                 >
//                     Register here
//                 </button>
//             </div>
//         </div>
//     );
// };

// export default Login;