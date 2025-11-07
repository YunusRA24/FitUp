# FitUp Proto - Chrome Extension

A Chrome extension for capturing product screenshots, extracting product information, and maintaining a universal shopping cart.

## Features

- 📸 **Screenshot Capture**: Automatically captures screenshots of product pages
- 🔍 **Smart Data Extraction**: Extracts product name, price, description, color, and images
- 🛒 **Universal Cart**: Save products from any website to a single cart
- 🖼️ **Image Picker**: Manually select product images from pages
- 💾 **Local Storage**: All data stored locally in your browser

## Installation

1. Clone this repository or download as ZIP
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the folder containing this extension

## How to Use

1. Navigate to any product page (Amazon, eBay, etc.)
2. Click the FitUp extension icon
3. Click "Capture screenshot & extract"
4. The extension will automatically extract product info and save it to your cart
5. View your saved items in the extension popup
6. Use "Pick image" to manually select a different product image
7. Click "Remove" to delete items from your cart

## Technical Details

- **Manifest Version**: 3
- **Storage**: Chrome Local Storage (limited to ~10MB)
- **Data Extraction**: Uses JSON-LD structured data, meta tags, and DOM parsing
- **Image Selection**: Automatically finds largest product image or allows manual selection

## Files

- `manifest.json` - Extension configuration
- `popup.html/js` - Extension popup UI
- `content_script.js` - Product data extraction logic
- `service_worker.js` - Background service worker for data management
- `styles.css` - Popup styling

## License

MIT License

