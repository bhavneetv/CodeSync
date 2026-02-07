import { set } from 'lodash';
import supabase from '../../supabaseClient';
import { createEncryptedFile } from './create-file';

/* ================================
   1. Get GitHub token of logged user
================================ */
export async function getGithubToken() {
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;

    const session = data?.session;
    const user = session?.user;
    if (!user) return null;

    const { data: profile } = await supabase
        .from("profiles")
        .select("github_token")
        .eq("id", user.id)
        .maybeSingle();

    if (profile?.github_token) {
        return profile.github_token;
    }

    const providerToken = session?.provider_token || null;

    if (providerToken) {
        await supabase
            .from("profiles")
            .update({ github_token: providerToken })
            .eq("id", user.id);
    }

    return providerToken;
}

/* ================================
   2. Fetch ONLY logged-in user repos
================================ */
export async function fetchAllGithubRepos() {
    const token = await getGithubToken();
    if (!token) throw new Error("GitHub not connected");

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
        if (!Array.isArray(repos) || repos.length === 0) break;

        allRepos.push(
            ...repos.map(repo => ({
                name: repo.name,
                owner: repo.owner.login,
                private: repo.private,
                default_branch: repo.default_branch
            }))
        );

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
    setRoomDetail(roomLink, repo, token);

}

export async function setRoomDetail(roomLink, repo, token) {
    console.log("setRoomDetail", roomLink, repo, token);
    const { data, error } = await supabase
        .from('rooms')
        .update({
            github_repo: repo,
            github_token: token,
            file_upload_by: "github"
        })
        .eq('room_link', roomLink)
        .select(); // 👈 NO single()

    if (error) {
        console.error("Failed to update room GitHub details:", error);
        return { success: false, error };
    }

    if (!data || data.length === 0) {
        console.error("No room matched room_link:", roomLink);
        return { success: false, error: "ROOM_NOT_FOUND_OR_NO_PERMISSION" };
    }

    return { success: true, data: data[0] };
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
