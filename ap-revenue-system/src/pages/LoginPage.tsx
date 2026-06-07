// ============================================================
// AP Revenue ICAMS - Login Page
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, RefreshCw, Shield, Phone, KeyRound, User, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { login, generateCaptcha, generateOTP, storeOTP, verifyOTP, createSession, logAudit } from '../services/authService';
import { useAppStore } from '../store/appStore';
import { userDB } from '../services/dbService';

type LoginStep = 'credentials' | 'otp';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession, isAuthenticated } = useAppStore();

  const [step, setStep] = useState<LoginStep>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [otpInput, setOtpInput] = useState('');
  const [pendingUser, setPendingUser] = useState<{ id: string; userId: string; fullName: string; mobile: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otpTimer, setOtpTimer] = useState(300); // 5 mins
  const [demoOTP, setDemoOTP] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // If already logged in, redirect
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated]);

  // OTP countdown timer
  useEffect(() => {
    if (step === 'otp') {
      setOtpTimer(300);
      timerRef.current = setInterval(() => {
        setOtpTimer(t => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [step]);

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setCaptchaInput('');
  };

  const validateCredentials = () => {
    const newErrors: Record<string, string> = {};
    if (!username.trim()) newErrors.username = 'Username is required';
    if (!password) newErrors.password = 'Password is required';
    if (password.length < 4) newErrors.password = 'Password must be at least 4 characters';
    if (!captchaInput.trim()) newErrors.captcha = 'Please enter the captcha';
    if (captchaInput.toUpperCase() !== captcha.text) newErrors.captcha = 'Incorrect captcha. Please try again.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCredentials()) {
      refreshCaptcha();
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(username, password);
      if (!result.success || !result.user) {
        toast.error(result.error || 'Login failed');
        refreshCaptcha();
        setIsLoading(false);
        return;
      }

      // Generate and "send" OTP
      const otp = generateOTP();
      storeOTP(otp, result.user.mobile);
      setDemoOTP(otp); // Show for demo purposes
      setPendingUser({
        id: result.user.id,
        userId: result.user.userId,
        fullName: result.user.fullName,
        mobile: result.user.mobile,
      });
      setStep('otp');
      toast.success(`OTP sent to ${result.user.mobile.replace(/(\d{2})\d{6}(\d{2})/, '$1XXXXXX$2')}`, { duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput.trim() || otpInput.length !== 6) {
      setErrors({ otp: 'Please enter the 6-digit OTP' });
      return;
    }

    setIsLoading(true);
    try {
      if (!verifyOTP(otpInput)) {
        setErrors({ otp: 'Invalid or expired OTP. Please try again.' });
        setIsLoading(false);
        return;
      }

      // Get full user and create session
      const user = await userDB.getByUserId(pendingUser!.userId);
      if (!user) {
        toast.error('User data error. Contact administrator.');
        setIsLoading(false);
        return;
      }

      const session = createSession(user);
      setSession(session, user);

      // Update last login
      user.lastLogin = new Date().toISOString();
      await userDB.update(user);

      await logAudit(user.userId, user.fullName, 'LOGIN', 'Auth', 'User logged in successfully');

      toast.success(`Welcome, ${user.fullName}!`);
      const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimer = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Left panel - branding */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 bg-ap-blue flex-col items-center justify-center relative overflow-hidden"
      >
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />
        <div className="absolute inset-0 opacity-5">
          <div className="h-0.5 bg-ap-gold absolute w-full" style={{ top: '30%' }} />
          <div className="h-0.5 bg-ap-gold absolute w-full" style={{ top: '70%' }} />
        </div>

        <div className="z-10 text-center px-12">
          {/* AP Emblem */}
          <div className="w-28 h-28 rounded-full border-4 border-ap-gold flex items-center justify-center mx-auto mb-8 bg-white/10">
            <svg viewBox="0 0 80 80" className="w-20 h-20" fill="none">
              <circle cx="40" cy="40" r="36" stroke="#C8960C" strokeWidth="2.5" />
              <circle cx="40" cy="40" r="28" stroke="#C8960C" strokeWidth="1" />
              <circle cx="40" cy="25" r="8" stroke="#C8960C" strokeWidth="2" />
              <path d="M24 40 Q40 55 56 40" stroke="#C8960C" strokeWidth="2.5" fill="none" />
              <path d="M28 60 L40 46 L52 60" stroke="#C8960C" strokeWidth="1.5" fill="none" />
              <text x="40" y="78" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#C8960C" fontFamily="serif">AP GOVT</text>
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-white font-display leading-tight">
            Government of<br />Andhra Pradesh
          </h1>
          <div className="w-16 h-0.5 bg-ap-gold mx-auto my-4" />
          <h2 className="text-ap-gold-light text-lg font-semibold">Revenue Department</h2>
          <p className="text-white/70 text-sm mt-2 leading-relaxed">
            Integrated Citizen Asset<br />Management System
          </p>

          {/* Feature bullets */}
          <div className="mt-10 space-y-3 text-left">
            {[
              '🏗️ Manage Land & Property Records',
              '🚗 Track Vehicle Registrations',
              '🛒 Ration Card Administration',
              '🔍 AI-Powered NLP Search',
              '📊 Comprehensive Reports',
            ].map(f => (
              <div key={f} className="flex items-center gap-2 text-white/80 text-sm">
                <span>{f}</span>
              </div>
            ))}
          </div>

          <p className="text-white/30 text-xs mt-12">For Authorized Personnel Only</p>
        </div>
      </motion.div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Top gold bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-ap-gold" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-ap-blue flex items-center justify-center mx-auto mb-3">
              <Shield size={26} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-ap-blue">Officer Login</h2>
            <p className="text-gray-500 text-sm mt-1">AP Revenue ICAMS — Secure Access Portal</p>
          </div>

          {/* Demo credentials notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6">
            <p className="text-amber-800 text-xs font-semibold mb-1">⚡ Demo Credentials (Password: any 4+ chars)</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-amber-700">
              <span><strong>admin</strong> — Administrator</span>
              <span><strong>revenue_officer</strong> — Revenue Officer</span>
              <span><strong>data_operator</strong> — Data Entry</span>
              <span><strong>readonly_officer</strong> — Read Only</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-gov-lg border border-gray-100 overflow-hidden">
            {/* Step indicator */}
            <div className="flex">
              <div className={`flex-1 h-1 ${step === 'credentials' ? 'bg-ap-blue' : 'bg-ap-gold'}`} />
              <div className={`flex-1 h-1 ${step === 'otp' ? 'bg-ap-gold' : 'bg-gray-200'}`} />
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {/* Step 1: Credentials */}
                {step === 'credentials' && (
                  <motion.form
                    key="credentials"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    onSubmit={handleCredentialSubmit}
                    className="space-y-4"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-ap-blue text-white flex items-center justify-center text-xs font-bold">1</span>
                        Enter Credentials
                      </h3>
                    </div>

                    {/* Username */}
                    <div>
                      <label className="gov-label">Username / Officer ID</label>
                      <div className="relative">
                        <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={username}
                          onChange={e => setUsername(e.target.value)}
                          className={`gov-input pl-9 ${errors.username ? 'border-red-400 focus:ring-red-400' : ''}`}
                          placeholder="Enter username"
                          autoComplete="username"
                          autoFocus
                        />
                      </div>
                      {errors.username && <p className="form-error">{errors.username}</p>}
                    </div>

                    {/* Password */}
                    <div>
                      <label className="gov-label">Password</label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className={`gov-input pl-9 pr-10 ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
                          placeholder="Enter password"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {errors.password && <p className="form-error">{errors.password}</p>}
                    </div>

                    {/* Captcha */}
                    <div>
                      <label className="gov-label">Security Captcha</label>
                      <div className="flex gap-3">
                        {/* Captcha display */}
                        <div className="flex-shrink-0 h-10 min-w-[140px] bg-gray-800 rounded-md flex items-center justify-center px-4 relative overflow-hidden select-none">
                          {/* Noise lines */}
                          <div className="absolute inset-0 opacity-20">
                            {[...Array(4)].map((_, i) => (
                              <div key={i} className="absolute h-px bg-white w-full" style={{ top: `${20 + i * 20}%`, transform: `rotate(${[-3,2,-2,3][i]}deg)` }} />
                            ))}
                          </div>
                          <span className="text-white font-mono font-bold text-base tracking-[0.3em] relative z-10"
                            style={{ fontStyle: 'italic', letterSpacing: '0.25em' }}>
                            {captcha.display}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={refreshCaptcha}
                          className="btn-icon border border-gray-200 flex-shrink-0"
                          title="Refresh Captcha"
                        >
                          <RefreshCw size={15} />
                        </button>
                        <input
                          type="text"
                          value={captchaInput}
                          onChange={e => setCaptchaInput(e.target.value.toUpperCase())}
                          className={`gov-input flex-1 ${errors.captcha ? 'border-red-400' : ''}`}
                          placeholder="Enter captcha"
                          maxLength={6}
                        />
                      </div>
                      {errors.captcha && <p className="form-error">{errors.captcha}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-primary w-full justify-center py-2.5 mt-2"
                    >
                      {isLoading ? (
                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying...</>
                      ) : (
                        <><Shield size={16} />Proceed to OTP Verification</>
                      )}
                    </button>
                  </motion.form>
                )}

                {/* Step 2: OTP */}
                {step === 'otp' && (
                  <motion.form
                    key="otp"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.25 }}
                    onSubmit={handleOTPSubmit}
                    className="space-y-4"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-ap-gold text-white flex items-center justify-center text-xs font-bold">2</span>
                        OTP Verification
                      </h3>
                    </div>

                    <div className="bg-blue-50 rounded-lg px-4 py-3 flex items-start gap-3">
                      <Phone size={16} className="text-ap-blue mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-700">OTP sent to registered mobile</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {pendingUser?.mobile.replace(/(\d{2})\d{6}(\d{2})/, '$1XXXXXX$2')}
                        </p>
                      </div>
                    </div>

                    {/* Demo OTP display */}
                    {demoOTP && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-center">
                        <p className="text-xs text-yellow-700 font-medium">Demo OTP (shown for testing):</p>
                        <p className="text-2xl font-mono font-bold text-yellow-800 tracking-widest mt-1">{demoOTP}</p>
                      </div>
                    )}

                    <div>
                      <label className="gov-label">Enter 6-Digit OTP</label>
                      <div className="relative">
                        <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={otpInput}
                          onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className={`gov-input pl-9 text-center text-xl font-mono tracking-[0.4em] ${errors.otp ? 'border-red-400' : ''}`}
                          placeholder="------"
                          maxLength={6}
                          autoFocus
                        />
                      </div>
                      {errors.otp && <p className="form-error text-center">{errors.otp}</p>}
                    </div>

                    {/* Timer */}
                    <div className="text-center">
                      {otpTimer > 0 ? (
                        <p className="text-sm text-gray-500">
                          OTP expires in <span className="font-mono font-bold text-ap-blue">{formatTimer(otpTimer)}</span>
                        </p>
                      ) : (
                        <p className="text-sm text-red-500">OTP has expired. <button type="button" onClick={() => setStep('credentials')} className="underline font-medium">Go back</button></p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep('credentials')}
                        className="btn-secondary flex-1 justify-center"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading || otpTimer === 0}
                        className="btn-primary flex-1 justify-center"
                      >
                        {isLoading ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <><Shield size={15} />Verify & Login</>
                        )}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-6">
            Government of Andhra Pradesh | Revenue Department<br />
            Unauthorized access is prohibited. All activities are monitored.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
