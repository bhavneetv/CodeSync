import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Save, Users, Settings, Plus, FolderPlus, Edit2, Trash2,
  ChevronRight, ChevronDown, File, Folder, X, Menu, Terminal as TerminalIcon,
  Maximize2, Minimize2, AlertTriangle, Crown, Shield, LogOut,
  FileCode, FileJson, FileText, Image as ImageIcon, Database, Github, GripVertical,
  Loader2, Download
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { getRoomFiles, buildFileTree, readEncryptedFile, handleCreateFolder, createEncryptedFile, updateEncryptedFile } from '../function/files/create-file';
import { get } from 'lodash';
import supabase from '../supabaseClient';
import { isRoomValid } from '../function/rooms/upload-page';
import { decrypt } from '../function/login/encryption';

// Cursor colors for different users
const CURSOR_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
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

export default function CodeEditorPage() {
  const [roomType, setRoomType] = useState('solo');
  const [roomName, setRoomName] = useState('Project CodeSpace');
  const [isEditingRoomName, setIsEditingRoomName] = useState(false);
  const [activeFile, setActiveFile] = useState(null);
  const [openTabs, setOpenTabs] = useState([]);
  const [editorContent, setEditorContent] = useState('');
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [terminalHeight, setTerminalHeight] = useState(200);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [users, setUsers] = useState(mockUsers);
  const [ownerOnline, setOwnerOnline] = useState(true);
  const [drawerWidth, setDrawerWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const [userRole, setUserRole] = useState('editor');

  // Collaboration state
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('');
  const [remoteCursors, setRemoteCursors] = useState({});
  const [remoteSelections, setRemoteSelections] = useState({});
  const [connectedUsers, setConnectedUsers] = useState([]);

  // Modal states
  const [createFileModal, setCreateFileModal] = useState({ show: false, parentPath: [] });
  const [createFolderModal, setCreateFolderModal] = useState({ show: false, parentPath: [] });
  const [renameModal, setRenameModal] = useState({ show: false, item: null, path: [] });
  const [deleteModal, setDeleteModal] = useState({ show: false, item: null, path: [] });

  const [fileTree, setFileTree] = useState(initialFileTree);
  const [isSaving, setIsSaving] = useState(false);

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const resizeRef = useRef(null);
  const editorContentRef = useRef("");
  const cursorDecorationsRef = useRef([]);
  const realtimeChannelRef = useRef(null);

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

  // Initialize collaboration
  useEffect(() => {
    fetch();
    verifyAccess();
    initializeCollaboration();
    
    async function loadFiles() {
      try {
        const files = await getRoomFiles(roomLink);
        const tree = buildFileTree(files);
        setFileTree(tree);
      } catch (err) {
        console.error("Failed to load files:", err);
      }
    }

    if (roomLink) loadFiles();

    return () => {
      // Cleanup realtime subscriptions
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

    // Fetch user's name
    const { data: userData  , error: userDataError} = await supabase
      .from("user")
      .select("name")
      .eq("uid", data.user_id)
      .single();

    if (userDataError) {
      console.error("Failed to fetch user data:", userDataError);
      return;
    }
    if (userData) {
      setCurrentUserName("userData.name");
    }
  };

  // Initialize realtime collaboration
  const initializeCollaboration = async () => {
    if (!roomLink) return;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    // Create a unique channel for this room
    const channel = supabase.channel(`room:${roomLink}`, {
      config: {
        broadcast: { self: false },
        presence: { key: token }
      }
    });

    // Track presence (who's online)
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
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', leftPresences);
      });

    // Listen for cursor movements
    channel.on('broadcast', { event: 'cursor' }, ({ payload }) => {
      if (payload.userId !== currentUserId) {
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
      if (payload.userId !== currentUserId) {
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

    // Listen for content changes
    channel.on('broadcast', { event: 'content-change' }, ({ payload }) => {
      if (payload.userId !== currentUserId && payload.fileId === activeFile?.id) {
        // Apply remote changes to editor
        if (editorRef.current) {
          const model = editorRef.current.getModel();
          if (model) {
            const currentContent = model.getValue();
            if (currentContent !== payload.content) {
              editorRef.current.executeEdits('remote', [{
                range: model.getFullModelRange(),
                text: payload.content
              }]);
            }
          }
        }
      }
    });

    await channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Announce presence with a random color
        const colorIndex = Math.floor(Math.random() * CURSOR_COLORS.length);
        await channel.track({
          userId: currentUserId,
          userName: currentUserName,
          color: CURSOR_COLORS[colorIndex],
          activeFile: activeFile?.id || null,
          online_at: new Date().toISOString()
        });
      }
    });

    realtimeChannelRef.current = channel;
  };

  // Update presence when active file changes
  useEffect(() => {
    if (realtimeChannelRef.current && currentUserId) {
      const state = realtimeChannelRef.current.presenceState();
      const currentPresence = state[new URLSearchParams(window.location.search).get("token")]?.[0];
      
      if (currentPresence) {
        realtimeChannelRef.current.track({
          ...currentPresence,
          activeFile: activeFile?.id || null
        });
      }
    }
  }, [activeFile, currentUserId]);

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
      const content = await readEncryptedFile(fileNode.fullPath);
      console.log('[Open] Read fresh content from storage:', content?.substring(0, 50));

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

  // Handle editor mount
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Track cursor position changes
    editor.onDidChangeCursorPosition((e) => {
      const position = {
        lineNumber: e.position.lineNumber,
        column: e.position.column
      };

      setCursorPosition({
        line: position.lineNumber,
        column: position.column,
      });

      // Broadcast cursor position to other users
      if (realtimeChannelRef.current && currentUserId && activeFile) {
        const state = realtimeChannelRef.current.presenceState();
        const token = new URLSearchParams(window.location.search).get("token");
        const currentPresence = state[token]?.[0];

        realtimeChannelRef.current.send({
          type: 'broadcast',
          event: 'cursor',
          payload: {
            userId: currentUserId,
            userName: currentUserName,
            color: currentPresence?.color || CURSOR_COLORS[0],
            position: position,
            fileId: activeFile.id
          }
        });
      }
    });

    // Track selection changes
    editor.onDidChangeCursorSelection((e) => {
      if (realtimeChannelRef.current && currentUserId && activeFile) {
        const state = realtimeChannelRef.current.presenceState();
        const token = new URLSearchParams(window.location.search).get("token");
        const currentPresence = state[token]?.[0];

        realtimeChannelRef.current.send({
          type: 'broadcast',
          event: 'selection',
          payload: {
            userId: currentUserId,
            color: currentPresence?.color || CURSOR_COLORS[0],
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

  // Render remote cursors and selections
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !activeFile) return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const decorations = [];

    // Render remote cursors for users in the same file
    Object.entries(remoteCursors).forEach(([userId, cursorData]) => {
      if (cursorData.fileId === activeFile.id) {
        // Cursor decoration
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
            beforeContentClassName: 'remote-cursor-decoration',
            after: {
              content: cursorData.userName,
              inlineClassName: 'remote-cursor-label',
              inlineClassNameAffectsLetterSpacing: true
            }
          }
        });
      }
    });

    // Render remote selections
    Object.entries(remoteSelections).forEach(([userId, selectionData]) => {
      if (selectionData.fileId === activeFile.id) {
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
            inlineClassName: 'remote-selection-inline'
          }
        });
      }
    });

    cursorDecorationsRef.current = editor.deltaDecorations(
      cursorDecorationsRef.current,
      decorations
    );

    // Add CSS for remote cursors
    const styleId = 'remote-cursor-styles';
    let styleElement = document.getElementById(styleId);
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    let css = '';
    
    Object.entries(remoteCursors).forEach(([userId, cursorData]) => {
      css += `
        .remote-cursor-${userId}::before {
          content: '';
          position: absolute;
          width: 2px;
          height: 1.2em;
          background-color: ${cursorData.color};
          animation: blink 1s infinite;
        }
        .remote-cursor-${userId}::after {
          content: '${cursorData.userName}';
          position: absolute;
          top: -18px;
          left: 0;
          background-color: ${cursorData.color};
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 11px;
          font-weight: 500;
          white-space: nowrap;
          pointer-events: none;
          z-index: 1000;
        }
      `;
    });

    Object.entries(remoteSelections).forEach(([userId, selectionData]) => {
      css += `
        .remote-selection-${userId} {
          background-color: ${selectionData.color}33 !important;
        }
      `;
    });

    css += `
      @keyframes blink {
        0%, 49% { opacity: 1; }
        50%, 100% { opacity: 0; }
      }
    `;

    styleElement.textContent = css;

  }, [remoteCursors, remoteSelections, activeFile]);

  // Handle editor content change
  const handleEditorChange = (value) => {
    editorContentRef.current = value;

    setOpenTabs(prev =>
      prev.map(t =>
        t.id === activeFile.id
          ? { ...t, content: value, isDirty: true }
          : t
      )
    );

    // Broadcast content changes to other users (debounced)
    if (realtimeChannelRef.current && currentUserId && activeFile) {
      clearTimeout(window.contentChangeTimeout);
      window.contentChangeTimeout = setTimeout(() => {
        realtimeChannelRef.current.send({
          type: 'broadcast',
          event: 'content-change',
          payload: {
            userId: currentUserId,
            content: value,
            fileId: activeFile.id
          }
        });
      }, 500);
    }
  };

  // Create new file
  const handleCreateFile = async (fileName, extension, parentPath) => {
    try {
      const folderPath = resolveFolderPath(fileTree, parentPath);

      await createEncryptedFile(
        roomLink,
        fileName,
        extension,
        false,
        folderPath
      );

      const files = await getRoomFiles(roomLink);
      setFileTree(buildFileTree(files));
    } catch (err) {
      console.error("Create file failed:", err);
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

  // Create new folder
  const handleCreateFolder = (folderName, parentPath) => {
    if (!folderName) return;

    const safePath = normalizeFolderParentPath(fileTree, parentPath);

    const addFolder = (node, path) => {
      if (!node) return node;

      if (path.length === 0) {
        const exists = node.children?.some(
          (c) => c.type === "folder" && c.name === folderName
        );
        if (exists) return node;

        return {
          ...node,
          isExpanded: true,
          children: [
            ...(node.children || []),
            {
              name: folderName,
              type: "folder",
              isExpanded: false,
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

  const activeTab = openTabs.find((t) => t.id === activeFile?.id);
  const isActiveDirty = activeTab?.isDirty ?? false;

  const handleSave = async () => {
    if (!activeFile || !canEdit) return;

    const tab = openTabs.find(t => t.id === activeFile.id);
    if (!tab || !tab.isDirty) return;

    setIsSaving(true);

    const latestContent = editorContentRef.current;
    console.log('[Save] Saving content:', latestContent);

    try {
      await updateEncryptedFile(tab.fullPath, latestContent);
      console.log('[Save] Successfully saved to storage');

      setOpenTabs(prev =>
        prev.map(t =>
          t.id === tab.id
            ? { ...t, content: latestContent, isDirty: false }
            : t
        )
      );

      setActiveFile(prev => ({
        ...prev,
        content: latestContent
      }));

    } catch (err) {
      console.error('[Save] Failed:', err);
      alert('Failed to save file. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePushGitHub = () => {
    console.log('Pushing to GitHub...');
  };

  const handleDeleteRoom = () => {
    console.log('Deleting room...');
  };

  const handleRename = (newName) => {
    console.log('Renaming:', { oldName: renameModal.item?.name, newName, path: renameModal.path });
    setRenameModal({ show: false, item: null, path: [] });
  };

  const handleDelete = () => {
    console.log('Deleting:', { name: deleteModal.item?.name, path: deleteModal.path });
    setDeleteModal({ show: false, item: null, path: [] });
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

  const isOwner = userRole === 'owner';
  const canEdit = isOwner || userRole === 'editor';
  const onlineCount = connectedUsers.length || users.filter(u => u.online).length;

  // Get users working on the same file
  const usersInCurrentFile = connectedUsers.filter(
    user => user.activeFile === activeFile?.id && user.userId !== currentUserId
  );

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0d1117] text-slate-100 font-['Inter',_sans-serif]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
        
        .glass {
          background: rgba(22, 27, 34, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(48, 54, 61, 0.6);
        }
        
        .glass-strong {
          background: rgba(13, 17, 23, 0.98);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(48, 54, 61, 0.6);
        }

        .monaco-editor-background {
          background-color: #0d1117 !important;
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(22, 27, 34, 0.5);
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(88, 96, 105, 0.5);
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(110, 118, 129, 0.6);
        }

        .tab-active {
          background: rgba(46, 160, 67, 0.12);
          border-bottom: 2px solid rgba(46, 160, 67, 0.6);
        }

        .tab-inactive {
          background: transparent;
          border-bottom: 2px solid transparent;
        }

        .tab-inactive:hover {
          background: rgba(48, 54, 61, 0.5);
        }

        .modern-button {
          transition: all 0.2s ease;
        }

        .modern-button:hover:not(:disabled) {
          background: rgba(48, 54, 61, 0.6);
        }

        .modern-button:active {
          transform: scale(0.98);
        }

        /* Collaborative cursor animations */
        @keyframes cursorBlink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>

      {/* Header */}
      <header className="glass-strong border-b border-slate-700/60 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sticky top-0 z-50">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <button
            onClick={() => setShowFileExplorer(!showFileExplorer)}
            className="lg:hidden p-2 hover:bg-slate-700/50 rounded transition-all modern-button flex-shrink-0"
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
                  className="bg-slate-800/60 border border-slate-600 rounded px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-emerald-500/50 transition-all"
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

          {/* Show users in current file */}
          {usersInCurrentFile.length > 0 && (
            <div className="hidden lg:flex items-center gap-1 px-2 py-1 bg-slate-800/50 rounded-full border border-slate-700/50">
              {usersInCurrentFile.slice(0, 3).map((user, idx) => (
                <div
                  key={user.userId}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white"
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
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold bg-slate-700 text-slate-300 -ml-2">
                  +{usersInCurrentFile.length - 3}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/15 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/30">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
            <span>Online {onlineCount}</span>
          </div>

          <button
            onClick={handleRun}
            disabled={!canEdit}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded transition-all modern-button ${canEdit
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-slate-700/50 text-slate-500 cursor-not-allowed opacity-60'
              }`}
          >
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Run</span>
          </button>

          <button
            onClick={handleSave}
            disabled={!canEdit || isSaving || !activeFile}
            className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded transition-all modern-button ${canEdit && !isSaving
              ? 'hover:bg-slate-700/50 text-slate-200'
              : 'text-slate-500 cursor-not-allowed opacity-60'
              }`}
            title={isSaving ? 'Saving...' : isActiveDirty ? 'Save' : 'Save offline'}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isActiveDirty ? (
              <Save className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="hidden sm:inline text-xs sm:text-sm font-medium">
              {isSaving ? 'Saving...' : isActiveDirty ? 'Save' : 'Save offline'}
            </span>
          </button>

          <button
            onClick={handlePushGitHub}
            disabled={!isOwner || roomType === 'temporary'}
            className={`p-2 rounded transition-all modern-button ${isOwner && roomType !== 'temporary'
              ? 'hover:bg-slate-700/50 text-slate-200'
              : 'text-slate-500 cursor-not-allowed opacity-60'
              }`}
            title="Push to GitHub"
          >
            <Github className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowUsersModal(true)}
            className="p-2 hover:bg-slate-700/50 rounded transition-all modern-button relative"
            title="Users"
          >
            <Users className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 bg-emerald-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-semibold px-1 md:hidden">
              {onlineCount}
            </span>
          </button>

          <button
            onClick={() => setShowSettingsPanel(true)}
            className="p-2 hover:bg-slate-700/50 rounded transition-all modern-button"
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
              className="glass-strong border-r border-slate-700/60 flex absolute lg:relative h-full z-40 lg:z-0 flex-shrink-0"
              style={{
                width: typeof window !== 'undefined' && window.innerWidth >= 1024
                  ? `${Math.min(drawerMaxWidth, Math.max(drawerMinWidth, drawerWidth))}px`
                  : '100%',
              }}
            >
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <div className="p-2.5 sm:p-3 border-b border-slate-700/60 flex items-center justify-between flex-shrink-0">
                  <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Folder className="w-3.5 h-3.5 text-slate-500" />
                    Explorer
                  </h2>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCreateFileModal({ show: true, parentPath: [] })}
                      disabled={!canEdit}
                      className={`p-1.5 rounded transition-all modern-button ${canEdit ? 'hover:bg-emerald-500/10 text-emerald-400' : 'text-slate-500 cursor-not-allowed opacity-50'
                        }`}
                      title="New File"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setCreateFolderModal({ show: true, parentPath: [] })}
                      disabled={!canEdit}
                      className={`p-1.5 rounded transition-all modern-button ${canEdit ? 'hover:bg-slate-600/30 text-slate-300' : 'text-slate-500 cursor-not-allowed opacity-50'
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
                className="hidden lg:block w-1 flex-shrink-0 hover:w-1.5 bg-transparent hover:bg-slate-500/50 cursor-col-resize transition-all"
                onMouseDown={() => setIsResizing(true)}
              >
                <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <GripVertical className="w-3 h-3 text-slate-500" />
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
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" title="Unsaved changes" />
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

          <div className="flex-1 relative bg-[#0d1117] min-h-0">
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
                    <div className="w-16 h-16 mx-auto bg-slate-800/60 rounded flex items-center justify-center border border-slate-700/60">
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
            </div>
            <button
              onClick={() => setShowTerminal(!showTerminal)}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 hover:bg-slate-700/50 rounded transition-all modern-button flex-shrink-0"
            >
              <TerminalIcon className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-medium hidden sm:inline">Terminal</span>
            </button>
          </div>

          {/* Terminal Drawer */}
          <AnimatePresence>
            {showTerminal && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: terminalHeight }}
                exit={{ height: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="glass-strong border-t border-slate-700/60 flex flex-col overflow-hidden"
              >
                <div className="px-3 sm:px-4 py-2 border-b border-slate-700/60 flex items-center justify-between bg-slate-900/50">
                  <div className="flex items-center gap-2">
                    <TerminalIcon className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-semibold text-slate-300">Terminal</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setTerminalHeight(terminalHeight === 200 ? 400 : 200)}
                      className="p-1.5 hover:bg-slate-700/50 rounded transition-all modern-button"
                    >
                      {terminalHeight === 200 ? <Maximize2 className="w-3.5 h-3.5 text-slate-400" /> : <Minimize2 className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                    <button
                      onClick={() => setShowTerminal(false)}
                      className="p-1.5 hover:bg-red-500/10 rounded transition-all modern-button text-slate-400 hover:text-red-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 font-mono text-sm text-emerald-400 bg-[#0d1117]">
                  <div>$ npm start</div>
                  <div className="text-slate-400 mt-2">Starting development server...</div>
                  <div className="text-blue-400 mt-1">Compiled successfully!</div>
                  <div className="text-slate-400 mt-1">Local: http://localhost:3000</div>
                  <div className="animate-pulse mt-2">▊</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modals - Users, Settings, Create File/Folder, Rename, Delete */}
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
            setRoomName={setRoomName}
            isOwner={isOwner}
            users={users}
            onClose={() => setShowSettingsPanel(false)}
            onDeleteRoom={handleDeleteRoom}
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

// File Tree Node Component (same as before)
function FileTreeNode({ node, path, onToggle, onOpenFile, activeFile, onRename, onDelete, onCreateFile, onCreateFolder, level = 0, canEdit }) {
  const isActive = activeFile?.id === node.id;
  const [showActions, setShowActions] = useState(false);

  if (node.type === 'folder') {
    return (
      <div className="select-none">
        <div
          className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-all group ${node.isExpanded ? 'bg-slate-700/30' : 'hover:bg-slate-700/20'
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
            <Folder className={`w-4 h-4 flex-shrink-0 ${node.isExpanded ? 'text-slate-400' : 'text-slate-500'}`} />
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
      className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-all group ${isActive ? 'bg-slate-700/40 border-l-2 border-emerald-500/70 text-slate-100' : 'hover:bg-slate-700/20 text-slate-300'
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
        className="glass-strong rounded-lg p-4 sm:p-6 max-w-md w-full border border-slate-700/60"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold flex items-center gap-2 text-slate-200">
            <Users className="w-5 h-5 text-slate-400" />
            Room Users ({users.length})
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700/50 rounded transition-all modern-button text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto">
          {users.map((user) => (
            <div
              key={user.userId || user.id}
              className={`p-3 sm:p-4 rounded transition-all border ${
                user.online !== false
                  ? 'bg-slate-800/40 border-slate-700/50'
                  : 'bg-slate-800/20 border-slate-700/30 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0"
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
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full flex-shrink-0"></div>
                )}
              </div>

              {isOwner && user.role !== 'owner' && user.online !== false && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => onKickUser(user.userId || user.id)}
                    className="flex-1 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-all modern-button text-xs font-semibold flex items-center justify-center gap-2 border border-red-500/20"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Kick
                  </button>
                  {user.role !== 'admin' && (
                    <button
                      onClick={() => onMakeAdmin(user.userId || user.id)}
                      className="flex-1 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded transition-all modern-button text-xs font-semibold flex items-center justify-center gap-2 border border-slate-600/50"
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

function SettingsPanel({ roomType, roomName, setRoomName, isOwner, users, onClose, onDeleteRoom }) {
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
        transition={{ type: 'spring', stiffiness: 300, damping: 30 }}
        className="fixed right-0 top-0 h-full w-full md:w-96 glass-strong border-l border-slate-700/60 z-50 p-4 sm:p-6 overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold flex items-center gap-2 text-slate-200">
            <Settings className="w-5 h-5 text-slate-400" />
            Settings
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700/50 rounded transition-all modern-button text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block uppercase tracking-wider">Room Type</label>
            <div className={`px-3 py-2.5 bg-slate-800/50 border rounded text-sm font-medium ${roomType === 'temporary' ? 'border-amber-500/30 text-amber-400' : 'border-emerald-500/30 text-emerald-400'
              }`}>
              {roomType === 'temporary' ? 'Temporary (24h)' : 'Permanent'}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block uppercase tracking-wider">Owner</label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded text-sm">
              <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="font-medium text-slate-300 truncate">{users.find(u => u.role === 'owner')?.name || 'Unknown'}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block uppercase tracking-wider">Room Name</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              disabled={!isOwner}
              className={`w-full px-3 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded text-sm focus:outline-none focus:border-emerald-500/50 transition-all ${!isOwner ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block uppercase tracking-wider">Room Password</label>
            <input
              type="password"
              placeholder="••••••••"
              disabled={!isOwner}
              className={`w-full px-3 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded text-sm focus:outline-none focus:border-emerald-500/50 transition-all ${!isOwner ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block uppercase tracking-wider">Download Path</label>
            <p className="text-[11px] text-slate-500 mb-1.5 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              This is only available in Windows or mobile app
            </p>
            <input
              type="text"
              value="/home/user/downloads"
              readOnly
              className="w-full px-3 py-2.5 bg-slate-700/40 border border-slate-600/50 rounded text-sm opacity-60 cursor-not-allowed"
            />
          </div>

          {isOwner && (
            <button className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm font-semibold transition-all modern-button">
              Save Settings
            </button>
          )}

          {isOwner && (
            <div className="border-t border-slate-700/50 pt-4 mt-4">
              <button
                onClick={onDeleteRoom}
                className="w-full px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-sm font-semibold flex items-center justify-center gap-2 border border-red-500/20 transition-all modern-button"
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

  const extensions = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'html', 'css', 'json', 'md', 'txt'];

  const handleCreate = () => {
    if (fileName.trim()) {
      onCreate(fileName, extension, parentPath);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="glass-strong rounded-lg p-4 sm:p-6 max-w-md w-full border border-slate-700/60"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-slate-200">
          <Plus className="w-5 h-5 text-emerald-500" />
          Create New File
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block uppercase tracking-wider">File Name</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="my-awesome-file"
              className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded text-sm focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-500"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block uppercase tracking-wider">Extension</label>
            <select
              value={extension}
              onChange={(e) => setExtension(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
            >
              {extensions.map(ext => (
                <option key={ext} value={ext} className="bg-slate-800">.{ext}</option>
              ))}
            </select>
          </div>

          {parentPath.length > 0 && (
            <div className="text-xs text-slate-400 bg-slate-800/50 p-3 rounded border border-slate-700/50">
              <span className="font-semibold text-slate-300">Path:</span>{' '}
              <span className="font-mono text-slate-400">/{parentPath.join('/')}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCreate}
              className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm font-semibold transition-all modern-button"
            >
              Create File
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded text-sm font-medium transition-all modern-button"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CreateFolderModal({ onClose, onCreate, parentPath }) {
  const [folderName, setFolderName] = useState('');

  const handleCreate = () => {
    if (folderName.trim()) {
      onCreate(folderName, parentPath);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="glass-strong rounded-lg p-4 sm:p-6 max-w-md w-full border border-slate-700/60"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-slate-200">
          <FolderPlus className="w-5 h-5 text-slate-400" />
          Create New Folder
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block uppercase tracking-wider">Folder Name</label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="my-awesome-folder"
              className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded text-sm focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-500"
              autoFocus
            />
          </div>

          {parentPath.length > 0 ? (
            <div className="text-xs text-slate-400 bg-slate-800/50 p-3 rounded border border-slate-700/50">
              <span className="font-semibold text-slate-300">Path:</span>{' '}
              <span className="font-mono text-slate-400">/{parentPath.join('/')}</span>
            </div>
          ) : (
            <div className="text-xs text-slate-400 bg-slate-800/50 p-3 rounded border border-slate-700/50">
              <span className="font-semibold text-slate-300">Path:</span>{' '}
              <span className="font-mono text-slate-400">/root</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCreate}
              className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm font-semibold transition-all modern-button"
            >
              Create Folder
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded text-sm font-medium transition-all modern-button"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function RenameModal({ item, onClose, onRename }) {
  const [newName, setNewName] = useState(item?.name || '');

  const handleRename = () => {
    if (newName.trim() && newName !== item?.name) {
      onRename(newName);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="glass-strong rounded-lg p-4 sm:p-6 max-w-md w-full border border-slate-700/60"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-slate-200">
          <Edit2 className="w-5 h-5 text-slate-400" />
          Rename {item?.type === 'folder' ? 'Folder' : 'File'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block uppercase tracking-wider">New Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-600/50 rounded text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleRename}
              className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm font-semibold transition-all modern-button"
            >
              Rename
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded text-sm font-medium transition-all modern-button"
            >
              Cancel
            </button>
          </div>
        </div>
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
      className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="glass-strong rounded-lg p-4 sm:p-6 max-w-md w-full border border-red-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-red-400">
          <AlertTriangle className="w-5 h-5" />
          Delete {item?.type === 'folder' ? 'Folder' : 'File'}
        </h3>

        <p className="text-sm text-slate-300 mb-5 leading-relaxed">
          Are you sure you want to delete <span className="font-semibold text-slate-200 bg-slate-800/50 px-2 py-0.5 rounded">"{item?.name}"</span>?
          {item?.type === 'folder' && (
            <span className="block mt-3 text-red-400 font-medium text-xs sm:text-sm">This will delete all contents inside this folder.</span>
          )}
          <span className="block mt-3 text-xs text-slate-500">This action cannot be undone.</span>
        </p>

        <div className="flex gap-3">
          <button
            onClick={onDelete}
            className="flex-1 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm font-semibold border border-red-500/30 transition-all modern-button"
          >
            Delete Forever
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded text-sm font-medium transition-all modern-button"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}