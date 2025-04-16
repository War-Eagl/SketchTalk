/**
 * TalkSketch Condition 2: AI-Inspired Sketching
 * This condition gives participants inspiration from AI-generated images
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize components
  const drawingTool = new DrawingTool('canvas-container');
  const gallery = new SketchGallery('gallery-container');
  const sessionManager = new SessionManager();
  
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
  
  document.getElementById('ai-generate-button').addEventListener('click', () => {
    const promptInput = document.getElementById('ai-prompt-input');
    const prompt = promptInput.value.trim();
    
    if (prompt) {
      showStatusMessage('AI image generation is a placeholder for now');
      
      // Display placeholder message in the image container
      const aiImageContainer = document.getElementById('ai-image-container');
      aiImageContainer.innerHTML = `<div class="placeholder-text">Image would be generated for: "${prompt}"</div>`;
      
      // Clear the input
      promptInput.value = '';
    } else {
      showStatusMessage('Please enter a prompt for the AI', true);
    }
  });
  
  document.getElementById('end-session-button').addEventListener('click', async () => {
    try {
      showStatusMessage('Ending session...');
      await sessionManager.endSession();
      showStatusMessage('Session ended');
      
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
      await sessionManager.startSession(2); // Condition 2
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
});
