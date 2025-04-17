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
    
    // Create a simple approach - just inject the svg and scale with CSS
    targetItem.insertAdjacentHTML('beforeend', svgData);
    
    // Directly apply inline styles to the SVG to ensure proper scaling
    const svg = targetItem.querySelector('svg');
    if (svg) {
      // Ensure viewBox is set
      if (!svg.hasAttribute('viewBox')) {
        const width = parseFloat(svg.getAttribute('width')) || 800;
        const height = parseFloat(svg.getAttribute('height')) || 600;
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      }
      
      // Set critical scaling attributes directly
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      
      // Force proper scaling with CSS
      svg.style.position = 'absolute';
      svg.style.top = '0';
      svg.style.left = '0';
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.style.maxWidth = '100%';
      svg.style.maxHeight = '100%';
      
      // Make sure all paths are visible
      const paths = svg.querySelectorAll('path');
      paths.forEach(path => {
        path.setAttribute('vector-effect', 'non-scaling-stroke');
      });
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
