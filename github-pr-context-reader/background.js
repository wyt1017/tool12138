// Background service worker for handling extension events
chrome.runtime.onInstalled.addListener(() => {
  console.log('GitHub PR Context Reader installed');
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FETCH_PR_DATA') {
    fetchPRData(message.prUrl, message.token)
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
  
  if (message.type === 'FETCH_ISSUES') {
    fetchRelatedIssues(message.repo, message.query)
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (message.type === 'FETCH_FILE_HISTORY') {
    fetchFileHistory(message.repo, message.files)
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function fetchPRData(prUrl, token) {
  const url = new URL(prUrl);
  const parts = url.pathname.split('/');
  const owner = parts[1];
  const repo = parts[2];
  const prNumber = parts[4];
  
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`;
  
  const headers = {
    'Accept': 'application/vnd.github.v3+json'
  };
  
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }
  
  const response = await fetch(apiUrl, { headers });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch PR data: ${response.status}`);
  }
  
  return await response.json();
}

async function fetchRelatedIssues(repo, query) {
  const [owner, repoName] = repo.split('/');
  const apiUrl = `https://api.github.com/search/issues?q=repo:${repo}+${encodeURIComponent(query)}+is:pr`;
  
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'Authorization': 'token ' + (await chrome.storage.local.get('githubToken')).githubToken || ''
  };
  
  const response = await fetch(apiUrl, { headers });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch issues: ${response.status}`);
  }
  
  const data = await response.json();
  return data.items || [];
}

async function fetchFileHistory(repo, files) {
  const [owner, repoName] = repo.split('/');
  const results = [];
  
  for (const file of files.slice(0, 5)) { // Limit to 5 files for performance
    const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/commits?path=${encodeURIComponent(file)}&per_page=5`;
    
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': 'token ' + (await chrome.storage.local.get('githubToken')).githubToken || ''
    };
    
    try {
      const response = await fetch(apiUrl, { headers });
      if (response.ok) {
        const commits = await response.json();
        results.push({ file, commits });
      }
    } catch (error) {
      console.warn(`Failed to fetch history for ${file}:`, error);
    }
  }
  
  return results;
}
