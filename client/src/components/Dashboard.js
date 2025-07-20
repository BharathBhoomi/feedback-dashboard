import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart, registerables } from 'chart.js';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import Layout from './Layout';
import SurveyAnalytics from './SurveyAnalytics';
import SurveyList from './SurveyList';
import SurveyForm from './SurveyForm';
import ApiDocs from './ApiDocs';
import SurveyFeedbackDisplay from './SurveyFeedbackDisplay';

// Register Chart.js components
Chart.register(...registerables);

const Dashboard = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedSurvey, setSelectedSurvey] = useState(null);

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const response = await axios.get('/api/surveys');
        setSurveys(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch survey data');
        setLoading(false);
        console.error(err);
      }
    };

    fetchSurveys();
  }, []);

  const exportToCSV = () => {
    // Create CSV content from surveys data
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add headers
    csvContent += "Survey ID,Title,Description,Created Date,Email,Satisfaction,Recommendation,Comments,Source,Type\n";
    
    // Add data rows
    surveys.forEach(survey => {
      csvContent += `${survey.surveyId || survey._id},"${survey.title || 'Untitled'}","${survey.description || ''}",${new Date(survey.createdAt).toLocaleDateString()},"${survey.email || ''}",${survey.satisfactionRating || ''},${survey.recommendationRating || ''},"${survey.comments || ''}","${survey.source || ''}","${survey.surveyType || ''}"\n`;
    });
    
    // Create download link and trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "survey_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTabChange = (tabIndex) => {
    setActiveTab(tabIndex);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>Loading survey data...</Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      );
    }

    switch (activeTab) {
      case 0: // Analytics
        return <SurveyAnalytics surveys={surveys} />;
      // In the renderContent function
      case 1: // Survey List
        return <SurveyList 
          surveys={surveys} 
          onSelectSurvey={(survey) => {
            setSelectedSurvey(survey);
            setActiveTab(4); // Automatically switch to the Feedback Display tab
          }} 
        />;
      case 2: // Submit Survey
        return <SurveyForm />;
      case 3: // API Documentation
        return <ApiDocs />;
      case 4: // View Feedback
        return <SurveyFeedbackDisplay feedbackData={selectedSurvey} />;
      default:
        return <SurveyAnalytics surveys={surveys} />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={handleTabChange} 
      onExportData={exportToCSV}
    >
      {renderContent()}
    </Layout>
  );
};

export default Dashboard;