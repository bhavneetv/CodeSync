import { showToast } from '../../Components/toast-notification';

export async function pushToGitHub(ctx) {
  const {
    canPushToGitHub,
    isGitHubEnabled,
    githubRepo,
    githubToken,
    openTabs,
    lastSavedIdsRef,
    allFileContents,
    fileTree,
    setIsPushingToGitHub,
    handleSaveOffline,
  } = ctx;

  if (!canPushToGitHub) {
    return;
  }
  if (!isGitHubEnabled || !githubRepo || !githubToken) {
    showToast('GitHub integration is not configured for this room.', 'error', 2500);
    return;
  }

  const dirtyTabsSnapshot = openTabs.filter(t => t.isDirty);
  const savedIdsSnapshot = Array.from(lastSavedIdsRef.current || []);
  if (dirtyTabsSnapshot.length === 0 && savedIdsSnapshot.length === 0) {
    showToast('No changes to push.', 'info', 2500);
    return;
  }

  setIsPushingToGitHub(true);

  try {
    // First, save offline
    await handleSaveOffline();

    // Parse repo (format: owner/repo or repo)
    const repoInput = githubRepo
      .replace('https://github.com/', '')
      .replace('http://github.com/', '')
      .replace(/\.git$/, '');

    let owner = '';
    let repo = '';

    const parts = repoInput.split('/').filter(Boolean);
    if (parts.length >= 2) {
      owner = parts[0];
      repo = parts[1];
    } else {
      repo = parts[0];
    }

    if (!repo) {
      throw new Error('Invalid GitHub repository. Provide "owner/repo" or a repo name.');
    }

    if (!owner) {
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (!userResponse.ok) {
        throw new Error('Failed to resolve GitHub owner from token');
      }
      const userData = await userResponse.json();
      owner = userData.login;
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

    const dirtyIds = new Set(dirtyTabsSnapshot.map(t => t.id));
    const pushIds = dirtyIds.size > 0 ? dirtyIds : new Set(savedIdsSnapshot);
    const pushTabs = openTabs.filter(t => pushIds.has(t.id));
    if (pushTabs.length === 0) {
      throw new Error('No saved changes found to push.');
    }

    const resolveRepoPathById = (node, targetId, parentPath = '') => {
      if (!node) return null;
      if (node.type === 'file' && node.id === targetId) {
        return node.repoPath || (parentPath ? `${parentPath}/${node.name}` : node.name);
      }
      if (node.type === 'folder' && node.children) {
        const nextPath = node.name === 'project' ? parentPath : (parentPath ? `${parentPath}/${node.name}` : node.name);
        for (const child of node.children) {
          const found = resolveRepoPathById(child, targetId, nextPath);
          if (found) return found;
        }
      }
      return null;
    };

    // Push each dirty file
    const pushPromises = pushTabs.map(async (tab) => {
      const content = allFileContents[tab.id] || tab.content || '';
      const base64Content = btoa(unescape(encodeURIComponent(content)));
      const filePath = tab.repoPath
        || resolveRepoPathById(fileTree, tab.id)
        || tab.name;

      // Get current file SHA if it exists
      let sha = null;
      try {
        const fileResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
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
      } catch {
        console.log('File does not exist yet:', tab.fullPath);
      }

      // Create or update file
      const body = {
        message: `Update ${tab.name} from CodeSync `,
        content: base64Content,
        branch: defaultBranch
      };

      if (sha) {
        body.sha = sha;
      }

      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
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
    if (pushIds.size > 0) {
      lastSavedIdsRef.current = new Set(
        Array.from(lastSavedIdsRef.current).filter(id => !pushIds.has(id))
      );
    }

    // Show success message
    const successMsg = document.createElement('div');
    successMsg.textContent = `✓ Pushed ${successful.length} file(s) to GitHub`;
    successMsg.style.cssText = 'position:fixed;top:20px;right:20px;background:#10b981;color:white;padding:12px 20px;border-radius:8px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.3);font-size:14px;font-weight:500;';
    document.body.appendChild(successMsg);
    setTimeout(() => successMsg.remove(), 3000);

  } catch (err) {
    console.error('Failed to push to GitHub:', err);
    showToast(`Failed to push to GitHub: ${err.message}`, 'error', 2500);
  } finally {
    setIsPushingToGitHub(false);
  }
}
