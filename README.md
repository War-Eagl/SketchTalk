# TalkSketch

A collaborative drawing application that allows users to sketch and save their drawings.

## Project Structure

```
talksketch/
├── backend/           # Flask server
│   ├── app.py        # Main server application
│   ├── static/       # Static files
│   └── templates/    # HTML templates
├── frontend/         # React application
│   ├── src/          # Source code
│   ├── public/       # Public assets
│   └── package.json  # Dependencies
├── saved_drawings/   # User-generated drawings
├── docs/            # Documentation
└── run.ps1          # Script to start both servers
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

2. Run the application:
   ```bash
   # On Windows
   .\run.ps1

   # On Linux/Mac
   ./run.sh
   ```

This will start both the backend and frontend servers. The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Manual Setup (Alternative)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install flask
   ```

3. Run the Flask server:
   ```bash
   python app.py
   ```

The backend server will run on `http://localhost:5000`.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The frontend application will run on `http://localhost:3000`.

## Features

- Real-time drawing on canvas
- Save drawings locally as SVG
- Save drawings to server
- Undo/Redo functionality
- Clear and Erase tools

## Development

- Backend: Python/Flask
- Frontend: React/TypeScript
- Drawing: HTML5 Canvas
- File Format: SVG

## License

MIT License