// components/USER_LOGIN_SEGMENT/OTPVerification.jsx
import React, { useState, useEffect, useRef } from "react";
import { Mail, ArrowLeft, Clock } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  verifyOTP,
  registerUser,
  clearError,
} from "../REDUX_FEATURES/REDUX_SLICES/authSlice";

const OtpVerification = ({ email, name, onClose, onVerify }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [localError, setLocalError] = useState("");
  const [resendSuccess, setResendSuccess] = useState(false);
  const inputRefs = useRef([]);

  // Clear redux errors on mount
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Countdown timer
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setLocalError("");
    dispatch(clearError());

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ✅ Resend OTP — re-triggers register API which resends OTP
  const handleResend = async () => {
    if (!canResend) return;

    setTimer(60);
    setCanResend(false);
    setOtp(["", "", "", "", "", ""]);
    setLocalError("");
    dispatch(clearError());

    // Re-call register with email to resend OTP (backend handles resend)
    const result = await dispatch(
      registerUser({ name: name || "User", email, password: "__resend__" })
    );

    if (registerUser.fulfilled.match(result)) {
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    }
  };

  // ✅ Verify OTP — dispatch verifyOTP thunk
  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setLocalError("Please enter the 6-digit OTP");
      return;
    }

    setLocalError("");
    const result = await dispatch(verifyOTP({ email, otp: otpString }));

    if (verifyOTP.fulfilled.match(result)) {
      onVerify(); // ✅ Success — close modal + proceed
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const displayError = localError || error;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[#0d0d0d] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="relative p-6 border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h3 className="text-xl font-black text-white text-center tracking-tighter">
            VERIFY <span className="text-[#f7a221]">OTP</span>
          </h3>
        </div>

        <div className="p-8">
          {/* Email display */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[#f7a221]/10 flex items-center justify-center mb-4 border border-[#f7a221]/20">
              <Mail className="text-[#f7a221]" size={28} />
            </div>
            <p className="text-gray-300 text-center mb-1">
              {name && (
                <span className="text-white font-bold">Hi {name}, </span>
              )}
              We've sent a 6-digit code to
            </p>
            <p className="text-[#f7a221] font-bold text-lg break-all">{email}</p>
          </div>

          {/* Error */}
          {displayError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center">
              {displayError}
            </div>
          )}

          {/* Resend success */}
          {resendSuccess && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-sm text-center">
              OTP resent successfully!
            </div>
          )}

          {/* OTP inputs */}
          <div
            className="flex justify-center gap-2 mb-6"
            onPaste={handlePaste}
          >
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-white text-xl font-bold focus:outline-none focus:border-[#f7a221] focus:ring-1 focus:ring-[#f7a221] transition-all"
                autoFocus={index === 0}
              />
            ))}
          </div>

          {/* Timer / Resend */}
          <div className="flex items-center justify-center gap-2 text-gray-500 mb-8">
            <Clock size={16} />
            <span className="text-sm">
              {canResend ? (
                <button
                  onClick={handleResend}
                  className="text-[#f7a221] hover:underline font-medium"
                >
                  Resend Code
                </button>
              ) : (
                `Resend in 00:${timer.toString().padStart(2, "0")}`
              )}
            </span>
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={otp.join("").length !== 6 || loading}
            className={`w-full py-4 px-6 rounded-2xl font-black tracking-tight text-lg transition-all flex items-center justify-center gap-2 ${
              otp.join("").length === 6 && !loading
                ? "bg-[#f7a221] hover:bg-[#e0911c] text-black"
                : "bg-white/5 text-gray-500 cursor-not-allowed"
            }`}
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
                Verifying...
              </span>
            ) : (
              "VERIFY & CONTINUE"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OtpVerification;

// // components/USER_LOGIN_SEGMENT/OtpVerification.jsx
// import React, { useState, useEffect, useRef } from 'react';
// import { Mail, ArrowLeft, Clock } from 'lucide-react';

// const OtpVerification = ({ email, name, onClose, onVerify }) => {
//     const [otp, setOtp] = useState(['', '', '', '', '', '']);
//     const [timer, setTimer] = useState(60);
//     const [canResend, setCanResend] = useState(false);
//     const [localError, setLocalError] = useState('');
//     const inputRefs = useRef([]);

//     useEffect(() => {
//         if (timer > 0) {
//             const interval = setInterval(() => {
//                 setTimer((prev) => prev - 1);
//             }, 1000);
//             return () => clearInterval(interval);
//         } else {
//             setCanResend(true);
//         }
//     }, [timer]);

//     const handleOtpChange = (index, value) => {
//         if (value.length > 1) return;
        
//         const newOtp = [...otp];
//         newOtp[index] = value;
//         setOtp(newOtp);

//         if (value && index < 5) {
//             inputRefs.current[index + 1]?.focus();
//         }
//     };

//     const handleKeyDown = (index, e) => {
//         if (e.key === 'Backspace' && !otp[index] && index > 0) {
//             inputRefs.current[index - 1]?.focus();
//         }
//     };

//     const handleResend = () => {
//         if (!canResend) return;
        
//         setTimer(60);
//         setCanResend(false);
//         setOtp(['', '', '', '', '', '']);
//         alert('OTP resent! (Demo)');
//     };

//     const handleVerify = () => {
//         const otpString = otp.join('');
//         if (otpString.length !== 6) {
//             setLocalError('Please enter 6-digit OTP');
//             return;
//         }

//         setLocalError('');
//         alert('OTP verified successfully! (Demo)');
//         onVerify();
//     };

//     return (
//         <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
//             <div className="relative w-full max-w-md bg-[#0d0d0d] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden">
                
//                 <div className="relative p-6 border-b border-white/10">
//                     <button 
//                         onClick={onClose}
//                         className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-white transition-colors"
//                     >
//                         <ArrowLeft size={20} />
//                     </button>
//                     <h3 className="text-xl font-black text-white text-center tracking-tighter">
//                         VERIFY <span className="text-[#f7a221]">OTP</span>
//                     </h3>
//                 </div>

//                 <div className="p-8">
//                     <div className="flex flex-col items-center mb-8">
//                         <div className="w-16 h-16 rounded-full bg-[#f7a221]/10 flex items-center justify-center mb-4 border border-[#f7a221]/20">
//                             <Mail className="text-[#f7a221]" size={28} />
//                         </div>
                        
//                         <p className="text-gray-300 text-center mb-1">
//                             {name && <span className="text-white font-bold">Hi {name}, </span>}
//                             We've sent a 6-digit code to
//                         </p>
//                         <p className="text-[#f7a221] font-bold text-lg break-all">
//                             {email}
//                         </p>
//                     </div>

//                     {localError && (
//                         <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center">
//                             {localError}
//                         </div>
//                     )}

//                     <div className="flex justify-center gap-2 mb-6">
//                         {otp.map((digit, index) => (
//                             <input
//                                 key={index}
//                                 ref={(el) => (inputRefs.current[index] = el)}
//                                 type="text"
//                                 maxLength="1"
//                                 value={digit}
//                                 onChange={(e) => handleOtpChange(index, e.target.value)}
//                                 onKeyDown={(e) => handleKeyDown(index, e)}
//                                 className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-white text-xl font-bold focus:outline-none focus:border-[#f7a221] focus:ring-1 focus:ring-[#f7a221] transition-all"
//                                 autoFocus={index === 0}
//                             />
//                         ))}
//                     </div>

//                     <div className="flex items-center justify-center gap-2 text-gray-500 mb-8">
//                         <Clock size={16} />
//                         <span className="text-sm">
//                             {canResend ? (
//                                 <button 
//                                     onClick={handleResend}
//                                     className="text-[#f7a221] hover:underline font-medium"
//                                 >
//                                     Resend Code
//                                 </button>
//                             ) : (
//                                 `Resend in 00:${timer.toString().padStart(2, '0')}`
//                             )}
//                         </span>
//                     </div>

//                     <button
//                         onClick={handleVerify}
//                         disabled={otp.join('').length !== 6}
//                         className={`w-full py-4 px-6 rounded-2xl font-black tracking-tight text-lg transition-all ${
//                             otp.join('').length === 6
//                                 ? 'bg-[#f7a221] hover:bg-[#e0911c] text-black'
//                                 : 'bg-white/5 text-gray-500 cursor-not-allowed'
//                         }`}
//                     >
//                         VERIFY & CONTINUE
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default OtpVerification;