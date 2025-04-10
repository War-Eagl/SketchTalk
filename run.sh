#!/bin/bash

# Start the backend server
cd backend
python app.py &
BACKEND_PID=$!

# Start the frontend server
cd ../frontend
npm start &
FRONTEND_PID=$!

echo "Starting TalkSketch..."
echo "Backend server will be available at http://localhost:5000"
echo "Frontend will be available at http://localhost:3000"
echo "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait 