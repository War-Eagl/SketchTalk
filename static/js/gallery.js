/**
 * TalkSketch Gallery Module
 * Manages the display of saved sketches
 */

class SketchGallery {
  constructor(containerId, maxItems = 3) {
    this.container = document.getElementById(containerId);
    this.maxItems = maxItems;
    this.items = [];
    this.currentIndex = 0;

    this._initGallery();
  }

  /**
   * Initialize gallery placeholders
   */
  _initGallery() {
    if (!this.container) return;

    // Clear existing content
    this.container.innerHTML = '';

    // Create placeholder items
    for (let i = 0; i < this.maxItems; i++) {
      const galleryItem = document.createElement('div');
      galleryItem.className = 'gallery-item';
      galleryItem.innerHTML = '<div class="gallery-placeholder">No sketch</div>';
      this.container.appendChild(galleryItem);
    }
  }

  /**
   * Add a new sketch to the gallery
   */
  addSketch(svgData) {
    if (!this.container) return;

    // Get the target gallery item to replace
    const galleryItems = this.container.querySelectorAll('.gallery-item');
    if (galleryItems.length === 0) return;

    const targetItem = galleryItems[this.currentIndex];

    // Store the SVG data
    this.items[this.currentIndex] = svgData;

    // Clear the placeholder
    targetItem.innerHTML = '';

    // Create a wrapper div for proper scaling
    const wrapper = document.createElement('div');
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.justifyContent = 'center';
    targetItem.appendChild(wrapper);

    // Parse the SVG to properly scale it
    try {
      // Parse the SVG data
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgData, 'image/svg+xml');
      const originalSvg = svgDoc.documentElement;

      // Get container dimensions
      const containerRect = targetItem.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      // Get the viewBox dimensions or default to width and height
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

      // Create a new SVG element
      const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const placeholderRect = targetItem.getBoundingClientRect();
      
      // Set viewBox to show entire sketch
      newSvg.setAttribute('viewBox', viewBox);
      newSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      
      // Set dimensions to fit container
      newSvg.style.width = '100%';
      newSvg.style.height = '100%';
      
      // Center in wrapper
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'center';
      wrapper.style.justifyContent = 'center';
      
      // Center the SVG in the container
      wrapper.style.display = 'flex';
      wrapper.style.justifyContent = 'center';
      wrapper.style.alignItems = 'center';
      wrapper.style.width = '100%';
      wrapper.style.height = '100%';
      
      // Copy the inner content from the original SVG
      newSvg.innerHTML = originalSvg.innerHTML;

      // Add the new SVG to the wrapper
      wrapper.appendChild(newSvg);

      // Make sure all paths use non-scaling-stroke
      const paths = newSvg.querySelectorAll('path');
      paths.forEach(path => {
        path.setAttribute('vector-effect', 'non-scaling-stroke');
      });
    } catch (e) {
      // Fallback to simple SVG insertion if parsing fails
      console.error('Failed to parse SVG:', e);
      wrapper.innerHTML = svgData;
    }

    // Update the current index for the next addition
    this.currentIndex = (this.currentIndex + 1) % this.maxItems;
  }

  /**
   * Get all sketches in the gallery
   */
  getSketches() {
    return this.items.filter(item => item !== undefined);
  }

  /**
   * Clear all sketches from the gallery
   */
  clear() {
    this.items = [];
    this.currentIndex = 0;
    this._initGallery();
  }
}