import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Save, Upload, Users, Settings, Plus, Edit2, Trash2, 
  File, Folder, ChevronRight, ChevronDown, X, Menu, Terminal as TerminalIcon,
  FileCode, Crown, Eye, Wifi, WifiOff, AlertTriangle, Check, FolderOpen
} from 'lucide-react';
import Editor from '@monaco-editor/react';

const CodeEditorPage = () => {
  // Room state
  const [roomType, setRoomType] = useState('collaborative'); // solo, temporary, collaborative
  const [roomName, setRoomName] = useState('My Coding Room');
  const [isOwner, setIsOwner] = useState(true);
  const [ownerOnline, setOwnerOnline] = useState(true);

  // UI state
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // File management
  const [files, setFiles] = useState([
    { id: 1, name: 'main.py', type: 'file', content: '# Write your Python code here\nprint("Hello, World!")', language: 'python' },
    { id: 2, name: 'utils.js', type: 'file', content: '// JavaScript utilities\nfunction hello() {\n  console.log("Hello");\n}', language: 'javascript' },
    { id: 3, name: 'styles.css', type: 'file', content: '/* Styles */\nbody {\n  margin: 0;\n  padding: 0;\n}', language: 'css' }
  ]);
  const [activeFile, setActiveFile] = useState(files[0]);
  const [expandedFolders, setExpandedFolders] = useState({});

  // File action modals
  const [showAddFileModal, setShowAddFileModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFileForAction, setSelectedFileForAction] = useState(null);

  // Editor state
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const editorRef = useRef(null);

  // Users
  const [onlineUsers] = useState([
    { id: 1, name: 'John Doe', role: 'owner', avatar: '👨‍💻' },
    { id: 2, name: 'Jane Smith', role: 'editor', avatar: '👩‍💻' },
    { id: 3, name: 'Bob Wilson', role: 'viewer', avatar: '👨‍🎓' },
    { id: 4, name: 'Alice Brown', role: 'editor', avatar: '👩‍🔬' }
  ]);

  // Settings
  const [settingsData, setSettingsData] = useState({
    roomName: 'My Coding Room',
    password: '••••••',
    downloadPath: '/downloads/code'
  });

  // Terminal output
  const [terminalOutput] = useState([
    '> Welcome to CodeSync Terminal',
    '> Python 3.11.0',
    '> Ready to execute code...'
  ]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
    editor.onDidChangeCursorPosition((e) => {
      setCursorPosition({
        line: e.position.lineNumber,
        column: e.position.column
      });
    });
  };

  const handleEditorChange = (value) => {
    setActiveFile(prev => ({ ...prev, content: value }));
    setFiles(prev => prev.map(f => f.id === activeFile.id ? { ...f, content: value } : f));
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop();
    const icons = {
      py: '🐍', js: '⚡', css: '🎨', html: '🌐', 
      java: '☕', cpp: '➕', c: '©️', json: '📋'
    };
    return icons[ext] || '📄';
  };

  const handleRunCode = () => {
    console.log('Running code:', activeFile.name);
    setShowTerminal(true);
  };

  const handleSave = () => {
    console.log('Saving file:', activeFile.name, activeFile.content);
  };

  const handlePushGithub = () => {
    console.log('Pushing to GitHub');
  };

  const handleAddFile = (fileName, extension) => {
    const newFile = {
      id: Date.now(),
      name: `${fileName}${extension}`,
      type: 'file',
      content: '',
      language: extension.replace('.', '')
    };
    setFiles([...files, newFile]);
    console.log('Created file:', newFile);
    setShowAddFileModal(false);
  };

  const handleRenameFile = (newName) => {
    console.log('Renaming file:', selectedFileForAction.name, 'to:', newName);
    setShowRenameModal(false);
  };

  const handleDeleteFile = () => {
    console.log('Deleting file:', selectedFileForAction.name);
    setFiles(files.filter(f => f.id !== selectedFileForAction.id));
    if (activeFile.id === selectedFileForAction.id && files.length > 1) {
      setActiveFile(files.find(f => f.id !== selectedFileForAction.id));
    }
    setShowDeleteModal(false);
  };

  const handleKickUser = (user) => {
    console.log('Kicking user:', user.name);
  };

  const handleMakeOwner = (user) => {
    console.log('Making owner:', user.name);
  };

  const handleDeleteRoom = () => {
    console.log('Delete room');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-950 to-gray-950 text-white font-sans flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-black/40 border-b border-white/10">
        <div className="px-4 py-3 flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-3">
            {isMobile && (
              <button
                onClick={() => setShowFileExplorer(!showFileExplorer)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-lg">{roomName}</span>
                {isOwner && (
                  <button className="p-1 hover:bg-white/10 rounded transition-all">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  roomType === 'solo' ? 'bg-purple-500/20 text-purple-300' :
                  roomType === 'temporary' ? 'bg-orange-500/20 text-orange-300' :
                  'bg-blue-500/20 text-blue-300'
                }`}>
                  {roomType === 'solo' ? 'Solo' : roomType === 'temporary' ? 'Temporary' : 'Collaborative'}
                </span>
                {roomType === 'temporary' && (
                  <span className="text-xs text-orange-400 flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Expires in 24h
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Center Section */}
          {!isMobile && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Owner: John Doe</span>
              {!ownerOnline && (
                <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-300 rounded-full flex items-center">
                  <WifiOff className="w-3 h-3 mr-1" />
                  Offline
                </span>
              )}
            </div>
          )}

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRunCode}
              className="px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg font-medium flex items-center space-x-2 shadow-lg transition-all"
              title="Run Code"
            >
              <Play className="w-4 h-4" />
              {!isMobile && <span className="text-sm">Run</span>}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              className="p-2 hover:bg-white/10 rounded-lg transition-all"
              title="Save"
            >
              <Save className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePushGithub}
              disabled={roomType === 'solo' || roomType === 'temporary'}
              className="p-2 hover:bg-white/10 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              title="Push to GitHub"
            >
              <Upload className="w-4 h-4" />
            </motion.button>

            {roomType !== 'solo' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowUsersModal(true)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all relative"
                title="Online Users"
              >
                <Users className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {onlineUsers.length}
                </span>
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettingsPanel(true)}
              className="p-2 hover:bg-white/10 rounded-lg transition-all"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        <AnimatePresence>
          {(showFileExplorer || !isMobile) && (
            <motion.aside
              initial={isMobile ? { x: -300 } : false}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25 }}
              className={`${isMobile ? 'absolute inset-y-0 left-0 z-30' : 'relative'} w-64 backdrop-blur-xl bg-black/30 border-r border-white/10`}
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <span className="font-semibold text-sm">FILES</span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setShowAddFileModal(true)}
                    className="p-1.5 hover:bg-white/10 rounded transition-all"
                    title="Add File"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFileForAction(activeFile);
                      setShowRenameModal(true);
                    }}
                    className="p-1.5 hover:bg-white/10 rounded transition-all"
                    title="Rename"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFileForAction(activeFile);
                      setShowDeleteModal(true);
                    }}
                    className="p-1.5 hover:bg-red-500/20 rounded transition-all text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-2 overflow-y-auto h-full">
                {files.map(file => (
                  <motion.button
                    key={file.id}
                    whileHover={{ x: 2 }}
                    onClick={() => setActiveFile(file)}
                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-left ${
                      activeFile.id === file.id
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'hover:bg-white/5 text-gray-300'
                    }`}
                  >
                    <span className="text-lg">{getFileIcon(file.name)}</span>
                    <span className="text-sm font-medium flex-1 truncate">{file.name}</span>
                  </motion.button>
                ))}
              </div>

              {isMobile && (
                <button
                  onClick={() => setShowFileExplorer(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Code Editor */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative">
            <Editor
              height="100%"
              language={activeFile.language}
              value={activeFile.content}
              onChange={handleEditorChange}
              onMount={handleEditorMount}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: !isMobile },
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on'
              }}
            />
          </div>

          {/* Status Bar */}
          <div className="backdrop-blur-xl bg-black/40 border-t border-white/10 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center space-x-4">
              <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">
                {activeFile.language.toUpperCase()}
              </span>
            </div>
            <button
              onClick={() => setShowTerminal(!showTerminal)}
              className="flex items-center space-x-1 hover:text-white transition-colors"
            >
              <TerminalIcon className="w-3.5 h-3.5" />
              <span>Terminal</span>
            </button>
          </div>

          {/* Terminal */}
          <AnimatePresence>
            {showTerminal && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 200 }}
                exit={{ height: 0 }}
                className="backdrop-blur-xl bg-black/50 border-t border-white/10 overflow-hidden"
              >
                <div className="p-4 h-full overflow-y-auto font-mono text-sm">
                  {terminalOutput.map((line, i) => (
                    <div key={i} className="text-green-400 mb-1">{line}</div>
                  ))}
                  <div className="text-gray-500 mt-2">█</div>
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowUsersModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Online Members</h3>
                <button
                  onClick={() => setShowUsersModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                {onlineUsers.map(user => (
                  <UserCard
                    key={user.id}
                    user={user}
                    isOwner={isOwner}
                    ownerOnline={ownerOnline}
                    onKick={handleKickUser}
                    onMakeOwner={handleMakeOwner}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add File Modal */}
      <FileModal
        show={showAddFileModal}
        onClose={() => setShowAddFileModal(false)}
        onSubmit={handleAddFile}
        title="Create New File"
        type="add"
      />

      {/* Rename Modal */}
      <RenameModal
        show={showRenameModal}
        onClose={() => setShowRenameModal(false)}
        onSubmit={handleRenameFile}
        currentName={selectedFileForAction?.name}
      />

      {/* Delete Confirmation */}
      <DeleteModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteFile}
        fileName={selectedFileForAction?.name}
      />

      {/* Settings Panel */}
      <SettingsPanel
        show={showSettingsPanel}
        onClose={() => setShowSettingsPanel(false)}
        settings={settingsData}
        onDelete={handleDeleteRoom}
      />
    </div>
  );
};

// User Card Component
const UserCard = ({ user, isOwner, ownerOnline, onKick, onMakeOwner }) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-xl">
          {user.avatar}
        </div>
        <div className="flex-1">
          <div className="font-medium">{user.name}</div>
          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              user.role === 'owner' ? 'bg-yellow-500/20 text-yellow-300' :
              user.role === 'editor' ? 'bg-blue-500/20 text-blue-300' :
              'bg-gray-500/20 text-gray-300'
            }`}>
              {user.role === 'owner' && <Crown className="w-3 h-3 inline mr-1" />}
              {user.role === 'editor' && <Edit2 className="w-3 h-3 inline mr-1" />}
              {user.role === 'viewer' && <Eye className="w-3 h-3 inline mr-1" />}
              {user.role}
            </span>
          </div>
        </div>

        {showActions && isOwner && user.role !== 'owner' && (
          <div className="flex space-x-1">
            <button
              onClick={() => onKick(user)}
              className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400 transition-all"
              title="Kick User"
            >
              <X className="w-4 h-4" />
            </button>
            {!ownerOnline && (
              <button
                onClick={() => onMakeOwner(user)}
                className="p-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 rounded text-yellow-400 transition-all"
                title="Make Owner"
              >
                <Crown className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// File Modal Component
const FileModal = ({ show, onClose, onSubmit, title, type }) => {
  const [fileName, setFileName] = useState('');
  const [extension, setExtension] = useState('.py');

  const extensions = [
    { label: 'Python', value: '.py' },
    { label: 'JavaScript', value: '.js' },
    { label: 'CSS', value: '.css' },
    { label: 'HTML', value: '.html' },
    { label: 'Java', value: '.java' },
    { label: 'C++', value: '.cpp' }
  ];

  const handleSubmit = () => {
    if (fileName.trim()) {
      onSubmit(fileName, extension);
      setFileName('');
      setExtension('.py');
    }
  };

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
      >
        <h3 className="text-xl font-bold mb-4">{title}</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-400">File Name</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Enter file name"
              className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-400">Extension</label>
            <select
              value={extension}
              onChange={(e) => setExtension(e.target.value)}
              className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {extensions.map(ext => (
                <option key={ext.value} value={ext.value}>{ext.label} ({ext.value})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-white/5 hover:bg-white/10 rounded-lg font-medium transition-all border border-white/10"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={!fileName.trim()}
            className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-medium transition-all shadow-lg disabled:opacity-50"
          >
            Create
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Rename Modal
const RenameModal = ({ show, onClose, onSubmit, currentName }) => {
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (show && currentName) {
      setNewName(currentName);
    }
  }, [show, currentName]);

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
      >
        <h3 className="text-xl font-bold mb-4">Rename File</h3>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          autoFocus
        />
        <div className="flex space-x-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-white/5 hover:bg-white/10 rounded-lg font-medium transition-all border border-white/10"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSubmit(newName)}
            className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-medium transition-all shadow-lg"
          >
            Rename
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Delete Modal
const DeleteModal = ({ show, onClose, onConfirm, fileName }) => {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
      >
        <h3 className="text-xl font-bold mb-4">Delete File</h3>
        <p className="text-gray-400 mb-6">
          Are you sure you want to delete <span className="text-white font-semibold">{fileName}</span>? This action cannot be undone.
        </p>
        <div className="flex space-x-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-white/5 hover:bg-white/10 rounded-lg font-medium transition-all border border-white/10"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onConfirm}
            className="flex-1 py-2 px-4 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 rounded-lg font-medium transition-all shadow-lg"
          >
            Delete
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Settings Panel
const SettingsPanel = ({ show, onClose, settings, onDelete }) => {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Room Settings</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-400">Room Name</label>
            <input
              type="text"
              value={settings.roomName}
              readOnly
              className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-400">Password</label>
            <input
              type="password"
              value={settings.password}
              readOnly
              className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-400">Download Path</label>
            <input
              type="text"
              value={settings.downloadPath}
              readOnly
              className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/10">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onDelete}
            className="w-full py-2 px-4 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 rounded-lg font-medium transition-all shadow-lg flex items-center justify-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Room</span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CodeEditorPage;