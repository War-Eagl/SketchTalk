/**
 * TalkSketch Drawing Module
 * Handles canvas drawing functionality with Bezier curve conversion
 */

class DrawingTool {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);
    
    // Create SVG drawing surface using SVG.js
    this.draw = SVG().addTo(`#${canvasContainerId}`).size('100%', '100%');
    this.draw.attr('id', 'drawing-svg');
    
    // Initialize state variables
    this.isDrawing = false;
    this.currentStroke = null;
    this.currentPath = [];
    this.strokes = [];
    this.undoStack = [];
    this.redoStack = [];
    this.eraseMode = false;
    
    // Bind event listeners
    this._bindEventListeners();
  }
  
  /**
   * Setup event listeners for drawing
   */
  _bindEventListeners() {
    const drawArea = this.draw.node;
    
    // Mouse events
    drawArea.addEventListener('mousedown', this._handleDrawStart.bind(this));
    drawArea.addEventListener('mousemove', this._handleDrawMove.bind(this));
    drawArea.addEventListener('mouseup', this._handleDrawEnd.bind(this));
    drawArea.addEventListener('mouseleave', this._handleDrawEnd.bind(this));
    
    // Touch events
    drawArea.addEventListener('touchstart', this._handleTouchStart.bind(this), { passive: false });
    drawArea.addEventListener('touchmove', this._handleTouchMove.bind(this), { passive: false });
    drawArea.addEventListener('touchend', this._handleTouchEnd.bind(this));
    
    // Pointer events for stylus support
    if (window.PointerEvent) {
      drawArea.addEventListener('pointerdown', this._handlePointerStart.bind(this));
      drawArea.addEventListener('pointermove', this._handlePointerMove.bind(this));
      drawArea.addEventListener('pointerup', this._handlePointerEnd.bind(this));
      drawArea.addEventListener('pointerleave', this._handlePointerEnd.bind(this));
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
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const point = this._getPointFromTouch(touch);
    this._startStroke(point);
  }
  
  /**
   * Handle touch drawing move
   */
  _handleTouchMove(e) {
    if (!this.isDrawing) return;
    e.preventDefault();
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const point = this._getPointFromTouch(touch);
    this._addPointToStroke(point);
  }
  
  /**
   * Handle touch drawing end
   */
  _handleTouchEnd(e) {
    if (!this.isDrawing) return;
    e.preventDefault();
    
    this._endStroke();
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
  _startStroke(point) {
    this.isDrawing = true;
    this.currentPath = [point];
    
    // Create new path element for current stroke
    this.currentStroke = this.draw.path().stroke({
      color: '#4d90fe',
      width: 3,
      linecap: 'round',
      linejoin: 'round'
    }).fill('none');
    
    // Draw initial point
    this.currentStroke.plot(`M${point.x},${point.y}`);
  }
  
  /**
   * Add a point to the current stroke
   */
  _addPointToStroke(point) {
    this.currentPath.push(point);
    
    // Update the path with new point
    const pathData = this._getPathDataFromPoints(this.currentPath);
    this.currentStroke.plot(pathData);
  }
  
  /**
   * End the current stroke and convert to bezier curve
   */
  _endStroke() {
    this.isDrawing = false;
    
    if (this.currentPath.length > 1) {
      if (this.eraseMode) {
        // Handle eraser functionality
        this._eraseStrokes();
      } else {
        // Convert path to bezier curves
        const bezierPath = this._convertToBezier(this.currentPath);
        this.currentStroke.plot(bezierPath);
        
        // Save stroke for undo/redo
        this.strokes.push(this.currentStroke);
        
        // Add to undo stack for draw action
        this.undoStack.push({
          type: 'draw',
          stroke: this.currentStroke.clone()
        });
        
        this.redoStack = []; // Clear redo stack when new action is performed
      }
    } else {
      // Remove single point strokes
      this.currentStroke.remove();
    }
    
    this.currentStroke = null;
    this.currentPath = [];
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
  _eraseStrokes() {
    if (!this.currentStroke || this.strokes.length === 0) return;
    
    // Create a simple bounding box for the eraser stroke
    const eraserBox = this._getBoundingBox(this.currentPath);
    
    // Find strokes that intersect with the eraser
    for (let i = this.strokes.length - 1; i >= 0; i--) {
      const stroke = this.strokes[i];
      const strokeBox = stroke.bbox();
      
      // Check for bounding box overlap (simple intersection test)
      if (this._boxesIntersect(eraserBox, {
        x: strokeBox.x,
        y: strokeBox.y,
        width: strokeBox.width,
        height: strokeBox.height
      })) {
        // Save to undo stack and remove the stroke
        this.undoStack.push({
          type: 'erase',
          stroke: stroke.clone(),
          index: i
        });
        
        stroke.remove();
        this.strokes.splice(i, 1);
      }
    }
    
    // Remove the eraser stroke itself
    this.currentStroke.remove();
    this.redoStack = []; // Clear redo stack when new action is performed
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
   * Clear the entire canvas
   */
  clear() {
    // Save current strokes to undo stack
    if (this.strokes.length > 0) {
      this.undoStack.push({
        type: 'clear',
        strokes: this.strokes.map(stroke => stroke.clone())
      });
      
      // Remove all strokes
      for (const stroke of this.strokes) {
        stroke.remove();
      }
      
      this.strokes = [];
      this.redoStack = []; // Clear redo stack when new action is performed
    }
  }
  
  /**
   * Toggle eraser mode
   */
  toggleEraser(enabled) {
    this.eraseMode = enabled;
    
    // Change cursor style
    if (enabled) {
      this.draw.node.style.cursor = 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2"><circle cx="12" cy="12" r="10" fill="rgba(255,0,0,0.2)"/></svg>\') 12 12, auto';
    } else {
      this.draw.node.style.cursor = 'crosshair';
    }
  }
  
  /**
   * Undo the last action
   */
  undo() {
    if (this.undoStack.length === 0) return;
    
    const action = this.undoStack.pop();
    
    if (action.type === 'clear') {
      // Restore cleared strokes
      this.redoStack.push({
        type: 'clear',
        strokes: this.strokes.map(stroke => stroke.clone())
      });
      
      // Remove any existing strokes
      for (const stroke of this.strokes) {
        stroke.remove();
      }
      
      // Restore strokes from the undo action
      this.strokes = [];
      for (const storedStroke of action.strokes) {
        const restoredStroke = storedStroke.addTo(this.draw);
        this.strokes.push(restoredStroke);
      }
    } else if (action.type === 'erase') {
      // Restore erased stroke
      const restoredStroke = action.stroke.addTo(this.draw);
      this.strokes.splice(action.index, 0, restoredStroke);
      
      this.redoStack.push({
        type: 'erase',
        stroke: restoredStroke,
        index: action.index
      });
    } else if (action.type === 'draw') {
      // Remove the drawn stroke
      const stroke = this.strokes.pop();
      this.redoStack.push({
        type: 'draw',
        stroke: stroke.clone()
      });
      stroke.remove();
    }
  }
  
  /**
   * Redo the last undone action
   */
  redo() {
    if (this.redoStack.length === 0) return;
    
    const action = this.redoStack.pop();
    
    if (action.type === 'clear') {
      // Save current strokes to undo stack
      this.undoStack.push({
        type: 'clear',
        strokes: this.strokes.map(stroke => stroke.clone())
      });
      
      // Remove all strokes
      for (const stroke of this.strokes) {
        stroke.remove();
      }
      
      // Restore strokes from the redo action
      this.strokes = [];
      for (const storedStroke of action.strokes) {
        const restoredStroke = storedStroke.addTo(this.draw);
        this.strokes.push(restoredStroke);
      }
    } else if (action.type === 'erase') {
      // Re-erase the stroke
      this.undoStack.push({
        type: 'erase',
        stroke: action.stroke.clone(),
        index: action.index
      });
      
      action.stroke.remove();
      this.strokes.splice(action.index, 1);
    } else if (action.type === 'draw') {
      // Restore the drawn stroke
      const restoredStroke = action.stroke.addTo(this.draw);
      this.strokes.push(restoredStroke);
      
      this.undoStack.push({
        type: 'draw',
        stroke: restoredStroke.clone()
      });
    }
  }
  
  /**
   * Get SVG data for saving
   */
  getSVGData() {
    return this.draw.svg();
  }
  
  /**
   * Save the drawing as an SVG file locally
   */
  saveLocally() {
    const svgData = this.getSVGData();
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `sketch_${Date.now()}.svg`;
    link.click();
    
    URL.revokeObjectURL(url);
  }
}
