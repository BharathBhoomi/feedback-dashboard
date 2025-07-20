import React from 'react';
import { Grid, Paper, Typography, Box, Divider } from '@mui/material';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';

const SurveyAnalytics = ({ surveys }) => {
  // Skip rendering if no surveys
  if (!surveys || surveys.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No survey data available for analytics
        </Typography>
      </Paper>
    );
  }

  // Prepare data for charts
  const prepareChartData = () => {
    // For timeline chart (surveys over time)
    const surveyDates = {};
    // For satisfaction distribution
    const satisfactionCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    // For recommendation (NPS) distribution
    const npsCounts = { 
      'Detractors (0-6)': 0, 
      'Passives (7-8)': 0, 
      'Promoters (9-10)': 0 
    };
    // For source distribution
    const sourceCounts = {};

    surveys.forEach(survey => {
      // Process dates for timeline
      const date = new Date(survey.createdAt).toLocaleDateString();
      surveyDates[date] = (surveyDates[date] || 0) + 1;
      
      // Process satisfaction ratings
      if (survey.satisfactionRating) {
        const rating = parseInt(survey.satisfactionRating);
        if (rating >= 1 && rating <= 5) {
          satisfactionCounts[rating] += 1;
        }
      }
      
      // Process NPS ratings
      if (survey.recommendationRating) {
        const rating = parseInt(survey.recommendationRating);
        if (rating >= 0 && rating <= 6) {
          npsCounts['Detractors (0-6)'] += 1;
        } else if (rating >= 7 && rating <= 8) {
          npsCounts['Passives (7-8)'] += 1;
        } else if (rating >= 9 && rating <= 10) {
          npsCounts['Promoters (9-10)'] += 1;
        }
      }
      
      // Process sources
      if (survey.source) {
        sourceCounts[survey.source] = (sourceCounts[survey.source] || 0) + 1;
      }
    });

    return {
      surveyDates,
      satisfactionCounts,
      npsCounts,
      sourceCounts
    };
  };

  const { surveyDates, satisfactionCounts, npsCounts, sourceCounts } = prepareChartData();

  // Timeline chart data
  const timelineData = {
    labels: Object.keys(surveyDates),
    datasets: [
      {
        label: 'Surveys Received',
        data: Object.values(surveyDates),
        fill: false,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1
      },
    ],
  };

  // Satisfaction chart data
  const satisfactionData = {
    labels: Object.keys(satisfactionCounts).map(key => `Rating ${key}`),
    datasets: [
      {
        label: 'Satisfaction Distribution',
        data: Object.values(satisfactionCounts),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(255, 205, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(54, 162, 235, 0.6)',
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(255, 159, 64)',
          'rgb(255, 205, 86)',
          'rgb(75, 192, 192)',
          'rgb(54, 162, 235)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // NPS chart data
  const npsData = {
    labels: Object.keys(npsCounts),
    datasets: [
      {
        label: 'NPS Distribution',
        data: Object.values(npsCounts),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 205, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(255, 205, 86)',
          'rgb(75, 192, 192)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Source chart data
  const sourceData = {
    labels: Object.keys(sourceCounts),
    datasets: [
      {
        label: 'Survey Sources',
        data: Object.values(sourceCounts),
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Calculate summary statistics
  const calculateStats = () => {
    const totalSurveys = surveys.length;
    
    // Calculate average satisfaction
    let totalSatisfaction = 0;
    let satisfactionCount = 0;
    
    // Calculate NPS score
    let promoters = 0;
    let detractors = 0;
    let npsResponses = 0;
    
    surveys.forEach(survey => {
      if (survey.satisfactionRating) {
        totalSatisfaction += parseInt(survey.satisfactionRating);
        satisfactionCount++;
      }
      
      if (survey.recommendationRating) {
        const rating = parseInt(survey.recommendationRating);
        npsResponses++;
        if (rating >= 9) promoters++;
        if (rating <= 6) detractors++;
      }
    });
    
    const avgSatisfaction = satisfactionCount > 0 
      ? (totalSatisfaction / satisfactionCount).toFixed(1) 
      : 'N/A';
      
    const npsScore = npsResponses > 0 
      ? Math.round(((promoters - detractors) / npsResponses) * 100) 
      : 'N/A';
    
    return {
      totalSurveys,
      avgSatisfaction,
      npsScore
    };
  };

  const { totalSurveys, avgSatisfaction, npsScore } = calculateStats();

  return (
    <>
      {/* Summary Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
            <Typography variant="h4" color="primary">{totalSurveys}</Typography>
            <Typography variant="body1">Total Surveys</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
            <Typography variant="h4" color="primary">{avgSatisfaction}</Typography>
            <Typography variant="body1">Avg. Satisfaction (1-5)</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
            <Typography variant="h4" color="primary">{npsScore !== 'N/A' ? npsScore : 'N/A'}</Typography>
            <Typography variant="body1">NPS Score</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Survey Timeline</Typography>
            <Divider sx={{ mb: 2 }} />
            <Box height={300}>
              <Line 
                data={timelineData} 
                options={{ 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'top' }
                  }
                }} 
              />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Satisfaction Distribution</Typography>
            <Divider sx={{ mb: 2 }} />
            <Box height={300}>
              <Bar 
                data={satisfactionData} 
                options={{ 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false }
                  }
                }} 
              />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>NPS Distribution</Typography>
            <Divider sx={{ mb: 2 }} />
            <Box height={300}>
              <Doughnut 
                data={npsData} 
                options={{ 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'right' }
                  }
                }} 
              />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Survey Sources</Typography>
            <Divider sx={{ mb: 2 }} />
            <Box height={300}>
              <Pie 
                data={sourceData} 
                options={{ 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'right' }
                  }
                }} 
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
};

export default SurveyAnalytics;