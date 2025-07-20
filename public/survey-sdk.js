/**
 * Survey Feedback SDK
 * Embedded JavaScript library for collecting and sending survey data
 * to the feedback dashboard application
 */

class SurveySDK {
  constructor(config = {}) {
    this.apiBaseUrl = config.apiBaseUrl || 'http://localhost:5000/api';
    this.debug = config.debug || false;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
    
    this.log('Survey SDK initialized', { apiBaseUrl: this.apiBaseUrl });
  }

  /**
   * Send survey data to the dashboard
   * @param {Object} surveyData - The survey data to send
   * @returns {Promise} Response from the API
   */
  async sendSurveyData(surveyData) {
    const endpoint = `${this.apiBaseUrl}/external/surveys`;
    
    // Add metadata
    const payload = {
      ...surveyData,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer
    };

    this.log('Sending survey data', payload);

    try {
      const response = await this.makeRequest(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      this.log('Survey data sent successfully', response);
      return response;
    } catch (error) {
      this.log('Error sending survey data', error);
      throw error;
    }
  }

  /**
   * Check if the dashboard API is available
   * @returns {Promise<boolean>} API health status
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/health`);
      const data = await response.json();
      this.log('Health check result', data);
      return response.ok;
    } catch (error) {
      this.log('Health check failed', error);
      return false;
    }
  }

  /**
   * Make HTTP request with retry logic
   * @param {string} url - Request URL
   * @param {Object} options - Fetch options
   * @returns {Promise} Response data
   */
  async makeRequest(url, options) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        lastError = error;
        this.log(`Request attempt ${attempt} failed`, error);
        
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Utility function for delays
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Debug logging
   * @param {string} message - Log message
   * @param {*} data - Additional data to log
   */
  log(message, data = null) {
    if (this.debug) {
      console.log(`[SurveySDK] ${message}`, data);
    }
  }

  /**
   * Create a simple survey widget
   * @param {Object} config - Widget configuration
   */
  createWidget(config = {}) {
    const widget = {
      containerId: config.containerId || 'survey-widget',
      questions: config.questions || [],
      title: config.title || 'Quick Survey',
      onSubmit: config.onSubmit || this.sendSurveyData.bind(this)
    };

    this.renderWidget(widget);
    return widget;
  }

  /**
   * Render survey widget HTML
   * @param {Object} widget - Widget configuration
   */
  renderWidget(widget) {
    const container = document.getElementById(widget.containerId);
    if (!container) {
      console.error(`Container with ID '${widget.containerId}' not found`);
      return;
    }

    const html = `
      <div class="survey-widget" style="
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 20px;
        background: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        max-width: 400px;
        margin: 20px auto;
      ">
        <h3 style="margin-top: 0; color: #333;">${widget.title}</h3>
        <form id="survey-form">
          ${widget.questions.map((q, i) => `
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">${q.text}</label>
              ${this.renderQuestion(q, i)}
            </div>
          `).join('')}
          <button type="submit" style="
            background: #007cba;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
          ">Submit Survey</button>
        </form>
      </div>
    `;

    container.innerHTML = html;

    // Add form submission handler
    document.getElementById('survey-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmit(widget);
    });
  }

  /**
   * Render individual question based on type
   * @param {Object} question - Question configuration
   * @param {number} index - Question index
   */
  renderQuestion(question, index) {
    switch (question.type) {
      case 'rating':
        return `
          <div>
            ${[1,2,3,4,5].map(rating => `
              <label style="margin-right: 10px;">
                <input type="radio" name="q${index}" value="${rating}" required>
                ${rating}
              </label>
            `).join('')}
          </div>
        `;
      case 'text':
        return `<input type="text" name="q${index}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" required>`;
      case 'textarea':
        return `<textarea name="q${index}" rows="3" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" required></textarea>`;
      case 'select':
        return `
          <select name="q${index}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" required>
            <option value="">Please select...</option>
            ${question.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
          </select>
        `;
      default:
        return `<input type="text" name="q${index}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">`;
    }
  }

  /**
   * Handle form submission
   * @param {Object} widget - Widget configuration
   */
  async handleFormSubmit(widget) {
    const form = document.getElementById('survey-form');
    const formData = new FormData(form);
    
    const responses = widget.questions.map((question, index) => ({
      question: question.text,
      type: question.type,
      answer: formData.get(`q${index}`)
    }));

    const surveyData = {
      title: widget.title,
      responses: responses,
      completedAt: new Date().toISOString()
    };

    try {
      await widget.onSubmit(surveyData);
      
      // Show success message
      form.innerHTML = `
        <div style="text-align: center; color: #28a745; font-weight: bold;">
          ✓ Thank you for your feedback!
        </div>
      `;
    } catch (error) {
      // Show error message
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = 'color: #dc3545; margin-top: 10px; font-weight: bold;';
      errorDiv.textContent = 'Error submitting survey. Please try again.';
      form.appendChild(errorDiv);
    }
  }
}

// Global initialization function
window.initSurveySDK = function(config = {}) {
  return new SurveySDK(config);
};

// Auto-initialize if configuration is provided
if (window.SURVEY_SDK_CONFIG) {
  window.surveySDK = new SurveySDK(window.SURVEY_SDK_CONFIG);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SurveySDK;
}