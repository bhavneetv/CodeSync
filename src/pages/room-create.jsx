import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Users, UserPlus, LogIn, LogOut, Home, Info, Plus, ArrowRight, ArrowLeft, Loader2, Github } from 'lucide-react';

const RoomCreate = () => {
  const [view, setView] = useState('main'); // main, create, join
  const [loading, setLoading] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  const handleCreateRoom = async () => {
    setLoading(true);
    console.log('Creating room:', { roomName, roomPassword });
    setTimeout(() => {
      setLoading(false);
      console.log('Room created successfully');
    }, 2000);
  };

  const handleJoinNext = () => {
    if (!showPasswordInput) {
      console.log('Room code entered:', roomCode);
      setShowPasswordInput(true);
    } else {
      setLoading(true);
      console.log('Joining room:', { roomCode, roomPassword });
      setTimeout(() => {
        setLoading(false);
        console.log('Joined room successfully');
      }, 2000);
    }
  };

  const handleSoloCode = () => {
    console.log('Solo Mode');
    console.log('Navigating to editor...');
  };

  const handleBack = () => {
    setView('main');
    setRoomName('');
    setRoomPassword('');
    setRoomCode('');
    setShowPasswordInput(false);
    setLoading(false);
  };

  const cardVariants = {
    main: {
      scale: 0.77,
      width: '100%',
      maxWidth: '500px',
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
    },
    small: {
      scale: 0.77,
      width: '100%',
      maxWidth: '420px',
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-950 to-gray-950 text-white font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>

      {/* Animated Round Navbar */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-11/12 max-w-4xl"
      >
        <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-full shadow-2xl px-4 sm:px-6 py-3">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
                <Terminal className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                CodeSync
              </span>
            </div>

            {/* Center Links */}
            <div className="hidden md:flex items-center space-x-4 absolute left-1/2 transform -translate-x-1/2">
              <button className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors text-sm">
                <Home className="w-4 h-4" />
                <span>Home</span>
              </button>
              <button className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors text-sm">
                <Info className="w-4 h-4" />
                <span>About</span>
              </button>
            </div>

            {/* Right Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <button className="px-3 py-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all text-sm">
                <LogIn className="w-3.5 h-3.5 inline mr-1" />
                Login
              </button>
              <button className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-full font-medium transition-all hover:shadow-lg hover:shadow-blue-500/50 text-sm">
                <UserPlus className="w-3.5 h-3.5 inline mr-1" />
                Signup
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full text-xs font-medium">
                Menu
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-24 pb-12">
        <motion.div
          variants={cardVariants}
          animate={view === 'main' ? 'main' : 'small'}
          className="w-full"
        >
          <div className="backdrop-blur-xl bg-black/30 rounded-3xl border border-white/10 shadow-2xl p-6 sm:p-8 md:p-10">
            <AnimatePresence mode="wait">
              {view === 'main' && (
                <motion.div
                  key="main"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="text-center"
                >
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-300 bg-clip-text text-transparent leading-tight">
                    Code Together Instantly
                  </h1>
                  <p className="text-gray-400 text-base sm:text-lg mb-8 sm:mb-12">
                    No login required to start
                  </p>

                  <div className="space-y-3 sm:space-y-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setView('create')}
                      className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl font-semibold text-base sm:text-lg flex items-center justify-center space-x-2 sm:space-x-3 transition-all shadow-lg hover:shadow-blue-500/50"
                    >
                      <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span>Create Temporary Room</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setView('join')}
                      className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-white/5 hover:bg-white/10 rounded-xl font-semibold text-base sm:text-lg flex items-center justify-center space-x-2 sm:space-x-3 transition-all border border-white/10"
                    >
                      <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span>Join Room</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSoloCode}
                      className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-white/5 hover:bg-white/10 rounded-xl font-semibold text-base sm:text-lg flex items-center justify-center space-x-2 sm:space-x-3 transition-all border border-white/10"
                    >
                      <Terminal className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span>Solo Code</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {view === 'create' && (
                <motion.div
                  key="create"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 text-center">Create Temporary Room</h2>
                  <p className="text-gray-500 text-xs sm:text-sm text-center mb-6 sm:mb-8">
                    This room will expire in 24 hours. Login to save permanently.
                  </p>

                  <div className="space-y-3 sm:space-y-4 mb-5 sm:mb-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-gray-400">
                        Room Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder="Enter room name"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-gray-400">
                        Room Password <span className="text-gray-600">(optional)</span>
                      </label>
                      <input
                        type="password"
                        value={roomPassword}
                        onChange={(e) => setRoomPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-2 sm:space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleBack}
                      disabled={loading}
                      className="flex-1 py-2.5 sm:py-3 px-3 sm:px-6 bg-white/5 hover:bg-white/10 rounded-lg font-medium flex items-center justify-center space-x-1.5 sm:space-x-2 transition-all border border-white/10 disabled:opacity-50 text-sm sm:text-base"
                    >
                      <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Back</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCreateRoom}
                      disabled={!roomName || loading}
                      className="flex-1 py-2.5 sm:py-3 px-3 sm:px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-medium flex items-center justify-center space-x-1.5 sm:space-x-2 transition-all shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Create Room</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {view === 'join' && (
                <motion.div
                  key="join"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center">Join a Room</h2>

                  <div className="space-y-3 sm:space-y-4 mb-5 sm:mb-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-gray-400">
                        Room Code
                      </label>
                      <input
                        type="text"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value)}
                        placeholder="Enter room code"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                      />
                    </div>

                    <AnimatePresence>
                      {showPasswordInput && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-gray-400">
                            Room Password
                          </label>
                          <input
                            type="password"
                            value={roomPassword}
                            onChange={(e) => setRoomPassword(e.target.value)}
                            placeholder="Enter password"
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex space-x-2 sm:space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleBack}
                      disabled={loading}
                      className="flex-1 py-2.5 sm:py-3 px-3 sm:px-6 bg-white/5 hover:bg-white/10 rounded-lg font-medium flex items-center justify-center space-x-1.5 sm:space-x-2 transition-all border border-white/10 disabled:opacity-50 text-sm sm:text-base"
                    >
                      <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Back</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleJoinNext}
                      disabled={!roomCode || loading}
                      className="flex-1 py-2.5 sm:py-3 px-3 sm:px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-medium flex items-center justify-center space-x-1.5 sm:space-x-2 transition-all shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      ) : (
                        <>
                          <span>{showPasswordInput ? 'Join Room' : 'Next'}</span>
                          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Bottom Info Text */}
       <motion.p
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.5 }}
  className="absolute bottom-6 sm:bottom-8 text-center text-gray-500 text-xs sm:text-sm max-w-2xl px-4"
>
  Temporary rooms expire after 24 hours. Login to unlock GitHub sync, invites, and permanent storage.
</motion.p>

      </div>

      {/* Footer */}
      <footer className="py-4 sm:py-6 border-t border-white/10 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-xs sm:text-sm mb-1.5 sm:mb-2">© 2026 CodeSync</p>
          <div className="flex justify-center items-center space-x-3 sm:space-x-4 text-xs text-gray-600">
            <button className="hover:text-gray-400 transition-colors">Privacy</button>
            <span>•</span>
            <button className="hover:text-gray-400 transition-colors">Terms</button>
            <span>•</span>
            <button className="flex items-center space-x-1 hover:text-gray-400 transition-colors">
              <Github className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RoomCreate;