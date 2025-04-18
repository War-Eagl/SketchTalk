/**
 * TalkSketch Session Module
 * Manages experiment sessions and data saving
 */

class SessionManager {
  constructor() {
    this.sessionId = null;
    this.isSessionActive = false;
    this.startTime = null;
    this.conditionNumber = null;
  }
  
  /**
   * Start a new session
   */
  async startSession(conditionNumber) {
    if (this.isSessionActive) {
      console.warn('Session already active, ending current session first');
      await this.endSession();
    }
    
    try {
      const response = await fetch('/start_session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ condition: conditionNumber })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to start session: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.sessionId = data.session_id;
      this.conditionNumber = conditionNumber;
      this.isSessionActive = true;
      this.startTime = new Date();
      
      console.log(`Session started: ${this.sessionId}`);
      return this.sessionId;
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  }
  
  /**
   * End the current session
   */
  async endSession() {
    if (!this.isSessionActive) {
      console.warn('No active session to end');
      return false;
    }
    
    try {
      const response = await fetch('/end_session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ session_id: this.sessionId })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to end session: ${response.statusText}`);
      }
      
      console.log(`Session ended: ${this.sessionId}`);
      
      this.isSessionActive = false;
      this.sessionId = null;
      this.startTime = null;
      
      return true;
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }
  
  /**
   * Save sketch to server
   */
  async saveSketch(svgData, index = Date.now()) {
    if (!this.isSessionActive) {
      console.warn('No active session for saving sketch');
      return false;
    }
    
    try {
      const response = await fetch('/save_sketch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: this.sessionId,
          svg_data: svgData,
          sketch_index: index
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save sketch: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Sketch saved: ${data.filename}`);
      
      return data;
    } catch (error) {
      console.error('Error saving sketch:', error);
      throw error;
    }
  }
  
  /**
   * Check if a session is currently active
   */
  isActive() {
    return this.isSessionActive;
  }
  
  /**
   * Get current session ID
   */
  getSessionId() {
    return this.sessionId;
  }
  
  /**
   * Get session duration in seconds
   */
  getSessionDuration() {
    if (!this.isSessionActive || !this.startTime) return 0;
    
    const now = new Date();
    return Math.floor((now - this.startTime) / 1000);
  }
  
  /**
   * Get experiment condition number
   */
  getCondition() {
    return this.conditionNumber;
  }
}
