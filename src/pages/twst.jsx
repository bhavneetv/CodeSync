import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Save, Users, Settings, Plus, FolderPlus, Edit2, Trash2,
  ChevronRight, ChevronDown, File, Folder, X, Menu, Terminal as TerminalIcon,
  Maximize2, Minimize2, AlertTriangle, Crown, Shield, LogOut,
  FileCode, FileJson, FileText, Github, UserCircle,
} from 'lucide-react';
import Editor from '@monaco-editor/react';

// ─── File type icons ───────────────────────────────────────────────────────
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
  default: { icon: File, color: 'text-slate-400' },
};

function getFileIcon(filename) {
  const ext = (filename || '').split('.').pop();
  const data = fileIcons[ext] || fileIcons.default;
  const Icon = data.icon;
  return <Icon className={`w-4 h-4 flex-shrink-0 ${data.color}`} />;
}

// ─── Mock data ─────────────────────────────────────────────────────────────
const MOCK_USERS = [
  { id: '1', name: 'Alice Cooper', role: 'owner', online: true },
  { id: '2', name: 'Bob Wilson', role: 'admin', online: true },
  { id: '3', name: 'Charlie Brown', role: 'editor', online: false },
  { id: '4', name: 'Guest User', role: 'guest', online: true },
];

const INITIAL_TREE = {
  id: 'root',
  name: 'my-project',
  type: 'folder',
  isExpanded: true,
  children: [
    {
      id: 'f1',
      name: 'src',
      type: 'folder',
      isExpanded: true,
      children: [
        { id: 'file1', name: 'App.jsx', type: 'file', content: '// App\n' },
        { id: 'file2', name: 'index.js', type: 'file', content: '// index\n' },
      ],
    },
    {
      id: 'f2',
      name: 'public',
      type: 'folder',
      isExpanded: false,
      children: [
        { id: 'file3', name: 'index.html', type: 'file', content: '<!DOCTYPE html>\n' },
      ],
    },
    { id: 'file4', name: 'package.json', type: 'file', content: '{\n  "name": "my-app"\n}\n' },
  ],
};

// ─── Helpers ───────────────────────────────────────────────────────────────
function updateTreeAtPath(tree, path, updater) {
  if (path.length === 0) return updater(tree);
  const [idx, ...rest] = path;
  return {
    ...tree,
    children: tree.children.map((child, i) =>
      i === idx ? updateTreeAtPath(child, rest, updater) : child
    ),
  };
}

function findPathById(node, id, path = []) {
  if (node.id === id) return path;
  if (!node.children) return null;
  for (let i = 0; i < node.children.length; i++) {
    const found = findPathById(node.children[i], id, [...path, i]);
    if (found) return found;
  }
  return null;
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function MainCodeEditorPage() {
  const [roomType, setRoomType] = useState('collaborative'); // solo | temporary | collaborative
  const [roomName, setRoomName] = useState('Project CodeSpace');
  const [isEditingRoomName, setIsEditingRoomName] = useState(false);
  const [ownerName] = useState('Alice Cooper');
  const [ownerOnline, setOwnerOnline] = useState(true);
  const [fileTree, setFileTree] = useState(INITIAL_TREE);
  const [activeFile, setActiveFile] = useState(null);
  const [editorContent, setEditorContent] = useState('');
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [terminalHeight, setTerminalHeight] = useState(220);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [users, setUsers] = useState(MOCK_USERS);

  const [createFileModal, setCreateFileModal] = useState({ open: false, parentPath: [] });
  const [renameModal, setRenameModal] = useState({ open: false, item: null, path: [] });
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null, path: [] });

  const editorRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const onlineCount = users.filter((u) => u.online).length;
  const isSolo = roomType === 'solo';
  const isTemporary = roomType === 'temporary';
  const showUsersButton = !isSolo;
  const githubDisabled = isSolo || isTemporary;

  const toggleFolder = (path) => {
    setFileTree((t) =>
      updateTreeAtPath(t, path, (node) => ({ ...node, isExpanded: !node.isExpanded }))
    );
  };

  const openFile = (node) => {
    if (node.type !== 'file') return;
    if (isMobile) setShowFileExplorer(false);
    setActiveFile(node);
    setEditorContent(node.content ?? '');
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
    editor.onDidChangeCursorPosition((e) => {
      const line = e.position.lineNumber;
      const column = e.position.column;
      setCursorPosition({ line, column });
      console.log({ line, column });
    });
  };

  const handleEditorChange = (value) => {
    setEditorContent(value ?? '');
    if (activeFile) setActiveFile((f) => ({ ...f, content: value ?? '' }));
  };

  const handleCreateFile = (fileName, extension, parentPath) => {
    const ext = extension.startsWith('.') ? extension : `.${extension}`;
    const fullName = fileName.includes('.') ? fileName : `${fileName}${ext}`;
    const newNode = {
      id: `file-${Date.now()}`,
      name: fullName,
      type: 'file',
      content: `// ${fullName}\n`,
    };
    setFileTree((t) => {
      if (parentPath.length === 0) {
        return { ...t, children: [...(t.children || []), newNode] };
      }
      return updateTreeAtPath(t, parentPath, (node) => ({
        ...node,
        children: [...(node.children || []), newNode],
      }));
    });
    setCreateFileModal({ open: false, parentPath: [] });
    console.log('Create file', { fileName: fullName, parentPath });
  };

  const handleRename = (newName) => {
    const { item, path } = renameModal;
    if (!item || !newName.trim()) {
      setRenameModal({ open: false, item: null, path: [] });
      return;
    }
    const resolvedPath = path.length > 0 ? path : findPathById(fileTree, item.id);
    if (resolvedPath == null) {
      setRenameModal({ open: false, item: null, path: [] });
      return;
    }
    setFileTree((t) =>
      updateTreeAtPath(t, resolvedPath, (node) => ({ ...node, name: newName.trim() }))
    );
    if (activeFile?.id === item.id) setActiveFile((f) => ({ ...f, name: newName.trim() }));
    setRenameModal({ open: false, item: null, path: [] });
    console.log('Rename', { from: item.name, to: newName.trim() });
  };

  const handleDelete = () => {
    const { item, path } = deleteModal;
    if (!item) {
      setDeleteModal({ open: false, item: null, path: [] });
      return;
    }
    const resolvedPath = path.length > 0 ? path : findPathById(fileTree, item.id);
    if (resolvedPath == null || resolvedPath.length === 0) {
      setDeleteModal({ open: false, item: null, path: [] });
      return;
    }
    const index = resolvedPath[resolvedPath.length - 1];
    const parentPath = resolvedPath.slice(0, -1);
    setFileTree((t) => {
      if (parentPath.length === 0) {
        return { ...t, children: (t.children || []).filter((_, i) => i !== index) };
      }
      return updateTreeAtPath(t, parentPath, (node) => ({
        ...node,
        children: (node.children || []).filter((_, i) => i !== index),
      }));
    });
    if (activeFile?.id === item.id) {
      setActiveFile(null);
      setEditorContent('');
    }
    setDeleteModal({ open: false, item: null, path: [] });
    console.log('Delete', { name: item.name });
  };

  const handleRun = () => console.log('Run');
  const handleSave = () => console.log('Save');
  const handlePushGitHub = () => console.log('Push to GitHub');
  const handleKickUser = (id) => console.log('Kick user', id);
  const handleMakeAdmin = (id) => console.log('Make admin', id);
  const handleDeleteRoom = () => console.log('Delete room');

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0f172a] text-slate-200 flex flex-col">
      {/* Global styles: dark blue glassmorphism, no black */}
      <style>{`
        .glass-nav {
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(59, 130, 246, 0.15);
        }
        .glass-panel {
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(59, 130, 246, 0.12);
        }
        .glass-modal {
          background: rgba(30, 41, 59, 0.95);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(59, 130, 246, 0.2);
        }
        .editor-bg {
          background-color: #1e293b !important;
        }
        .monaco-editor-background { background-color: #1e293b !important; }
      `}</style>

      {/* ─── HEADER ─────────────────────────────────────────────────────── */}
      <header className="glass-nav sticky top-0 z-50 px-3 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => setShowFileExplorer((v) => !v)}
          className="md:hidden p-2 rounded hover:bg-blue-900/20 text-slate-300"
          aria-label="Toggle explorer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center gap-2 min-w-0">
            {isEditingRoomName ? (
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                onBlur={() => setIsEditingRoomName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingRoomName(false)}
                className="bg-slate-800/60 border border-blue-700/40 rounded px-2 py-1 text-sm text-slate-100 w-32 sm:w-48 focus:outline-none focus:border-blue-500"
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingRoomName(true)}
                className="text-sm font-semibold text-slate-100 truncate hover:text-blue-300 transition-colors text-left max-w-[140px] sm:max-w-none"
                title={roomName}
              >
                {roomName}
              </button>
            )}
            <span className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
              roomType === 'solo' ? 'bg-slate-600/50 text-slate-400' :
              roomType === 'temporary' ? 'bg-amber-500/20 text-amber-400' :
              'bg-blue-500/20 text-blue-300'
            }`}>
              {roomType === 'solo' ? 'Solo' : roomType === 'temporary' ? 'Temporary' : 'Collaborative'}
            </span>
          </div>
          {isTemporary && (
            <p className="text-[10px] sm:text-xs text-amber-400/90 flex items-center gap-1 mt-0.5">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              This room will be deleted after 24 hours.
            </p>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 flex-shrink-0">
          <span className="truncate max-w-[100px]" title={ownerName}>{ownerName}</span>
          {!ownerOnline && (
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px]">Owner Offline</span>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleRun}
            className="p-2 rounded hover:bg-blue-900/20 text-emerald-400 transition-colors"
            title="Run"
          >
            <Play className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="p-2 rounded hover:bg-blue-900/20 text-slate-300 transition-colors"
            title="Save"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handlePushGitHub}
            disabled={githubDisabled}
            className={`p-2 rounded transition-colors ${githubDisabled ? 'text-slate-500 cursor-not-allowed' : 'hover:bg-blue-900/20 text-slate-300'}`}
            title="Push to GitHub"
          >
            <Github className="w-4 h-4" />
          </button>
          {showUsersButton && (
            <button
              type="button"
              onClick={() => setShowUsersModal(true)}
              className="p-2 rounded hover:bg-blue-900/20 text-slate-300 transition-colors relative"
              title="Users"
            >
              <Users className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 bg-blue-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-semibold px-1">
                {onlineCount}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="p-2 rounded hover:bg-blue-900/20 text-slate-300 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ─── MAIN LAYOUT ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0">
        {/* File Explorer */}
        <AnimatePresence>
          {showFileExplorer && (
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="glass-panel w-[260px] sm:w-[280px] flex-shrink-0 flex flex-col border-r border-blue-900/20 absolute sm:relative h-full z-30 md:z-0"
            >
              <div className="p-2 border-b border-blue-900/20 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Explorer</span>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setCreateFileModal({ open: true, parentPath: [] })}
                    className="p-1.5 rounded hover:bg-blue-900/20 text-slate-400 hover:text-slate-200 transition-colors"
                    title="New File"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => console.log('New folder')}
                    className="p-1.5 rounded hover:bg-blue-900/20 text-slate-400 hover:text-slate-200 transition-colors"
                    title="New Folder"
                  >
                    <FolderPlus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => activeFile && setRenameModal({ open: true, item: activeFile, path: [] })}
                    className="p-1.5 rounded hover:bg-blue-900/20 text-slate-400 hover:text-slate-200 transition-colors"
                    title="Rename"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => activeFile && setDeleteModal({ open: true, item: activeFile, path: [] })}
                    className="p-1.5 rounded hover:bg-blue-900/20 text-slate-400 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-auto p-1">
                <FileTree
                  node={fileTree}
                  path={[]}
                  activeFile={activeFile}
                  onToggle={toggleFolder}
                  onOpenFile={openFile}
                  onRename={(item, path) => setRenameModal({ open: true, item, path })}
                  onDelete={(item, path) => setDeleteModal({ open: true, item, path })}
                  onCreateFile={(path) => setCreateFileModal({ open: true, parentPath: path })}
                />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Editor area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#1e293b]">
          {activeFile ? (
            <>
              <div className="flex-1 min-h-0">
                <Editor
                  height="100%"
                  defaultLanguage={(activeFile.name || '').split('.').pop()}
                  value={editorContent}
                  onChange={handleEditorChange}
                  onMount={handleEditorDidMount}
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    lineNumbers: 'on',
                    smoothScrolling: true,
                    padding: { top: 16, bottom: 16 },
                    wordWrap: 'on',
                    automaticLayout: true,
                  }}
                />
              </div>
              <footer className="glass-nav px-3 py-1.5 flex items-center justify-between text-xs text-slate-400 border-t border-blue-900/20 flex-shrink-0">
                <div className="flex items-center gap-4">
                  <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
                  {activeFile && (
                    <span className="px-2 py-0.5 rounded bg-blue-900/30 text-blue-300 font-medium">
                      {(activeFile.name || '').split('.').pop()}
                    </span>
                  )}
                </div>
              </footer>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 p-8">
              <div className="text-center">
                <File className="w-14 h-14 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">Open a file from the explorer</p>
              </div>
            </div>
          )}

          {/* Terminal drawer */}
          <AnimatePresence>
            {showTerminal && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: terminalHeight }}
                exit={{ height: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="glass-panel border-t border-blue-900/20 flex flex-col overflow-hidden flex-shrink-0"
              >
                <div className="px-3 py-2 border-b border-blue-900/20 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <TerminalIcon className="w-4 h-4 text-emerald-400" />
                    Terminal
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setTerminalHeight((h) => (h === 220 ? 360 : 220))}
                      className="p-1.5 rounded hover:bg-blue-900/20 text-slate-400"
                    >
                      {terminalHeight > 250 ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTerminal(false)}
                      className="p-1.5 rounded hover:bg-red-900/20 text-slate-400 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 font-mono text-sm text-emerald-400/90 bg-[#0f172a]/80">
                  <div>$ npm start</div>
                  <div className="text-slate-500 mt-1">Output only (UI)</div>
                  <div className="animate-pulse mt-2">▊</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {!showTerminal && (
        <button
          type="button"
          onClick={() => setShowTerminal(true)}
          className="fixed bottom-4 right-4 p-2 rounded-lg glass-panel text-slate-400 hover:text-slate-200 border border-blue-900/20"
          title="Show Terminal"
        >
          <TerminalIcon className="w-5 h-5" />
        </button>
      )}

      {/* ─── CREATE FILE MODAL ───────────────────────────────────────────── */}
      <AnimatePresence>
        {createFileModal.open && (
          <CreateFileModal
            parentPath={createFileModal.parentPath}
            onClose={() => setCreateFileModal({ open: false, parentPath: [] })}
            onCreate={handleCreateFile}
          />
        )}
      </AnimatePresence>

      {/* ─── RENAME MODAL ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {renameModal.open && renameModal.item && (
          <RenameModal
            item={renameModal.item}
            onClose={() => setRenameModal({ open: false, item: null, path: [] })}
            onRename={handleRename}
          />
        )}
      </AnimatePresence>

      {/* ─── DELETE MODAL ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteModal.open && deleteModal.item && (
          <DeleteModal
            item={deleteModal.item}
            onClose={() => setDeleteModal({ open: false, item: null, path: [] })}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>

      {/* ─── USERS MODAL ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showUsersModal && (
          <UsersModal
            users={users}
            onClose={() => setShowUsersModal(false)}
            onKick={handleKickUser}
            onMakeAdmin={handleMakeAdmin}
            isMobile={isMobile}
          />
        )}
      </AnimatePresence>

      {/* ─── SETTINGS PANEL ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSettings && (
          <SettingsPanel
            roomName={roomName}
            setRoomName={setRoomName}
            onClose={() => setShowSettings(false)}
            onDeleteRoom={handleDeleteRoom}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── File tree (recursive) ────────────────────────────────────────────────
function FileTree({ node, path, activeFile, onToggle, onOpenFile, onRename, onDelete, onCreateFile }) {
  const isActive = activeFile?.id === node.id;

  if (node.type === 'folder') {
    return (
      <div className="select-none">
        <div
          className="flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer hover:bg-blue-900/20 group"
          style={{ paddingLeft: `${path.length * 12 + 8}px` }}
          onClick={() => onToggle(path)}
        >
          {node.isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
          )}
          <Folder className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span className="text-sm font-medium text-slate-300 truncate flex-1">{node.name}</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onCreateFile(path); }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-blue-900/30 text-slate-400 transition-opacity"
            title="New file inside folder"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        <AnimatePresence>
          {node.isExpanded && node.children?.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {node.children.map((child, i) => (
                <FileTree
                  key={child.id || child.name}
                  node={child}
                  path={[...path, i]}
                  activeFile={activeFile}
                  onToggle={onToggle}
                  onOpenFile={onOpenFile}
                  onRename={onRename}
                  onDelete={onDelete}
                  onCreateFile={onCreateFile}
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
      className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer group ${
        isActive ? 'bg-blue-900/30 text-slate-100' : 'hover:bg-blue-900/20 text-slate-300'
      }`}
      style={{ paddingLeft: `${path.length * 12 + 8}px` }}
      onClick={() => onOpenFile(node)}
      onContextMenu={(e) => {
        e.preventDefault();
        onRename(node, path);
      }}
    >
      {getFileIcon(node.name)}
      <span className="text-sm truncate flex-1">{node.name}</span>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRename(node, path); }}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-blue-900/30 text-slate-400 transition-opacity"
        title="Rename"
      >
        <Edit2 className="w-3 h-3" />
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(node, path); }}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-900/30 text-red-400 transition-opacity"
        title="Delete"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Create File Modal ─────────────────────────────────────────────────────
function CreateFileModal({ parentPath, onClose, onCreate }) {
  const [fileName, setFileName] = useState('');
  const [extension, setExtension] = useState('js');
  const extensions = ['js', 'jsx', 'ts', 'tsx', 'py', 'html', 'css', 'json', 'md', 'txt'];

  const handleCreate = () => {
    if (fileName.trim()) {
      onCreate(fileName.trim(), extension, parentPath);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-blue-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="glass-modal rounded-lg p-6 max-w-md w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-emerald-400" />
          Create New File
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">File Name</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="my-file"
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-blue-900/40 rounded text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Extension</label>
            <select
              value={extension}
              onChange={(e) => setExtension(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-blue-900/40 rounded text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            >
              {extensions.map((ext) => (
                <option key={ext} value={ext} className="bg-slate-800">.{ext}</option>
              ))}
            </select>
          </div>
          {parentPath.length > 0 && (
            <p className="text-xs text-slate-500">
              Parent: <span className="font-mono text-slate-400">/{parentPath.join('/')}</span>
            </p>
          )}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleCreate}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold text-sm transition-colors"
            >
              Create
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-medium text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Rename Modal ──────────────────────────────────────────────────────────
function RenameModal({ item, onClose, onRename }) {
  const [newName, setNewName] = useState(item?.name ?? '');

  const handleRename = () => {
    if (newName.trim()) onRename(newName.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-blue-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="glass-modal rounded-lg p-6 max-w-md w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <Edit2 className="w-5 h-5 text-blue-400" />
          Rename {item?.type === 'folder' ? 'Folder' : 'File'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">New Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-blue-900/40 rounded text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleRename}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold text-sm transition-colors"
            >
              Rename
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-medium text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Delete Modal ──────────────────────────────────────────────────────────
function DeleteModal({ item, onClose, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-blue-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="glass-modal rounded-lg p-6 max-w-md w-full border border-red-900/30 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Delete {item?.type === 'folder' ? 'Folder' : 'File'}
        </h3>
        <p className="text-sm text-slate-300 mb-6">
          Are you sure you want to delete <strong className="text-slate-100">"{item?.name}"</strong>?
          {item?.type === 'folder' && (
            <span className="block mt-2 text-amber-400 text-xs">This will remove all contents inside this folder.</span>
          )}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onDelete}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded font-semibold text-sm transition-colors"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-medium text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Users Modal ───────────────────────────────────────────────────────────
function UsersModal({ users, onClose, onKick, onMakeAdmin, isMobile }) {
  const isOwner = (u) => u.role === 'owner';
  const canKick = (u) => u.role !== 'owner';
  const canMakeAdmin = (u) => u.role !== 'owner' && u.role !== 'admin';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-blue-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`glass-modal rounded-lg shadow-xl overflow-hidden ${isMobile ? 'max-h-[85vh] w-full max-w-md' : 'max-w-md w-full'} p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Room Users
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded hover:bg-slate-700/50 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2 overflow-y-auto max-h-[60vh]">
          {users.map((user) => (
            <div
              key={user.id}
              className={`p-4 rounded-lg border transition-colors ${
                user.online ? 'bg-slate-800/40 border-blue-900/30' : 'bg-slate-800/20 border-slate-700/30 opacity-70'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center text-slate-300 font-semibold flex-shrink-0">
                  {user.role === 'guest' ? <UserCircle className="w-5 h-5" /> : user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-100 truncate">{user.name}</p>
                  <span className={`inline-flex items-center gap-1 mt-0.5 text-[10px] font-medium uppercase ${
                    user.role === 'owner' ? 'text-amber-400' :
                    user.role === 'admin' ? 'text-blue-400' :
                    user.role === 'editor' ? 'text-emerald-400' :
                    'text-slate-500'
                  }`}>
                    {user.role === 'owner' && <Crown className="w-3 h-3" />}
                    {user.role === 'admin' && <Shield className="w-3 h-3" />}
                    {user.role === 'guest' && '👤 Guest'}
                    {!['owner', 'admin', 'guest'].includes(user.role) && user.role}
                  </span>
                </div>
                {user.online && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                )}
              </div>
              {/* Only owner/admin can kick; only owner can make admin. Assume current user is owner for demo. */}
              {canKick(user) && user.online && (
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => onKick(user.id)}
                    className="flex-1 px-3 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    <LogOut className="w-3 h-3" />
                    Kick
                  </button>
                  {canMakeAdmin(user) && (
                    <button
                      type="button"
                      onClick={() => onMakeAdmin(user.id)}
                      className="flex-1 px-3 py-2 bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 rounded text-xs font-semibold flex items-center justify-center gap-1"
                    >
                      <Shield className="w-3 h-3" />
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

// ─── Settings Panel (slide from right) ─────────────────────────────────────
function SettingsPanel({ roomName, setRoomName, onClose, onDeleteRoom }) {
  const [name, setName] = useState(roomName);
  const [password, setPassword] = useState('');

  useEffect(() => {
    setName(roomName);
  }, [roomName]);

  const handleClose = () => {
    setRoomName(name);
    onClose();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-blue-950/40 z-40"
        onClick={handleClose}
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-sm glass-panel border-l border-blue-900/20 z-50 p-6 overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            Settings
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded hover:bg-slate-700/50 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Room Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-blue-900/40 rounded text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Room Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 bg-slate-800/60 border border-blue-900/40 rounded text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Download Path</label>
            <input
              type="text"
              value="/downloads"
              readOnly
              className="w-full px-3 py-2.5 bg-slate-800/40 border border-blue-900/30 rounded text-sm text-slate-500 cursor-not-allowed"
            />
            <p className="text-[10px] text-slate-500 mt-1">UI only</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold text-sm transition-colors"
          >
            Close
          </button>
          <div className="pt-4 border-t border-blue-900/20">
            <button
              type="button"
              onClick={() => { onDeleteRoom(); handleClose(); }}
              className="w-full px-4 py-2.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Room
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
