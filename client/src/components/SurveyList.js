import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Chip,
  IconButton,
  Collapse,
  Box,
  Typography
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Button } from '@mui/material';

// Row component for expandable details
const SurveyRow = ({ survey, onSelectSurvey }) => {
  const [open, setOpen] = useState(false);
  
  // Function to determine rating type and display appropriate chip
  const getRatingChip = (survey) => {
    if (survey.satisfactionRating) {
      const rating = parseInt(survey.satisfactionRating);
      let color = 'default';
      if (rating >= 4) color = 'success';
      else if (rating >= 3) color = 'warning';
      else color = 'error';
      return <Chip size="small" color={color} label={`Satisfaction: ${rating}/5`} />;
    }
    
    if (survey.recommendationRating) {
      const rating = parseInt(survey.recommendationRating);
      let color = 'default';
      if (rating >= 9) color = 'success';
      else if (rating >= 7) color = 'warning';
      else color = 'error';
      return <Chip size="small" color={color} label={`NPS: ${rating}/10`} />;
    }
    
    return null;
  };

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{survey.recommendationRating || 'N/A'}</TableCell>
        <TableCell>{survey.satisfactionRating || 'N/A'}</TableCell>
        <TableCell>{survey.experience || 'N/A'}</TableCell>
        <TableCell>{survey.contactPermission || 'N/A'}</TableCell>
        <TableCell>{survey.furtherInfoPermission || 'N/A'}</TableCell>
        <TableCell>{survey.fullName || 'N/A'}</TableCell>
        <TableCell>{survey.phone || 'N/A'}</TableCell>
        <TableCell>{survey.email || 'N/A'}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1, padding: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Additional Details
              </Typography>
              
              {survey.description && (
                <Box mb={2}>
                  <Typography variant="subtitle2">Description:</Typography>
                  <Typography variant="body2">{survey.description}</Typography>
                </Box>
              )}
              
              {survey.comments && (
                <Box mb={2}>
                  <Typography variant="subtitle2">Comments:</Typography>
                  <Typography variant="body2">{survey.comments}</Typography>
                </Box>
              )}
              
              {survey.source && (
                <Chip 
                  size="small" 
                  label={`Source: ${survey.source}`} 
                  sx={{ mt: 1, mr: 1 }} 
                />
              )}
              
              {survey.surveyType && (
                <Chip 
                  size="small" 
                  label={`Type: ${survey.surveyType}`} 
                  sx={{ mt: 1, mr: 1 }} 
                />
              )}
              
              {/* Add a button to view detailed feedback */}
              <Button 
                variant="contained" 
                size="small" 
                sx={{ mt: 2 }}
                onClick={() => onSelectSurvey && onSelectSurvey(survey)}
              >
                View Detailed Feedback
              </Button>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

// Add onSelectSurvey prop to the component definition
const SurveyList = ({ surveys, onSelectSurvey }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              <TableCell style={{ width: '60px' }} />
              <TableCell>Recommendation Rating</TableCell>
              <TableCell>Satisfaction Rating</TableCell>
              <TableCell>Experience</TableCell>
              <TableCell>Contact Permission</TableCell>
              <TableCell>Further Info Permission</TableCell>
              <TableCell>Full Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Email</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {surveys
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((survey) => (
                <SurveyRow key={survey._id} survey={survey} onSelectSurvey={onSelectSurvey} />
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={surveys.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default SurveyList;