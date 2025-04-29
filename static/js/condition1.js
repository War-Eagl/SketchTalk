/**
 * TalkSketch Condition 1: Baseline Sketching
 * This condition lets participants use their own sketching skills
 */

document.addEventListener('DOMContentLoaded', () => {

  // Initialize components
  const drawingTool = new DrawingTool('canvas-container');
  const gallery = new SketchGallery('gallery-container');
  const sessionManager = new SessionManager();
  // Expose globally for popup integration
  window.drawingTool = drawingTool;
  // Try to attach showLineWidthPopup if loaded
  window.showLineWidthPopup = window.showLineWidthPopup || (typeof showLineWidthPopup !== 'undefined' ? showLineWidthPopup : undefined);
  
  // Start a new session when the page loads
  startExperiment();
  
  // Set up toolbar buttons
  const clearButton = document.getElementById('clear-button');
  if (clearButton) {
    clearButton.addEventListener('click', () => {
      drawingTool.clear();
      showStatusMessage('Canvas cleared');
    });
  }
  
  // Set up draw button
  const drawButton = document.getElementById('draw-button');
  if (drawButton) {
    drawButton.addEventListener('click', function() {
      // Deactivate eraser if it's active
      const eraserButton = document.getElementById('eraser-button');
      if (eraserButton && eraserButton.classList.contains('active')) {
        eraserButton.classList.remove('active');
      }
      this.classList.add('active');
      drawingTool.toggleEraser(false);
      showStatusMessage('Draw mode activated');
    });
    
    // Long-press support for touch devices (pointer events)
    let longPressTimer = null;
    const longPressDuration = 600;
    drawButton.style.position = 'relative';
    drawButton.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch') {
        longPressTimer = setTimeout(() => {
          if (window.showLineWidthPopup) {
            window.showLineWidthPopup(window.drawingTool.config.stroke.width, newWidth => {
              window.drawingTool.config.stroke.width = newWidth;
              if (window.showStatusMessage) window.showStatusMessage('Line width set to ' + newWidth);
            });
          }
        }, longPressDuration);
      }
    });
    ['pointerup','pointercancel','pointermove'].forEach(evt =>
      drawButton.addEventListener(evt, () => clearTimeout(longPressTimer))
    );

    // Hover tooltip for desktop and non-touch devices
    const hoverTooltip = document.createElement('div');
    hoverTooltip.textContent = 'Hold for more options';
    Object.assign(hoverTooltip.style, {
      position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)',
      background: '#333', color: '#fff', padding: '4px 8px', borderRadius: '4px',
      fontSize: '12px', whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: '10000', display: 'none'
    });
    drawButton.appendChild(hoverTooltip);
    drawButton.addEventListener('mouseenter', () => hoverTooltip.style.display = 'block');
    drawButton.addEventListener('mouseleave', () => hoverTooltip.style.display = 'none');
  }

  const eraserButton = document.getElementById('eraser-button');
  if (eraserButton) {
    eraserButton.addEventListener('click', function() {
      const drawButton = document.getElementById('draw-button');
      if (drawButton && drawButton.classList.contains('active')) {
        drawButton.classList.remove('active');
      }
      const isActive = this.classList.toggle('active');
      drawingTool.toggleEraser(isActive);
      showStatusMessage(isActive ? 'Eraser activated' : 'Draw mode activated');
    });
  }
  
  const undoButton = document.getElementById('undo-button');
  if (undoButton) {
    undoButton.addEventListener('click', () => {
      drawingTool.undo();
      showStatusMessage('Undo');
    });
  }
  
  const redoButton = document.getElementById('redo-button');
  if (redoButton) {
    redoButton.addEventListener('click', () => {
      drawingTool.redo();
      showStatusMessage('Redo');
    });
  }
  
  const saveLocalButton = document.getElementById('save-local-button');
  if (saveLocalButton) {
    saveLocalButton.addEventListener('click', () => {
      drawingTool.saveLocally();
      showStatusMessage('Drawing saved locally');
    });
  }
  
  const saveServerButton = document.getElementById('save-server-button');
  if (saveServerButton) {
    saveServerButton.addEventListener('click', async () => {
      try {
        // Check if session is active
        if (!sessionManager.isActive()) {
          showStatusMessage('No active session. Starting new session...', true);
          await sessionManager.startSession(1); // Condition 1
        }

        showStatusMessage('Saving to server...');
        const svgData = drawingTool.getSVGData();
        
        // Save to server
        const result = await sessionManager.saveSketch(svgData);
        
        if (result) {
          // Add to gallery only if save was successful
          gallery.addSketch(svgData);
          showStatusMessage('Drawing saved to server');
        } else {
          showStatusMessage('Failed to save drawing', true);
        }
      } catch (error) {
        console.error('Error saving drawing:', error);
        showStatusMessage('Error saving drawing: ' + error.message, true);

        // If session error, try to restart session
        if (error.message.includes('session')) {
          try {
            await sessionManager.startSession(1); // Condition 1
            showStatusMessage('Session restarted. Please try saving again.');
          } catch (sessionError) {
            showStatusMessage('Could not restart session', true);
          }
        }
      }
    });
  }

  const submitButton = document.getElementById('submit-button');
  if (submitButton) {
    submitButton.addEventListener('click', async () => {
      try {
        // Ensure session is active
        if (!sessionManager.isActive()) {
          showStatusMessage('No active session. Starting new session...', true);
          await sessionManager.startSession(1); // Condition 1
        }
        showStatusMessage('Submitting drawing...');
        const svgData = drawingTool.getSVGData();
        const result = await sessionManager.saveSketch(svgData);
        if (result) {
          gallery.addSketch(svgData);
          drawingTool.clear();
          showStatusMessage('Drawing submitted and canvas cleared');
        } else {
          showStatusMessage('Failed to submit drawing', true);
        }
      } catch (error) {
        console.error('Error submitting drawing:', error);
        showStatusMessage('Error submitting drawing: ' + error.message, true);
        if (error.message.includes('session')) {
          try {
            await sessionManager.startSession(1);
            showStatusMessage('Session restarted. Please try submitting again.');
          } catch (sessionError) {
            showStatusMessage('Could not restart session', true);
          }
        }
      }
    });
  }

  const endSessionButton = document.getElementById('end-session-button');
  if (endSessionButton) {
    endSessionButton.addEventListener('click', () => {
        // Show Top 3 selection modal
        const modal = document.getElementById('top3-modal');
        const container = document.getElementById('top3-image-container');
        container.innerHTML = '';
        const sketches = gallery.getSketches();
        sketches.forEach((svgData, idx) => {
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
        // End session after saving top 3
        try {
            showStatusMessage('Ending session...');
            await sessionManager.endSession();
            showStatusMessage('Session ended');
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
      await sessionManager.startSession(1); // Condition 1
      showStatusMessage('Session started');
    } catch (error) {
      console.error('Error starting session:', error);
      showStatusMessage('Error starting session', true);
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
