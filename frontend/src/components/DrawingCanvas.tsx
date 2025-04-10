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

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    let x: number, y: number;

    if ('touches' in e) {
      // Touch event
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const { x, y } = getCoordinates(e);
    
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

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isPainting || !canvasRef.current || !ctxRef.current) return;
    
    const { x, y } = getCoordinates(e);

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
      setStrokes(prev => {
        const newStrokes = [...prev, newStroke];
        setUndoStack(newStrokes);
        setRedoStack([]);
        return newStrokes;
      });
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
    setStrokes(prev => {
      if (prev.length === 0) return prev;
      
      const newStrokes = prev.slice(0, -1);
      const undoneStroke = prev[prev.length - 1];
      
      setUndoStack(newStrokes);
      setRedoStack(prevRedo => [...prevRedo, undoneStroke]);
      
      if (canvasRef.current && ctxRef.current) {
        const ctx = ctxRef.current;
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        newStrokes.forEach(stroke => {
          if (!stroke.isErased && stroke.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            for (let i = 1; i < stroke.points.length; i++) {
              ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
            }
            ctx.stroke();
          }
        });
      }
      
      return newStrokes;
    });
  };

  const handleRedo = () => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev;
      
      const nextStroke = prev[prev.length - 1];
      const newRedoStack = prev.slice(0, -1);
      
      setStrokes(current => {
        const newStrokes = [...current, nextStroke];
        setUndoStack(newStrokes);
        
        if (canvasRef.current && ctxRef.current) {
          const ctx = ctxRef.current;
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          newStrokes.forEach(stroke => {
            if (!stroke.isErased && stroke.points.length > 1) {
              ctx.beginPath();
              ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
              for (let i = 1; i < stroke.points.length; i++) {
                ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
              }
              ctx.stroke();
            }
          });
        }
        
        return newStrokes;
      });
      
      return newRedoStack;
    });
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
      const response = await axios.post('/save-drawing', 
        { svg: svgContent },
        {
          headers: {
            'Content-Type': 'application/json',
          }
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
          alert(`Server error: ${error.response.data.error || error.response.statusText}`);
        } else if (error.request) {
          alert('No response from server. Make sure the server is running.');
        } else {
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
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        style={{ touchAction: 'none' }} // Prevent scrolling while drawing
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