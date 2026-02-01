import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../Components/footer';
import Navbar from '../Components/navbar.jsx';
import { isLoggin } from '../function/login/isLoggin.js';
import { createRoom } from '../function/rooms/room-main.js';
import supabase from '../supabaseClient.js';
import { Terminal, Users, Plus, ArrowRight, ArrowLeft, Loader2, Github, Lock, Globe, FileCode, FolderGit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { handleRoomJoin } from '../function/rooms/room-main.js';
import { loginWithGithub } from '../function/login/auth';

const RoomCreate = () => {
  // Views: 'main', 'join', 'create_details', 'create_method', 'github_select'
  const [view, setView] = useState('main');
  const [loading, setLoading] = useState(false);

  // Room Data
  const [roomName, setRoomName] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // GitHub State
  const [repos, setRepos] = useState([]);
  const [ghToken, setGhToken] = useState(null);
  const [importStatus, setImportStatus] = useState('');

  const navigate = useNavigate();

  // Check Login Status
  useEffect(() => {
    (async () => {
      const loggedIn = await isLoggin();
      if (loggedIn) setIsLoggedIn(true);
    })();
  }, []);

  // --- GitHub Logic ---
  const handleGithubView = async () => {
    setView('github_select');
    // Get Session & Token
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.provider_token) {
      setGhToken(session.provider_token);
      fetchRepos(session.provider_token);
    }
  };

  const fetchRepos = async (token) => {
    setLoading(true);
    try {
      const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=50', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setRepos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImportRepository = async (repo) => {
    setLoading(true);
    const finalRoomName = roomName.trim() || repo.name;
    setImportStatus(`Creating room "${finalRoomName}"...`);

    try {
      // 1. Create Room
      const roomResult = await createRoom(finalRoomName, roomPassword);
      if (!roomResult.success) throw new Error("Failed to create room");
      const newRoomId = roomResult.roomLink;

      // 2. Fetch File Tree
      setImportStatus(`Fetching files from GitHub...`);
      const treeRes = await fetch(`https://api.github.com/repos/${repo.owner.login}/${repo.name}/git/trees/${repo.default_branch}?recursive=1`, {
        headers: { Authorization: `Bearer ${ghToken}` }
      });
      const treeData = await treeRes.json();

      // Filter blobs (files) - Limit to 50
      const filesToFetch = treeData.tree.filter(n => n.type === 'blob').slice(0, 50);

      setImportStatus(`Importing ${filesToFetch.length} files...`);

      // 3. Download & Prepare Files (With Binary Check)
      const filePromises = filesToFetch.map(async (fileNode) => {
        try {
          const contentRes = await fetch(fileNode.url, {
            headers: { Authorization: `Bearer ${ghToken}` }
          });
          const contentData = await contentRes.json();

          // Decode Base64
          const decodedContent = atob(contentData.content);

          // CRITICAL FIX: Check for Null Bytes (\u0000)
          // If a file has this char, it is binary (image/exe), so we skip it.
          if (decodedContent.includes('\u0000')) {
            console.warn(`Skipping binary file: ${fileNode.path}`);
            return null;
          }

          return {
            room_id: newRoomId,
            file_path: fileNode.path,
            file_name: fileNode.path.split('/').pop(),
            content: decodedContent,
            language: fileNode.path.split('.').pop()
          };
        } catch (err) {
          console.error(`Failed to fetch ${fileNode.path}`, err);
          return null;
        }
      });

      // Wait for all downloads
      const filesResult = await Promise.all(filePromises);

      // Filter out the nulls (the binary files we skipped)
      const validFiles = filesResult.filter(file => file !== null);

      if (validFiles.length === 0) {
        throw new Error("No valid text files found in this repo.");
      }

      // 4. Insert into Supabase
      const { error } = await supabase.from('room_files').insert(validFiles);

      if (error) throw error;

      // 5. Redirect
      window.location.href = `/editor?roomId=${newRoomId}`;

    } catch (error) {
      console.error(error);
      alert("Import Failed: " + error.message);
      setLoading(false);
      setImportStatus('');
    }
  };

  // --- Create Empty Room Logic ---
  const handleCreateEmptyRoom = async () => {
    setLoading(true);

    try {
      const result = await createRoom(roomName.trim(), roomPassword);
      setLoading(false);

      if (!result.success) return;

      if (result.type === "temporary") {
        window.location.href =
          `/editor?roomId=${result.roomId}&token=${result.token}`;
      }

      else {
        window.location.href =
          `/upload?roomId=${result.roomId}&token=${result.token}`;
      }

    } catch (err) {
      setLoading(false);
      console.error("Failed to create room:", err);
    }
  };


  const handleJoinNext = async () => {
    if (!showPasswordInput) {
      const res = await handleRoomJoin(roomCode.trim(), null, false);

      if (res.status === "need_password") {
        setShowPasswordInput(true);
      } else if (res.status === "not_found") {
        alert("Room not found.");
      } else if (res.status === "joined") {
        window.location.href = `/editor?roomId=${res.roomId}&token=${res.token}`;
      }
    } else {
      setLoading(true);

      const res = await handleRoomJoin(roomCode, roomPassword, true);

      if (res.status === "wrong_password") {
        alert("Incorrect password.");
        setLoading(false);
      } else if (res.status === "joined") {
        window.location.href = `/editor?roomId=${res.roomId}&token=${res.token}`;
      }
    }
  };


  const handleSoloCode = () => {
    setLoading(true);
    createRoom('Solo Room').then((result) => {
      window.location.href = `/editor?roomId=${result.roomLink}`;
    });
  };

  // Navigation Logic
  const handleBack = () => {
    if (view === 'create_method') setView('create_details');
    else if (view === 'github_select') setView('create_method');
    else if (view === 'create_details') {
      setView('main');
      setRoomName('');
      setRoomPassword('');
    }
    else {
      setView('main');
      setRoomCode('');
      setShowPasswordInput(false);
    }
    setLoading(false);
    setImportStatus('');
  };

  const cardVariants = {
    main: { scale: 0.77, width: '100%', maxWidth: '500px', transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
    small: { scale: 0.77, width: '100%', maxWidth: '420px', transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
    large: { scale: 0.77, width: '100%', maxWidth: '600px', transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-950 to-gray-950 text-white font-sans">
      <Navbar path={window.location.pathname} />

      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-24 pb-12">
        <motion.div
          variants={cardVariants}
          animate={view === 'github_select' ? 'large' : (view === 'main' ? 'main' : 'small')}
          className="w-full"
        >
          <div className="backdrop-blur-xl bg-black/30 rounded-3xl border border-white/10 shadow-2xl p-6 sm:p-8 md:p-10">
            <AnimatePresence mode="wait">

              {/* === 1. MAIN VIEW === */}
              {view === 'main' && (
                <motion.div key="main" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="text-center">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-300 bg-clip-text text-transparent leading-tight">
                    Code Together Instantly
                  </h1>
                  <p className="text-gray-400 text-base sm:text-lg mb-8 sm:mb-12">
                    {isLoggedIn ? '' : 'No login required to start '}
                  </p>

                  <div className="space-y-3 sm:space-y-4">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setView('create_details')} className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl font-semibold text-base sm:text-lg flex items-center justify-center space-x-2 sm:space-x-3 transition-all shadow-lg hover:shadow-blue-500/50">
                      <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span>Create {isLoggedIn ? '' : 'Temporary '} Room</span>
                    </motion.button>

                    <div className="flex space-x-3">
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setView('join')} className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl font-semibold text-base flex items-center justify-center space-x-2 border border-white/10">
                        <Users className="w-5 h-5" />
                        <span>Join</span>
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSoloCode} className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl font-semibold text-base flex items-center justify-center space-x-2 border border-white/10">
                        <Terminal className="w-5 h-5" />
                        <span>Solo</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* === 2. CREATE ROOM: DETAILS (Name & Password) === */}
              {view === 'create_details' && (
                <motion.div key="create_details" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 text-center">Room Details</h2>
                  <p className="text-gray-500 text-xs sm:text-sm text-center mb-6 sm:mb-8">
                    Set up your workspace identity
                  </p>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-400">Room Name <span className="text-red-400">*</span></label>
                      <input type="text" value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="e.g., My Awesome Project" className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-400">Password <span className="text-gray-600">(optional)</span></label>
                      <input type="password" value={roomPassword} onChange={(e) => setRoomPassword(e.target.value)} placeholder="Protect your room" className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button onClick={handleBack} className="flex-1 py-3 px-6 bg-white/5 hover:bg-white/10 rounded-lg font-medium border border-white/10">Back</button>
                    <button onClick={handleCreateEmptyRoom} disabled={!roomName || loading} className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-medium shadow-lg disabled:opacity-50 flex justify-center items-center gap-2">
                       {loading ? <Loader2 className="animate-spin" /> : <> Next <ArrowRight size={18} /></>}
                    </button>
                  </div>
                </motion.div>
              )}


              {/* === 4. GITHUB SELECT VIEW === */}
              {view === 'github_select' && (
                <motion.div key="github_select" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2"><Github /> Select Repository</h2>
                    {loading && <span className="text-xs text-blue-400 animate-pulse">{importStatus || "Loading..."}</span>}
                  </div>

                  {!ghToken ? (
                    <div className="text-center py-10">
                      <p className="text-gray-400 mb-4">Connect GitHub to access your repositories</p>
                      <button onClick={loginWithGithub} className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition">
                        Connect GitHub
                      </button>
                    </div>
                  ) : (
                    <div className="h-[300px] overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-700">
                      {repos.map(repo => (
                        <div key={repo.id} onClick={() => !loading && handleImportRepository(repo)}
                          className={`p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition flex justify-between items-center ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                          <div>
                            <h3 className="font-semibold text-lg">{repo.name}</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                              {repo.private ? <Lock size={12} /> : <Globe size={12} />}
                              <span>{repo.private ? 'Private' : 'Public'}</span>
                              <span>•</span>
                              <span>{repo.language || 'Plain Text'}</span>
                            </div>
                          </div>
                          <FolderGit2 className="w-5 h-5 text-gray-500" />
                        </div>
                      ))}
                      {repos.length === 0 && !loading && <p className="text-center text-gray-500 mt-10">No repositories found.</p>}
                    </div>
                  )}

                  <button onClick={handleBack} disabled={loading} className="mt-6 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl">
                    Back
                  </button>
                </motion.div>
              )}

              {/* === JOIN VIEW === */}
              {view === 'join' && (
                <motion.div key="join" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center">Join a Room</h2>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-400">Room Code</label>
                      <input type="text" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} placeholder="Enter room code" className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                    </div>
                    <AnimatePresence>
                      {showPasswordInput && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                          <label className="block text-sm font-medium mb-2 text-gray-400 mt-3">Room Password</label>
                          <input type="password" value={roomPassword} onChange={(e) => setRoomPassword(e.target.value)} placeholder="Enter password" className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="flex space-x-3">
                    <button onClick={handleBack} disabled={loading} className="flex-1 py-3 px-6 bg-white/5 hover:bg-white/10 rounded-lg font-medium border border-white/10 disabled:opacity-50">Back</button>
                    <button onClick={handleJoinNext} disabled={!roomCode || loading} className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-medium shadow-lg disabled:opacity-50 flex justify-center items-center gap-2">
                      {loading ? <Loader2 className="animate-spin" /> : <>{showPasswordInput ? 'Join' : 'Next'} <ArrowRight size={18} /></>}
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>

        <p className="absolute bottom-8 text-center text-gray-500 text-xs sm:text-sm max-w-2xl px-4">
          {isLoggedIn ? '' : ' Temporary rooms expire after 24 hours. Login to unlock GitHub sync, invites, and permanent storage.'}
        </p>
      </div>

      <div className="mt-auto py-6 px-3"><Footer /></div>
    </div>
  );
};

export default RoomCreate;