# GitHub Copilot Changelog Tracker

A Chrome extension that tracks and notifies you about new updates to the GitHub Copilot changelog.

## Features

- Periodically checks for new updates on the GitHub Copilot changelog page
- Shows desktop notifications when new updates are posted
- Displays a list of recent updates in the popup
- Allows manual checking for updates
- Tracks which updates you've already read

## Installation

Since this extension is not published to the Chrome Web Store, you'll need to load it as an unpacked extension:

1. Make sure you have all the necessary files:
   - manifest.json
   - background.js
   - popup.html
   - popup.js
   - icons/icon16.png
   - icons/icon48.png
   - icons/icon128.png

2. Open Chrome and navigate to `chrome://extensions`

3. Enable "Developer mode" by toggling the switch in the top right corner

4. Click "Load unpacked" and select the directory containing the extension files

5. The extension should now be installed and visible in your extensions list

## Usage

- Click the extension icon in the toolbar to see recent updates
- Updates are checked automatically every hour
- You can manually check for updates by clicking the "Check Now" button
- Click on any update to open it in a new tab
- Desktop notifications will appear when new updates are found

## Customization

This extension can be easily configured to monitor any website for changes. All configuration options are stored in the `config.js` file.

### Monitoring a Different Website

To track a different website's updates:

1. Open the `config.js` file in your preferred code editor
2. Modify the `CHANGELOG_URL` value to point to the website you want to monitor
3. Adjust the `SELECTORS` object to match the HTML structure of the target website:
   ```javascript
   SELECTORS: {
     POST: 'article',             // CSS selector for each update/post item
     TITLE: 'h2',                 // CSS selector for the title within each post
     LINK: 'a',                   // CSS selector for the link to the full update
     DATE: 'time'                 // CSS selector for the date element
   }
   ```
4. Customize the `EXTENSION_NAME` and `NOTIFICATION_TITLE` to reflect the new website
5. Reload the extension in Chrome's extension manager

### Example Configuration for Different Websites

#### For Node.js Blog:
```javascript
const CONFIG = {
  CHANGELOG_URL: 'https://nodejs.org/en/blog/',
  EXTENSION_NAME: 'Node.js Release Tracker',
  SELECTORS: {
    POST: '.blog-index .blog-item',
    TITLE: 'a',
    LINK: 'a',
    DATE: 'time'
  }
  // ...other settings
};
```

#### For Mozilla Release Notes:
```javascript
const CONFIG = {
  CHANGELOG_URL: 'https://www.mozilla.org/en-US/firefox/releases/',
  EXTENSION_NAME: 'Firefox Release Tracker',
  SELECTORS: {
    POST: '.mzp-c-card',
    TITLE: '.mzp-c-card-title',
    LINK: 'a',
    DATE: '.c-release-version'
  }
  // ...other settings
};
```

### Other Configuration Options

You can also modify these additional settings in `config.js`:

- `CHECK_INTERVAL_MINUTES`: How frequently the extension checks for updates (default: 60 minutes)
- `MAX_STORED_POSTS`: Maximum number of posts to store in history (default: 50)

## Contributing

Feel free to fork this repository and make improvements or add features.

## License

MIT