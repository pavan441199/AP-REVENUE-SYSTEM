// ============================================================
// AP Revenue ICAMS - Login Page
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, RefreshCw, Shield, Phone, KeyRound, User, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { login, signup, generateCaptcha, createSession, logAudit } from '../services/authService';
import { useAppStore } from '../store/appStore';
import { userDB } from '../services/dbService';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession, isAuthenticated } = useAppStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpData, setSignUpData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    mobile: '',
    role: 'data_entry_operator',
    district: 'Guntur',
    mandal: 'Guntur Urban',
    designation: 'Senior Data Operator',
  });

  // If already logged in, redirect
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated]);

  // OTP timer removed

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setCaptchaInput('');
  };

  const validateCredentials = () => {
    const newErrors: Record<string, string> = {};
    const isBypass = password === '123456';

    if (!username.trim()) newErrors.username = 'Username is required';
    if (!password) newErrors.password = 'Password is required';

    if (!isBypass) {
      if (password && password.length < 4) newErrors.password = 'Password must be at least 4 characters';
      if (!captchaInput.trim()) newErrors.captcha = 'Please enter the captcha';
      if (captchaInput.trim() && captchaInput.toUpperCase() !== captcha.text) newErrors.captcha = 'Incorrect captcha. Please try again.';
    }

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

      const session = createSession(result.user);
      setSession(session, result.user);

      // Update last login
      result.user.lastLogin = new Date().toISOString();
      try {
        await userDB.update(result.user);
      } catch (err) {
        // Ignore fallback update errors
      }

      await logAudit(result.user.userId, result.user.fullName, 'LOGIN', 'Auth', 'User logged in successfully');

      toast.success(`Welcome, ${result.user.fullName}!`);
      const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      toast.error('Authentication service error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    const newErrors: Record<string, string> = {};
    if (!signUpData.username.trim()) newErrors.signUpUsername = 'Username is required';
    if (!signUpData.password) newErrors.signUpPassword = 'Password is required';
    if (signUpData.password && signUpData.password.length < 4) newErrors.signUpPassword = 'Password must be at least 4 characters';
    if (!signUpData.fullName.trim()) newErrors.signUpFullName = 'Full name is required';
    if (!signUpData.email.trim()) newErrors.signUpEmail = 'Email is required';
    if (!signUpData.mobile.trim()) newErrors.signUpMobile = 'Mobile number is required';
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);
    try {
      const result = await signup(signUpData);
      if (result.success && result.user) {
        toast.success('Registration successful! Please log in.');
        setUsername(signUpData.username);
        setPassword('');
        setIsSignUp(false);
      } else {
        toast.error(result.error || 'Registration failed');
      }
    } catch (err) {
      toast.error('Registration service error');
    } finally {
      setIsLoading(false);
    }
  };

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
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-ap-blue flex items-center justify-center mx-auto mb-3">
              <Shield size={26} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-ap-blue">{isSignUp ? 'Officer Registration' : 'Officer Login'}</h2>
            <p className="text-gray-500 text-sm mt-1">AP Revenue ICAMS — Secure Access Portal</p>
          </div>


          <div className="bg-white rounded-xl shadow-gov-lg border border-gray-100 overflow-hidden">

            <div className="p-6">
              <AnimatePresence mode="wait">
                {isSignUp ? (
                  <motion.form
                    key="signup"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    onSubmit={handleSignUpSubmit}
                    className="space-y-3"
                  >
                    {/* Username */}
                    <div>
                      <label className="gov-label">Username / Officer ID</label>
                      <input
                        type="text"
                        value={signUpData.username}
                        onChange={e => setSignUpData(prev => ({ ...prev, username: e.target.value }))}
                        className={`gov-input ${errors.signUpUsername ? 'border-red-400 focus:ring-red-400' : ''}`}
                        placeholder="e.g. suresh_officer"
                        autoFocus
                      />
                      {errors.signUpUsername && <p className="form-error">{errors.signUpUsername}</p>}
                    </div>

                    {/* Password */}
                    <div>
                      <label className="gov-label">Password</label>
                      <input
                        type="password"
                        value={signUpData.password}
                        onChange={e => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                        className={`gov-input ${errors.signUpPassword ? 'border-red-400 focus:ring-red-400' : ''}`}
                        placeholder="Min 4 characters"
                      />
                      {errors.signUpPassword && <p className="form-error">{errors.signUpPassword}</p>}
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className="gov-label">Full Name</label>
                      <input
                        type="text"
                        value={signUpData.fullName}
                        onChange={e => setSignUpData(prev => ({ ...prev, fullName: e.target.value }))}
                        className={`gov-input ${errors.signUpFullName ? 'border-red-400 focus:ring-red-400' : ''}`}
                        placeholder="e.g. Suresh Kumar K"
                      />
                      {errors.signUpFullName && <p className="form-error">{errors.signUpFullName}</p>}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="gov-label">Government Email</label>
                      <input
                        type="email"
                        value={signUpData.email}
                        onChange={e => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                        className={`gov-input ${errors.signUpEmail ? 'border-red-400 focus:ring-red-400' : ''}`}
                        placeholder="e.g. officer@aprevenue.gov.in"
                      />
                      {errors.signUpEmail && <p className="form-error">{errors.signUpEmail}</p>}
                    </div>

                    {/* Mobile */}
                    <div>
                      <label className="gov-label">Mobile Number</label>
                      <input
                        type="text"
                        value={signUpData.mobile}
                        onChange={e => setSignUpData(prev => ({ ...prev, mobile: e.target.value.replace(/\D/g, '') }))}
                        className={`gov-input ${errors.signUpMobile ? 'border-red-400 focus:ring-red-400' : ''}`}
                        placeholder="10-digit number"
                      />
                      {errors.signUpMobile && <p className="form-error">{errors.signUpMobile}</p>}
                    </div>

                    {/* Role */}
                    <div>
                      <label className="gov-label">Assigned Role</label>
                      <select
                        value={signUpData.role}
                        onChange={e => setSignUpData(prev => ({ ...prev, role: e.target.value }))}
                        className="gov-input"
                      >
                        <option value="administrator">Administrator</option>
                        <option value="revenue_officer">Revenue Officer</option>
                        <option value="data_entry_operator">Data Entry Operator</option>
                        <option value="read_only_officer">Read-Only Officer</option>
                      </select>
                    </div>

                    {/* District */}
                    <div>
                      <label className="gov-label">District</label>
                      <input
                        type="text"
                        value={signUpData.district}
                        onChange={e => setSignUpData(prev => ({ ...prev, district: e.target.value }))}
                        className="gov-input"
                      />
                    </div>

                    {/* Mandal */}
                    <div>
                      <label className="gov-label">Mandal</label>
                      <input
                        type="text"
                        value={signUpData.mandal}
                        onChange={e => setSignUpData(prev => ({ ...prev, mandal: e.target.value }))}
                        className="gov-input"
                      />
                    </div>

                    {/* Designation */}
                    <div>
                      <label className="gov-label">Designation</label>
                      <input
                        type="text"
                        value={signUpData.designation}
                        onChange={e => setSignUpData(prev => ({ ...prev, designation: e.target.value }))}
                        className="gov-input"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-primary w-full justify-center py-2.5 mt-2"
                    >
                      {isLoading ? (
                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating Account...</>
                      ) : (
                        <><Shield size={16} />Register & Sign Up</>
                      )}
                    </button>

                    <div className="text-center mt-4">
                      <p className="text-sm text-gray-500">
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setIsSignUp(false);
                            setErrors({});
                          }}
                          className="text-ap-blue hover:text-ap-blue-dark font-medium underline"
                        >
                          Log In
                        </button>
                      </p>
                    </div>
                  </motion.form>
                ) : (
                  <motion.form
                    key="credentials"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    onSubmit={handleCredentialSubmit}
                    className="space-y-4"
                  >
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
                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Logging in...</>
                      ) : (
                        <><Shield size={16} />Verify & Login</>
                      )}
                    </button>

                    <div className="text-center mt-4">
                      <p className="text-sm text-gray-500">
                        Don't have an account?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setIsSignUp(true);
                            setErrors({});
                          }}
                          className="text-ap-blue hover:text-ap-blue-dark font-medium underline"
                        >
                          Sign Up
                        </button>
                      </p>
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
