export async function saveOffline(ctx) {
  const {
    canEdit,
    openTabs,
    allFileContents,
    lastSavedContentRef,
    updateEncryptedFileReliable,
    updateEncryptedFile,
    readEncryptedFile,
    setOpenTabs,
    lastSavedIdsRef,
    showToast,
    setIsSaving,
    saveInProgressRef,
    silentSuccess = false
  } = ctx;

  if (!canEdit) {
    return { saved: 0, failed: 0, skipped: 0 };
  }

  const dirtyTabs = openTabs.filter(t => t.isDirty);
  if (dirtyTabs.length === 0) {
    return { saved: 0, failed: 0, skipped: 0 };
  }

  if (saveInProgressRef?.current) {
    return { saved: 0, failed: 0, skipped: dirtyTabs.length, locked: true };
  }

  if (saveInProgressRef) {
    saveInProgressRef.current = true;
  }
  setIsSaving(true);

  try {
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const saveTab = async (tab) => {
      const content = allFileContents?.[tab.id] ?? tab.content ?? '';

      // Only save if content actually changed from last saved version
      if (lastSavedContentRef.current[tab.id] === content) {
        return { tabId: tab.id, success: true, skipped: true };
      }

      let result = { success: false, error: 'Save not attempted' };
      for (let attempt = 0; attempt < 3; attempt += 1) {
        result = await updateEncryptedFileReliable(tab.fullPath, content);
        if (!result.success) {
          result = await updateEncryptedFile(tab.fullPath, content);
        }
        if (result.success) break;
        await sleep(160 * (attempt + 1));
      }

      if (result.success) {
        lastSavedContentRef.current[tab.id] = content;

        // Verify the save by reading back
        try {
          let verified = false;
          for (let attempt = 0; attempt < 3; attempt += 1) {
            const verifyContent = await readEncryptedFile(tab.fullPath);
            if (verifyContent === content) {
              verified = true;
              break;
            }
            await sleep(200 * (attempt + 1));
          }
          if (!verified) {
            console.warn('Save verification delayed for:', tab.id);
            return { tabId: tab.id, success: true, warning: 'Verification delayed' };
          }
        } catch (verifyErr) {
          console.error('Save verification error:', verifyErr);
          // Continue anyway, save might have worked
        }
      }

      return { tabId: tab.id, success: result.success, error: result.error };
    };

    const results = [];
    const batchSize = 4;
    for (let i = 0; i < dirtyTabs.length; i += batchSize) {
      const batch = dirtyTabs.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(saveTab));
      results.push(...batchResults);
    }

    const failed = results.filter(r => !r.success && !r.skipped);
    const saved = results.filter(r => r.success && !r.skipped);
    const savedIds = new Set(saved.map(r => r.tabId));

    if (savedIds.size > 0) {
      // Mark saved tabs as not dirty
      setOpenTabs(prev =>
        prev.map(t => (savedIds.has(t.id) ? { ...t, isDirty: false } : t))
      );
      lastSavedIdsRef.current = new Set(savedIds);
    }

    if (saved.length > 0 && !silentSuccess) {
      showToast(`Saved ${saved.length} file(s)`, 'success');
    }

    if (failed.length > 0) {
      console.error('Some files failed to save:', failed);
      showToast(`Failed to save ${failed.length} file(s)`, 'error');
    }

    return {
      saved: saved.length,
      failed: failed.length,
      skipped: results.filter(r => r.skipped).length
    };
  } catch (err) {
    console.error('Failed to save:', err);
    showToast(`Failed to save files: ${err.message}`, 'error');
    return { saved: 0, failed: dirtyTabs.length, skipped: 0, error: err.message };
  } finally {
    if (saveInProgressRef) {
      saveInProgressRef.current = false;
    }
    setIsSaving(false);
  }
}

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

const notify = (toastFn, message, type = 'error', duration = 2500) => {
  if (typeof toastFn === 'function') {
    toastFn(message, type, duration);
    return;
  }
  if (type === 'error') {
    console.error(message);
  } else {
    console.log(message);
  }
};

export async function createFile(ctx, fileName, extension, parentPath) {
  const {
    setIsCreatingFile,
    fileTree,
    setCreateFileModal,
    createEncryptedFile,
    roomLink,
    setFileTree,
    setAllFileContents,
    realtimeChannelRef,
    currentUserId,
    onFileCreated,
    showToast
  } = ctx;

  setIsCreatingFile(true);
  try {
    const safePath = normalizeFolderParentPath(fileTree, parentPath);
    const folderPath = resolveFolderPath(fileTree, safePath);
    const fullFileName = `${fileName}.${extension}`;

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

    if (checkDuplicate(fileTree, safePath)) {
      notify(showToast, `A file named "${fullFileName}" already exists in this location.`, 'error');
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

      const addFileToTree = (node, path) => {
        if (!node) {
          console.error('Node is undefined in addFileToTree');
          return fileTree;
        }

        if (path.length === 0) {
          return {
            ...node,
            isExpanded: true,
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
            i === idx
              ? (() => {
                const updatedChild = addFileToTree(child, rest);
                return updatedChild?.type === 'folder'
                  ? { ...updatedChild, isExpanded: true }
                  : updatedChild;
              })()
              : child
          ),
        };
      };

      setFileTree((prev) => addFileToTree(prev, safePath));

      // Initialize file content in cache
      setAllFileContents(prev => ({
        ...prev,
        [newFile.id]: ""
      }));

      if (typeof onFileCreated === 'function') {
        Promise.resolve(onFileCreated(newFile)).catch((openErr) => {
          console.error('Failed to open newly created file:', openErr);
        });
      }

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
      notify(showToast, `Failed to create file: ${result.error}`, 'error');
    }
  } catch (err) {
    console.error("Error creating file:", err);
    notify(showToast, `Failed to create file: ${err.message}`, 'error');
  } finally {
    setCreateFileModal({ show: false, parentPath: [] });
    setIsCreatingFile(false);
  }
}

export async function createFolder(ctx, folderName, parentPath) {
  const {
    fileTree,
    setIsCreatingFolder,
    setCreateFolderModal,
    setFileTree,
    realtimeChannelRef,
    currentUserId,
    showToast
  } = ctx;

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
      notify(showToast, `A folder named "${folderName}" already exists in this location.`, 'error');
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
    notify(showToast, `Failed to create folder: ${err.message}`, 'error');
  } finally {
    setCreateFolderModal({ show: false, parentPath: [] });
    setIsCreatingFolder(false);
  }
}

export async function renameItem(ctx, newName) {
  const {
    renameModal,
    setRenameModal,
    setIsRenamingItem,
    renameEncryptedFile,
    setFileTree,
    setOpenTabs,
    activeFile,
    setActiveFile,
    realtimeChannelRef,
    currentUserId,
    showToast
  } = ctx;

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
        showToast(`Failed to rename: ${result.error}`, 'error');
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
    showToast(`Failed to rename: ${err.message}`, 'error');
  } finally {
    setRenameModal({ show: false, item: null, path: [] });
    setIsRenamingItem(false);
  }
}

export async function deleteItem(ctx) {
  const {
    deleteModal,
    setDeleteModal,
    setIsDeletingItem,
    deleteEncryptedFile,
    deleteFolder,
    roomLink,
    fileTree,
    setFileTree,
    setAllFileContents,
    openTabs,
    setOpenTabs,
    activeFile,
    setActiveFile,
    setEditorContent,
    editorContentRef,
    realtimeChannelRef,
    currentUserId,
    showToast
  } = ctx;

  if (!deleteModal.item) {
    setDeleteModal({ show: false, item: null, path: [] });
    return;
  }

  setIsDeletingItem(true);
  try {
    const item = deleteModal.item;
    const getFileIdsFromNode = (node) => {
      if (!node) return [];
      if (node.type === 'file' && node.id) return [node.id];
      if (node.type !== 'folder' || !node.children?.length) return [];
      return node.children.flatMap((child) => getFileIdsFromNode(child));
    };

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
        notify(showToast, `Failed to delete: ${result.error}`, 'error');
      }
    } else if (item.type === 'folder') {
      const safePath = normalizeFolderParentPath(fileTree, deleteModal.path);
      const folderPath = resolveFolderPath(fileTree, safePath);

      if (!folderPath) {
        notify(showToast, 'Failed to delete: Invalid folder path.', 'error');
        return;
      }

      const result = await deleteFolder(roomLink, folderPath);

      if (result.success) {
        const removeFolderFromTree = (node, path) => {
          if (!node || !path || path.length === 0) return node;

          if (path.length === 1) {
            return {
              ...node,
              children: (node.children || []).filter((_, index) => index !== path[0]),
            };
          }

          const [idx, ...rest] = path;
          return {
            ...node,
            children: (node.children || []).map((child, index) =>
              index === idx ? removeFolderFromTree(child, rest) : child
            ),
          };
        };

        const deletedFileIds = new Set(getFileIdsFromNode(item));
        setFileTree((prev) => removeFolderFromTree(prev, safePath));

        if (deletedFileIds.size > 0) {
          if (typeof setAllFileContents === 'function') {
            setAllFileContents((prev) => {
              const next = { ...prev };
              deletedFileIds.forEach((id) => {
                delete next[id];
              });
              return next;
            });
          }

          const newTabs = openTabs.filter((tab) => !deletedFileIds.has(tab.id));
          setOpenTabs(newTabs);

          if (activeFile?.id && deletedFileIds.has(activeFile.id)) {
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
              folderPath
            }
          });
        }
      } else {
        notify(showToast, `Failed to delete folder: ${result.error}`, 'error');
      }
    }
  } catch (err) {
    console.error('Error deleting:', err);
    notify(showToast, `Failed to delete: ${err.message}`, 'error');
  } finally {
    setDeleteModal({ show: false, item: null, path: [] });
    setIsDeletingItem(false);
  }
}
