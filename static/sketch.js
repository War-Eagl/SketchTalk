const canvas = document.getElementById('drawing-board');
const ctx = canvas.getContext('2d');

// Adjust canvas size to fill the entire window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();

// Redraw canvas on window resize to ensure it remains full screen
window.addEventListener('resize', () => {
    resizeCanvas();
    redrawCanvas();
});

let isPainting = false;
let isErasing = false;
let startX, startY;
let strokes = []; // Stores all strokes as point arrays
let currentStroke = []; // Stores the current stroke's points
let undoStack = [];
let redoStack = [];

// Chaikin's algorithm to smooth strokes into bezier curves
function smoothStroke(stroke) {
    if (stroke.length < 3) return stroke; // No smoothing for short strokes
    const smoothed = [];
    for (let i = 0; i < stroke.length - 1; i++) {
        const p0 = stroke[i];
        const p1 = stroke[i + 1];
        smoothed.push({
            x: 0.75 * p0.x + 0.25 * p1.x,
            y: 0.75 * p0.y + 0.25 * p1.y
        });
        smoothed.push({
            x: 0.25 * p0.x + 0.75 * p1.x,
            y: 0.25 * p0.y + 0.75 * p1.y
        });
    }
    return smoothed;
}

// Toolbar event listeners
document.getElementById('toolbar').addEventListener('click', e => {
    if (e.target.id === 'clear') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        strokes = [];
        undoStack = [];
        redoStack = [];
    }
    if (e.target.id === 'erase') {
        toggleEraseMode();
    }
    if (e.target.id === 'save-local') {
        saveAsSVG('local');
    }
    if (e.target.id === 'save-server') {
        saveAsSVG('server');
    }
    if (e.target.id === 'undo') {
        undo();
    }
    if (e.target.id === 'redo') {
        redo();
    }
});

// Toggle erase mode
function toggleEraseMode() {
    isErasing = !isErasing;
    document.getElementById('erase').textContent = isErasing ? "Draw" : "Erase";
}

// Keyboard shortcuts for undo, redo, and erase
document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'z') undo();
    if (e.ctrlKey && e.key === 'y') redo();
    if (e.key === 'e') toggleEraseMode();
});

// Drawing function
const draw = (e) => {
    if (!isPainting) return;

    const x = e.clientX;
    const y = e.clientY;

    if (isErasing) {
        eraseStroke(x, y);
    } else {
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineTo(x, y);
        ctx.stroke();
        currentStroke.push({ x, y });
    }
};

// Erase a stroke if the mouse is dragged over it
function eraseStroke(x, y) {
    for (let i = strokes.length - 1; i >= 0; i--) {
        const stroke = strokes[i];
        if (stroke.some(point => Math.hypot(point.x - x, point.y - y) < 10)) {
            undoStack.push({ type: 'erase', stroke: strokes.splice(i, 1)[0] });
            redoStack = [];
            redrawCanvas();
            break;
        }
    }
}

// Start drawing when mouse is pressed
canvas.addEventListener('mousedown', (e) => {
    isPainting = true;
    ctx.beginPath();
    const x = e.clientX;
    const y = e.clientY;
    currentStroke = [{ x, y }];
});

// Stop drawing when mouse is released
canvas.addEventListener('mouseup', () => {
    if (currentStroke.length > 1 && !isErasing) {
        const smoothedStroke = smoothStroke(currentStroke);
        strokes.push(smoothedStroke); // Save completed stroke
        undoStack.push({ type: 'draw', stroke: smoothedStroke }); // Save to undo stack
        redoStack = []; // Clear redo stack after new stroke
    }
    isPainting = false;
    ctx.beginPath();
});

// Drawing while mouse is moved
canvas.addEventListener('mousemove', draw);

// Save strokes as SVG
function saveAsSVG(mode) {
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">`;

    strokes.forEach(stroke => {
        if (stroke.length < 2) return;
        let pathData = `M ${stroke[0].x},${stroke[0].y} `;
        for (let i = 1; i < stroke.length; i++) {
            pathData += `L ${stroke[i].x},${stroke[i].y} `;
        }
        svgContent += `<path d="${pathData}" stroke="black" fill="none" stroke-width="2"/>`;
    });

    svgContent += `</svg>`;

    if (mode === 'local') {
        const blob = new Blob([svgContent], { type: "image/svg+xml" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "drawing.svg";
        link.click();
    } else if (mode === 'server') {
        fetch('/save-drawing', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ svg: svgContent })
        }).then(response => response.json())
          .then(data => {
              if (data.success) {
                  alert("Drawing saved to server.");
              } else {
                  alert("Error saving drawing to server.");
              }
          }).catch(error => alert("Error saving drawing to server."));
    }
}

// Undo function
function undo() {
    if (undoStack.length > 0) {
        const lastAction = undoStack.pop();
        redoStack.push(lastAction);

        if (lastAction.type === 'draw') {
            strokes.pop(); // Remove the last stroke
        } else if (lastAction.type === 'erase') {
            strokes.push(lastAction.stroke); // Restore erased stroke
        }
        redrawCanvas();
    }
}

// Redo function
function redo() {
    if (redoStack.length > 0) {
        const lastAction = redoStack.pop();
        undoStack.push(lastAction);

        if (lastAction.type === 'draw') {
            strokes.push(lastAction.stroke);
        } else if (lastAction.type === 'erase') {
            strokes = strokes.filter(stroke => stroke !== lastAction.stroke);
        }
        redrawCanvas();
    }
}

// Redraw canvas from stored strokes
function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes.forEach(stroke => {
        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length; i++) {
            ctx.lineTo(stroke[i].x, stroke[i].y);
            ctx.stroke();
        }
    });
}
