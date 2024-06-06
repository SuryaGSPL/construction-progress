// src/App.tsx
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import ModelEnvironment from './components/model-env/ModelEnvironment';
import ProgressBar from './components/progress-bar/ProgressBar';
import { Container, Paper, Stack, TextField } from '@mui/material';

export default function App() {
  const [startDate, setStartDate] = useState<string>('2023-01-31');
  const [endDate, setEndDate] = useState<string>('2023-12-31');

  const [file, setFile] = useState<any>(null);

  return (
    <div className='App'>

      <Stack direction='row'>
        <ModelEnvironment file={file} />
        <Stack sx={{ alignItems: 'center' }}>
          <TextField
            type="file"
            onChange={(e) => { setFile(e) }}
            inputProps={{ 'aria-label': 'Upload IFC file', accept: '.ifc' }}
            variant="outlined"
            sx={{ width: 'fit-content', p: 2 }}
          />
          {/* Input Panel */}
          <Paper sx={{ width: 'fit-content', p: 2 }} elevation={4}>
            <form className='input-panel' >
              <label>Start Date</label>
              <TextField
                type='date'
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <label>End Date</label>
              <TextField
                type='date'
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </form>
          </Paper>
        </Stack>
      </Stack>
      <Container>
        <ProgressBar startDate={startDate} endDate={endDate} />
      </Container>
    </div>
  );
};

