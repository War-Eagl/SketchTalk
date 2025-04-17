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
    
    // Store the SVG data and update the view
    this.items[this.currentIndex] = svgData;
    
    // Clear the placeholder and add the SVG
    targetItem.innerHTML = '';
    targetItem.insertAdjacentHTML('beforeend', svgData);
    
    // Scale the SVG to fit the container
    const svg = targetItem.querySelector('svg');
    if (svg) {
      // Get or create viewBox for proper scaling
      let viewBox = svg.getAttribute('viewBox');
      if (!viewBox) {
        // Default dimensions if none provided
        const width = parseFloat(svg.getAttribute('width')) || 800;
        const height = parseFloat(svg.getAttribute('height')) || 600;
        viewBox = `0 0 ${width} ${height}`;
        svg.setAttribute('viewBox', viewBox);
      }
      
      // Remove existing size attributes to avoid conflicts
      svg.removeAttribute('width');
      svg.removeAttribute('height');
      
      // Set proper attributes for scaling
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      
      // Position the SVG in the center of the container and scale it to fit
      svg.style.position = 'absolute';
      svg.style.top = '50%';
      svg.style.left = '50%';
      svg.style.transform = 'translate(-50%, -50%)';
      svg.style.maxWidth = '90%';
      svg.style.maxHeight = '90%';
      svg.style.width = 'auto';
      svg.style.height = 'auto';
      
      // Ensure the SVG takes up appropriate space
      targetItem.style.display = 'flex';
      targetItem.style.alignItems = 'center';
      targetItem.style.justifyContent = 'center';
      
      // Make sure path strokes are visible at any scale
      const paths = svg.querySelectorAll('path');
      paths.forEach(path => {
        // Ensure stroke width is visible but not too thick
        if (path.hasAttribute('stroke-width')) {
          const currentWidth = parseFloat(path.getAttribute('stroke-width'));
          if (currentWidth < 1) {
            path.setAttribute('stroke-width', '1');
          }
        }
        
        // Ensure path uses absolute position 
        if (path.hasAttribute('transform')) {
          // Keep transform for proper positioning
        } else {
          // Add vector-effect to maintain stroke width when scaling
          path.setAttribute('vector-effect', 'non-scaling-stroke');
        }
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
