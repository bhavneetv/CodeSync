import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isAnyLogin, isLoggin } from '../function/login/isLoggin';
import { findRoomname } from '../function/rooms/upload-page';
import { createEncryptedFile } from '../function/files/create-file';
import { getGithubToken, fetchAllGithubRepos, importRepoContents } from '../function/files/github-handle';
import { loginWithGithubReturn } from '../function/login/auth';
import { FileText, Github, Plus, ArrowLeft, ArrowRight, Trash2, Loader2, Check, ChevronLeft } from 'lucide-react';
import { deleteRoom } from '../function/rooms/room-functions';
import { showToast } from '../Components/toast-notification';
const FileUploadpage = () => {
  const [view, setView] = useState('main');
  const [selectedFileType, setSelectedFileType] = useState('');
  const [customExtension, setCustomExtension] = useState('');
  const [fileName, setFileName] = useState('');
  const [selectedRepo, setSelectedRepo] = useState('');
  const [loading, setLoading] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [roomName1, setroomName] = useState(null);
  const [roomCode1, setRoomCode] = useState('');
  const [githubRepos, setGithubRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [githubError, setGithubError] = useState('');

  useEffect(() => {
    isLoggina();
    const view = new URLSearchParams(window.location.search).get('view');
    if (view) {
      setView(view);
    } else {
      const oauthRaw =
        sessionStorage.getItem('github_oauth_state') ||
        localStorage.getItem('github_oauth_state');
      if (oauthRaw) {
        try {
          const oauthState = JSON.parse(oauthRaw);
          if (oauthState?.view) {
            setView(oauthState.view);
          }
        } catch (e) {
          // ignore
        }
        sessionStorage.removeItem('github_oauth_state');
        localStorage.removeItem('github_oauth_state');
      }
    }
    fetch();
  }, []);

  const Spinner = () => (
    <div className="flex items-center justify-center py-10">
      <motion.div
        className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );

  useEffect(() => {
    if (view !== 'github-repos') return;

    const loadRepos = async () => {
      setLoadingRepos(true);
      setGithubError('');
      try {
        const token = await getGithubToken();
        if (!token) {
          setGithubConnected(false);
          setGithubRepos([]);
          setGithubError('GitHub not connected');
          return;
        }

        setGithubConnected(true);
        const repos = await fetchAllGithubRepos();
        setGithubRepos(
          repos.map(repo => ({
            id: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            stars: repo.stargazers_count,
            language: repo.language,
            owner: repo.owner,
            private: repo.private,
            updatedAt: repo.updated_at
          }))
        );
      } catch (e) {
        setGithubRepos([]);
        if (e?.message === 'GITHUB_UNAUTHORIZED') {
          setGithubConnected(false);
          setGithubError('GitHub session expired. Please reconnect.');
        } else if (e?.message === 'GitHub not connected') {
          setGithubConnected(false);
          setGithubError('GitHub not connected. Please connect.');
        } else {
          setGithubError('Failed to load repositories');
        }
      } finally {
        setLoadingRepos(false);
      }
    };

    loadRepos();
  }, [view]);

  useEffect(() => {
    if (view !== 'github') return;

    const checkGithub = async () => {
      const token = await getGithubToken();
      if (token) {
        setGithubConnected(true);
        setView('github-repos');
      } else {
        setGithubConnected(false);
      }
    };

    checkGithub();
  }, [view]);

  const roomLink = new URLSearchParams(window.location.search).get('roomId');
  const token = new URLSearchParams(window.location.search).get('token');

  const fetch = async () => {
    const roomInfo = await findRoomname(roomLink);

    if (roomInfo.is_room_new == false) {
      window.location.href = `/editor?roomId=${roomLink}&token=${token}`;
      console.log(roomInfo.is_room_new);
    }
    else if (!roomInfo || roomInfo.type !== 'permanent') {
      window.location.href = '/create-room';
      return false;
    }

    setroomName(roomInfo.room_name);
    setRoomCode(roomInfo.room_code);
  }

  const isLoggina = async () => {
    const loggedIn = await isAnyLogin();
    if (!loggedIn) {
      window.location.href = '/login';
      return
    }
  }

  const roomName = roomName1 || 'Loading...';
  const roomCode = roomCode1 || 'Loading...';

  const fileTypes = [
    { name: 'Python', ext: 'py', icon: '🐍', gradient: 'from-blue-400 to-cyan-400' },
    { name: 'C', ext: 'c', icon: '©️', gradient: 'from-purple-400 to-pink-400' },
    { name: 'C++', ext: 'cpp', icon: '➕', gradient: 'from-indigo-400 to-purple-400' },
    { name: 'Java', ext: 'java', icon: '☕', gradient: 'from-orange-400 to-red-400' },
    { name: 'JavaScript', ext: 'js', icon: '⚡', gradient: 'from-yellow-400 to-orange-400' },
    { name: 'Custom', ext: 'custom', icon: '✨', gradient: 'from-pink-400 to-rose-400' }
  ];

  const handleCreateFile = async () => {
    const extension = selectedFileType === 'custom' ? customExtension : selectedFileType;

    setLoading(true);
    createEncryptedFile(roomLink, fileName, extension, true).then((res) => {
      setLoading(false);

      if (res.success == true) {
        window.location.href = `/editor?roomId=${roomLink}&token=${token}`;
      }
    });

    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };

  const handleConnectGithub = async () => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('roomId');
    const accessToken = params.get('token');
    const returnPath = `/upload?roomId=${encodeURIComponent(roomId || '')}&token=${encodeURIComponent(accessToken || '')}&view=github-repos`;

    const payload = {
      roomId,
      token: accessToken,
      view: "github-repos",
      ts: Date.now()
    };

    sessionStorage.setItem('github_oauth_state', JSON.stringify(payload));
    localStorage.setItem('github_oauth_state', JSON.stringify(payload));

    await loginWithGithubReturn(returnPath);
  };

  const handleImportRepo = async () => {
    setLoading(true);

    try {
      const tokenValue = await getGithubToken();
      if (!tokenValue) {
        setGithubError('GitHub not connected');
        return;
      }

      const selectedRepoData = githubRepos.find((repo) => repo.name === selectedRepo);
      const owner = selectedRepoData?.owner;
      if (!owner) {
        setGithubError('Could not resolve repository owner');
        return;
      }

      const roomLink = new URLSearchParams(window.location.search).get('roomId');

      await importRepoContents({
        owner,
        repo: selectedRepo,
        roomLink,
        token: tokenValue
      });
    } finally {
      window.location.href = `/editor?roomId=${roomLink}&token=${token}`;
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (view === 'github-repos') {
      setGithubConnected(false);
      setSelectedRepo('');
    }
    if (view === 'github-confirm') {
      setView('github-repos');
      return;
    }
    setView('main');
    setSelectedFileType('');
    setCustomExtension('');
    setFileName('');
    setSelectedRepo('');
    setGithubConnected(false);
  };

  const handleDeleteRoom = () => {
    if (confirm("Are you sure you want to delete this room? This action cannot be undone.")) {
      deleteRoom(roomLink).then((res) => {
        if (res.success == true) {
          showToast("Room deleted successfully", "success");
          setTimeout(() => {
            window.location.href = '/create-room';
          }, 1500);
        }
        // window.location.href = '/create-room';
      });
    }
  };


  const getCardWidth = () => {
    if (view === 'main') return '90vw';
    if (view === 'create') return '95vw';
    if (view === 'github' || view === 'github-repos' || view === 'github-confirm') return '95vw';
    return '90vw';
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1]
      }
    })
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-950 text-white font-sans flex items-center justify-center p-4 overflow-hidden relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }

        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
        }

        @media (min-width: 640px) {
          .card-container {
            max-width: 500px;
          }
          .card-container.create-view {
            max-width: 600px;
          }
          .card-container.github-view {
            max-width: 650px;
          }
        }
      `}</style>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
          {/* Back Button */}
          <motion.button
            whileHover={{ scale: 1.05, x: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.history.back()}
            className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all group"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors hidden sm:inline">Back</span>
          </motion.button>

          {/* Room Info */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="text-right">
              <div className="text-sm sm:text-base font-bold text-white">{roomName}</div>
              <div className="text-xs sm:text-sm text-gray-400 font-medium">{roomCode}</div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDeleteRoom}
              className="p-2.5 hover:bg-red-500/20 rounded-xl transition-all group border border-transparent hover:border-red-500/30"
            >
              <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-7xl mt-16 sm:mt-20 relative z-10 px-3 sm:px-4">
        <motion.div
          className={`mx-auto ${view === 'main' ? 'card-container' :
            view === 'create' ? 'card-container create-view' :
              'card-container github-view'
            }`}
          layout
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <motion.div
            className="backdrop-blur-2xl bg-black/40 rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl p-4 sm:p-6 md:p-8 lg:p-10 relative overflow-hidden"
            whileHover={{ boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.25)" }}
            transition={{ duration: 0.3 }}
          >

            <div className="relative z-10">
              <AnimatePresence mode="wait">
                {/* MAIN VIEW */}
                {view === 'main' && (
                  <motion.div
                    key="main"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="text-center"
                  >
                    <motion.h1
                      className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-3 sm:mb-4 bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent leading-tight animate-gradient"
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                    >
                      Start Coding
                    </motion.h1>
                    <motion.p
                      className="text-gray-300 text-sm sm:text-base md:text-lg mb-6 sm:mb-8 md:mb-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.6 }}
                    >
                      Create a new file or import from GitHub
                    </motion.p>

                    <div className="space-y-3 sm:space-y-4">
                      <motion.button
                        custom={0}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setView('create')}
                        className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 hover:from-blue-600 hover:via-blue-700 hover:to-cyan-600 rounded-2xl font-bold text-lg flex items-center justify-center space-x-3 transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-400/10 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        <Plus className="w-6 h-6 relative z-10" />
                        <span className="relative z-10">Create New File</span>
                      </motion.button>

                      <motion.button
                        custom={1}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setView('github')}
                        className="w-full py-4 px-6 bg-white/5 hover:bg-white/10 rounded-2xl font-bold text-lg flex items-center justify-center space-x-3 transition-all border border-white/10 hover:border-white/20 backdrop-blur-xl relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-400/5 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        <Github className="w-6 h-6 relative z-10" />
                        <span className="relative z-10">Upload from GitHub</span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* CREATE FILE VIEW */}
                {view === 'create' && (
                  <motion.div
                    key="create"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-center bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                      Create New File
                    </h2>

                    <div className="space-y-5 sm:space-y-6 mb-6 sm:mb-8">
                      {/* File Type Selection */}
                      <div>
                        <label className="block text-sm font-semibold mb-4 text-gray-300">
                          Select File Type
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {fileTypes.map((type, index) => (
                            <motion.button
                              key={type.ext}
                              custom={index}
                              variants={itemVariants}
                              initial="hidden"
                              animate="visible"
                              whileHover={{ scale: 1.05, y: -3 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => setSelectedFileType(type.ext)}
                              className={`p-4 sm:p-5 rounded-2xl font-semibold transition-all border text-sm sm:text-base relative overflow-hidden group ${selectedFileType === type.ext
                                ? `bg-gradient-to-br ${type.gradient} border-blue-400/40 shadow-lg`
                                : 'bg-white/5 border-blue-500/20 text-gray-300 hover:bg-white/10 hover:border-blue-500/30'
                                }`}
                            >
                              <div className="relative z-10">
                                <div className="text-3xl mb-2">{type.icon}</div>
                                <div className={selectedFileType === type.ext ? 'text-white' : ''}>{type.name}</div>
                                {type.ext !== 'custom' && (
                                  <div className={`text-xs mt-1 ${selectedFileType === type.ext ? 'text-white/80' : 'text-gray-500'}`}>
                                    .{type.ext}
                                  </div>
                                )}
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* Custom Extension Input */}
                      <AnimatePresence>
                        {selectedFileType === 'custom' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, y: -10 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                          >
                            <label className="block text-sm font-semibold mb-3 text-gray-300">
                              Custom Extension
                            </label>
                            <input
                              type="text"
                              value={customExtension}
                              onChange={(e) => setCustomExtension(e.target.value)}
                              placeholder=".rs, .go, .php, etc."
                              className="w-full px-5 py-3.5 bg-black/30 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base placeholder-gray-500"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* File Name Input */}
                      <div>
                        <label className="block text-sm font-semibold mb-3 text-gray-300">
                          File Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={fileName}
                          onChange={(e) => setFileName(e.target.value)}
                          placeholder="Enter file name (without extension)"
                          className="w-full px-5 py-3.5 bg-black/30 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base placeholder-gray-500"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleBack}
                        disabled={loading}
                        className="flex-1 py-3.5 px-6 bg-white/5 hover:bg-white/10 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all border border-white/10 disabled:opacity-50"
                      >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCreateFile}
                        disabled={!fileName || !selectedFileType || (selectedFileType === 'custom' && !customExtension) || loading}
                        className="flex-1 py-3.5 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <FileText className="w-5 h-5" />
                            <span>Create File</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* GITHUB CONNECT VIEW */}
                {view === 'github' && (
                  <motion.div
                    key="github"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="text-center"
                  >
                    <motion.div
                      className="mb-6 sm:mb-8"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    >
                      <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/50">
                        <Github className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                      </div>
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                        Connect GitHub
                      </h2>
                      <p className="text-gray-300 text-xs sm:text-sm md:text-base px-4">
                        Import repositories and collaborate seamlessly
                      </p>
                    </motion.div>

                    {!githubConnected ? (
                      <div className="space-y-3">
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleConnectGithub}
                          className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-2xl font-bold text-lg flex items-center justify-center space-x-3 transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
                        >
                          <Github className="w-6 h-6" />
                          <span>Connect GitHub</span>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleBack}
                          className="w-full py-3.5 px-6 bg-white/5 hover:bg-white/10 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all border border-white/10"
                        >
                          <ArrowLeft className="w-5 h-5" />
                          <span>Back</span>
                        </motion.button>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="flex flex-col items-center"
                      >
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-5 border border-green-500/30">
                          <Check className="w-10 h-10 text-green-400" />
                        </div>
                        <p className="text-green-400 font-semibold text-lg">Connected Successfully!</p>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* GITHUB REPOSITORIES VIEW */}
                {view === 'github-repos' && (
                  <motion.div
                    key="github-repos"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-center bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                      Select Repository
                    </h2>

                    <div className="mb-6 sm:mb-8">
                      {githubError && !loadingRepos && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-center"
                        >
                          <p className="text-sm text-red-400 mb-2">{githubError}</p>
                          {!githubConnected && (
                            <button
                              type="button"
                              onClick={handleConnectGithub}
                              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-xs text-white border border-red-500/30 transition font-medium"
                            >
                              Reconnect GitHub
                            </button>
                          )}
                        </motion.div>
                      )}
                      {loadingRepos ? (
                        <Spinner />
                      ) : (
                        <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin">
                          {githubRepos.map((repo, index) => (
                            <motion.button
                              key={repo.id}
                              custom={index}
                              variants={itemVariants}
                              initial="hidden"
                              animate="visible"
                              whileHover={{ scale: 1.02, x: 5 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setSelectedRepo(repo.name)}
                              className={`w-full p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl transition-all border text-left ${selectedRepo === repo.name
                                ? 'bg-blue-500/20 border-blue-500/50 shadow-lg shadow-blue-500/20'
                                : 'bg-white/5 border-blue-500/20 hover:bg-white/10 hover:border-blue-500/20'
                                }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-base sm:text-lg flex items-center space-x-2 sm:space-x-2.5 mb-1.5 sm:mb-2">
                                    <Github className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
                                    <span className="truncate">{repo.name}</span>
                                  </div>
                                  <div className="text-xs sm:text-sm text-gray-400 flex items-center space-x-2 sm:space-x-3">
                                    <span className="px-2 py-0.5 sm:py-1 bg-white/10 rounded-md text-xs font-medium truncate max-w-[100px]">
                                      {repo.language || 'Unknown'}
                                    </span>
                                    <span className="flex items-center space-x-1 flex-shrink-0">
                                      <span>⭐</span>
                                      <span>{repo.stars}</span>
                                    </span>
                                  </div>
                                </div>

                                {selectedRepo === repo.name && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                    className="ml-2 sm:ml-3 flex-shrink-0"
                                  >
                                    <Check className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-blue-400" />
                                  </motion.div>
                                )}
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleBack}
                        className="flex-1 py-3.5 px-6 bg-white/5 hover:bg-white/10 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all border border-white/10"
                      >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setView('github-confirm')}
                        disabled={!selectedRepo}
                        className="flex-1 py-3.5 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span>Next</span>
                        <ArrowRight className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* GITHUB CONFIRM VIEW */}
                {view === 'github-confirm' && (
                  <motion.div
                    key="github-confirm"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="text-center"
                  >
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                      Confirm Import
                    </h2>

                    <motion.div
                      className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 mb-6 sm:mb-8 shadow-xl"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="flex items-center justify-center space-x-3 sm:space-x-4 mb-4 sm:mb-5">
                        <div className="p-2 sm:p-3 bg-blue-500/20 rounded-lg sm:rounded-xl flex-shrink-0">
                          <Github className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                        </div>
                        <div className="text-left min-w-0">
                          <div className="text-xs sm:text-sm text-gray-400 font-medium mb-1">Repository</div>
                          <div className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate">{selectedRepo}</div>
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-400 leading-relaxed text-center px-2">
                        This will import all files from the selected repository into your coding room.
                      </div>
                    </motion.div>

                    <div className="flex space-x-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleBack}
                        disabled={loading}
                        className="flex-1 py-3.5 px-6 bg-white/5 hover:bg-white/10 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all border border-white/10 disabled:opacity-50"
                      >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleImportRepo}
                        disabled={loading}
                        className="flex-1 py-3.5 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Github className="w-5 h-5" />
                            <span>Import Repository</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default FileUploadpage;