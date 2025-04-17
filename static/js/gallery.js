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
      // Get original dimensions
      const originalWidth = svg.getAttribute('width') || '100%';
      const originalHeight = svg.getAttribute('height') || '100%';
      
      // Get or create viewBox
      let viewBox = svg.getAttribute('viewBox');
      if (!viewBox) {
        const width = parseFloat(originalWidth) || 100;
        const height = parseFloat(originalHeight) || 100;
        viewBox = `0 0 ${width} ${height}`;
        svg.setAttribute('viewBox', viewBox);
      }
      
      // Clear any inline size attributes to let CSS handle sizing
      svg.removeAttribute('width');
      svg.removeAttribute('height');
      
      // Set proper attributes for scaling
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      
      // Apply CSS styles for proper display
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.style.display = 'block';
      svg.style.objectFit = 'contain';
      
      // Fix for any nested elements with explicit dimensions
      const allElements = svg.querySelectorAll('*');
      allElements.forEach(el => {
        if (el.hasAttribute('width') && el.getAttribute('width').includes('%')) {
          el.setAttribute('width', el.getAttribute('width'));
        }
        if (el.hasAttribute('height') && el.getAttribute('height').includes('%')) {
          el.setAttribute('height', el.getAttribute('height'));
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
