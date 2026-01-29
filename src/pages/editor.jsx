import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Save, Upload, Users, Settings, Plus, FolderPlus, Edit2, Trash2,
  ChevronRight, ChevronDown, File, Folder, X, Menu, Terminal as TerminalIcon,
  Maximize2, Minimize2, AlertTriangle, Crown, Shield, UserCircle, LogOut, Loader2,
  CheckCircle, Cloud
} from 'lucide-react';
import Editor from '@monaco-editor/react';
// <<<<<<< HEAD
import  supabase  from '../supabaseClient';
import { debounce } from 'lodash'; // You might need to install lodash: npm i lodash

// --- Helper: Convert Supabase flat files to Nested Tree ---
const buildFileTree = (files) => {
  if (!files || files.length === 0) return null;

  const root = {
    name: 'root',
    type: 'folder',
    isExpanded: true,
    children: []
  };

  files.forEach(file => {
    // Determine path based on file_path or fallback to name
    const pathString = file.file_path || file.file_name; 
    const parts = pathString.split('/').filter(Boolean); // Remove empty strings
    
    let currentLevel = root.children;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      
      let existingNode = currentLevel.find(node => node.name === part);

      if (existingNode) {
        if (!isFile) {
          currentLevel = existingNode.children;
        }
      } else {
        const newNode = {
          name: part,
          type: isFile ? 'file' : 'folder',
          isExpanded: false,
          children: isFile ? undefined : [],
          content: isFile ? file.content : undefined,
          id: file.id,
          fullPath: pathString // Store full path for updates
        };

        currentLevel.push(newNode);

        if (!isFile) {
          currentLevel = newNode.children;
        }
      }
    });
  });

  // Sort: Folders first
  const sortNodes = (nodes) => {
    if (!nodes) return;
    nodes.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'folder' ? -1 : 1;
    });
    nodes.forEach(node => {
      if (node.children) sortNodes(node.children);
    });
  };

  sortNodes(root.children);
  return root;
};
// =======
import { getRoomFiles, buildFileTreeFromDB } from '../function/files/create-file';
// >>>>>>> b47b27695044e30048fac56ca7f9aaadda479072

const fileIcons = {
  js: '📄', jsx: '⚛️', ts: '📘', tsx: '⚛️', py: '🐍',
  java: '☕', cpp: '⚙️', c: '⚙️', html: '🌐', css: '🎨',
  json: '📋', md: '📝', txt: '📃', default: '📄'
};

const getFileIcon = (filename) => {
  if (!filename) return fileIcons.default;
  const ext = filename.split('.').pop();
  return fileIcons[ext] || fileIcons.default;
};

const initialFileTree = {
  name: 'root',
  type: 'folder',
  isExpanded: true,
  children: []
};

const mockUsers = [
  { id: 1, name: 'You', role: 'owner', online: true, avatar: '👩‍💻' },
];

export default function CodeEditorPage() {
  const [roomName, setRoomName] = useState('Loading...');
  const [roomId, setRoomId] = useState(null);
  
  // File State
  const [fileTree, setFileTree] = useState(initialFileTree);
  const [activeFile, setActiveFile] = useState(null); // { id, name, content, fullPath }
  const [editorContent, setEditorContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'unsaved'

  // UI State
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [users, setUsers] = useState(mockUsers);
  
  // Modals
  const [createFileModal, setCreateFileModal] = useState({ show: false, parentPath: [] });
  const [newFileName, setNewFileName] = useState('');


  const editorRef = useRef(null);
  const roomLink = window.location.href.split('?')[1].split('=')[1];

  getRoomFiles(roomLink).then((files) => {
    console.log('Files:', files);
    console.log(buildFileTreeFromDB(files.files));
    
  });

  // --- 1. FETCH FILES ---
  const fetchRoomData = async () => {
    const params = new URLSearchParams(window.location.search);
    const rId = params.get('roomId');

    if (!rId) {
      setLoading(false);
      return;
    }
    setRoomId(rId);
    setRoomName(`Room: ${rId.slice(0, 6)}`);

    try {
      const { data: files, error } = await supabase
        .from('room_files') // CHANGED: Using correct table
        .select('*')
        .eq('room_id', rId);

      if (error) throw error;

      if (files && files.length > 0) {
        const tree = buildFileTree(files);
        setFileTree(tree);
        
        // Open first file if none active
        if (!activeFile) {
            const firstFile = files.find(f => !f.file_path.endsWith('/')) || files[0];
            if(firstFile) {
                setActiveFile({ 
                    id: firstFile.id, 
                    name: firstFile.file_name, 
                    content: firstFile.content,
                    fullPath: firstFile.file_path
                });
                setEditorContent(firstFile.content || '');
            }
        }
      }
    } catch (err) {
      console.error("Error loading room:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomData();
  }, []);

  // --- 2. SAVE LOGIC (Debounced + Manual) ---
  
  // Create a debounced save function
  const debouncedSave = useCallback(
    debounce(async (id, content) => {
      if (!id) return;
      setSaveStatus('saving');
      
      const { error } = await supabase
        .from('room_files')
        .update({ content: content })
        .eq('id', id);

      if (error) {
        console.error("Auto-save failed", error);
        setSaveStatus('error');
      } else {
        setSaveStatus('saved');
      }
    }, 2000),
    [] // Dependencies
  );

  const handleEditorChange = (value) => {
    setEditorContent(value);
    setSaveStatus('unsaved');
    
    // Update local active file state
    if (activeFile) {
       setActiveFile(prev => ({ ...prev, content: value }));
       // Trigger database save
       debouncedSave(activeFile.id, value);
    }
  };

  // Manual Save (Button or Ctrl+S)
  const handleManualSave = async () => {
    if (!activeFile) return;
    setSaveStatus('saving');
    
    const { error } = await supabase
        .from('room_files')
        .update({ content: editorContent })
        .eq('id', activeFile.id);

    if (error) {
        alert("Failed to save!");
        setSaveStatus('error');
    } else {
        setSaveStatus('saved');
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile, editorContent]);


  // --- 3. FILE OPERATIONS ---

  const handleCreateFileSubmit = async (e) => {
    e.preventDefault();
    if (!newFileName || !roomId) return;

    // Construct path. parentPath is array of folder names
    const folderPrefix = createFileModal.parentPath.join('/');
    const filePath = folderPrefix ? `${folderPrefix}/${newFileName}` : newFileName;

    // Insert into DB
    const { data, error } = await supabase
        .from('room_files')
        .insert({
            room_id: roomId,
            file_name: newFileName,
            file_path: filePath,
            content: '', // Empty file
            language: newFileName.split('.').pop()
        })
        .select();

    if (error) {
        console.error("Create failed:", error);
        alert("Error creating file");
    } else {
        await fetchRoomData(); // Refresh tree
        setCreateFileModal({ show: false, parentPath: [] });
        setNewFileName('');
        
        // Open the new file
        if(data && data[0]) {
             setActiveFile({
                id: data[0].id,
                name: data[0].file_name,
                content: '',
                fullPath: data[0].file_path
             });
             setEditorContent('');
        }
    }
  };

  const toggleFolder = (path) => {
    const updateTree = (node, currentPath) => {
      if (currentPath.length === 0) {
        return { ...node, isExpanded: !node.isExpanded };
      }
      const [next, ...rest] = currentPath;
      return {
        ...node,
        children: node.children.map((child, idx) =>
          idx === next ? updateTree(child, rest) : child
        )
      };
    };
    setFileTree(updateTree(fileTree, path));
  };

  const openFile = (fileNode) => {
    // Determine the full path or ID from the node structure
    // We stored ID in buildFileTree
    if (activeFile && activeFile.id === fileNode.id) return; // Already open

    setActiveFile({
        id: fileNode.id,
        name: fileNode.name,
        content: fileNode.content || '',
        fullPath: fileNode.fullPath
    });
    setEditorContent(fileNode.content || '');
  };

  if (loading) {
      return (
          <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-white">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
              <h2 className="text-xl font-bold">Loading Workspace...</h2>
          </div>
      )
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-slate-100 font-['JetBrains_Mono',monospace]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');
        .glass-strong { background: rgba(15, 23, 42, 0.95); border-bottom: 1px solid rgba(148, 163, 184, 0.1); }
      `}</style>

      {/* Header */}
      <header className="glass-strong px-4 py-3 flex items-center justify-between sticky top-0 z-50 h-16">
        <div className="flex items-center gap-4 flex-1">
          <button onClick={() => setShowFileExplorer(!showFileExplorer)} className="p-2 hover:bg-slate-800 rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
          <div>
             <h1 className="text-sm font-bold flex items-center gap-2 text-blue-400">{roomName}</h1>
             {/* SAVE STATUS INDICATOR */}
             <div className="flex items-center gap-1.5 mt-0.5">
                {saveStatus === 'saved' && <><CheckCircle className="w-3 h-3 text-emerald-500"/><span className="text-[10px] text-emerald-500 uppercase tracking-wider font-bold">Saved</span></>}
                {saveStatus === 'saving' && <><Loader2 className="w-3 h-3 animate-spin text-blue-500"/><span className="text-[10px] text-blue-400 uppercase tracking-wider font-bold">Saving...</span></>}
                {saveStatus === 'unsaved' && <><div className="w-2 h-2 rounded-full bg-yellow-500"/><span className="text-[10px] text-yellow-500 uppercase tracking-wider font-bold">Unsaved</span></>}
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <button onClick={() => alert("Run logic goes here!")} className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors shadow-lg shadow-green-900/20">
                <Play className="w-3 h-3 fill-current" /> <span className="text-xs font-bold">RUN</span>
           </button>
           <button onClick={handleManualSave} className="p-2 hover:bg-blue-500/20 rounded-lg text-slate-300 hover:text-white transition-colors" title="Save (Ctrl+S)">
                <Save className="w-5 h-5" />
           </button>
           <button onClick={() => setShowUsersModal(true)} className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors">
                <Users className="w-5 h-5" />
           </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-64px)] relative">
        
        {/* File Explorer Sidebar */}
        <AnimatePresence mode='wait'>
          {showFileExplorer && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-[#0b1121] border-r border-slate-800 flex flex-col h-full"
            >
              <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-2">Explorer</span>
                <button 
                    onClick={() => setCreateFileModal({ show: true, parentPath: [] })}
                    className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                    title="New File"
                >
                    <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2">
                 {/* Only render tree if we have children */}
                 {fileTree && fileTree.children && fileTree.children.map((node, i) => (
                    <FileTreeNode
                        key={node.id || i}
                        node={node}
                        path={[i]}
                        onToggle={toggleFolder}
                        onOpenFile={openFile}
                        activeFile={activeFile}
                        onCreateFile={(path) => setCreateFileModal({ show: true, parentPath: path })}
                    />
                 ))}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0f172a]">
          {/* Active File Tab */}
          {activeFile ? (
            <div className="bg-[#1e293b] border-b border-slate-700 h-9 flex items-center px-4 gap-2 select-none">
              <span className="text-sm">{getFileIcon(activeFile.name)}</span>
              <span className="text-xs text-slate-200 font-medium tracking-wide">{activeFile.name}</span>
              {saveStatus === 'unsaved' && <div className="w-2 h-2 rounded-full bg-blue-400 ml-2" />}
            </div>
          ) : (
             <div className="bg-[#1e293b] border-b border-slate-700 h-9" />
          )}

          {/* Monaco Editor */}
          <div className="flex-1 relative">
            {activeFile ? (
              <Editor
                height="100%"
                defaultLanguage={activeFile.name?.split('.').pop() || 'javascript'}
                path={activeFile.fullPath || activeFile.name} // Key for Monaco to reset on file change
                value={editorContent}
                onChange={handleEditorChange}
                onMount={(editor) => { editorRef.current = editor; }}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  fontFamily: 'JetBrains Mono, monospace',
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 16 },
                }}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <Cloud className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-semibold">Select a file to start coding</p>
                <p className="text-sm mt-2">or create a new one using the + button</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: Create File */}
      <AnimatePresence>
        {createFileModal.show && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]" onClick={() => setCreateFileModal({show:false, parentPath:[]})}>
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-slate-900 p-6 rounded-xl border border-slate-700 w-96 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <h3 className="text-lg font-bold mb-4 text-white">Create New File</h3>
                    <form onSubmit={handleCreateFileSubmit}>
                        <div className="mb-4">
                            <label className="block text-xs text-slate-400 mb-1">Path</label>
                            <div className="text-xs bg-slate-800 p-2 rounded text-slate-300 font-mono">
                                root/{createFileModal.parentPath.join('/')}
                            </div>
                        </div>
                        <input 
                            autoFocus
                            type="text" 
                            placeholder="filename.js" 
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:ring-2 focus:ring-blue-500 outline-none mb-4"
                            value={newFileName}
                            onChange={e => setNewFileName(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setCreateFileModal({show:false, parentPath:[]})} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
                            <button type="submit" className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded font-bold">Create</button>
                        </div>
                    </form>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* MODAL: Users */}
      <AnimatePresence>
        {showUsersModal && (
           <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowUsersModal(false)}>
               <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 w-80">
                   <h2 className="text-xl mb-4 font-bold">Active Users</h2>
                   {users.map(u => (
                       <div key={u.id} className="flex items-center gap-3 p-2 border-b border-slate-800">
                           <div className="w-2 h-2 rounded-full bg-green-500" />
                           <span>{u.name}</span>
                           {u.role === 'owner' && <Crown className="w-3 h-3 text-yellow-500" />}
                       </div>
                   ))}
               </div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Recursive File Tree Node ---
function FileTreeNode({ node, path, onToggle, onOpenFile, activeFile, level = 0, onCreateFile }) {
  const isFolder = node.type === 'folder';
  const isActive = activeFile?.id === node.id;
  const paddingLeft = level * 12 + 12;

  if (isFolder) {
    return (
      <div className="select-none">
        <div
          className={`group flex items-center gap-2 py-1.5 pr-2 rounded-md cursor-pointer hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors`}
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={(e) => { e.stopPropagation(); onToggle(path); }}
        >
          {node.isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <Folder className={`w-3.5 h-3.5 ${node.isExpanded ? 'text-blue-400' : 'text-slate-500'}`} />
          <span className="text-xs font-medium truncate flex-1">{node.name}</span>
          
          {/* Hover Actions for Folder */}
          <button 
            onClick={(e) => { e.stopPropagation(); onCreateFile(path); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-700 rounded"
            title="New File inside"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        
        {node.isExpanded && node.children && (
            <div>
              {node.children.map((child, idx) => (
                <FileTreeNode
                  key={child.id || idx}
                  node={child}
                  path={[...path, idx]}
                  onToggle={onToggle}
                  onOpenFile={onOpenFile}
                  activeFile={activeFile}
                  level={level + 1}
                  onCreateFile={onCreateFile}
                />
              ))}
            </div>
        )}
      </div>
    );
  }

  // File Node
  return (
    <div
      className={`flex items-center gap-2 py-1.5 pr-2 rounded-md cursor-pointer transition-colors ${
        isActive ? 'bg-[#1e293b] text-blue-400 border-l-2 border-blue-500' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-l-2 border-transparent'
      }`}
      style={{ paddingLeft: `${paddingLeft}px` }}
      onClick={() => onOpenFile(node)}
    >
      <span className="text-sm opacity-80">{getFileIcon(node.name)}</span>
      <span className="text-xs font-medium truncate">{node.name}</span>
    </div>
  );
}