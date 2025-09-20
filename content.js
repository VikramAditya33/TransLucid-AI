
let currentTooltip = null;
let tooltipTimeout = null;
let currentChat = null;
let chatHistory = [];
let contextText = '';
let apiKey = '';


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showTranslation') {
    showTranslationTooltip(request.translatedText);
  } else if (request.action === 'showError') {
    showErrorTooltip(request.message);
  } else if (request.action === 'openChat') {
    openChat(request.selectedText, request.apiKey);
  } else if (request.action === 'showChatError') {
    showChatError(request.message);
  }
});


function showTranslationTooltip(translatedText) {
  
  removeTooltip();
  
  
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  
  const tooltip = document.createElement('div');
  tooltip.className = 'gemini-translator-tooltip';
  tooltip.innerHTML = `
    <div class="gemini-translator-content">
      <button class="gemini-translator-close" title="Close">×</button>
      <div class="gemini-translator-text">${escapeHtml(translatedText)}</div>
    </div>
  `;
  
  
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  
  tooltip.style.position = 'absolute';
  tooltip.style.left = `${rect.left + scrollLeft + (rect.width / 2)}px`;
  tooltip.style.top = `${rect.top + scrollTop - 10}px`; 
  
  
  document.body.appendChild(tooltip);
  currentTooltip = tooltip;
  
  
  setTimeout(() => {
    const tooltipRect = tooltip.getBoundingClientRect();
    
    
    if (tooltipRect.left < 0) {
      tooltip.style.left = `${scrollLeft + 10}px`;
    } else if (tooltipRect.right > window.innerWidth) {
      tooltip.style.left = `${scrollLeft + window.innerWidth - tooltipRect.width - 10}px`;
    }
    
    
    if (tooltipRect.top < 0) {
      tooltip.style.top = `${rect.bottom + scrollTop + 10}px`;
    }
  }, 0);
  
  
  const closeButton = tooltip.querySelector('.gemini-translator-close');
  closeButton.addEventListener('click', removeTooltip);
  
 
  document.addEventListener('click', handleOutsideClick);
  
  
  document.addEventListener('selectionchange', handleSelectionChange);
}


function showErrorTooltip(message) {
  showTranslationTooltip(`Error: ${message}`);
  if (currentTooltip) {
    currentTooltip.classList.add('gemini-translator-error');
  }
}


function removeTooltip() {
  if (currentTooltip) {
    currentTooltip.remove();
    currentTooltip = null;
  }
  
  if (tooltipTimeout) {
    clearTimeout(tooltipTimeout);
    tooltipTimeout = null;
  }
  
  document.removeEventListener('click', handleOutsideClick);
  document.removeEventListener('selectionchange', handleSelectionChange);
}


function handleOutsideClick(event) {
  if (currentTooltip && !currentTooltip.contains(event.target)) {
    removeTooltip();
  }
}


function handleSelectionChange() {
  const selection = window.getSelection();
  if (selection.toString().trim()) {
    removeTooltip();
  }
}


function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}


function parseMarkdown(text) {
  
  let escaped = escapeHtml(text);
  
  
  
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  escaped = escaped.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  
  
  escaped = escaped.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  escaped = escaped.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>');
  
  
  escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  
  escaped = escaped.replace(/\n/g, '<br>');
  
  
  escaped = escaped.replace(/^[\s]*[-*]\s+(.+)$/gm, '<li>$1</li>');
  if (escaped.includes('<li>')) {
    escaped = '<ul>' + escaped + '</ul>';
  }
  
  
  escaped = escaped.replace(/^[\s]*\d+\.\s+(.+)$/gm, '<li>$1</li>');
  if (escaped.includes('<li>') && !escaped.includes('<ul>')) {
    escaped = '<ol>' + escaped + '</ol>';
  }
  
  return escaped;
}


async function openChat(selectedText, providedApiKey) {
  
  removeChat();
  
  contextText = selectedText;
  apiKey = providedApiKey;
  chatHistory = [];
  
  
  const chat = document.createElement('div');
  chat.className = 'ai-chat-container';
  chat.innerHTML = `
    <div class="ai-chat-header">
      <span class="ai-chat-title">TransLucid Assistant</span>
      <button class="ai-chat-close" title="Close">×</button>
    </div>
    <div class="ai-chat-messages" id="chatMessages"></div>
    <div class="ai-chat-input-container">
      <input type="text" class="ai-chat-input" placeholder="Ask a question about the selected text..." />
      <button class="ai-chat-send">Send</button>
    </div>
  `;
  
  
  chat.style.position = 'fixed';
  chat.style.bottom = '20px';
  chat.style.right = '20px';
  chat.style.zIndex = '2147483647';
  
  document.body.appendChild(chat);
  currentChat = chat;
  
  
  const closeButton = chat.querySelector('.ai-chat-close');
  const sendButton = chat.querySelector('.ai-chat-send');
  const input = chat.querySelector('.ai-chat-input');
  
  closeButton.addEventListener('click', removeChat);
  sendButton.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  
  
  try {
    addMessage('ai', 'Loading explanation...', true);
    const explanation = await getAIExplanation(selectedText, apiKey);
    
    const messagesContainer = chat.querySelector('#chatMessages');
    messagesContainer.innerHTML = '';
    addMessage('ai', explanation, false, true); 
  } catch (error) {
    console.error('Error getting AI explanation:', error);
    addMessage('ai', 'Sorry, I couldn\'t generate an explanation. Please try again.', false, true);
  }
}


function removeChat() {
  if (currentChat) {
    currentChat.remove();
    currentChat = null;
  }
  chatHistory = [];
  contextText = '';
  apiKey = '';
}


function addMessage(role, content, isLoading = false, useTypingAnimation = false) {
  if (!currentChat) return;
  
  const messagesContainer = currentChat.querySelector('#chatMessages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `ai-chat-message ai-chat-${role}`;
  
  if (isLoading) {
    messageDiv.innerHTML = `
      <div class="ai-chat-message-content">
        <div class="ai-chat-loading">${content}</div>
      </div>
    `;
  } else if (useTypingAnimation && role === 'ai') {
    messageDiv.innerHTML = `
      <div class="ai-chat-message-content">
        <span class="ai-chat-typing-text"></span>
        <span class="ai-chat-typing-cursor">|</span>
      </div>
    `;
    
    startTypingAnimation(messageDiv, content);
  } else {
    messageDiv.innerHTML = `
      <div class="ai-chat-message-content">${parseMarkdown(content)}</div>
    `;
  }
  
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  
  if (!isLoading) {
    chatHistory.push({ role, content });
  }
}


function startTypingAnimation(messageDiv, content) {
  const typingText = messageDiv.querySelector('.ai-chat-typing-text');
  const typingCursor = messageDiv.querySelector('.ai-chat-typing-cursor');
  const messagesContainer = currentChat.querySelector('#chatMessages');
  
  let index = 0;
  const typingSpeed = 20; 
  
  function typeNextCharacter() {
    if (index < content.length) {
      typingText.textContent += content[index];
      index++;
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      setTimeout(typeNextCharacter, typingSpeed);
    } else {
      
      typingCursor.style.display = 'none';
      
      const formattedContent = parseMarkdown(content);
      typingText.innerHTML = formattedContent;
    }
  }
  
  
  setTimeout(typeNextCharacter, 100);
}


async function sendMessage() {
  if (!currentChat) return;
  
  const input = currentChat.querySelector('.ai-chat-input');
  const message = input.value.trim();
  
  if (!message) return;
  
  
  addMessage('user', message);
  input.value = '';
  
  
  addMessage('ai', 'Thinking...', true);
  
  try {
    const response = await getAIChatResponse(message, contextText, chatHistory, apiKey);
   
    const messagesContainer = currentChat.querySelector('#chatMessages');
    const loadingMessage = messagesContainer.querySelector('.ai-chat-loading').parentElement.parentElement;
    loadingMessage.remove();
    addMessage('ai', response, false, true);
  } catch (error) {
    console.error('Error getting AI response:', error);
    
    const messagesContainer = currentChat.querySelector('#chatMessages');
    const loadingMessage = messagesContainer.querySelector('.ai-chat-loading').parentElement.parentElement;
    loadingMessage.remove();
    addMessage('ai', 'Sorry, I couldn\'t process your request. Please try again.', false, true);
  }
}


function showChatError(message) {
  if (currentChat) {
    addMessage('ai', `Error: ${message}`, false, true);
  } else {
    
    showErrorTooltip(message);
  }
}


async function getAIExplanation(text, apiKey) {
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
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
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (data.candidates && data.candidates.length > 0) {
    return data.candidates[0].content.parts[0].text.trim();
  } else {
    throw new Error('No explanation received from API');
  }
}


async function getAIChatResponse(userMessage, contextText, chatHistory, apiKey) {
 
  let contextPrompt = `You are an AI assistant helping a user understand the following text:\n\n"${contextText}"\n\n`;
  
  if (chatHistory && chatHistory.length > 0) {
    contextPrompt += "Previous conversation:\n";
    chatHistory.forEach(msg => {
      contextPrompt += `${msg.role}: ${msg.content}\n`;
    });
    contextPrompt += "\n";
  }
  
  contextPrompt += `User's question: ${userMessage}\n\nPlease provide a helpful response based on the context of the original text and the conversation history.`;
  
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
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
    })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (data.candidates && data.candidates.length > 0) {
    return data.candidates[0].content.parts[0].text.trim();
  } else {
    throw new Error('No response received from API');
  }
}
