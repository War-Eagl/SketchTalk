# TalkSketch React

A React-based drawing application with p5.js integration for smooth drawing and erasing functionality.

## Features

- Drawing on a full-screen canvas with smooth strokes
- Erase mode that removes strokes by intersecting with them
- Undo/Redo functionality for both drawing and erasing
- Save drawings locally as SVG files
- Save drawings to server with unique timestamps
- Responsive design that adapts to window size

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Python 3.x
- Flask (Python web framework)

## Project Structure

```
talksketch/
├── app.py                 # Flask backend server
├── saved_drawings/        # Directory for saved SVG files
└── talksketch-react/      # React frontend
    ├── src/
    │   ├── components/
    │   │   └── DrawingCanvas.tsx  # Main drawing component
    │   ├── App.tsx
    │   └── ...
    └── ...
```

## Setup

### Backend Setup

1. Install Python dependencies:
```bash
pip install flask
```

2. Start the Flask server:
```bash
python app.py
```
The server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the React project directory:
```bash
cd talksketch-react
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```
The app will be available at `http://localhost:3000`

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

### Saving
- "Save Locally" - Downloads the drawing as an SVG file
- "Save to Server" - Saves the drawing to the server with a timestamp
- Saved files are stored in the `saved_drawings` directory

### Undo/Redo
- Use the "Undo" button to remove the last stroke
- Use the "Redo" button to restore the last undone stroke
- Works for both drawing and erasing actions

## Development

- The main drawing component is located in `src/components/DrawingCanvas.tsx`
- Styles are split between `src/components/DrawingCanvas.css` and `src/App.css`
- The application uses TypeScript for type safety
- The backend uses Flask for handling file saves

## Building for Production

To create a production build of the frontend:

```bash
cd talksketch-react
npm run build
```

The build files will be created in the `build` directory.

## Troubleshooting

- If the server save fails, ensure both the Flask server and React app are running
- Check the browser console for any error messages
- Make sure the `saved_drawings` directory exists and has write permissions
- If you encounter CORS issues, ensure you're running both servers on the correct ports
