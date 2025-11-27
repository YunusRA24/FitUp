// popup.js
const btn = document.getElementById('screenshotBtn');
const status = document.getElementById('status');
const itemsList = document.getElementById('itemsList');
const urlInput = document.getElementById('urlInput');
const addByUrlBtn = document.getElementById('addByUrlBtn');

// Tab functionality
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const targetTab = button.getAttribute('data-tab');
    
    // Update active tab button
    tabButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    // Update active tab content
    tabContents.forEach(content => content.classList.remove('active'));
    document.getElementById(`${targetTab}Tab`).classList.add('active');
  });
});

// Intro Tab - Style Preferences
const introStatus = document.getElementById('introStatus');
const cycleIndicator = document.getElementById('cycleIndicator');
const imageSelectionContainer = document.getElementById('imageSelectionContainer');

let currentCycle = 1;
const totalCycles = 4;
const API_URL = 'https://umichentr402.xano.io/api:5WPM75I0/stlyepref';

// Image cycles data structure
// For now, using placeholder images. User will provide actual images later
const imageCycles = [
  // Cycle 1 - placeholder images
  [
    { 
      src: 'https://i.pinimg.com/736x/35/47/3b/35473bae47a4ca135590541fac15078a.jpg', 
      attributes: { Formality: "casual", sleeve_OR_leg_style: "tapered_leg", color_tone: "muted", trend: "streetwear", silhouette: "fitted", Shoe_Preference: "boots", Headware: "none" }
    },
    { 
      src: 'https://preview.redd.it/wisdom-kayes-high-fashion-typography-v0-h896iwi8iyhe1.jpg?width=640&crop=smart&auto=webp&s=53374a1ba98d5559d8e8c026d41653f637a856e6', 
      attributes: { Formality: "formal", sleeve_OR_leg_style: "long_sleeve", color_tone: "earthy", trend: "business", silhouette: "fitted", Shoe_Preference: "dress_shoes", Headware: "beret" }
    },
    { 
      src: 'https://media.gq.com/photos/61d5fa07da1a211705adfde7/master/w_1600%2Cc_limit/stephen-curry-gq-sports-cover-february-2022-03-New-V2.jpg', 
      attributes: { Formality: "athleisure", sleeve_OR_leg_style: "sleeveless", color_tone: "vibrant", trend: "athletic", silhouette: "fitted", Shoe_Preference: "sneakers", Headware: "none" }
    }
  ],
  // Cycle 2 - placeholder images
  [
    { 
      src: 'https://media.gq-magazine.co.uk/photos/67099eff913eead956c29462/master/w_1600%2Cc_limit/1252110396', 
      attributes: { Formality: "casual", sleeve_OR_leg_style: "wide_leg", color_tone: "vibrant", trend: "streetwear", silhouette: "baggy", Shoe_Preference: "sneakers", Headware: "cap" }
    },
    { 
      src: 'https://i.pinimg.com/474x/f9/60/25/f9602594b6e78819980cc9bddf7054c2.jpg', 
      attributes: { Formality: "casual", sleeve_OR_leg_style: "wide_leg", color_tone: "earthy", trend: "streetwear", silhouette: "baggy", Shoe_Preference: "sneakers", Headware: "none" }
    },
    { 
      src: 'https://www.nxsttv.com/nmw/wp-content/uploads/sites/107/2025/02/GettyImages-2197480439.jpg?w=480', 
      attributes: { Formality: "formal", sleeve_OR_leg_style: "long_sleeve", color_tone: "vibrant", trend: "business", silhouette: "fitted", Shoe_Preference: "dress_shoes", Headware: "none" }
    }
  ],
  // Cycle 3 - placeholder images
  [
    { 
      src: 'https://i.pinimg.com/736x/13/42/71/134271319f9420dc8a63fce66f81802f.jpg', 
      attributes: { Formality: "casual", sleeve_OR_leg_style: "tapered_leg", color_tone: "earthy", trend: "streetwear", silhouette: "fitted", Shoe_Preference: "sneakers", Headware: "none" }
    },
    { 
      src: 'https://alexgear.com/cdn/shop/files/Peaky-Blinders-Thomas-Shelby-Black-Wool-Coat-2.jpg?v=1713830508', 
      attributes: { Formality: "formal", sleeve_OR_leg_style: "long_sleeve", color_tone: "muted", trend: "business", silhouette: "fitted", Shoe_Preference: "dress_shoes", Headware: "cap" }
    },
    { 
      src: 'https://cdn.nba.com/teams/legacy/www.nba.com/timberwolves/sites/timberwolves/files/gettyimages-894852284_594_screen.jpg', 
      attributes: { Formality: "casual", sleeve_OR_leg_style: "tapered_leg", color_tone: "vibrant", trend: "streetwear", silhouette: "baggy", Shoe_Preference: "sneakers", Headware: "beanie" }
    }
  ],
  // Cycle 4 - placeholder images
  [
    { 
      src: 'https://images.complex.com/complex/image/upload/v1723833987/sanity-new/drake-courtside-1.jpeg-133771036.jpg', 
      attributes: { Formality: "casual", sleeve_OR_leg_style: "tapered_leg", color_tone: "muted", trend: "streetwear", silhouette: "baggy", Shoe_Preference: "sneakers", Headware: "none" }
    },
    { 
      src: 'https://www.fashionbeans.com/wp-content/uploads/2018/08/travisscott-look-12.jpg', 
      attributes: { Formality: "casual", sleeve_OR_leg_style: "wide_leg", color_tone: "muted", trend: "streetwear", silhouette: "baggy", Shoe_Preference: "sneakers", Headware: "none" }
    },
    { 
      src: 'https://i.pinimg.com/474x/7e/5a/33/7e5a33c1730c205fe4b029def7b0a5ef.jpg', 
      attributes: { Formality: "business_casual", sleeve_OR_leg_style: "tapered_leg", color_tone: "muted", trend: "business", silhouette: "fitted", Shoe_Preference: "sneakers", Headware: "none" }
    }
  ]
];

function showIntroStatus(message, isError = false) {
  introStatus.textContent = message;
  introStatus.style.color = isError ? '#d32f2f' : '#1976d2';
}

async function sendStylePreferenceToAPI(attributes) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(attributes)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error sending style preference:', error);
    throw error;
  }
}

function displayCycleImages(cycleIndex) {
  if (cycleIndex >= imageCycles.length) {
    showIntroStatus('All cycles completed! Thank you for your preferences.', false);
    imageSelectionContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">You have completed all style preference selections.</p>';
    return;
  }

  const cycleImages = imageCycles[cycleIndex];
  imageSelectionContainer.innerHTML = '';

  cycleImages.forEach((imageData, index) => {
    const imageDiv = document.createElement('div');
    imageDiv.className = 'style-image';
    imageDiv.setAttribute('data-index', index);
    
    const img = document.createElement('img');
    img.src = imageData.src;
    img.alt = `Style option ${index + 1}`;
    
    imageDiv.appendChild(img);
    
    imageDiv.addEventListener('click', async () => {
      // Prevent multiple clicks
      if (imageDiv.classList.contains('loading')) return;
      
      // Mark as selected and loading
      document.querySelectorAll('.style-image').forEach(el => el.classList.remove('selected'));
      imageDiv.classList.add('selected', 'loading');
      
      try {
        showIntroStatus('Saving your preference...');
        await sendStylePreferenceToAPI(imageData.attributes);
        showIntroStatus('Preference saved!', false);
        
        // Wait a moment, then show next cycle
        setTimeout(() => {
          currentCycle++;
          if (currentCycle <= totalCycles) {
            cycleIndicator.textContent = `Cycle ${currentCycle} of ${totalCycles}`;
            displayCycleImages(currentCycle - 1);
            showIntroStatus('');
          } else {
            displayCycleImages(currentCycle - 1); // This will show completion message
          }
        }, 1000);
      } catch (error) {
        showIntroStatus('Error saving preference. Please try again.', true);
        imageDiv.classList.remove('loading', 'selected');
      }
    });
    
    imageSelectionContainer.appendChild(imageDiv);
  });
}

// Initialize intro tab when page loads
function initIntroTab() {
  currentCycle = 1;
  cycleIndicator.textContent = `Cycle ${currentCycle} of ${totalCycles}`;
  displayCycleImages(0);
}

// Suggestions Tab - AI Outfit Matching
const suggestionsStatus = document.getElementById('suggestionsStatus');
const generateSuggestionsBtn = document.getElementById('generateSuggestionsBtn');
const suggestionsResults = document.getElementById('suggestionsResults');
const logInfoBtn = document.getElementById('logInfoBtn');
const logInfoResults = document.getElementById('logInfoResults');

// Store raw AI response for logging
let lastRawAIResponse = null;

const XANO_API_URL = 'https://umichentr402.xano.io/api:5WPM75I0/stlyepref';
const GEMINI_API_KEY = 'AIzaSyBfMvHPpyaoazRhKMlr2-A_JUAeCVDuk6c';
// Using gemini-2.5-flash as per the official Gemini API guide
// For Chrome extensions, we use REST API directly (no npm packages needed)
const GEMINI_MODEL = 'gemini-2.5-flash'; // Change to 'gemini-2.5-pro' for better quality
// Using v1 API endpoint (v1beta may be deprecated)
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// Amazon pants dataset file path
const AMAZON_PANTS_DATASET_FILE = 'dataset_Amazon-crawler-task_2025-11-26_00-44-46-736.json';

function showSuggestionsStatus(message, isError = false) {
  suggestionsStatus.textContent = message;
  suggestionsStatus.style.color = isError ? '#d32f2f' : '#1976d2';
}

async function fetchUserPreferences() {
  try {
    const response = await fetch(XANO_API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    throw error;
  }
}

async function getCartItems() {
  try {
    const res = await chrome.storage.local.get({items: []});
    return res.items || [];
  } catch (error) {
    console.error('Error getting cart items:', error);
    return [];
  }
}

function analyzePreferences(preferences) {
  if (!preferences || preferences.length === 0) {
    return { commonAttributes: [] };
  }

  // Count occurrences of each attribute value
  const attributeCounts = {
    Formality: {},
    sleeve_OR_leg_style: {},
    color_tone: {},
    trend: {},
    silhouette: {},
    Shoe_Preference: {},
    Headware: {}
  };

  preferences.forEach(pref => {
    Object.keys(attributeCounts).forEach(key => {
      const value = pref[key];
      if (value && value !== 'ex' && value !== 'none') {
        attributeCounts[key][value] = (attributeCounts[key][value] || 0) + 1;
      }
    });
  });

  // Find most common values for each attribute
  const commonAttributes = [];
  Object.keys(attributeCounts).forEach(key => {
    const counts = attributeCounts[key];
    const entries = Object.entries(counts);
    if (entries.length > 0) {
      entries.sort((a, b) => b[1] - a[1]);
      const mostCommon = entries[0];
      if (mostCommon[1] >= 2) { // Only include if it appears at least twice
        commonAttributes.push(`${key}: ${mostCommon[0]}`);
      }
    }
  });

  return { commonAttributes };
}

async function callGeminiAPI(prompt) {
  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

// Format cart items for the prompt (only tops for now)
function formatCartItemsForPrompt(cartItems) {
  if (!cartItems || cartItems.length === 0) {
    return 'The cart is currently empty.';
  }

  // Filter to only tops (for now, we'll assume all items in cart are tops)
  // You can add logic here to filter by item type if needed
  const tops = cartItems;

  return tops.map((item, idx) => {
    return `Item ${idx + 1}:
- Name: ${item.name || 'Unknown'}
- Description: ${item.description || 'No description'}
- Price: ${item.price || 'Unknown'}
- Color: ${item.color || 'Unknown'}
- URL: ${item.url || 'N/A'}`;
  }).join('\n\n');
}

// Format Amazon pants data for the prompt
function formatPantsForPrompt(pantsData) {
  if (!pantsData || pantsData.length === 0) {
    return 'No pants available.';
  }

  return JSON.stringify(pantsData, null, 2);
}

// Fetch Amazon pants data from the dataset file
async function fetchAmazonPants() {
  try {
    // Try using chrome.runtime.getURL first (for extension context)
    let url;
    try {
      url = chrome.runtime.getURL(AMAZON_PANTS_DATASET_FILE);
    } catch (e) {
      // Fallback to relative path if chrome.runtime is not available
      url = AMAZON_PANTS_DATASET_FILE;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Amazon pants dataset:', error);
    throw new Error('Failed to load Amazon pants dataset. Please ensure the dataset file is in the extension directory.');
  }
}

// Build the Gemini prompt as specified by the user
function buildOutfitMatchingPrompt(preferences, cartItems, pantsData) {
  const preferencesText = JSON.stringify(preferences, null, 2);
  const cartItemsText = formatCartItemsForPrompt(cartItems);
  const pantsText = formatPantsForPrompt(pantsData);

  return `I want you to look at all of the preferences that the user has for clothing and try to generalize his/her style preferences into a sentence. do this based on the most common attributes that you within all of the choices that the user made. 

Here are the preferences that the user made that you can generalize through:

${preferencesText}

Then once you have analyzed all of the user preferences then I want you to also analyze all of the current items that the user has in his cart.

${cartItemsText}

Now I want you to match each and every item in the users shopping cart with one bottom that you see from the list below. remember that you should only match one item in the cart with one item from the list below. please keep in mind what the user perfers in terms of clothing and also what colors/tones you think would work well together (opposity of the color specturm or maybe match formal with formal as an example). I want you to return these matches exxactly like this. first list of the sentence that you made after analyzing the users preferences. directly after that insert the link of the item that you matched with the items in the cart (do this is respective order so for example the first link you give should match with the first item in the cart). do not include anything else at all. no other sentences should preceed or follow this items at all. your response should only have the items listed above and nothing else. Here are the bottoms for you to match below:

${pantsText}`;
}

// Parse Gemini response to extract style summary and matched URLs
function parseGeminiResponse(responseText) {
  const lines = responseText.split('\n').map(line => line.trim()).filter(line => line);
  
  // First line should be the style summary
  const styleSummary = lines[0] || '';
  
  // Remaining lines should be URLs (one per cart item)
  const matchedUrls = lines.slice(1).filter(line => {
    // Check if it looks like a URL
    return line.startsWith('http://') || line.startsWith('https://') || line.includes('amazon.com');
  });
  
  return {
    styleSummary,
    matchedUrls
  };
}

// Display outfit matches visually
function displayOutfitMatches(cartItems, matchedUrls, styleSummary, pantsData) {
  if (!cartItems || cartItems.length === 0) {
    suggestionsResults.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No items in cart to match.</p>';
    return;
  }

  let html = '';
  
  // Display style summary
  if (styleSummary) {
    html += `<div class="style-summary">${escapeHtml(styleSummary)}</div>`;
  }
  
  // Display outfit matches
  html += '<div class="outfit-container">';
  
  cartItems.forEach((item, index) => {
    const matchedUrl = matchedUrls[index] || null;
    
    // Find the matching pants data from the pantsData array
    let matchedPants = null;
    if (matchedUrl && pantsData) {
      matchedPants = pantsData.find(pants => {
        // Match by URL
        if (pants.url && matchedUrl.includes(pants.url.split('/dp/')[1]?.split('?')[0])) {
          return true;
        }
        // Match by ASIN if available
        if (pants.asin) {
          const urlAsin = matchedUrl.match(/\/dp\/([A-Z0-9]{10})/);
          if (urlAsin && urlAsin[1] === pants.asin) {
            return true;
          }
        }
        return false;
      });
    }
    
    html += `
      <div class="outfit-match">
        <div class="outfit-images">
          <div class="outfit-item">
            <img src="${item.image || item.screenshot || ''}" alt="${escapeHtml(item.name || 'Top')}" class="outfit-item-image" onerror="this.style.display='none'" />
            <div class="outfit-item-name">${escapeHtml(getShortName(item.name || 'Top'))}</div>
          </div>
          ${matchedUrl ? `
          <div class="outfit-item">
            <img src="${matchedPants?.thumbnailImage || ''}" alt="${escapeHtml(matchedPants?.title || 'Matched Bottom')}" class="outfit-item-image" onerror="this.style.display='none'" />
            <div class="outfit-item-name">${escapeHtml(getShortName(matchedPants?.title || 'Matched Bottom'))}</div>
            <a href="${escapeHtml(matchedUrl)}" target="_blank" style="font-size: 11px; color: #1976d2; margin-top: 4px; text-decoration: none;">View on Amazon</a>
          </div>
          ` : '<div class="outfit-item"><div class="outfit-item-name">No match found</div></div>'}
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  
  suggestionsResults.innerHTML = html;
}

// Get short name (abbreviated)
function getShortName(fullName) {
  if (!fullName) return 'Item';
  const words = fullName.split(' ');
  if (words.length <= 3) return fullName;
  return words.slice(0, 3).join(' ') + '...';
}

// Main function to generate suggestions
generateSuggestionsBtn.addEventListener('click', async () => {
  try {
    generateSuggestionsBtn.disabled = true;
    showSuggestionsStatus('Fetching your preferences...');
    suggestionsResults.innerHTML = '';

    // Fetch user preferences from Xano
    const preferences = await fetchUserPreferences();
    if (!preferences || preferences.length === 0) {
      throw new Error('No style preferences found. Please complete the Style Preferences tab first.');
    }

    showSuggestionsStatus('Loading cart items...');

    // Get cart items (only tops for now)
    const cartItems = await getCartItems();
    if (!cartItems || cartItems.length === 0) {
      throw new Error('Your cart is empty. Add some items to your cart first.');
    }

    showSuggestionsStatus('Fetching best-selling pants...');

    // Fetch Amazon pants data
    // Note: You'll need to provide the pants data either via API or manually
    // For now, this will need to be set up with your data scraper
    let pantsData = await fetchAmazonPants();
    
    // If no API endpoint, you'll need to provide the data manually
    // For testing, you can uncomment and provide sample data:
    /*
    if (!pantsData) {
      pantsData = [
        {
          "title": "Sample Pant",
          "url": "https://www.amazon.com/dp/B07T5GBSDH",
          "thumbnailImage": "https://example.com/image.jpg"
        }
      ];
    }
    */
    
    if (!pantsData || pantsData.length === 0) {
      throw new Error('Unable to fetch pants data. Please ensure your data scraper is configured.');
    }

    showSuggestionsStatus('Generating AI outfit matches...');

    // Build the prompt
    const prompt = buildOutfitMatchingPrompt(preferences, cartItems, pantsData);

    // Call Gemini API
    const geminiResponse = await callGeminiAPI(prompt);

    // Store raw response for logging
    lastRawAIResponse = {
      prompt: prompt,
      fullResponse: geminiResponse,
      responseText: null
    };

    // Extract the text from Gemini response
    let responseText = '';
    if (geminiResponse.candidates && geminiResponse.candidates[0] && geminiResponse.candidates[0].content) {
      responseText = geminiResponse.candidates[0].content.parts[0].text;
      lastRawAIResponse.responseText = responseText;
    } else {
      throw new Error('Unexpected response format from Gemini API');
    }

    // Parse the response
    const { styleSummary, matchedUrls } = parseGeminiResponse(responseText);

    // Display the results
    displayOutfitMatches(cartItems, matchedUrls, styleSummary, pantsData);

    // Show the Log Info button
    logInfoBtn.style.display = 'block';
    logInfoResults.style.display = 'none';

    showSuggestionsStatus('Outfit suggestions generated successfully!', false);
    generateSuggestionsBtn.disabled = false;
  } catch (error) {
    console.error('Error generating suggestions:', error);
    showSuggestionsStatus('Error: ' + (error.message || String(error)), true);
    suggestionsResults.innerHTML = '';
    logInfoBtn.style.display = 'none';
    logInfoResults.style.display = 'none';
    generateSuggestionsBtn.disabled = false;
  }
});

// Log Info button handler
logInfoBtn.addEventListener('click', () => {
  if (!lastRawAIResponse) {
    logInfoResults.innerHTML = '<p style="color: #666; padding: 12px;">No AI response data available. Generate suggestions first.</p>';
    logInfoResults.style.display = 'block';
    return;
  }

  // Toggle visibility
  if (logInfoResults.style.display === 'none' || logInfoResults.style.display === '') {
    // Show the raw output
    let logContent = '<div style="background: #f9f9f9; padding: 16px; border-radius: 8px; border: 1px solid #ddd; max-height: 500px; overflow-y: auto;">';
    logContent += '<h4 style="margin-top: 0; color: #333;">Raw AI Response Text:</h4>';
    logContent += `<pre style="white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.5; color: #333; background: white; padding: 12px; border-radius: 4px; border: 1px solid #ccc; overflow-x: auto;">${escapeHtml(lastRawAIResponse.responseText || 'No response text')}</pre>`;
    logContent += '<h4 style="margin-top: 16px; color: #333;">Full API Response:</h4>';
    logContent += `<pre style="white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 11px; line-height: 1.4; color: #333; background: white; padding: 12px; border-radius: 4px; border: 1px solid #ccc; overflow-x: auto; max-height: 300px; overflow-y: auto;">${escapeHtml(JSON.stringify(lastRawAIResponse.fullResponse, null, 2))}</pre>`;
    logContent += '</div>';
    logInfoResults.innerHTML = logContent;
    logInfoResults.style.display = 'block';
    logInfoBtn.textContent = 'Hide Log Info';
  } else {
    // Hide the raw output
    logInfoResults.style.display = 'none';
    logInfoBtn.textContent = 'Log Info';
  }
});

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

// Extract product info from a URL
async function extractFromUrl(url) {
  try {
    // Validate URL
    if (!url || !url.trim()) {
      throw new Error('Please enter a valid URL');
    }
    
    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    
    showStatus('Opening page to extract info...');
    
    // Create a background tab
    const tab = await chrome.tabs.create({
      url: normalizedUrl,
      active: false
    });
    
    // Wait for the tab to load
    await new Promise((resolve, reject) => {
      const checkComplete = (tabId, changeInfo) => {
        if (tabId === tab.id) {
          if (changeInfo.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(checkComplete);
            resolve();
          } else if (changeInfo.status === 'loading' && changeInfo.url && changeInfo.url.startsWith('chrome-error://')) {
            chrome.tabs.onUpdated.removeListener(checkComplete);
            reject(new Error('Failed to load page. Please check the URL.'));
          }
        }
      };
      chrome.tabs.onUpdated.addListener(checkComplete);
      
      // Timeout after 15 seconds
      setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(checkComplete);
        reject(new Error('Page load timeout. Please try again.'));
      }, 15000);
    });
    
    showStatus('Extracting product information...');
    
    // Ensure content script is injected
    await ensureContentScript(tab.id);
    
    // Wait a bit for content script to initialize
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Extract product info
    const resp = await sendMessageToContent(tab.id, {type: 'EXTRACT_INFO'});
    
    if (!resp || !resp.info) {
      throw new Error('Failed to extract product information');
    }
    
    const extracted = resp.info;
    
    // Capture screenshot of the product area (optional, but useful)
    let screenshotDataUrl = null;
    try {
      screenshotDataUrl = await new Promise((resolve, reject) => {
        chrome.tabs.captureVisibleTab(tab.windowId, {format: 'png'}, (dataUrl) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(dataUrl);
          }
        });
      });
      // Downscale screenshot
      if (screenshotDataUrl) {
        try {
          screenshotDataUrl = await downscaleDataUrl(screenshotDataUrl, 640);
        } catch (e) {
          console.warn('Failed to downscale screenshot:', e);
        }
      }
    } catch (e) {
      console.warn('Failed to capture screenshot:', e);
    }
    
    // Close the background tab
    try {
      await chrome.tabs.remove(tab.id);
    } catch (e) {
      console.warn('Failed to close tab:', e);
    }
    
    // Create item object
    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      screenshot: screenshotDataUrl || null,
      name: extracted.name || '',
      description: extracted.description || '',
      price: extracted.price || '',
      image: extracted.image || screenshotDataUrl || null,
      color: extracted.color || '',
      url: normalizedUrl,
      capturedAt: Date.now()
    };
    
    // Save the item
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({type: 'SAVE_ITEM', item}, async (r) => {
        if (chrome.runtime.lastError) {
          reject(new Error('Save failed: ' + chrome.runtime.lastError.message));
          return;
        }
        if (!r?.ok) {
          // Retry with smaller payload (drop screenshot)
          const slimItem = { ...item };
          delete slimItem.screenshot;
          slimItem.image = extracted.image || screenshotDataUrl || null;
          chrome.runtime.sendMessage({type: 'SAVE_ITEM', item: slimItem}, async (r2) => {
            if (chrome.runtime.lastError || !r2?.ok) {
              reject(new Error('Save failed: storage quota exceeded'));
              return;
            }
            resolve(slimItem);
          });
          return;
        }
        resolve(item);
      });
    });
    
  } catch (error) {
    throw error;
  }
}

// Add by URL button handler
addByUrlBtn.addEventListener('click', async () => {
  try {
    const url = urlInput.value.trim();
    if (!url) {
      showStatus('Please enter a URL', true);
      return;
    }
    
    addByUrlBtn.disabled = true;
    urlInput.disabled = true;
    
    try {
      const item = await extractFromUrl(url);
      showStatus('Item added successfully!', false);
      urlInput.value = ''; // Clear input
      await refreshList();
    } catch (error) {
      console.error('Error extracting from URL:', error);
      showStatus('Error: ' + (error.message || String(error)), true);
    } finally {
      addByUrlBtn.disabled = false;
      urlInput.disabled = false;
    }
  } catch (error) {
    console.error('Error in add by URL handler:', error);
    showStatus('Error occurred', true);
    addByUrlBtn.disabled = false;
    urlInput.disabled = false;
  }
});

// Allow Enter key to submit URL
urlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addByUrlBtn.click();
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
  // Initialize intro tab
  initIntroTab();
  
  // Initialize cart tab
  refreshList().catch(error => {
    console.error('Error on page load:', error);
  });
});
