# TransLucid AI - Chrome Extension

A Chrome Extension (Manifest V3) that translates selected text into English and provides AI-powered explanations using the Google Gemini API.

## Features

- **Context Menu Translation**: Select any text on a webpage, right-click, and choose "Translate into English"
- **AI Chat Assistant**: Right-click and choose "Chat with AI" for detailed explanations and Q&A
- **Floating Tooltip**: Translation appears in a sleek tooltip above the selected text
- **Interactive Chat Interface**: AI-powered chat with typing animation and markdown formatting
- **Persistent Tooltip**: Tooltip stays visible until manually closed
- **Manual Close**: Click the X button to dismiss the tooltip
- **Secure API Key Storage**: Your Gemini API key is stored securely in Chrome's local storage
- **Universal Language Support**: Translates from any language to English

## Quick Start

1. **Download** the extension files
2. **Get API Key** from [Google AI Studio](https://makersuite.google.com/app/apikey)
3. **Load Extension** in Chrome (Developer mode → Load unpacked)
4. **Configure** your API key in the extension popup
5. **Select text** on any webpage and right-click to use!

## Installation

1. **Get a Google Gemini API Key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key for the Gemini API
   - Copy the key for later use

2. **Install the Extension**:
   - **Download/Clone**: Get the extension files from this repository
   - **Open Chrome**: Navigate to `chrome://extensions/`
   - **Enable Developer Mode**: Toggle the "Developer mode" switch in the top right corner
   - **Load Unpacked**: Click the "Load unpacked" button
   - **Select Folder**: Choose the folder containing the extension files (should have manifest.json, background.js, etc.)
   - **Verify Installation**: The "TransLucid AI" extension should appear in your extensions list
   - **Pin Extension**: Click the puzzle piece icon in Chrome toolbar and pin "TransLucid AI" for easy access

3. **Configure Your API Key**:
   - **Open Settings**: Click the TransLucid AI extension icon in your Chrome toolbar
   - **Enter API Key**: Paste your Gemini API key in the "API Key" field
   - **Select Language**: Choose your preferred target language from the dropdown
   - **Save Settings**: Click "Save Settings" button
   - **Verify**: You should see "Settings saved successfully!" message

## Usage

### Translation Feature
1. **Select Text**: Highlight any text on any webpage
2. **Right-Click**: Open the context menu
3. **Translate**: Click "Translate into English"
4. **View Translation**: The English translation appears in a tooltip above the selected text
5. **Dismiss**: Click the X button to close the tooltip

### AI Chat Feature
1. **Select Text**: Highlight any text on any webpage
2. **Right-Click**: Open the context menu
3. **Chat with AI**: Click "Chat with AI"
4. **AI Explanation**: The TransLucid Assistant provides a detailed explanation
5. **Ask Questions**: Type questions in the chat interface for more information
6. **Close Chat**: Click the X button in the chat header to close

## File Structure

```
chrome_translation_tool/
├── manifest.json        # Extension configuration
├── background.js        # Service worker for API calls
├── content.js          # Content script for tooltip display
├── tooltip.css         # Tooltip styles
├── popup.html          # API key configuration interface
├── popup.js            # Popup functionality
├── icons/              # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md           # This file
```

## Security

- Your API key is stored locally in Chrome's secure storage
- The key is never hardcoded or exposed in the source code
- API calls are made directly to Google's servers over HTTPS

## Troubleshooting

### Setup Issues
- **"Load unpacked" button not visible**: Make sure Developer mode is enabled (toggle in top right of chrome://extensions/)
- **Extension not loading**: Ensure you selected the correct folder containing manifest.json
- **Extension disappears after restart**: This is normal for unpacked extensions - just reload it from chrome://extensions/
- **Permission errors**: Make sure you have the latest version of Chrome

### Usage Issues
- **"Please set your Gemini API key"**: Click the extension icon and enter your API key
- **Translation fails**: Check your internet connection and verify your API key is valid
- **Tooltip doesn't appear**: Ensure you've selected text and the page has fully loaded
- **Chat not working**: Make sure your API key is valid and you have internet connection
- **Context menu not showing**: Try refreshing the page and selecting text again

## Development

To modify the extension:
1. Make your changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

## Notes

- The extension works on all websites
- Translations are performed using Google's Gemini free model
- The tooltip uses a high z-index to appear above all page elements
