# TalkSketch

A web-based drawing and sketching application where users can draw strokes, erase parts of the strokes, and save the artwork locally or to a server. The strokes are smoothed using Chaikin’s Algorithm and can be saved as an SVG file.

## Features
- **Draw Mode**: Use the mouse to draw continuous strokes.
- **Erase Mode**: Erase entire strokes by clicking and dragging.
- **Undo and Redo**: Undo and redo drawing actions.
- **Save Locally**: Save the drawing as an SVG file to the local machine.
- **Save to Server**: Send the drawing to a server (Flask backend) to be stored as an SVG file.
- **Responsive Canvas**: The canvas adjusts to the full size of the browser window.

## Folder Structure
```
TalkSketch/
├── static/
│   ├── sketch.js        # JavaScript file that handles drawing logic, interactions, and saving
│   ├── style.css        # CSS file for styling the canvas and toolbar
├── templates/
│   └── index.html       # HTML file for the front-end structure of the app
└── app.py               # Flask backend to handle server-side logic for saving the SVG
```

## Files Overview

### 1. **index.html** (in `templates/`)
- **Purpose**: The HTML structure of the app.
- **Components**: 
  - Drawing canvas for the user to sketch on.
  - Toolbar with buttons for drawing, erasing, undo, redo, saving locally, and saving to the server.
  
### 2. **sketch.js** (in `static/`)
- **Purpose**: Contains all the JavaScript logic for:
  - Drawing on the canvas.
  - Erasing strokes.
  - Implementing undo and redo functionality.
  - Saving the artwork as SVG and sending it to the server.
- **Key Functions**:
  - `draw()`: Handles the drawing and erasing of strokes.
  - `chaikinCurve()`: Applies Chaikin's Algorithm to smooth the strokes into Bezier curves.
  - `saveAsSVG()`: Converts the strokes to SVG format and saves locally.
  - `saveToServer()`: Sends the SVG data to the Flask server for storage.

### 3. **style.css** (in `static/`)
- **Purpose**: Contains the styles for the canvas and toolbar, ensuring the app looks good and is responsive.
- **Components**:
  - Styles for the toolbar buttons.
  - Styles for the canvas to make it full screen and responsive.

### 4. **app.py** (Flask Backend)
- **Purpose**: The backend server to handle saving the SVG file sent from the frontend.
- **Routes**:
  - `/save_svg`: Receives the SVG data from the front-end and saves it to the server.
  - Provides a basic Flask setup for server-side communication.

---

## Quick Start

### 1. **Clone the repository**:
Clone this project to your local machine.

```bash
git clone <repository-url>
cd Sketching-App
```
### 2. **Set up the environment**:
Make sure you have Python 3 installed. Then, install the necessary dependencies:

```bash
pip install flask
```
### 3. **Run the Flask Server**:
Start the Flask development server by running the following command:

```bash
python app.py
```
This will start the server at http://127.0.0.1:5000.

### 4. **Access the App**:
Open your browser and go to http://127.0.0.1:5000/.

The app will load, allowing you to start drawing.

### 5. **Use the App**:
- **Draw**: Click and drag the mouse to draw.

- **Erase**: Click on the "Erase" button in the toolbar to toggle erase mode. Click and drag to erase strokes.

- **Undo**: Click the "Undo" button or press CTRL+Z to undo the last action.

- **Redo**: Click the "Redo" button or press CTRL+Y to redo the last undone action.

- **Save Locally**: Click the "Save Locally" button to download your drawing as an SVG file.

- **Save to Server**: Click the "Save to Server" button to upload the drawing to the server for storage.
