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

## Installation

1. **Get a Google Gemini API Key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key for the Gemini API
   - Copy the key for later use

2. **Install the Extension**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in the top right)
   - Click "Load unpacked"
   - Select the `chrome_translation_tool` directory
   - The extension icon will appear in your Chrome toolbar

3. **Configure Your API Key**:
   - Click the extension icon in the toolbar
   - Enter your Gemini API key in the popup
   - Click "Save API Key"

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

- **"Please set your Gemini API key"**: Click the extension icon and enter your API key
- **Translation fails**: Check your internet connection and verify your API key is valid
- **Tooltip doesn't appear**: Ensure you've selected text and the page has fully loaded

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
