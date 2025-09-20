chrome.runtime.onInstalled.addListener(async () => {

  const result = await chrome.storage.local.get(['targetLanguage']);
  const targetLanguage = result.targetLanguage || 'English';
  
  chrome.contextMenus.create({
    id: "translateToLanguage",
    title: `Translate into ${targetLanguage}`,
    contexts: ["selection"]
  });
  
  chrome.contextMenus.create({
    id: "chatWithAI",
    title: "Chat with AI",
    contexts: ["selection"]
  });
});


chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === 'local' && changes.targetLanguage) {
    const targetLanguage = changes.targetLanguage.newValue || 'English';
    chrome.contextMenus.update("translateToLanguage", {
      title: `Translate into ${targetLanguage}`
    });
  }
});


chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "chatWithAI" && info.selectionText) {
    try {
      
      const result = await chrome.storage.local.get(['geminiApiKey']);
      const apiKey = result.geminiApiKey;
      
      if (!apiKey) {
        
        try {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'showChatError',
            message: 'Please set your Gemini API key in the extension settings'
          });
        } catch (error) {
          console.log('Content script not ready, trying to inject...');
          try {
            
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['content.js']
            });
            await chrome.scripting.insertCSS({
              target: { tabId: tab.id },
              files: ['tooltip.css']
            });
            
            await chrome.tabs.sendMessage(tab.id, {
              action: 'showChatError',
              message: 'Please set your Gemini API key in the extension settings'
            });
          } catch (injectionError) {
            console.log('Cannot inject scripts for chat feature');
          }
        }
        return;
      }
      
      
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'openChat',
          selectedText: info.selectionText,
          apiKey: apiKey
        });
      } catch (error) {
        console.log('Content script not ready, trying to inject...');
        try {
          
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          await chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            files: ['tooltip.css']
          });
          
          await chrome.tabs.sendMessage(tab.id, {
            action: 'openChat',
            selectedText: info.selectionText,
            apiKey: apiKey
          });
        } catch (injectionError) {
          console.log('Cannot inject scripts for chat feature');
        }
      }
      
    } catch (error) {
      console.error('Chat error:', error);
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'showChatError',
          message: 'Chat failed: ' + error.message
        });
      } catch (sendError) {
        console.log('Content script not ready for chat error message');
      }
    }
  } else if (info.menuItemId === "translateToLanguage" && info.selectionText) {
    try {
      
      const result = await chrome.storage.local.get(['geminiApiKey', 'targetLanguage']);
      const apiKey = result.geminiApiKey;
      const targetLanguage = result.targetLanguage || 'English';
      
      if (!apiKey) {
        
        try {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'showError',
            message: 'Please set your Gemini API key in the extension settings'
          });
        } catch (error) {
          console.log('Content script not ready, trying to inject...');
          try {
           
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['content.js']
            });
            await chrome.scripting.insertCSS({
              target: { tabId: tab.id },
              files: ['tooltip.css']
            });
           
            await chrome.tabs.sendMessage(tab.id, {
              action: 'showError',
              message: 'Please set your Gemini API key in the extension settings'
            });
          } catch (injectionError) {
            console.log('Cannot inject scripts, using popup fallback...');
            
            showTranslationPopup('', 'Error: Please set your Gemini API key in the extension settings', targetLanguage);
          }
        }
        return;
      }
      
      
      const translation = await translateText(info.selectionText, apiKey, targetLanguage);
      
      
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'showTranslation',
          originalText: info.selectionText,
          translatedText: translation
        });
      } catch (error) {
        console.log('Content script not ready, trying to inject...');
        try {
          
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          await chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            files: ['tooltip.css']
          });
          
          await chrome.tabs.sendMessage(tab.id, {
            action: 'showTranslation',
            originalText: info.selectionText,
            translatedText: translation
          });
        } catch (injectionError) {
          console.log('Cannot inject scripts, using popup fallback...');
          
          showTranslationPopup(info.selectionText, translation, targetLanguage);
        }
      }
      
    } catch (error) {
      console.error('Translation error:', error);
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'showError',
          message: 'Translation failed: ' + error.message
        });
      } catch (sendError) {
        console.log('Content script not ready for error message, trying to inject...');
        try {
          
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          await chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            files: ['tooltip.css']
          });
          
          await chrome.tabs.sendMessage(tab.id, {
            action: 'showError',
            message: 'Translation failed: ' + error.message
          });
        } catch (injectionError) {
          console.log('Cannot inject scripts, using popup fallback...');
          
          showTranslationPopup(info.selectionText, 'Translation failed: ' + error.message, targetLanguage);
        }
      }
    }
  }
});


async function getAIExplanation(text, apiKey) {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const requestBody = {
    contents: [{
      parts: [{
        text: `Please provide a clear, simple and short explanation of the following text. Explain what it means, any key concepts, and provide additional context or elaboration that would help someone understand it better. Write in simple, easy-to-understand English:\n\n${text}`
      }]
    }],
    generationConfig: {
      temperature: 0.3,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    }
  };
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    
    if (data.candidates && data.candidates.length > 0) {
      const explanation = data.candidates[0].content.parts[0].text;
      return explanation.trim();
    } else {
      throw new Error('No explanation received from API');
    }
    
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}


async function getAIChatResponse(userMessage, contextText, chatHistory, apiKey) {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
 
  let contextPrompt = `You are an AI assistant helping a user understand the following text:\n\n"${contextText}"\n\n`;
  
  if (chatHistory && chatHistory.length > 0) {
    contextPrompt += "Previous conversation:\n";
    chatHistory.forEach(msg => {
      contextPrompt += `${msg.role}: ${msg.content}\n`;
    });
    contextPrompt += "\n";
  }
  
  contextPrompt += `User's question: ${userMessage}\n\nPlease provide a helpful response based on the context of the original text and the conversation history.`;
  
  const requestBody = {
    contents: [{
      parts: [{
        text: contextPrompt
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      topK: 1,
      topP: 1,
      maxOutputTokens: 1024,
    }
  };
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    
    if (data.candidates && data.candidates.length > 0) {
      const response = data.candidates[0].content.parts[0].text;
      return response.trim();
    } else {
      throw new Error('No response received from API');
    }
    
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}


async function translateText(text, apiKey, targetLanguage = 'English') {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const requestBody = {
    contents: [{
      parts: [{
        text: `Translate the following text to ${targetLanguage}. If it's already in ${targetLanguage}, just return it as is. Only return the translation, nothing else:\n\n${text}`
      }]
    }],
    generationConfig: {
      temperature: 0.1,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    }
  };
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    
    if (data.candidates && data.candidates.length > 0) {
      const translatedText = data.candidates[0].content.parts[0].text;
      return translatedText.trim();
    } else {
      throw new Error('No translation received from API');
    }
    
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}


function showTranslationPopup(originalText, translatedText, targetLanguage = 'English') {
  
  const popupContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Translation Result</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      padding: 20px;
      max-width: 500px;
      margin: 0 auto;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    h1 {
      font-size: 18px;
      margin-bottom: 20px;
      color: #333;
      text-align: center;
    }
    .section {
      margin-bottom: 20px;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 6px;
      border: 1px solid #e9ecef;
    }
    .label {
      font-weight: bold;
      color: #666;
      margin-bottom: 8px;
      font-size: 12px;
      text-transform: uppercase;
    }
    .text {
      color: #333;
      line-height: 1.5;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .translation {
      background-color: #e8f5e9;
      border-color: #c8e6c9;
    }
    .error {
      background-color: #ffebee;
      border-color: #ffcdd2;
      color: #c62828;
    }
    .close-button {
      position: fixed;
      top: 10px;
      right: 10px;
      background-color: #f44336;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    .close-button:hover {
      background-color: #d32f2f;
    }
    .info {
      margin-top: 20px;
      padding: 10px;
      background-color: #e3f2fd;
      border: 1px solid #bbdefb;
      border-radius: 4px;
      font-size: 12px;
      color: #1976d2;
    }
  </style>
</head>
<body>
  <button class="close-button" onclick="window.close()">Close</button>
  <div class="container">
    <h1>Translation Result</h1>
    ${originalText ? `
    <div class="section">
      <div class="label">Original Text</div>
      <div class="text">${escapeHtml(originalText)}</div>
    </div>
    <div class="section translation">
      <div class="label">${targetLanguage} Translation</div>
      <div class="text">${escapeHtml(translatedText)}</div>
    </div>
    ` : `
    <div class="section error">
      <div class="text">${escapeHtml(translatedText)}</div>
    </div>
    `}
    <div class="info">
      ℹ️ This popup is shown because the webpage doesn't allow script injection (e.g., Chrome internal pages, Chrome Web Store, or pages with strict security policies).
    </div>
  </div>
  <script>
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  </script>
</body>
</html>
  `;
  
  
  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(popupContent);
  
  
  chrome.windows.create({
    url: dataUrl,
    type: 'popup',
    width: 600,
    height: 500
  });
}
