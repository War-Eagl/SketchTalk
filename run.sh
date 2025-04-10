#!/bin/bash

# Start the Flask server (serves both frontend and backend)
cd backend
python app.py &
SERVER_PID=$!

echo "Starting TalkSketch..."
echo "Application will be available at http://localhost:5000"
echo "Press Ctrl+C to stop the server"

# Wait for Ctrl+C
trap "kill $SERVER_PID" EXIT
wait 