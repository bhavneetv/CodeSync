import React, { useState, useEffect } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { 
  Terminal, Users, UserPlus, LogIn, Home, Info, Plus, 
  Zap, Shield, Clock, Code, GitBranch, Smartphone,
  ArrowRight, Check, Mail, Github, Twitter, Linkedin, Send,
  Menu, X
} from 'lucide-react';

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleFormSubmit = (e) => {
    e.preventDefault();
    console.log('Contact Form Submitted:', formData);
    // Reset form
    setFormData({ name: '', email: '', message: '' });
    alert('Message sent! Check console for data.');
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Features data
  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Real-Time Collaboration',
      description: 'Code together with your team in real-time. See changes instantly as they happen.'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'No Login Required',
      description: 'Start coding immediately. Create temporary rooms without any signup process.'
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'Temporary Rooms (24h)',
      description: 'Quick collaboration sessions that expire after 24 hours. Login to save permanently.'
    },
    {
      icon: <Code className="w-8 h-8" />,
      title: 'Multi-Language Support',
      description: 'Write code in Python, JavaScript, C++, Java, and many more languages.'
    },
    {
      icon: <GitBranch className="w-8 h-8" />,
      title: 'GitHub Integration',
      description: 'Import repositories and sync your code with GitHub (login required).'
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: 'Cross-Device Coding',
      description: 'Access your code from any device. Responsive design for mobile and desktop.'
    }
  ];

  // How it works steps
  const steps = [
    {
      number: '01',
      icon: <Plus className="w-10 h-10" />,
      title: 'Create or Join a Room',
      description: 'Start a new coding session or join an existing one with a room code.'
    },
    {
      number: '02',
      icon: <Code className="w-10 h-10" />,
      title: 'Start Coding Instantly',
      description: 'Write, edit, and collaborate in real-time with your team members.'
    },
    {
      number: '03',
      icon: <Shield className="w-10 h-10" />,
      title: 'Login to Save Permanently',
      description: 'Create an account to save your work and access advanced features.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-950 to-gray-950 text-white font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>

      {/* Navbar */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-gray-950 to-transparent"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
                <Terminal className="w-5 h-5 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                CodeSync
              </span>
            </div>

            {/* Center Links - Desktop Only */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors text-sm">
                <Home className="w-4 h-4" />
                <span>Home</span>
              </a>
              <a href="#features" className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors text-sm">
                <Zap className="w-4 h-4" />
                <span>Features</span>
              </a>
              <a href="#how-it-works" className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors text-sm">
                <Info className="w-4 h-4" />
                <span>About</span>
              </a>
              <a href="#contact" className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors text-sm">
                <Mail className="w-4 h-4" />
                <span>Contact</span>
              </a>
            </div>

            {/* Right Buttons - Desktop Only */}
            <div className="hidden md:flex items-center space-x-3">
              <button className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all text-sm flex items-center space-x-2">
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </button>
              <button className="px-5 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-blue-500/50 text-sm flex items-center space-x-2">
                <UserPlus className="w-4 h-4" />
                <span>Signup</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden pb-4 border-t border-white/10"
            >
              <div className="flex flex-col space-y-3 pt-4">
                <a href="#home" className="text-sm text-gray-400 hover:text-white transition-colors py-2 flex items-center space-x-2">
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </a>
                <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors py-2 flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>Features</span>
                </a>
                <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors py-2 flex items-center space-x-2">
                  <Info className="w-4 h-4" />
                  <span>About</span>
                </a>
                <a href="#contact" className="text-sm text-gray-400 hover:text-white transition-colors py-2 flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Contact</span>
                </a>
                <button className="text-sm text-gray-400 hover:text-white py-2 text-left flex items-center space-x-2">
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </button>
                <button className="text-sm bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 rounded-lg flex items-center space-x-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Signup</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section id="home" className="min-h-screen flex items-center justify-center px-4 pt-32 pb-12">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-300 bg-clip-text text-transparent">
                Code Together.
              </span>
              <br />
              <span className="text-white">Instantly.</span>
            </h1>
            <p className="text-xl text-gray-400 mb-8 leading-relaxed">
              A real-time collaborative code editor with no login required to start. 
              Create rooms, share code, and build together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl font-semibold text-lg flex items-center justify-center space-x-2 shadow-lg hover:shadow-blue-500/50 transition-all"
              >
                <Plus className="w-6 h-6" />
                <span>Create Your First Room</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold text-lg flex items-center justify-center space-x-2 transition-all"
              >
                <Terminal className="w-6 h-6" />
                <span>Try Solo Mode</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Right Side - Mock Editor */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden lg:block"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <div className="ml-4 text-xs text-gray-500">main.py</div>
              </div>
              <div className="space-y-2 font-mono text-sm">
                <div className="text-purple-400">def <span className="text-blue-400">collaborate</span>():</div>
                <div className="pl-4 text-gray-400"># Real-time coding</div>
                <div className="pl-4 text-green-400">print(<span className="text-yellow-300">"Code together!"</span>)</div>
                <div className="pl-4 text-cyan-400">return <span className="text-orange-400">True</span></div>
              </div>
              <div className="mt-4 flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs text-gray-500">2 users coding</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-gray-400 text-lg">Everything you need for seamless collaboration</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="backdrop-blur-xl bg-black/30 border border-white/10 rounded-2xl p-6 hover:bg-black/40 transition-all group"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-blue-400">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-gray-400 text-lg">Get started in three simple steps</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="relative text-center"
              >
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl font-bold text-blue-500/10">
                  {step.number}
                </div>
                <div className="backdrop-blur-xl bg-black/30 border border-white/10 rounded-2xl p-8 relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white">
                    {step.icon}
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-gray-400">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
                    <ArrowRight className="w-6 h-6 text-blue-500/30" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center backdrop-blur-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-3xl p-12"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Start coding in seconds.
          </h2>
          <p className="text-gray-400 text-lg mb-8">No signup required.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl font-semibold text-xl flex items-center justify-center space-x-3 shadow-lg hover:shadow-blue-500/50 transition-all mx-auto"
          >
            <Plus className="w-7 h-7" />
            <span>Create Temporary Room</span>
          </motion.button>
        </motion.div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 bg-black/20">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
              Get In Touch
            </h2>
            <p className="text-gray-400 text-lg">Have questions? We'd love to hear from you.</p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onSubmit={handleFormSubmit}
            className="backdrop-blur-xl bg-black/30 border border-white/10 rounded-2xl p-8"
          >
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-400">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-400">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-400">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="Tell us what's on your mind..."
                ></textarea>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl font-semibold text-lg flex items-center justify-center space-x-2 shadow-lg hover:shadow-blue-500/50 transition-all"
              >
                <Send className="w-5 h-5" />
                <span>Send Message</span>
              </motion.button>
            </div>
          </motion.form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/10 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-6">
            {/* Left - Copyright */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-2 mb-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Terminal className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <span className="font-bold text-lg bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  CodeSync
                </span>
              </div>
              <p className="text-gray-500 text-sm">© 2026 CodeSync. All rights reserved.</p>
            </div>

            {/* Center - Links */}
            <div className="flex justify-center items-center space-x-6 text-sm">
              <button className="text-gray-400 hover:text-white transition-colors">Privacy</button>
              <span className="text-gray-600">•</span>
              <button className="text-gray-400 hover:text-white transition-colors">Terms</button>
              <span className="text-gray-600">•</span>
              <a href="#" className="text-gray-400 hover:text-white transition-colors flex items-center space-x-1">
                <Github className="w-4 h-4" />
                <span>GitHub</span>
              </a>
            </div>

            {/* Right - Social Icons */}
            <div className="flex justify-center md:justify-end items-center space-x-4">
              <motion.a
                whileHover={{ scale: 1.1, y: -2 }}
                href="#"
                className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center justify-center transition-all"
              >
                <Github className="w-5 h-5 text-gray-400" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1, y: -2 }}
                href="#"
                className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center justify-center transition-all"
              >
                <Twitter className="w-5 h-5 text-gray-400" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1, y: -2 }}
                href="#"
                className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center justify-center transition-all"
              >
                <Linkedin className="w-5 h-5 text-gray-400" />
              </motion.a>
            </div>
          </div>

          {/* Bottom text */}
          <div className="text-center pt-6 border-t border-white/5">
            <p className="text-xs text-gray-600">
              Built with React, Tailwind CSS, and Framer Motion
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;