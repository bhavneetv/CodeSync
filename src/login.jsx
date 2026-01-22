import React, { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import supabase from './supabaseClinet';
import { isLoggin } from "./function/login/isLoggin.js";

import { Terminal, Mail, Lock, User, Eye, EyeOff, Loader2, Github, ArrowRight, Chrome } from 'lucide-react';
import {
  login,
  signup,
  loginWithGoogle,
  logout,
  getUser,
} from "./function/login/auth.js";

// Shared Auth Layout Component
const AuthLayout = ({ children }) => {

  // check the login status
  useEffect(() => {
    isLoggin()
    
  }, []);






  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white font-sans relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
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

// Login Page Component
const LoginPage = ({ onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    setLoading(true);

    //  login function call
    login(email, password).then(value => {
      if (typeof value === 'string') {
        console.error("Login error:", value);
      } else {
        console.log("Login success:", value);
      }
      // console.log(value);
    });
    setTimeout(() => setLoading(false), 2000);
  };

  const handleSocialLogin = (provider) => {
    console.log(`${provider} login`);
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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <Terminal className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-1 bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-gray-400 text-sm">
              Code together instantly
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-3 mb-5">
            {/* Email Input */}
            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-300">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <button
                type="button"
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-2.5 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-semibold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
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
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => handleSocialLogin('Google')}
              className="flex-1 py-2.5 px-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 flex items-center justify-center transition-all"
            >
              <Chrome className="w-5 h-5 text-white" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => handleSocialLogin('GitHub')}
              className="flex-1 py-2.5 px-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 flex items-center justify-center transition-all"
            >
              <Github className="w-5 h-5 text-white" />
            </motion.button>
          </div>

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

// Signup Page Component
const SignupPage = ({ onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    setLoading(true);
    // console.log({ name, email, password });

    //! signup function call
    signup(name, email, password).then(value => {
      if (typeof value === 'string') {
        console.error("Signup error:", value);
      } else {
        console.log("Signup success:", value);
      }
      // console.log(value);
    });
    setTimeout(() => setLoading(false), 2000);
  };

  const handleSocialLogin = (provider) => {
    console.log(`${provider} login`);
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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <Terminal className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-1 bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
              Create Your Account
            </h1>
            <p className="text-gray-400 text-sm">
              Code together instantly
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-3 mb-5">
            {/* Name Input */}
            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-300">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                <p className={`text-xs mt-1 ${strength.color}`}>
                  Strength: {strength.text}
                </p>
              )}
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-300">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm text-white placeholder-gray-500"
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
                <p className="text-xs mt-1 text-red-400">
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Signup Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={loading || password !== confirmPassword || !name || !email || !password}
              className="w-full py-2.5 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-semibold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
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
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => handleSocialLogin('Google')}
              className="flex-1 py-2.5 px-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 flex items-center justify-center transition-all"
            >
              <Chrome className="w-5 h-5 text-white" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => handleSocialLogin('GitHub')}
              className="flex-1 py-2.5 px-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 flex items-center justify-center transition-all"
            >
              <Github className="w-5 h-5 text-white" />
            </motion.button>
          </div>

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
          <LoginPage key="login" onSwitchToSignup={() => setCurrentPage('signup')} />
        ) : (
          <SignupPage key="signup" onSwitchToLogin={() => setCurrentPage('login')} />
        )}
      </AnimatePresence>
    </AuthLayout>
  );
};

export default AuthApp;