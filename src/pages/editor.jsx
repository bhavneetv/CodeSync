import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Save, Upload, Users, Settings, Plus, FolderPlus, Edit2, Trash2,
  ChevronRight, ChevronDown, File, Folder, X, Menu, Terminal as TerminalIcon,
  Maximize2, Minimize2, AlertTriangle, Crown, Shield, UserCircle, LogOut,
  FileCode, FileJson, FileText, Image as ImageIcon, Database
} from 'lucide-react';
import Editor from '@monaco-editor/react';
// import { getRoomFiles, buildFileTreeFromDB } from '../function/files/create-file';
import { getRoomFiles, buildFileTree, readEncryptedFile } from '../function/files/create-file';
import { get } from 'lodash';

// Modern file type icons mapping
const fileIcons = {
  js: { icon: FileCode, color: 'text-yellow-400' },
  jsx: { icon: FileCode, color: 'text-cyan-400' },
  ts: { icon: FileCode, color: 'text-blue-500' },
  tsx: { icon: FileCode, color: 'text-cyan-500' },
  py: { icon: FileCode, color: 'text-green-400' },
  java: { icon: FileCode, color: 'text-orange-500' },
  cpp: { icon: FileCode, color: 'text-purple-400' },
  c: { icon: FileCode, color: 'text-purple-400' },
  html: { icon: FileCode, color: 'text-orange-400' },
  css: { icon: FileCode, color: 'text-pink-400' },
  json: { icon: FileJson, color: 'text-yellow-300' },
  md: { icon: FileText, color: 'text-blue-300' },
  txt: { icon: FileText, color: 'text-gray-400' },
  png: { icon: ImageIcon, color: 'text-purple-300' },
  jpg: { icon: ImageIcon, color: 'text-purple-300' },
  svg: { icon: ImageIcon, color: 'text-green-300' },
  sql: { icon: Database, color: 'text-red-400' },
  default: { icon: File, color: 'text-gray-400' }
};

const getFileIcon = (filename) => {
  const ext = filename.split('.').pop();
  const iconData = fileIcons[ext] || fileIcons.default;
  const IconComponent = iconData.icon;
  return <IconComponent className={`w-4 h-4 ${iconData.color}`} />;
};

// Initial file tree structure
let initialFileTree = {
  name: 'my-project',
  type: 'folder',
  isExpanded: true,
  children: [
    {
      name: 'src',
      type: 'folder',
      isExpanded: false,
      children: [
        { name: 'index.js', type: 'file', content: '// Main entry point\nconsole.log("Hello World");' },
        { name: 'App.jsx', type: 'file', content: 'import React from "react";\n\nfunction App() {\n  return <div>Hello React</div>;\n}\n\nexport default App;' },
        { name: 'styles.css', type: 'file', content: '* {\n  margin: 0;\n  padding: 0;\n}' }
      ]
    },
    {
      name: 'public',
      type: 'folder',
      isExpanded: false,
      children: [
        { name: 'index.html', type: 'file', content: '<!DOCTYPE html>\n<html>\n  <head>\n    <title>My App</title>\n  </head>\n  <body>\n    <div id="root"></div>\n  </body>\n</html>' }
      ]
    },
    { name: 'README.md', type: 'file', content: '# My Project\n\nWelcome to my project!' },
    { name: 'package.json', type: 'file', content: '{\n  "name": "my-project",\n  "version": "1.0.0"\n}' }
  ]
};

// Mock users data
const mockUsers = [
  { id: 1, name: 'Alice Cooper', role: 'owner', online: true, avatar: '👩‍💻' },
  { id: 2, name: 'Bob Wilson', role: 'admin', online: true, avatar: '👨‍💼' },
  { id: 3, name: 'Charlie Brown', role: 'editor', online: false, avatar: '👨‍🎨' },
  { id: 4, name: 'Guest User', role: 'guest', online: true, avatar: '👤' }
];

export default function CodeEditorPage() {
  const [roomType, setRoomType] = useState('collaborative'); // 'solo', 'temporary', 'collaborative'
  const [roomName, setRoomName] = useState('Project CodeSpace');
  const [isEditingRoomName, setIsEditingRoomName] = useState(false);
  const [activeFile, setActiveFile] = useState(null);
  const [editorContent, setEditorContent] = useState('');
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [terminalHeight, setTerminalHeight] = useState(200);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [users, setUsers] = useState(mockUsers);
  const [ownerOnline, setOwnerOnline] = useState(true);

  // Modal states
  const [createFileModal, setCreateFileModal] = useState({ show: false, parentPath: [] });
  const [createFolderModal, setCreateFolderModal] = useState({ show: false, parentPath: [] });
  const [renameModal, setRenameModal] = useState({ show: false, item: null, path: [] });
  const [deleteModal, setDeleteModal] = useState({ show: false, item: null, path: [] });

  const [fileTree, setFileTree] = useState(initialFileTree);

  const editorRef = useRef(null);

  const roomLink = new URLSearchParams(window.location.search).get("roomId");

  useEffect(() => {
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
  }, [roomLink]);

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

  // Open file in editor
  const openFile = async (fileNode) => {
    if (activeFile && activeFile.id === fileNode.id) return;

    // show loading
    setActiveFile({
      id: fileNode.id,
      name: fileNode.name,
      fullPath: fileNode.fullPath,
    });

    setEditorContent("// Loading...");

    try {
      const content = await readEncryptedFile(fileNode.fullPath);

      setActiveFile({
        id: fileNode.id,
        name: fileNode.name,
        fullPath: fileNode.fullPath,
      });

      setEditorContent(content);
    } catch (err) {
      console.error("Open file failed:", err);
      setEditorContent("// Failed to load file");
    }
  };

  // Handle editor mount
  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;

    editor.onDidChangeCursorPosition((e) => {
      setCursorPosition({
        line: e.position.lineNumber,
        column: e.position.column,
      });
    });
  };

  // Handle editor content change
  const handleEditorChange = (value) => {
    setEditorContent(value);
  };

  // Create new file
  const handleCreateFile = (fileName, extension, parentPath) => {
    console.log('Creating file:', { fileName, extension, parentPath });
    setCreateFileModal({ show: false, parentPath: [] });
  };

  // Create new folder
  const handleCreateFolder = (folderName, parentPath) => {
    console.log('Creating folder:', { folderName, parentPath });
    setCreateFolderModal({ show: false, parentPath: [] });
  };

  // Rename file/folder
  const handleRename = (newName) => {
    console.log('Renaming:', { oldName: renameModal.item?.name, newName, path: renameModal.path });
    setRenameModal({ show: false, item: null, path: [] });
  };

  // Delete file/folder
  const handleDelete = () => {
    console.log('Deleting:', { name: deleteModal.item?.name, path: deleteModal.path });
    setDeleteModal({ show: false, item: null, path: [] });
  };

  // User actions
  const handleKickUser = (userId) => {
    console.log('Kicking user:', userId);
  };

  const handleMakeAdmin = (userId) => {
    console.log('Making admin:', userId);
  };

  // Room actions
  const handleRun = () => {
    console.log('Running code...');
  };

  const handleSave = () => {
    console.log('Saving code...');
  };

  const handlePushGitHub = () => {
    console.log('Pushing to GitHub...');
  };

  const handleDeleteRoom = () => {
    console.log('Deleting room...');
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-slate-100 font-['Inter',sans-serif]">
      {/* Modern styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        .glass {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(100, 116, 139, 0.15);
        }
        
        .glass-strong {
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(100, 116, 139, 0.2);
        }

        .monaco-editor-background {
          background-color: #0f172a !important;
        }

        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.4);
          border-radius: 5px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.6);
          border-radius: 5px;
          border: 2px solid rgba(15, 23, 42, 0.4);
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.8);
        }
      `}</style>

      {/* Header */}
      <header className="glass-strong border-b border-slate-700/30 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={() => setShowFileExplorer(!showFileExplorer)}
            className="lg:hidden p-2 hover:bg-violet-500/20 rounded-lg transition-all duration-200"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              {isEditingRoomName ? (
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  onBlur={() => setIsEditingRoomName(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingRoomName(false)}
                  className="bg-violet-500/20 border border-violet-400/40 rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none focus:border-violet-400 transition-all"
                  autoFocus
                />
              ) : (
                <h1 className="text-sm md:text-lg font-bold flex items-center gap-2">
                  {roomName}
                  <button
                    onClick={() => setIsEditingRoomName(true)}
                    className="text-slate-400 hover:text-violet-400 transition-colors"
                  >
                    <Edit2 className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
                </h1>
              )}

              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roomType === 'solo' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                  roomType === 'temporary' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                {roomType.charAt(0).toUpperCase() + roomType.slice(1)}
              </span>
            </div>

            {roomType === 'temporary' && (
              <div className="flex items-center gap-1 text-xs text-amber-400 mt-1">
                <AlertTriangle className="w-3 h-3" />
                <span className="hidden sm:inline">This room will be deleted after 24 hours</span>
                <span className="sm:hidden">Expires in 24h</span>
              </div>
            )}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="text-center">
            <p className="text-xs text-slate-400">Owner</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Alice Cooper</p>
              {!ownerOnline && (
                <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-300 rounded border border-red-500/30">Offline</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRun}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 text-emerald-300 rounded-lg transition-all duration-200 border border-emerald-500/30 group"
          >
            <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="hidden md:inline text-sm font-semibold">Run</span>
          </button>

          <button
            onClick={handleSave}
            className="p-2 hover:bg-violet-500/20 rounded-lg transition-all duration-200 border border-transparent hover:border-violet-500/30"
            title="Save"
          >
            <Save className="w-4 h-4" />
          </button>

          <button
            onClick={handlePushGitHub}
            disabled={roomType === 'solo' || roomType === 'temporary'}
            className={`p-2 rounded-lg transition-all duration-200 ${roomType === 'solo' || roomType === 'temporary'
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:bg-violet-500/20 border border-transparent hover:border-violet-500/30'
              }`}
            title="Push to GitHub"
          >
            <Upload className="w-4 h-4" />
          </button>

          {roomType !== 'solo' && (
            <button
              onClick={() => setShowUsersModal(true)}
              className="flex items-center gap-2 p-2 hover:bg-violet-500/20 rounded-lg transition-all duration-200 relative border border-transparent hover:border-violet-500/30"
              title="Users"
            >
              <Users className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
                {users.filter(u => u.online).length}
              </span>
            </button>
          )}

          <button
            onClick={() => setShowSettingsPanel(true)}
            className="p-2 hover:bg-violet-500/20 rounded-lg transition-all duration-200 border border-transparent hover:border-violet-500/30"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* File Explorer Sidebar */}
        <AnimatePresence>
          {showFileExplorer && (
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full lg:w-64 glass-strong border-r border-slate-700/30 flex flex-col absolute lg:relative h-full z-40 lg:z-0 shadow-2xl"
            >
              {/* File Explorer Header */}
              <div className="p-3 border-b border-slate-700/30 flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Explorer</h2>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCreateFileModal({ show: true, parentPath: [] })}
                    className="p-1.5 hover:bg-violet-500/20 rounded-lg transition-all duration-200 border border-transparent hover:border-violet-500/30"
                    title="New File"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1.5 hover:bg-violet-500/20 rounded-lg transition-all duration-200 border border-transparent hover:border-violet-500/30"
                    title="New Folder"
                    onClick={() => setCreateFolderModal({ show: true, parentPath: [] })}
                  >
                    <FolderPlus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* File Tree */}
              <div className="flex-1 overflow-y-auto p-2">
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
                />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tab Bar */}
          {activeFile && (
            <div className="glass border-b border-slate-700/30 px-4 py-2 flex items-center gap-2">
              {getFileIcon(activeFile.name)}
              <span className="text-sm font-medium">{activeFile.name}</span>
              <button className="ml-auto p-1 hover:bg-red-500/20 rounded transition-all duration-200 border border-transparent hover:border-red-500/30">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Monaco Editor */}
          <div className="flex-1 relative">
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
                  fontFamily: 'JetBrains Mono, monospace',
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  lineNumbers: 'on',
                  renderWhitespace: 'selection',
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  padding: { top: 16, bottom: 16 },
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <File className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-semibold">No file selected</p>
                  <p className="text-sm mt-2">
                    Open a file from the explorer to start editing
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="glass-strong border-t border-slate-700/30 px-4 py-1.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
              {activeFile && (
                <span className="text-slate-400">
                  {activeFile.name.split('.').pop().toUpperCase()}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowTerminal(!showTerminal)}
              className="flex items-center gap-2 px-2 py-1 hover:bg-violet-500/20 rounded-lg transition-all duration-200 border border-transparent hover:border-violet-500/30"
            >
              <TerminalIcon className="w-3 h-3" />
              <span>Terminal</span>
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
                className="glass-strong border-t border-slate-700/30 flex flex-col overflow-hidden"
              >
                <div className="px-4 py-2 border-b border-slate-700/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TerminalIcon className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-semibold">Terminal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTerminalHeight(terminalHeight === 200 ? 400 : 200)}
                      className="p-1 hover:bg-violet-500/20 rounded transition-all duration-200 border border-transparent hover:border-violet-500/30"
                    >
                      {terminalHeight === 200 ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setShowTerminal(false)}
                      className="p-1 hover:bg-red-500/20 rounded transition-all duration-200 border border-transparent hover:border-red-500/30"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 font-mono text-sm text-emerald-400 bg-slate-950/50">
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

      {/* Users Modal */}
      <AnimatePresence>
        {showUsersModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setShowUsersModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="glass-strong rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-700/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-violet-400" />
                  Room Users
                </h3>
                <button
                  onClick={() => setShowUsersModal(false)}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-all duration-200 border border-transparent hover:border-red-500/30"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className={`p-4 rounded-xl transition-all ${user.online
                        ? 'bg-violet-500/10 border border-violet-500/30'
                        : 'bg-slate-500/10 border border-slate-500/20 opacity-60'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{user.avatar}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{user.name}</p>
                          {user.role === 'owner' && (
                            <Crown className="w-4 h-4 text-yellow-400" />
                          )}
                          {user.role === 'admin' && (
                            <Shield className="w-4 h-4 text-violet-400" />
                          )}
                          {user.role === 'guest' && (
                            <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">Guest</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 capitalize">{user.role}</p>
                      </div>
                      {user.online && (
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                      )}
                    </div>

                    {user.role !== 'owner' && user.online && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleKickUser(user.id)}
                          className="flex-1 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all duration-200 text-sm font-semibold flex items-center justify-center gap-2 border border-red-500/30"
                        >
                          <LogOut className="w-4 h-4" />
                          Kick
                        </button>
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleMakeAdmin(user.id)}
                            className="flex-1 px-3 py-1.5 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 rounded-lg transition-all duration-200 text-sm font-semibold flex items-center justify-center gap-2 border border-violet-500/30"
                          >
                            <Shield className="w-4 h-4" />
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
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettingsPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
              onClick={() => setShowSettingsPanel(false)}
            />
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 h-full w-full md:w-96 glass-strong border-l border-slate-700/30 z-50 p-6 overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Settings className="w-5 h-5 text-violet-400" />
                  Settings
                </h3>
                <button
                  onClick={() => setShowSettingsPanel(false)}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-all duration-200 border border-transparent hover:border-red-500/30"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-300 mb-2 block">Room Name</label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="w-full px-4 py-2 bg-violet-500/10 border border-violet-500/30 rounded-lg focus:outline-none focus:border-violet-400 transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-300 mb-2 block">Room Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-2 bg-violet-500/10 border border-violet-500/30 rounded-lg focus:outline-none focus:border-violet-400 transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-300 mb-2 block">Download Path</label>
                  <input
                    type="text"
                    value="/home/user/downloads"
                    readOnly
                    className="w-full px-4 py-2 bg-slate-700/30 border border-slate-600/30 rounded-lg opacity-60 cursor-not-allowed"
                  />
                </div>

                <button className="w-full px-4 py-2 bg-gradient-to-r from-violet-500/20 to-purple-500/20 hover:from-violet-500/30 hover:to-purple-500/30 text-violet-300 rounded-lg transition-all duration-200 font-semibold border border-violet-500/30">
                  Save Settings
                </button>

                <div className="border-t border-slate-700/30 pt-4 mt-6">
                  <button
                    onClick={handleDeleteRoom}
                    className="w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all duration-200 font-semibold flex items-center justify-center gap-2 border border-red-500/30"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Room
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create File Modal */}
      <AnimatePresence>
        {createFileModal.show && (
          <CreateFileModal
            onClose={() => setCreateFileModal({ show: false, parentPath: [] })}
            onCreate={handleCreateFile}
            parentPath={createFileModal.parentPath}
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
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
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

// File Tree Node Component - Fixed hover bug
function FileTreeNode({ node, path, onToggle, onOpenFile, activeFile, onRename, onDelete, onCreateFile, onCreateFolder, level = 0 }) {
  const isActive = activeFile?.id === node.id;
  const [showActions, setShowActions] = useState(false);

  if (node.type === 'folder') {
    return (
      <div className="select-none">
        <div
          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all group hover:bg-violet-500/10 ${node.isExpanded ? 'bg-violet-500/5' : ''
            }`}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
        >
          <button
            onClick={() => onToggle(path)}
            className="flex items-center gap-2 flex-1"
          >
            {node.isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
            <Folder className={`w-4 h-4 ${node.isExpanded ? 'text-violet-400' : 'text-slate-400'}`} />
            <span className="text-sm font-medium">{node.name}</span>
          </button>

          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateFile([...path, node.children?.length || 0]);
                  }}
                  className="p-1 hover:bg-emerald-500/20 rounded transition-all duration-200 border border-transparent hover:border-emerald-500/30"
                  title="New file in folder"
                >
                  <Plus className="w-3 h-3 text-emerald-400" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateFolder([...path, node.children?.length || 0]);
                  }}
                  className="p-1 hover:bg-blue-500/20 rounded transition-all duration-200 border border-transparent hover:border-blue-500/30"
                  title="New folder in folder"
                >
                  <FolderPlus className="w-3 h-3 text-blue-400" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRename(node, path);
                  }}
                  className="p-1 hover:bg-violet-500/20 rounded transition-all duration-200 border border-transparent hover:border-violet-500/30"
                  title="Rename"
                >
                  <Edit2 className="w-3 h-3 text-violet-400" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(node, path);
                  }}
                  className="p-1 hover:bg-red-500/20 rounded transition-all duration-200 border border-transparent hover:border-red-500/30"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3 text-red-400" />
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
      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all group ${isActive ? 'bg-violet-500/20 border border-violet-500/40' : 'hover:bg-violet-500/10'
        }`}
      style={{ paddingLeft: `${level * 12 + 8}px` }}
      onClick={() => onOpenFile(node)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {getFileIcon(node.name)}
      <span className={`text-sm flex-1 ${isActive ? 'font-semibold text-violet-300' : 'text-slate-300'}`}>
        {node.name}
      </span>

      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRename(node, path);
              }}
              className="p-1 hover:bg-violet-500/20 rounded transition-all duration-200 border border-transparent hover:border-violet-500/30"
              title="Rename"
            >
              <Edit2 className="w-3 h-3 text-violet-400" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(node, path);
              }}
              className="p-1 hover:bg-red-500/20 rounded transition-all duration-200 border border-transparent hover:border-red-500/30"
              title="Delete"
            >
              <Trash2 className="w-3 h-3 text-red-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Create File Modal Component
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
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="glass-strong rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-700/30"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-emerald-400" />
          Create New File
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-300 mb-2 block">File Name</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="my-file"
              className="w-full px-4 py-2 bg-violet-500/10 border border-violet-500/30 rounded-lg focus:outline-none focus:border-violet-400 transition-all"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-300 mb-2 block">Extension</label>
            <select
              value={extension}
              onChange={(e) => setExtension(e.target.value)}
              className="w-full px-4 py-2 bg-violet-500/10 border border-violet-500/30 rounded-lg focus:outline-none focus:border-violet-400 transition-all"
            >
              {extensions.map(ext => (
                <option key={ext} value={ext}>{ext}</option>
              ))}
            </select>
          </div>

          {parentPath.length > 0 && (
            <div className="text-sm text-slate-400 bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
              <span className="font-semibold text-violet-400">Path:</span>{' '}
              <span className="font-mono text-blue-400">/{parentPath.join('/')}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 text-emerald-300 rounded-lg transition-all duration-200 font-semibold border border-emerald-500/30"
            >
              Create
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-500/20 hover:bg-slate-500/30 text-slate-300 rounded-lg transition-all duration-200 font-semibold border border-slate-500/30"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Create Folder Modal Component
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
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="glass-strong rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-700/30"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FolderPlus className="w-5 h-5 text-blue-400" />
          Create New Folder
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-300 mb-2 block">Folder Name</label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="my-folder"
              className="w-full px-4 py-2 bg-violet-500/10 border border-violet-500/30 rounded-lg focus:outline-none focus:border-violet-400 transition-all"
              autoFocus
            />
          </div>

          {parentPath.length > 0 ? (
            <div className="text-sm text-slate-400 bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
              <span className="font-semibold text-violet-400">Path:</span>{' '}
              <span className="font-mono text-blue-400">/{parentPath.join('/')}</span>
            </div>
          ) : (
            <div className="text-sm text-slate-400 bg-slate-800/30 p-3 rounded-lg border border-slate-700/30">
              <span className="font-semibold text-violet-400">Path:</span>{' '}
              <span className="font-mono text-blue-400">/root</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-violet-500/20 hover:from-blue-500/30 hover:to-violet-500/30 text-blue-300 rounded-lg transition-all duration-200 font-semibold border border-blue-500/30"
            >
              Create
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-500/20 hover:bg-slate-500/30 text-slate-300 rounded-lg transition-all duration-200 font-semibold border border-slate-500/30"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Rename Modal Component
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
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="glass-strong rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-700/30"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Edit2 className="w-5 h-5 text-violet-400" />
          Rename {item?.type === 'folder' ? 'Folder' : 'File'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-300 mb-2 block">New Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              className="w-full px-4 py-2 bg-violet-500/10 border border-violet-500/30 rounded-lg focus:outline-none focus:border-violet-400 transition-all"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRename}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-violet-500/20 to-purple-500/20 hover:from-violet-500/30 hover:to-purple-500/30 text-violet-300 rounded-lg transition-all duration-200 font-semibold border border-violet-500/30"
            >
              Rename
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-500/20 hover:bg-slate-500/30 text-slate-300 rounded-lg transition-all duration-200 font-semibold border border-slate-500/30"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Delete Confirmation Modal Component
function DeleteModal({ item, onClose, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="glass-strong rounded-2xl p-6 max-w-md w-full shadow-2xl border-2 border-red-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-400">
          <AlertTriangle className="w-5 h-5" />
          Delete {item?.type === 'folder' ? 'Folder' : 'File'}
        </h3>

        <p className="text-slate-300 mb-6">
          Are you sure you want to delete <span className="font-bold text-white">"{item?.name}"</span>?
          {item?.type === 'folder' && (
            <span className="block mt-2 text-red-400">This will delete all contents inside this folder.</span>
          )}
          <span className="block mt-2 text-sm text-slate-400">This action cannot be undone.</span>
        </p>

        <div className="flex gap-3">
          <button
            onClick={onDelete}
            className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all duration-200 font-semibold border border-red-500/30"
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-500/20 hover:bg-slate-500/30 text-slate-300 rounded-lg transition-all duration-200 font-semibold border border-slate-500/30"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
} 