document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKey');
  const targetLanguageSelect = document.getElementById('targetLanguage');
  const saveButton = document.getElementById('saveButton');
  const statusDiv = document.getElementById('status');

  
  try {
    const result = await chrome.storage.local.get(['geminiApiKey', 'targetLanguage']);
    if (result.geminiApiKey) {
      apiKeyInput.value = result.geminiApiKey;
      showStatus('Settings already configured', 'info');
    }
    if (result.targetLanguage) {
      targetLanguageSelect.value = result.targetLanguage;
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }

  
  saveButton.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    const targetLanguage = targetLanguageSelect.value;
    
    if (!apiKey) {
      showStatus('Please enter an API key', 'error');
      return;
    }

    if (!targetLanguage) {
      showStatus('Please select a target language', 'error');
      return;
    }

    try {
      saveButton.disabled = true;
      saveButton.textContent = 'Saving...';
      
      
      await chrome.storage.local.set({ 
        geminiApiKey: apiKey,
        targetLanguage: targetLanguage
      });
      
      showStatus('Settings saved successfully!', 'success');
      
      
      setTimeout(() => {
        saveButton.disabled = false;
        saveButton.textContent = 'Save Settings';
      }, 1000);
      
    } catch (error) {
      console.error('Error saving settings:', error);
      showStatus('Failed to save settings', 'error');
      saveButton.disabled = false;
      saveButton.textContent = 'Save Settings';
    }
  });

  
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.classList.remove('hidden');
    
    
    if (type === 'success') {
      setTimeout(() => {
        statusDiv.classList.add('hidden');
      }, 3000);
    }
  }

  
  apiKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveButton.click();
    }
  });
});
