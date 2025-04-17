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
    
    // Parse the SVG to manipulate it
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgData, 'image/svg+xml');
    const originalSvg = svgDoc.documentElement;
    
    // Create a containing div for proper centering and scaling
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.overflow = 'hidden';
    targetItem.appendChild(container);
    
    // Create new optimized SVG element
    const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    
    // Get or create viewBox
    let viewBox = originalSvg.getAttribute('viewBox');
    if (!viewBox) {
      const width = parseFloat(originalSvg.getAttribute('width')) || 800;
      const height = parseFloat(originalSvg.getAttribute('height')) || 600;
      viewBox = `0 0 ${width} ${height}`;
    }
    
    // Set optimized attributes for the new SVG
    newSvg.setAttribute('viewBox', viewBox);
    newSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    newSvg.style.width = '100%';
    newSvg.style.height = '100%';
    newSvg.style.maxWidth = '90%';
    newSvg.style.maxHeight = '90%';
    
    // Copy the inner content from the original SVG
    newSvg.innerHTML = originalSvg.innerHTML;
    
    // Add the new SVG to the container
    container.appendChild(newSvg);
    
    // Process paths to ensure visibility
    const paths = newSvg.querySelectorAll('path');
    paths.forEach(path => {
      // Ensure visible strokes
      if (path.hasAttribute('stroke-width')) {
        const currentWidth = parseFloat(path.getAttribute('stroke-width'));
        if (currentWidth < 1) {
          path.setAttribute('stroke-width', '1');
        }
      }
      
      // Add vector effect for non-scaling strokes
      path.setAttribute('vector-effect', 'non-scaling-stroke');
    });
    
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
