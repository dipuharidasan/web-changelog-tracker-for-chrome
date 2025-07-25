// Import configuration
import CONFIG from './config.js';

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  console.log(`${CONFIG.EXTENSION_NAME} installed`);
  
  // Initialize storage with empty post list
  const data = await chrome.storage.local.get('posts');
  if (!data.posts) {
    await chrome.storage.local.set({ posts: [] });
  }
  
  // Schedule alarm for periodic checks
  chrome.alarms.create('check-updates', {
    periodInMinutes: CONFIG.CHECK_INTERVAL_MINUTES
  });
  
  // Initial check for updates
  checkForUpdates();
});

// Listen for alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'check-updates') {
    checkForUpdates();
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkForUpdates') {
    checkForUpdates();
    // Important: Reply to let popup know we received the message
    sendResponse({ success: true });
    return true; // Keep the message channel open for async responses
  }
});

// Function to check for updates
async function checkForUpdates() {
  console.log('Checking for updates...');
  try {
    const response = await fetch(CONFIG.CHANGELOG_URL);
    if (!response.ok) throw new Error('Failed to fetch changelog');
    
    const html = await response.text();
    // Using regex instead of DOMParser for service worker compatibility
    const posts = extractPostsWithRegex(html);
    
    // Compare with stored posts to find new ones
    const storedData = await chrome.storage.local.get('posts');
    const storedPosts = storedData.posts || [];
    const storedIds = new Set(storedPosts.map(post => post.id));
    
    const newPosts = posts.filter(post => !storedIds.has(post.id));
    
    if (newPosts.length > 0) {
      console.log(`Found ${newPosts.length} new updates`);
      
      // Store the new posts
      await chrome.storage.local.set({ 
        posts: [...newPosts, ...storedPosts].slice(0, CONFIG.MAX_STORED_POSTS)
      });
      
      // Send notification for each new post
      for (const post of newPosts) {
        showNotification(post);
      }
    } else {
      console.log('No new updates found');
    }
    
    // Update last checked timestamp
    await chrome.storage.local.set({ lastChecked: new Date().toISOString() });
    
    // Notify popup that updates were checked - properly handle when popup is closed
    try {
      await chrome.runtime.sendMessage({ action: 'updatesChecked' });
    } catch (error) {
      console.log('Could not send update message to popup, this is expected if popup is closed');
    }
    
  } catch (error) {
    console.error('Error checking for updates:', error);
  }
}

// Extract posts using regex instead of DOMParser (service worker compatible)
function extractPostsWithRegex(html) {
  const posts = [];
  
  // Find all ChangelogItem-title links directly in the HTML
  // Pattern: href comes before class in the HTML structure
  const titleLinkRegex = /<a[^>]*href="([^"]*)"[^>]*class="ChangelogItem-title"[^>]*>([\s\S]*?)<\/a>/g;
  
  let match;
  while ((match = titleLinkRegex.exec(html)) !== null) {
    const url = match[1];
    const rawTitle = match[2];
    
    // Clean up the title by removing HTML tags and normalizing whitespace
    const title = rawTitle.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    
    if (title && url) {
      // Generate a unique ID from the URL
      const id = url.split('/').slice(-3).join('-');
      
      // Try to find the date for this specific post by looking in the surrounding context
      // We'll look backwards from the current match to find the datetime attribute
      const beforeMatch = html.substring(Math.max(0, match.index - 1000), match.index);
      const dateMatch = beforeMatch.match(/datetime="([^"]*)"[^>]*>[^<]*<\/time>/);
      const date = dateMatch ? dateMatch[1] : new Date().toISOString();
      
      posts.push({
        id,
        title,
        url: url.startsWith('http') ? url : new URL(url, CONFIG.CHANGELOG_URL).toString(),
        date,
        read: false
      });
    }
  }
  
  return posts;
}

// Show a notification for a new post
function showNotification(post) {
  // Create notification options, defaulting to text-only if no icon is available
  const notificationOptions = {
    type: 'basic',
    title: CONFIG.NOTIFICATION_TITLE,
    message: post.title,
    priority: 2
  };
  
  // Try to use the icon if it exists, create text-only notification otherwise
  try {
    chrome.notifications.create(`post-${post.id}`, {
      ...notificationOptions,
      iconUrl: chrome.runtime.getURL('icons/icon128.png')
    });
  } catch (error) {
    console.warn('Could not create notification with icon, using text-only notification instead');
    chrome.notifications.create(`post-${post.id}`, notificationOptions);
  }
}

// Handle notification click
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId.startsWith('post-')) {
    const postId = notificationId.replace('post-', '');
    openPostPage(postId);
  }
});

// Open the post page and mark as read
async function openPostPage(postId) {
  const data = await chrome.storage.local.get('posts');
  const posts = data.posts || [];
  const post = posts.find(p => p.id === postId);
  
  if (post) {
    // Open the post in a new tab
    chrome.tabs.create({ url: post.url });
    
    // Mark the post as read
    post.read = true;
    await chrome.storage.local.set({ posts });
  }
}