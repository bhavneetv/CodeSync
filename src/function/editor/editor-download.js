import JSZip from 'jszip';
import { showToast } from '../../Components/toast-notification';

const hashString = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString();
};

const collectFilesFromTree = (node, parentPath = '') => {
  if (!node) return [];
  const files = [];
  if (node.type === 'file') {
    const path = node.repoPath || (parentPath ? `${parentPath}/${node.name}` : node.name);
    files.push({
      id: node.id,
      path,
      storagePath: node.fullPath,
      name: node.name
    });
    return files;
  }
  if (node.type === 'folder' && node.children) {
    const nextPath = node.name === 'project' ? parentPath : (parentPath ? `${parentPath}/${node.name}` : node.name);
    node.children.forEach((child) => {
      files.push(...collectFilesFromTree(child, nextPath));
    });
  }
  return files;
};

export async function pickDownloadPath(ctx) {
  const {
    isPickingDownloadPath,
    setIsPickingDownloadPath,
    setDownloadPath,
    saveDownloadPath
  } = ctx;

  if (isPickingDownloadPath) return;
  setIsPickingDownloadPath(true);
  try {
    if (window.flutter_inappwebview?.callHandler) {
      const result = await window.flutter_inappwebview.callHandler('pickDownloadPath');
      if (result?.success && result?.path) {
        setDownloadPath(result.path);
        const saveResult = await saveDownloadPath(result.path);
        if (!saveResult.success) {
          showToast(`Failed to save: ${saveResult.error}`, 'error', 2500);
        } else if (result?.warning) {
          showToast(result.warning, 'info', 2500);
        } else {
          await syncFilesToLocalPath(ctx);
        }
      } else if (result?.error) {
        showToast(result.error, 'error', 2500);
      }
    }
  } catch (err) {
    console.error('Failed to pick download path:', err);
    showToast(`Failed to pick download path: ${err.message}`, 'error', 2500);
  } finally {
    setIsPickingDownloadPath(false);
  }
}

export async function handleSaveToDevice(ctx) {
  const { isDownloadingZip, currentPlatform } = ctx;
  if (isDownloadingZip) return;
  if (currentPlatform === 'web') {
    await handleDownloadProjectZip(ctx);
    return;
  }
  await syncFilesToLocalPath(ctx);
}

export async function syncFilesToLocalPath(ctx) {
  const {
    downloadPath,
    setDownloadPath,
    isSyncingLocal,
    setIsSyncingLocal,
    lastLocalSyncTimeRef,
    lastLocalSyncRef,
    hasInitialLocalSyncRef,
    fileTree,
    allFileContents,
    readEncryptedFile,
    roomName,
    saveDownloadPath
  } = ctx;

  if (!downloadPath) {
    showToast('Please set a download path first.', 'error', 2500);
    return;
  }
  if (isSyncingLocal) return;
  setIsSyncingLocal(true);

  const now = Date.now();
  if (now - lastLocalSyncTimeRef.current < 5000) {
    showToast('Please wait a few seconds before syncing again.', 'info', 2500);
    setIsSyncingLocal(false);
    return;
  }
  lastLocalSyncTimeRef.current = now;

  const files = collectFilesFromTree(fileTree);
  const lastMap = lastLocalSyncRef.current || {};
  const currentMap = {};
  const upserts = [];
  const deletes = [];

  for (const file of files) {
    const content = allFileContents[file.id] ?? await readEncryptedFile(file.storagePath);
    const hash = hashString(content || '');
    currentMap[file.id] = { path: file.path, hash };

    const prev = lastMap[file.id];
    const isFirst = !hasInitialLocalSyncRef.current;
    const changed = !prev || prev.hash !== hash || prev.path !== file.path;

    if (isFirst || changed) {
      upserts.push({ path: file.path, content: content || '' });
      if (prev && prev.path && prev.path !== file.path) {
        deletes.push(prev.path);
      }
    }
  }

  if (hasInitialLocalSyncRef.current) {
    Object.keys(lastMap).forEach((id) => {
      if (!currentMap[id]) {
        deletes.push(lastMap[id].path);
      }
    });
  }

  if (upserts.length === 0 && deletes.length === 0) {
    return;
  }

  const payload = {
    basePath: downloadPath,
    upserts,
    deletes,
    roomName: roomName || 'codesync'
  };

  try {
    if (window.flutter_inappwebview?.callHandler) {
      const result = await window.flutter_inappwebview.callHandler('saveProject', payload);
      console.log('[CodeSync] saveProject result:', result);
      if (result?.path && result.path !== downloadPath) {
        setDownloadPath(result.path);
        await saveDownloadPath(result.path);
      }
      if (result?.warning) {
        showToast(result.warning, 'info', 2500);
      }
    } else if (window.electron?.saveProject) {
      await window.electron.saveProject(payload);
    } else {
      console.warn('No native handler for saveProject');
    }
    lastLocalSyncRef.current = currentMap;
    hasInitialLocalSyncRef.current = true;
  } catch (err) {
    console.error('Local sync failed:', err);
    showToast(`Local sync failed: ${err.message}`, 'error', 2500);
  } finally {
    setIsSyncingLocal(false);
  }
}

export async function handleDownloadProjectZip(ctx) {
  const {
    isDownloadingZip,
    setIsDownloadingZip,
    lastZipDownloadRef,
    roomLink,
    roomName,
    getRoomFiles,
    readEncryptedFile
  } = ctx;

  if (isDownloadingZip) return;
  const now = Date.now();
  if (now - lastZipDownloadRef.current < 10000) {
    showToast('Please wait a few seconds before downloading again.', 'info', 2500);
    return;
  }
  lastZipDownloadRef.current = now;
  setIsDownloadingZip(true);

  try {
    const files = await getRoomFiles(roomLink);
    if (!files || files.length === 0) {
      showToast('No files found in this room.', 'info', 2500);
      return;
    }

    const zip = new JSZip();
    const paths = files.map((file) => {
      const baseName = file.extension ? `${file.name}.${file.extension}` : file.name;
      return {
        path: file.folderPath ? `${file.folderPath}/${baseName}` : baseName,
        storagePath: file.storagePath
      };
    }).sort((a, b) => a.path.localeCompare(b.path));

    for (const item of paths) {
      const content = await readEncryptedFile(item.storagePath);
      zip.file(item.path, content || '');
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${roomName || 'project'}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to download zip:', err);
    showToast(`Failed to download zip: ${err.message}`, 'error', 2500);
  } finally {
    setIsDownloadingZip(false);
  }
}
