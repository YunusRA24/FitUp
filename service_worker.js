// service_worker.js

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.type) return;

  if (msg.type === 'SAVE_ITEM') {
    try {
      chrome.storage.local.get({items: []}, (res) => {
        try {
          const items = res.items || [];
          // ensure id
          if (!msg.item.id) msg.item.id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
          items.unshift(msg.item);
          chrome.storage.local.set({items}, () => {
            try {
              if (chrome.runtime.lastError) {
                console.error('Storage error:', chrome.runtime.lastError);
                sendResponse({ok: false, error: chrome.runtime.lastError.message});
                return;
              }
              sendResponse({ok: true, id: msg.item.id});
            } catch (error) {
              console.error('Error in save response:', error);
              sendResponse({ok: false, error: error.message});
            }
          });
        } catch (error) {
          console.error('Error processing save item:', error);
          sendResponse({ok: false, error: error.message});
        }
      });
    } catch (error) {
      console.error('Error in save item handler:', error);
      sendResponse({ok: false, error: error.message});
    }
    return true;
  }

  // image picked by content script; update item with id
  if (msg.type === 'IMAGE_PICKED') {
    try {
      const {itemId, src} = msg;
      if (!itemId || !src) {
        console.error('Missing itemId or src in IMAGE_PICKED message');
        return;
      }
      
      chrome.storage.local.get({items: []}, (res) => {
        try {
          const items = (res.items || []).map(it => {
            if (it.id === itemId) {
              // set the image field to the selected src
              return {...it, image: src};
            }
            return it;
          });
          chrome.storage.local.set({items}, () => {
            try {
              if (chrome.runtime.lastError) {
                console.error('Storage error in image update:', chrome.runtime.lastError);
                return;
              }
              // notify any open popups/UI
              chrome.runtime.sendMessage({type: 'ITEM_UPDATED', itemId}, () => {
                if (chrome.runtime.lastError) {
                  console.error('Error sending update message:', chrome.runtime.lastError);
                }
              });
            } catch (error) {
              console.error('Error in image update callback:', error);
            }
          });
        } catch (error) {
          console.error('Error processing image update:', error);
        }
      });
    } catch (error) {
      console.error('Error in image picked handler:', error);
    }
    return;
  }

});
