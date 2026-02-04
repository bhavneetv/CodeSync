import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Save, Users, Settings, Plus, FolderPlus, Edit2, Trash2,
  ChevronRight, ChevronDown, File, Folder, X, Menu, Terminal as TerminalIcon,
  Maximize2, Minimize2, AlertTriangle, Crown, Shield, LogOut,
  FileCode, FileJson, FileText, Image as ImageIcon, Database, Github, GripVertical,
  Loader2, Download, MessageCircle, Send, Copy, Check, Key, UserX, UserPlus,
  CloudUpload, HardDrive
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { getRoomFiles, buildFileTree, readEncryptedFile, handleCreateFolder, createEncryptedFile, updateEncryptedFile, deleteEncryptedFile, renameEncryptedFile, deleteFolder } from '../function/files/create-file';
import { get } from 'lodash';
import supabase from '../supabaseClient';
import { isRoomValid } from '../function/rooms/upload-page';
import { decrypt } from '../function/login/encryption';

// Cursor colors for different users
const CURSOR_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16',
];

// Modern file type icons mapping
const fileIcons = {
  js: { icon: FileCode, color: 'text-amber-400' },
  jsx: { icon: FileCode, color: 'text-cyan-400' },
  ts: { icon: FileCode, color: 'text-blue-400' },
  tsx: { icon: FileCode, color: 'text-cyan-400' },
  py: { icon: FileCode, color: 'text-green-400' },
  java: { icon: FileCode, color: 'text-orange-400' },
  cpp: { icon: FileCode, color: 'text-blue-300' },
  c: { icon: FileCode, color: 'text-blue-300' },
  html: { icon: FileCode, color: 'text-orange-400' },
  css: { icon: FileCode, color: 'text-blue-400' },
  json: { icon: FileJson, color: 'text-yellow-400' },
  md: { icon: FileText, color: 'text-slate-400' },
  txt: { icon: FileText, color: 'text-slate-400' },
  png: { icon: ImageIcon, color: 'text-emerald-400' },
  jpg: { icon: ImageIcon, color: 'text-emerald-400' },
  svg: { icon: ImageIcon, color: 'text-emerald-400' },
  sql: { icon: Database, color: 'text-red-400' },
  default: { icon: File, color: 'text-slate-400' }
};

const getFileIcon = (filename) => {
  const ext = filename.split('.').pop();
  const iconData = fileIcons[ext] || fileIcons.default;
  const IconComponent = iconData.icon;
  return <IconComponent className={`w-4 h-4 ${iconData.color}`} />;
};

const mockUsers = [
  { id: 1, name: 'Alice Cooper', role: 'owner', online: true, avatar: '👩‍💻' },
  { id: 2, name: 'Bob Wilson', role: 'admin', online: true, avatar: '👨‍💼' },
  { id: 3, name: 'Charlie Brown', role: 'editor', online: false, avatar: '👨‍🎨' },
  { id: 4, name: 'Guest User', role: 'guest', online: true, avatar: '👤' }
];

const initialFileTree = {
  name: 'Loading',
  type: 'folder',
  isExpanded: true,
  children: []
};

// Generate unique guest number based on user ID
function generateGuestNumber(userId) {
  if (!userId) return Math.floor(Math.random() * 1000);
  let hash = 0;
  const str = userId.toString();
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash % 1000);
}

// Get user color based on their ID
function getUserColor(userId) {
  if (!userId) return CURSOR_COLORS[0];
  let hash = 0;
  const str = userId.toString();
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

// Detect platform
function getPlatform() {
  if (typeof window === 'undefined') return 'web';

  const userAgent = window.navigator.userAgent.toLowerCase();

  // Check if running in Electron (Windows/Desktop App)
  if (window.process?.type || userAgent.includes('electron')) {
    return 'windows-app';
  }

  // Check for mobile
  if (/android|iphone|ipad|ipod|mobile/i.test(userAgent)) {
    return 'mobile-app';
  }

  return 'web';
}

export default function CodeEditorPage() {
  const [roomType, setRoomType] = useState('solo');
  const [roomName, setRoomName] = useState('Project CodeSpace');
  const [roomCode, setRoomCode] = useState('');
  const [roomOwnerId, setRoomOwnerId] = useState('');
  const [roomOwnerName, setRoomOwnerName] = useState('');
  const [isEditingRoomName, setIsEditingRoomName] = useState(false);
  const [activeFile, setActiveFile] = useState(null);
  const [openTabs, setOpenTabs] = useState([]);
  const [editorContent, setEditorContent] = useState('');
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const [bottomPanelMode, setBottomPanelMode] = useState('terminal'); // 'terminal' or 'chat'
  const [terminalHeight, setTerminalHeight] = useState(200);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [users, setUsers] = useState(mockUsers);
  const [ownerOnline, setOwnerOnline] = useState(true);
  const [drawerWidth, setDrawerWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const [userRole, setUserRole] = useState('editor');
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [downloadPath, setDownloadPath] = useState('');
  const [isEditingDownloadPath, setIsEditingDownloadPath] = useState(false);

  // GitHub integration state
  const [isGitHubEnabled, setIsGitHubEnabled] = useState(false);
  const [githubRepo, setGithubRepo] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [isPushingToGitHub, setIsPushingToGitHub] = useState(false);
  const [showSaveOptions, setShowSaveOptions] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  // Collaboration state
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('');
  const [currentUserColor, setCurrentUserColor] = useState(CURSOR_COLORS[0]);
  const [remoteCursors, setRemoteCursors] = useState({});
  const [remoteSelections, setRemoteSelections] = useState({});
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [allFileContents, setAllFileContents] = useState({}); // Track all file contents

  // Modal states
  const [createFileModal, setCreateFileModal] = useState({ show: false, parentPath: [] });
  const [createFolderModal, setCreateFolderModal] = useState({ show: false, parentPath: [] });
  const [renameModal, setRenameModal] = useState({ show: false, item: null, path: [] });
  const [deleteModal, setDeleteModal] = useState({ show: false, item: null, path: [] });
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Loading states
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isRenamingItem, setIsRenamingItem] = useState(false);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [openingFiles, setOpeningFiles] = useState(new Set());

  const [fileTree, setFileTree] = useState(initialFileTree);
  const [isSaving, setIsSaving] = useState(false);

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const resizeRef = useRef(null);
  const editorContentRef = useRef("");
  const cursorDecorationsRef = useRef([]);
  const realtimeChannelRef = useRef(null);
  const isApplyingRemoteChangeRef = useRef(false);
  const activeFileRef = useRef(null);
  const pendingSaveTimeoutRef = useRef(null);
  const lastSavedContentRef = useRef({});
  const broadcastDebounceRef = useRef({});

  const [isDesktopDrawer, setIsDesktopDrawer] = useState(typeof window !== 'undefined' && window.innerWidth >= 1024);

  const roomLink = new URLSearchParams(window.location.search).get("roomId");
  const currentPlatform = getPlatform();
  const isDownloadPathSupported = currentPlatform === 'mobile-app' || currentPlatform === 'windows-app';

  const fetch = async () => {
    const roomInfo = await isRoomValid(roomLink);
    if (!roomInfo) {
      window.location.href = '/create-room';
      return false;
    }
  }

  useEffect(() => {
    const onResize = () => setIsDesktopDrawer(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Fetch room data from Supabase
  const fetchRoomData = async () => {
    try {
      const { data: roomData, error } = await supabase
        .from('rooms')
        .select('room_name, room_code, type, owner_id, file_upload_by, github_repo, github_token')
        .eq('room_link', roomLink)
        .single();

      if (error) throw error;

      if (roomData) {
        setRoomName(roomData.room_name || 'Project CodeSpace');
        setRoomCode(roomData.room_code || '');
        setRoomType(roomData.type || 'permanent');
        setRoomOwnerId(roomData.owner_id);

        // Check if GitHub is enabled
        if (roomData.file_upload_by === 'github') {
          setIsGitHubEnabled(true);
          setGithubRepo(roomData.github_repo || '');
          setGithubToken(roomData.github_token || '');
        }

        // Fetch owner name
        if (roomData.owner_id) {
          const { data, error } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", roomData.owner_id)
            .single();

          if (!error && data?.name) {
            setRoomOwnerName(data.name);
          } else {
            setRoomOwnerName("Deleted User");
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch room data:', err);
    }
  };

  // Fetch download path for current user
  const fetchDownloadPath = async (userId) => {
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const roomId = (await supabase.from("rooms").select("id").eq("room_link", roomLink).single()).data.id;

      const { data, error } = await supabase
        .from('room_members')
        .select('download_path')
        .eq('room_id', roomId)
        .eq('join_token', token)
        .single();

      if (!error && data?.download_path) {
        setDownloadPath(data.download_path);
      }
    } catch (err) {
      console.error('Failed to fetch download path:', err);
    }
  };

  // Save download path
  const saveDownloadPath = async (path) => {
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const roomId = (await supabase.from("rooms").select("id").eq("room_link", roomLink).single()).data.id;

      const { error } = await supabase
        .from('room_members')
        .update({ download_path: path })
        .eq('room_id', roomId)
        .eq('join_token', token);

      if (error) throw error;

      setDownloadPath(path);
      return { success: true };
    } catch (err) {
      console.error('Failed to save download path:', err);
      return { success: false, error: err.message };
    }
  };

  // Initialize collaboration
  useEffect(() => {
    fetch();
    verifyAccess();

    async function loadFiles() {
      try {
        const files = await getRoomFiles(roomLink);
        const tree = buildFileTree(files);
        setFileTree(tree);
      } catch (err) {
        console.error("Failed to load files:", err);
      }
    }

    if (roomLink) {
      loadFiles();
      fetchRoomData();
    }

    return () => {
      if (realtimeChannelRef.current) {
        realtimeChannelRef.current.unsubscribe();
      }
      if (pendingSaveTimeoutRef.current) {
        clearTimeout(pendingSaveTimeoutRef.current);
      }
      // Clear all broadcast debounce timers
      Object.values(broadcastDebounceRef.current).forEach(timer => clearTimeout(timer));
    };
  }, [roomLink]);

  // FIX #3: Verify access and check if user is kicked
  const verifyAccess = async () => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get("roomId");
    const token = params.get("token");

    if (!roomId || !token) {
      window.location.href = "/create-room";
      return;
    }

    const ID = (await supabase.from("rooms").select("id").eq("room_link", roomId).single()).data.id;

    const { data, error } = await supabase
      .from("room_members")
      .select("role, user_id, kicked_user")
      .eq("room_id", ID)
      .eq("join_token", token)
      .single();

    if (!data) {
      console.log("Access denied");
      window.location.href = "/create-room";
      return;
    }
    console.log(error);
    // FIX #3: Check if user is kicked
    if (data.kicked_user && data.kicked_user.kicked === true) {
      alert('You have been removed from this room.');
      window.location.href = "/create-room";
      return;
    }
    // console.log(data.role);
    setUserRole(data.role);
    setCurrentUserId(data.user_id);

    const userColor = getUserColor(data.user_id);
    setCurrentUserColor(userColor);

    let userName = null;

    if (!userName) {
      try {
        const { data: userData, error: userDataError } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", data.user_id)
          .single();

        if (!userDataError && userData?.name) {
          userName = userData.name;
        }
      } catch (err) {
        console.log("Could not fetch from user table:", err);
      }
    }

    if (!userName) {
      const guestNumber = generateGuestNumber(data.user_id);
      userName = `Guest ${guestNumber}`;
    }

    setCurrentUserName(userName);
    initializeCollaboration(data.user_id, userName, userColor, token, data.role);
    fetchDownloadPath(data.user_id);
  };

  // Initialize realtime collaboration
  const initializeCollaboration = async (
    userId,
    userName,
    userColor,
    token,
    role
  ) => {
    if (!roomLink || !userId) return;

    const channel = supabase.channel(`room:${roomLink}`, {
      config: {
        broadcast: { self: false },
        presence: { key: userId }
      }
    });

    /* -------------------- PRESENCE SYNC -------------------- */
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      console.log('Presence synced', state);
      const users = [];

      Object.values(state).forEach(presences => {
        presences.forEach(presence => {
          users.push({
            userId: presence.userId,
            userName: presence.userName,
            color: presence.color,
            activeFile: presence.activeFile ?? null,
            role: presence.role ?? 'member',
            online: true
          });
        });
      });

      setConnectedUsers(users);
    });

    channel.on('presence', { event: 'join' }, ({ newPresences }) => {
      console.log('User joined:', newPresences);
    });

    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      console.log('User left:', leftPresences);
    });

    /* -------------------- CURSOR -------------------- */
    channel.on('broadcast', { event: 'cursor' }, ({ payload }) => {
      if (payload.userId !== userId) {
        setRemoteCursors(prev => ({
          ...prev,
          [payload.userId]: {
            position: payload.position,
            userName: payload.userName,
            color: payload.color,
            fileId: payload.fileId
          }
        }));
      }
    });

    /* -------------------- SELECTION -------------------- */
    channel.on('broadcast', { event: 'selection' }, ({ payload }) => {
      if (payload.userId !== userId) {
        setRemoteSelections(prev => ({
          ...prev,
          [payload.userId]: {
            selection: payload.selection,
            color: payload.color,
            fileId: payload.fileId
          }
        }));
      }
    });

    /* -------------------- CONTENT CHANGE -------------------- */
    channel.on('broadcast', { event: 'content-change' }, ({ payload }) => {
      if (payload.userId === userId) return;

      setAllFileContents(prev => ({
        ...prev,
        [payload.fileId]: payload.content
      }));

      setOpenTabs(prev =>
        prev.map(t =>
          t.id === payload.fileId
            ? { ...t, content: payload.content, isDirty: false }
            : t
        )
      );

      if (
        payload.fileId === activeFileRef.current?.id &&
        editorRef.current &&
        !isApplyingRemoteChangeRef.current
      ) {
        const model = editorRef.current.getModel();
        if (!model) return;

        const current = model.getValue();
        if (current === payload.content) return;

        isApplyingRemoteChangeRef.current = true;

        const position = editorRef.current.getPosition();
        const scrollTop = editorRef.current.getScrollTop();

        editorRef.current.setValue(payload.content);

        if (position) editorRef.current.setPosition(position);
        editorRef.current.setScrollTop(scrollTop);

        editorContentRef.current = payload.content;
        setEditorContent(payload.content);

        setTimeout(() => {
          isApplyingRemoteChangeRef.current = false;
        }, 100);
      }
    });

    /* -------------------- FILE CONTENT REQUEST -------------------- */
    channel.on(
      'broadcast',
      { event: 'request-file-content' },
      ({ payload }) => {
        if (payload.requesterId === userId) return;

        const tab = openTabs.find(t => t.id === payload.fileId);
        if (!tab) return;

        channel.send({
          type: 'broadcast',
          event: 'file-content-response',
          payload: {
            fileId: payload.fileId,
            content: tab.content ?? '',
            responderId: userId,
            requesterId: payload.requesterId
          }
        });
      }
    );

    /* -------------------- FILE CONTENT RESPONSE -------------------- */
    channel.on(
      'broadcast',
      { event: 'file-content-response' },
      ({ payload }) => {
        if (payload.requesterId !== userId) return;

        setAllFileContents(prev => ({
          ...prev,
          [payload.fileId]: payload.content
        }));

        setOpenTabs(prev =>
          prev.map(t =>
            t.id === payload.fileId
              ? { ...t, content: payload.content, isDirty: false }
              : t
          )
        );

        if (
          activeFileRef.current?.id === payload.fileId &&
          editorRef.current
        ) {
          editorRef.current.setValue(payload.content);
          editorContentRef.current = payload.content;
          setEditorContent(payload.content);
        }
      }
    );

    /* -------------------- CHAT -------------------- */
    channel.on('broadcast', { event: 'chat-message' }, ({ payload }) => {
      if (payload.userId === userId) return;

      setChatMessages(prev => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          userId: payload.userId,
          userName: payload.userName,
          color: payload.color,
          message: payload.message,
          timestamp: new Date(payload.timestamp)
        }
      ]);

      if (bottomPanelMode !== 'chat' || !showBottomPanel) {
        setHasNewMessage(true);
      }
    });

    /* -------------------- FILE TREE -------------------- */
    ['file-created', 'file-renamed', 'file-deleted'].forEach(event => {
      channel.on('broadcast', { event }, ({ payload }) => {
        if (payload.userId !== userId) {
          loadFilesFromServer();
        }
      });
    });

    /* -------------------- KICK -------------------- */
    channel.on('broadcast', { event: 'user-kicked' }, ({ payload }) => {
      if (payload.userId === userId) {
        alert('You have been removed from this room by the owner.');
        window.location.href = '/create-room';
      }
    });

    /* -------------------- SUBSCRIBE & TRACK -------------------- */
    await channel.subscribe(async status => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          userId,
          userName,
          color: userColor,
          activeFile: null,
          role: role,
          online_at: new Date().toISOString()
        });
      }
    });

    realtimeChannelRef.current = channel;
  };


  const loadFilesFromServer = async () => {
    try {
      const files = await getRoomFiles(roomLink);
      const tree = buildFileTree(files);
      setFileTree(tree);
    } catch (err) {
      console.error("Failed to reload files:", err);
    }
  };

  // Update presence when active file changes
  useEffect(() => {
    activeFileRef.current = activeFile;

    if (realtimeChannelRef.current && currentUserId) {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const state = realtimeChannelRef.current.presenceState();
      const currentPresence = state[token]?.[0];

      if (currentPresence) {
        realtimeChannelRef.current.track({
          ...currentPresence,
          activeFile: activeFile?.id || null
        });
      }
    }
  }, [activeFile, currentUserId]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Clear new message notification when switching to chat
  useEffect(() => {
    if (bottomPanelMode === 'chat' && showBottomPanel) {
      setHasNewMessage(false);
    }
  }, [bottomPanelMode, showBottomPanel]);

  // Resizable drawer
  const drawerMinWidth = 220;
  const drawerMaxWidth = 500;

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = Math.max(drawerMinWidth, Math.min(drawerMaxWidth, e.clientX));
      setDrawerWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const toggleFolder = (path) => {
    const updateTree = (node, currentPath) => {
      if (currentPath.length === 0) {
        return { ...node, isExpanded: !node.isExpanded };
      }

      const [index, ...rest] = currentPath;

      return {
        ...node,
        children: node.children.map((child, i) =>
          i === index ? updateTree(child, rest) : child
        ),
      };
    };

    setFileTree((prev) => updateTree(prev, path));
  };

  async function readFileContent(storagePath) {
    const { data, error } = await supabase
      .storage
      .from("user-files")
      .download(storagePath);

    if (error) {
      console.error("DOWNLOAD ERROR:", error);
      throw error;
    }

    const text = await data.text();
    return decrypt(text);
  }

  // FIX #1: Improved file opening with proper content loading
  const openFile = async (fileNode, openInBackground = false) => {
    // Prevent duplicate opens
    if (openingFiles.has(fileNode.id)) {
      return;
    }

    // Check if already open
    const existingTab = openTabs.find(tab => tab.id === fileNode.id);
    if (existingTab && !openInBackground) {
      // FIX #1: Always ensure we have the latest content from server when switching tabs
      if (existingTab.content === '' || existingTab.content === undefined) {
        console.log('Tab content is empty, fetching from server');
        try {
          const content = await readEncryptedFile(fileNode.fullPath);

          setAllFileContents(prev => ({
            ...prev,
            [fileNode.id]: content
          }));

          setOpenTabs(prev => prev.map(tab =>
            tab.id === fileNode.id ? { ...tab, content, isDirty: false } : tab
          ));

          setActiveFile({
            ...existingTab,
            content
          });
          setEditorContent(content);
          editorContentRef.current = content;
          lastSavedContentRef.current[fileNode.id] = content;
        } catch (err) {
          console.error("Failed to load file content:", err);
          alert(`Failed to load file: ${err.message}`);
        }
      } else {
        setActiveFile(existingTab);
        setEditorContent(existingTab.content || '');
        editorContentRef.current = existingTab.content || '';
      }
      return;
    }

    setOpeningFiles(prev => new Set(prev).add(fileNode.id));

    if (window.innerWidth < 768) {
      setShowFileExplorer(false);
    }

    try {
      let content = '';

      // FIX #1: Always try to load from server first
      try {
        content = await readEncryptedFile(fileNode.fullPath);
        console.log('Loaded from server:', fileNode.id, content.length, 'chars');
      } catch (err) {
        console.error('Failed to load from server:', err);

        // FIX #1: Request content from other connected users
        if (realtimeChannelRef.current && currentUserId) {
          console.log('Requesting content from other users');
          realtimeChannelRef.current.send({
            type: 'broadcast',
            event: 'request-file-content',
            payload: {
              fileId: fileNode.id,
              requesterId: currentUserId
            }
          });

          // Wait a bit for response
          await new Promise(resolve => setTimeout(resolve, 500));

          // Check if we got content
          if (allFileContents[fileNode.id]) {
            content = allFileContents[fileNode.id];
            console.log('Received content from other user');
          } else {
            content = ''; // Default to empty
          }
        }
      }

      // Update cache
      setAllFileContents(prev => ({
        ...prev,
        [fileNode.id]: content
      }));

      if (existingTab) {
        setOpenTabs(prev => prev.map(tab =>
          tab.id === fileNode.id ? { ...tab, content, isDirty: false } : tab
        ));

        if (!openInBackground) {
          setActiveFile({
            id: fileNode.id,
            name: fileNode.name,
            fullPath: fileNode.fullPath,
            content,
          });
          setEditorContent(content);
          editorContentRef.current = content;
          lastSavedContentRef.current[fileNode.id] = content;
        }
        return;
      }

      const newTab = {
        id: fileNode.id,
        name: fileNode.name,
        fullPath: fileNode.fullPath,
        content,
        isDirty: false,
      };

      setOpenTabs(prev => [...prev, newTab]);

      if (!openInBackground) {
        setActiveFile(newTab);
        setEditorContent(content);
        editorContentRef.current = content;
        lastSavedContentRef.current[fileNode.id] = content;
      }
    } catch (err) {
      console.error("Open file failed:", err);
      alert(`Failed to open file: ${err.message}`);
    } finally {
      setOpeningFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileNode.id);
        return newSet;
      });
    }
  };

  const closeTab = (tabId, e) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(tab => tab.id !== tabId);
    setOpenTabs(newTabs);

    if (activeFile?.id === tabId) {
      if (newTabs.length > 0) {
        const nextTab = newTabs[newTabs.length - 1];
        setActiveFile(nextTab);
        setEditorContent(nextTab.content || '');
        editorContentRef.current = nextTab.content || '';
      } else {
        setActiveFile(null);
        setEditorContent('');
        editorContentRef.current = '';
      }
    }
  };

  const switchTab = (tab) => {
    setActiveFile(tab);
    setEditorContent(tab.content || '');
    editorContentRef.current = tab.content || '';
  };

  useEffect(() => {
    if (activeFile && editorRef.current) {
      const tab = openTabs.find(t => t.id === activeFile.id);
      if (tab && tab.content !== editorContentRef.current) {
        editorRef.current.setValue(tab.content || '');
        editorContentRef.current = tab.content || '';
      }
    }
  }, [activeFile, openTabs]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.onDidChangeCursorPosition((e) => {
      const position = {
        lineNumber: e.position.lineNumber,
        column: e.position.column
      };

      setCursorPosition({
        line: position.lineNumber,
        column: position.column,
      });

      if (realtimeChannelRef.current && currentUserId && activeFile) {
        realtimeChannelRef.current.send({
          type: 'broadcast',
          event: 'cursor',
          payload: {
            userId: currentUserId,
            userName: currentUserName,
            color: currentUserColor,
            position: position,
            fileId: activeFile.id
          }
        });
      }
    });

    editor.onDidChangeCursorSelection((e) => {
      if (realtimeChannelRef.current && currentUserId && activeFile) {
        realtimeChannelRef.current.send({
          type: 'broadcast',
          event: 'selection',
          payload: {
            userId: currentUserId,
            color: currentUserColor,
            selection: {
              startLineNumber: e.selection.startLineNumber,
              startColumn: e.selection.startColumn,
              endLineNumber: e.selection.endLineNumber,
              endColumn: e.selection.endColumn
            },
            fileId: activeFile.id
          }
        });
      }
    });
  };

  // Render remote cursors and selections for ALL files
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !activeFile) return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const decorations = [];

    // Render remote cursors for users in the same file
    Object.entries(remoteCursors).forEach(([userId, cursorData]) => {
      if (cursorData.fileId === activeFile.id && cursorData.position) {
        decorations.push({
          range: new monaco.Range(
            cursorData.position.lineNumber,
            cursorData.position.column,
            cursorData.position.lineNumber,
            cursorData.position.column
          ),
          options: {
            className: `remote-cursor-${userId}`,
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          }
        });
      }
    });

    // Render remote selections
    Object.entries(remoteSelections).forEach(([userId, selectionData]) => {
      if (selectionData.fileId === activeFile.id && selectionData.selection) {
        const sel = selectionData.selection;
        decorations.push({
          range: new monaco.Range(
            sel.startLineNumber,
            sel.startColumn,
            sel.endLineNumber,
            sel.endColumn
          ),
          options: {
            className: `remote-selection-${userId}`,
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          }
        });
      }
    });

    cursorDecorationsRef.current = editor.deltaDecorations(
      cursorDecorationsRef.current,
      decorations
    );

    const styleId = 'remote-cursor-styles';
    let styleElement = document.getElementById(styleId);

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    let css = '';

    Object.entries(remoteCursors).forEach(([userId, cursorData]) => {
      const escapedUserName = (cursorData.userName || 'User').replace(/'/g, "\\'");
      css += `
        .remote-cursor-${userId} {
          position: relative;
        }
        .remote-cursor-${userId}::before {
          content: '';
          position: absolute;
          width: 2px;
          height: 1.2em;
          background-color: ${cursorData.color};
          z-index: 1000;
          animation: cursorBlink 1s infinite;
        }
        .remote-cursor-${userId}::after {
          content: '${escapedUserName}';
          position: absolute;
          top: -20px;
          left: 2px;
          background-color: ${cursorData.color};
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 11px;
          font-weight: 500;
          white-space: nowrap;
          pointer-events: none;
          z-index: 1001;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `;
    });

    Object.entries(remoteSelections).forEach(([userId, selectionData]) => {
      css += `
        .remote-selection-${userId} {
          background-color: ${selectionData.color}33 !important;
          border: 1px solid ${selectionData.color}66;
        }
      `;
    });

    css += `
      @keyframes cursorBlink {
        0%, 49% { opacity: 1; }
        50%, 100% { opacity: 0; }
      }
    `;

    styleElement.textContent = css;

  }, [remoteCursors, remoteSelections, activeFile]);

  // FIX #1: Improved editor change handling with better debouncing
  const handleEditorChange = (value) => {
    // Don't block on remote changes
    if (isApplyingRemoteChangeRef.current) {
      return;
    }

    editorContentRef.current = value;
    setEditorContent(value);

    // Update cache
    if (activeFile) {
      setAllFileContents(prev => ({
        ...prev,
        [activeFile.id]: value
      }));
    }

    setOpenTabs(prev =>
      prev.map(t =>
        t.id === activeFile?.id
          ? { ...t, content: value, isDirty: true }
          : t
      )
    );

    // Broadcast changes with debouncing per file
    if (realtimeChannelRef.current && currentUserId && activeFile) {
      const fileId = activeFile.id;

      // Clear existing timeout for this file
      if (broadcastDebounceRef.current[fileId]) {
        clearTimeout(broadcastDebounceRef.current[fileId]);
      }

      // Set new timeout
      broadcastDebounceRef.current[fileId] = setTimeout(() => {
        realtimeChannelRef.current.send({
          type: 'broadcast',
          event: 'content-change',
          payload: {
            userId: currentUserId,
            content: value,
            fileId: fileId
          }
        });
        delete broadcastDebounceRef.current[fileId];
      }, 300);
    }
  };

  // FIX #2: Improved save with verification (offline save)
  const handleSaveOffline = async () => {
    if (!canEdit) {
      return;
    }

    const dirtyTabs = openTabs.filter(t => t.isDirty);
    if (dirtyTabs.length === 0) {
      return;
    }

    setIsSaving(true);
    setShowSaveOptions(false);

    try {
      const savePromises = dirtyTabs.map(async (tab) => {
        const content = allFileContents[tab.id] || tab.content || '';

        // Only save if content actually changed from last saved version
        if (lastSavedContentRef.current[tab.id] === content) {
          return { tabId: tab.id, success: true, skipped: true };
        }

        const result = await updateEncryptedFile(tab.fullPath, content);

        if (result.success) {
          lastSavedContentRef.current[tab.id] = content;

          // FIX #2: Verify the save by reading back
          try {
            const verifyContent = await readEncryptedFile(tab.fullPath);
            if (verifyContent !== content) {
              console.error('Save verification failed for:', tab.id);
              return { tabId: tab.id, success: false, error: 'Verification failed' };
            }
          } catch (verifyErr) {
            console.error('Save verification error:', verifyErr);
            // Continue anyway, save might have worked
          }
        }

        return { tabId: tab.id, success: result.success, error: result.error };
      });

      const results = await Promise.all(savePromises);
      const failed = results.filter(r => !r.success && !r.skipped);
      const saved = results.filter(r => r.success && !r.skipped);

      if (failed.length === 0) {
        // Mark all tabs as not dirty
        setOpenTabs(prev =>
          prev.map(t => ({ ...t, isDirty: false }))
        );

        if (saved.length > 0) {
          // Show a brief success message
          const successMsg = document.createElement('div');
          successMsg.textContent = `✓ Saved ${saved.length} file(s) offline`;
          successMsg.style.cssText = 'position:fixed;top:20px;right:20px;background:#10b981;color:white;padding:12px 20px;border-radius:8px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.3);font-size:14px;font-weight:500;';
          document.body.appendChild(successMsg);
          setTimeout(() => successMsg.remove(), 2000);
        }
      } else {
        console.error('Some files failed to save:', failed);
        alert(`⚠️ ${failed.length} file(s) failed to save:\n${failed.map(f => f.error).join('\n')}\n\nPlease try again.`);
      }

    } catch (err) {
      console.error('Failed to save:', err);
      alert(`Failed to save files: ${err.message}\n\nPlease try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  // NEW: Push to GitHub function
  const handlePushToGitHub = async () => {
    if (!isGitHubEnabled || !githubRepo || !githubToken) {
      alert('GitHub integration is not configured for this room.');
      return;
    }

    const dirtyTabs = openTabs.filter(t => t.isDirty);
    if (dirtyTabs.length === 0) {
      alert('No changes to push.');
      return;
    }

    setIsPushingToGitHub(true);
    setShowSaveOptions(false);

    try {
      // First, save offline
      await handleSaveOffline();



        let tes = "bhavneetv/fIrst"
      // Parse repo (format: owner/repo)
      const [owner, repo] = tes.split('/');
      if (!owner || !repo) {
        throw new Error('Invalid GitHub repository format. Expected: owner/repo');
      }

      // Get default branch
      const branchResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}`,
        {
          headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!branchResponse.ok) {
        throw new Error('Failed to fetch repository information');
      }

      const repoData = await branchResponse.json();
      const defaultBranch = repoData.default_branch || 'main';

      // Push each dirty file
      const pushPromises = dirtyTabs.map(async (tab) => {
        const content = allFileContents[tab.id] || tab.content || '';
        const base64Content = btoa(unescape(encodeURIComponent(content)));

        // Get current file SHA if it exists
        let sha = null;
        try {
          const fileResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${tab.fullPath}`,
            {
              headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            }
          );

          if (fileResponse.ok) {
            const fileData = await fileResponse.json();
            sha = fileData.sha;
          }
        } catch (err) {
          console.log('File does not exist yet:', tab.fullPath);
        }

        // Create or update file
        const body = {
          message: `Update ${tab.name} from CodeSpace`,
          content: base64Content,
          branch: defaultBranch
        };

        if (sha) {
          body.sha = sha;
        }

        const response = await fetch(
          `https://api.github.com/repos/bhavneetv/${repo}/contents/${tab.fullPath}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `token ${githubToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify(body)
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Failed to push ${tab.name}: ${error.message}`);
        }

        return { tabId: tab.id, success: true, name: tab.name };
      });

      const results = await Promise.all(pushPromises);
      const successful = results.filter(r => r.success);

      // Show success message
      const successMsg = document.createElement('div');
      successMsg.textContent = `✓ Pushed ${successful.length} file(s) to GitHub`;
      successMsg.style.cssText = 'position:fixed;top:20px;right:20px;background:#10b981;color:white;padding:12px 20px;border-radius:8px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.3);font-size:14px;font-weight:500;';
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);

    } catch (err) {
      console.error('Failed to push to GitHub:', err);
      alert(`Failed to push to GitHub: ${err.message}`);
    } finally {
      setIsPushingToGitHub(false);
    }
  };

  // FIX #6: Create new file with proper tree traversal and validation
  const handleCreateFile = async (fileName, extension, parentPath) => {
    setIsCreatingFile(true);
    try {
      const folderPath = resolveFolderPath(fileTree, parentPath);
      const fullFileName = `${fileName}.${extension}`;

      // FIX #6: Check for duplicate with proper null checks
      const checkDuplicate = (node, path) => {
        if (!node) {
          console.error('Node is undefined in checkDuplicate');
          return false;
        }

        if (path.length === 0) {
          return node.children?.some(child =>
            child && child.type === 'file' && child.name === fullFileName
          ) || false;
        }

        const [idx, ...rest] = path;
        if (!node.children || !node.children[idx]) {
          console.error('Invalid path in checkDuplicate');
          return false;
        }
        return checkDuplicate(node.children[idx], rest);
      };

      if (checkDuplicate(fileTree, parentPath)) {
        alert(`A file named "${fullFileName}" already exists in this location.`);
        setCreateFileModal({ show: false, parentPath: [] });
        setIsCreatingFile(false);
        return;
      }

      const result = await createEncryptedFile(
        roomLink,
        fileName,
        extension,
        false,
        folderPath,
        ""
      );

      if (result.success) {
        const newFile = {
          id: result.data.id,
          name: fullFileName,
          type: "file",
          fullPath: result.data.storage_path,
          content: "",
        };

        // FIX #6: Improved tree update with null checks
        const addFileToTree = (node, path) => {
          if (!node) {
            console.error('Node is undefined in addFileToTree');
            return fileTree; // Return original tree
          }

          if (path.length === 0) {
            return {
              ...node,
              children: [...(node.children || []), newFile],
            };
          }

          const [idx, ...rest] = path;

          if (!node.children || !node.children[idx]) {
            console.error('Invalid path in addFileToTree, adding to root');
            return {
              ...node,
              children: [...(node.children || []), newFile],
            };
          }

          return {
            ...node,
            children: node.children.map((child, i) =>
              i === idx ? addFileToTree(child, rest) : child
            ),
          };
        };

        setFileTree((prev) => addFileToTree(prev, parentPath));

        // Initialize file content in cache
        setAllFileContents(prev => ({
          ...prev,
          [newFile.id]: ""
        }));

        // Broadcast file creation
        if (realtimeChannelRef.current && currentUserId) {
          realtimeChannelRef.current.send({
            type: 'broadcast',
            event: 'file-created',
            payload: {
              userId: currentUserId,
              file: newFile
            }
          });
        }
      } else {
        console.error('Failed to create file:', result.error);
        alert(`Failed to create file: ${result.error}`);
      }
    } catch (err) {
      console.error("Error creating file:", err);
      alert(`Failed to create file: ${err.message}`);
    } finally {
      setCreateFileModal({ show: false, parentPath: [] });
      setIsCreatingFile(false);
    }
  };

  const resolveFolderPath = (tree, indexPath) => {
    if (!indexPath || indexPath.length === 0) return "";

    let current = tree;
    const parts = [];

    for (const index of indexPath) {
      if (!current?.children?.[index]) break;

      current = current.children[index];

      if (current.type === "folder") {
        parts.push(current.name);
      }
    }

    return parts.join("/");
  };

  const handleCreateFolder = async (folderName, parentPath) => {
    if (!folderName) return;

    setIsCreatingFolder(true);
    try {
      const safePath = normalizeFolderParentPath(fileTree, parentPath);

      // Check for duplicate folder
      const checkDuplicate = (node, path) => {
        if (!node) return false;

        if (path.length === 0) {
          return node.children?.some(child =>
            child && child.type === 'folder' && child.name === folderName
          ) || false;
        }
        const [idx, ...rest] = path;
        if (!node.children || !node.children[idx]) return false;
        return checkDuplicate(node.children[idx], rest);
      };

      if (checkDuplicate(fileTree, safePath)) {
        alert(`A folder named "${folderName}" already exists in this location.`);
        setCreateFolderModal({ show: false, parentPath: [] });
        setIsCreatingFolder(false);
        return;
      }

      const addFolder = (node, path) => {
        if (!node) return node;

        if (path.length === 0) {
          return {
            ...node,
            isExpanded: true,
            children: [
              ...(node.children || []),
              {
                name: folderName,
                type: "folder",
                isExpanded: true,
                children: [],
              },
            ],
          };
        }

        const [idx, ...rest] = path;

        return {
          ...node,
          children: node.children.map((child, i) =>
            i === idx ? addFolder(child, rest) : child
          ),
        };
      };

      setFileTree((prev) => addFolder(prev, safePath));

      // Broadcast folder creation
      if (realtimeChannelRef.current && currentUserId) {
        realtimeChannelRef.current.send({
          type: 'broadcast',
          event: 'file-created',
          payload: {
            userId: currentUserId,
            folder: folderName
          }
        });
      }
    } catch (err) {
      console.error('Error creating folder:', err);
      alert(`Failed to create folder: ${err.message}`);
    } finally {
      setCreateFolderModal({ show: false, parentPath: [] });
      setIsCreatingFolder(false);
    }
  };

  const normalizeFolderParentPath = (tree, path) => {
    if (!path || path.length === 0) return [];

    let current = tree;
    const normalized = [];

    for (const index of path) {
      const node = current.children?.[index];
      if (!node) break;

      if (node.type === "folder") {
        normalized.push(index);
        current = node;
      } else {
        break;
      }
    }

    return normalized;
  };

  const handleRename = async (newName) => {
    if (!renameModal.item || !newName || newName === renameModal.item.name) {
      setRenameModal({ show: false, item: null, path: [] });
      return;
    }

    setIsRenamingItem(true);
    try {
      const item = renameModal.item;

      if (item.type === 'file') {
        const parts = newName.split('.');
        const extension = parts.length > 1 ? parts.pop() : '';
        const fileName = parts.join('.');

        const result = await renameEncryptedFile(item.id, fileName, extension);

        if (result.success) {
          const renameInTree = (node, path) => {
            if (path.length === 1) {
              return {
                ...node,
                children: node.children.map((child, i) =>
                  i === path[0] && child.id === item.id
                    ? { ...child, name: newName }
                    : child
                ),
              };
            }

            const [idx, ...rest] = path;
            return {
              ...node,
              children: node.children.map((child, i) =>
                i === idx ? renameInTree(child, rest) : child
              ),
            };
          };

          setFileTree((prev) => renameInTree(prev, renameModal.path));

          setOpenTabs(prev =>
            prev.map(tab =>
              tab.id === item.id
                ? { ...tab, name: newName }
                : tab
            )
          );

          if (activeFile?.id === item.id) {
            setActiveFile(prev => ({ ...prev, name: newName }));
          }

          // Broadcast rename
          if (realtimeChannelRef.current && currentUserId) {
            realtimeChannelRef.current.send({
              type: 'broadcast',
              event: 'file-renamed',
              payload: {
                userId: currentUserId,
                fileId: item.id,
                newName: newName
              }
            });
          }
        } else {
          alert(`Failed to rename: ${result.error}`);
        }
      } else {
        const renameInTree = (node, path) => {
          if (path.length === 1) {
            return {
              ...node,
              children: node.children.map((child, i) =>
                i === path[0] && child.type === 'folder'
                  ? { ...child, name: newName }
                  : child
              ),
            };
          }

          const [idx, ...rest] = path;
          return {
            ...node,
            children: node.children.map((child, i) =>
              i === idx ? renameInTree(child, rest) : child
            ),
          };
        };

        setFileTree((prev) => renameInTree(prev, renameModal.path));

        // Broadcast rename
        if (realtimeChannelRef.current && currentUserId) {
          realtimeChannelRef.current.send({
            type: 'broadcast',
            event: 'file-renamed',
            payload: {
              userId: currentUserId,
              folderName: newName
            }
          });
        }
      }
    } catch (err) {
      console.error('Error renaming:', err);
      alert(`Failed to rename: ${err.message}`);
    } finally {
      setRenameModal({ show: false, item: null, path: [] });
      setIsRenamingItem(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.item) {
      setDeleteModal({ show: false, item: null, path: [] });
      return;
    }

    setIsDeletingItem(true);
    try {
      const item = deleteModal.item;

      if (item.type === 'file') {
        const result = await deleteEncryptedFile(item.id, item.fullPath);

        if (result.success) {
          const removeFileFromTree = (node, path) => {
            if (path.length === 0) {
              return {
                ...node,
                children: node.children.filter(child => child.id !== item.id),
              };
            }

            const [idx, ...rest] = path;
            return {
              ...node,
              children: node.children.map((child, i) =>
                i === idx ? removeFileFromTree(child, rest) : child
              ),
            };
          };

          setFileTree((prev) => removeFileFromTree(prev, deleteModal.path.slice(0, -1)));

          if (openTabs.some(tab => tab.id === item.id)) {
            const newTabs = openTabs.filter(tab => tab.id !== item.id);
            setOpenTabs(newTabs);

            if (activeFile?.id === item.id) {
              if (newTabs.length > 0) {
                const nextTab = newTabs[newTabs.length - 1];
                setActiveFile(nextTab);
                setEditorContent(nextTab.content || '');
                editorContentRef.current = nextTab.content || '';
              } else {
                setActiveFile(null);
                setEditorContent('');
                editorContentRef.current = '';
              }
            }
          }

          // Broadcast deletion
          if (realtimeChannelRef.current && currentUserId) {
            realtimeChannelRef.current.send({
              type: 'broadcast',
              event: 'file-deleted',
              payload: {
                userId: currentUserId,
                fileId: item.id
              }
            });
          }
        } else {
          alert(`Failed to delete: ${result.error}`);
        }
      } else {
        // Folder deletion logic here
      }
    } catch (err) {
      console.error('Error deleting:', err);
      alert(`Failed to delete: ${err.message}`);
    } finally {
      setDeleteModal({ show: false, item: null, path: [] });
      setIsDeletingItem(false);
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const newMessage = {
      id: Date.now(),
      userId: currentUserId,
      userName: currentUserName,
      color: currentUserColor,
      message: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, newMessage]);

    // Broadcast message
    if (realtimeChannelRef.current && currentUserId) {
      realtimeChannelRef.current.send({
        type: 'broadcast',
        event: 'chat-message',
        payload: {
          userId: currentUserId,
          userName: currentUserName,
          color: currentUserColor,
          message: chatInput,
          timestamp: new Date().toISOString()
        }
      });
    }

    setChatInput('');
  };

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // FIX #3: Improved kick user with proper database update
  const handleKickUser = async (userId) => {
    if (!isOwner) return;

    try {
      const roomId = (await supabase.from("rooms").select("id").eq("room_link", roomLink).single()).data.id;

      // FIX #3: Update kick_user column with proper JSONB structure
      const { error } = await supabase
        .from('room_members')
        .update({
          kicked_user: { kicked: true, kicked_at: new Date().toISOString() }
        })
        .eq('room_id', roomId)
        .eq('user_id', userId);

      if (error) {
        console.error('Kick user database error:', error);
        throw error;
      }

      // Broadcast kick event
      if (realtimeChannelRef.current) {
        realtimeChannelRef.current.send({
          type: 'broadcast',
          event: 'user-kicked',
          payload: { userId }
        });
      }

      // Remove from connected users list
      setConnectedUsers(prev => prev.filter(u => u.userId !== userId));

      alert('User has been removed from the room.');
    } catch (err) {
      console.error('Failed to kick user:', err);
      alert(`Failed to remove user: ${err.message}`);
    }
  };

  // FIX #4: Improved make admin with proper error handling and refresh
  const handleMakeAdmin = async (userId) => {
    if (!isOwner) return;

    try {
      const roomId = (await supabase.from("rooms").select("id").eq("room_link", roomLink).single()).data.id;

      const { error } = await supabase
        .from('room_members')
        .update({ role: 'admin' })
        .eq('room_id', roomId)
        .eq('user_id', userId);

      if (error) {
        console.error('Make admin database error:', error);
        throw error;
      }

      // FIX #4: Verify the update
      const { data: verifyData, error: verifyError } = await supabase
        .from('room_members')
        .select('role')
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .single();

      if (verifyError || verifyData.role !== 'admin') {
        throw new Error('Failed to verify admin promotion');
      }

      // Update connected users
      setConnectedUsers(prev => prev.map(u =>
        u.userId === userId ? { ...u, role: 'admin' } : u
      ));

      alert('User has been promoted to admin successfully.');

      // Reload files to get fresh data
      await loadFilesFromServer();
    } catch (err) {
      console.error('Failed to make admin:', err);
      alert(`Failed to promote user: ${err.message}`);
    }
  };

  const handleChangePassword = async (newPassword) => {
    if (!isOwner) return;

    try {
      const { error } = await supabase
        .from('rooms')
        .update({ room_code: newPassword })
        .eq('room_link', roomLink);

      if (error) throw error;

      setRoomCode(newPassword);
      alert('Room password has been changed successfully.');
    } catch (err) {
      console.error('Failed to change password:', err);
      alert(`Failed to change password: ${err.message}`);
    }
  };

  const handleRun = () => {
    console.log('Running code...');
  };

  const handleDeleteRoom = () => {
    console.log('Deleting room...');
  };

  const isOwner = userRole === 'owner' || currentUserId === roomOwnerId;
  const isAdmin = userRole === 'admin' || isOwner;
  const canEdit = isOwner || userRole === 'editor' || userRole === 'admin';
  const onlineCount = connectedUsers.length || users.filter(u => u.online).length;
  const dirtyCount = openTabs.filter(t => t.isDirty).length;

  const usersInCurrentFile = connectedUsers.filter(
    user => user.activeFile === activeFile?.id && user.userId !== currentUserId
  );

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 font-['Inter',_sans-serif]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
        
        .glass {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(71, 85, 105, 0.3);
        }
        
        .glass-strong {
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(71, 85, 105, 0.3);
        }

        .monaco-editor-background {
          background-color: #1e293b !important;
        }

        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.3);
          border-radius: 5px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.5);
          border-radius: 5px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.7);
        }

        .tab-active {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1));
          border-bottom: 2px solid #10b981;
        }

        .tab-inactive {
          background: transparent;
          border-bottom: 2px solid transparent;
        }

        .tab-inactive:hover {
          background: rgba(71, 85, 105, 0.3);
        }

        .modern-button {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .modern-button:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .modern-button:active:not(:disabled) {
          transform: scale(0.98);
        }

        .modern-button::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }

        .modern-button:hover::before {
          width: 300px;
          height: 300px;
        }

        .primary-button {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
        }

        .primary-button:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.6);
        }

        .danger-button {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
        }

        .danger-button:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(239, 68, 68, 0.6);
        }

        @keyframes cursorBlink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .pulse-animation {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {/* Header */}
      <header className="glass-strong border-b border-slate-700/60 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <button
            onClick={() => setShowFileExplorer(!showFileExplorer)}
            className="lg:hidden p-2 hover:bg-slate-700/50 rounded-lg transition-all modern-button flex-shrink-0"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="hidden md:flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              {isEditingRoomName ? (
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  onBlur={() => setIsEditingRoomName(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingRoomName(false)}
                  className="bg-slate-800/60 border border-slate-600 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-emerald-500/50 transition-all"
                  autoFocus
                  disabled={!isOwner}
                />
              ) : (
                <h1 className="text-sm font-semibold text-slate-200 truncate">
                  {roomName}
                  {isOwner && (
                    <button
                      onClick={() => setIsEditingRoomName(true)}
                      className="ml-1.5 text-slate-500 hover:text-slate-300 transition-colors inline-flex"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </h1>
              )}
            </div>
          </div>

          {usersInCurrentFile.length > 0 && (
            <div className="hidden lg:flex items-center gap-1 px-2 py-1 glass rounded-full">
              {usersInCurrentFile.slice(0, 3).map((user, idx) => (
                <div
                  key={user.userId}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white ring-2 ring-slate-800"
                  style={{
                    backgroundColor: user.color,
                    marginLeft: idx > 0 ? '-8px' : '0',
                    zIndex: 10 - idx
                  }}
                  title={user.userName}
                >
                  {user.userName.charAt(0).toUpperCase()}
                </div>
              ))}
              {usersInCurrentFile.length > 3 && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold bg-slate-700 text-slate-300 -ml-2 ring-2 ring-slate-800">
                  +{usersInCurrentFile.length - 3}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/15 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/30">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full pulse-animation"></div>
            <span>{onlineCount} online</span>
          </div>

          <button
            onClick={handleRun}
            disabled={!canEdit}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all modern-button ${canEdit
              ? 'primary-button text-white'
              : 'bg-slate-700/50 text-slate-500 cursor-not-allowed opacity-60'
              }`}
          >
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Run</span>
          </button>

          {/* Save button - shows dropdown after initial save */}
          <div className="relative">
            {!showSaveOptions ? (
              <button
                onClick={async () => {
                  // First save the files
                  await handleSaveOffline();
                  // Then show the options
                  setShowSaveOptions(true);
                }}
                disabled={!canEdit || (isSaving || isPushingToGitHub) || dirtyCount === 0}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all modern-button relative ${canEdit && !(isSaving || isPushingToGitHub) && dirtyCount > 0
                  ? 'primary-button text-white'
                  : 'bg-slate-700/50 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                title={
                  isSaving ? 'Saving...' :
                    isPushingToGitHub ? 'Pushing to GitHub...' :
                      dirtyCount > 0 ? `Save ${dirtyCount} file(s)` :
                        'No changes to save'
                }
              >
                {isSaving || isPushingToGitHub ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span className="hidden sm:inline text-xs sm:text-sm font-medium">
                  {isSaving ? 'Saving...' :
                    isPushingToGitHub ? 'Pushing...' :
                      dirtyCount > 0 ? `Save (${dirtyCount})` :
                        'Save'}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveOffline}
                  disabled={isSaving || dirtyCount === 0}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all modern-button ${isSaving || dirtyCount === 0
                      ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed opacity-60'
                      : 'primary-button text-white'
                    }`}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <HardDrive className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline text-xs font-medium">
                    {isSaving ? 'Saving...' : 'Save Offline'}
                  </span>
                </button>

                {isGitHubEnabled && (
                  <button
                    onClick={handlePushToGitHub}
                    disabled={isPushingToGitHub || dirtyCount === 0}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all modern-button ${isPushingToGitHub || dirtyCount === 0
                        ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed opacity-60'
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                      }`}
                  >
                    {isPushingToGitHub ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Github className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline text-xs font-medium">
                      {isPushingToGitHub ? 'Pushing...' : 'Push to GitHub'}
                    </span>
                  </button>
                )}

                <button
                  onClick={() => setShowSaveOptions(false)}
                  className="p-1.5 hover:bg-slate-700/50 rounded transition-all"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowUsersModal(true)}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-all modern-button relative"
            title="Users"
          >
            <Users className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 bg-emerald-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-semibold px-1 md:hidden">
              {onlineCount}
            </span>
          </button>

          <button
            onClick={() => setShowSettingsPanel(true)}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-all modern-button"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-48px)]">
        {/* FIX #5: File Explorer Sidebar with proper mobile layout */}
        <AnimatePresence>
          {showFileExplorer && (
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="glass-strong border-r border-slate-700/60 flex absolute lg:relative z-40 lg:z-0 flex-shrink-0 shadow-2xl"
              style={{
                // FIX #5: Mobile uses 80% width, desktop uses resizable width
                width: typeof window !== 'undefined' && window.innerWidth >= 1024
                  ? `${Math.min(drawerMaxWidth, Math.max(drawerMinWidth, drawerWidth))}px`
                  : '80vw',
                height: '100%'
              }}
            >
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <div className="p-2.5 sm:p-3 border-b border-slate-700/60 flex items-center justify-between flex-shrink-0">
                  <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Folder className="w-3.5 h-3.5 text-emerald-500" />
                    Explorer
                  </h2>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCreateFileModal({ show: true, parentPath: [] })}
                      disabled={!canEdit || isCreatingFile}
                      className={`p-1.5 rounded-lg transition-all modern-button ${canEdit && !isCreatingFile ? 'hover:bg-emerald-500/10 text-emerald-400' : 'text-slate-500 cursor-not-allowed opacity-50'
                        }`}
                      title="New File"
                    >
                      {isCreatingFile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => setCreateFolderModal({ show: true, parentPath: [] })}
                      disabled={!canEdit || isCreatingFolder}
                      className={`p-1.5 rounded-lg transition-all modern-button ${canEdit && !isCreatingFolder ? 'hover:bg-slate-600/30 text-slate-300' : 'text-slate-500 cursor-not-allowed opacity-50'
                        }`}
                      title="New Folder"
                    >
                      {isCreatingFolder ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderPlus className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 p-2">
                  <FileTreeNode
                    node={fileTree}
                    path={[]}
                    onToggle={toggleFolder}
                    onOpenFile={openFile}
                    activeFile={activeFile}
                    onRename={(item, path) => setRenameModal({ show: true, item, path })}
                    onDelete={(item, path) => setDeleteModal({ show: true, item, path })}
                    onCreateFile={(path) => setCreateFileModal({ show: true, parentPath: path })}
                    onCreateFolder={(path) => setCreateFolderModal({ show: true, parentPath: path })}
                    canEdit={canEdit}
                    openingFiles={openingFiles}
                  />
                </div>
              </div>

              <div
                ref={resizeRef}
                className="hidden lg:block w-1 flex-shrink-0 hover:w-1.5 bg-transparent hover:bg-emerald-500/50 cursor-col-resize transition-all"
                onMouseDown={() => setIsResizing(true)}
              >
                <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <GripVertical className="w-3 h-3 text-emerald-500" />
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {openTabs.length > 0 && (
            <div className="glass border-b border-slate-700/60 flex items-center overflow-x-auto min-h-0">
              {openTabs.map((tab) => (
                <div
                  key={tab.id}
                  onClick={() => switchTab(tab)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 cursor-pointer transition-all border-r border-slate-700/40 min-w-0 ${activeFile?.id === tab.id ? 'tab-active' : 'tab-inactive'
                    }`}
                >
                  {getFileIcon(tab.name)}
                  <span className={`text-xs flex-1 truncate max-w-[120px] sm:max-w-none ${activeFile?.id === tab.id ? 'font-semibold' : 'font-medium'}`}>
                    {tab.name}
                  </span>
                  {tab.isDirty && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 pulse-animation" title="Unsaved changes" />
                  )}
                  <button
                    onClick={(e) => closeTab(tab.id, e)}
                    className="p-1 hover:bg-slate-600/50 rounded transition-all modern-button flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex-1 relative bg-slate-900 min-h-0">
            {activeFile ? (
              <Editor
                height="100%"
                defaultLanguage={activeFile.name.split('.').pop()}
                value={editorContent}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  lineNumbers: 'on',
                  renderWhitespace: 'selection',
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  padding: { top: 16, bottom: 16 },
                  readOnly: !canEdit,
                  wordWrap: 'on',
                  automaticLayout: true,
                  fontLigatures: true,
                  lineHeight: 22,
                  letterSpacing: 0.3,
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 p-4">
                <div className="text-center max-w-xs">
                  <div className="mb-4">
                    <div className="w-16 h-16 mx-auto bg-slate-800/60 rounded-lg flex items-center justify-center border border-slate-700/60">
                      <File className="w-8 h-8 text-slate-500" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-400">No file selected</p>
                  <p className="text-xs mt-2 text-slate-600">
                    Open a file from the explorer to start editing
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="glass-strong border-t border-slate-700/60 px-3 sm:px-4 py-1.5 flex items-center justify-between text-xs gap-2 flex-shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <span className="font-mono text-slate-500 truncate">Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
              {activeFile && (
                <span className="px-2 py-0.5 bg-slate-700/50 text-slate-400 rounded font-medium border border-slate-600/50 flex-shrink-0">
                  {activeFile.name.split('.').pop().toUpperCase()}
                </span>
              )}
              {currentUserName && (
                <span className="px-2 py-0.5 rounded font-medium flex-shrink-0" style={{ backgroundColor: `${currentUserColor}20`, color: currentUserColor, border: `1px solid ${currentUserColor}40` }}>
                  {currentUserName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setBottomPanelMode('terminal');
                  setShowBottomPanel(true);
                }}
                className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-lg transition-all modern-button flex-shrink-0 ${bottomPanelMode === 'terminal' && showBottomPanel ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-slate-700/50'
                  }`}
              >
                <TerminalIcon className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-medium hidden sm:inline">Terminal</span>
              </button>
              <button
                onClick={() => {
                  setBottomPanelMode('chat');
                  setShowBottomPanel(true);
                  setHasNewMessage(false);
                }}
                className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-lg transition-all modern-button flex-shrink-0 relative ${bottomPanelMode === 'chat' && showBottomPanel ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-slate-700/50'
                  }`}
              >
                <MessageCircle className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-medium hidden sm:inline">Chat</span>
                {hasNewMessage && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full pulse-animation"></span>
                )}
              </button>
            </div>
          </div>

          {/* Bottom Panel - Terminal/Chat */}
          <AnimatePresence>
            {showBottomPanel && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: terminalHeight }}
                exit={{ height: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="glass-strong border-t border-slate-700/60 flex flex-col overflow-hidden"
              >
                <div className="px-3 sm:px-4 py-2 border-b border-slate-700/60 flex items-center justify-between bg-slate-900/50">
                  <div className="flex items-center gap-2">
                    {bottomPanelMode === 'terminal' ? (
                      <>
                        <TerminalIcon className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-semibold text-slate-300">Terminal</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-semibold text-slate-300">Chat</span>
                        <span className="text-xs text-slate-500">({chatMessages.length})</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setTerminalHeight(terminalHeight === 200 ? 400 : 200)}
                      className="p-1.5 hover:bg-slate-700/50 rounded transition-all modern-button"
                      title={terminalHeight === 200 ? "Maximize" : "Minimize"}
                    >
                      {terminalHeight === 200 ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setShowBottomPanel(false)}
                      className="p-1.5 hover:bg-slate-700/50 rounded transition-all modern-button"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden">
                  {bottomPanelMode === 'terminal' ? (
                    <div className="h-full p-4 font-mono text-sm text-slate-300 overflow-y-auto bg-slate-900/30">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <span>$</span>
                        <span className="text-slate-400">Terminal output will appear here...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col">
                      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                        {chatMessages.map((msg) => (
                          <div key={msg.id} className="flex gap-2 sm:gap-3">
                            <div
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold text-white flex-shrink-0"
                              style={{ backgroundColor: msg.color }}
                            >
                              {msg.userName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2">
                                <span className="font-semibold text-slate-200 text-sm">{msg.userName}</span>
                                <span className="text-xs text-slate-500">
                                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-sm text-slate-300 mt-0.5 break-words">{msg.message}</p>
                            </div>
                          </div>
                        ))}
                        <div ref={chatEndRef} />
                      </div>

                      <div className="p-3 sm:p-4 border-t border-slate-700/60 bg-slate-900/50">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type a message..."
                            className="flex-1 bg-slate-800/60 border border-slate-600 rounded-lg px-3 sm:px-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                          />
                          <button
                            onClick={handleSendMessage}
                            disabled={!chatInput.trim()}
                            className="px-3 sm:px-4 py-2 primary-button rounded-lg transition-all modern-button disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Users Modal */}
      <AnimatePresence>
        {showUsersModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowUsersModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
            >
              <div className="p-4 sm:p-6 border-b border-slate-700/60">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-3">
                    <Users className="w-6 h-6 text-emerald-500" />
                    Connected Users
                  </h2>
                  <button
                    onClick={() => setShowUsersModal(false)}
                    className="p-2 hover:bg-slate-700/50 rounded-lg transition-all modern-button"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[60vh] p-4 sm:p-6">
                <div className="space-y-3">
                  {connectedUsers.map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center justify-between p-3 sm:p-4 glass rounded-lg hover:bg-slate-700/30 transition-all"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-base sm:text-lg font-semibold text-white flex-shrink-0"
                          style={{ backgroundColor: user.color }}
                        >
                          {user.userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-200 truncate text-sm sm:text-base">{user.userName}</h3>
                            {user.role === 'owner' && <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
                            {user.role === 'admin' && <Shield className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                          </div>
                          <p className="text-xs sm:text-sm text-slate-500 capitalize">{user.role}</p>
                        </div>
                      </div>

                      {isOwner && user.userId !== currentUserId && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {user.role !== 'admin' && user.role !== 'owner' && (
                            <button
                              onClick={() => handleMakeAdmin(user.userId)}
                              className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-all modern-button"
                              title="Make Admin"
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleKickUser(user.userId)}
                            className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-all modern-button"
                            title="Kick User"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettingsPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowSettingsPanel(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
            >
              <div className="p-4 sm:p-6 border-b border-slate-700/60">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-3">
                    <Settings className="w-6 h-6 text-emerald-500" />
                    Room Settings
                  </h2>
                  <button
                    onClick={() => setShowSettingsPanel(false)}
                    className="p-2 hover:bg-slate-700/50 rounded-lg transition-all modern-button"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[60vh] p-4 sm:p-6 space-y-6">
                {/* Room Info */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Room Information</h3>
                  <div className="glass p-4 rounded-lg space-y-3">
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">Room Name</label>
                      <p className="text-sm font-medium text-slate-200">{roomName}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">Owner</label>
                      <p className="text-sm font-medium text-slate-200">{roomOwnerName || 'Unknown'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">Room Type</label>
                      <p className="text-sm font-medium text-slate-200 capitalize">{roomType}</p>
                    </div>
                  </div>
                </div>

                {/* Room Code */}
                {roomCode && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Room Code</h3>
                    <div className="glass p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={roomCode}
                          readOnly
                          className="flex-1 bg-slate-800/60 border border-slate-600 rounded-lg px-3 py-2 text-sm font-mono"
                        />
                        <button
                          onClick={handleCopyRoomCode}
                          className="p-2 hover:bg-slate-700/50 rounded-lg transition-all modern-button"
                          title="Copy Code"
                        >
                          {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                        {isOwner && (
                          <button
                            onClick={() => setChangePasswordModal(true)}
                            className="p-2 hover:bg-slate-700/50 rounded-lg transition-all modern-button"
                            title="Change Password"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Download Path (Mobile/Desktop App) */}
                {isDownloadPathSupported && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Download Path</h3>
                    <div className="glass p-4 rounded-lg">
                      {isEditingDownloadPath ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={downloadPath}
                            onChange={(e) => setDownloadPath(e.target.value)}
                            placeholder="/path/to/downloads"
                            className="w-full bg-slate-800/60 border border-slate-600 rounded-lg px-3 py-2 text-sm"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                const result = await saveDownloadPath(downloadPath);
                                if (result.success) {
                                  setIsEditingDownloadPath(false);
                                } else {
                                  alert('Failed to save download path');
                                }
                              }}
                              className="px-3 py-1.5 primary-button rounded-lg text-sm modern-button"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setIsEditingDownloadPath(false)}
                              className="px-3 py-1.5 bg-slate-700/50 rounded-lg text-sm modern-button"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-mono text-slate-300">{downloadPath || 'Not set'}</p>
                          <button
                            onClick={() => setIsEditingDownloadPath(true)}
                            className="p-2 hover:bg-slate-700/50 rounded-lg transition-all modern-button"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* GitHub Integration */}
                {isGitHubEnabled && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Github className="w-4 h-4" />
                      GitHub Integration
                    </h3>
                    <div className="glass p-4 rounded-lg space-y-3">
                      <div>
                        <label className="text-xs text-slate-500 block mb-1">Repository</label>
                        <p className="text-sm font-medium text-slate-200">{githubRepo}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-emerald-400">
                        <Check className="w-4 h-4" />
                        <span>Connected</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Danger Zone */}
                {isOwner && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Danger Zone
                    </h3>
                    <div className="glass p-4 rounded-lg border-red-500/30">
                      <button
                        onClick={handleDeleteRoom}
                        className="w-full px-4 py-2 danger-button rounded-lg text-sm font-medium modern-button"
                      >
                        Delete Room
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create File Modal */}
      <AnimatePresence>
        {createFileModal.show && (
          <CreateFileModal
            onClose={() => setCreateFileModal({ show: false, parentPath: [] })}
            onCreate={handleCreateFile}
            parentPath={createFileModal.parentPath}
            isCreating={isCreatingFile}
          />
        )}
      </AnimatePresence>

      {/* Create Folder Modal */}
      <AnimatePresence>
        {createFolderModal.show && (
          <CreateFolderModal
            onClose={() => setCreateFolderModal({ show: false, parentPath: [] })}
            onCreate={handleCreateFolder}
            parentPath={createFolderModal.parentPath}
            isCreating={isCreatingFolder}
          />
        )}
      </AnimatePresence>

      {/* Rename Modal */}
      <AnimatePresence>
        {renameModal.show && (
          <RenameModal
            item={renameModal.item}
            onClose={() => setRenameModal({ show: false, item: null, path: [] })}
            onRename={handleRename}
            isRenaming={isRenamingItem}
          />
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteModal.show && (
          <DeleteModal
            item={deleteModal.item}
            onClose={() => setDeleteModal({ show: false, item: null, path: [] })}
            onDelete={handleDelete}
            isDeleting={isDeletingItem}
          />
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {changePasswordModal && (
          <ChangePasswordModal
            onClose={() => setChangePasswordModal(false)}
            onSave={handleChangePassword}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// File Tree Node Component
function FileTreeNode({ node, path, onToggle, onOpenFile, activeFile, onRename, onDelete, onCreateFile, onCreateFolder, canEdit, openingFiles }) {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const isLoading = node.type === 'file' && openingFiles.has(node.id);

  if (node.type === 'folder') {
    return (
      <div>
        <div
          className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-700/30 rounded-lg cursor-pointer transition-all group"
          onClick={() => onToggle(path)}
          onContextMenu={handleContextMenu}
        >
          {node.isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
          )}
          <Folder className={`w-4 h-4 flex-shrink-0 ${node.isExpanded ? 'text-emerald-500' : 'text-slate-500'}`} />
          <span className="text-sm text-slate-300 truncate flex-1">{node.name}</span>
          {canEdit && (
            <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateFile(path);
                }}
                className="p-1 hover:bg-emerald-500/10 text-emerald-400 rounded transition-all"
                title="New File"
              >
                <Plus className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateFolder(path);
                }}
                className="p-1 hover:bg-slate-600/30 text-slate-400 rounded transition-all"
                title="New Folder"
              >
                <FolderPlus className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
        <AnimatePresence>
          {node.isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="ml-4 border-l border-slate-700/40 pl-2 overflow-hidden"
            >
              {node.children?.map((child, i) => (
                <FileTreeNode
                  key={child.id || `${child.name}-${i}`}
                  node={child}
                  path={[...path, i]}
                  onToggle={onToggle}
                  onOpenFile={onOpenFile}
                  activeFile={activeFile}
                  onRename={onRename}
                  onDelete={onDelete}
                  onCreateFile={onCreateFile}
                  onCreateFolder={onCreateFolder}
                  canEdit={canEdit}
                  openingFiles={openingFiles}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {showContextMenu && canEdit && (
          <ContextMenu
            x={contextMenuPos.x}
            y={contextMenuPos.y}
            onClose={() => setShowContextMenu(false)}
            items={[
              { label: 'New File', icon: Plus, onClick: () => onCreateFile(path) },
              { label: 'New Folder', icon: FolderPlus, onClick: () => onCreateFolder(path) },
              { label: 'Rename', icon: Edit2, onClick: () => onRename(node, path) },
              { label: 'Delete', icon: Trash2, onClick: () => onDelete(node, path), danger: true },
            ]}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-2 py-1.5 hover:bg-slate-700/30 rounded-lg cursor-pointer transition-all group ${activeFile?.id === node.id ? 'bg-emerald-500/10 text-emerald-400' : ''
          }`}
        onClick={() => onOpenFile(node)}
        onContextMenu={handleContextMenu}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-emerald-500 flex-shrink-0" />
        ) : (
          getFileIcon(node.name)
        )}
        <span className="text-sm truncate flex-1">{node.name}</span>
        {canEdit && (
          <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRename(node, path);
              }}
              className="p-1 hover:bg-slate-600/30 text-slate-400 rounded transition-all"
              title="Rename"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(node, path);
              }}
              className="p-1 hover:bg-red-500/10 text-red-400 rounded transition-all"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {showContextMenu && canEdit && (
        <ContextMenu
          x={contextMenuPos.x}
          y={contextMenuPos.y}
          onClose={() => setShowContextMenu(false)}
          items={[
            { label: 'Rename', icon: Edit2, onClick: () => onRename(node, path) },
            { label: 'Delete', icon: Trash2, onClick: () => onDelete(node, path), danger: true },
          ]}
        />
      )}
    </div>
  );
}

// Context Menu Component
function ContextMenu({ x, y, onClose, items }) {
  useEffect(() => {
    const handleClick = () => onClose();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{ left: x, top: y }}
      className="fixed glass-strong rounded-lg shadow-2xl border border-slate-600/50 py-1 z-50 min-w-[180px]"
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => {
            item.onClick();
            onClose();
          }}
          className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-700/50 transition-colors text-left ${item.danger ? 'text-red-400' : 'text-slate-200'
            }`}
        >
          <item.icon className="w-4 h-4" />
          <span>{item.label}</span>
        </button>
      ))}
    </motion.div>
  );
}

// Create File Modal
function CreateFileModal({ onClose, onCreate, parentPath, isCreating }) {
  const [fileName, setFileName] = useState('');
  const [extension, setExtension] = useState('txt');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (fileName.trim()) {
      onCreate(fileName.trim(), extension, parentPath);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong rounded-2xl p-6 max-w-md w-full shadow-2xl"
      >
        <h2 className="text-xl font-bold text-slate-100 mb-4">Create New File</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 block mb-2">File Name</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Enter file name"
              className="w-full bg-slate-800/60 border border-slate-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
              autoFocus
              disabled={isCreating}
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-2">Extension</label>
            <select
              value={extension}
              onChange={(e) => setExtension(e.target.value)}
              className="w-full bg-slate-800/60 border border-slate-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
              disabled={isCreating}
            >
              <option value="txt">txt</option>
              <option value="js">js</option>
              <option value="jsx">jsx</option>
              <option value="ts">ts</option>
              <option value="tsx">tsx</option>
              <option value="py">py</option>
              <option value="java">java</option>
              <option value="cpp">cpp</option>
              <option value="c">c</option>
              <option value="html">html</option>
              <option value="css">css</option>
              <option value="json">json</option>
              <option value="md">md</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={!fileName.trim() || isCreating}
              className="flex-1 px-4 py-2 primary-button rounded-lg text-sm font-medium modern-button disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="px-4 py-2 bg-slate-700/50 rounded-lg text-sm font-medium modern-button disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Create Folder Modal
function CreateFolderModal({ onClose, onCreate, parentPath, isCreating }) {
  const [folderName, setFolderName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (folderName.trim()) {
      onCreate(folderName.trim(), parentPath);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong rounded-2xl p-6 max-w-md w-full shadow-2xl"
      >
        <h2 className="text-xl font-bold text-slate-100 mb-4">Create New Folder</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 block mb-2">Folder Name</label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Enter folder name"
              className="w-full bg-slate-800/60 border border-slate-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
              autoFocus
              disabled={isCreating}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={!folderName.trim() || isCreating}
              className="flex-1 px-4 py-2 primary-button rounded-lg text-sm font-medium modern-button disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="px-4 py-2 bg-slate-700/50 rounded-lg text-sm font-medium modern-button disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Rename Modal
function RenameModal({ item, onClose, onRename, isRenaming }) {
  const [newName, setNewName] = useState(item?.name || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newName.trim() && newName !== item.name) {
      onRename(newName.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong rounded-2xl p-6 max-w-md w-full shadow-2xl"
      >
        <h2 className="text-xl font-bold text-slate-100 mb-4">Rename {item?.type === 'folder' ? 'Folder' : 'File'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 block mb-2">New Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-slate-800/60 border border-slate-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
              autoFocus
              disabled={isRenaming}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={!newName.trim() || newName === item?.name || isRenaming}
              className="flex-1 px-4 py-2 primary-button rounded-lg text-sm font-medium modern-button disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isRenaming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Renaming...
                </>
              ) : (
                'Rename'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isRenaming}
              className="px-4 py-2 bg-slate-700/50 rounded-lg text-sm font-medium modern-button disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Delete Modal
function DeleteModal({ item, onClose, onDelete, isDeleting }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong rounded-2xl p-6 max-w-md w-full shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Delete {item?.type === 'folder' ? 'Folder' : 'File'}?</h2>
        </div>
        <p className="text-sm text-slate-400 mb-6">
          Are you sure you want to delete <span className="font-semibold text-slate-200">"{item?.name}"</span>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 danger-button rounded-lg text-sm font-medium modern-button disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-slate-700/50 rounded-lg text-sm font-medium modern-button disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Change Password Modal
function ChangePasswordModal({ onClose, onSave }) {
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPassword.trim()) {
      onSave(newPassword.trim());
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong rounded-2xl p-6 max-w-md w-full shadow-2xl"
      >
        <h2 className="text-xl font-bold text-slate-100 mb-4">Change Room Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 block mb-2">New Password</label>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full bg-slate-800/60 border border-slate-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={!newPassword.trim()}
              className="flex-1 px-4 py-2 primary-button rounded-lg text-sm font-medium modern-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Change Password
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700/50 rounded-lg text-sm font-medium modern-button"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}