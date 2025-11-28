# HTML Magnifier

A lightweight, self-contained JavaScript library that adds a magnifier tool to any web page. The magnifier shows a 2x zoomed view of content under your cursor/finger, and works seamlessly with static content, dynamic canvas elements, and SVG animations.

## Features

- 🔍 **2x Magnification** - Zoom in on any part of your page
- 🖱️ **Mouse & Touch Support** - Works on desktop and mobile devices
- 🎨 **Dynamic Content Support** - Handles animated canvas and SVG elements
- ⚡ **Performance Optimized** - Only captures screenshots while actively dragging
- 🎯 **Non-Intrusive** - Doesn't interfere with normal page interactions
- 📦 **Zero Dependencies** - Automatically loads html2canvas when needed
- 🎛️ **Fully Configurable** - Customize size, zoom, position, and update frequency

## Installation

### Option 1: npm

```bash
npm install html-magnifier
```

Then include it in your HTML:

```html
<script src="node_modules/html-magnifier/magnifier.js"></script>
```

Or use a bundler (webpack, vite, etc.):

```javascript
import Magnifier from 'html-magnifier';
```

### Option 2: CDN (via jsDelivr)

```html
<script src="https://cdn.jsdelivr.net/npm/html-magnifier@1.0.0/magnifier.js"></script>
```

### Option 3: Direct Download

Download `magnifier.js` from the [releases page](https://github.com/bewithdhanu/html-magnifier/releases) and include it:

```html
<script src="magnifier.js"></script>
```

## Quick Start

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Page with Magnifier</title>
</head>
<body>
  <h1>Your Content Here</h1>
  
  <script src="magnifier.js"></script>
  <script>
    // Initialize the magnifier
    const magnifier = new Magnifier({
      size: 200,
      zoom: 2,
      position: { x: 20, y: 20 }
    });
  </script>
</body>
</html>
```

## Usage

### Basic Usage

```javascript
const magnifier = new Magnifier();
```

### Advanced Configuration

```javascript
const magnifier = new Magnifier({
  size: 200,              // Magnifier size in pixels (default: 200)
  zoom: 2,                // Zoom level (default: 2)
  position: { x: 20, y: 20 },  // Position on screen (default: { x: 20, y: 20 })
  updateFrequency: {
    MAIN_SNAPSHOT: 16,    // Main snapshot interval in ms (default: 16 ≈ 60fps)
    SVG_SNAPSHOT: 16,     // SVG snapshot interval in ms (default: 16 ≈ 60fps)
    RESIZE_DEBOUNCE: 150  // Resize debounce delay in ms (default: 150)
  }
});
```

### Cleanup

```javascript
// Destroy the magnifier when done
magnifier.destroy();
```

## How It Works

1. **Drag to Activate**: Click and drag (or touch and drag on mobile) to activate the magnifier
2. **Automatic Capture**: The magnifier automatically captures screenshots of your page content
3. **Smart Rendering**: 
   - Static content uses full-page snapshots
   - Dynamic canvas elements are captured in real-time
   - SVG animations use frequent snapshots for smooth updates
4. **Resource Efficient**: Screenshots only occur while actively dragging

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `size` | number | 200 | Size of the magnifier in pixels |
| `zoom` | number | 2 | Zoom level (2 = 2x magnification) |
| `position` | object | `{ x: 20, y: 20 }` | Position of magnifier on screen |
| `updateFrequency.MAIN_SNAPSHOT` | number | 16 | Interval for main page snapshots (ms) |
| `updateFrequency.SVG_SNAPSHOT` | number | 16 | Interval for SVG snapshots (ms) |
| `updateFrequency.RESIZE_DEBOUNCE` | number | 150 | Debounce delay for resize events (ms) |

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Dependencies

- **html2canvas** - Automatically loaded from CDN when needed
  - License: MIT
  - Repository: https://github.com/niklasvh/html2canvas

## Credits

- **html2canvas** - Used for capturing page content as canvas
  - Created by Niklas von Hertzen
  - https://github.com/niklasvh/html2canvas
  
- **Cursor AI** - Assisted in development
  - https://cursor.sh

## License

MIT License - feel free to use in your projects!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Examples

### Static Content
Works with any HTML content - divs, tables, images, text, etc.

### Dynamic Canvas
```javascript
// Works with animated canvas elements
const canvas = document.getElementById('myCanvas');
// ... your canvas animation code ...
// Magnifier will automatically capture it in real-time
```

### Dynamic SVG
```javascript
// Works with animated SVG elements
const svg = document.getElementById('mySvg');
// ... your SVG animation code ...
// Magnifier will capture it with frequent snapshots
```

## Troubleshooting

### Magnifier not showing
- Make sure you're dragging (not just moving the mouse)
- Check browser console for errors
- Ensure html2canvas loaded successfully

### Performance issues
- Increase `updateFrequency` values to reduce snapshot frequency
- Only use magnifier when needed (it stops capturing when not dragging)

### Content not updating
- For dynamic content, ensure elements have IDs (`dynamicCanvas`, `dynamicSvg`)
- Check that animations are running

## Changelog

### 1.0.0
- Initial release
- Basic magnifier functionality
- Support for static and dynamic content
- Mouse and touch support
- Automatic html2canvas loading

