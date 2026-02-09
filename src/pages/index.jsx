import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Terminal, Users, UserPlus, Code, GitBranch, Smartphone,
  Plus, Zap, Clock, Shield, ArrowRight, Send, Check,
  Github, Twitter, Linkedin, Mail, Home, Info, LogIn, Menu, X,
  FileCode, Folder, Star, Download, Lock, Unlock, Monitor, Phone,
  AlertCircle, CheckCircle, Activity, TrendingUp,
  Globe, Award, Target, Briefcase
} from 'lucide-react';
import Navbar from '../Components/navbar';
import Footer from '../Components/footer';
import { showToast } from '../Components/toast-notification.jsx';
import { runAutoRoomMaintenance } from '../function/rooms/room-functions.js';
import supabase from '../supabaseClient.js';
import { createRoom } from '../function/rooms/room-main.js';
// createRoom

const formatCompactNumber = (value = 0) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Math.max(0, Number(value) || 0));

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    rooms: 0,
    files: 0,
    users: 0,
  });

  // Contact form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const appRedirect = params.get("app_redirect");
    if (appRedirect && /^codesync:\/\//i.test(appRedirect)) {
      const forwardParams = new URLSearchParams(window.location.search);
      forwardParams.delete("app_redirect");
      const forwardQuery = forwardParams.toString();
      const hash = window.location.hash || "";
      const separator = appRedirect.includes("?") ? "&" : "?";
      const target = `${appRedirect}${forwardQuery ? `${separator}${forwardQuery}` : ""}${hash}`;
      const oauthReturn = params.get("oauth_return");
      const webFallback =
        oauthReturn && oauthReturn.startsWith("/") ? oauthReturn : "/create-room";

      window.location.replace(target);
      // Retry once if the browser blocked the first custom-scheme navigation.
      setTimeout(() => {
        if (document.visibilityState === "visible") {
          window.location.href = target;
        }
      }, 500);
      // Keep users unblocked in browser if app reopen failed.
      setTimeout(() => {
        if (document.visibilityState === "visible") {
          window.location.href = webFallback;
        }
      }, 2200);
      return;
    }

    const oauthReturn = params.get("oauth_return");
    if (oauthReturn && oauthReturn.startsWith("/")) {
      window.location.href = oauthReturn;
      return;
    }

    if(sessionStorage.getItem("github_oauth_state")) {
      const sess = sessionStorage.getItem("github_oauth_state");
      const sessObj = JSON.parse(sess);
      window.location.href = `/upload?roomId=${sessObj.roomId}&token=${sessObj.token}&view=${sessObj.view}`;
      
    }

    const runMaintenanceOnLanding = async () => {
      try {
        const lastRunRaw = localStorage.getItem('room_cleanup_last_run_at');
        const lastRun = lastRunRaw ? Number(lastRunRaw) : 0;
        const now = Date.now();
        const intervalMs = 30 * 60 * 1000; // 30 min throttle

        if (now - lastRun < intervalMs) {
          return;
        }

        await runAutoRoomMaintenance();
        localStorage.setItem('room_cleanup_last_run_at', String(now));
      } catch (err) {
        console.error('Auto room maintenance failed:', err);
      }
    };

    runMaintenanceOnLanding();
   
   

   
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      try {
        setIsDataLoading(true);

        const [roomsCountRes, filesCountRes, usersCountRes] = await Promise.all([
          supabase.from('rooms').select('id', { count: 'exact', head: true }),
          supabase.from('files').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
        ]);

        if (!isMounted) return;

        const totalRooms = roomsCountRes.error ? 0 : (roomsCountRes.count || 0);
        const totalFiles = filesCountRes.error ? 0 : (filesCountRes.count || 0);
        const totalUsers = usersCountRes.error ? 0 : (usersCountRes.count || 0);

        setDashboardStats({
          rooms: totalRooms,
          files: totalFiles,
          users: totalUsers,
        });
      } catch (err) {
        console.error('Failed to load landing dashboard data:', err);
      } finally {
        if (isMounted) {
          setIsDataLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Scroll handler for navbar
  

  // Enhanced Realistic Typing Animation Component with Multiple Cursors
  const RealisticTypingCode = () => {
    const [phase, setPhase] = useState(0);
    const [charIndex, setCharIndex] = useState(0);

    const codeLines = [
      {
        text: 'const app = () => {',
        segments: [
          { text: 'const ', color: 'text-purple-400' },
          { text: 'app', color: 'text-blue-400' },
          { text: ' = ', color: 'text-white' },
          { text: '()', color: 'text-yellow-300' },
          { text: ' => {', color: 'text-white' }
        ]
      },
      {
        text: '  const users = ["Alice", "Bob", "Charlie"];',
        segments: [
          { text: '  const ', color: 'text-purple-400' },
          { text: 'users', color: 'text-blue-400' },
          { text: ' = [', color: 'text-white' },
          { text: '"Alice"', color: 'text-green-400' },
          { text: ', ', color: 'text-white' },
          { text: '"Bob"', color: 'text-green-400' },
          { text: ', ', color: 'text-white' },
          { text: '"Charlie"', color: 'text-green-400' },
          { text: '];', color: 'text-white' }
        ]
      },
      {
        text: '  return users.map(u => `${u} is coding!`);',
        segments: [
          { text: '  return ', color: 'text-purple-400' },
          { text: 'users', color: 'text-blue-400' },
          { text: '.map', color: 'text-yellow-300' },
          { text: '(', color: 'text-white' },
          { text: 'u', color: 'text-orange-400' },
          { text: ' => ', color: 'text-purple-400' },
          { text: '`${', color: 'text-green-400' },
          { text: 'u', color: 'text-orange-400' },
          { text: '} is coding!`', color: 'text-green-400' },
          { text: ');', color: 'text-white' }
        ]
      },
      {
        text: '}',
        segments: [
          { text: '}', color: 'text-white' }
        ]
      }
    ];

    useEffect(() => {
      const typeSpeed = 60;
      const pauseBetweenPhases = 2000;

      const timer = setTimeout(() => {
        const totalChars = codeLines.reduce((sum, line) => sum + line.text.length, 0);

        if (charIndex < totalChars) {
          setCharIndex(charIndex + 1);
        } else {
          setTimeout(() => {
            setCharIndex(0);
            setPhase((phase + 1) % 3);
          }, pauseBetweenPhases);
        }
      }, typeSpeed);

      return () => clearTimeout(timer);
    }, [charIndex, phase]);

    const getCursorPosition = (totalChars) => {
      // Distribute cursors across the code
      const cursor1Pos = Math.floor(totalChars * 0.3);
      const cursor2Pos = Math.floor(totalChars * 0.6);
      const cursor3Pos = totalChars;

      return { cursor1Pos, cursor2Pos, cursor3Pos };
    };

    const renderCodeWithCursors = () => {
      let charCount = 0;
      const { cursor1Pos, cursor2Pos, cursor3Pos } = getCursorPosition(charIndex);

      return codeLines.map((line, lineIndex) => {
        const lineStartChar = charCount;
        const lineEndChar = charCount + line.text.length;
        charCount = lineEndChar;

        const visibleChars = Math.max(0, Math.min(line.text.length, charIndex - lineStartChar));

        let renderedSegments = [];
        let segmentCharCount = lineStartChar;

        line.segments.forEach((segment, segIndex) => {
          const segmentStart = segmentCharCount;
          const segmentEnd = segmentCharCount + segment.text.length;
          segmentCharCount = segmentEnd;

          if (visibleChars > segmentStart - lineStartChar) {
            const visibleSegmentChars = Math.min(
              segment.text.length,
              visibleChars - (segmentStart - lineStartChar)
            );

            const visibleText = segment.text.substring(0, visibleSegmentChars);

            renderedSegments.push(
              <span key={segIndex} className={segment.color}>
                {visibleText}
              </span>
            );

            // Add cursors at appropriate positions
            if (cursor1Pos >= segmentStart && cursor1Pos < segmentEnd && cursor1Pos === charIndex) {
              renderedSegments.push(
                <motion.div
                  key={`cursor1-${segIndex}`}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="inline-flex items-center ml-0.5"
                >
                  <div className="w-0.5 h-5 bg-blue-500" />
                  <span className="text-xs bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded ml-1 whitespace-nowrap">
                    Alice
                  </span>
                </motion.div>
              );
            }

            if (cursor2Pos >= segmentStart && cursor2Pos < segmentEnd && cursor2Pos === charIndex) {
              renderedSegments.push(
                <motion.div
                  key={`cursor2-${segIndex}`}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                  className="inline-flex items-center ml-0.5"
                >
                  <div className="w-0.5 h-5 bg-purple-500" />
                  <span className="text-xs bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded ml-1 whitespace-nowrap">
                    Bob
                  </span>
                </motion.div>
              );
            }

            if (cursor3Pos >= segmentStart && cursor3Pos < segmentEnd && cursor3Pos === charIndex) {
              renderedSegments.push(
                <motion.div
                  key={`cursor3-${segIndex}`}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                  className="inline-flex items-center ml-0.5"
                >
                  <div className="w-0.5 h-5 bg-emerald-500" />
                  <span className="text-xs bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded ml-1 whitespace-nowrap">
                    Charlie
                  </span>
                </motion.div>
              );
            }
          }
        });

        return (
          <div key={lineIndex} className="flex items-start space-x-3 min-h-[28px]">
            <span className="text-gray-600 select-none text-sm w-4 text-right">{lineIndex + 1}</span>
            <div className="flex items-center flex-wrap">
              {renderedSegments}
            </div>
          </div>
        );
      });
    };

    return (
      <div className="space-y-2 font-mono text-sm">
        {renderCodeWithCursors()}
      </div>
    );
  };

  // Stats Counter Component
  const StatsCounter = ({ end, duration = 2000, label, suffix = '' }) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
      if (!isInView) return;

      let startTime;
      let animationFrame;

      const animate = (currentTime) => {
        if (!startTime) startTime = currentTime;
        const progress = (currentTime - startTime) / duration;

        if (progress < 1) {
          setCount(Math.floor(end * progress));
          animationFrame = requestAnimationFrame(animate);
        } else {
          setCount(end);
        }
      };

      animationFrame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationFrame);
    }, [isInView, end, duration]);

    return (
      <div ref={ref} className="text-center">
        <div className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
          {count.toLocaleString()}{suffix}
        </div>
        <div className="text-gray-400 text-xs sm:text-sm uppercase tracking-wider">{label}</div>
      </div>
    );
  };

  // Form handlers
  const handleFormSubmit = (e) => {
    e.preventDefault();
    console.log('Contact Form Submitted:', formData);
    showToast('Message sent! (Check console)', 'success', 1800);
    setFormData({ name: '', email: '', message: '' });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };



  // Enhanced Features data with icons
  const features = [
    {
      icon: <Users className="w-6 h-6 sm:w-7 lg:w-8 h-7 lg:h-8 text-white" />,
      title: 'Real-Time Collaboration',
      description: 'Code together with your team in real-time. See changes instantly as they happen.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <Clock className="w-6 h-6 sm:w-7 lg:w-8 h-7 lg:h-8 text-white" />,
      title: 'Temporary Rooms (24h)',
      description: 'Quick collaboration sessions that expire after 24 hours. Login to save permanently.',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: <Code className="w-6 h-6 sm:w-7 lg:w-8 h-7 lg:h-8 text-white" />,
      title: 'VS Code-Like Editor',
      description: 'Familiar interface with syntax highlighting and multi-language support.',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: <Shield className="w-6 h-6 sm:w-7 lg:w-8 h-7 lg:h-8 text-white" />,
      title: 'File & Folder Management',
      description: 'Organize your code with a complete file system and folder structure.',
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      icon: <GitBranch className="w-6 h-6 sm:w-7 lg:w-8 h-7 lg:h-8 text-white" />,
      title: 'GitHub Integration',
      description: 'Import repositories and sync your code with GitHub seamlessly.',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      icon: <Smartphone className="w-6 h-6 sm:w-7 lg:w-8 h-7 lg:h-8 text-white" />,
      title: 'Mobile-Friendly',
      description: 'Access your code from any device with our responsive design.',
      gradient: 'from-pink-500 to-rose-500'
    }
  ];

  // Information cards
  const infoCards = [
    {
      icon: <Award className="w-8 h-8 text-white" />,
      title: 'Industry Standard',
      description: 'Built with modern web technologies and best practices',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      icon: <Globe className="w-8 h-8 text-white" />,
      title: 'Global Access',
      description: 'Work from anywhere with cloud-based collaboration',
      gradient: 'from-blue-500 to-indigo-500'
    },
    {
      icon: <Activity className="w-8 h-8 text-white" />,
      title: 'Live Updates',
      description: 'See changes in real-time with WebSocket technology',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: <Target className="w-8 h-8 text-white" />,
      title: 'Focused Workflow',
      description: 'Distraction-free coding environment for maximum productivity',
      gradient: 'from-purple-500 to-pink-500'
    }
  ];
  function handlePage() {
    window.location.href = '/create-room';
  }

 
  // Quick actions
  const quickActions = [
    {
      icon: <Plus className="w-8 h-8 sm:w-10 h-10 text-white" />,
      title: 'Create Room',
      description: 'Start a new coding session',
      action: handlePage,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <UserPlus className="w-8 h-8 sm:w-10 h-10 text-white" />,
      title: 'Join Room',
      description: 'Enter an existing room',
      action: () => handlePage(),
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: <Terminal className="w-8 h-8 sm:w-10 h-10 text-white" />,
      title: 'Solo Code',
      description: 'Code by yourself',
      action: () => createRoom("Solo Room" , null , true).then(roomId => { window.location.href = `/editor?roomId=${roomId.roomId}&token=${roomId.token}` }),
      gradient: 'from-emerald-500 to-teal-500'
    }
  ];

  // Download platforms
  const platforms = [
    {
      name: 'Windows',
      icon: <Monitor className="w-8 h-8 text-white" />,
      gradient: 'from-blue-500 to-cyan-500',
      available: true
    },
    {
      name: 'macOS',
      icon: <Monitor className="w-8 h-8 text-white" />,
      gradient: 'from-gray-600 to-gray-800',
      available: false
    },
    {
      name: 'iOS',
      icon: <Smartphone className="w-8 h-8 text-white" />,
      gradient: 'from-blue-400 to-blue-600',
      available: true
    },
    {
      name: 'Android',
      icon: <Smartphone className="w-8 h-8 text-white" />,
      gradient: 'from-green-500 to-emerald-600',
      available: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { 
          font-family: 'Inter', sans-serif;
        }
        
        html {
          scroll-behavior: smooth;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #06b6d4);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #0891b2);
        }
        
        /* Infinite scroll animation */
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-scroll {
          animation: scroll 40s linear infinite;
        }
        
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.03, 0.05, 0.03]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 -left-48 w-96 h-96 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
            opacity: [0.03, 0.05, 0.03]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 -right-48 w-96 h-96 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-3xl"
        />
      </div>

      {/* Navbar */}
      <Navbar />


      {/* Hero Section */}
      <section id="home" className="min-h-screen flex items-center justify-center px-4 pt-28 sm:pt-32 pb-12 sm:pb-20">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          {/* Left Side */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Great code comes
              </span>
              <br />
              <span className="text-white">from teamwork.</span>
            </motion.h1>
            <motion.p
              className="text-base sm:text-lg lg:text-xl text-gray-400 mb-6 sm:mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Create or join coding rooms instantly. No login required for quick collaboration.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-3 sm:gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePage()}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl font-semibold text-base sm:text-lg flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/50 transition-all"
              >
                <Plus className="w-5 h-5 sm:w-6 h-6" />
                <span>Create Room</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => createRoom("Solo Room" , null , true).then(roomId => { window.location.href = `/editor?roomId=${roomId.roomId}&token=${roomId.token}` })}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold text-base sm:text-lg flex items-center justify-center space-x-2 transition-all"
              >
                <Terminal className="w-5 h-5 sm:w-6 h-6" />
                <span>Solo Code</span>
              </motion.button>
            </motion.div>

            {/* Stats Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-8 sm:mt-12 grid grid-cols-3 gap-4 sm:gap-6"
            >
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-400">
                  {isDataLoading ? '...' : formatCompactNumber(dashboardStats.rooms)}
                </div>
                <div className="text-xs sm:text-sm text-gray-500">Rooms</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-cyan-400">
                  {isDataLoading ? '...' : formatCompactNumber(dashboardStats.files)}
                </div>
                <div className="text-xs sm:text-sm text-gray-500">Files</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-emerald-400">
                  {isDataLoading ? '...' : formatCompactNumber(dashboardStats.users)}
                </div>
                <div className="text-xs sm:text-sm text-gray-500">Users</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Animated Editor Mockup with Realistic Typing */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:block"
          >
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="backdrop-blur-xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-white/20 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl" />

              {/* Editor Header */}
              <div className="relative flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex items-center space-x-2">
                  <FileCode className="w-4 h-4 text-blue-400" />
                  <div className="text-xs text-gray-400 font-mono">app.jsx</div>
                </div>
              </div>

              {/* Code Content with Realistic Typing */}
              <div className="relative">
                <RealisticTypingCode />
              </div>

              {/* Collaboration Indicators */}
              <div className="relative mt-6 flex items-center justify-between pt-6 border-t border-white/10">
                <div className="flex -space-x-2">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      boxShadow: [
                        '0 0 0 0 rgba(59, 130, 246, 0)',
                        '0 0 0 4px rgba(59, 130, 246, 0.2)',
                        '0 0 0 0 rgba(59, 130, 246, 0)'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-slate-900 flex items-center justify-center text-xs font-bold"
                  >
                    A
                  </motion.div>
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      boxShadow: [
                        '0 0 0 0 rgba(168, 85, 247, 0)',
                        '0 0 0 4px rgba(168, 85, 247, 0.2)',
                        '0 0 0 0 rgba(168, 85, 247, 0)'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-slate-900 flex items-center justify-center text-xs font-bold"
                  >
                    B
                  </motion.div>
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      boxShadow: [
                        '0 0 0 0 rgba(16, 185, 129, 0)',
                        '0 0 0 4px rgba(16, 185, 129, 0.2)',
                        '0 0 0 0 rgba(16, 185, 129, 0)'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 border-2 border-slate-900 flex items-center justify-center text-xs font-bold"
                  >
                    C
                  </motion.div>
                </div>
                <div className="flex items-center space-x-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-emerald-500"
                  />
                  <span className="text-xs text-gray-400">3 users coding</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="py-12 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            {quickActions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={action.action}
                className="backdrop-blur-xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-white/10 rounded-2xl p-6 sm:p-8 cursor-pointer hover:border-white/20 transition-all group text-center relative overflow-hidden"
              >
                {/* Gradient glow on hover */}
                <div className={`absolute inset-0 bg-gradient-to-r ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                <div className={`relative w-14 h-14 sm:w-16 h-16 bg-gradient-to-br ${action.gradient} bg-opacity-20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  <div className={`text-transparent bg-clip-text bg-gradient-to-r ${action.gradient}`}>
                    {action.icon}
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">{action.title}</h3>
                <p className="text-gray-400 text-xs sm:text-sm">{action.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Language Support Section */}
      <section className="py-12 sm:py-16 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 text-white">
              Support for <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">All Languages</span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-base">Code in your favorite programming language</p>
          </motion.div>

          {/* Moving Language Icons Container */}
          <div className="relative">
            {/* Gradient overlays for fade effect */}
            <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />

            {/* Scrolling Container */}
            <div className="flex overflow-hidden py-8">
              <div className="flex gap-8 sm:gap-12 animate-scroll">
                {/* First set of languages */}
                {[
                  { name: 'HTML', icon: '< />', color: 'from-orange-500 to-red-500' },
                  { name: 'CSS', icon: '{ }', color: 'from-blue-500 to-cyan-500' },
                  { name: 'JavaScript', icon: 'JS', color: 'from-yellow-400 to-yellow-600' },
                  { name: 'TypeScript', icon: 'TS', color: 'from-blue-400 to-blue-600' },
                  { name: 'Python', icon: 'PY', color: 'from-green-400 to-emerald-500' },
                  { name: 'Java', icon: 'JAVA', color: 'from-red-500 to-orange-600' },
                  { name: 'C', icon: 'C', color: 'from-blue-600 to-indigo-600' },
                  { name: 'C++', icon: 'C++', color: 'from-blue-500 to-purple-600' },
                  { name: 'Ruby', icon: 'RB', color: 'from-red-600 to-pink-600' },
                  // { name: 'PHP', icon: 'PHP', color: 'from-indigo-500 to-purple-600' },
                  { name: 'Go', icon: 'GO', color: 'from-cyan-400 to-blue-500' },
                  { name: 'Rust', icon: 'RS', color: 'from-orange-600 to-red-700' },
                  // { name: 'Swift', icon: 'SW', color: 'from-orange-500 to-red-500' },
                  // { name: 'Kotlin', icon: 'KT', color: 'from-purple-500 to-pink-500' },
                  { name: 'Prolog', icon: 'PL', color: 'from-teal-500 to-cyan-600' },
                  { name: 'R', icon: 'R', color: 'from-blue-500 to-cyan-500' },
                ].map((lang, index) => (
                  <div
                    key={`lang1-${index}`}
                    className="flex-shrink-0 flex flex-col items-center justify-center"
                  >
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br ${lang.color} rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300 cursor-pointer`}>
                      <span className="text-white font-bold text-sm sm:text-base">{lang.icon}</span>
                    </div>
                    <span className="text-gray-400 text-xs sm:text-sm mt-2 font-medium">{lang.name}</span>
                  </div>
                ))}

                {/* Duplicate set for seamless loop */}
                {[
                  { name: 'HTML', icon: '< />', color: 'from-orange-500 to-red-500' },
                  { name: 'CSS', icon: '{ }', color: 'from-blue-500 to-cyan-500' },
                  { name: 'JavaScript', icon: 'JS', color: 'from-yellow-400 to-yellow-600' },
                  { name: 'TypeScript', icon: 'TS', color: 'from-blue-400 to-blue-600' },
                  { name: 'Python', icon: 'PY', color: 'from-green-400 to-emerald-500' },
                  { name: 'Java', icon: 'JAVA', color: 'from-red-500 to-orange-600' },
                  { name: 'C', icon: 'C', color: 'from-blue-600 to-indigo-600' },
                  { name: 'C++', icon: 'C++', color: 'from-blue-500 to-purple-600' },
                  { name: 'Ruby', icon: 'RB', color: 'from-red-600 to-pink-600' },
                  // { name: 'PHP', icon: 'PHP', color: 'from-indigo-500 to-purple-600' },
                  { name: 'Go', icon: 'GO', color: 'from-cyan-400 to-blue-500' },
                  { name: 'Rust', icon: 'RS', color: 'from-orange-600 to-red-700' },
                  // { name: 'Swift', icon: 'SW', color: 'from-orange-500 to-red-500' },
                  // { name: 'Kotlin', icon: 'KT', color: 'from-purple-500 to-pink-500' },
                  { name: 'Prolog', icon: 'PL', color: 'from-teal-500 to-cyan-600' },
                  { name: 'R', icon: 'R', color: 'from-blue-500 to-cyan-500' },
                ].map((lang, index) => (
                  <div
                    key={`lang2-${index}`}
                    className="flex-shrink-0 flex flex-col items-center justify-center"
                  >
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br ${lang.color} rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300 cursor-pointer`}>
                      <span className="text-white font-bold text-sm sm:text-base">{lang.icon}</span>
                    </div>
                    <span className="text-gray-400 text-xs sm:text-sm mt-2 font-medium">{lang.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Language count badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-8"
          >
            <div className="inline-flex items-center space-x-2 backdrop-blur-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-full px-6 py-3">
              <Check className="w-5 h-5 text-emerald-400" />
              <span className="text-sm sm:text-base text-gray-300">
                <span className="font-bold text-white">12+</span> Programming Languages Supported
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Information Cards Section */}
      <section className="py-12 sm:py-20 px-4 bg-gradient-to-b from-transparent via-indigo-950/10 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Why Choose CodeSync?
            </h2>
            <p className="text-gray-400 text-sm sm:text-base lg:text-lg">Built for modern developers who value collaboration</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {infoCards.map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="backdrop-blur-xl bg-gradient-to-br from-slate-900/40 to-slate-800/40 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all group text-center relative overflow-hidden"
              >
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                />

                <div className="relative">
                  <div className={`w-16 h-16 bg-gradient-to-br ${card.gradient} bg-opacity-10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <div className={`text-transparent bg-clip-text bg-gradient-to-r ${card.gradient}`}>
                      {card.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
                  <p className="text-gray-400 text-sm">{card.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Stats Section */}
      <section className="py-12 sm:py-20 px-4 bg-gradient-to-b from-transparent via-blue-950/10 to-transparent">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Trusted by Developers
            </h2>
            <p className="text-gray-400 text-sm sm:text-base">Join thousands of developers coding together</p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="backdrop-blur-xl bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-500/20 rounded-2xl p-6 sm:p-8 hover:border-blue-500/40 transition-all"
            >
              <StatsCounter end={dashboardStats.rooms} label="Rooms Created" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -5 }}
              className="backdrop-blur-xl bg-gradient-to-br from-cyan-900/30 to-emerald-900/30 border border-cyan-500/20 rounded-2xl p-6 sm:p-8 hover:border-cyan-500/40 transition-all"
            >
              <StatsCounter end={dashboardStats.files} label="Files Created" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -5 }}
              className="backdrop-blur-xl bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-500/20 rounded-2xl p-6 sm:p-8 hover:border-emerald-500/40 transition-all sm:col-span-3 lg:col-span-1"
            >
              <StatsCounter end={dashboardStats.users} label="Active Users" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-gray-400 text-sm sm:text-base lg:text-lg">Everything you need for seamless collaboration</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="backdrop-blur-xl bg-gradient-to-br from-slate-900/40 to-slate-800/40 border border-white/10 rounded-2xl p-5 sm:p-6 hover:border-white/20 transition-all group relative overflow-hidden"
              >
                {/* Animated gradient background */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                />

                <div className="relative">
                  <div className={`w-12 h-12 sm:w-14 h-14 bg-gradient-to-br ${feature.gradient} bg-opacity-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <div className={`text-transparent bg-clip-text bg-gradient-to-r ${feature.gradient}`}>
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-xs sm:text-sm">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="py-12 sm:py-20 px-4 bg-gradient-to-b from-transparent via-purple-950/10 to-transparent">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
              Download CodeSync
            </h2>
            <p className="text-gray-400 text-sm sm:text-base lg:text-lg mb-2">
              Available on all major platforms
            </p>
            <p className="text-gray-500 text-xs sm:text-sm">
              Supports Windows, macOS, iOS, and Android
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
            {platforms.map((platform, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="backdrop-blur-xl bg-gradient-to-br from-slate-900/60 to-slate-800/60 border border-white/10 rounded-2xl p-6 cursor-pointer hover:border-white/20 transition-all group text-center relative overflow-hidden"
              >
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r ${platform.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                />

                <div className="relative">
                  <div className={`w-16 h-16 bg-gradient-to-br ${platform.gradient} bg-opacity-10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <div className={`text-transparent bg-clip-text bg-gradient-to-r ${platform.gradient}`}>
                      {platform.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-3">{platform.name}</h3>
                  {platform.available ? (
                    <div className="flex items-center justify-center space-x-2 text-emerald-400 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span>Available</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2 text-gray-500 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>Coming Soon</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
            
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = "/download"}
              className="px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:from-purple-600 hover:via-pink-600 hover:to-rose-600 rounded-xl font-semibold text-base sm:text-lg flex items-center justify-center space-x-3 shadow-lg shadow-purple-500/50 transition-all mx-auto"
            >
              <Download className="w-5 h-5 sm:w-6 h-6" />
              <span >Download Now</span>
            </motion.button>
            <p className="text-gray-500 text-xs sm:text-sm mt-4">
              Free to download.  No credit card required
            </p>
          </motion.div>
        </div>
      </section>

      {/* Collaboration Visual Section */}
      <section id="about" className="py-12 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Collaborate in <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">real-time</span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-base lg:text-lg">with your team, anywhere in the world.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="backdrop-blur-xl bg-gradient-to-br from-slate-900/60 to-slate-800/60 border border-white/10 rounded-2xl p-5 sm:p-8 relative overflow-hidden"
          >
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-rose-500/5" />

            {/* Simulated Code Editor with Multiple Cursors */}
            <div className="relative space-y-2 sm:space-y-3 font-mono text-xs sm:text-sm">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <span className="text-gray-600 select-none">1</span>
                <span className="text-purple-400">function</span>
                <span className="text-blue-400">collaborate</span>
                <span className="text-white">(</span>
                <span className="text-orange-400">team</span>
                <span className="text-white">) {'{'}</span>
                <motion.div
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="inline-flex items-center ml-1"
                >
                  <div className="w-0.5 h-4 sm:h-5 bg-blue-500" />
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 sm:px-2 py-0.5 rounded ml-1">Alice</span>
                </motion.div>
              </div>

              <div className="flex items-center space-x-2 sm:space-x-3 pl-4 sm:pl-8">
                <span className="text-gray-600 select-none">2</span>
                <span className="text-green-400">return</span>
                <span className="text-white">team.map(</span>
                <span className="text-orange-400">member</span>
                <span className="text-white">=&gt;</span>
                <motion.div
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                  className="inline-flex items-center ml-1"
                >
                  <div className="w-0.5 h-4 sm:h-5 bg-purple-500" />
                  <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 sm:px-2 py-0.5 rounded ml-1">Bob</span>
                </motion.div>
              </div>

              <div className="flex items-center space-x-2 sm:space-x-3 pl-8 sm:pl-16">
                <span className="text-gray-600 select-none">3</span>
                <span className="text-yellow-300">`${'{'}member{'}'} is coding!`</span>
                <motion.div
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
                  className="inline-flex items-center ml-1"
                >
                  <div className="w-0.5 h-4 sm:h-5 bg-emerald-500" />
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-1.5 sm:px-2 py-0.5 rounded ml-1">Charlie</span>
                </motion.div>
              </div>

              <div className="flex items-center space-x-2 sm:space-x-3 pl-4 sm:pl-8">
                <span className="text-gray-600 select-none">4</span>
                <span className="text-white">);</span>
              </div>

              <div className="flex items-center space-x-2 sm:space-x-3">
                <span className="text-gray-600 select-none">5</span>
                <span className="text-white">{'}'}</span>
              </div>
            </div>

            {/* Active Users Indicator */}
            <div className="relative mt-6 sm:mt-8 flex items-center justify-between pt-4 sm:pt-6 border-t border-white/10">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="flex -space-x-2 sm:-space-x-3">
                  <div className="w-8 h-8 sm:w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-slate-900 flex items-center justify-center text-xs sm:text-sm font-bold">A</div>
                  <div className="w-8 h-8 sm:w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-slate-900 flex items-center justify-center text-xs sm:text-sm font-bold">B</div>
                  <div className="w-8 h-8 sm:w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 border-2 border-slate-900 flex items-center justify-center text-xs sm:text-sm font-bold">C</div>
                </div>
                <span className="text-gray-400 text-xs sm:text-sm">3 developers editing</span>
              </div>
              <div className="flex items-center space-x-2">
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-emerald-500"
                />
                <span className="text-gray-400 text-xs sm:text-sm">Live</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-12 sm:py-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center backdrop-blur-xl bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-emerald-500/10 border border-blue-500/20 rounded-3xl p-8 sm:p-12 relative overflow-hidden"
        >
          {/* Animated gradient background */}
          <motion.div
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-cyan-500/5 to-emerald-500/5 bg-[length:200%_100%]"
          />

          <div className="relative">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">Start coding in seconds.</h2>
            <p className="text-gray-400 text-sm sm:text-base lg:text-lg mb-6 sm:mb-8">No signup required. Jump right in.</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePage()}
              className="px-8 sm:px-10 py-3.5 sm:py-5 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 hover:from-blue-600 hover:via-cyan-600 hover:to-emerald-600 rounded-xl font-semibold text-base sm:text-lg lg:text-xl flex items-center justify-center space-x-2 sm:space-x-3 shadow-lg shadow-blue-500/50 transition-all mx-auto"
            >
              <Plus className="w-5 h-5 sm:w-6 lg:w-7 h-6 lg:h-7" />
              <span>Create Your First Room</span>
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-12 sm:py-20 px-4 bg-gradient-to-b from-transparent via-slate-900/50 to-transparent">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Get In Touch
            </h2>
            <p className="text-gray-400 text-sm sm:text-base lg:text-lg">Have questions? We'd love to hear from you.</p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onSubmit={handleFormSubmit}
            className="backdrop-blur-xl bg-gradient-to-br from-slate-900/60 to-slate-800/60 border border-white/10 rounded-2xl p-6 sm:p-8"
          >
            <div className="space-y-5 sm:space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-400">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white text-sm sm:text-base"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-400">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all text-white text-sm sm:text-base"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-400">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={5}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none text-white text-sm sm:text-base"
                  placeholder="Tell us what's on your mind..."
                ></textarea>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full px-5 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 hover:from-blue-600 hover:via-cyan-600 hover:to-emerald-600 rounded-xl font-semibold text-base sm:text-lg flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/50 transition-all"
              >
                <Send className="w-4 h-4 sm:w-5 h-5" />
                <span>Send Message</span>
              </motion.button>
            </div>
          </motion.form>
        </div>
      </section>

      {/* Footer */}
      <Footer />

            
    </div>
  );

};

export default LandingPage;

