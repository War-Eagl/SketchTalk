/**
 * TalkSketch Drawing Module
 * Handles canvas drawing functionality with Bezier curve conversion
 * 
 * Features:
 * - Drawing with mouse, touch, or stylus
 * - Palm rejection for multi-touch
 * - Undo/redo functionality
 * - Eraser mode
 * - SVG export
 */

class DrawingTool {
  /**
   * Create a new DrawingTool instance
   * @param {string} canvasContainerId - ID of the container element
   */
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);
    
    // Create SVG drawing surface using SVG.js
    this.draw = SVG().addTo(`#${canvasContainerId}`).size('100%', '100%');
    this.draw.attr('id', 'drawing-svg');
    
    // Drawing state
    this.isDrawing = false;
    this.currentStroke = null;
    this.previewStroke = null;
    this.currentPath = [];
    this.strokes = [];
    
    // History management
    this.undoStack = [];
    this.redoStack = [];
    
    // Input handling
    this.eraseMode = false;
    this.primaryTouchId = null;
    this.multiTouchDetected = false;
    
    // Configuration
    this.config = {
      stroke: {
        width: 3,
        color: '#000000',
        previewColor: '#333333',
        previewOpacity: 0.8
      },
      eraser: {
        width: 10,
        previewColor: '#ff9999',
        previewOpacity: 0.8
      }
    };
    
    // Bind event listeners
    this._bindEventListeners();
  }
  
  /**
   * Setup event listeners for drawing
   * @private
   */
  _bindEventListeners() {
    const drawArea = this.draw.node;
    
    // Pre-bind event handlers to maintain 'this' context
    this._boundHandleDrawStart = this._handleDrawStart.bind(this);
    this._boundHandleDrawMove = this._handleDrawMove.bind(this);
    this._boundHandleDrawEnd = this._handleDrawEnd.bind(this);
    this._boundHandleTouchStart = this._handleTouchStart.bind(this);
    this._boundHandleTouchMove = this._handleTouchMove.bind(this);
    this._boundHandleTouchEnd = this._handleTouchEnd.bind(this);
    this._boundHandleTouchCancel = this._handleTouchCancel.bind(this);
    this._boundHandlePointerStart = this._handlePointerStart.bind(this);
    this._boundHandlePointerMove = this._handlePointerMove.bind(this);
    this._boundHandlePointerEnd = this._handlePointerEnd.bind(this);
    
    // Mouse events
    drawArea.addEventListener('mousedown', this._boundHandleDrawStart);
    drawArea.addEventListener('mousemove', this._boundHandleDrawMove);
    drawArea.addEventListener('mouseup', this._boundHandleDrawEnd);
    drawArea.addEventListener('mouseleave', this._boundHandleDrawEnd);
    
    // Touch events with palm rejection
    drawArea.addEventListener('touchstart', this._boundHandleTouchStart, { passive: false });
    drawArea.addEventListener('touchmove', this._boundHandleTouchMove, { passive: false });
    drawArea.addEventListener('touchend', this._boundHandleTouchEnd);
    drawArea.addEventListener('touchcancel', this._boundHandleTouchCancel);
    
    // Pointer events for stylus support
    if (window.PointerEvent) {
      drawArea.addEventListener('pointerdown', this._boundHandlePointerStart);
      drawArea.addEventListener('pointermove', this._boundHandlePointerMove);
      drawArea.addEventListener('pointerup', this._boundHandlePointerEnd);
      drawArea.addEventListener('pointerleave', this._boundHandlePointerEnd);
    }
  }
  
  /**
   * Handle mouse drawing start
   */
  _handleDrawStart(e) {
    if (e.button !== 0) return; // Only respond to left mouse button
    e.preventDefault();
    
    const point = this._getPointFromEvent(e);
    this._startStroke(point);
  }
  
  /**
   * Handle mouse drawing move
   */
  _handleDrawMove(e) {
    if (!this.isDrawing) return;
    e.preventDefault();
    
    const point = this._getPointFromEvent(e);
    this._addPointToStroke(point);
  }
  
  /**
   * Handle mouse drawing end
   */
  _handleDrawEnd(e) {
    if (!this.isDrawing) return;
    e.preventDefault();
    
    this._endStroke();
  }
  
  /**
   * Handle touch drawing start
   */
  _handleTouchStart(e) {
    e.preventDefault();
    
    // If multiple touches are detected, prevent drawing
    if (e.touches.length > 1) {
      // End any existing stroke if present
      if (this.isDrawing) {
        this._endStroke();
      }
      return;
    }
    
    // Get the single touch point
    const touch = e.touches[0];
    this.primaryTouchId = touch.identifier;
    
    // Start drawing with the single touch point
    const point = this._getPointFromTouch(touch);
    
    // If we're in eraser mode, create an invisible stroke for tracking
    if (this.eraseMode) {
      this.currentStroke = this.draw.path().stroke({
        color: 'transparent',
        width: 10
      }).fill('none');
    } else {
      this.currentStroke = this.draw.path().stroke({
        color: this.config.stroke.color,
        width: this.config.stroke.width,
        linecap: 'round',
        linejoin: 'round'
      }).fill('none');
    }
    
    this.isDrawing = true;
    this.currentPath = [point];
    this.currentStroke.plot(`M${point.x},${point.y}`);
  }
  
  /**
   * Handle touch drawing move
   */
  _handleTouchMove(e) {
    e.preventDefault();
    
    // Handle multi-touch interruption (palm rejection)
    if (e.touches.length > 1) {
      this.multiTouchDetected = true;
      
      if (this.isDrawing) {
        // Immediately clean up any visual elements
        this._cleanupStrokeState();
      }
      return;
    }
    
    // Skip if not drawing or no primary touch
    if (!this.isDrawing || !this.primaryTouchId) return;
    
    // Ensure we're tracking the primary touch point
    const touch = e.touches[0];
    if (touch.identifier !== this.primaryTouchId) return;
    
    // Get point and add to stroke
    const point = this._getPointFromTouch(touch);
    this._addPointToStroke(point);
    
    // Update the eraser path
    if (this.eraseMode) {
      this._eraseStrokes();
    }
  }
  
  /**
   * Handle touch drawing end
   */
  _handleTouchEnd(e) {
    e.preventDefault();
    
    // If we're drawing, end the stroke
    if (this.isDrawing) {
      this._endStroke();
    }
    
    // Reset touch state
    this.primaryTouchId = null;
  }
  
  /**
   * Handle pointer drawing start (for stylus/Apple Pencil)
   */
  _handlePointerStart(e) {
    e.preventDefault();
    const point = this._getPointFromEvent(e);
    this._startStroke(point);
  }
  
  /**
   * Handle pointer drawing move
   */
  _handlePointerMove(e) {
    if (!this.isDrawing) return;
    e.preventDefault();
    
    const point = this._getPointFromEvent(e);
    this._addPointToStroke(point);
  }
  
  /**
   * Handle pointer drawing end
   */
  _handlePointerEnd(e) {
    if (!this.isDrawing) return;
    e.preventDefault();
    
    this._endStroke();
  }
  
  /**
   * Get drawing point coordinates from mouse event
   */
  _getPointFromEvent(e) {
    const rect = this.draw.node.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }
  
  /**
   * Get drawing point coordinates from touch event
   */
  _getPointFromTouch(touch) {
    const rect = this.draw.node.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  }
  
  /**
   * Start a new stroke
   */
  /**
   * Start a new stroke with the given point
   * @param {Object} point - The starting point {x, y}
   * @private
   */
  _startStroke(point) {
    if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
      console.warn('Invalid point provided to _startStroke', point);
      return;
    }
    
    this.isDrawing = true;
    this.currentPath = [point];

    // Remove any lingering preview
    if (this.previewStroke) {
      this.previewStroke.remove();
    }

    // Create preview stroke with appropriate styling based on mode
    const config = this.eraseMode ? this.config.eraser : this.config.stroke;
    this.previewStroke = this.draw.path().stroke({
      color: this.eraseMode ? this.config.eraser.previewColor : this.config.stroke.previewColor,
      width: this.eraseMode ? this.config.eraser.width * 1.2 : this.config.stroke.width * 1.3,
      linecap: 'round',
      linejoin: 'round',
      opacity: this.eraseMode ? this.config.eraser.previewOpacity : this.config.stroke.previewOpacity
    }).fill('none').front();

    // Set initial path and bring to front
    this.previewStroke.plot(`M${point.x},${point.y}`).front();
    this.currentStroke = null; // Final stroke will be created when drawing ends
  }

  /**
   * Add a point to the current stroke
   */
  /**
   * Add a point to the current stroke and update the preview
   * @param {Object} point - The point to add {x, y}
   * @private
   */
  _addPointToStroke(point) {
    if (!this.isDrawing || !this.previewStroke) return;
    if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
      console.warn('Invalid point provided to _addPointToStroke', point);
      return;
    }
    
    // Add point to the current path
    if (!this.currentPath) this.currentPath = [];
    this.currentPath.push(point);

    // Build the full path string for all points
    let pathStr = `M${this.currentPath[0].x},${this.currentPath[0].y}`;
    for (let i = 1; i < this.currentPath.length; i++) {
      pathStr += ` L${this.currentPath[i].x},${this.currentPath[i].y}`;
    }
    
    // Update the preview stroke and bring to front
    this.previewStroke.plot(pathStr).front();
    
    // If in eraser mode, perform erasing
    if (this.eraseMode) {
      this._eraseStrokes();
    }
  }

  /**
   * End the current stroke
   */
  /**
   * End the current stroke and create the final visible stroke
   * @private
   */
  _endStroke() {
    if (!this.isDrawing) return;

    // Remove preview stroke
    if (this.previewStroke) {
      this.previewStroke.remove();
      this.previewStroke = null;
    }

    // Only add strokes with at least 2 points
    if (this.currentPath && this.currentPath.length > 1) {
      // Build the path string
      let pathStr = `M${this.currentPath[0].x},${this.currentPath[0].y}`;
      for (let i = 1; i < this.currentPath.length; i++) {
        pathStr += ` L${this.currentPath[i].x},${this.currentPath[i].y}`;
      }

      // Create the final stroke with appropriate styling
      this.currentStroke = this.draw.path().stroke({
        color: this.eraseMode ? 'transparent' : this.config.stroke.color,
        width: this.eraseMode ? this.config.eraser.width : this.config.stroke.width,
        linecap: 'round',
        linejoin: 'round'
      }).fill('none');
      
      // Plot the path and bring to front
      this.currentStroke.plot(pathStr).front();
      
      // Add to strokes array and undo stack
      this.strokes.push(this.currentStroke);
      this.undoStack.push({
        type: 'draw',
        stroke: this.currentStroke.clone()
      });
      
      // Clear redo stack when new action is performed
      this.redoStack = [];
    } else if (this.currentStroke) {
      // Remove single-point strokes
      this.currentStroke.remove();
      this.currentStroke = null;
    }

    // Reset drawing state
    this.isDrawing = false;
    this.currentPath = [];
    this.primaryTouchId = null;
    this.multiTouchDetected = false;
  }
  
  /**
   * Handle touch cancel event
   */
  _handleTouchCancel(e) {
    e.preventDefault();
    
    // If we're drawing, properly end the stroke
    if (this.isDrawing && this.previewStroke) {
      this._endStroke();
    }
  }
  
  /**
   * Clean up stroke state completely
   */
  /**
   * Clean up all stroke state and visual elements
   * @private
   */
  _cleanupStrokeState() {
    // Remove preview stroke if it exists
    if (this.previewStroke) {
      this.previewStroke.remove();
      this.previewStroke = null;
    }
    
    // Only remove current stroke if it's not part of the final strokes array
    if (this.currentStroke) {
      if (!this.strokes.includes(this.currentStroke)) {
        this.currentStroke.remove();
      }
      this.currentStroke = null;
    }
    
    // Reset all state variables
    this.currentPath = [];
    this.isDrawing = false;
    this.primaryTouchId = null;
    this.multiTouchDetected = false;
  }
  
  /**
   * Convert points array to SVG path data string
   */
  _getPathDataFromPoints(points) {
    if (points.length < 2) return `M${points[0].x},${points[0].y}`;
    
    let pathData = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathData += ` L${points[i].x},${points[i].y}`;
    }
    return pathData;
  }
  
  /**
   * Convert array of points to a smooth bezier curve
   */
  _convertToBezier(points) {
    if (points.length < 3) {
      return this._getPathDataFromPoints(points);
    }
    
    let bezierPath = `M${points[0].x},${points[0].y}`;
    
    // Calculate control points for each segment
    for (let i = 0; i < points.length - 2; i++) {
      const p0 = i > 0 ? points[i - 1] : points[0];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2];
      
      // Calculate control points
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      
      bezierPath += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    
    // Handle last segment
    if (points.length >= 3) {
      const n = points.length;
      const lastPoint = points[n - 1];
      const secondLastPoint = points[n - 2];
      const thirdLastPoint = points[n - 3];
      
      // Calculate last control point
      const cp1x = secondLastPoint.x + (lastPoint.x - thirdLastPoint.x) / 6;
      const cp1y = secondLastPoint.y + (lastPoint.y - thirdLastPoint.y) / 6;
      
      bezierPath += ` Q${cp1x},${cp1y} ${lastPoint.x},${lastPoint.y}`;
    }
    
    return bezierPath;
  }
  
  /**
   * Find and erase strokes that intersect with the eraser path
   */
  /**
   * Find and erase strokes that intersect with the eraser path
   * @private
   */
  _eraseStrokes() {
    if (!this.isDrawing || !this.currentPath || this.strokes.length === 0) return;
    
    // Create a bounding box around the current eraser point
    const lastPoint = this.currentPath[this.currentPath.length - 1];
    if (!lastPoint) return;
    // Use full eraser width for radius to increase hit area
    const eraserRadius = this.config.eraser.width;
    const eraserBox = {
      x: lastPoint.x - eraserRadius,
      y: lastPoint.y - eraserRadius,
      width: eraserRadius * 2,
      height: eraserRadius * 2
    };
    
    let erasedAny = false;
    
    // Find strokes that intersect with the eraser (in reverse to safely splice)
    for (let i = this.strokes.length - 1; i >= 0; i--) {
      const stroke = this.strokes[i];
      if (!stroke) continue;
      
      try {
        // Get stroke's bounding box
        const bbox = stroke.bbox();
        
        // Quick bbox test then precise path hit-test
        if (this._boxesIntersect(eraserBox, bbox)) {
          const pathEl = stroke.node;
          const totalLength = pathEl.getTotalLength();
          const step = eraserRadius;
          let hit = false;
          for (let s = 0; s <= totalLength; s += step) {
            const p = pathEl.getPointAtLength(s);
            const dx = p.x - lastPoint.x;
            const dy = p.y - lastPoint.y;
            if (dx * dx + dy * dy <= eraserRadius * eraserRadius) {
              hit = true;
              break;
            }
          }
          if (hit) {
            // Save to undo stack before removing
            this.undoStack.push({
              type: 'erase',
              stroke: stroke.clone(),
              index: i
            });
            
            // Remove the stroke from DOM and array
            stroke.remove();
            this.strokes.splice(i, 1);
            erasedAny = true;
          }
        }
      } catch (err) {
        console.warn('Error while erasing stroke:', err);
      }
    }
    
    // Clear redo stack only if we actually erased something
    if (erasedAny) {
      this.redoStack = [];
    }
  }
  
  /**
   * Get bounding box for an array of points
   */
  _getBoundingBox(points) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    for (const point of points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
  
  /**
   * Check if two bounding boxes intersect
   */
  _boxesIntersect(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }
  
  /**
   * Undo the last action
   * @public
   */
  undo() {
    // Check if there's anything to undo
    if (this.undoStack.length === 0) return this;
    
    try {
      const action = this.undoStack.pop();
      
      // Handle different action types
      switch (action.type) {
        case 'clear':
          this._undoClearAction(action);
          break;
          
        case 'erase':
          this._undoEraseAction(action);
          break;
          
        case 'draw':
          this._undoDrawAction(action);
          break;
          
        default:
          console.warn('Unknown action type:', action.type);
          break;
      }
    } catch (err) {
      console.error('Error during undo operation:', err);
    }
    
    return this; // Enable method chaining
  }
  
  /**
   * Undo a clear action
   * @param {Object} action - The clear action to undo
   * @private
   */
  _undoClearAction(action) {
    // Save current state to redo stack
    this.redoStack.push({
      type: 'clear',
      strokes: this.strokes.map(stroke => stroke.clone())
    });
    
    // Remove any existing strokes
    for (const stroke of this.strokes) {
      if (stroke && typeof stroke.remove === 'function') {
        stroke.remove();
      }
    }
    
    // Restore strokes from the undo action
    this.strokes = [];
    for (const storedStroke of action.strokes) {
      if (storedStroke && typeof storedStroke.addTo === 'function') {
        const restoredStroke = storedStroke.addTo(this.draw);
        this.strokes.push(restoredStroke);
      }
    }
  }
  
  /**
   * Undo an erase action
   * @param {Object} action - The erase action to undo
   * @private
   */
  _undoEraseAction(action) {
    // Restore erased stroke
    const restoredStroke = action.stroke.addTo(this.draw);
    this.strokes.splice(action.index, 0, restoredStroke);
    
    // Add to redo stack
    this.redoStack.push({
      type: 'erase',
      stroke: restoredStroke.clone(),
      index: action.index
    });
  }
  
  /**
   * Undo a draw action
   * @param {Object} action - The draw action to undo
   * @private
   */
  _undoDrawAction(action) {
    // Remove the drawn stroke
    if (this.strokes.length > 0) {
      const stroke = this.strokes.pop();
      
      // Add to redo stack
      this.redoStack.push({
        type: 'draw',
        stroke: stroke.clone()
      });
      
      // Remove from DOM
      stroke.remove();
    }
  }
  
  /**
   * Redo the last undone action
   * @public
   */
  redo() {
    // Check if there's anything to redo
    if (this.redoStack.length === 0) return this;
    
    try {
      const action = this.redoStack.pop();
      
      // Handle different action types
      switch (action.type) {
        case 'clear':
          this._redoClearAction(action);
          break;
          
        case 'erase':
          this._redoEraseAction(action);
          break;
          
        case 'draw':
          this._redoDrawAction(action);
          break;
          
        default:
          console.warn('Unknown action type:', action.type);
          break;
      }
    } catch (err) {
      console.error('Error during redo operation:', err);
    }
    return this; // Enable method chaining
  }
  
  /**
   * Redo a clear action
   * @param {Object} action - The clear action to redo
   * @private
   */
  _redoClearAction(action) {
    // Save current state to undo stack
    this.undoStack.push({
      type: 'clear',
      strokes: this.strokes.map(stroke => stroke.clone())
    });
    
    // Remove all strokes
    for (const stroke of this.strokes) {
      if (stroke && typeof stroke.remove === 'function') {
        stroke.remove();
      }
    }
    
    // Restore strokes from the redo action
    this.strokes = [];
    for (const storedStroke of action.strokes) {
      if (storedStroke && typeof storedStroke.addTo === 'function') {
        const restoredStroke = storedStroke.addTo(this.draw);
        this.strokes.push(restoredStroke);
      }
    }
  }
  
  /**
   * Redo an erase action
   * @param {Object} action - The erase action to redo
   * @private
   */
  _redoEraseAction(action) {
    // Add to undo stack
    this.undoStack.push({
      type: 'erase',
      stroke: action.stroke.clone(),
      index: action.index
    });
    
    // Remove the stroke
    action.stroke.remove();
    this.strokes.splice(action.index, 1);
  }
  
  /**
   * Redo a draw action
   * @param {Object} action - The draw action to redo
   * @private
   */
  _redoDrawAction(action) {
    // Restore the drawn stroke
    const restoredStroke = action.stroke.addTo(this.draw);
    this.strokes.push(restoredStroke);
    
    // Add to undo stack
    this.undoStack.push({
      type: 'draw',
      stroke: restoredStroke.clone()
    });
  }
  /**
   * Clear the entire canvas
   * @public
   * @returns {DrawingTool} The DrawingTool instance for method chaining
   */
  clear() {
    // First, make sure any current stroke is properly ended
    if (this.isDrawing) {
      this._endStroke();
    }
    
    // Only add to undo stack if there are strokes to clear
    if (this.strokes.length > 0) {
      this.undoStack.push({
        type: 'clear',
        strokes: this.strokes.map(stroke => stroke.clone())
      });
      
      // Remove all strokes from the DOM
      for (const stroke of this.strokes) {
        if (stroke && typeof stroke.remove === 'function') {
          stroke.remove();
        }
      }
      
      // Reset strokes array and clear redo stack
      this.strokes = [];
      this.redoStack = [];
    }
    
    // Also remove any orphaned strokes that might be on the canvas but not in the strokes array
    try {
      const allPaths = this.draw.find('path');
      for (const path of allPaths) {
        if (!this.strokes.includes(path)) {
          path.remove();
        }
      }
    } catch (err) {
      console.warn('Error cleaning up orphaned paths:', err);
    }
    
    return this; // Enable method chaining
  }
  
  /**
   * Toggle eraser mode
   * @param {boolean} enabled - Whether to enable eraser mode
   * @public
   * @returns {DrawingTool} The DrawingTool instance for method chaining
   */
  toggleEraser(enabled) {
    this.eraseMode = !!enabled; // Convert to boolean
    
    // Update cursor style based on mode
    if (this.eraseMode) {
      // Custom eraser cursor with a semi-transparent red circle
      this.draw.node.style.cursor = 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2"><circle cx="12" cy="12" r="10" fill="rgba(255,0,0,0.2)"/></svg>\') 12 12, auto';
    } else {
      // Standard crosshair cursor for drawing mode
      this.draw.node.style.cursor = 'crosshair';
    }
    
    return this; // Enable method chaining
  }
  
  /**
   * Get SVG data for saving
   * @returns {string} SVG markup as a string
   * @public
   */
  getSVGData() {
    // Export full canvas SVG by cloning strokes
    const rect = this.draw.node.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('width', `${width}`);
    svg.setAttribute('height', `${height}`);
    svg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
    this.strokes.forEach(shape => {
      if (shape && shape.node) {
        svg.appendChild(shape.node.cloneNode(true));
      }
    });
    return svg.outerHTML;
  }
  
  /**
   * Import an SVG into the canvas and register shapes for editing
   * @param {string} svgData - SVG markup to import
   * @public
   */
  loadSketch(svgData) {
    this.clear();
    // Parse input SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgData, 'image/svg+xml');
    const importedSvg = doc.documentElement;
    // Apply viewBox if present
    const vb = importedSvg.getAttribute('viewBox');
    if (vb && typeof this.draw.viewbox === 'function') {
      const [x, y, w, h] = vb.split(' ').map(Number);
      this.draw.viewbox(x, y, w, h);
    } else if (vb) {
      this.draw.node.setAttribute('viewBox', vb);
    }
    // Import each shape node
    this.strokes = [];
    Array.from(importedSvg.childNodes).forEach(node => {
      if (node.nodeType === 1) {
        const cloned = document.importNode(node, true);
        this.draw.node.appendChild(cloned);
        const shape = SVG.adopt(cloned);
        this.strokes.push(shape);
      }
    });
    return this;
  }
  
  /**
   * Save the drawing as an SVG file locally
   * @param {string} [filename] - Optional custom filename (default: sketch_timestamp.svg)
   * @public
   */
  saveLocally(filename) {
    try {
      // Get SVG data
      const svgData = this.getSVGData();
      
      // Create blob and object URL
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `sketch_${Date.now()}.svg`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up object URL
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      return true;
    } catch (err) {
      console.error('Error saving drawing:', err);
      return false;
    }
  }

  /**
   * Clear the canvas and reset drawing state.
   * @public
   */
  clear() {
    // Clear the SVG drawing surface
    this.draw.clear();
    // Reset drawing state
    this.strokes = [];
    this.currentStroke = null;
    this.previewStroke = null;
    this.isDrawing = false;
    // Clear history stacks
    this.undoStack = [];
    this.redoStack = [];
    return this;
  }

  /**
   * Import an SVG into the canvas.
   * Clears existing content and draws the new SVG.
   * @param {string} svgData - SVG markup to import
   * @public
   */
  loadSketch(svgData) {
    this.clear();
    // Load SVG markup into drawing surface
    this.draw.svg(svgData);
    // Record imported strokes (paths) for saving and erasing
    this.strokes = [];
    this.draw.find('path').forEach(path => this.strokes.push(path));
    return this;
  }
}
