import React from 'react';
import { Toolbar, Typography, Button } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

const Header = ({ children, onExportData }) => {
  return (
    <Toolbar>
      {children}
      <DashboardIcon sx={{ mr: 1 }} />
      <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
        Survey Dashboard
      </Typography>
      <Button 
        color="inherit" 
        startIcon={<FileDownloadIcon />}
        onClick={onExportData}
        sx={{ display: { xs: 'none', sm: 'flex' } }}
      >
        Export Data
      </Button>
      <Button 
        color="inherit" 
        onClick={onExportData}
        sx={{ display: { xs: 'flex', sm: 'none' } }}
      >
        <FileDownloadIcon />
      </Button>
    </Toolbar>
  );
};

export default Header;