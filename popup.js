// popup.js
const btn = document.getElementById('screenshotBtn');
const status = document.getElementById('status');
const itemsList = document.getElementById('itemsList');

function escapeHtml(s){ return (s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

function showStatus(message, isError = false) {
  status.textContent = message;
  status.style.color = isError ? '#d32f2f' : '#1976d2';
}

// Ensure content script is present; inject if necessary, then resolve
async function ensureContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content_script.js']
    });
  } catch (err) {
    // Cannot inject on restricted pages; propagate
    throw err;
  }
}

// Send a message to the content script; if it's not present, inject then retry once
async function sendMessageToContent(tabId, message) {
  return new Promise(async (resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, async (resp) => {
      const lastErr = chrome.runtime.lastError;
      if (lastErr && /Receiving end does not exist/i.test(lastErr.message || '')) {
        try {
          await ensureContentScript(tabId);
          chrome.tabs.sendMessage(tabId, message, (resp2) => {
            const lastErr2 = chrome.runtime.lastError;
            if (lastErr2) return reject(lastErr2);
            resolve(resp2);
          });
        } catch (injectErr) {
          return reject(injectErr);
        }
      } else if (lastErr) {
        return reject(lastErr);
      } else {
        resolve(resp);
      }
    });
  });
}

// Downscale a data URL to reduce storage usage
async function downscaleDataUrl(dataUrl, maxSize = 512) {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
          const w = Math.max(1, Math.round(img.width * ratio));
          const h = Math.max(1, Math.round(img.height * ratio));
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d', { willReadFrequently: false });
          ctx.drawImage(img, 0, 0, w, h);
          const out = canvas.toDataURL('image/jpeg', 0.8);
          resolve(out);
        } catch (e) { reject(e); }
      };
      img.onerror = (e) => reject(new Error('Image decode failed'));
      img.src = dataUrl;
    } catch (e) {
      reject(e);
    }
  });
}

async function refreshList(){
  try {
    const res = await chrome.storage.local.get({items: []});
    const items = res.items || [];
    itemsList.innerHTML = items.map((it, idx) => `
      <div class="item" data-id="${it.id}">
        <img class="thumbnail" src="${it.image || it.screenshot || ''}" onerror="this.style.display='none'" />
        <div class="meta">
          <div class="name">${escapeHtml(it.name || '(no name)')}</div>
          <div class="price">${escapeHtml(it.price || '')}</div>
          <div class="color">${escapeHtml(it.color || '')}</div>
          <div class="desc">${escapeHtml(it.description || '')}</div>
          <div class="row">
            <a href="${it.url || '#'}" target="_blank">Open on site</a> · 
            <a href="#" class="remove">Remove</a> · 
            <button class="pickImage" data-id="${it.id}">Pick image</button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error refreshing list:', error);
    showStatus('Error loading items', true);
  }

  // attach handlers
  Array.from(itemsList.querySelectorAll('.remove')).forEach(a => {
    a.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const id = e.target.closest('.item').getAttribute('data-id');
        const r = await chrome.storage.local.get({items: []});
        const items = (r.items || []).filter(it => it.id !== id);
        await chrome.storage.local.set({items});
        await refreshList();
        showStatus('Item removed');
      } catch (error) {
        console.error('Error removing item:', error);
        showStatus('Error removing item', true);
      }
    });
  });

  Array.from(itemsList.querySelectorAll('.pickImage')).forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const itemId = btn.getAttribute('data-id');
        showStatus('Click the model image on the page to set as cover...');
        // send message to content script to start selection on current active tab
        const [tab] = await chrome.tabs.query({active:true, currentWindow:true});
        if (!tab) { 
          showStatus('No active tab', true); 
          return; 
        }
        try {
          await sendMessageToContent(tab.id, {type: 'START_IMAGE_PICK', itemId});
        } catch (err) {
          showStatus('Error starting image picker: ' + (err?.message || String(err)), true);
          return;
        }
        // note: selection result will trigger service worker to update storage, and service worker sends ITEM_UPDATED message
      } catch (error) {
        console.error('Error starting image picker:', error);
        showStatus('Error starting image picker', true);
      }
    });
  });
}

// on save button -> extract info and add item (same as before but set id)
btn.addEventListener('click', async () => {
  try {
    showStatus('Extracting...');
    const [tab] = await chrome.tabs.query({active:true, currentWindow:true});
    if (!tab) { 
      showStatus('No active tab', true); 
      return; 
    }

    try {
      const resp = await sendMessageToContent(tab.id, {type: 'EXTRACT_INFO'});
      try {
        const extracted = resp?.info || {};
        chrome.tabs.captureVisibleTab(tab.windowId, {format: 'png'}, async (rawDataUrl) => {
          try {
            if (chrome.runtime.lastError) {
              showStatus('Screenshot failed: ' + chrome.runtime.lastError.message, true);
              return;
            }
            // Compress screenshot to avoid storage quota
            let dataUrl = rawDataUrl;
            try { dataUrl = await downscaleDataUrl(rawDataUrl, 640); } catch(_) {}
            const item = {
              id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
              screenshot: dataUrl,
              name: extracted.name || '',
              description: extracted.description || '',
              price: extracted.price || '',
              image: extracted.image || dataUrl,
              color: extracted.color || '',
              url: tab.url,
              capturedAt: Date.now()
            };
            chrome.runtime.sendMessage({type: 'SAVE_ITEM', item}, async (r) => {
              try {
                if (chrome.runtime.lastError) {
                  showStatus('Save failed: ' + chrome.runtime.lastError.message, true);
                  return;
                }
                if (!r?.ok) {
                  // Retry once with smaller payload (drop screenshot) in case of QUOTA
                  const slimItem = { ...item };
                  delete slimItem.screenshot;
                  slimItem.image = extracted.image || dataUrl;
                  chrome.runtime.sendMessage({type: 'SAVE_ITEM', item: slimItem}, async (r2) => {
                    if (chrome.runtime.lastError || !r2?.ok) {
                      showStatus('Save failed: storage quota exceeded', true);
                      return;
                    }
                    showStatus('Saved!', false);
                    await refreshList();
                  });
                  return;
                }
                showStatus('Saved!');
                await refreshList();
              } catch (error) {
                console.error('Error in save callback:', error);
                showStatus('Save failed', true);
              }
            });
          } catch (error) {
            console.error('Error in screenshot callback:', error);
            showStatus('Screenshot failed', true);
          }
        });
      } catch (error) {
        console.error('Error in message response:', error);
        showStatus('Extraction failed', true);
      }
    } catch (err) {
      showStatus('Extraction error: ' + (err?.message || String(err)), true);
      return;
    }
  } catch (error) {
    console.error('Error in main click handler:', error);
    showStatus('Error occurred', true);
  }
});

// Listen for background updates (when an image is picked)
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg && msg.type === 'ITEM_UPDATED') {
    // refresh list to show updated image
    refreshList().catch(error => {
      console.error('Error refreshing after item update:', error);
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  refreshList().catch(error => {
    console.error('Error on page load:', error);
  });
});
