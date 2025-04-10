# Start the Flask server (serves both frontend and backend)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python app.py"

Write-Host "Starting TalkSketch..."
Write-Host "Application will be available at http://localhost:5000"
Write-Host "Press Ctrl+C in the window to stop the server" 