// content_script.js
// Product extractor (sanitizes price) + image-pick overlay for selecting an image on the page.

// -------------------- Utilities --------------------
function normalizeUrl(url) {
  try { return new URL(url, location.href).toString(); } catch(e){ return url || ''; }
}
function safeText(el) { return el ? (el.innerText || el.textContent || '').trim() : ''; }

// Parse price occurrences and choose the most appropriate single price string
function sanitizePriceString(raw) {
  if (!raw) return '';
  // find all currency+amount patterns
  const body = String(raw);
  const matches = body.match(/(USD|\$|€|£)\s?[0-9]+(?:[,.][0-9]{2})?/gi) || [];
  // also capture numbers that might not have symbols
  const numMatches = body.match(/[0-9]+(?:[,.][0-9]{2})?/g) || [];
  // normalize and dedupe
  const normalized = new Set();
  matches.forEach(m => normalized.add(m.trim()));
  // if no currency-symbol matches but we have numeric ones, make them $-less candidates
  if (normalized.size === 0 && numMatches.length) {
    numMatches.forEach(m => normalized.add(m.trim()));
  }
  const arr = Array.from(normalized);
  if (arr.length === 0) {
    // fallback: collapse whitespace and remove duplicates like "$29 $29"
    return body.replace(/\s+/g,' ').trim();
  }
  // pick the smallest numeric amount (sale price) if multiple
  let best = arr[0];
  try {
    const parsed = arr.map(s => {
      const num = Number(s.replace(/[^0-9.,]/g,'').replace(',', '.'));
      return {raw: s, n: isNaN(num) ? Infinity : num};
    }).sort((a,b) => a.n - b.n);
    best = parsed[0].raw;
  } catch(e) { best = arr[0]; }
  return best;
}

// -------------------- Image pick overlay --------------------
let _overlayState = null;

function createImagePickerOverlay(itemId) {
  try {
    // Remove existing overlay if present
    removeImagePickerOverlay();

    const overlay = document.createElement('div');
    overlay.id = 'fitup-image-picker-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      zIndex: 2147483647, // very top
      cursor: 'crosshair',
      background: 'rgba(0,0,0,0.02)'
    });

  // helper highlight box
  const highlight = document.createElement('div');
  highlight.id = 'fitup-image-picker-highlight';
  Object.assign(highlight.style, {
    position: 'absolute',
    border: '3px solid #29a3ff',
    boxSizing: 'border-box',
    pointerEvents: 'none',
    borderRadius: '4px',
    display: 'none',
    zIndex: 2147483648
  });

  // instruction badge
  const badge = document.createElement('div');
  badge.id = 'fitup-image-picker-badge';
  badge.innerText = 'Click an image to set as cover — Esc to cancel';
  Object.assign(badge.style, {
    position: 'fixed',
    top: '12px',
    right: '12px',
    background: '#000',
    color: '#fff',
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '13px',
    zIndex: 2147483649,
    opacity: 0.85
  });

  overlay.appendChild(highlight);
  document.documentElement.appendChild(overlay);
  document.documentElement.appendChild(badge);

  // handlers
  function endPick() {
    removeImagePickerOverlay();
    // cleanup
    overlay.removeEventListener('mousemove', onMove);
    overlay.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKey);
  }

  function onMove(e) {
    // find topmost img under cursor using elementFromPoint
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const img = findImageElement(el);
    if (img) {
      const rect = img.getBoundingClientRect();
      Object.assign(highlight.style, {
        left: rect.left + 'px',
        top: rect.top + 'px',
        width: rect.width + 'px',
        height: rect.height + 'px',
        display: 'block'
      });
    } else {
      highlight.style.display = 'none';
    }
  }

  function onClick(e) {
    try {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const img = findImageElement(el);
      if (img) {
        e.preventDefault();
        e.stopPropagation();
        const src = img.currentSrc || img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy') || '';
        const fixed = normalizeUrl(src);
        // send message to background to update item
        chrome.runtime.sendMessage({type: 'IMAGE_PICKED', itemId, src: fixed}, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error sending image picked message:', chrome.runtime.lastError);
          }
        });
        endPick();
      }
    } catch (error) {
      console.error('Error in image picker click handler:', error);
      endPick();
    }
  }

  function onKey(ev) {
    if (ev.key === 'Escape') {
      endPick();
    }
  }

  overlay.addEventListener('mousemove', onMove, {capture: true});
  overlay.addEventListener('click', onClick, {capture: true});
  document.addEventListener('keydown', onKey);

    // store state
    _overlayState = {overlay, highlight, badge};
  } catch (error) {
    console.error('Error creating image picker overlay:', error);
    throw error;
  }
}

function removeImagePickerOverlay() {
  if (!_overlayState) return;
  try { 
    _overlayState.overlay.remove(); 
  } catch(e){
    console.error('Error removing overlay:', e);
  }
  try { 
    _overlayState.highlight.remove(); 
  } catch(e){
    console.error('Error removing highlight:', e);
  }
  try { 
    _overlayState.badge.remove(); 
  } catch(e){
    console.error('Error removing badge:', e);
  }
  _overlayState = null;
}

function findImageElement(el) {
  if (!el) return null;
  // if the element is an image, return it
  if (el.tagName && el.tagName.toLowerCase() === 'img') return el;
  // sometimes click on a child inside a <figure> or <a>
  let cur = el;
  for (let i=0;i<6 && cur;i++) {
    if (cur.tagName && cur.tagName.toLowerCase() === 'img') return cur;
    cur = cur.parentElement;
  }
  return null;
}

// -------------------- Product info extraction --------------------
function parseJsonLD() {
  const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
  for (const s of scripts) {
    try {
      const data = JSON.parse(s.textContent);
      const arr = Array.isArray(data) ? data : [data];
      for (const c of arr) {
        const t = (c['@type'] || '').toString().toLowerCase();
        if (t.includes('product') || t.includes('offer')) {
          const name = c.name || c.title || (c.mainEntity && c.mainEntity.name) || '';
          const description = c.description || '';
          let price = '';
          const offers = c.offers || (c.mainEntity && c.mainEntity.offers);
          if (offers) {
            const off = Array.isArray(offers) ? offers[0] : offers;
            price = off?.price ? String(off.price) : off?.priceSpecification?.price || '';
            if (off?.priceCurrency && price) price = off.priceCurrency + ' ' + price;
          }
          const image = c.image || c.thumbnailUrl || '';
          const color = c.color || '';
          return {name, description, price, image, color};
        }
      }
    } catch (e) { /* ignore parse errors */ }
  }
  return null;
}

function extractAmazonPrice() {
  // Amazon-specific price selectors (in order of preference)
  const amazonPriceSelectors = [
    '.a-price .a-offscreen', // Hidden price for screen readers (most reliable)
    '.a-price-whole', // Price whole number part
    '#priceblock_ourprice', // Regular price
    '#priceblock_dealprice', // Deal price
    '#priceblock_saleprice', // Sale price
    '#price', // Generic price ID
    '.a-price-symbol + .a-price-whole', // Price with symbol
    '[data-a-color="price"] .a-offscreen', // Price in data attribute
    '.a-price.a-text-price .a-offscreen', // Text price
    '#price_inside_buybox', // Price in buy box
    '#newBuyBoxPrice', // New buy box price
    '.a-price-range', // Price range
  ];

  for (const selector of amazonPriceSelectors) {
    const el = document.querySelector(selector);
    if (el) {
      let priceText = '';
      // For .a-offscreen, get the text content
      if (selector.includes('.a-offscreen')) {
        priceText = el.textContent || el.innerText || '';
      } else {
        // For other selectors, try to get the full price including symbol
        const priceContainer = el.closest('.a-price') || el;
        if (priceContainer) {
          // Try to get the full price including currency symbol
          const symbol = priceContainer.querySelector('.a-price-symbol')?.textContent || '$';
          const whole = priceContainer.querySelector('.a-price-whole')?.textContent || '';
          const fraction = priceContainer.querySelector('.a-price-fraction')?.textContent || '';
          if (whole) {
            priceText = symbol + whole + (fraction ? '.' + fraction : '');
          } else {
            priceText = priceContainer.textContent || priceContainer.innerText || '';
          }
        } else {
          priceText = el.textContent || el.innerText || '';
        }
      }
      
      if (priceText) {
        // Clean up the price text
        priceText = priceText.trim();
        // Extract price pattern
        const match = priceText.match(/(USD|\$|€|£)\s?([0-9]+(?:[,.][0-9]{2})?)/i);
        if (match) {
          return match[0];
        }
        // If no currency symbol, try to find just the number
        const numMatch = priceText.match(/[0-9]+(?:[,.][0-9]{2})?/);
        if (numMatch) {
          return '$' + numMatch[0];
        }
      }
    }
  }
  
  return null;
}

function textFallbacks() {
  const ogTitle = document.querySelector('meta[property="og:title"]')?.content;
  const metaTitle = document.querySelector('meta[name="title"]')?.content;
  const h1 = document.querySelector('h1')?.innerText?.trim();
  const title = ogTitle || metaTitle || h1 || document.title || '';
  const desc = document.querySelector('meta[name="description"]')?.content || '';

  let price = '';
  
  // Amazon-specific price extraction
  const isAmazon = window.location.hostname.includes('amazon.com') || 
                   window.location.hostname.includes('amazon.');
  if (isAmazon) {
    const amazonPrice = extractAmazonPrice();
    if (amazonPrice) {
      price = amazonPrice;
    }
  }
  
  // Fallback to generic price selectors if Amazon-specific extraction didn't work
  if (!price) {
    const priceSelectors = [
      '[itemprop="price"]', '.price', '[class*="price"]', '[id*="price"]', '.product-price'
    ];
    for (const sel of priceSelectors) {
      const el = document.querySelector(sel);
      if (el && (el.innerText || el.textContent)) {
        const t = el.innerText.trim();
        if (t) { price = t; break; }
      }
    }
  }
  
  if (!price) {
    const bodyText = document.body.innerText;
    const match = bodyText.match(/(USD|\$|€|£)\s?[0-9]+(?:[,.][0-9]{2})?/i);
    if (match) price = match[0];
    else {
      // maybe there are two prices like "$49.95 $29" – capture them all and pick one
      const all = document.body.innerText.match(/(USD|\$|€|£)?\s?[0-9]+(?:[,.][0-9]{2})?/gi);
      if (all && all.length) {
        // Filter out very large numbers (likely subtotals or totals)
        const prices = all.filter(p => {
          const num = parseFloat(p.replace(/[^0-9.,]/g, '').replace(',', '.'));
          return num < 10000; // Filter out prices over $10,000 (likely totals)
        });
        if (prices.length > 0) {
          // Pick the smallest price (usually the product price, not subtotal)
          const sorted = prices.map(p => {
            const num = parseFloat(p.replace(/[^0-9.,]/g, '').replace(',', '.'));
            return {raw: p, num: isNaN(num) ? Infinity : num};
          }).sort((a, b) => a.num - b.num);
          price = sorted[0].raw;
        } else {
          price = all.slice(0,4).join(' ');
        }
      }
    }
  }

  let color = '';
  const colorEl = document.querySelector('[itemprop="color"]') || Array.from(document.querySelectorAll('div,span,p'))
    .find(n => n.innerText && /color(?:\:)?\s*[A-Za-z0-9\-\s]{2,30}/i.test(n.innerText));
  if (colorEl) {
    const m = colorEl.innerText.match(/color(?:\:)?\s*([A-Za-z0-9\-\s]{2,30})/i);
    if (m) color = m[1].trim();
    else color = colorEl.getAttribute('content') || colorEl.innerText.trim();
  }

  return {name: title, description: desc, price: sanitizePriceString(price), color};
}

function collectBestImage() {
  // prefer JSON-LD / og:image, else find large images (simple heuristic)
  const json = parseJsonLD();
  if (json && json.image) return normalizeUrl(json.image);
  const og = document.querySelector('meta[property="og:image"]')?.content;
  if (og) return normalizeUrl(og);

  // Amazon-specific image extraction
  const isAmazon = window.location.hostname.includes('amazon.com') || 
                   window.location.hostname.includes('amazon.');
  if (isAmazon) {
    // Try Amazon-specific selectors for main product image
    const amazonSelectors = [
      '#landingImage',
      '#imgBlkFront',
      '#main-image',
      '#imageBlock_feature_div img',
      '#leftCol img[data-a-image-name="landingImage"]',
      '#main-image-container img',
      '#imageBlock img',
      '.a-dynamic-image[data-a-image-name="landingImage"]',
      '#product-image img',
      '#imageBlock_feature_div .a-dynamic-image'
    ];
    
    for (const selector of amazonSelectors) {
      const img = document.querySelector(selector);
      if (img) {
        // Try data-a-dynamic-image first (Amazon's JSON format)
        const dynamicImageData = img.getAttribute('data-a-dynamic-image');
        if (dynamicImageData) {
          try {
            const imageMap = JSON.parse(dynamicImageData);
            // Get the largest image from the map (keys are URLs, values are dimensions)
            if (typeof imageMap === 'object' && imageMap !== null) {
              const imageEntries = Object.entries(imageMap);
              if (imageEntries.length > 0) {
                // Sort by area (width * height) and get the largest
                imageEntries.sort((a, b) => {
                  const areaA = (a[1] && a[1][0] * a[1][1]) || 0;
                  const areaB = (b[1] && b[1][0] * b[1][1]) || 0;
                  return areaB - areaA;
                });
                const largestUrl = imageEntries[0][0];
                if (largestUrl) {
                  return normalizeUrl(largestUrl);
                }
              }
            }
          } catch (e) {
            // If JSON parse fails, continue to other methods
          }
        }
        
        // Try standard image attributes
        const src = img.src || img.currentSrc || img.getAttribute('data-src') || 
                   img.getAttribute('data-old-src');
        if (src) {
          // Clean up Amazon image URLs - remove size parameters to get full resolution
          let cleanSrc = src;
          // Amazon images often have size parameters like _AC_SX679_ or _AC_UX679_
          // Remove these to get a better quality image
          cleanSrc = cleanSrc.replace(/_[A-Z]{2}_[A-Z]?[0-9]+_/g, '_AC_');
          // Try to get the base image without size restrictions
          if (cleanSrc.includes('_AC_')) {
            cleanSrc = cleanSrc.replace(/_AC_[A-Z]?[0-9]+(_[A-Z]+)?/g, '');
          }
          return normalizeUrl(cleanSrc);
        }
      }
    }
    
    // Fallback: look for images in the product image container area
    const imageContainer = document.querySelector('#imageBlock, #imageBlock_feature_div, #leftCol');
    if (imageContainer) {
      const imgs = Array.from(imageContainer.querySelectorAll('img'));
      for (const img of imgs) {
        // Try data-a-dynamic-image first
        const dynamicImageData = img.getAttribute('data-a-dynamic-image');
        if (dynamicImageData) {
          try {
            const imageMap = JSON.parse(dynamicImageData);
            if (typeof imageMap === 'object' && imageMap !== null) {
              const imageEntries = Object.entries(imageMap);
              if (imageEntries.length > 0) {
                imageEntries.sort((a, b) => {
                  const areaA = (a[1] && a[1][0] * a[1][1]) || 0;
                  const areaB = (b[1] && b[1][0] * b[1][1]) || 0;
                  return areaB - areaA;
                });
                const largestUrl = imageEntries[0][0];
                if (largestUrl && !largestUrl.includes('sprite') && !largestUrl.includes('icon') && 
                    !largestUrl.includes('logo') && !largestUrl.includes('badge')) {
                  return normalizeUrl(largestUrl);
                }
              }
            }
          } catch (e) {
            // Continue to other methods
          }
        }
        
        // Try standard image attributes
        const src = img.src || img.currentSrc || img.getAttribute('data-src') || 
                   img.getAttribute('data-old-src');
        if (src && !src.includes('sprite') && !src.includes('icon') && 
            !src.includes('logo') && !src.includes('badge')) {
          let cleanSrc = src;
          cleanSrc = cleanSrc.replace(/_[A-Z]{2}_[A-Z]?[0-9]+_/g, '_AC_');
          if (cleanSrc.includes('_AC_')) {
            cleanSrc = cleanSrc.replace(/_AC_[A-Z]?[0-9]+(_[A-Z]+)?/g, '');
          }
          return normalizeUrl(cleanSrc);
        }
      }
    }
  }

  // find largest image on page (naturalWidth*naturalHeight)
  const imgs = Array.from(document.images || []);
  let largest = null;
  let largestArea = 0;
  for (const img of imgs) {
    try {
      const area = (img.naturalWidth || 0) * (img.naturalHeight || 0);
      if (area > largestArea && img.src && !img.src.includes('sprite') && !img.src.includes('icon')) {
        largestArea = area;
        largest = img;
      }
    } catch(e){}
  }
  if (largest) return normalizeUrl(largest.src || largest.currentSrc || '');
  return null;
}

function getProductInfo() {
  // try schema.org first
  const fromJson = parseJsonLD();
  const imageBest = collectBestImage();
  if (fromJson) {
    return {
      name: fromJson.name || textFallbacks().name,
      description: fromJson.description || textFallbacks().description,
      price: sanitizePriceString(fromJson.price || textFallbacks().price),
      image: fromJson.image || imageBest || null,
      color: fromJson.color || textFallbacks().color || ''
    };
  }
  const fb = textFallbacks();
  return {name: fb.name, description: fb.description, price: fb.price, image: imageBest || null, color: fb.color || ''};
}

// -------------------- Message listener --------------------
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.type) return;

  if (msg.type === 'EXTRACT_INFO') {
    try {
      const info = getProductInfo();
      sendResponse({info});
    } catch (e) {
      console.error('Error extracting product info:', e);
      sendResponse({info: null, error: String(e)});
    }
    return true;
  }

  if (msg.type === 'START_IMAGE_PICK') {
    // itemId provided -> start overlay; content script will notify background when image chosen
    try {
      if (!msg.itemId) {
        console.error('No itemId provided for image pick');
        sendResponse({error: 'No itemId provided'});
        return;
      }
      createImagePickerOverlay(msg.itemId);
      sendResponse({success: true});
    } catch (e) { 
      console.error('Error creating image picker overlay:', e);
      sendResponse({error: String(e)});
    }
    return true;
  }

  if (msg.type === 'CANCEL_IMAGE_PICK') {
    try {
      removeImagePickerOverlay();
      sendResponse({success: true});
    } catch (e) {
      console.error('Error removing image picker overlay:', e);
      sendResponse({error: String(e)});
    }
    return true;
  }

  return false;
});
