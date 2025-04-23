// Import configuration
import CONFIG from './config.js';

// Function to load updates from storage - defined in global scope
async function loadUpdates() {
  const data = await chrome.storage.local.get(['posts', 'lastChecked']);
  const posts = data.posts || [];
  const lastChecked = data.lastChecked || null;
  
  // Get elements
  const updateList = document.getElementById('update-list');
  const lastCheckedElement = document.getElementById('last-checked');
  const extensionTitle = document.getElementById('extension-title');
  
  // Set extension title from config
  if (extensionTitle) {
    extensionTitle.textContent = CONFIG.EXTENSION_NAME;
  }
  
  // Update last checked timestamp
  if (lastChecked) {
    const date = new Date(lastChecked);
    lastCheckedElement.innerHTML = `
      <span class="material-icons">schedule</span>
      Last checked: ${date.toLocaleString()}
    `;
  }
  
  // Clear the update list
  updateList.innerHTML = '';
  
  // Display updates
  if (posts.length === 0) {
    updateList.innerHTML = `
      <div class="empty-state">
        <span class="material-icons">inbox</span>
        <p>No updates found. Try checking for updates.</p>
      </div>
    `;
  } else {
    // Count unread items
    const unreadCount = posts.filter(post => !post.read).length;
    
    // Sort posts by date (most recent first)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Create update items
    posts.forEach(post => {
      const updateItem = document.createElement('div');
      updateItem.className = `update-item ${post.read ? '' : 'unread'}`;
      
      // Format the date with an icon
      const formattedDate = formatDate(post.date);
      
      updateItem.innerHTML = `
        <div class="update-title">${post.title}</div>
        <div class="update-date">
          <span class="material-icons">${post.read ? 'event' : 'new_releases'}</span>
          ${formattedDate}
        </div>
      `;
      
      // Open post when clicked
      updateItem.addEventListener('click', () => {
        chrome.tabs.create({ url: post.url });
        
        // Mark as read
        markAsRead(post.id);
        
        // Update UI
        updateItem.classList.remove('unread');
        updateItem.querySelector('.material-icons').textContent = 'event';
      });
      
      updateList.appendChild(updateItem);
    });
    
    // Add a badge with unread count to the title if there are unread items
    if (unreadCount > 0 && extensionTitle) {
      const badge = document.createElement('span');
      badge.className = 'unread-badge';
      badge.textContent = unreadCount;
      extensionTitle.appendChild(badge);
    }
  }
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  
  // If invalid date, return original string
  if (isNaN(date.getTime())) {
    return dateString;
  }
  
  // Check if it's today
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // Check if it's yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // Otherwise, return formatted date
  return date.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

// Mark a post as read
async function markAsRead(postId) {
  const data = await chrome.storage.local.get('posts');
  const posts = data.posts || [];
  
  // Find the post and mark it as read
  const post = posts.find(p => p.id === postId);
  if (post) {
    post.read = true;
    await chrome.storage.local.set({ posts });
  }
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Get elements
  const checkNowButton = document.getElementById('check-now');
  
  // Load updates on popup open
  loadUpdates();
  
  // Handle "Check Now" button click
  checkNowButton.addEventListener('click', async () => {
    // Save original button content
    const originalContent = checkNowButton.innerHTML;
    
    // Show loading state
    checkNowButton.innerHTML = `
      <div class="loading-spinner"></div>
      Checking...
    `;
    checkNowButton.disabled = true;
    
    try {
      // Call the background script to check for updates
      await chrome.runtime.sendMessage({ action: 'checkForUpdates' });
      console.log('Sent checkForUpdates message to background');
      
      // Reload updates after checking
      setTimeout(() => {
        loadUpdates();
        checkNowButton.innerHTML = originalContent;
        checkNowButton.disabled = false;
      }, 1000); // Give the background script time to process
    } catch (error) {
      console.error('Error sending message:', error);
      checkNowButton.innerHTML = originalContent;
      checkNowButton.disabled = false;
    }
  });
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message) => {
  console.log('Received message in popup:', message);
  if (message.action === 'updatesChecked') {
    // Reload updates when background script has checked for updates
    loadUpdates();
  }
});