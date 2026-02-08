import React, { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import supabase from '../supabaseClient.js';
import { Terminal, Users, Plus, ArrowRight, Loader2, Lock, Globe, FolderGit2, Clock, User, X, Pencil, LogOut, LogIn } from 'lucide-react';
import { createRoom } from '../function/rooms/room-main.js';
import { handleRoomJoin } from '../function/rooms/room-main.js';
import { loginWithGithub, loginWithGithubReturn, syncGithubTokenToProfile } from '../function/login/auth';
import { fetchAllGithubRepos, getGithubToken, importRepoContents } from '../function/files/github-handle';
import { isAnyLogin } from '../function/login/isLoggin.js';
import { set } from 'lodash';
import { showToast } from '../Components/toast-notification.jsx';

const RoomCreate = () => {
  // Views: 'main', 'join', 'create_details', 'github_select'
  const [view, setView] = useState('main');
  const [loading, setLoading] = useState(false);

  // Room Data
  const [roomName, setRoomName] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  // User State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  // Recent Rooms
  const [recentJoinedRooms, setRecentJoinedRooms] = useState([]);
  const [recentCreatedRooms, setRecentCreatedRooms] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [roomViewMode, setRoomViewMode] = useState('joined');
  const [ghToken, setGhToken] = useState(null);
  const [pendingGithubRestore, setPendingGithubRestore] = useState(false);
  const [repos, setRepos] = useState([]);
  const [importStatus, setImportStatus] = useState('');
  const [loadingRepos, setLoadingRepos] = useState(false);

  // Password Modal
  const [passwordModal, setPasswordModal] = useState({
    show: false,
    roomId: null,
    roomCode: '',
    roomLink: '',
    roomName: '',
    password: ''
  });




  // Check Login Status
  useEffect(() => {
    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();


      if (!session || session.user.is_anonymous) {
        setIsLoggedIn(false);
        setCurrentUserId(null);
        setUserName("Login");
        setGhToken(null);
        return;
      }

      // ✅ Real signed-in user
      setIsLoggedIn(true);
      setCurrentUserId(session.user.id);
      setUserEmail(session.user.email);

      // Fetch profile name
      const { data: profileData } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", session.user.id)
        .single();

      const name =
        profileData?.name ||
        session.user.email?.split("@")[0] ||
        "User";

      setUserName(name);
      setTempName(name);

      const { token: syncedToken } = await syncGithubTokenToProfile();
      setGhToken(syncedToken || null);

      const redirectRaw =
        sessionStorage.getItem("github_oauth_return") ||
        localStorage.getItem("github_oauth_return");
      if (redirectRaw) {
        try {
          const redirect = JSON.parse(redirectRaw);
          if (redirect?.view) {
            setView(redirect.view);
            setPendingGithubRestore(true);
          }
        } catch (e) {
          // ignore malformed storage
        }
        sessionStorage.removeItem("github_oauth_return");
        localStorage.removeItem("github_oauth_return");
      }

      fetchRecentRooms(session.user.id);
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (pendingGithubRestore && ghToken) {
      setPendingGithubRestore(false);
    }
  }, [pendingGithubRestore, ghToken]);

  useEffect(() => {
    if (view !== 'github_select' || !ghToken) return;

    const loadRepos = async () => {
      setLoadingRepos(true);
      setImportStatus('Loading repositories...');
      try {
        const token = await getGithubToken();
        if (!token) {
          setRepos([]);
          setImportStatus('');
          return;
        }

        const repoList = await fetchAllGithubRepos(token);
        setRepos(repoList);
        setImportStatus('');
      } catch (e) {
        console.error("Failed to load GitHub repos:", e);
        setRepos([]);
        setImportStatus('Failed to load repositories');
      } finally {
        setLoadingRepos(false);
      }
    };

    loadRepos();
  }, [view, ghToken]);



  // Handle Name Edit
  const handleNameEdit = async () => {
    if (isEditingName && tempName.trim() !== userName) {



      const { error } = await supabase
        .from('profiles')
        .update({ name: tempName.trim() })
        .eq('id', currentUserId);

      if (!error) {
        setUserName(tempName.trim());
        showToast("Updating name to " + tempName.trim(), "info", 1200);
      }
    }
    setIsEditingName(!isEditingName);
  };

  // Handle Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // Handle Login
  const handleLogin = async () => {
    await loginWithGithub();
  };

  const handleGithubConnect = async () => {
    const payload = { path: "/create-room", view: "github_select", ts: Date.now() };
    sessionStorage.setItem("github_oauth_return", JSON.stringify(payload));
    localStorage.setItem("github_oauth_return", JSON.stringify(payload));
    await loginWithGithubReturn("/create-room");
  };

  // Fetch Recent Rooms
  const fetchRecentRooms = async (userId) => {
    setLoadingRecent(true);

    try {
      // =========================
      // JOINED ROOMS
      // =========================
      const { data: memberData, error: memberError } = await supabase
        .from("room_members")
        .select("room_id, joined_at")
        .eq("user_id", userId)
        .order("joined_at", { ascending: false })
        .limit(3);

      if (memberError) throw memberError;

      if (memberData?.length) {
        const roomIds = memberData.map(m => m.room_id);

        const { data: roomsData, error: roomsError } = await supabase
          .from("rooms")
          .select("id, room_name, owner_id, room_password , room_link, room_code")
          .in("id", roomIds)
          .eq("active", true);

        if (roomsError) throw roomsError;

        const ownerIds = [...new Set(roomsData.map(r => r.owner_id))];

        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", ownerIds);

        if (profilesError) throw profilesError;

        const joinedRooms = memberData.map(member => {
          const room = roomsData.find(r => r.id === member.room_id);
          if (!room) return null;

          const isOwner = room.owner_id === userId;
          const ownerProfile = profilesData?.find(p => p.id === room.owner_id);

          const hasPassword = typeof room.room_password === "string"
            ? room.room_password.trim().length > 0
            : !!room.room_password;

          return {
            roomId: room.id,
            roomCode: room.room_code,
            roomLink: room.room_link,
            roomName: room.room_name || "Unnamed Room",
            joinedAt: member.joined_at,
            ownerName: isOwner ? "You" : (ownerProfile?.name || "Owner"),
            hasPassword
          };
        }).filter(Boolean);


        setRecentJoinedRooms(joinedRooms);
      } else {
        setRecentJoinedRooms([]);
      }

      // =========================
      // CREATED ROOMS
      // =========================
      const { data: createdRoomsData, error: createdError } = await supabase
        .from("rooms")
        .select("id, room_name, created_at, room_password , room_link, room_code")
        .eq("owner_id", userId)
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(3);

      if (createdError) throw createdError;

      const createdRooms = createdRoomsData.map(room => {
        const hasPassword = typeof room.room_password === "string"
          ? room.room_password.trim().length > 0
          : !!room.room_password;

        return ({
        roomId: room.id,
        roomCode: room.room_code,
        roomLink: room.room_link,
        roomName: room.room_name || "Unnamed Room",
        joinedAt: room.created_at,
        ownerName: "You",
        hasPassword
      });
      });

      setRecentCreatedRooms(createdRooms);

    } catch (error) {
      console.error("Error fetching recent rooms:", error);
      showToast("Failed to load recent rooms.", "error", 1500);
      setRecentJoinedRooms([]);
      setRecentCreatedRooms([]);
    } finally {
      setLoadingRecent(false);
    }
  };


  // Handle Recent Room Join
  const handleRecentRoomJoin = async (roomCode, roomLink, roomId, hasPassword) => {
    if (hasPassword) {
      setPasswordModal({
        show: true,
        roomCode,
        roomLink,
        roomName:
          getCurrentRooms().find(r => r.roomCode === roomCode)?.roomName || "",
        password: ""
      });
    } 
    else {
      const res = await handleRoomJoin(roomCode, null, false);

      if (res?.status === "joined") {
        window.location.href = "/editor?roomId=" + roomLink + "&token=" + res.token;
      } else if (res?.status === "kicked") {
        showToast("You have been removed from this room.", "error", 1500);
      } else {
        showToast("Failed to join room. Please try again.", "error", 1200);

      }
    }
  };


  // Submit Password for Recent Room
  const handlePasswordModalSubmit = async () => {
    setLoading(true);
    const res = await handleRoomJoin(
      passwordModal.roomCode,
      passwordModal.password,
      true
    );

    if (res.status === "wrong_password") {
      showToast("Incorrect password.", "error", 1200);
      setLoading(false);
    } else if (res.status === "not_found") {
      showToast("Room not found or inactive.", "error", 1200);
      setLoading(false);
    } else if (res.status === "kicked") {
      showToast("You have been removed from this room.", "error", 1500);
      setLoading(false);
    } else if (res.status === "joined") {
      setPasswordModal({ show: false, roomId: null, roomCode: '', roomLink: '', roomName: '', password: '' });
      window.location.href = `/editor?roomId=${res.roomId}&token=${res.token}`;
    } else {
      showToast("Failed to join room.", "error", 1200);
      setLoading(false);
    }
  };

  // Get current rooms based on mode
  const getCurrentRooms = () => {
    return roomViewMode === 'joined' ? recentJoinedRooms : recentCreatedRooms;
  };

  // Format Date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // GitHub Logic



  // Create Empty Room
  const handleCreateEmptyRoom = async () => {
    setLoading(true);
    try {
      const trimmedPassword = (roomPassword || "").trim();
      const passwordToSave = trimmedPassword.length > 0 ? trimmedPassword : null;
      const result = await createRoom(roomName.trim(), passwordToSave);
      setLoading(false);

      if (!result.success) return;

      if (result.type === "temporary") {
        window.location.href = `/editor?roomId=${result.roomId}&token=${result.token}`;
      } else {
        window.location.href = `/upload?roomId=${result.roomId}&token=${result.token}`;
      }
    } catch (err) {
      setLoading(false);
      showToast("Error creating room. Please try again.", "error", 1200);
    }
  };

  const handleJoinNext = async () => {
    if (!showPasswordInput) {
      const res = await handleRoomJoin(roomCode.trim(), null, false);

      if (res.status === "need_password") {
        setShowPasswordInput(true);
      } else if (res.status === "not_found") {
        showToast("Room not found or inactive.", "error", 1200);
      } else if (res.status === "kicked") {
        showToast("You have been removed from this room.", "error", 1500);
      } else if (res.status === "joined") {
        window.location.href = `/editor?roomId=${res.roomId}&token=${res.token}`;
      }
    } else {
      setLoading(true);
      const res = await handleRoomJoin(roomCode, roomPassword, true);

      if (res.status === "wrong_password") {
        showToast("Incorrect password.", "error", 1200);
        setLoading(false);
      } else if (res.status === "not_found") {
        showToast("Room not found or inactive.", "error", 1200);
        setLoading(false);
      } else if (res.status === "kicked") {
        showToast("You have been removed from this room.", "error", 1500);
        setLoading(false);
      } else if (res.status === "joined") {
        window.location.href = `/editor?roomId=${res.roomId}&token=${res.token}`;
      }
    }
  };

  const handleSoloCode = () => {
    setLoading(true);
    createRoom('Solo Room' , null , true).then((result) => {
      window.location.href = `/editor?roomId=${result.roomId}&token=${result.token}`;
    });
  };

  const handleImportRepository = async (repo) => {
    try {
      setLoading(true);
      setImportStatus('Creating room...');
      const result = await createRoom(repo.name, roomPassword);
      if (!result?.success) {
        showToast("Failed to create room for GitHub import.", "error", 1500);
        setLoading(false);
        setImportStatus('');
        return;
      }

      const token = await getGithubToken();
      if (!token) {
        showToast("GitHub not connected.", "error", 1500);
        setLoading(false);
        setImportStatus('');
        return;
      }

      setImportStatus('Importing repository...');
      await importRepoContents({
        owner: repo.owner,
        repo: repo.name,
        roomLink: result.roomId,
        token
      });

      setImportStatus('Finalizing...');
      window.location.href = `/editor?roomId=${result.roomId}&token=${result.token}`;
    } catch (err) {
      console.error("GitHub import failed:", err);
      showToast("GitHub import failed. Please try again.", "error", 1500);
      setLoading(false);
      setImportStatus('');
    }
  };

  // Navigation Logic

  const handleBack = () => {
    setView('main');
    setShowPasswordInput(false);
    setRoomPassword('');
    setRoomCode('');
  };


  const cardVariants = {
    main: {
      scale: 1,
      width: '100%',
      maxWidth: '520px',
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
    },
    small: {
      scale: 1,
      width: '100%',
      maxWidth: '440px',
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
    },
    large: {
      scale: 1,
      width: '100%',
      maxWidth: '620px',
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
    }
  };

  const currentRooms = getCurrentRooms();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-950 text-white font-sans relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* User Profile Section - Top Right */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50">
        {isLoggedIn ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-2 md:px-4 md:py-3 shadow-xl"
          >
            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex-1 min-w-0">
                {isEditingName ? (
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={handleNameEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleNameEdit();
                      if (e.key === 'Escape') {
                        setTempName(userName);
                        setIsEditingName(false);
                      }
                    }}
                    className="bg-transparent border-b border-blue-400 text-xs md:text-sm font-semibold focus:outline-none w-full"
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs md:text-sm font-semibold truncate max-w-[120px] md:max-w-[160px]">
                      {userName}
                    </span>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-gray-400 hover:text-blue-400 transition flex-shrink-0"
                    >
                      <Pencil className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    </button>
                  </div>
                )}
                <p className="text-[10px] md:text-xs text-gray-400 truncate max-w-[140px] md:max-w-[180px] mt-0.5">
                  {userEmail}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 p-1.5 md:p-2 rounded-lg transition flex-shrink-0 border border-red-500/20"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={handleLogin}
            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 p-2 md:p-2.5 rounded-xl transition border border-blue-500/20 shadow-xl backdrop-blur-xl"
            title="Login"
          >
            <LogIn className="w-4 h-4 md:w-5 md:h-5" />
          </motion.button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-20 md:py-8 relative z-10">
        <motion.div
          variants={cardVariants}
          animate={view === 'github_select' ? 'large' : (view === 'main' ? 'main' : 'small')}
          className="w-full"
        >
          <div className="backdrop-blur-2xl bg-black/40 rounded-3xl border border-white/10 shadow-2xl p-5 sm:p-7 md:p-9">
            <AnimatePresence mode="wait">

              {/* === MAIN VIEW === */}
              {view === 'main' && (
                <motion.div
                  key="main"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="text-center"
                >
                  <motion.h1
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent leading-tight"
                  >
                    Code Together Instantly
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-gray-400 text-sm sm:text-base mb-6 sm:mb-8"
                  >
                    {isLoggedIn ? 'Create or join a collaborative workspace' : 'No login required to start'}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-3 mb-6"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setView('create_details')}
                      className="w-full py-3 sm:py-3.5 px-4 sm:px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl font-semibold text-sm sm:text-base flex items-center justify-center space-x-2 transition-all shadow-lg"
                    >
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Create {isLoggedIn ? '' : 'Temporary '}Room</span>
                    </motion.button>

                    <div className="grid grid-cols-2 gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setView('join')}
                        className="py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 border border-white/10 transition-all"
                      >
                        <Users className="w-4 h-4" />
                        <span>Join</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSoloCode}
                        className="py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 border border-white/10 transition-all"
                      >
                        <Terminal className="w-4 h-4" />
                        <span>Solo</span>
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* Horizontal Divider */}
                  {isLoggedIn && (recentJoinedRooms.length > 0 || recentCreatedRooms.length > 0) && (
                    <motion.div
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                      className="relative my-6 sm:my-8"
                    >
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-gradient-to-br from-gray-900 to-gray-950 px-4 text-xs sm:text-sm text-gray-400 font-medium">
                          Recent Activity
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {/* Recent Rooms Section */}
                  {isLoggedIn && (recentJoinedRooms.length > 0 || recentCreatedRooms.length > 0) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="mt-0"
                    >
                      {/* Toggle Button */}
                      <div className="mb-4 flex justify-center">
                        <div className="relative inline-flex bg-white/5 rounded-xl p-1 border border-white/10">
                          <motion.div
                            className="absolute top-1 bottom-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg shadow-lg"
                            initial={false}
                            animate={{
                              left: roomViewMode === 'joined' ? '4px' : '50%',
                              right: roomViewMode === 'joined' ? '50%' : '4px',
                            }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />

                          <button
                            onClick={() => setRoomViewMode('joined')}
                            className={`relative z-10 px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium transition-colors rounded-lg ${roomViewMode === 'joined' ? 'text-white' : 'text-gray-400'
                              }`}
                          >
                            Joined
                          </button>
                          <button
                            onClick={() => setRoomViewMode('created')}
                            className={`relative z-10 px-4 sm:px-6 py-2 text-xs sm:text-sm font-medium transition-colors rounded-lg ${roomViewMode === 'created' ? 'text-white' : 'text-gray-400'
                              }`}
                          >
                            Created
                          </button>
                        </div>
                      </div>

                      {/* Rooms List */}
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={roomViewMode}
                          initial={{ opacity: 0, x: roomViewMode === 'joined' ? -15 : 15 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: roomViewMode === 'joined' ? 15 : -15 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="space-y-2.5"
                        >
                          {currentRooms.length > 0 ? (
                            currentRooms.map((room, idx) => (
                              <motion.div
                                key={room.roomId}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={{ scale: 1.01 }}
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all group backdrop-blur-sm"
                              >
                                <div className="flex-1 mb-2 sm:mb-0 min-w-0">
                                  <h4 className="font-semibold text-sm sm:text-base text-white truncate">
                                    {room.roomName}
                                  </h4>
                                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-400 mt-1">
                                    <span className="flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      {room.ownerName}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatDate(room.joinedAt)}
                                    </span>
                                    {room.hasPassword && (
                                      <>
                                        <span>•</span>
                                        <span className="flex items-center gap-1 text-yellow-400">
                                          <Lock className="w-3 h-3" />
                                          Protected
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleRecentRoomJoin(room.roomCode, room.roomLink, room.roomId, room.hasPassword)}
                                  className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg text-xs sm:text-sm font-medium shadow-md transition-all flex items-center justify-center gap-1.5"
                                >
                                  <span>Join</span>
                                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                                </motion.button>
                              </motion.div>
                            ))
                          ) : (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-center py-8 text-gray-500 text-xs sm:text-sm bg-white/5 rounded-xl border border-white/5"
                            >
                              No {roomViewMode === 'joined' ? 'joined' : 'created'} rooms yet
                            </motion.div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </motion.div>
                  )}

                  {isLoggedIn && loadingRecent && (
                    <div className="mt-6 text-center">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-500" />
                    </div>
                  )}

                  {/* Bottom Info Text */}
                  {!isLoggedIn && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="mt-6 text-center text-gray-500 text-[10px] sm:text-xs"
                    >
                      Temporary rooms expire after 24 hours. Login to unlock GitHub sync and permanent storage.
                    </motion.p>
                  )}
                </motion.div>
              )}

              {/* === CREATE ROOM DETAILS === */}
              {view === 'create_details' && (
                <motion.div
                  key="create_details"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 text-center bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Room Details
                  </h2>
                  <p className="text-gray-500 text-xs sm:text-sm text-center mb-6">
                    Configure your workspace
                  </p>

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-400">
                        Room Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder="e.g., My Awesome Project"
                        className="w-full px-4 py-2.5 sm:py-3 bg-black/30 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm sm:text-base placeholder:text-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-400">
                        Password <span className="text-gray-600 text-xs">(optional)</span>
                      </label>
                      <input
                        type="password"
                        value={roomPassword}
                        onChange={(e) => setRoomPassword(e.target.value)}
                        placeholder="Protect your room"
                        className="w-full px-4 py-2.5 sm:py-3 bg-black/30 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm sm:text-base placeholder:text-gray-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleBack}
                      className="py-2.5 sm:py-3 px-4 sm:px-6 bg-white/5 hover:bg-white/10 rounded-xl font-medium border border-white/10 text-sm sm:text-base transition-all"
                    >
                      Back
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCreateEmptyRoom}
                      disabled={!roomName || loading}
                      className="py-2.5 sm:py-3 px-4 sm:px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-sm sm:text-base transition-all"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Create</span> <ArrowRight className="w-4 h-4" /></>}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* === GITHUB SELECT VIEW === */}
              {view === 'github_select' && (
                <motion.div
                  key="github_select"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Select Repository
                    </h2>
                    {(loading || loadingRepos) && (
                      <span className="text-xs text-blue-400 animate-pulse">
                        {importStatus || "Loading..."}
                      </span>
                    )}
                  </div>

                  {!ghToken ? (
                    <div className="text-center py-10">
                      <p className="text-gray-400 mb-2 text-sm">GitHub not connected</p>
                      <p className="text-gray-500 mb-4 text-xs">Connect to access your repositories</p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleGithubConnect}
                        className="bg-white text-black px-6 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition text-sm"
                      >
                        Connect GitHub
                      </motion.button>
                    </div>
                  ) : (
                    <div className="h-[280px] sm:h-[320px] overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-700">
                      {repos.map(repo => (
                        <motion.div
                          key={repo.id}
                          whileHover={{ scale: 1.01 }}
                          onClick={() => !loading && handleImportRepository(repo)}
                          className={`p-3 sm:p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition flex justify-between items-center ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                          <div>
                            <h3 className="font-semibold text-sm sm:text-base">{repo.name}</h3>
                            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-400 mt-1">
                              {repo.private ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                              <span>{repo.private ? 'Private' : 'Public'}</span>
                              <span>•</span>
                              <span>{repo.language || 'Plain Text'}</span>
                            </div>
                          </div>
                          <FolderGit2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                        </motion.div>
                      ))}
                      {repos.length === 0 && !loadingRepos && (
                        <p className="text-center text-gray-500 mt-10 text-sm">No repositories found.</p>
                      )}
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleBack}
                    disabled={loading}
                    className="mt-6 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl disabled:opacity-50 text-sm sm:text-base transition-all"
                  >
                    Back
                  </motion.button>
                </motion.div>
              )}

              {/* === JOIN VIEW === */}
              {view === 'join' && (
                <motion.div
                  key="join"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Join a Room
                  </h2>

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-400">Room Code</label>
                      <input
                        type="text"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value)}
                        placeholder="Enter room code"
                        className="w-full px-4 py-2.5 sm:py-3 bg-black/30 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm sm:text-base placeholder:text-gray-600"
                      />
                    </div>
                    <AnimatePresence>
                      {showPasswordInput && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-400">Room Password</label>
                          <input
                            type="password"
                            value={roomPassword}
                            onChange={(e) => setRoomPassword(e.target.value)}
                            placeholder="Enter password"
                            className="w-full px-4 py-2.5 sm:py-3 bg-black/30 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm sm:text-base placeholder:text-gray-600"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleBack}
                      disabled={loading}
                      className="py-2.5 sm:py-3 px-4 sm:px-6 bg-white/5 hover:bg-white/10 rounded-xl font-medium border border-white/10 disabled:opacity-50 text-sm sm:text-base transition-all"
                    >
                      Back
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleJoinNext}
                      disabled={!roomCode || loading}
                      className="py-2.5 sm:py-3 px-4 sm:px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-sm sm:text-base transition-all"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>{showPasswordInput ? 'Join' : 'Next'}</span> <ArrowRight className="w-4 h-4" /></>}
                    </motion.button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Password Modal */}
      <AnimatePresence>
        {passwordModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            onClick={() => setPasswordModal({ show: false, roomId: null, roomCode: '', roomLink: '', roomName: '', password: '' })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-white/10 shadow-2xl p-5 sm:p-6 md:p-8 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Room Password</h3>
                <button
                  onClick={() => setPasswordModal({ show: false, roomId: null, roomCode: '', roomLink: '', roomName: '', password: '' })}
                  className="text-gray-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-gray-400 text-xs sm:text-sm mb-5">
                Enter password for <span className="text-blue-400 font-semibold">{passwordModal.roomName}</span>
              </p>

              <input
                type="password"
                value={passwordModal.password}
                onChange={(e) => setPasswordModal({ ...passwordModal, password: e.target.value })}
                placeholder="Enter room password"
                className="w-full px-4 py-2.5 sm:py-3 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all mb-5 text-white text-sm sm:text-base placeholder:text-gray-600"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && passwordModal.password) {
                    handlePasswordModalSubmit();
                  }
                }}
                autoFocus
              />

              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPasswordModal({ show: false, roomId: null, roomName: '', password: '' })}
                  disabled={loading}
                  className="py-2.5 sm:py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl font-medium border border-white/10 transition disabled:opacity-50 text-sm sm:text-base"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePasswordModalSubmit}
                  disabled={!passwordModal.password || loading}
                  className="py-2.5 sm:py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-sm sm:text-base"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Join</span> <ArrowRight className="w-4 h-4" /></>}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoomCreate;
