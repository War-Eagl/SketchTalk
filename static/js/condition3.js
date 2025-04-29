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
  
  // Expose globally for popup integration
  window.drawingTool = drawingTool;
  
  let audioRecorder = null;
  let audioUploader = null;
  
  // Start a new session when the page loads
  startExperiment();
  
  // Set up toolbar buttons
  document.getElementById('clear-button').addEventListener('click', () => {
    drawingTool.clear();
    showStatusMessage('Canvas cleared');
  });
  
  // Set up draw button
  document.getElementById('draw-button').addEventListener('click', function() {
    // Deactivate eraser if it's active
    const eraserButton = document.getElementById('eraser-button');
    if (eraserButton.classList.contains('active')) {
      eraserButton.classList.remove('active');
    }
    this.classList.add('active');
    drawingTool.toggleEraser(false);
    showStatusMessage('Draw mode activated');
  });

  // Long-press support for touch devices on draw button
  const drawBtn = document.getElementById('draw-button');
  if (drawBtn) {
    drawBtn.style.position = 'relative';
    let longPressTimer = null;
    const longPressDuration = 600;
    const tooltip = document.createElement('div');
    tooltip.textContent = 'Hold for more options';
    Object.assign(tooltip.style, {
      position: 'absolute', top: '-28px', left: '50%', transform: 'translateX(-50%)',
      background: '#333', color: '#fff', padding: '4px 8px', borderRadius: '4px',
      fontSize: '12px', whiteSpace: 'nowrap', pointerEvents: 'none', opacity: '0', transition: 'opacity 0.3s'
    });
    drawBtn.appendChild(tooltip);

    drawBtn.addEventListener('touchstart', () => {
      longPressTimer = setTimeout(() => {
        if (window.showLineWidthPopup) {
          window.showLineWidthPopup(window.drawingTool.config.stroke.width, newWidth => {
            window.drawingTool.config.stroke.width = newWidth;
            if (window.showStatusMessage) window.showStatusMessage('Line width set to ' + newWidth);
          });
        }
      }, longPressDuration);
    });
    drawBtn.addEventListener('touchend', () => clearTimeout(longPressTimer));
    drawBtn.addEventListener('touchmove', () => clearTimeout(longPressTimer));
    drawBtn.addEventListener('pointermove', () => clearTimeout(longPressTimer));

    // Hover tooltip for desktop and non-touch devices
    const hoverTooltip = document.createElement('div');
    hoverTooltip.textContent = 'Hold for more options';
    Object.assign(hoverTooltip.style, {
      position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)',
      background: '#333', color: '#fff', padding: '4px 8px', borderRadius: '4px',
      fontSize: '12px', whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: '10000', display: 'none'
    });
    drawBtn.appendChild(hoverTooltip);
    drawBtn.addEventListener('mouseenter', () => hoverTooltip.style.display = 'block');
    drawBtn.addEventListener('mouseleave', () => hoverTooltip.style.display = 'none');
  }

  document.getElementById('eraser-button').addEventListener('click', function() {
    const drawButton = document.getElementById('draw-button');
    if (drawButton.classList.contains('active')) {
      drawButton.classList.remove('active');
    }
    const isActive = this.classList.toggle('active');
    drawingTool.toggleEraser(isActive);
    showStatusMessage(isActive ? 'Eraser activated' : 'Draw mode activated');
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
  
  // Replace end-session-button handler with Top 3 modal flow
  const endSessionButton = document.getElementById('end-session-button');
  if (endSessionButton) {
    endSessionButton.addEventListener('click', () => {
      // Stop recording if active
      if (audioRecorder && audioRecorder.isActive()) {
        audioRecorder.stop();
        const recordButton = document.getElementById('record-button');
        recordButton.classList.remove('recording');
      }
      showStatusMessage('Preparing Top 3 selection...');
      const modal = document.getElementById('top3-modal');
      const container = document.getElementById('top3-image-container');
      container.innerHTML = '';
      const sketches = gallery.getSketches();
      sketches.forEach(svgData => {
        const div = document.createElement('div');
        div.className = 'modal-image-item';
        div.innerHTML = svgData;
        div.addEventListener('click', () => {
          if (div.classList.contains('selected')) {
            div.classList.remove('selected');
          } else if (container.querySelectorAll('.selected').length < 3) {
            div.classList.add('selected');
          }
        });
        container.appendChild(div);
      });
      modal.style.display = 'flex';
    });
  }

  const top3CancelBtn = document.getElementById('top3-cancel-button');
  const top3SubmitBtn = document.getElementById('top3-submit-button');
  if (top3CancelBtn && top3SubmitBtn) {
    top3CancelBtn.addEventListener('click', () => {
      document.getElementById('top3-modal').style.display = 'none';
    });
    top3SubmitBtn.addEventListener('click', async () => {
      const selected = document.querySelectorAll('#top3-image-container .modal-image-item.selected');
      if (selected.length !== 3) {
        showStatusMessage('Please select exactly 3 images', true);
        return;
      }
      const svgList = Array.from(selected).map(div => div.innerHTML);
      try {
        showStatusMessage('Saving top 3...');
        const resp = await fetch('/save_top3', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionManager.getSessionId(), svg_data_list: svgList })
        });
        if (!resp.ok) throw new Error(`Save top3 failed: ${resp.statusText}`);
        showStatusMessage('Top 3 saved');
      } catch (e) {
        console.error('Error saving top 3:', e);
        showStatusMessage('Error saving top 3', true);
      }
      document.getElementById('top3-modal').style.display = 'none';
      try {
        showStatusMessage('Ending session...');
        await sessionManager.endSession();
        showStatusMessage('Session ended');
        // Dispose audio recorder
        if (audioRecorder) {
          audioRecorder.dispose();
          audioRecorder = null;
        }
        setTimeout(() => { window.location.href = '/'; }, 1000);
      } catch (err) {
        console.error('Error ending session:', err);
        showStatusMessage('Error ending session', true);
      }
    });
  }
  
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
  
  // Expose status message globally for popup feedback
  window.showStatusMessage = showStatusMessage;
});
