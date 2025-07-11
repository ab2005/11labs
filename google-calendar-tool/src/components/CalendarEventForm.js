import React, { useState } from 'react';
import { addDuration, formatToISO } from '../utils/dateUtils.js';
import { validateEventData } from '../utils/eventUtils.js';

const CalendarEventForm = ({ onSubmit, loading = false, initialData = null }) => {
  const [formData, setFormData] = useState({
    summary: initialData?.title || '',
    start_datetime: initialData?.start || '',
    end_datetime: initialData?.end || '',
    description: initialData?.description || '',
    location: initialData?.location || '',
    attendees: initialData?.attendees?.join(', ') || ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleStartTimeChange = (e) => {
    const startTime = e.target.value;
    setFormData(prev => ({
      ...prev,
      start_datetime: startTime,
      // Auto-set end time to 1 hour later if not set
      end_datetime: prev.end_datetime || addDuration(startTime, 60)
    }));
  };

  const validateForm = () => {
    const validation = validateEventData(formData);
    setErrors(validation.errors.reduce((acc, error) => {
      const field = error.includes('summary') ? 'summary' :
                   error.includes('start_datetime') ? 'start_datetime' :
                   error.includes('end_datetime') ? 'end_datetime' : 'general';
      acc[field] = error;
      return acc;
    }, {}));
    
    return validation.isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});
      
      await onSubmit(formData);
      
      // Reset form after successful submission
      setFormData({
        summary: '',
        start_datetime: '',
        end_datetime: '',
        description: '',
        location: '',
        attendees: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ general: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (preset) => {
    const now = new Date();
    let startTime, endTime;

    switch (preset) {
      case 'now':
        startTime = now;
        endTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour later
        break;
      case 'tomorrow':
        startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        startTime.setHours(9, 0, 0, 0); // 9 AM
        endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
        break;
      case 'next_week':
        startTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        startTime.setHours(9, 0, 0, 0); // 9 AM
        endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
        break;
      default:
        return;
    }

    setFormData(prev => ({
      ...prev,
      start_datetime: formatToISO(startTime).slice(0, 16), // Format for datetime-local input
      end_datetime: formatToISO(endTime).slice(0, 16)
    }));
  };

  return (
    <div className="event-form">
      <form onSubmit={handleSubmit}>
        {/* Quick Fill Buttons */}
        <div className="quick-fill">
          <label>Quick Fill:</label>
          <div className="quick-buttons">
            <button
              type="button"
              onClick={() => handleQuickFill('now')}
              className="quick-button"
            >
              Right Now
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('tomorrow')}
              className="quick-button"
            >
              Tomorrow 9 AM
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('next_week')}
              className="quick-button"
            >
              Next Week
            </button>
          </div>
        </div>

        {/* Event Title */}
        <div className="form-group">
          <label htmlFor="summary">Event Title *</label>
          <input
            type="text"
            id="summary"
            name="summary"
            value={formData.summary}
            onChange={handleInputChange}
            placeholder="Enter event title"
            required
            className={errors.summary ? 'error' : ''}
          />
          {errors.summary && <span className="error-message">{errors.summary}</span>}
        </div>

        {/* Start Time */}
        <div className="form-group">
          <label htmlFor="start_datetime">Start Time *</label>
          <input
            type="datetime-local"
            id="start_datetime"
            name="start_datetime"
            value={formData.start_datetime}
            onChange={handleStartTimeChange}
            required
            className={errors.start_datetime ? 'error' : ''}
          />
          {errors.start_datetime && <span className="error-message">{errors.start_datetime}</span>}
        </div>

        {/* End Time */}
        <div className="form-group">
          <label htmlFor="end_datetime">End Time *</label>
          <input
            type="datetime-local"
            id="end_datetime"
            name="end_datetime"
            value={formData.end_datetime}
            onChange={handleInputChange}
            required
            className={errors.end_datetime ? 'error' : ''}
          />
          {errors.end_datetime && <span className="error-message">{errors.end_datetime}</span>}
        </div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter event description (optional)"
            rows="3"
          />
        </div>

        {/* Location */}
        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="Enter event location (optional)"
          />
        </div>

        {/* Attendees */}
        <div className="form-group">
          <label htmlFor="attendees">Attendees</label>
          <input
            type="text"
            id="attendees"
            name="attendees"
            value={formData.attendees}
            onChange={handleInputChange}
            placeholder="Enter email addresses separated by commas"
          />
          <small className="help-text">
            Separate multiple email addresses with commas
          </small>
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="error-message general-error">
            {errors.general}
          </div>
        )}

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="submit-button"
          >
            {isSubmitting || loading ? 'Creating Event...' : 'Create Event'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .event-form {
          max-width: 600px;
          margin: 0 auto;
        }

        .quick-fill {
          margin-bottom: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .quick-fill label {
          display: block;
          margin-bottom: 10px;
          font-weight: 500;
          color: #333;
        }

        .quick-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .quick-button {
          padding: 8px 16px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .quick-button:hover {
          background: #e9ecef;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #333;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          box-sizing: border-box;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #4285f4;
          box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
        }

        .form-group input.error,
        .form-group textarea.error {
          border-color: #dc3545;
        }

        .help-text {
          font-size: 12px;
          color: #666;
          margin-top: 5px;
          display: block;
        }

        .error-message {
          color: #dc3545;
          font-size: 12px;
          margin-top: 5px;
          display: block;
        }

        .general-error {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 4px;
          padding: 10px;
          margin-bottom: 20px;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
        }

        .submit-button {
          background: #4285f4;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
        }

        .submit-button:hover:not(:disabled) {
          background: #357ae8;
        }

        .submit-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        @media (max-width: 600px) {
          .event-form {
            max-width: 100%;
          }

          .quick-buttons {
            flex-direction: column;
          }

          .quick-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default CalendarEventForm;