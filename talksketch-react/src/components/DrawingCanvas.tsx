import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './DrawingCanvas.css';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  isErased: boolean;
}

const DrawingCanvas: React.FC = () => {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [isPainting, setIsPainting] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [undoStack, setUndoStack] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const currentStrokeRef = useRef<Point[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size to window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Get context and set default styles
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctxRef.current = ctx;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'black';

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsPainting(true);
    currentStrokeRef.current = [{ x, y }];

    if (isErasing) {
      // Check for strokes to erase
      const newStrokes = strokes.map(stroke => {
        if (stroke.isErased) return stroke;
        
        // Check if any point in the stroke is close to the current point
        const isIntersecting = stroke.points.some(point => 
          Math.hypot(point.x - x, point.y - y) < 20
        );
        
        if (isIntersecting) {
          return { ...stroke, isErased: true };
        }
        return stroke;
      });

      setStrokes(newStrokes);
      redrawCanvas();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPainting || !canvasRef.current || !ctxRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isErasing) {
      // Check for strokes to erase while dragging
      const newStrokes = strokes.map(stroke => {
        if (stroke.isErased) return stroke;
        
        // Check if any point in the stroke is close to the current point
        const isIntersecting = stroke.points.some(point => 
          Math.hypot(point.x - x, point.y - y) < 20
        );
        
        if (isIntersecting) {
          return { ...stroke, isErased: true };
        }
        return stroke;
      });

      setStrokes(newStrokes);
      redrawCanvas();
    } else {
      const ctx = ctxRef.current;
      const currentStroke = currentStrokeRef.current;
      const lastPoint = currentStroke[currentStroke.length - 1];

      // Draw line from last point to current point
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Add current point to stroke
      currentStrokeRef.current.push({ x, y });
    }
  };

  const stopDrawing = () => {
    if (!isPainting) return;
    
    if (!isErasing && currentStrokeRef.current.length > 1) {
      const newStroke = { points: [...currentStrokeRef.current], isErased: false };
      setStrokes(prev => [...prev, newStroke]);
      setUndoStack(prev => [...prev, newStroke]);
      setRedoStack([]);
    }
    
    setIsPainting(false);
    currentStrokeRef.current = [];
  };

  const redrawCanvas = () => {
    if (!canvasRef.current || !ctxRef.current) return;
    
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    strokes.forEach(stroke => {
      if (!stroke.isErased && stroke.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      }
    });
  };

  const handleClear = () => {
    if (!canvasRef.current || !ctxRef.current) return;
    ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setStrokes([]);
    setUndoStack([]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (strokes.length > 0) {
      const lastStroke = strokes[strokes.length - 1];
      setStrokes(prev => prev.slice(0, -1));
      setUndoStack(prev => [...prev, lastStroke]);
      setRedoStack(prev => [...prev, lastStroke]);
      redrawCanvas();
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const lastUndone = redoStack[redoStack.length - 1];
      setStrokes(prev => [...prev, lastUndone]);
      setUndoStack(prev => [...prev, lastUndone]);
      setRedoStack(prev => prev.slice(0, -1));
      redrawCanvas();
    }
  };

  const handleSaveLocal = () => {
    const svgContent = generateSVG();
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'drawing.svg';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveServer = async () => {
    try {
      const svgContent = generateSVG();
      const response = await axios.post('http://localhost:5000/save-drawing', 
        { svg: svgContent },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: false
        }
      );
      
      if (response.data.success) {
        alert(`Drawing saved successfully as ${response.data.filename}`);
      } else {
        alert(`Failed to save drawing: ${response.data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving to server:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          alert(`Server error: ${error.response.data.error || error.response.statusText}`);
        } else if (error.request) {
          // The request was made but no response was received
          alert('No response from server. Make sure the server is running and accessible.');
        } else {
          // Something happened in setting up the request that triggered an Error
          alert(`Error: ${error.message}`);
        }
      } else {
        alert('An unexpected error occurred while saving to server.');
      }
    }
  };

  const generateSVG = () => {
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${window.innerWidth}" height="${window.innerHeight}" viewBox="0 0 ${window.innerWidth} ${window.innerHeight}">`;
    
    strokes.forEach(stroke => {
      if (!stroke.isErased && stroke.points.length > 1) {
        let pathData = `M ${stroke.points[0].x},${stroke.points[0].y} `;
        for (let i = 1; i < stroke.points.length; i++) {
          pathData += `L ${stroke.points[i].x},${stroke.points[i].y} `;
        }
        svgContent += `<path d="${pathData}" stroke="black" fill="none" stroke-width="2"/>`;
      }
    });

    svgContent += '</svg>';
    return svgContent;
  };

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
      <div className="toolbar">
        <button onClick={handleClear}>Clear</button>
        <button onClick={() => setIsErasing(!isErasing)}>
          {isErasing ? 'Draw' : 'Erase'}
        </button>
        <button onClick={handleUndo}>Undo</button>
        <button onClick={handleRedo}>Redo</button>
        <button onClick={handleSaveLocal}>Save Locally</button>
        <button onClick={handleSaveServer}>Save to Server</button>
      </div>
    </div>
  );
};

export default DrawingCanvas; 