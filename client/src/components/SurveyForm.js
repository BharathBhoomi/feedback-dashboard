import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Alert,
  Snackbar,
  Divider,
  CircularProgress
} from '@mui/material';
import axios from 'axios';

const SurveyForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fullName: '',
    email: '',
    satisfactionRating: 3,
    recommendationRating: 7,
    comments: '',
    source: 'dashboard',
    surveyType: 'feedback'
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSliderChange = (name) => (e, newValue) => {
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await axios.post('/api/external/surveys', formData);
      setSuccess(true);
      setFormData({
        title: '',
        description: '',
        fullName: '',
        email: '',
        satisfactionRating: 3,
        recommendationRating: 7,
        comments: '',
        source: 'dashboard',
        surveyType: 'feedback'
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit survey');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseSnackbar = () => {
    setSuccess(false);
  };
  
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Submit New Survey</Typography>
      <Divider sx={{ mb: 3 }} />
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Survey Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={2}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Survey Type</InputLabel>
              <Select
                name="surveyType"
                value={formData.surveyType}
                label="Survey Type"
                onChange={handleChange}
              >
                <MenuItem value="feedback">Feedback</MenuItem>
                <MenuItem value="satisfaction">Satisfaction</MenuItem>
                <MenuItem value="nps">Net Promoter Score</MenuItem>
                <MenuItem value="product">Product</MenuItem>
                <MenuItem value="service">Service</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography gutterBottom>Satisfaction Rating (1-5)</Typography>
            <Slider
              value={formData.satisfactionRating}
              onChange={handleSliderChange('satisfactionRating')}
              valueLabelDisplay="auto"
              step={1}
              marks
              min={1}
              max={5}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography gutterBottom>Recommendation Rating (0-10)</Typography>
            <Slider
              value={formData.recommendationRating}
              onChange={handleSliderChange('recommendationRating')}
              valueLabelDisplay="auto"
              step={1}
              marks
              min={0}
              max={10}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Comments"
              name="comments"
              value={formData.comments}
              onChange={handleChange}
              multiline
              rows={4}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Submit Survey'}
            </Button>
          </Grid>
        </Grid>
      </Box>
      
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          Survey submitted successfully!
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default SurveyForm;