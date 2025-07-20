import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Divider,
  Rating,
  Stack
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import RecommendIcon from '@mui/icons-material/Recommend';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import MessageIcon from '@mui/icons-material/Message';

const SurveyFeedbackDisplay = ({ feedbackData }) => {
  // Default data if none provided
  const data = feedbackData || {
    "recommendationRating":"3",
    "satisfactionRating":"2",
    "experience":"cdcdcdc",
    "contactPermission":"No, I don't want to be contacted by DHL.",
    "furtherInfoPermission":"No, I don't want to be contacted by DHL.",
    "fullName":"dcsc",
    "phone":"dcdscvsdc ",
    "email":"njnlknlk@gmail.com"
  };

  // Convert string ratings to numbers for display
  const satisfactionRating = parseInt(data.satisfactionRating) || 0;
  const recommendationRating = parseInt(data.recommendationRating) || 0;
  
  // Determine NPS category
  let npsCategory = "Passive";
  let npsColor = "warning";
  
  if (recommendationRating >= 9) {
    npsCategory = "Promoter";
    npsColor = "success";
  } else if (recommendationRating <= 6) {
    npsCategory = "Detractor";
    npsColor = "error";
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom>Survey Feedback</Typography>
      <Divider sx={{ mb: 3 }} />
      
      {/* Rating Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom>Satisfaction Rating</Typography>
            <Rating 
              value={satisfactionRating} 
              readOnly 
              max={5}
              icon={<ThumbUpIcon fontSize="inherit" />}
              emptyIcon={<ThumbUpIcon fontSize="inherit" />}
              sx={{ mb: 1 }}
            />
            <Typography variant="h4">{satisfactionRating}/5</Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom>Recommendation Rating (NPS)</Typography>
            <Rating 
              value={recommendationRating / 2} 
              readOnly 
              precision={0.5}
              max={5}
              icon={<RecommendIcon fontSize="inherit" />}
              emptyIcon={<RecommendIcon fontSize="inherit" />}
              sx={{ mb: 1 }}
            />
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h4">{recommendationRating}/10</Typography>
              <Chip label={npsCategory} color={npsColor} size="small" />
            </Stack>
          </Box>
        </Grid>
      </Grid>
      
      {/* Contact Information */}
      <Typography variant="h6" gutterBottom>Contact Information</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="body1">{data.fullName}</Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EmailIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="body1">{data.email}</Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PhoneIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="body1">{data.phone}</Typography>
          </Box>
        </Grid>
      </Grid>
      
      {/* Experience Feedback */}
      <Typography variant="h6" gutterBottom>Feedback</Typography>
      <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
          <MessageIcon sx={{ mr: 1, mt: 0.5, color: 'primary.main' }} />
          <Typography variant="body1">{data.experience}</Typography>
        </Box>
      </Box>
      
      {/* Permissions */}
      <Typography variant="h6" gutterBottom>Contact Preferences</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Chip 
            label={data.contactPermission} 
            color={data.contactPermission.toLowerCase().includes('yes') ? 'success' : 'default'}
            sx={{ mr: 1, mb: 1 }}
          />
        </Grid>
        <Grid item xs={12}>
          <Chip 
            label={data.furtherInfoPermission} 
            color={data.furtherInfoPermission.toLowerCase().includes('yes') ? 'success' : 'default'}
            sx={{ mr: 1 }}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SurveyFeedbackDisplay;