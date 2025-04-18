/**
 * TalkSketch Recording Module
 * Handles audio recording and sending to server
 */

class AudioRecorder {
  constructor(options = {}) {
    this.options = Object.assign({
      mimeType: 'audio/webm',
      audioBitsPerSecond: 128000,
      chunkDuration: 10000, // 10 seconds per chunk
      onStart: null,
      onStop: null,
      onError: null,
      onDataAvailable: null
    }, options);
    
    this.mediaRecorder = null;
    this.audioStream = null;
    this.isRecording = false;
    this.recordedChunks = [];
    this.chunkNumber = 0;
    this.chunkInterval = null;
  }
  
  /**
   * Initialize recorder and request microphone access
   */
  async init() {
    try {
      this.audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: false
      });
      
      // Check for supported mime types
      const mimeType = this._getSupportedMimeType();
      
      // Create MediaRecorder instance
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: mimeType,
        audioBitsPerSecond: this.options.audioBitsPerSecond
      });
      
      // Set up event handlers
      this.mediaRecorder.ondataavailable = this._handleDataAvailable.bind(this);
      this.mediaRecorder.onerror = this._handleError.bind(this);
      
      return true;
    } catch (error) {
      console.error('Error initializing audio recorder:', error);
      if (this.options.onError) {
        this.options.onError(error);
      }
      return false;
    }
  }
  
  /**
   * Find supported mime type for audio recording
   */
  _getSupportedMimeType() {
    const types = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/mp4'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    
    return '';
  }
  
  /**
   * Start recording
   */
  start() {
    if (!this.mediaRecorder || this.isRecording) return false;
    
    this.isRecording = true;
    this.recordedChunks = [];
    this.chunkNumber = 0;
    
    try {
      this.mediaRecorder.start();
      
      // Set up interval to request data chunks
      this.chunkInterval = setInterval(() => {
        if (this.isRecording) {
          this.mediaRecorder.requestData();
        }
      }, this.options.chunkDuration);
      
      if (this.options.onStart) {
        this.options.onStart();
      }
      
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      this.isRecording = false;
      
      if (this.options.onError) {
        this.options.onError(error);
      }
      
      return false;
    }
  }
  
  /**
   * Stop recording
   */
  stop() {
    if (!this.mediaRecorder || !this.isRecording) return false;
    
    try {
      // Clear chunk interval
      if (this.chunkInterval) {
        clearInterval(this.chunkInterval);
        this.chunkInterval = null;
      }
      
      // Stop media recorder
      this.mediaRecorder.stop();
      this.isRecording = false;
      
      // Stop all audio tracks
      if (this.audioStream) {
        this.audioStream.getTracks().forEach(track => track.stop());
      }
      
      if (this.options.onStop) {
        this.options.onStop(this.recordedChunks);
      }
      
      return true;
    } catch (error) {
      console.error('Error stopping recording:', error);
      
      if (this.options.onError) {
        this.options.onError(error);
      }
      
      return false;
    }
  }
  
  /**
   * Handle data available from media recorder
   */
  _handleDataAvailable(event) {
    if (event.data && event.data.size > 0) {
      this.recordedChunks.push(event.data);
      
      if (this.options.onDataAvailable) {
        this.options.onDataAvailable(event.data, this.chunkNumber++);
      }
    }
  }
  
  /**
   * Handle errors from media recorder
   */
  _handleError(event) {
    console.error('MediaRecorder error:', event.error);
    
    if (this.options.onError) {
      this.options.onError(event.error);
    }
  }
  
  /**
   * Get recording state
   */
  isActive() {
    return this.isRecording;
  }
  
  /**
   * Release resources
   */
  dispose() {
    this.stop();
    
    this.mediaRecorder = null;
    this.audioStream = null;
    this.recordedChunks = [];
  }
}

/**
 * Upload utility for sending audio chunks to server
 */
class AudioUploader {
  constructor(sessionId, endpoint = '/save_audio_chunk') {
    this.sessionId = sessionId;
    this.endpoint = endpoint;
    this.uploadQueue = [];
    this.isUploading = false;
  }
  
  /**
   * Queue an audio chunk for upload
   */
  queueChunk(audioBlob, chunkNumber) {
    this.uploadQueue.push({ blob: audioBlob, chunkNumber });
    this._processQueue();
  }
  
  /**
   * Process the upload queue
   */
  async _processQueue() {
    if (this.isUploading || this.uploadQueue.length === 0) return;
    
    this.isUploading = true;
    
    try {
      const item = this.uploadQueue.shift();
      await this._uploadChunk(item.blob, item.chunkNumber);
    } catch (error) {
      console.error('Error uploading audio chunk:', error);
    } finally {
      this.isUploading = false;
      
      // Process next item if queue not empty
      if (this.uploadQueue.length > 0) {
        this._processQueue();
      }
    }
  }
  
  /**
   * Upload a single audio chunk to the server
   */
  async _uploadChunk(audioBlob, chunkNumber) {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('session_id', this.sessionId);
    formData.append('chunk_number', chunkNumber);
    
    const response = await fetch(this.endpoint, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Upload failed: ${errorData.error || response.statusText}`);
    }
    
    return response.json();
  }
  
  /**
   * Update session ID
   */
  updateSessionId(sessionId) {
    this.sessionId = sessionId;
  }
}
