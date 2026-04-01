import React, { useState, useEffect, useRef } from "react";
import { Mail, Key, ChevronLeft, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  forgotPassword,
  resetPassword,
  clearError,
  clearSuccess,
} from "../REDUX_FEATURES/REDUX_SLICES/authSlice";

/*
  RESET PASSWORD FIX
  ──────────────────
  The thunk is defined as createAsyncThunk("auth/reset-password", ...)
  The action creator is named `resetPassword`.
  resetPassword.fulfilled.match() works correctly as long as the slice
  has a `extraReducers` case for "auth/reset-password/fulfilled".

  If your slice uses builder.addCase(resetPassword.fulfilled, ...) it
  will work. If it uses the string "auth/resetPassword/fulfilled" it
  will NOT match — check your slice and make sure the type string
  matches "auth/reset-password/fulfilled".

  ANIMATION FIX
  ─────────────
  Each step gets a unique `key` so React remounts it → lr-slide-right
  CSS animation fires fresh on every step transition.
  The @keyframes are defined in LogRegister and available globally.
*/

const STEPS = ["email", "otp", "password"];

const ForgotPassword = ({ onBack, onLoginClick }) => {
  const dispatch = useDispatch();
  const { loading, error, successMessage } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState("");
  const [step, setStep] = useState("email");
  const otpRefs = useRef([]);

  useEffect(() => {
    dispatch(clearError());
    dispatch(clearSuccess());
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearSuccess());
    }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (localError) {
      toast.error(localError);
      setLocalError("");
    }
  }, [localError]);

  // Auto-focus first OTP box when step changes to otp
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => otpRefs.current[0]?.focus(), 150);
    }
  }, [step]);

  // ── OTP box handlers ──────────────────────────────────────────
  const handleOtpChange = (idx, val) => {
    const cleaned = val.replace(/\D/g, "");
    if (!cleaned && val) return;
    if (cleaned.length > 1) return;
    const next = [...otpDigits];
    next[idx] = cleaned;
    setOtpDigits(next);
    if (cleaned && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace") {
      if (otpDigits[idx]) {
        const next = [...otpDigits];
        next[idx] = "";
        setOtpDigits(next);
      } else if (idx > 0) {
        otpRefs.current[idx - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && idx > 0) otpRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...otpDigits];
    pasted.split("").forEach((ch, i) => { if (i < 6) next[i] = ch; });
    setOtpDigits(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const otpString = otpDigits.join("");
  // ─────────────────────────────────────────────────────────────

  const handleSendOTP = async (e) => {
    e.preventDefault();
    const result = await dispatch(forgotPassword({ email }));
    if (forgotPassword.fulfilled.match(result)) {
      toast.success("OTP sent! Check your inbox.");
      setStep("otp");
    }
  };

  const handleVerifyOTP = (e) => {
    e.preventDefault();
    if (otpString.length !== 6) { setLocalError("Enter all 6 digits"); return; }
    setStep("password");
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setLocalError("Passwords do not match"); return; }
    if (newPassword.length < 6) { setLocalError("Min 6 characters required"); return; }

    /*
      We dispatch resetPassword and check the result.
      resetPassword thunk type = "auth/reset-password"
      fulfilled action type    = "auth/reset-password/fulfilled"
    */
    const result = await dispatch(resetPassword({ email, otp: otpString, newPassword }));

    if (resetPassword.fulfilled.match(result)) {
      toast.success("Password reset! You can now login.");
      setTimeout(() => onLoginClick(), 1800);
    }
    // Errors are handled by the error useEffect above
  };

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="w-full">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-[#f7a221] hover:text-white font-bold text-[10px] tracking-widest transition-colors mb-5 uppercase cursor-pointer touch-manipulation"
      >
        <ChevronLeft size={16} /> Back
      </button>

      <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter mb-1 text-center">
        RESET <span className="text-[#f7a221]">PASSWORD</span>
      </h2>
      <p className="text-white/35 text-[10px] text-center uppercase tracking-widest mb-6">
        Follow steps to recover account
      </p>

      {/* Step progress bar */}
      <div className="flex gap-2 mb-7">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className="flex-1 h-1 rounded-full transition-all duration-500"
            style={{
              background: stepIndex >= i
                ? "#f7a221"
                : "rgba(255,255,255,0.08)",
              boxShadow: stepIndex >= i ? "0 0 8px rgba(247,162,33,0.4)" : "none",
            }}
          />
        ))}
      </div>

      {/* Step label */}
      <p className="text-center text-[10px] font-black tracking-[0.25em] text-white/30 uppercase mb-6">
        Step {stepIndex + 1} of 3 —{" "}
        <span className="text-[#f7a221]">
          {step === "email" ? "Enter Email" : step === "otp" ? "Verify OTP" : "New Password"}
        </span>
      </p>

      {/* ── Step: Email ── */}
      {step === "email" && (
        <form key="fp-email" onSubmit={handleSendOTP} className="space-y-4 lr-slide-right">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" size={17} />
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full bg-white/[0.04] border border-white/10 rounded-2xl py-4 pl-11 pr-4 text-white placeholder:text-white/35 focus:outline-none focus:border-[#f7a221] focus:ring-1 focus:ring-[#f7a221]/30 transition-all text-sm"
              style={{ fontSize: "16px" }}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#f7a221] hover:bg-[#e0911c] active:bg-[#c97e18] disabled:opacity-50 text-black font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm uppercase shadow-[0_8px_20px_rgba(247,162,33,0.25)] cursor-pointer touch-manipulation"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "SEND OTP"}
          </button>
        </form>
      )}

      {/* ── Step: OTP (6 boxes, same as OTPVerification) ── */}
      {step === "otp" && (
        <form key="fp-otp" onSubmit={handleVerifyOTP} className="lr-slide-right">
          <p className="text-center text-white/40 text-[11px] mb-5">
            Sent to <span className="text-white font-bold break-all">{email}</span>
          </p>

          {/* 6-digit boxes */}
          <div className="flex justify-between gap-1.5 sm:gap-2 mb-5" onPaste={handleOtpPaste}>
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (otpRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength="1"
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                style={{ fontSize: "20px" }}
                className="flex-1 min-w-0 aspect-square bg-white/[0.04] border border-white/10 rounded-xl text-center text-white font-black focus:outline-none focus:border-[#f7a221] focus:ring-1 focus:ring-[#f7a221]/40 transition-all caret-transparent touch-manipulation"
                aria-label={`OTP digit ${idx + 1}`}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={otpString.length !== 6}
            className="w-full bg-[#f7a221] hover:bg-[#e0911c] active:bg-[#c97e18] disabled:opacity-40 text-black font-black py-4 rounded-2xl transition-all text-sm uppercase shadow-[0_8px_20px_rgba(247,162,33,0.25)] cursor-pointer touch-manipulation"
          >
            VERIFY OTP
          </button>
          <button
            type="button"
            onClick={() => { setOtpDigits(["","","","","",""]); setStep("email"); }}
            className="w-full text-white/30 hover:text-white text-[10px] font-black tracking-widest uppercase transition-colors mt-3 py-2 touch-manipulation cursor-pointer"
          >
            Change email
          </button>
        </form>
      )}

      {/* ── Step: New Password ── */}
      {step === "password" && (
        <form key="fp-password" onSubmit={handleResetPassword} className="space-y-3.5 lr-slide-right">
          <div className="relative">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" size={17} />
            <input
              type={showNew ? "text" : "password"}
              placeholder="New password (min 6 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full bg-white/[0.04] border border-white/10 rounded-2xl py-4 pl-11 pr-11 text-white placeholder:text-white/35 focus:outline-none focus:border-[#f7a221] focus:ring-1 focus:ring-[#f7a221]/30 transition-all text-sm"
              style={{ fontSize: "16px" }}
              required
              minLength="6"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors touch-manipulation"
              tabIndex={-1}
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="relative">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" size={17} />
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full bg-white/[0.04] border border-white/10 rounded-2xl py-4 pl-11 pr-11 text-white placeholder:text-white/35 focus:outline-none focus:border-[#f7a221] focus:ring-1 focus:ring-[#f7a221]/30 transition-all text-sm"
              style={{ fontSize: "16px" }}
              required
              minLength="6"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors touch-manipulation"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Password match indicator */}
          {confirmPassword.length > 0 && (
            <p className={`text-[10px] font-bold tracking-wide pl-1 ${newPassword === confirmPassword ? "text-green-400" : "text-red-400"}`}>
              {newPassword === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || newPassword !== confirmPassword || newPassword.length < 6}
            className="w-full bg-[#f7a221] hover:bg-[#e0911c] active:bg-[#c97e18] disabled:opacity-40 text-black font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm uppercase shadow-[0_8px_20px_rgba(247,162,33,0.25)] cursor-pointer touch-manipulation"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "RESET PASSWORD"}
          </button>
        </form>
      )}

      {/* Bottom link */}
      <div className="mt-7 text-center border-t border-white/5 pt-5">
        <span className="text-white/25 text-[11px] font-bold tracking-widest uppercase">Remembered it? </span>
        <button
          onClick={onLoginClick}
          className="text-[#f7a221] hover:text-white text-[11px] font-black tracking-widest uppercase underline underline-offset-4 transition-colors cursor-pointer touch-manipulation"
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;

// import React, { useState, useEffect } from "react";
// import { Mail, Key, ChevronLeft, Loader2, CheckCircle2 } from "lucide-react";
// import { useDispatch, useSelector } from "react-redux";
// import { toast } from "react-toastify";
// import { forgotPassword, resetPassword, clearError, clearSuccess } from "../REDUX_FEATURES/REDUX_SLICES/authSlice";

// const ForgotPassword = ({ onBack, onLoginClick }) => {
//   const dispatch = useDispatch();
//   const { loading, error, successMessage } = useSelector((state) => state.auth);

//   const [email, setEmail] = useState("");
//   const [otp, setOtp] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [localError, setLocalError] = useState("");
//   const [step, setStep] = useState("email");

//   useEffect(() => {
//     dispatch(clearError());
//     dispatch(clearSuccess());
//   }, [dispatch]);

//   useEffect(() => {
//     if (successMessage) { toast.success(successMessage); dispatch(clearSuccess()); }
//   }, [successMessage, dispatch]);

//   useEffect(() => {
//     if (error) { toast.error(error); dispatch(clearError()); }
//   }, [error, dispatch]);

//   useEffect(() => {
//     if (localError) { toast.error(localError); setLocalError(""); }
//   }, [localError]);

//   const handleSendOTP = async (e) => {
//     e.preventDefault();
//     const result = await dispatch(forgotPassword({ email }));
//     if (forgotPassword.fulfilled.match(result)) setStep("otp");
//   };

//   const handleVerifyOTP = (e) => {
//     e.preventDefault();
//     if (otp.length !== 6) { setLocalError("Enter 6-digit OTP"); return; }
//     setStep("password");
//   };

//   const handleResetPassword = async (e) => {
//     e.preventDefault();
//     if (newPassword !== confirmPassword) { setLocalError("Passwords do not match"); return; }
//     if (newPassword.length < 6) { setLocalError("Min 6 characters required"); return; }

//     const result = await dispatch(resetPassword({ email, otp, newPassword }));
//     if (resetPassword.fulfilled.match(result)) {
//       setTimeout(() => { onLoginClick(); }, 2000);
//     }
//   };

//   return (
//     <div className="w-full animate-in fade-in slide-in-from-right-4 duration-500">
//       <button onClick={onBack} className="flex items-center gap-1 text-[#f7a221] hover:text-white font-bold text-[10px] tracking-widest transition-all mb-6 uppercase">
//         <ChevronLeft size={16} /> Back
//       </button>

//       <h2 className="text-4xl font-black text-white tracking-tighter mb-2 text-center">
//         RESET <span className="text-[#f7a221]">PASSWORD</span>
//       </h2>
//       <p className="text-gray-500 text-[10px] text-center uppercase tracking-widest mb-8">Follow steps to recover account</p>

//       {/* Modern Step Indicator */}
//       <div className="flex items-center gap-3 mb-10 px-4">
//         {["email", "otp", "password"].map((s, i) => (
//           <div key={s} className="flex-1 flex items-center gap-2">
//             <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
//               ["email", "otp", "password"].indexOf(step) >= i ? "bg-[#f7a221] shadow-[0_0_10px_rgba(247,162,33,0.5)]" : "bg-white/10"
//             }`} />
//           </div>
//         ))}
//       </div>

//       {/* Small Error UI */}
//       {(localError || error) && (
//         <div className="mb-6 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-[11px] text-center font-medium animate-pulse">
//           {localError || error}
//         </div>
//       )}

//       {step === "email" && (
//         <form onSubmit={handleSendOTP} className="space-y-4">
//           <div className="relative">
//             <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
//             <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)}
//               className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-[#f7a221] transition-all text-sm" required />
//           </div>
//           <button type="submit" disabled={loading} className="w-full bg-[#f7a221] hover:bg-[#e0911c] text-black font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-tighter shadow-lg">
//             {loading ? <Loader2 className="animate-spin" size={20} /> : "SEND OTP"}
//           </button>
//         </form>
//       )}

//       {step === "otp" && (
//         <form onSubmit={handleVerifyOTP} className="space-y-4">
//           <div className="relative">
//             <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
//             <input type="text" placeholder="6-Digit OTP" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
//               className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-center tracking-[0.5em] font-black focus:outline-none focus:border-[#f7a221] transition-all text-lg" required maxLength="6" />
//           </div>
//           <button type="submit" className="w-full bg-[#f7a221] hover:bg-[#e0911c] text-black font-black py-4 rounded-2xl transition-all text-sm uppercase">VERIFY OTP</button>
//           <button type="button" onClick={() => setStep("email")} className="w-full text-gray-600 hover:text-white text-[10px] font-black tracking-widest uppercase transition-colors">Change email</button>
//         </form>
//       )}

//       {step === "password" && (
//         <form onSubmit={handleResetPassword} className="space-y-4">
//           <div className="relative">
//             <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
//             <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
//               className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#f7a221] transition-all text-sm" required minLength="6" />
//           </div>
//           <div className="relative">
//             <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
//             <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
//               className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#f7a221] transition-all text-sm" required minLength="6" />
//           </div>
//           <button type="submit" disabled={loading} className="w-full bg-[#f7a221] hover:bg-[#e0911c] text-black font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm uppercase shadow-lg">
//             {loading ? <Loader2 className="animate-spin" size={20} /> : "RESET PASSWORD"}
//           </button>
//         </form>
//       )}

//       <div className="mt-8 text-center border-t border-white/5 pt-6">
//         <span className="text-gray-600 text-[11px] font-bold tracking-widest uppercase">Remembered it? </span>
//         <button onClick={onLoginClick} className="text-[#f7a221] hover:text-white text-[11px] font-black tracking-widest uppercase underline underline-offset-4">Login</button>
//       </div>
//     </div>
//   );
// };

// export default ForgotPassword;


// // components/USER_LOGIN_SEGMENT/ForgotPassword.jsx
// import React, { useState, useEffect } from "react";
// import { Mail, Key, ArrowLeft } from "lucide-react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   forgotPassword,
//   resetPassword,
//   clearError,
//   clearSuccess,
// } from "../REDUX_FEATURES/REDUX_SLICES/authSlice";

// const ForgotPassword = ({ onBack, onLoginClick }) => {
//   const dispatch = useDispatch();
//   const { loading, error, successMessage } = useSelector((state) => state.auth);

//   const [email, setEmail] = useState("");
//   const [otp, setOtp] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [localError, setLocalError] = useState("");
//   const [step, setStep] = useState("email"); // email | otp | password

//   // Clear redux state on mount
//   useEffect(() => {
//     dispatch(clearError());
//     dispatch(clearSuccess());
//   }, [dispatch]);

//   // ✅ Step 1: Send OTP to email
//   const handleSendOTP = async (e) => {
//     e.preventDefault();
//     setLocalError("");
//     dispatch(clearError());

//     const result = await dispatch(forgotPassword({ email }));
//     if (forgotPassword.fulfilled.match(result)) {
//       setStep("otp"); // ✅ Move to OTP step
//     }
//   };

//   // ✅ Step 2: Verify OTP (client-side only, actual verify happens at reset)
//   const handleVerifyOTP = (e) => {
//     e.preventDefault();
//     setLocalError("");
//     if (otp.length !== 6) {
//       setLocalError("Please enter 6-digit OTP");
//       return;
//     }
//     setStep("password"); // ✅ Move to password reset step
//   };

//   // ✅ Step 3: Reset password with OTP
//   const handleResetPassword = async (e) => {
//     e.preventDefault();
//     setLocalError("");
//     dispatch(clearError());

//     if (newPassword !== confirmPassword) {
//       setLocalError("Passwords do not match");
//       return;
//     }
//     if (newPassword.length < 6) {
//       setLocalError("Password must be at least 6 characters");
//       return;
//     }

//     const result = await dispatch(
//       resetPassword({ email, otp, newPassword })
//     );

//     if (resetPassword.fulfilled.match(result)) {
//       // ✅ Password reset — redirect to login after 2s
//       setTimeout(() => {
//         dispatch(clearSuccess());
//         onLoginClick();
//       }, 2000);
//     }
//   };

//   const displayError = localError || error;

//   return (
//     <div className="w-full">
//       <div className="flex items-center gap-4 mb-6">
//         <button onClick={onBack} className="text-gray-500 hover:text-white">
//           <ArrowLeft size={20} />
//         </button>
//         <h2 className="text-3xl font-black text-white tracking-tighter">
//           RESET <span className="text-[#f7a221]">PASSWORD</span>
//         </h2>
//       </div>

//       {/* Steps indicator */}
//       <div className="flex items-center gap-2 mb-6">
//         {["email", "otp", "password"].map((s, i) => (
//           <React.Fragment key={s}>
//             <div
//               className={`h-1 flex-1 rounded-full transition-all ${
//                 ["email", "otp", "password"].indexOf(step) >= i
//                   ? "bg-[#f7a221]"
//                   : "bg-white/10"
//               }`}
//             />
//           </React.Fragment>
//         ))}
//       </div>

//       {/* ✅ Success message */}
//       {successMessage && (
//         <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-sm">
//           {successMessage}
//         </div>
//       )}

//       {/* ✅ Error message */}
//       {displayError && (
//         <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
//           {displayError}
//         </div>
//       )}

//       {/* ── Step 1: Email ─────────────────────────────────────── */}
//       {step === "email" && (
//         <form onSubmit={handleSendOTP} className="space-y-4">
//           <p className="text-gray-400 text-sm mb-4">
//             Enter your registered email to receive a password reset OTP.
//           </p>
//           <div className="relative">
//             <Mail
//               className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
//               size={18}
//             />
//             <input
//               type="email"
//               placeholder="Email Address"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f7a221] focus:ring-1 focus:ring-[#f7a221] transition-all"
//               required
//             />
//           </div>
//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full bg-[#f7a221] hover:bg-[#e0911c] disabled:opacity-60 disabled:cursor-not-allowed text-black font-black py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2"
//           >
//             {loading ? (
//               <span className="flex items-center gap-2">
//                 <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
//                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
//                 </svg>
//                 Sending...
//               </span>
//             ) : (
//               "SEND OTP"
//             )}
//           </button>
//         </form>
//       )}

//       {/* ── Step 2: OTP ───────────────────────────────────────── */}
//       {step === "otp" && (
//         <form onSubmit={handleVerifyOTP} className="space-y-4">
//           <p className="text-gray-400 text-sm mb-4">
//             Enter the 6-digit OTP sent to{" "}
//             <span className="text-[#f7a221]">{email}</span>
//           </p>
//           <div className="relative">
//             <Mail
//               className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
//               size={18}
//             />
//             <input
//               type="text"
//               placeholder="Enter 6-digit OTP"
//               value={otp}
//               onChange={(e) =>
//                 setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
//               }
//               className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f7a221] focus:ring-1 focus:ring-[#f7a221] transition-all tracking-[0.5em] text-center text-lg"
//               required
//               maxLength="6"
//               inputMode="numeric"
//             />
//           </div>
//           <button
//             type="submit"
//             className="w-full bg-[#f7a221] hover:bg-[#e0911c] text-black font-black py-4 px-6 rounded-2xl transition-all"
//           >
//             VERIFY OTP
//           </button>
//           <button
//             type="button"
//             onClick={() => setStep("email")}
//             className="w-full text-gray-500 hover:text-white text-sm transition-colors"
//           >
//             ← Change email
//           </button>
//         </form>
//       )}

//       {/* ── Step 3: New Password ──────────────────────────────── */}
//       {step === "password" && (
//         <form onSubmit={handleResetPassword} className="space-y-4">
//           <p className="text-gray-400 text-sm mb-4">
//             Enter your new password below.
//           </p>
//           <div className="relative">
//             <Key
//               className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
//               size={18}
//             />
//             <input
//               type="password"
//               placeholder="New Password"
//               value={newPassword}
//               onChange={(e) => setNewPassword(e.target.value)}
//               className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f7a221] focus:ring-1 focus:ring-[#f7a221] transition-all"
//               required
//               minLength="6"
//             />
//           </div>
//           <div className="relative">
//             <Key
//               className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
//               size={18}
//             />
//             <input
//               type="password"
//               placeholder="Confirm Password"
//               value={confirmPassword}
//               onChange={(e) => setConfirmPassword(e.target.value)}
//               className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#f7a221] focus:ring-1 focus:ring-[#f7a221] transition-all"
//               required
//               minLength="6"
//             />
//           </div>
//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full bg-[#f7a221] hover:bg-[#e0911c] disabled:opacity-60 disabled:cursor-not-allowed text-black font-black py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2"
//           >
//             {loading ? (
//               <span className="flex items-center gap-2">
//                 <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
//                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
//                 </svg>
//                 Resetting...
//               </span>
//             ) : (
//               "RESET PASSWORD"
//             )}
//           </button>
//         </form>
//       )}

//       <div className="mt-6 text-center">
//         <span className="text-gray-500 text-sm">Remember your password? </span>
//         <button
//           onClick={onLoginClick}
//           className="text-[#f7a221] hover:underline text-sm font-medium"
//         >
//           Login here
//         </button>
//       </div>
//     </div>
//   );
// };

// export default ForgotPassword;

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