# TalkSketch

A collaborative drawing application that allows users to sketch and save their drawings. Built with React and Flask, it provides a smooth drawing experience with advanced features like undo/redo and SVG export.

## Features

- Real-time drawing on canvas with smooth strokes
- Advanced undo/redo functionality with proper stack management
- Erase mode that removes strokes by intersecting with them
- Save drawings locally as SVG files
- Save drawings to server with unique timestamps
- Responsive design that adapts to window size
- Single-port architecture (no CORS issues)

## Project Structure

```
talksketch/
├── backend/           # Flask server
│   ├── app.py        # Main server application (serves both API and React frontend)
│   ├── static/       # Static files
│   └── templates/    # HTML templates
├── frontend/         # React application
│   ├── src/          # Source code
│   │   ├── components/
│   │   │   └── DrawingCanvas.tsx  # Main drawing component
│   │   ├── App.tsx
│   │   └── ...
│   ├── public/       # Public assets
│   └── package.json  # Dependencies
├── saved_drawings/   # User-generated drawings
├── docs/            # Documentation
└── run.ps1          # Script to start the server (Windows)
```

## Quick Start

1. Install dependencies:
   ```bash
   # Install Python dependencies
   cd backend
   pip install flask
   cd ..

   # Install Node.js dependencies
   cd frontend
   npm install
   cd ..
   ```

2. Build the React frontend:
   ```bash
   cd frontend
   npm run build
   cd ..
   ```

3. Run the application:
   ```bash
   # On Windows
   .\run.ps1

   # On Linux/Mac
   ./run.sh
   ```

The application will be available at http://localhost:5000

## Usage

### Drawing
- Click and drag to draw
- The canvas automatically resizes with the window
- Strokes are smoothed for better drawing experience

### Erasing
- Click the "Erase" button to toggle erase mode
- In erase mode, any stroke that intersects with your mouse cursor will be erased
- Click or drag to erase strokes
- Toggle back to "Draw" mode to continue drawing

### Undo/Redo
- Use the "Undo" button to remove the last stroke
- Use the "Redo" button to restore the last undone stroke
- Works for both drawing and erasing actions
- Drawing a new stroke after undoing will clear the redo stack

### Saving
- "Save Locally" - Downloads the drawing as an SVG file
- "Save to Server" - Saves the drawing to the server with a timestamp
- Saved files are stored in the `saved_drawings` directory

## Development

- Backend: Python/Flask
- Frontend: React/TypeScript
- Drawing: HTML5 Canvas
- File Format: SVG
- State Management: React Hooks
- Build Tool: Create React App

## License

MIT License