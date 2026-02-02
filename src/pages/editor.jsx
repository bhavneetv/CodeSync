import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Save, Users, Settings, Plus, FolderPlus, Edit2, Trash2,
  ChevronRight, ChevronDown, File, Folder, X, Menu, Terminal as TerminalIcon,
  Maximize2, Minimize2, AlertTriangle, Crown, Shield, LogOut,
  FileCode, FileJson, FileText, Image as ImageIcon, Database, Github, GripVertical,
  Loader2, Download, MessageCircle, Send, Copy, Check
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

export default function CodeEditorPage() {
  const [roomType, setRoomType] = useState('solo');
  const [roomName, setRoomName] = useState('Project CodeSpace');
  const [roomCode, setRoomCode] = useState('');
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
  const [copiedCode, setCopiedCode] = useState(false);

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

  const [isDesktopDrawer, setIsDesktopDrawer] = useState(typeof window !== 'undefined' && window.innerWidth >= 1024);

  const roomLink = new URLSearchParams(window.location.search).get("roomId");

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
        .select('room_name, room_code,type, owner_id')
        .eq('room_link', roomLink)
        .single();

      if (error) throw error;

      if (roomData) {
        setRoomName(roomData.room_name || 'Project CodeSpace');
        setRoomCode(roomData.room_code || '');
        setRoomType(roomData.type || 'permanent');

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
    };
  }, [roomLink]);

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
      .select("role, user_id")
      .eq("room_id", ID)
      .eq("join_token", token)
      .single();

    if (!data) {
      console.log("Access denied");
      window.location.href = "/create-room";
      return;
    }

    setUserRole("editor");
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

        // console.log("userDataError", userDataError);
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
    initializeCollaboration(data.user_id, userName, userColor, token);
  };

  // Initialize realtime collaboration
  const initializeCollaboration = async (userId, userName, userColor, token) => {
    if (!roomLink || !userId) return;

    const channel = supabase.channel(`room:${roomLink}`, {
      config: {
        broadcast: { self: false },
        presence: { key: token }
      }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = [];

        Object.keys(state).forEach(key => {
          const presences = state[key];
          presences.forEach(presence => {
            users.push({
              userId: presence.userId,
              userName: presence.userName,
              color: presence.color,
              activeFile: presence.activeFile
            });
          });
        });

        setConnectedUsers(users);
        // console.log('[Collab] Connected users:', users.length);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // console.log('[Collab] User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // console.log('[Collab] User left:', leftPresences);
      });

    // Listen for cursor movements
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

    // Listen for selections
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

    // Listen for content changes - ALL FILES
    channel.on('broadcast', { event: 'content-change' }, ({ payload }) => {
      // console.log('[Collab] Received content change from:', payload.userId, 'for file:', payload.fileId);

      if (payload.userId !== userId) {
        // Update the file content cache
        setAllFileContents(prev => ({
          ...prev,
          [payload.fileId]: payload.content
        }));

        // Update tabs
        setOpenTabs(prev =>
          prev.map(t =>
            t.id === payload.fileId
              ? { ...t, content: payload.content, isDirty: false }
              : t
          )
        );

        // If this is the active file, update editor
        const currentActiveFileId = activeFileRef.current?.id;
        if (payload.fileId === currentActiveFileId && editorRef.current) {
          isApplyingRemoteChangeRef.current = true;

          setTimeout(() => {
            const model = editorRef.current?.getModel();
            if (model) {
              const currentContent = model.getValue();
              if (currentContent !== payload.content) {
                const position = editorRef.current.getPosition();
                editorRef.current.setValue(payload.content);
                if (position) {
                  editorRef.current.setPosition(position);
                }
                editorContentRef.current = payload.content;
                setEditorContent(payload.content);
              }
            }
            setTimeout(() => {
              isApplyingRemoteChangeRef.current = false;
            }, 200);
          }, 50);
        }
      }
    });

    // Listen for chat messages
    channel.on('broadcast', { event: 'chat-message' }, ({ payload }) => {
      if (payload.userId !== userId) {
        setChatMessages(prev => [...prev, {
          id: Date.now() + Math.random(),
          userId: payload.userId,
          userName: payload.userName,
          color: payload.color,
          message: payload.message,
          timestamp: new Date(payload.timestamp)
        }]);

        // Show notification if chat is not active
        if (bottomPanelMode !== 'chat' || !showBottomPanel) {
          setHasNewMessage(true);
        }
      }
    });

    // Listen for file tree updates
    channel.on('broadcast', { event: 'file-created' }, ({ payload }) => {
      if (payload.userId !== userId) {
        // console.log('[Collab] File created by another user:', payload);
        // Refresh file tree
        loadFilesFromServer();
      }
    });

    await channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // console.log('[Collab] ✓ Subscribed to channel');
        await channel.track({
          userId: userId,
          userName: userName,
          color: userColor,
          activeFile: null,
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

  const openFile = async (fileNode, openInBackground = false) => {
    if (window.innerWidth < 768) {
      setShowFileExplorer(false);
    }

    try {
      // Check if we have cached content
      let content = allFileContents[fileNode.id];

      // If not cached, read from server
      if (content === undefined) {
        content = await readEncryptedFile(fileNode.fullPath);
        setAllFileContents(prev => ({
          ...prev,
          [fileNode.id]: content
        }));
      }

      // console.log('[Open] File content loaded:', content?.substring(0, 50));

      const existingTab = openTabs.find(tab => tab.id === fileNode.id);

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
      }
    } catch (err) {
      console.error("Open file failed:", err);
      if (!openInBackground) {
        setEditorContent("// Failed to load file");
        editorContentRef.current = "// Failed to load file";
      }
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
        // console.log('[Editor] Syncing editor with tab content on switch');
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

  const handleEditorChange = (value) => {
    if (isApplyingRemoteChangeRef.current) {
      // console.log('[Editor] Skipping broadcast - applying remote change');
      return;
    }

    // console.log('[Editor] Local change detected, length:', value?.length || 0);

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

    if (realtimeChannelRef.current && currentUserId && activeFile) {
      clearTimeout(window.contentChangeTimeout);
      window.contentChangeTimeout = setTimeout(() => {
        // console.log('[Editor] Broadcasting change to others');
        realtimeChannelRef.current.send({
          type: 'broadcast',
          event: 'content-change',
          payload: {
            userId: currentUserId,
            content: value,
            fileId: activeFile.id
          }
        });
      }, 300);
    }
  };

  // SAVE ALL DIRTY FILES
  const handleSaveAll = async () => {
    if (!canEdit) {
      // console.log('[Save] Skipped - no edit permission');
      return;
    }

    const dirtyTabs = openTabs.filter(t => t.isDirty);
    if (dirtyTabs.length === 0) {
      // console.log('[Save] No files to save');
      return;
    }

    setIsSaving(true);
    // console.log(`[Save] Saving ${dirtyTabs.length} dirty files...`);

    try {
      const savePromises = dirtyTabs.map(async (tab) => {
        const content = allFileContents[tab.id] || tab.content || '';
        const result = await updateEncryptedFile(tab.fullPath, content);
        return { tabId: tab.id, success: result.success, error: result.error };
      });

      const results = await Promise.all(savePromises);
      const failed = results.filter(r => !r.success);

      if (failed.length === 0) {
        // console.log('[Save] All files saved successfully');

        // Mark all tabs as not dirty
        setOpenTabs(prev =>
          prev.map(t => ({ ...t, isDirty: false }))
        );

        // Show success feedback
        alert(`✓ Saved ${dirtyTabs.length} file(s) successfully!`);
      } else {
        console.error('[Save] Some files failed to save:', failed);
        alert(`⚠️ ${failed.length} file(s) failed to save. Please try again.`);
      }

    } catch (err) {
      console.error('[Save] Failed:', err);
      alert(`Failed to save files: ${err.message}\n\nPlease try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  // Create new file - FIXED with broadcast
  const handleCreateFile = async (fileName, extension, parentPath) => {
    try {
      const folderPath = resolveFolderPath(fileTree, parentPath);

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
          name: `${fileName}.${extension}`,
          type: "file",
          fullPath: result.data.storage_path,
          content: null,
        };

        const addFileToTree = (node, path) => {
          if (path.length === 0) {
            return {
              ...node,
              children: [...(node.children || []), newFile],
            };
          }

          const [idx, ...rest] = path;
          return {
            ...node,
            children: node.children.map((child, i) =>
              i === idx ? addFileToTree(child, rest) : child
            ),
          };
        };

        setFileTree((prev) => addFileToTree(prev, parentPath));

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

        // console.log('[CreateFile] File created successfully');
      } else {
        console.error('[CreateFile] Failed:', result.error);
        alert(`Failed to create file: ${result.error}`);
      }
    } catch (err) {
      console.error("[CreateFile] Error:", err);
      alert(`Failed to create file: ${err.message}`);
    }

    setCreateFileModal({ show: false, parentPath: [] });
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

    try {
      const safePath = normalizeFolderParentPath(fileTree, parentPath);

      const addFolder = (node, path) => {
        if (!node) return node;

        if (path.length === 0) {
          const exists = node.children?.some(
            (c) => c.type === "folder" && c.name === folderName
          );
          if (exists) {
            alert('Folder already exists!');
            return node;
          }

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
      // console.log('[CreateFolder] Folder created in UI:', folderName);
    } catch (err) {
      console.error('[CreateFolder] Error:', err);
      alert(`Failed to create folder: ${err.message}`);
    }

    setCreateFolderModal({ show: false, parentPath: [] });
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

          // console.log('[Rename] File renamed successfully');
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
        console.log('[Rename] Folder renamed in UI');
      }
    } catch (err) {
      console.error('[Rename] Error:', err);
      alert(`Failed to rename: ${err.message}`);
    }

    setRenameModal({ show: false, item: null, path: [] });
  };

  const handleDelete = async () => {
    if (!deleteModal.item) {
      setDeleteModal({ show: false, item: null, path: [] });
      return;
    }

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

          console.log('[Delete] File deleted successfully');
        } else {
          alert(`Failed to delete: ${result.error}`);
        }
      } else {
        const removeFolderById = (node, targetId) => {
          if (!node || !Array.isArray(node.children)) return node;

          return {
            ...node,
            children: node.children
              .filter(child => child.id !== targetId)
              .map(child => removeFolderById(child, targetId)),
          };
        };

      }
    } catch (err) {
      console.error('[Delete] Error:', err);
      alert(`Failed to delete: ${err.message}`);
    }

    setDeleteModal({ show: false, item: null, path: [] });
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

  const handleKickUser = (userId) => {
    console.log('Kicking user:', userId);
  };

  const handleMakeAdmin = (userId) => {
    console.log('Making admin:', userId);
  };

  const handleRun = () => {
    console.log('Running code...');
  };

  const handlePushGitHub = () => {
    console.log('Pushing to GitHub...');
  };

  const handleDeleteRoom = () => {
    console.log('Deleting room...');
  };

  const isOwner = userRole === 'owner';
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

          <button
            onClick={handleSaveAll}
            disabled={!canEdit || isSaving || dirtyCount === 0}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all modern-button relative ${canEdit && !isSaving && dirtyCount > 0
              ? 'primary-button text-white'
              : 'bg-slate-700/50 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            title={isSaving ? 'Saving...' : dirtyCount > 0 ? `Save ${dirtyCount} file(s)` : 'No changes to save'}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span className="hidden sm:inline text-xs sm:text-sm font-medium">
              {isSaving ? 'Saving...' : dirtyCount > 0 ? `Save (${dirtyCount})` : 'Save'}
            </span>
          </button>

          <button
            onClick={handlePushGitHub}
            disabled={!isOwner || roomType === 'temporary'}
            className={`p-2 rounded-lg transition-all modern-button ${isOwner && roomType !== 'temporary'
              ? 'hover:bg-slate-700/50 text-slate-200'
              : 'text-slate-500 cursor-not-allowed opacity-60'
              }`}
            title="Push to GitHub"
          >
            <Github className="w-4 h-4" />
          </button>

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
        {/* File Explorer Sidebar */}
        <AnimatePresence>
          {showFileExplorer && (
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="glass-strong border-r border-slate-700/60 flex absolute lg:relative h-full z-40 lg:z-0 flex-shrink-0 shadow-2xl"
              style={{
                width: typeof window !== 'undefined' && window.innerWidth >= 1024
                  ? `${Math.min(drawerMaxWidth, Math.max(drawerMinWidth, drawerWidth))}px`
                  : '100%',
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
                      disabled={!canEdit}
                      className={`p-1.5 rounded-lg transition-all modern-button ${canEdit ? 'hover:bg-emerald-500/10 text-emerald-400' : 'text-slate-500 cursor-not-allowed opacity-50'
                        }`}
                      title="New File"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setCreateFolderModal({ show: true, parentPath: [] })}
                      disabled={!canEdit}
                      className={`p-1.5 rounded-lg transition-all modern-button ${canEdit ? 'hover:bg-slate-600/30 text-slate-300' : 'text-slate-500 cursor-not-allowed opacity-50'
                        }`}
                      title="New Folder"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
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
                      className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-all modern-button"
                    >
                      {terminalHeight === 200 ? <Maximize2 className="w-3.5 h-3.5 text-slate-400" /> : <Minimize2 className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                    <button
                      onClick={() => setShowBottomPanel(false)}
                      className="p-1.5 hover:bg-red-500/10 rounded-lg transition-all modern-button text-slate-400 hover:text-red-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {bottomPanelMode === 'terminal' ? (
                  <div className="flex-1 overflow-y-auto p-4 font-mono text-sm text-emerald-400 bg-slate-950">
                    <div>$ npm start</div>
                    <div className="text-slate-400 mt-2">Starting development server...</div>
                    <div className="text-blue-400 mt-1">Compiled successfully!</div>
                    <div className="text-slate-400 mt-1">Local: http://localhost:3000</div>
                    <div className="animate-pulse mt-2">▊</div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {chatMessages.length === 0 ? (
                        <div className="text-center text-slate-500 mt-8">
                          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">No messages yet</p>
                          <p className="text-xs mt-1">Start a conversation with your team</p>
                        </div>
                      ) : (
                        chatMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex gap-2 ${msg.userId === currentUserId ? 'flex-row-reverse' : ''}`}
                          >
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                              style={{ backgroundColor: msg.color }}
                            >
                              {msg.userName.charAt(0).toUpperCase()}
                            </div>
                            <div className={`flex-1 ${msg.userId === currentUserId ? 'items-end' : 'items-start'} flex flex-col`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium" style={{ color: msg.color }}>
                                  {msg.userName}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div
                                className={`px-3 py-2 rounded-lg max-w-md ${msg.userId === currentUserId
                                  ? 'bg-emerald-600/20 border border-emerald-500/30'
                                  : 'bg-slate-800/60 border border-slate-700/50'
                                  }`}
                              >
                                <p className="text-sm text-slate-200 break-words">{msg.message}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    <div className="border-t border-slate-700/60 p-3 bg-slate-900/80">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Type a message..."
                          className="flex-1 px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-sm focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-500"
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={!chatInput.trim()}
                          className={`px-4 py-2 rounded-lg transition-all modern-button flex items-center gap-2 ${chatInput.trim()
                            ? 'primary-button text-white'
                            : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                            }`}
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showUsersModal && (
          <UsersModal
            users={connectedUsers.length > 0 ? connectedUsers : users}
            isOwner={isOwner}
            onClose={() => setShowUsersModal(false)}
            onKickUser={handleKickUser}
            onMakeAdmin={handleMakeAdmin}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettingsPanel && (
          <SettingsPanel
            roomType={roomType}
            roomName={roomName}
            roomCode={roomCode}
            roomOwnerName={roomOwnerName}
            setRoomName={setRoomName}
            isOwner={isOwner}
            users={users}
            onClose={() => setShowSettingsPanel(false)}
            onDeleteRoom={handleDeleteRoom}
            copiedCode={copiedCode}
            onCopyCode={handleCopyRoomCode}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {createFileModal.show && (
          <CreateFileModal
            onClose={() => setCreateFileModal({ show: false, parentPath: [] })}
            onCreate={handleCreateFile}
            parentPath={createFileModal.parentPath}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {createFolderModal.show && (
          <CreateFolderModal
            onClose={() => setCreateFolderModal({ show: false, parentPath: [] })}
            onCreate={handleCreateFolder}
            parentPath={createFolderModal.parentPath}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {renameModal.show && (
          <RenameModal
            item={renameModal.item}
            onClose={() => setRenameModal({ show: false, item: null, path: [] })}
            onRename={handleRename}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteModal.show && (
          <DeleteModal
            item={deleteModal.item}
            onClose={() => setDeleteModal({ show: false, item: null, path: [] })}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// File Tree Node Component
function FileTreeNode({ node, path, onToggle, onOpenFile, activeFile, onRename, onDelete, onCreateFile, onCreateFolder, level = 0, canEdit }) {
  const isActive = activeFile?.id === node.id;
  const [showActions, setShowActions] = useState(false);

  if (node.type === 'folder') {
    return (
      <div className="select-none">
        <div
          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all group ${node.isExpanded ? 'bg-slate-700/30' : 'hover:bg-slate-700/20'
            }`}
          style={{ paddingLeft: `${level * 14 + 8}px` }}
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
        >
          <button
            onClick={() => onToggle(path)}
            className="flex items-center gap-2 flex-1 min-w-0 text-left"
          >
            {node.isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
            )}
            <Folder className={`w-4 h-4 flex-shrink-0 ${node.isExpanded ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span className="text-sm font-medium truncate text-slate-300">{node.name}</span>
          </button>

          <AnimatePresence>
            {showActions && canEdit && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1 flex-shrink-0"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateFile([...path, node.children?.length || 0]);
                  }}
                  className="p-1 hover:bg-emerald-500/10 rounded transition-all modern-button text-emerald-400"
                  title="New file in folder"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateFolder([...path, node.children?.length || 0]);
                  }}
                  className="p-1 hover:bg-slate-600/50 rounded transition-all modern-button text-slate-400"
                  title="New folder in folder"
                >
                  <FolderPlus className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRename(node, path);
                  }}
                  className="p-1 hover:bg-slate-600/50 rounded transition-all modern-button text-slate-400"
                  title="Rename"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(node, path);
                  }}
                  className="p-1 hover:bg-red-500/10 rounded transition-all modern-button text-red-400"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {node.isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {node.children?.map((child, idx) => (
                <FileTreeNode
                  key={child.name}
                  node={child}
                  path={[...path, idx]}
                  onToggle={onToggle}
                  onOpenFile={onOpenFile}
                  activeFile={activeFile}
                  onRename={onRename}
                  onDelete={onDelete}
                  onCreateFile={onCreateFile}
                  onCreateFolder={onCreateFolder}
                  level={level + 1}
                  canEdit={canEdit}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all group ${isActive ? 'bg-emerald-600/20 border-l-2 border-emerald-500 text-slate-100' : 'hover:bg-slate-700/20 text-slate-300'
        }`}
      style={{ paddingLeft: `${level * 14 + 8}px` }}
      onClick={(e) => onOpenFile(node, e.ctrlKey || e.metaKey)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {getFileIcon(node.name)}
      <span className={`text-sm flex-1 truncate ${isActive ? 'font-semibold' : 'font-medium'}`}>
        {node.name}
      </span>

      <AnimatePresence>
        {showActions && canEdit && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1 flex-shrink-0"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRename(node, path);
              }}
              className="p-1 hover:bg-slate-600/50 rounded transition-all modern-button text-slate-400"
              title="Rename"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(node, path);
              }}
              className="p-1 hover:bg-red-500/10 rounded transition-all modern-button text-red-400"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Modal Components
function UsersModal({ users, isOwner, onClose, onKickUser, onMakeAdmin }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="glass-strong rounded-xl p-4 sm:p-6 max-w-md w-full border border-slate-700/60 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold flex items-center gap-2 text-slate-200">
            <Users className="w-5 h-5 text-emerald-400" />
            Room Users ({users.length})
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-all modern-button text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto">
          {users.map((user) => (
            <div
              key={user.userId || user.id}
              className={`p-3 sm:p-4 rounded-lg transition-all border ${user.online !== false
                ? 'bg-slate-800/40 border-slate-700/50'
                : 'bg-slate-800/20 border-slate-700/30 opacity-60'
                }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 ring-2 ring-slate-700"
                  style={{ backgroundColor: user.color || '#3B82F6' }}
                >
                  {(user.userName || user.name)?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm truncate text-slate-200">
                      {user.userName || user.name}
                    </p>
                    {user.role === 'owner' && (
                      <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    )}
                    {user.role === 'admin' && (
                      <Shield className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mt-0.5">
                    {user.role}
                  </p>
                </div>
                {user.online !== false && (
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full flex-shrink-0 pulse-animation"></div>
                )}
              </div>

              {isOwner && user.role !== 'owner' && user.online !== false && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => onKickUser(user.userId || user.id)}
                    className="flex-1 px-3 py-2 danger-button text-white rounded-lg transition-all modern-button text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Kick
                  </button>
                  {user.role !== 'admin' && (
                    <button
                      onClick={() => onMakeAdmin(user.userId || user.id)}
                      className="flex-1 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-all modern-button text-xs font-semibold flex items-center justify-center gap-2 border border-slate-600/50"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Make Admin
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function SettingsPanel({ roomType, roomName, roomCode, roomOwnerName, setRoomName, isOwner, users, onClose, onDeleteRoom, copiedCode, onCopyCode }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 h-full w-full md:w-96 glass-strong border-l border-slate-700/60 z-50 p-4 sm:p-6 overflow-y-auto shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold flex items-center gap-2 text-slate-200">
            <Settings className="w-5 h-5 text-emerald-400" />
            Settings
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-all modern-button text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block uppercase tracking-wider">Room Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={roomCode || 'Loading...'}
                readOnly
                className="flex-1 px-3 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg text-sm font-mono opacity-90"
              />
              <button
                onClick={onCopyCode}
                className={`px-4 py-2.5 rounded-lg transition-all modern-button flex items-center gap-2 ${copiedCode ? 'bg-emerald-600 text-white' : 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300'
                  }`}
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block uppercase tracking-wider">Room Type</label>
            <div className={`px-3 py-2.5 rounded-lg text-sm font-medium border ${roomType === 'temporary'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : roomType === 'permanent'
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}>
              {roomType === 'temporary' ? '⏱️ Temporary' : roomType === 'permanent' ? '👥 Collaborative' : '👤 Solo'}
            </div>
          </div>

          {roomOwnerName && (
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block uppercase tracking-wider">Owner</label>
              <div className="px-3 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg text-sm font-medium text-slate-300">
                {roomOwnerName}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block uppercase tracking-wider">Room Name</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              disabled={!isOwner}
              className={`w-full px-3 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg text-sm font-medium focus:outline-none focus:border-emerald-500/50 transition-all ${!isOwner ? 'opacity-60 cursor-not-allowed' : ''
                }`}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block uppercase tracking-wider">Active Users</label>
            <div className="space-y-2">
              {users.filter(u => u.online).map((user) => (
                <div key={user.id} className="flex items-center gap-2 px-3 py-2 bg-slate-800/40 rounded-lg border border-slate-700/50">
                  <span className="text-lg">{user.avatar}</span>
                  <span className="text-sm font-medium text-slate-300">{user.name}</span>
                  <div className="flex-1"></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full pulse-animation"></div>
                </div>
              ))}
            </div>
          </div>

          {isOwner && roomType !== 'temporary' && (
            <div className="pt-4 border-t border-slate-700/60">
              <label className="text-xs font-semibold text-red-400 mb-2 block uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Danger Zone
              </label>
              <button
                onClick={onDeleteRoom}
                className="w-full px-4 py-3 danger-button text-white rounded-lg transition-all modern-button flex items-center justify-center gap-2 font-semibold"
              >
                <Trash2 className="w-4 h-4" />
                Delete Room
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

function CreateFileModal({ onClose, onCreate, parentPath }) {
  const [fileName, setFileName] = useState('');
  const [extension, setExtension] = useState('js');

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
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="glass-strong rounded-xl p-6 max-w-md w-full border border-slate-700/60 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-200">Create New File</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-700/50 rounded-lg transition-all modern-button">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-2 block uppercase tracking-wider">File Name</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="example"
              className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg text-sm font-medium focus:outline-none focus:border-emerald-500/50 transition-all"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-2 block uppercase tracking-wider">Extension</label>
            <select
              value={extension}
              onChange={(e) => setExtension(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg text-sm font-medium focus:outline-none focus:border-emerald-500/50 transition-all"
            >
              <option value="js">JavaScript (.js)</option>
              <option value="jsx">React (.jsx)</option>
              <option value="ts">TypeScript (.ts)</option>
              <option value="tsx">React TypeScript (.tsx)</option>
              <option value="py">Python (.py)</option>
              <option value="java">Java (.java)</option>
              <option value="cpp">C++ (.cpp)</option>
              <option value="c">C (.c)</option>
              <option value="html">HTML (.html)</option>
              <option value="css">CSS (.css)</option>
              <option value="json">JSON (.json)</option>
              <option value="md">Markdown (.md)</option>
              <option value="txt">Text (.txt)</option>
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-all modern-button font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!fileName.trim()}
              className={`flex-1 px-4 py-2.5 rounded-lg transition-all modern-button font-semibold ${fileName.trim()
                ? 'primary-button text-white'
                : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                }`}
            >
              Create
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function CreateFolderModal({ onClose, onCreate, parentPath }) {
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
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="glass-strong rounded-xl p-6 max-w-md w-full border border-slate-700/60 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-200">Create New Folder</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-700/50 rounded-lg transition-all modern-button">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-2 block uppercase tracking-wider">Folder Name</label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="components"
              className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg text-sm font-medium focus:outline-none focus:border-emerald-500/50 transition-all"
              autoFocus
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-all modern-button font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!folderName.trim()}
              className={`flex-1 px-4 py-2.5 rounded-lg transition-all modern-button font-semibold ${folderName.trim()
                ? 'primary-button text-white'
                : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                }`}
            >
              Create
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function RenameModal({ item, onClose, onRename }) {
  const [newName, setNewName] = useState(item?.name || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newName.trim()) {
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
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="glass-strong rounded-xl p-6 max-w-md w-full border border-slate-700/60 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-200">
            Rename {item?.type === 'folder' ? 'Folder' : 'File'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-700/50 rounded-lg transition-all modern-button">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-2 block uppercase tracking-wider">New Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded-lg text-sm font-medium focus:outline-none focus:border-emerald-500/50 transition-all"
              autoFocus
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-all modern-button font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newName.trim()}
              className={`flex-1 px-4 py-2.5 rounded-lg transition-all modern-button font-semibold ${newName.trim()
                ? 'primary-button text-white'
                : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                }`}
            >
              Rename
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function DeleteModal({ item, onClose, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="glass-strong rounded-xl p-6 max-w-md w-full border border-slate-700/60 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Delete {item?.type === 'folder' ? 'Folder' : 'File'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-700/50 rounded-lg transition-all modern-button">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-slate-300 mb-2">
            Are you sure you want to delete <span className="font-semibold text-white">{item?.name}</span>?
          </p>
          <p className="text-xs text-slate-500">
            This action cannot be undone.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-all modern-button font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={onDelete}
            className="flex-1 px-4 py-2.5 danger-button text-white rounded-lg transition-all modern-button font-semibold"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}