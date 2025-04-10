# Start the backend server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python app.py"

# Start the frontend server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm start"

Write-Host "Starting TalkSketch..."
Write-Host "Backend server will be available at http://localhost:5000"
Write-Host "Frontend will be available at http://localhost:3000"
Write-Host "Press Ctrl+C in each window to stop the servers" 