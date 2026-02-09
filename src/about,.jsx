import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Code, Users, Zap, Shield, Globe, Heart, Target, Lightbulb,
  CheckCircle, ArrowRight, Rocket, BookOpen, Briefcase, GraduationCap,
  Terminal, GitBranch, Smartphone, Clock, Award, TrendingUp,
  Lock, Unlock, Plus
} from 'lucide-react';
import Navbar from './Components/navbar';
import Footer from './Components/footer';

const About = () => {
  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // What makes us different
  const differentiators = [
    {
      icon: <Unlock className="w-6 h-6 text-white" />,
      title: 'No Login Required to Start',
      description: 'Jump right in and start coding. Create a room instantly without any signup friction.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <Clock className="w-6 h-6 text-white" />,
      title: 'Temporary Rooms (24 hours)',
      description: 'Quick collaboration sessions that auto-expire. Login to save your work permanently.',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: <Users className="w-6 h-6 text-white" />,
      title: '100% encrypted Collaboration',
      description: 'Your code is protected by end-to-end encryption. No one can access your work.',
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      icon: <Code className="w-6 h-6 text-white" />,
      title: 'VS Code–Like Experience',
      description: 'Familiar interface with syntax highlighting, IntelliSense, and all the features you love.',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: <GitBranch className="w-6 h-6 text-white" />,
      title: 'GitHub Integration (Optional)',
      description: 'Import repos, sync changes, and push back to GitHub seamlessly when you need it.',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      icon: <Smartphone className="w-6 h-6 text-white" />,
      title: 'Mobile-First Design',
      description: 'Code on any device. Responsive design that works beautifully on phones, tablets, and desktops.',
      gradient: 'from-pink-500 to-rose-500'
    }
  ];

  // Who it's for
  const userTypes = [
    {
      icon: <GraduationCap className="w-8 h-8" />,
      title: 'Students',
      description: 'Work on group projects, study together, and learn collaboratively without complex setup.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <Code className="w-8 h-8" />,
      title: 'Developers',
      description: 'Quick pair programming sessions, code reviews, and debugging with teammates in real-time.',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: <Briefcase className="w-8 h-8" />,
      title: 'Interviewers',
      description: 'Conduct technical interviews with live coding. No downloads required for candidates.',
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: '100% Encrypted ',
      description: 'Your code is protected by end-to-end encryption. No one can access your work.',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: 'Educators',
      description: 'Teach coding concepts live, demonstrate techniques, and guide students through exercises.',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'Open Source Contributors',
      description: 'Collaborate on projects, review pull requests, and discuss code changes together.',
      gradient: 'from-pink-500 to-rose-500'
    }
  ];

  // Core principles
  const principles = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Performance-First',
      description: 'Optimized for speed and responsiveness',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Privacy-Respecting',
      description: 'Your code stays yours, always',
      gradient: 'from-blue-500 to-indigo-500'
    },
    {
      icon: <Code className="w-6 h-6" />,
      title: 'Developer-Friendly',
      description: 'Built by developers, for developers',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Scalable by Design',
      description: 'Grows with your team and projects',
      gradient: 'from-purple-500 to-pink-500'
    }
  ];

  const handleCreateRoom = () => {
    window.location.href = '/create-room';
  };

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
      <section className="min-h-[60vh] flex items-center justify-center px-4 pt-32 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                About CodeSync
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 mb-8 leading-relaxed max-w-3xl mx-auto">
              CodeSync is a real-time collaborative code editor built to help developers code together — instantly.
            </p>
            
            {/* Subtle animated glow */}
            <motion.div
              animate={{
                opacity: [0.5, 0.8, 0.5],
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl -z-10"
            />
          </motion.div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
            className="backdrop-blur-xl bg-gradient-to-br from-slate-900/60 to-slate-800/60 border border-white/10 rounded-3xl p-8 sm:p-12 relative overflow-hidden"
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5" />
            
            <div className="relative">
              <div className="flex items-center space-x-3 mb-6">
                <Lightbulb className="w-8 h-8 text-blue-400" />
                <h2 className="text-3xl sm:text-4xl font-bold">Our Story</h2>
              </div>
              
              <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
                <p>
                  CodeSync started with a simple idea: <span className="text-white font-semibold">coding together should be easy</span>.
                </p>
                <p>
                  We were frustrated with the complexity of existing tools. Want to help a friend debug their code? First, create an account. Then install software. Configure settings. Share credentials. By the time you're ready to code, the moment has passed.
                </p>
                <p>
                  We believed there had to be a better way. A tool that respects your time. <span className="text-white font-semibold">No complex setup. No forced signups. Just open a room and start coding.</span>
                </p>
                <p className="text-cyan-400 font-medium">
                  That's why we built CodeSync — collaboration at the speed of thought.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What Problem We Solve */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent via-indigo-950/10 to-transparent">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              The <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Problem</span>
            </h2>
            <p className="text-gray-400 text-lg">Traditional collaboration tools get in the way</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Problems */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="space-y-4"
            >
              <h3 className="text-2xl font-bold text-red-400 mb-6">❌ Common Frustrations</h3>
              {[
                'Complicated setup for simple collaboration',
                'Mandatory logins before you can even try',
                'Clunky interfaces that slow you down',
                'Poor mobile experience for coding on the go'
              ].map((problem, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-3 backdrop-blur-xl bg-red-500/5 border border-red-500/20 rounded-xl p-4"
                >
                  <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                  </div>
                  <p className="text-gray-300">{problem}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Solutions */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <h3 className="text-2xl font-bold text-emerald-400 mb-6">✓ CodeSync Solution</h3>
              {[
                'Instant rooms — no setup required',
                'No login needed to start coding',
                'Clean, VS Code-like interface',
                'Works beautifully on any device'
              ].map((solution, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-3 backdrop-blur-xl bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4"
                >
                  <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300">{solution}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              What Makes CodeSync <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">Different</span>
            </h2>
            <p className="text-gray-400 text-lg">Features designed for frictionless collaboration</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {differentiators.map((item, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -8, scale: 1.02 }}
                className="backdrop-blur-xl bg-gradient-to-br from-slate-900/40 to-slate-800/40 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all group relative overflow-hidden"
              >
                {/* Gradient glow on hover */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                />

                <div className="relative">
                  <div className={`w-14 h-14 bg-gradient-to-br ${item.gradient} bg-opacity-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <div className={`text-transparent bg-clip-text bg-gradient-to-r ${item.gradient}`}>
                      {item.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Who Is It For */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent via-blue-950/10 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Built for <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">Everyone</span>
            </h2>
            <p className="text-gray-400 text-lg">From students to enterprises, CodeSync adapts to your needs</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {userTypes.map((user, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -8 }}
                className="backdrop-blur-xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all group text-center relative overflow-hidden"
              >
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r ${user.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                />

                <div className="relative">
                  <div className={`w-16 h-16 bg-gradient-to-br ${user.gradient} bg-opacity-10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <div className={`text-transparent bg-clip-text bg-gradient-to-r ${user.gradient}`}>
                      {user.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{user.title}</h3>
                  <p className="text-gray-400 text-sm">{user.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Our Vision */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="backdrop-blur-xl bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/20 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
          >
            {/* Animated gradient background */}
            <motion.div
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 bg-[length:200%_100%]"
            />

            <div className="relative">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <Target className="w-10 h-10 text-purple-400" />
                <h2 className="text-3xl sm:text-4xl font-bold">Our Vision</h2>
              </div>
              
              <div className="space-y-4 text-gray-300 text-lg leading-relaxed mb-8">
                <p className="text-xl sm:text-2xl font-semibold text-white">
                  Our vision is to make collaboration feel natural.
                </p>
                <p>
                  CodeSync aims to become the simplest way to share ideas, solve problems, and build software together — anywhere, anytime, with anyone.
                </p>
                <p className="text-purple-300">
                  We're building a world where distance doesn't matter, where the barrier to collaboration is zero, and where great ideas can come to life instantly.
                </p>
              </div>

              {/* Future goals */}
              <div className="grid sm:grid-cols-3 gap-4 mt-8">
                {[
                  { icon: <Rocket className="w-6 h-6" />, label: 'AI-Powered Assistance' },
                  { icon: <Globe className="w-6 h-6" />, label: 'Global Scale' },
                  { icon: <Award className="w-6 h-6" />, label: 'Industry Standard' }
                ].map((goal, index) => (
                  <div
                    key={index}
                    className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center space-y-2"
                  >
                    <div className="text-purple-400">{goal.icon}</div>
                    <span className="text-sm text-gray-300">{goal.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Technology & Principles */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent via-slate-900/50 to-transparent">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Technology & Principles
              </span>
            </h2>
            <p className="text-gray-400 text-lg">Built on solid foundations and core values</p>
          </motion.div>

          {/* Core Principles */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          >
            {principles.map((principle, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -5 }}
                className="backdrop-blur-xl bg-gradient-to-br from-slate-900/40 to-slate-800/40 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all text-center group relative overflow-hidden"
              >
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r ${principle.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                />

                <div className="relative">
                  <div className={`w-12 h-12 bg-gradient-to-br ${principle.gradient} bg-opacity-10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <div className={`text-transparent bg-clip-text bg-gradient-to-r ${principle.gradient}`}>
                      {principle.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{principle.title}</h3>
                  <p className="text-gray-400 text-sm">{principle.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Tech Stack Info */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="backdrop-blur-xl bg-gradient-to-br from-slate-900/60 to-slate-800/60 border border-white/10 rounded-2xl p-8"
          >
            <h3 className="text-2xl font-bold mb-6 text-center">Built with Modern Technology</h3>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <Terminal className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Modern Frontend Stack</h4>
                <p className="text-sm text-gray-400">React, TypeScript, and cutting-edge web technologies</p>
              </div>
              <div>
                <Zap className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Real-Time Systems</h4>
                <p className="text-sm text-gray-400">WebSocket connections for instant synchronization</p>
              </div>
              <div>
                <Code className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Modular Architecture</h4>
                <p className="text-sm text-gray-400">Scalable, maintainable, and extensible design</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="max-w-4xl mx-auto text-center backdrop-blur-xl bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-emerald-500/10 border border-blue-500/20 rounded-3xl p-12 relative overflow-hidden"
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
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Ready to code together?</h2>
            <p className="text-gray-400 text-lg mb-8">
              No signup required. Start collaborating in seconds.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateRoom}
              className="px-10 py-5 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 hover:from-blue-600 hover:via-cyan-600 hover:to-emerald-600 rounded-xl font-semibold text-xl flex items-center justify-center space-x-3 shadow-lg shadow-blue-500/50 transition-all mx-auto"
            >
              <Plus className="w-7 h-7" />
              <span>Create a Room</span>
            </motion.button>
            <p className="text-gray-500 text-sm mt-4">
              No signup required • Start coding instantly
            </p>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default About;