/**
 * TalkSketch Gallery Module
 * Manages the display of saved sketches
 */

class SketchGallery {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.items = [];
    this._initGallery();
  }

  /**
   * Initialize gallery placeholders
   */
  _initGallery() {
    if (!this.container) return;
    // Clear existing content
    this.container.innerHTML = '';
  }

  /**
   * Add a new sketch to the gallery
   */
  addSketch(svgData) {
    if (!this.container) return;

    // Store the SVG data
    this.items.push(svgData);

    // Create a new gallery item
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item';

    // Create a wrapper div for proper scaling
    const wrapper = document.createElement('div');
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
    galleryItem.appendChild(wrapper);

    // Parse the SVG to properly scale it
    try {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgData, 'image/svg+xml');
      const originalSvg = svgDoc.documentElement;

      // Use galleryItem's size for scaling
      const containerRect = galleryItem.getBoundingClientRect();
      const containerWidth = containerRect.width || 220;
      const containerHeight = containerRect.height || 140;

      let viewBox = originalSvg.getAttribute('viewBox');
      let viewBoxWidth, viewBoxHeight;

      if (viewBox) {
        const parts = viewBox.split(' ');
        viewBoxWidth = parseFloat(parts[2]);
        viewBoxHeight = parseFloat(parts[3]);
      } else {
        viewBoxWidth = parseFloat(originalSvg.getAttribute('width')) || containerWidth;
        viewBoxHeight = parseFloat(originalSvg.getAttribute('height')) || containerHeight;
        viewBox = `0 0 ${viewBoxWidth} ${viewBoxHeight}`;
      }

      const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      newSvg.setAttribute('viewBox', viewBox);
      newSvg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
      newSvg.style.width = '100%';
      newSvg.style.height = '100%';
      wrapper.style.position = 'relative';
      wrapper.style.overflow = 'hidden';
      newSvg.innerHTML = originalSvg.innerHTML;
      wrapper.appendChild(newSvg);
      const paths = newSvg.querySelectorAll('path');
      paths.forEach(path => {
        path.setAttribute('vector-effect', 'non-scaling-stroke');
      });
    } catch (e) {
      console.error('Failed to parse SVG:', e);
      wrapper.innerHTML = svgData;
    }

    // Attach import confirmation handler
    galleryItem.addEventListener('click', () => {
      const confirmMessage = 'Clear current canvas and import this sketch?';
      if (window.confirm(confirmMessage)) {
        if (window.drawingTool && typeof window.drawingTool.loadSketch === 'function') {
          window.drawingTool.loadSketch(svgData);
          if (window.showStatusMessage) window.showStatusMessage('Sketch imported');
        }
      }
    });

    this.container.appendChild(galleryItem);
  }

  /**
   * Get all sketches in the gallery
   */
  getSketches() {
    return this.items;
  }

  /**
   * Clear all sketches from the gallery
   */
  clear() {
    this.items = [];
    if (this.container) this.container.innerHTML = '';
  }
}