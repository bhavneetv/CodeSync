
import supabase from '../../supabaseClient';
import { createEncryptedFile } from './create-file';

export async function getGithubToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.provider_token || null;
}


export async function fetchAllGithubRepos(token) {
    let page = 1;
    let allRepos = [];

    while (true) {
        const res = await fetch(
            `https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github+json'
                }
            }
        );

        const repos = await res.json();
        if (!repos.length) break;

        allRepos = allRepos.concat(repos);
        page++;
    }

    return allRepos;
}

function shouldSkipGithubFile(path, size = 0) {
    const blockedFolders = [
        'node_modules/',
        '.git/',
        '.github/',
        'dist/',
        'build/',
        '.next/',
        '.vercel/'
    ];

    const blockedFiles = [
        'package-lock.json',
        'yarn.lock',
        'pnpm-lock.yaml'
    ];

    const blockedExtensions = [
        'png', 'jpg', 'jpeg', 'gif', 'svg',
        'webp', 'ico',
        'mp4', 'mp3', 'wav',
        'zip', 'rar', '7z',
        'exe', 'dll'
    ];

    // Folder filter
    if (blockedFolders.some(folder => path.startsWith(folder))) {
        return true;
    }

    // File name filter
    if (blockedFiles.some(file => path.endsWith(file))) {
        return true;
    }

    // Extension filter
    const ext = path.split('.').pop().toLowerCase();
    if (blockedExtensions.includes(ext)) {
        return true;
    }

    // Size filter (1MB)
    if (size > 1_000_000) {
        return true;
    }

    return false;
}

// import { supabase } from '@/supabaseClient';





async function fetchRepoTree(owner, repo, token, path = '') {
    const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github+json'
            }
        }
    );

    return res.json();
}

export async function importRepoContents({
    owner,
    repo,
    roomLink,
    token,
    currentPath = ''
}) {
    console.log(roomLink)
    const items = await fetchRepoTree(owner, repo, token, currentPath);

    for (const item of items) {
        // Folder → recurse
        if (item.type === 'dir') {
            if (shouldSkipGithubFile(item.path)) continue;

            await importRepoContents({
                owner,
                repo,
                roomLink,
                token,
                currentPath: item.path
            });
        }

        // File → import
        if (item.type === 'file') {
            if (shouldSkipGithubFile(item.path, item.size)) continue;

            await importGithubFileFromContentAPI({
                owner,
                repo,
                path: item.path,
                roomLink,
                token
            });
        }
    }
}

async function importGithubFileFromContentAPI({
    owner,
    repo,
    path,
    roomLink,
    token
}) {
    const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github+json'
            }
        }
    );

    const data = await res.json();

    if (!data.content || data.encoding !== 'base64') return;

    const rawContent = atob(data.content.replace(/\n/g, ''));

    const parts = path.split('/');
    const fileName = parts.pop();
    const folderPath = parts.join('/');

    const extension = fileName.includes('.') ? fileName.split('.').pop() : '';
    // console.log(roomLink);

    await createEncryptedFile(
        roomLink,
        fileName.replace(`.${extension}`, ''),
        extension,
        false,
        folderPath,
        rawContent
    );
}
