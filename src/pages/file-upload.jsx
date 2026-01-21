import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Github, Plus, ArrowLeft, ArrowRight, Trash2, Loader2, Check } from 'lucide-react';

const FileUploadpage = () => {
  const [view, setView] = useState('main'); // main, create, github, github-repos, github-confirm
  const [selectedFileType, setSelectedFileType] = useState('');
  const [customExtension, setCustomExtension] = useState('');
  const [fileName, setFileName] = useState('');
  const [selectedRepo, setSelectedRepo] = useState('');
  const [loading, setLoading] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);

  // Dummy room data
  const roomName = "My Coding Session";
  const roomCode = "ABC-123-XYZ";

  // File type options
  const fileTypes = [
    { name: 'Python', ext: '.py', icon: '🐍' },
    { name: 'C', ext: '.c', icon: '©️' },
    { name: 'C++', ext: '.cpp', icon: '➕' },
    { name: 'Java', ext: '.java', icon: '☕' },
    { name: 'JavaScript', ext: '.js', icon: '⚡' },
    { name: 'Custom', ext: 'custom', icon: '✨' }
  ];

  // Dummy repositories
  const repositories = [
    { id: 1, name: 'codesync-editor', stars: 142, language: 'TypeScript' },
    { id: 2, name: 'realtime-code-room', stars: 89, language: 'React' },
    { id: 3, name: 'file-sharing-app', stars: 56, language: 'Python' }
  ];

  const handleCreateFile = () => {
    const extension = selectedFileType === 'custom' ? customExtension : selectedFileType;
    console.log({
      fileName,
      extension,
      roomCode
    });
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      console.log('File created successfully');
    }, 1500);
  };

  const handleConnectGithub = () => {
    console.log('GitHub connected');
    setGithubConnected(true);
    setTimeout(() => {
      setView('github-repos');
    }, 800);
  };

  const handleImportRepo = () => {
    setLoading(true);
    console.log({
      selectedRepo,
      roomCode
    });
    setTimeout(() => {
      setLoading(false);
      console.log('Repository imported successfully');
    }, 2000);
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
    console.log('Delete room');
  };

  const getCardWidth = () => {
    if (view === 'main') return '450px';
    if (view === 'create') return '600px';
    if (view === 'github' || view === 'github-repos' || view === 'github-confirm') return '650px';
    return '500px';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-950 to-gray-950 text-white font-sans flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>

      {/* Top Right Room Info */}
      <div className="fixed top-6 right-6 z-50">
        <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl shadow-2xl px-4 py-3 flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm font-semibold text-white">{roomName}</div>
            <div className="text-xs text-gray-400">Code: {roomCode}</div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDeleteRoom}
            className="p-2 hover:bg-red-500/20 rounded-lg transition-all group"
          >
            <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" />
          </motion.button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          animate={{ 
            width: getCardWidth(),
            maxWidth: '90vw'
          }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="w-full"
        >
          <div className="backdrop-blur-xl bg-black/30 rounded-3xl border border-white/10 shadow-2xl p-6 sm:p-8 md:p-10">
            <AnimatePresence mode="wait">
              {/* MAIN VIEW */}
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
                    Start Coding
                  </h1>
                  <p className="text-gray-400 text-base sm:text-lg mb-8 sm:mb-12">
                    Create a new file or import from GitHub
                  </p>

                  <div className="space-y-3 sm:space-y-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setView('create')}
                      className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl font-semibold text-base sm:text-lg flex items-center justify-center space-x-2 sm:space-x-3 transition-all shadow-lg hover:shadow-blue-500/50"
                    >
                      <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span>Create New File</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setView('github')}
                      className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-white/5 hover:bg-white/10 rounded-xl font-semibold text-base sm:text-lg flex items-center justify-center space-x-2 sm:space-x-3 transition-all border border-white/10"
                    >
                      <Github className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span>Upload from GitHub</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* CREATE FILE VIEW */}
              {view === 'create' && (
                <motion.div
                  key="create"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center">Create New File</h2>

                  <div className="space-y-5 mb-6">
                    {/* File Type Selection */}
                    <div>
                      <label className="block text-sm font-medium mb-3 text-gray-400">
                        Select File Type
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                        {fileTypes.map((type) => (
                          <motion.button
                            key={type.ext}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setSelectedFileType(type.ext)}
                            className={`p-3 sm:p-4 rounded-xl font-medium transition-all border text-sm sm:text-base ${
                              selectedFileType === type.ext
                                ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                            }`}
                          >
                            <div className="text-2xl mb-1">{type.icon}</div>
                            <div>{type.name}</div>
                            {type.ext !== 'custom' && <div className="text-xs text-gray-500">{type.ext}</div>}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Extension Input */}
                    <AnimatePresence>
                      {selectedFileType === 'custom' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <label className="block text-sm font-medium mb-2 text-gray-400">
                            Custom Extension
                          </label>
                          <input
                            type="text"
                            value={customExtension}
                            onChange={(e) => setCustomExtension(e.target.value)}
                            placeholder=".rs, .go, .php"
                            className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* File Name Input */}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-400">
                        File Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        placeholder="Enter file name (without extension)"
                        className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleBack}
                      disabled={loading}
                      className="flex-1 py-3 px-6 bg-white/5 hover:bg-white/10 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all border border-white/10 disabled:opacity-50"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      <span>Back</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCreateFile}
                      disabled={!fileName || !selectedFileType || (selectedFileType === 'custom' && !customExtension) || loading}
                      className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="text-center"
                >
                  <div className="mb-8">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <Github className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-3">Connect GitHub</h2>
                    <p className="text-gray-400 text-sm sm:text-base">
                      Import repositories and collaborate seamlessly
                    </p>
                  </div>

                  {!githubConnected ? (
                    <div className="space-y-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleConnectGithub}
                        className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl font-semibold text-lg flex items-center justify-center space-x-3 transition-all shadow-lg hover:shadow-blue-500/50"
                      >
                        <Github className="w-6 h-6" />
                        <span>Connect GitHub</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleBack}
                        className="w-full py-3 px-6 bg-white/5 hover:bg-white/10 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all border border-white/10"
                      >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back</span>
                      </motion.button>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center"
                    >
                      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                        <Check className="w-8 h-8 text-green-400" />
                      </div>
                      <p className="text-green-400 font-medium">Connected Successfully!</p>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* GITHUB REPOSITORIES VIEW */}
              {view === 'github-repos' && (
                <motion.div
                  key="github-repos"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Select Repository</h2>

                  <div className="space-y-3 mb-6">
                    {repositories.map((repo) => (
                      <motion.button
                        key={repo.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedRepo(repo.name)}
                        className={`w-full p-4 rounded-xl transition-all border text-left ${
                          selectedRepo === repo.name
                            ? 'bg-blue-500/20 border-blue-500'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-lg flex items-center space-x-2">
                              <Github className="w-5 h-5" />
                              <span>{repo.name}</span>
                            </div>
                            <div className="text-sm text-gray-400 mt-1">
                              {repo.language} • ⭐ {repo.stars} stars
                            </div>
                          </div>
                          {selectedRepo === repo.name && (
                            <Check className="w-6 h-6 text-blue-400" />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  <div className="flex space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleBack}
                      className="flex-1 py-3 px-6 bg-white/5 hover:bg-white/10 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all border border-white/10"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      <span>Back</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setView('github-confirm')}
                      disabled={!selectedRepo}
                      className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="text-center"
                >
                  <h2 className="text-2xl sm:text-3xl font-bold mb-6">Confirm Import</h2>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-center space-x-3 mb-4">
                      <Github className="w-8 h-8 text-blue-400" />
                      <div className="text-left">
                        <div className="text-sm text-gray-400">Repository</div>
                        <div className="text-xl font-semibold">{selectedRepo}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      This will import all files from the selected repository into your coding room.
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleBack}
                      disabled={loading}
                      className="flex-1 py-3 px-6 bg-white/5 hover:bg-white/10 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all border border-white/10 disabled:opacity-50"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      <span>Back</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleImportRepo}
                      disabled={loading}
                      className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default FileUploadpage;