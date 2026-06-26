// Content script that runs on GitHub PR pages
(function() {
  'use strict';
  
  console.log('PR Context Reader: Content script loaded');
  
  let sidebarInitialized = false;
  
  // Wait for page to be fully loaded
  waitForElement('[data-testid="pullrequest-review-header"]', () => {
    console.log('PR Context Reader: Found review header');
    if (!sidebarInitialized) {
      initSidebar();
      sidebarInitialized = true;
    }
  });
  
  // Fallback: try other common selectors
  if (!sidebarInitialized) {
    setTimeout(() => {
      waitForElement('.js-issue-title', () => {
        console.log('PR Context Reader: Found issue title (fallback)');
        if (!sidebarInitialized) {
          initSidebar();
          sidebarInitialized = true;
        }
      }, 200, 5000);
    }, 1000);
  }
  
  // Also check for mutation in case PR loads dynamically
  const observer = new MutationObserver(() => {
    if (!sidebarInitialized) {
      if (document.querySelector('[data-testid="pullrequest-review-header"]') || 
          document.querySelector('.js-issue-title')) {
        console.log('PR Context Reader: Mutation detected');
        initSidebar();
        sidebarInitialized = true;
      }
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  function waitForElement(selector, callback, interval = 200, timeout = 10000) {
    const start = Date.now();
    
    function check() {
      const element = document.querySelector(selector);
      if (element) {
        callback(element);
        return;
      }
      
      if (Date.now() - start > timeout) {
        console.warn('PR Context Reader: Timeout waiting for element:', selector);
        return;
      }
      
      setTimeout(check, interval);
    }
    
    check();
  }
  
  function initSidebar() {
    console.log('PR Context Reader: Initializing sidebar...');
    
    const prUrl = window.location.href;
    const parts = window.location.pathname.split('/');
    const owner = parts[1];
    const repo = parts[2];
    const prNumber = parts[4];
    
    console.log('PR Context Reader: PR Info -', { owner, repo, prNumber });
    
    // Create sidebar button
    const button = createSidebarButton();
    injectButton(button);
    
    // Set up click handler
    button.addEventListener('click', async () => {
      if (!button.classList.contains('active')) {
        button.classList.add('active');
        createSidebar(owner, repo, prNumber, prUrl);
      } else {
        button.classList.remove('active');
        removeSidebar();
      }
    });
    
    // Load saved token
    chrome.storage.local.get(['githubToken'], (result) => {
      if (result.githubToken) {
        window.githubToken = result.githubToken;
        console.log('PR Context Reader: Token loaded');
      } else {
        console.log('PR Context Reader: No token found - using unauthenticated requests');
      }
    });
  }
  
  function createSidebarButton() {
    const button = document.createElement('button');
    button.className = 'btn btn-sm tooltoolte-nw pr-context-btn';
    button.innerHTML = `
      <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M11.93 8.5a4.002 4.002 0 01-7.86 0H.75a.75.75 0 010-1.5h3.32a4.002 4.002 0 017.86 0h3.32a.75.75 0 010 1.5h-3.32zm-7.11 0a2.5 2.5 0 004.94 0H4.82z"/>
        <path d="M2 4.75A2.75 2.75 0 014.75 2h6.5A2.75 2.75 0 0114 4.75v6.5A2.75 2.75 0 0111.25 14h-6.5A2.75 2.75 0 012 11.25v-6.5zM3.5 4.75a1.25 1.25 0 001.25 1.25h6.5a1.25 1.25 0 001.25-1.25v-1H3.5v1zm9 2.5h1v3.75a1.25 1.25 0 01-1.25 1.25h-6.5a1.25 1.25 0 01-1.25-1.25V7.25h-1v4a2 2 0 002 2h6a2 2 0 002-2v-4z"/>
      </svg>
      PR Context
    `;
    button.setAttribute('data-tooltip', 'Show PR Context Panel');
    
    return button;
  }
  
  function injectButton(button) {
    console.log('PR Context Reader: Attempting to inject button...');
    
    // Try multiple selectors to find the right place
    let targetContainer = null;
    
    // Try 1: Pull request review header
    const reviewHeader = document.querySelector('[data-testid="pullrequest-review-header"]');
    if (reviewHeader) {
      targetContainer = reviewHeader;
      console.log('PR Context Reader: Injected into review header');
    }
    
    // Try 2: Issue title container
    if (!targetContainer) {
      const issueTitle = document.querySelector('.js-issue-title');
      if (issueTitle) {
        targetContainer = issueTitle.parentElement;
        console.log('PR Context Reader: Injected into issue title container');
      }
    }
    
    // Try 3: Header wrapper
    if (!targetContainer) {
      const headerWrapper = document.querySelector('.gh-header:not(.gh-header-nav)');
      if (headerWrapper) {
        targetContainer = headerWrapper;
        console.log('PR Context Reader: Injected into header wrapper');
      }
    }
    
    // Try 4: Top of PR discussion
    if (!targetContainer) {
      const prDiscussion = document.querySelector('.js-pr-discard-changes');
      if (prDiscussion) {
        targetContainer = prDiscussion.parentElement;
        console.log('PR Context Reader: Injected into PR discussion');
      }
    }
    
    if (targetContainer) {
      // Add button to the right side of header
      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = 'float: right; margin: 8px;';
      buttonContainer.appendChild(button);
      targetContainer.appendChild(buttonContainer);
      console.log('PR Context Reader: Button injected successfully!');
    } else {
      console.warn('PR Context Reader: Could not find target container for button');
      console.log('PR Context Reader: Available elements:', {
        reviewHeader: !!document.querySelector('[data-testid="pullrequest-review-header"]'),
        issueTitle: !!document.querySelector('.js-issue-title'),
        headerWrapper: !!document.querySelector('.gh-header'),
        prDiscussion: !!document.querySelector('.js-pr-discard-changes')
      });
    }
  }
  
  async function createSidebar(owner, repo, prNumber, prUrl) {
    // Create sidebar container
    const sidebar = document.createElement('div');
    sidebar.id = 'pr-context-sidebar';
    sidebar.className = 'pr-context-sidebar';
    
    // Sidebar header
    sidebar.innerHTML = `
      <div class="pr-context-sidebar-header">
        <h3>PR Context</h3>
        <button class="pr-context-close" title="Close">×</button>
      </div>
      
      <div class="pr-context-tabs">
        <button class="tab active" data-tab="summary">Summary</button>
        <button class="tab" data-tab="related">Related</button>
        <button class="tab" data-tab="history">History</button>
      </div>
      
      <div class="pr-context-content">
        <div id="tab-summary" class="tab-content active">
          <div class="loading">Loading PR summary...</div>
        </div>
        <div id="tab-related" class="tab-content">
          <div class="loading">Loading related PRs...</div>
        </div>
        <div id="tab-history" class="tab-content">
          <div class="loading">Loading file history...</div>
        </div>
      </div>
    `;
    
    // Inject sidebar into DOM
    document.body.appendChild(sidebar);
    
    // Add close button handler
    const closeBtn = sidebar.querySelector('.pr-context-close');
    closeBtn.addEventListener('click', () => {
      removeSidebar();
      document.querySelector('.pr-context-btn').classList.remove('active');
    });
    
    // Add tab handlers
    const tabs = sidebar.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        const tabId = `tab-${tab.dataset.tab}`;
        document.getElementById(tabId).classList.add('active');
        
        // Load content for this tab
        loadTabContent(tab.dataset.tab, owner, repo, prNumber, prUrl);
      });
    });
    
    // Load initial content
    loadTabContent('summary', owner, repo, prNumber, prUrl);
  }
  
  async function loadTabContent(tab, owner, repo, prNumber, prUrl) {
    const contentDiv = document.getElementById(`tab-${tab}`);
    
    switch(tab) {
      case 'summary':
        await loadPRSummary(contentDiv, prUrl);
        break;
      case 'related':
        await loadRelatedPRs(contentDiv, owner, repo, prNumber);
        break;
      case 'history':
        await loadFileHistory(contentDiv, owner, repo, prNumber);
        break;
    }
  }
  
  async function loadPRSummary(container, prUrl) {
    try {
      const token = window.githubToken || '';
      const response = await sendMessageToBackground({
        type: 'FETCH_PR_DATA',
        prUrl: prUrl,
        token: token
      });
      
      if (response.success) {
        const pr = response.data;
        container.innerHTML = generatePRSummary(pr);
      } else {
        container.innerHTML = `<div class="error">Failed to load PR data: ${response.error}</div>`;
      }
    } catch (error) {
      container.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
  }
  
  function generatePRSummary(pr) {
    const changedFiles = pr.changed_files || '?';
    const additions = pr.additions || 0;
    const deletions = pr.deletions || 0;
    const commits = pr.commits || 0;
    
    return `
      <div class="pr-summary">
        <div class="summary-stat">
          <span class="stat-value">${changedFiles}</span>
          <span class="stat-label">Files Changed</span>
        </div>
        <div class="summary-stat">
          <span class="stat-value stat-add">${additions}</span>
          <span class="stat-label">Additions</span>
        </div>
        <div class="summary-stat">
          <span class="stat-value stat-del">${deletions}</span>
          <span class="stat-label">Deletions</span>
        </div>
        <div class="summary-stat">
          <span class="stat-value">${commits}</span>
          <span class="stat-label">Commits</span>
        </div>
        
        <div class="pr-description">
          <h4>Description</h4>
          <div class="description-content">${pr.body ? formatDescription(pr.body) : '<p>No description provided</p>'}</div>
        </div>
        
        <div class="pr-meta">
          <h4>Details</h4>
          <div class="meta-row">
            <span class="meta-label">Author:</span>
            <span class="meta-value"><a href="https://github.com/${pr.user.login}" target="_blank">${pr.user.login}</a></span>
          </div>
          <div class="meta-row">
            <span class="meta-label">State:</span>
            <span class="meta-value state-${pr.state}">${pr.state}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Created:</span>
            <span class="meta-value">${formatDate(pr.created_at)}</span>
          </div>
          ${pr.updated_at ? `
          <div class="meta-row">
            <span class="meta-label">Updated:</span>
            <span class="meta-value">${formatDate(pr.updated_at)}</span>
          </div>
          ` : ''}
          ${pr.milestone ? `
          <div class="meta-row">
            <span class="meta-label">Milestone:</span>
            <span class="meta-value">${pr.milestone.title}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="pr-assignees">
          <h4>Assignees</h4>
          <div class="assignees-list">
            ${pr.assignees && pr.assignees.length > 0 
              ? pr.assignees.map(a => `<a href="https://github.com/${a.login}" target="_blank" class="assignee-avatar" title="${a.login}">@${a.login}</a>`).join('')
              : '<span class="no-data">No assignees</span>'}
          </div>
        </div>
        
        <div class="pr-labels">
          <h4>Labels</h4>
          <div class="labels-list">
            ${pr.labels && pr.labels.length > 0
              ? pr.labels.map(l => `<span class="label" style="background-color: ${l.color}">${l.name}</span>`).join('')
              : '<span class="no-data">No labels</span>'}
          </div>
        </div>
      </div>
    `;
  }
  
  async function loadRelatedPRs(container, owner, repo, currentPrNumber) {
    try {
      const query = `author:${owner}`;
      const response = await sendMessageToBackground({
        type: 'FETCH_ISSUES',
        repo: `${owner}/${repo}`,
        query: query
      });
      
      if (response.success) {
        const relatedPRs = response.data.filter(pr => parseInt(pr.number) !== parseInt(currentPrNumber)).slice(0, 10);
        container.innerHTML = generateRelatedPRsHTML(relatedPRs);
      } else {
        container.innerHTML = `<div class="error">Failed to load related PRs: ${response.error}</div>`;
      }
    } catch (error) {
      container.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
  }
  
  function generateRelatedPRsHTML(prs) {
    if (prs.length === 0) {
      return '<div class="no-data">No related PRs found</div>';
    }
    
    return `
      <div class="related-prs">
        <h4>Recent Related Pull Requests</h4>
        <div class="prs-list">
          ${prs.map(pr => `
            <div class="pr-item">
              <a href="https://github.com/${pr.repository_url.split('/')[3]}/${pr.repository_url.split('/')[4]}/pull/${pr.number}" 
                 target="_blank" 
                 class="pr-link">
                #${pr.number}: ${pr.title}
              </a>
              <span class="pr-state state-${pr.state}">${pr.state}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  async function loadFileHistory(container, owner, repo, prNumber) {
    try {
      // Fetch PR files first
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`;
      const headers = {
        'Accept': 'application/vnd.github.v3+json'
      };
      
      if (window.githubToken) {
        headers['Authorization'] = `token ${window.githubToken}`;
      }
      
      const response = await fetch(apiUrl, { headers });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch PR files: ${response.status}`);
      }
      
      const files = await response.json();
      const fileNames = files.map(f => f.filename);
      
      const historyResponse = await sendMessageToBackground({
        type: 'FETCH_FILE_HISTORY',
        repo: `${owner}/${repo}`,
        files: fileNames
      });
      
      if (historyResponse.success) {
        container.innerHTML = generateFileHistoryHTML(historyResponse.data);
      } else {
        container.innerHTML = `<div class="error">Failed to load file history: ${historyResponse.error}</div>`;
      }
    } catch (error) {
      container.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
  }
  
  function generateFileHistoryHTML(fileHistories) {
    if (!fileHistories || fileHistories.length === 0) {
      return '<div class="no-data">No file history available</div>';
    }
    
    return `
      <div class="file-history">
        <h4>Recent Commits by File</h4>
        ${fileHistories.map(fh => `
          <div class="file-group">
            <h5 class="file-name">${fh.file}</h5>
            <div class="commits-list">
              ${fh.commits.map(commit => `
                <div class="commit-item">
                  <a href="${commit.html_url}" target="_blank" class="commit-link">
                    <span class="commit-hash">${commit.sha.substring(0, 7)}</span>
                    <span class="commit-message">${commit.commit.message}</span>
                  </a>
                  <span class="commit-author">${commit.author?.name || 'Unknown'}</span>
                  <span class="commit-date">${formatDate(commit.commit.author.date)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  function formatDescription(text) {
    // Basic markdown-like formatting
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
    
    return `<p>${html}</p>`;
  }
  
  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function removeSidebar() {
    const sidebar = document.getElementById('pr-context-sidebar');
    if (sidebar) {
      sidebar.remove();
    }
  }
  
  function sendMessageToBackground(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        resolve(response);
      });
    });
  }
  
  // Expose for global access
  window.prContextSidebar = {
    remove: removeSidebar
  };
})();
