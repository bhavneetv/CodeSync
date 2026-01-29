import { useEffect, useState } from 'react';
import  supabase from '../supabaseClinet'; 

const GitHubImport = ({ roomId }) => { // Pass the current Room ID as a prop
  const [repos, setRepos] = useState([]);
  const [ghToken, setGhToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    // 1. Get the GitHub Token from the session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.provider_token) {
        setGhToken(session.provider_token);
        fetchRepos(session.provider_token);
      }
    };
    getSession();
  }, []);

  // 2. Fetch User's Repositories
  const fetchRepos = async (token) => {
    try {
      const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=50', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setRepos(data);
    } catch (err) {
      console.error("Error loading repos", err);
    }
  };

  // 3. The "Clone" Logic (Runs in Browser)
  const importRepo = async (repo) => {
    setLoading(true);
    setStatus(`Fetching files for ${repo.name}...`);

    try {
      // A. Get the File Tree (Recursive)
      const treeRes = await fetch(`https://api.github.com/repos/${repo.owner.login}/${repo.name}/git/trees/${repo.default_branch}?recursive=1`, {
        headers: { Authorization: `Bearer ${ghToken}` }
      });
      const treeData = await treeRes.json();

      // B. Filter for files only (Limit to 50 to avoid browser crashing)
      const filesToFetch = treeData.tree
        .filter(node => node.type === 'blob')
        .slice(0, 50); 

      setStatus(`Downloading ${filesToFetch.length} files...`);

      // C. Fetch Content for each file
      const fileInserts = await Promise.all(filesToFetch.map(async (fileNode) => {
        // Fetch raw content
        const contentRes = await fetch(fileNode.url, {
          headers: { Authorization: `Bearer ${ghToken}` }
        });
        const contentData = await contentRes.json();
        
        // Decode Base64 content from GitHub
        const decodedContent = atob(contentData.content);

        return {
          room_id: roomId, // The ID of the room you are in
          file_path: fileNode.path,
          file_name: fileNode.path.split('/').pop(),
          content: decodedContent,
          language: fileNode.path.split('.').pop()
        };
      }));

      // D. Save ALL files to Supabase at once
      setStatus("Saving to database...");
      const { error } = await supabase
        .from('files')
        .insert(fileInserts);

      if (error) throw error;

      alert("Repository Imported Successfully!");
      setStatus("");
      
    } catch (error) {
      console.error(error);
      alert("Import Failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!ghToken) return <button onClick={() => window.location.reload()}>Refresh to Load GitHub Token</button>;

  return (
    <div className="p-4 bg-gray-900 text-white rounded-lg max-h-[500px] overflow-auto">
      <h3 className="text-xl mb-4">Import from GitHub</h3>
      
      {loading && <div className="text-blue-400 mb-4 animate-pulse">{status}</div>}
      
      <div className="space-y-2">
        {repos.map(repo => (
          <div 
            key={repo.id} 
            onClick={() => !loading && importRepo(repo)}
            className="p-3 border border-gray-700 rounded cursor-pointer hover:bg-gray-800 flex justify-between items-center"
          >
            <div>
              <div className="font-bold">{repo.name}</div>
              <div className="text-xs text-gray-400">{repo.private ? "🔒 Private" : "🌍 Public"}</div>
            </div>
            <button className="text-sm bg-blue-600 px-3 py-1 rounded">Import</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GitHubImport;