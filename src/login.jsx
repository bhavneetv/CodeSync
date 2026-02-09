import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import supabase from './supabaseClient.js';
import { isLoggin } from "./function/login/isLoggin.js";
import { showToast, useToast } from './Components/toast-notification.jsx';
import { isAnyLogin } from './function/login/isLoggin.js';

import { Terminal, Mail, Lock, User, Eye, EyeOff, Loader2, Github, ArrowRight, Chrome, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import {
  login,
  signup,
  loginWithGoogle,
  loginWithGithubReturn,
  logout,
  getUser,
} from "./function/login/auth.js";
import { a } from 'framer-motion/client';

// Shared Auth Layout Component
const AuthLayout = ({ children }) => {
  useEffect(() => {
    checkLogin();

    // isLoggin()
  }, []);
  async function checkLogin() {
    const loggedIn = await isAnyLogin();
    if (loggedIn) window.location.href = '/create-room';
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white font-sans relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
        
        @keyframes morphButton {
          0%, 100% { border-radius: 0.5rem; }
          50% { border-radius: 50%; }
        }
        
        .loading-morph {
          animation: morphButton 0.6s ease-in-out;
        }
      `}</style>

      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

// Error Message Component
const ErrorMessage = ({ message }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4"
  >
    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
    <p className="text-xs text-red-300">{message}</p>
  </motion.div>
);

// Success Message Component
const SuccessMessage = ({ message }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg mb-4"
  >
    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
    <p className="text-xs text-green-300">{message}</p>
  </motion.div>
);

// Loading Button Component
const LoadingButton = ({ loading, children, onClick, disabled, className }) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={loading || disabled}
      className={`relative overflow-hidden ${className}`}
      whileHover={{ scale: loading ? 1 : 1.02 }}
      whileTap={{ scale: loading ? 1 : 0.98 }}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loader"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-5 h-5" />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center gap-2"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// Password Reset Component
const PasswordResetPage = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleReset = async () => {
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      // Simulate password reset
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccess(true);
      showToast("Success", "Password reset link sent to your email", "success");
    } catch (err) {
      setError('Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md"
      >
        <div className="backdrop-blur-xl bg-black/30 rounded-2xl border border-white/10 shadow-2xl p-6">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Back to login</span>
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Lock className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-1 bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              Reset Password
            </h1>
            <p className="text-gray-400 text-sm">
              Enter your email to receive a reset link
            </p>
          </div>

          {/* Error/Success Messages */}
          <AnimatePresence>
            {error && <ErrorMessage message={error} />}
            {success && <SuccessMessage message="Reset link sent! Check your email." />}
          </AnimatePresence>

          {/* Email Input */}
          <div className="mb-5">
            <label className="block text-xs font-medium mb-1.5 text-gray-300">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="you@example.com"
                className="w-full pl-10 pr-3 py-2.5 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm text-white placeholder-gray-500"
                onKeyPress={(e) => e.key === 'Enter' && handleReset()}
              />
            </div>
          </div>

          {/* Reset Button */}
          <LoadingButton
            loading={loading}
            onClick={handleReset}
            disabled={!email}
            className="w-full py-2.5 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg font-semibold text-sm transition-all shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Send Reset Link</span>
            <ArrowRight className="w-4 h-4" />
          </LoadingButton>
        </div>
      </motion.div>
    </div>
  );
};

// Login Page Component
const LoginPage = ({ onSwitchToSignup, onSwitchToReset }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isInAppWebView = typeof window !== 'undefined' && !!window.flutter_inappwebview;

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async () => {
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const value = await login(email, password);
      if (typeof value === 'string') {
        setError(value);
        showToast("Error", value, "error");
      } else {
        console.log("Login success:", value);
        showToast("Success", "Logged in successfully!", "success");
        window.location.href = '/create-room';
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setLoading(true);
    try {
      if (provider === 'GitHub') {
        await loginWithGithubReturn('/create-room');
        return;
      }
      await loginWithGoogle('/create-room');
    } catch (err) {
      setError(`Failed to login with ${provider}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md"
      >
        <div className="backdrop-blur-xl bg-black/30 rounded-2xl border border-white/10 shadow-2xl p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg"
              >
                <Terminal className="w-7 h-7 text-white" strokeWidth={2.5} />
              </motion.div>
            </div>
            <h1 className="text-2xl font-bold mb-1 bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-gray-400 text-sm">
              Code together instantly
            </p>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && <ErrorMessage message={error} />}
          </AnimatePresence>

          {/* Form Fields */}
          <div className="space-y-3 mb-5">
            {/* Email Input */}
            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-300">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm text-white placeholder-gray-500"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm text-white placeholder-gray-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onSwitchToReset}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
            <LoadingButton
              loading={loading}
              onClick={handleSubmit}
              disabled={!email || !password}
              className="w-full py-2.5 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-semibold text-sm transition-all shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Login</span>
              <ArrowRight className="w-4 h-4" />
            </LoadingButton>
          </div>

          {/* Divider */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-black/30 text-gray-400">OR CONTINUE WITH</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="flex gap-3 mb-5">
            <LoadingButton
              loading={loading}
              onClick={() => handleSocialLogin('Google')}
              className="flex-1 py-2.5 px-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all group"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </LoadingButton>
            <LoadingButton
              loading={loading}
              onClick={() => handleSocialLogin('GitHub')}
              className="flex-1 py-2.5 px-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all group"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" fill="url(#github-gradient)" />
                <defs>
                  <linearGradient id="github-gradient" x1="2" y1="2" x2="22" y2="22">
                    <stop offset="0%" stopColor="#6e5494" />
                    <stop offset="100%" stopColor="#24292e" />
                  </linearGradient>
                </defs>
              </svg>
            </LoadingButton>
          </div>
          {isInAppWebView && (
            <p className="text-[11px] text-amber-300 mb-5">
              Google login opens your browser and returns to the app automatically.
            </p>
          )}

          {/* Switch to Signup */}
          <div className="text-center">
            <p className="text-xs text-gray-400">
              Don't have an account?{' '}
              <button
                onClick={onSwitchToSignup}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Signup Page Component (Enhanced)
const SignupPage = ({ onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isInAppWebView = typeof window !== 'undefined' && !!window.flutter_inappwebview;

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async () => {
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const value = await signup(name, email, password);
      if (typeof value === 'string') {
        setError(value);
        showToast("Error", value, "error");
      } else {
        console.log("Signup success:", value);
        showToast("Success", "Account created successfully!", "success");
        window.location.href = '/create-room';
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setLoading(true);
    try {
      if (provider === 'GitHub') {
        await loginWithGithubReturn('/create-room');
        return;
      }
      await loginWithGoogle('/create-room');
    } catch (err) {
      setError(`Failed to signup with ${provider}`);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (!password) return { text: '', color: '' };
    if (password.length < 6) return { text: 'Weak', color: 'text-red-400' };
    if (password.length < 10) return { text: 'Medium', color: 'text-yellow-400' };
    return { text: 'Strong', color: 'text-green-400' };
  };

  const strength = getPasswordStrength();

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md"
      >
        <div className="backdrop-blur-xl bg-black/30 rounded-2xl border border-white/10 shadow-2xl p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg"
              >
                <Terminal className="w-7 h-7 text-white" strokeWidth={2.5} />
              </motion.div>
            </div>
            <h1 className="text-2xl font-bold mb-1 bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
              Create Your Account
            </h1>
            <p className="text-gray-400 text-sm">
              Code together instantly
            </p>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && <ErrorMessage message={error} />}
          </AnimatePresence>

          {/* Form Fields */}
          <div className="space-y-3 mb-5">
            {/* Name Input */}
            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-300">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyan-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError('');
                  }}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-3 py-2.5 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm text-white placeholder-gray-500"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-300">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm text-white placeholder-gray-500"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm text-white placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {password && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-xs mt-1 ${strength.color}`}
                >
                  Strength: {strength.text}
                </motion.p>
              )}
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-300">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm text-white placeholder-gray-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs mt-1 text-red-400"
                >
                  Passwords do not match
                </motion.p>
              )}
            </div>

            {/* Signup Button */}
            <LoadingButton
              loading={loading}
              onClick={handleSubmit}
              disabled={password !== confirmPassword || !name || !email || !password}
              className="w-full py-2.5 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-semibold text-sm transition-all shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </LoadingButton>
          </div>

          {/* Divider */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-black/30 text-gray-400">OR CONTINUE WITH</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="flex gap-3 mb-5">
            <LoadingButton
              loading={loading}
              onClick={() => handleSocialLogin('Google')}
              className="flex-1 py-2.5 px-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all group"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </LoadingButton>
            <LoadingButton
              loading={loading}
              onClick={() => handleSocialLogin('GitHub')}
              className="flex-1 py-2.5 px-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all group"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" fill="url(#github-gradient)" />
                <defs>
                  <linearGradient id="github-gradient" x1="2" y1="2" x2="22" y2="22">
                    <stop offset="0%" stopColor="#6e5494" />
                    <stop offset="100%" stopColor="#24292e" />
                  </linearGradient>
                </defs>
              </svg>
            </LoadingButton>
          </div>
          {isInAppWebView && (
            <p className="text-[11px] text-amber-300 mb-5">
              Google signup opens your browser and returns to the app automatically.
            </p>
          )}

          {/* Switch to Login */}
          <div className="text-center">
            <p className="text-xs text-gray-400">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Login
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Main App Component with Toggle
const AuthApp = () => {
  const [currentPage, setCurrentPage] = useState('login');

  return (
    <AuthLayout>
      <AnimatePresence mode="wait">
        {currentPage === 'login' ? (
          <LoginPage
            key="login"
            onSwitchToSignup={() => setCurrentPage('signup')}
            onSwitchToReset={() => setCurrentPage('reset')}
          />
        ) : currentPage === 'signup' ? (
          <SignupPage
            key="signup"
            onSwitchToLogin={() => setCurrentPage('login')}
          />
        ) : (
          <PasswordResetPage
            key="reset"
            onBack={() => setCurrentPage('login')}
          />
        )}
      </AnimatePresence>
    </AuthLayout>
  );
};

export default AuthApp;
