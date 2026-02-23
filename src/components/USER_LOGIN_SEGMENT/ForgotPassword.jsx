// components/USER_LOGIN_SEGMENT/ForgotPassword.jsx
import React, { useState, useEffect } from "react";
import { Mail, Key, ArrowLeft } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  forgotPassword,
  resetPassword,
  clearError,
  clearSuccess,
} from "../REDUX_FEATURES/REDUX_SLICES/authSlice";

const ForgotPassword = ({ onBack, onLoginClick }) => {
  const dispatch = useDispatch();
  const { loading, error, successMessage } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [step, setStep] = useState("email"); // email | otp | password

  // Clear redux state on mount
  useEffect(() => {
    dispatch(clearError());
    dispatch(clearSuccess());
  }, [dispatch]);

  // ✅ Step 1: Send OTP to email
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLocalError("");
    dispatch(clearError());

    const result = await dispatch(forgotPassword({ email }));
    if (forgotPassword.fulfilled.match(result)) {
      setStep("otp"); // ✅ Move to OTP step
    }
  };

  // ✅ Step 2: Verify OTP (client-side only, actual verify happens at reset)
  const handleVerifyOTP = (e) => {
    e.preventDefault();
    setLocalError("");
    if (otp.length !== 6) {
      setLocalError("Please enter 6-digit OTP");
      return;
    }
    setStep("password"); // ✅ Move to password reset step
  };

  // ✅ Step 3: Reset password with OTP
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLocalError("");
    dispatch(clearError());

    if (newPassword !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }

    const result = await dispatch(
      resetPassword({ email, otp, newPassword })
    );

    if (resetPassword.fulfilled.match(result)) {
      // ✅ Password reset — redirect to login after 2s
      setTimeout(() => {
        dispatch(clearSuccess());
        onLoginClick();
      }, 2000);
    }
  };

  const displayError = localError || error;

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="text-gray-500 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-3xl font-black text-white tracking-tighter">
          RESET <span className="text-[#f7a221]">PASSWORD</span>
        </h2>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-6">
        {["email", "otp", "password"].map((s, i) => (
          <React.Fragment key={s}>
            <div
              className={`h-1 flex-1 rounded-full transition-all ${
                ["email", "otp", "password"].indexOf(step) >= i
                  ? "bg-[#f7a221]"
                  : "bg-white/10"
              }`}
            />
          </React.Fragment>
        ))}
      </div>

      {/* ✅ Success message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-sm">
          {successMessage}
        </div>
      )}

      {/* ✅ Error message */}
      {displayError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
          {displayError}
        </div>
      )}

      {/* ── Step 1: Email ─────────────────────────────────────── */}
      {step === "email" && (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <p className="text-gray-400 text-sm mb-4">
            Enter your registered email to receive a password reset OTP.
          </p>
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
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#f7a221] hover:bg-[#e0911c] disabled:opacity-60 disabled:cursor-not-allowed text-black font-black py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Sending...
              </span>
            ) : (
              "SEND OTP"
            )}
          </button>
        </form>
      )}

      {/* ── Step 2: OTP ───────────────────────────────────────── */}
      {step === "otp" && (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <p className="text-gray-400 text-sm mb-4">
            Enter the 6-digit OTP sent to{" "}
            <span className="text-[#f7a221]">{email}</span>
          </p>
          <div className="relative">
            <Mail
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f7a221] focus:ring-1 focus:ring-[#f7a221] transition-all tracking-[0.5em] text-center text-lg"
              required
              maxLength="6"
              inputMode="numeric"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#f7a221] hover:bg-[#e0911c] text-black font-black py-4 px-6 rounded-2xl transition-all"
          >
            VERIFY OTP
          </button>
          <button
            type="button"
            onClick={() => setStep("email")}
            className="w-full text-gray-500 hover:text-white text-sm transition-colors"
          >
            ← Change email
          </button>
        </form>
      )}

      {/* ── Step 3: New Password ──────────────────────────────── */}
      {step === "password" && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-gray-400 text-sm mb-4">
            Enter your new password below.
          </p>
          <div className="relative">
            <Key
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              size={18}
            />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f7a221] focus:ring-1 focus:ring-[#f7a221] transition-all"
              required
              minLength="6"
            />
          </div>
          <div className="relative">
            <Key
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              size={18}
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f7a221] focus:ring-1 focus:ring-[#f7a221] transition-all"
              required
              minLength="6"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#f7a221] hover:bg-[#e0911c] disabled:opacity-60 disabled:cursor-not-allowed text-black font-black py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Resetting...
              </span>
            ) : (
              "RESET PASSWORD"
            )}
          </button>
        </form>
      )}

      <div className="mt-6 text-center">
        <span className="text-gray-500 text-sm">Remember your password? </span>
        <button
          onClick={onLoginClick}
          className="text-[#f7a221] hover:underline text-sm font-medium"
        >
          Login here
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;

// // components/USER_LOGIN_SEGMENT/ForgotPassword.jsx
// import React, { useState } from 'react';
// import { Mail, Key, ArrowLeft } from 'lucide-react';

// const ForgotPassword = ({ onBack, onLoginClick }) => {
//     const [email, setEmail] = useState('');
//     const [otp, setOtp] = useState('');
//     const [newPassword, setNewPassword] = useState('');
//     const [confirmPassword, setConfirmPassword] = useState('');
//     const [localError, setLocalError] = useState('');
//     const [success, setSuccess] = useState('');
//     const [step, setStep] = useState('email'); // email, otp, password

//     const handleSendOTP = (e) => {
//         e.preventDefault();
//         setLocalError('');
        
//         if (!email) {
//             setLocalError('Please enter your email');
//             return;
//         }

//         setStep('otp');
//         alert('OTP sent to your email! (Demo)');
//     };

//     const handleVerifyOTP = (e) => {
//         e.preventDefault();
//         if (otp.length !== 6) {
//             setLocalError('Please enter 6-digit OTP');
//             return;
//         }
//         setStep('password');
//         setLocalError('');
//     };

//     const handleResetPassword = (e) => {
//         e.preventDefault();
//         setLocalError('');

//         if (newPassword !== confirmPassword) {
//             setLocalError('Passwords do not match');
//             return;
//         }

//         if (newPassword.length < 6) {
//             setLocalError('Password must be at least 6 characters');
//             return;
//         }

//         setSuccess('Password reset successful! Please login.');
//         setTimeout(() => {
//             onLoginClick();
//         }, 2000);
//     };

//     return (
//         <div className="w-full">
//             <div className="flex items-center gap-4 mb-6">
//                 <button 
//                     onClick={onBack}
//                     className="text-gray-500 hover:text-white"
//                 >
//                     <ArrowLeft size={20} />
//                 </button>
//                 <h2 className="text-3xl font-black text-white tracking-tighter">
//                     RESET <span className="text-[#f7a221]">PASSWORD</span>
//                 </h2>
//             </div>

//             {success && (
//                 <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-sm">
//                     {success}
//                 </div>
//             )}

//             {localError && (
//                 <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
//                     {localError}
//                 </div>
//             )}

//             {step === 'email' && (
//                 <form onSubmit={handleSendOTP} className="space-y-4">
//                     <div className="relative">
//                         <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
//                         <input
//                             type="email"
//                             placeholder="Email Address"
//                             value={email}
//                             onChange={(e) => setEmail(e.target.value)}
//                             className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f7a221] focus:ring-1 focus:ring-[#f7a221] transition-all"
//                             required
//                         />
//                     </div>

//                     <button
//                         type="submit"
//                         className="w-full bg-[#f7a221] hover:bg-[#e0911c] text-black font-black py-4 px-6 rounded-2xl transition-all"
//                     >
//                         SEND OTP
//                     </button>
//                 </form>
//             )}

//             {step === 'otp' && (
//                 <form onSubmit={handleVerifyOTP} className="space-y-4">
//                     <div className="relative">
//                         <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
//                         <input
//                             type="text"
//                             placeholder="Enter 6-digit OTP"
//                             value={otp}
//                             onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
//                             className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f7a221] focus:ring-1 focus:ring-[#f7a221] transition-all"
//                             required
//                             maxLength="6"
//                         />
//                     </div>

//                     <button
//                         type="submit"
//                         className="w-full bg-[#f7a221] hover:bg-[#e0911c] text-black font-black py-4 px-6 rounded-2xl transition-all"
//                     >
//                         VERIFY OTP
//                     </button>
//                 </form>
//             )}

//             {step === 'password' && (
//                 <form onSubmit={handleResetPassword} className="space-y-4">
//                     <div className="relative">
//                         <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
//                         <input
//                             type="password"
//                             placeholder="New Password"
//                             value={newPassword}
//                             onChange={(e) => setNewPassword(e.target.value)}
//                             className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f7a221] focus:ring-1 focus:ring-[#f7a221] transition-all"
//                             required
//                             minLength="6"
//                         />
//                     </div>

//                     <div className="relative">
//                         <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
//                         <input
//                             type="password"
//                             placeholder="Confirm Password"
//                             value={confirmPassword}
//                             onChange={(e) => setConfirmPassword(e.target.value)}
//                             className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f7a221] focus:ring-1 focus:ring-[#f7a221] transition-all"
//                             required
//                             minLength="6"
//                         />
//                     </div>

//                     <button
//                         type="submit"
//                         className="w-full bg-[#f7a221] hover:bg-[#e0911c] text-black font-black py-4 px-6 rounded-2xl transition-all"
//                     >
//                         RESET PASSWORD
//                     </button>
//                 </form>
//             )}

//             <div className="mt-6 text-center">
//                 <span className="text-gray-500 text-sm">Remember your password? </span>
//                 <button 
//                     onClick={onLoginClick}
//                     className="text-[#f7a221] hover:underline text-sm font-medium"
//                 >
//                     Login here
//                 </button>
//             </div>
//         </div>
//     );
// };

// export default ForgotPassword;