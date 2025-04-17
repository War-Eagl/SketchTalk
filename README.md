# TalkSketch

An interactive web application that explores AI-enhanced sketching experiences.

## Features

- Three different sketching conditions:
  - Baseline Sketching: Traditional sketching without assistance
  - AI-Inspired Sketching: Get inspiration from AI-generated images
  - Voice-Assisted AI Sketching: Speak while drawing to get AI suggestions
- Real-time drawing with smooth bezier curves
- Gallery to save and view your sketches
- Undo/redo functionality
- Eraser tool
- Responsive design

## Tech Stack

- Backend: Python Flask
- Frontend: HTML, CSS, JavaScript
- Drawing Library: SVG.js
- Storage: File-based system (SVG files and audio recordings)

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install .
```

3. Run the application:
```bash
flask run
```

4. Open your browser and navigate to `http://localhost:5000`

## Project Structure

```
SketchTalk/
├── app.py              # Main Flask application
├── models.py           # Database models
├── static/
│   ├── css/
│   ├── js/
│   └── uploads/       # User uploaded files
├── templates/
│   ├── condition1.html
│   ├── condition2.html
│   ├── condition3.html
│   └── index.html
└── venv/              # Virtual environment (not committed)
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
