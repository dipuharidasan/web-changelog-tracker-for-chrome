/**
 * Configuration for Changelog Tracker Extension
 * Modify these values to track different websites or change behavior
 */

// Website to track for changes
const CONFIG = {
  // URL to track for changelog updates
  CHANGELOG_URL: 'https://github.blog/changelog/label/copilot/',
  
  // How often to check for updates (in minutes)
  CHECK_INTERVAL_MINUTES: 60,
  
  // Title for notifications
  NOTIFICATION_TITLE: 'GitHub Copilot Update',
  
  // Extension name (shown in UI)
  EXTENSION_NAME: 'GitHub Copilot Changelog Tracker',
  
  // CSS selectors for parsing the webpage
  SELECTORS: {
    POST: 'article',
    TITLE: 'h2',
    LINK: 'a',
    DATE: 'time'
  },
  
  // Maximum number of posts to store
  MAX_STORED_POSTS: 50
};

// Export the configuration
export default CONFIG;