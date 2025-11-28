/**
 * HTML Magnifier - A reusable magnifier component that works with static and dynamic content
 * 
 * Credits:
 * - Uses html2canvas library (https://github.com/niklasvh/html2canvas)
 * - Developed with assistance from Cursor AI
 * 
 * Usage:
 *   const magnifier = new Magnifier({
 *     size: 200,
 *     zoom: 2,
 *     position: { x: 20, y: 20 }
 *   });
 * 
 *   // To destroy:
 *   magnifier.destroy();
 */
class Magnifier {
  constructor(options = {}) {
    // Configuration
    this.size = options.size || 200;
    this.zoom = options.zoom || 2;
    this.position = options.position || { x: 20, y: 20 };
    this.updateFrequency = options.updateFrequency || {
      MAIN_SNAPSHOT: 16,      // Main page snapshot interval (16ms ≈ 60fps)
      SVG_SNAPSHOT: 16,        // SVG snapshot interval (16ms ≈ 60fps)
      RESIZE_DEBOUNCE: 150     // Debounce delay for resize/scroll events
    };
    
    // State
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.snapshotCanvas = null;
    this.isSnapshotting = false;
    this.snapshotTimer = null;
    this.snapshotInterval = null;
    this.svgSnapshotCanvas = null;
    this.isSvgSnapshotting = false;
    this.svgSnapshotInterval = null;
    this.rafId = null;
    
    // DOM elements
    this.magnifierElement = null;
    this.canvas = null;
    this.ctx = null;
    
    // Bind methods
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleResizeOrScroll = this.handleResizeOrScroll.bind(this);
    
    // Initialize (async - loads html2canvas internally)
    this.init().catch(err => {
      console.error('Magnifier initialization failed:', err);
    });
  }
  
  async loadHtml2Canvas() {
    // Check if html2canvas is already loaded
    if (typeof html2canvas !== 'undefined') {
      return Promise.resolve(html2canvas);
    }
    
    // Dynamically load html2canvas
    return new Promise((resolve, reject) => {
      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="html2canvas"]');
      if (existingScript) {
        // Wait for it to load
        existingScript.addEventListener('load', () => {
          if (typeof html2canvas !== 'undefined') {
            resolve(html2canvas);
          } else {
            reject(new Error('html2canvas failed to load'));
          }
        });
        existingScript.addEventListener('error', reject);
        return;
      }
      
      // Create and load script
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.async = true;
      script.onload = () => {
        if (typeof html2canvas !== 'undefined') {
          resolve(html2canvas);
        } else {
          reject(new Error('html2canvas failed to load'));
        }
      };
      script.onerror = () => {
        reject(new Error('Failed to load html2canvas script'));
      };
      document.head.appendChild(script);
    });
  }
  
  async init() {
    // Create magnifier element
    this.createMagnifierElement();
    
    // Load html2canvas if not already available
    try {
      await this.loadHtml2Canvas();
    } catch (err) {
      console.error('Failed to load html2canvas:', err);
      console.warn('Magnifier may not work correctly without html2canvas.');
    }
    
    // Start continuous update loop
    this.startContinuousUpdate();
    
    // Add event listeners
    this.attachEventListeners();
    
    // Take initial snapshot (but don't start periodic snapshots until dragging starts)
    if (document.readyState === 'complete') {
      this.takeSnapshot();
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => {
          this.takeSnapshot();
        }, 100);
      });
    }
    // Note: Periodic snapshots will start when user starts dragging
  }
  
  createMagnifierElement() {
    // Create container
    this.magnifierElement = document.createElement('div');
    this.magnifierElement.id = 'magnifier';
    this.magnifierElement.style.cssText = `
      position: fixed;
      top: ${this.position.y}px;
      left: ${this.position.x}px;
      width: ${this.size}px;
      height: ${this.size}px;
      border-radius: 50%;
      border: 3px solid rgba(0, 0, 0, 0.7);
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.3);
      overflow: hidden;
      background: #fff;
      pointer-events: none;
      z-index: 9999;
      transform: translateZ(0);
      display: none;
    `;
    
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.canvas.style.cssText = `
      width: 100%;
      height: 100%;
      display: block;
    `;
    
    this.ctx = this.canvas.getContext('2d');
    this.magnifierElement.appendChild(this.canvas);
    document.body.appendChild(this.magnifierElement);
  }
  
  convertOklchColors(clonedDoc) {
    try {
      const styleSheets = Array.from(clonedDoc.styleSheets);
      styleSheets.forEach((sheet) => {
        try {
          const rules = Array.from(sheet.cssRules || []);
          rules.forEach((rule) => {
            if (rule instanceof CSSStyleRule) {
              const style = rule.style;
              for (let i = 0; i < style.length; i++) {
                const prop = style[i];
                const value = style.getPropertyValue(prop);
                if (value && value.includes('oklch')) {
                  style.removeProperty(prop);
                }
              }
            }
          });
        } catch (e) {
          // Cross-origin stylesheets
        }
      });
      
      const styleTags = clonedDoc.querySelectorAll('style');
      styleTags.forEach((styleTag) => {
        if (styleTag.textContent && styleTag.textContent.includes('oklch')) {
          styleTag.textContent = styleTag.textContent.replace(
            /oklch\([^)]+\)/gi,
            'rgb(128, 128, 128)'
          );
        }
      });
    } catch (err) {
      console.warn('Error converting oklch colors:', err);
    }
  }
  
  takeSnapshot() {
    if (this.isSnapshotting || typeof html2canvas === 'undefined') {
      return;
    }
    
    this.isSnapshotting = true;
    html2canvas(document.documentElement, {
      scale: 1,
      useCORS: true,
      allowTaint: false,
      logging: false,
      onclone: (clonedDoc) => {
        this.convertOklchColors(clonedDoc);
      }
    }).then(canvas => {
      this.snapshotCanvas = canvas;
      this.isSnapshotting = false;
      if (this.rafId === null) {
        this.rafId = requestAnimationFrame(() => this.drawMagnifier());
      }
    }).catch(err => {
      console.warn('html2canvas snapshot failed:', err);
      this.isSnapshotting = false;
    });
  }
  
  startPeriodicSnapshot() {
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
    }
    this.snapshotInterval = setInterval(() => {
      if (!this.isSnapshotting) {
        this.takeSnapshot();
      }
    }, this.updateFrequency.MAIN_SNAPSHOT);
  }
  
  startSvgSnapshot() {
    const dynamicSvg = document.getElementById('dynamicSvg');
    if (!dynamicSvg || typeof html2canvas === 'undefined') return;
    
    if (this.svgSnapshotInterval) {
      clearInterval(this.svgSnapshotInterval);
    }
    this.svgSnapshotInterval = setInterval(() => {
      if (!this.isSvgSnapshotting) {
        this.isSvgSnapshotting = true;
        html2canvas(dynamicSvg, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
          backgroundColor: null,
          onclone: (clonedDoc) => {
            this.convertOklchColors(clonedDoc);
          }
        }).then(canvas => {
          this.svgSnapshotCanvas = canvas;
          this.isSvgSnapshotting = false;
          const rect = dynamicSvg.getBoundingClientRect();
          const isOverSvg = (
            this.lastMouseX >= rect.left && this.lastMouseX <= rect.right &&
            this.lastMouseY >= rect.top && this.lastMouseY <= rect.bottom
          );
          if (isOverSvg && this.rafId === null) {
            this.rafId = requestAnimationFrame(() => this.drawMagnifier());
          }
        }).catch(err => {
          console.warn('SVG snapshot failed:', err);
          this.isSvgSnapshotting = false;
        });
      }
    }, this.updateFrequency.SVG_SNAPSHOT);
  }
  
  stopPeriodicSnapshot() {
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
      this.snapshotInterval = null;
    }
    if (this.svgSnapshotInterval) {
      clearInterval(this.svgSnapshotInterval);
      this.svgSnapshotInterval = null;
    }
  }
  
  drawMagnifier() {
    if (!this.canvas || !this.ctx) return;
    
    const sourceSize = this.size / this.zoom;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.size, this.size);
    
    // Draw white background
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(0, 0, this.size, this.size);
    
    // Check if cursor is over dynamic canvas or SVG
    const dynamicCanvas = document.getElementById('dynamicCanvas');
    const dynamicSvg = document.getElementById('dynamicSvg');
    
    let isOverDynamicCanvas = false;
    let isOverDynamicSvg = false;
    
    if (dynamicCanvas) {
      const rect = dynamicCanvas.getBoundingClientRect();
      isOverDynamicCanvas = (
        this.lastMouseX >= rect.left && this.lastMouseX <= rect.right &&
        this.lastMouseY >= rect.top && this.lastMouseY <= rect.bottom
      );
    }
    
    if (dynamicSvg) {
      const rect = dynamicSvg.getBoundingClientRect();
      isOverDynamicSvg = (
        this.lastMouseX >= rect.left && this.lastMouseX <= rect.right &&
        this.lastMouseY >= rect.top && this.lastMouseY <= rect.bottom
      );
    }
    
    // If over dynamic canvas, capture it directly (real-time)
    if (isOverDynamicCanvas && dynamicCanvas instanceof HTMLCanvasElement) {
      const rect = dynamicCanvas.getBoundingClientRect();
      const elemX = this.lastMouseX - rect.left;
      const elemY = this.lastMouseY - rect.top;
      const elemSourceX = Math.max(0, Math.min(elemX - sourceSize / 2, rect.width - sourceSize));
      const elemSourceY = Math.max(0, Math.min(elemY - sourceSize / 2, rect.height - sourceSize));
      
      this.ctx.save();
      this.ctx.imageSmoothingEnabled = false;
      try {
        this.ctx.drawImage(
          dynamicCanvas,
          elemSourceX, elemSourceY, sourceSize, sourceSize,
          0, 0, this.size, this.size
        );
      } catch (err) {
        console.warn('Canvas draw error:', err);
      }
      this.ctx.restore();
      this.rafId = null;
      return;
    }
    
    // If over dynamic SVG, use cached SVG snapshot
    if (isOverDynamicSvg && this.svgSnapshotCanvas) {
      const rect = dynamicSvg.getBoundingClientRect();
      const elemX = this.lastMouseX - rect.left;
      const elemY = this.lastMouseY - rect.top;
      
      const svgScale = this.svgSnapshotCanvas.width / rect.width;
      const elemSourceX = Math.max(0, Math.min((elemX - sourceSize / 2) * svgScale, this.svgSnapshotCanvas.width - sourceSize * svgScale));
      const elemSourceY = Math.max(0, Math.min((elemY - sourceSize / 2) * svgScale, this.svgSnapshotCanvas.height - sourceSize * svgScale));
      
      this.ctx.save();
      this.ctx.imageSmoothingEnabled = false;
      try {
        this.ctx.drawImage(
          this.svgSnapshotCanvas,
          elemSourceX, elemSourceY, sourceSize * svgScale, sourceSize * svgScale,
          0, 0, this.size, this.size
        );
      } catch (err) {
        console.warn('SVG draw error:', err);
      }
      this.ctx.restore();
      this.rafId = null;
      return;
    }
    
    // For other areas, use snapshot
    if (!this.snapshotCanvas) {
      this.ctx.fillStyle = '#e8e8e8';
      this.ctx.fillRect(0, 0, this.size, this.size);
      this.ctx.fillStyle = '#666';
      this.ctx.font = '11px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Loading...', this.size / 2, this.size / 2);
      this.rafId = null;
      return;
    }
    
    // Map viewport coordinates to snapshot coordinates
    const snapScaleX = this.snapshotCanvas.width / document.documentElement.scrollWidth || 1;
    const snapScaleY = this.snapshotCanvas.height / document.documentElement.scrollHeight || 1;
    const snapScale = (snapScaleX + snapScaleY) / 2;
    
    const worldX = window.scrollX + this.lastMouseX;
    const worldY = window.scrollY + this.lastMouseY;
    
    const sx = Math.max(
      0,
      Math.min(
        Math.round(worldX * snapScale - sourceSize / 2),
        Math.max(0, this.snapshotCanvas.width - sourceSize)
      )
    );
    const sy = Math.max(
      0,
      Math.min(
        Math.round(worldY * snapScale - sourceSize / 2),
        Math.max(0, this.snapshotCanvas.height - sourceSize)
      )
    );
    
    // Draw the magnified portion
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;
    try {
      this.ctx.drawImage(
        this.snapshotCanvas,
        sx, sy, sourceSize, sourceSize,
        0, 0, this.size, this.size
      );
    } catch (err) {
      console.warn('Draw error:', err);
      this.ctx.fillStyle = '#f7f7f7';
      this.ctx.fillRect(0, 0, this.size, this.size);
      this.ctx.fillStyle = '#a00';
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Draw failed', this.size / 2, this.size / 2);
    }
    this.ctx.restore();
    
    this.rafId = null;
  }
  
  startContinuousUpdate() {
    const updateLoop = () => {
      this.drawMagnifier();
      requestAnimationFrame(updateLoop);
    };
    updateLoop();
  }
  
  updateMagnifierVisibility() {
    if (this.magnifierElement) {
      if (this.isDragging) {
        this.magnifierElement.style.display = 'block';
      } else {
        this.magnifierElement.style.display = 'none';
      }
    }
  }
  
  updatePosition(x, y) {
    if (!this.isDragging) return;
    this.lastMouseX = x;
    this.lastMouseY = y;
  }
  
  handleMouseDown(e) {
    this.isDragging = true;
    this.updateMagnifierVisibility();
    this.updatePosition(e.clientX, e.clientY);
    // Resume snapshots when dragging starts
    this.startPeriodicSnapshot();
    this.startSvgSnapshot();
  }
  
  handleMouseMove(e) {
    if (this.isDragging) {
      this.updatePosition(e.clientX, e.clientY);
    }
  }
  
  handleMouseUp(e) {
    this.isDragging = false;
    this.updateMagnifierVisibility();
    // Stop snapshots when dragging stops
    this.stopPeriodicSnapshot();
  }
  
  handleTouchStart(e) {
    // Don't prevent default - allow normal touch interactions
    // Only activate magnifier if user is dragging (not just tapping)
    this.isDragging = false; // Will be set to true on move
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      this.lastMouseX = touch.clientX;
      this.lastMouseY = touch.clientY;
    }
  }
  
  handleTouchMove(e) {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - this.lastMouseX);
      const deltaY = Math.abs(touch.clientY - this.lastMouseY);
      
      // Only activate magnifier if there's significant movement (dragging, not scrolling)
      if (deltaX > 5 || deltaY > 5) {
        if (!this.isDragging) {
          this.isDragging = true;
          this.updateMagnifierVisibility();
          // Only prevent default once we're actually dragging for magnifier
          e.preventDefault();
          // Resume snapshots when dragging starts
          this.startPeriodicSnapshot();
          this.startSvgSnapshot();
        }
        this.updatePosition(touch.clientX, touch.clientY);
      }
    }
  }
  
  handleTouchEnd(e) {
    this.isDragging = false;
    this.updateMagnifierVisibility();
    // Stop snapshots when dragging stops
    this.stopPeriodicSnapshot();
  }
  
  handleResizeOrScroll() {
    if (this.snapshotTimer) {
      clearTimeout(this.snapshotTimer);
    }
    this.snapshotTimer = setTimeout(() => {
      this.takeSnapshot();
    }, this.updateFrequency.RESIZE_DEBOUNCE);
  }
  
  attachEventListeners() {
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);
    // Use passive: true for touchstart/touchend to allow normal interactions
    // Only touchmove needs to be non-passive so we can preventDefault when dragging
    window.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    window.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    window.addEventListener('touchend', this.handleTouchEnd, { passive: true });
    window.addEventListener('resize', this.handleResizeOrScroll);
    window.addEventListener('scroll', this.handleResizeOrScroll);
  }
  
  removeEventListeners() {
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('touchstart', this.handleTouchStart);
    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handleTouchEnd);
    window.removeEventListener('resize', this.handleResizeOrScroll);
    window.removeEventListener('scroll', this.handleResizeOrScroll);
  }
  
  destroy() {
    // Stop intervals
    this.stopPeriodicSnapshot();
    
    // Remove event listeners
    this.removeEventListeners();
    
    // Remove DOM element
    if (this.magnifierElement && this.magnifierElement.parentNode) {
      this.magnifierElement.parentNode.removeChild(this.magnifierElement);
    }
    
    // Clear references
    this.magnifierElement = null;
    this.canvas = null;
    this.ctx = null;
    this.snapshotCanvas = null;
    this.svgSnapshotCanvas = null;
  }
}

// Export for use in modules or make available globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Magnifier;
} else {
  window.Magnifier = Magnifier;
}

