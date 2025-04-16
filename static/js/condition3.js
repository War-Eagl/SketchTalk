/**
 * TalkSketch Condition 3: Voice-Assisted AI Sketching
 * This condition allows participants to speak while drawing 
 * and get AI help for sketch improvement
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize components
  const drawingTool = new DrawingTool('canvas-container');
  const gallery = new SketchGallery('gallery-container');
  const sessionManager = new SessionManager();
  
  let audioRecorder = null;
  let audioUploader = null;
  
  // Start a new session when the page loads
  startExperiment();
  
  // Set up toolbar buttons
  document.getElementById('clear-button').addEventListener('click', () => {
    drawingTool.clear();
    showStatusMessage('Canvas cleared');
  });
  
  document.getElementById('eraser-button').addEventListener('click', function() {
    const isActive = this.classList.toggle('active');
    drawingTool.toggleEraser(isActive);
    showStatusMessage(isActive ? 'Eraser activated' : 'Eraser deactivated');
  });
  
  document.getElementById('undo-button').addEventListener('click', () => {
    drawingTool.undo();
    showStatusMessage('Undo');
  });
  
  document.getElementById('redo-button').addEventListener('click', () => {
    drawingTool.redo();
    showStatusMessage('Redo');
  });
  
  document.getElementById('save-local-button').addEventListener('click', () => {
    drawingTool.saveLocally();
    showStatusMessage('Drawing saved locally');
  });
  
  document.getElementById('save-server-button').addEventListener('click', async () => {
    try {
      showStatusMessage('Saving to server...');
      const svgData = drawingTool.getSVGData();
      
      // Save to server
      await sessionManager.saveSketch(svgData);
      
      // Add to gallery
      gallery.addSketch(svgData);
      
      showStatusMessage('Drawing saved to server');
    } catch (error) {
      console.error('Error saving drawing:', error);
      showStatusMessage('Error saving drawing', true);
    }
  });
  
  document.getElementById('record-button').addEventListener('click', async function() {
    const isRecording = this.classList.contains('recording');
    
    if (isRecording) {
      // Stop recording
      if (audioRecorder) {
        audioRecorder.stop();
        this.classList.remove('recording');
        this.textContent = 'Start Recording';
        showStatusMessage('Recording stopped');
      }
    } else {
      // Start recording
      if (!audioRecorder) {
        await initializeAudioRecording();
      }
      
      if (audioRecorder) {
        const success = audioRecorder.start();
        if (success) {
          this.classList.add('recording');
          this.textContent = 'Stop Recording';
          showStatusMessage('Recording started');
        } else {
          showStatusMessage('Failed to start recording', true);
        }
      }
    }
  });
  
  document.getElementById('ai-help-button').addEventListener('click', () => {
    showStatusMessage('AI help is a placeholder for now');
    
    // Get the current drawing and show a placeholder message
    const svgData = drawingTool.getSVGData();
    
    // Simple placeholder behavior - just show a message that AI would improve this
    const aiHelpModal = document.createElement('div');
    aiHelpModal.className = 'ai-help-modal';
    aiHelpModal.innerHTML = `
      <div class="ai-help-content">
        <h3>AI Sketch Help</h3>
        <p>In the actual implementation, this would send your sketch and voice recording to an AI for improvement suggestions.</p>
        <button id="close-ai-help">Close</button>
      </div>
    `;
    
    document.body.appendChild(aiHelpModal);
    
    // Add close button handler
    document.getElementById('close-ai-help').addEventListener('click', () => {
      document.body.removeChild(aiHelpModal);
    });
  });
  
  document.getElementById('end-session-button').addEventListener('click', async () => {
    try {
      // Stop recording if active
      if (audioRecorder && audioRecorder.isActive()) {
        audioRecorder.stop();
        const recordButton = document.getElementById('record-button');
        recordButton.classList.remove('recording');
        recordButton.textContent = 'Start Recording';
      }
      
      showStatusMessage('Ending session...');
      await sessionManager.endSession();
      showStatusMessage('Session ended');
      
      // Dispose audio recorder
      if (audioRecorder) {
        audioRecorder.dispose();
        audioRecorder = null;
      }
      
      // Redirect to landing page
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error) {
      console.error('Error ending session:', error);
      showStatusMessage('Error ending session', true);
    }
  });
  
  // Helper functions
  async function startExperiment() {
    try {
      showStatusMessage('Starting session...');
      await sessionManager.startSession(3); // Condition 3
      showStatusMessage('Session started');
      
      // Initialize audio components
      await initializeAudioRecording();
    } catch (error) {
      console.error('Error starting session:', error);
      showStatusMessage('Error starting session', true);
    }
  }
  
  async function initializeAudioRecording() {
    try {
      // Create audio recorder
      audioRecorder = new AudioRecorder({
        chunkDuration: 10000, // 10 seconds per chunk
        onStart: () => {
          console.log('Recording started');
        },
        onStop: () => {
          console.log('Recording stopped');
        },
        onError: (error) => {
          console.error('Recording error:', error);
          showStatusMessage('Recording error: ' + error.message, true);
        },
        onDataAvailable: (data, chunkNumber) => {
          if (audioUploader) {
            audioUploader.queueChunk(data, chunkNumber);
          }
        }
      });
      
      // Create audio uploader
      audioUploader = new AudioUploader(sessionManager.getSessionId());
      
      // Initialize recorder
      const initialized = await audioRecorder.init();
      
      if (!initialized) {
        showStatusMessage('Could not initialize audio recording. Please check microphone permissions.', true);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing audio recording:', error);
      showStatusMessage('Error initializing audio: ' + error.message, true);
      return false;
    }
  }
  
  function showStatusMessage(message, isError = false) {
    const statusEl = document.getElementById('status-message');
    statusEl.textContent = message;
    statusEl.className = 'status-indicator show';
    
    if (isError) {
      statusEl.classList.add('error');
    } else {
      statusEl.classList.remove('error');
    }
    
    // Hide after 3 seconds
    setTimeout(() => {
      statusEl.classList.remove('show');
    }, 3000);
  }
});
