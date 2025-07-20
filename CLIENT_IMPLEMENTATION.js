/**
 * CLIENT_IMPLEMENTATION.js
 * 
 * This file contains client-side implementation examples for handling the specific MongoDB schema
 * provided by the user. It includes form validation, data processing, and API interactions.
 * 
 * Data structure example:
 * {
 *   "recommendationRating": "3",
 *   "satisfactionRating": "2",
 *   "experience": "cdcdcdc",
 *   "contactPermission": "No, I don't want to be contacted by DHL.",
 *   "furtherInfoPermission": "No, I don't want to be contacted by DHL.",
 *   "fullName": "dcsc",
 *   "phone": "dcdscvsdc",
 *   "email": "njnlknlk@gmail.com"
 * }
 */

// Form validation functions

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates phone number format (basic validation)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - Whether phone is valid
 */
const isValidPhone = (phone) => {
  // Basic validation - at least 6 digits
  return /\d{6,}/.test(phone.replace(/[\s()-]/g, ''));
};

/**
 * Validates recommendation rating (0-10)
 * @param {string|number} rating - Rating to validate
 * @returns {boolean} - Whether rating is valid
 */
const isValidRecommendationRating = (rating) => {
  const numRating = parseInt(rating);
  return !isNaN(numRating) && numRating >= 0 && numRating <= 10;
};

/**
 * Validates satisfaction rating (1-5)
 * @param {string|number} rating - Rating to validate
 * @returns {boolean} - Whether rating is valid
 */
const isValidSatisfactionRating = (rating) => {
  const numRating = parseInt(rating);
  return !isNaN(numRating) && numRating >= 1 && numRating <= 5;
};

/**
 * Validates the entire survey form
 * @param {Object} formData - Form data to validate
 * @returns {Object} - Validation result with errors
 */
const validateSurveyForm = (formData) => {
  const errors = {};
  
  // Validate email if provided
  if (formData.email && !isValidEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  // Validate phone if provided
  if (formData.phone && !isValidPhone(formData.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }
  
  // Validate recommendation rating if provided
  if (formData.recommendationRating !== undefined && 
      !isValidRecommendationRating(formData.recommendationRating)) {
    errors.recommendationRating = 'Please select a rating between 0 and 10';
  }
  
  // Validate satisfaction rating if provided
  if (formData.satisfactionRating !== undefined && 
      !isValidSatisfactionRating(formData.satisfactionRating)) {
    errors.satisfactionRating = 'Please select a rating between 1 and 5';
  }
  
  // Validate text length for experience
  if (formData.experience && formData.experience.length > 1000) {
    errors.experience = 'Your feedback is too long. Please limit to 1000 characters.';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Form data processing

/**
 * Processes form data before submission
 * @param {Object} formData - Raw form data
 * @returns {Object} - Processed form data
 */
const processFormData = (formData) => {
  // Create a copy to avoid modifying the original
  const processed = { ...formData };
  
  // Trim text fields
  Object.keys(processed).forEach(key => {
    if (typeof processed[key] === 'string') {
      processed[key] = processed[key].trim();
    }
  });
  
  // Ensure ratings are strings (to match the expected format)
  if (processed.recommendationRating !== undefined) {
    processed.recommendationRating = processed.recommendationRating.toString();
  }
  
  if (processed.satisfactionRating !== undefined) {
    processed.satisfactionRating = processed.satisfactionRating.toString();
  }
  
  // Convert email to lowercase
  if (processed.email) {
    processed.email = processed.email.toLowerCase();
  }
  
  return processed;
};

// API interaction functions

/**
 * Submits survey data to the API
 * @param {Object} surveyData - Survey data to submit
 * @returns {Promise<Object>} - API response
 */
const submitSurvey = async (surveyData) => {
  try {
    // Validate form data
    const validation = validateSurveyForm(surveyData);
    if (!validation.isValid) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      };
    }
    
    // Process form data
    const processedData = processFormData(surveyData);
    
    // Submit to API
    const response = await fetch('/api/external/surveys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(processedData)
    });
    
    // Parse response
    const result = await response.json();
    
    // Check for success
    if (!response.ok) {
      return {
        success: false,
        message: result.message || 'Failed to submit survey',
        errors: result.errors || {}
      };
    }
    
    return {
      success: true,
      message: 'Survey submitted successfully',
      surveyId: result.surveyId
    };
  } catch (error) {
    console.error('Error submitting survey:', error);
    return {
      success: false,
      message: 'An error occurred while submitting the survey'
    };
  }
};

// React component examples

/**
 * Example React component for a survey form
 * This is a simplified example - in a real app, you would use proper React state management
 */
const SurveyForm = () => {
  // State for form data
  const [formData, setFormData] = React.useState({
    fullName: '',
    email: '',
    phone: '',
    recommendationRating: '',
    satisfactionRating: '',
    experience: '',
    contactPermission: 'No, I don\'t want to be contacted by DHL.',
    furtherInfoPermission: 'No, I don\'t want to be contacted by DHL.'
  });
  
  // State for validation errors
  const [errors, setErrors] = React.useState({});
  
  // State for submission status
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [submitError, setSubmitError] = React.useState(null);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle different input types
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked ? 'Yes, I want to be contacted by DHL.' : 'No, I don\'t want to be contacted by DHL.'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateSurveyForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    // Submit form
    setSubmitting(true);
    setSubmitError(null);
    
    try {
      const result = await submitSurvey(formData);
      
      if (result.success) {
        setSubmitted(true);
        // Reset form on success
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          recommendationRating: '',
          satisfactionRating: '',
          experience: '',
          contactPermission: 'No, I don\'t want to be contacted by DHL.',
          furtherInfoPermission: 'No, I don\'t want to be contacted by DHL.'
        });
      } else {
        setErrors(result.errors || {});
        setSubmitError(result.message);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Render thank you message if submitted
  if (submitted) {
    return (
      <div className="survey-success">
        <h2>Thank You!</h2>
        <p>Your feedback has been submitted successfully.</p>
        <button onClick={() => setSubmitted(false)}>Submit Another Response</button>
      </div>
    );
  }
  
  // Render form
  return (
    <form className="survey-form" onSubmit={handleSubmit}>
      {submitError && (
        <div className="error-message">{submitError}</div>
      )}
      
      <div className="form-group">
        <label htmlFor="fullName">Full Name</label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="email">Email Address</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
        />
        {errors.email && <div className="field-error">{errors.email}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="phone">Phone Number</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
        />
        {errors.phone && <div className="field-error">{errors.phone}</div>}
      </div>
      
      <div className="form-group">
        <label>How satisfied are you with our service? (1-5)</label>
        <div className="rating-buttons">
          {[1, 2, 3, 4, 5].map(rating => (
            <button
              key={rating}
              type="button"
              className={formData.satisfactionRating === rating.toString() ? 'selected' : ''}
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  satisfactionRating: rating.toString()
                }));
                
                // Clear error
                if (errors.satisfactionRating) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.satisfactionRating;
                    return newErrors;
                  });
                }
              }}
            >
              {rating}
            </button>
          ))}
        </div>
        {errors.satisfactionRating && <div className="field-error">{errors.satisfactionRating}</div>}
      </div>
      
      <div className="form-group">
        <label>How likely are you to recommend us? (0-10)</label>
        <div className="rating-buttons">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => (
            <button
              key={rating}
              type="button"
              className={formData.recommendationRating === rating.toString() ? 'selected' : ''}
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  recommendationRating: rating.toString()
                }));
                
                // Clear error
                if (errors.recommendationRating) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.recommendationRating;
                    return newErrors;
                  });
                }
              }}
            >
              {rating}
            </button>
          ))}
        </div>
        {errors.recommendationRating && <div className="field-error">{errors.recommendationRating}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="experience">Please share your experience</label>
        <textarea
          id="experience"
          name="experience"
          value={formData.experience}
          onChange={handleChange}
          rows={4}
        />
        {errors.experience && <div className="field-error">{errors.experience}</div>}
      </div>
      
      <div className="form-group checkbox">
        <input
          type="checkbox"
          id="contactPermission"
          name="contactPermission"
          checked={formData.contactPermission.toLowerCase().includes('yes')}
          onChange={handleChange}
        />
        <label htmlFor="contactPermission">I want to be contacted by DHL</label>
      </div>
      
      <div className="form-group checkbox">
        <input
          type="checkbox"
          id="furtherInfoPermission"
          name="furtherInfoPermission"
          checked={formData.furtherInfoPermission.toLowerCase().includes('yes')}
          onChange={handleChange}
        />
        <label htmlFor="furtherInfoPermission">I want to receive further information from DHL</label>
      </div>
      
      <button type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </form>
  );
};

// Dashboard data processing functions

/**
 * Processes survey data for dashboard display
 * @param {Array} surveys - Survey data from API
 * @returns {Object} - Processed data for charts
 */
const processDashboardData = (surveys) => {
  // Initialize counters
  const satisfactionCounts = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
  const recommendationCounts = {};
  for (let i = 0; i <= 10; i++) {
    recommendationCounts[i.toString()] = 0;
  }
  
  let contactPermissionYes = 0;
  let contactPermissionNo = 0;
  
  // Process each survey
  surveys.forEach(survey => {
    // Count satisfaction ratings
    if (survey.satisfactionRating && satisfactionCounts[survey.satisfactionRating] !== undefined) {
      satisfactionCounts[survey.satisfactionRating]++;
    }
    
    // Count recommendation ratings
    if (survey.recommendationRating && recommendationCounts[survey.recommendationRating] !== undefined) {
      recommendationCounts[survey.recommendationRating]++;
    }
    
    // Count contact permissions
    if (survey.contactPermission) {
      if (survey.contactPermission.toLowerCase().includes('yes')) {
        contactPermissionYes++;
      } else {
        contactPermissionNo++;
      }
    }
  });
  
  // Calculate NPS
  const promoters = Object.entries(recommendationCounts)
    .filter(([rating]) => parseInt(rating) >= 9)
    .reduce((sum, [_, count]) => sum + count, 0);
    
  const detractors = Object.entries(recommendationCounts)
    .filter(([rating]) => parseInt(rating) <= 6)
    .reduce((sum, [_, count]) => sum + count, 0);
    
  const total = surveys.filter(s => s.recommendationRating).length;
  const npsScore = total > 0 ? Math.round((promoters - detractors) / total * 100) : 0;
  
  // Format data for charts
  const satisfactionChartData = {
    labels: ['1', '2', '3', '4', '5'],
    datasets: [{
      label: 'Satisfaction Rating',
      data: Object.values(satisfactionCounts),
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }]
  };
  
  const recommendationChartData = {
    labels: Object.keys(recommendationCounts),
    datasets: [{
      label: 'Recommendation Rating',
      data: Object.values(recommendationCounts),
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 1
    }]
  };
  
  const contactPermissionChartData = {
    labels: ['Yes', 'No'],
    datasets: [{
      label: 'Contact Permission',
      data: [contactPermissionYes, contactPermissionNo],
      backgroundColor: ['rgba(75, 192, 192, 0.5)', 'rgba(255, 159, 64, 0.5)'],
      borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 159, 64, 1)'],
      borderWidth: 1
    }]
  };
  
  return {
    satisfactionChartData,
    recommendationChartData,
    contactPermissionChartData,
    npsScore,
    totalSurveys: surveys.length
  };
};

// Export functions for use in other files
if (typeof module !== 'undefined') {
  module.exports = {
    validateSurveyForm,
    processFormData,
    submitSurvey,
    processDashboardData
  };
}