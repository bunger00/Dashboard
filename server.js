const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
app.use(cors());

const API_KEY = 'a3b1ce6c50a7bec9c926958afac72628';
const PORT = process.env.PORT || 3005;

app.get('/api/kurs', async (req, res) => {
  try {
    const response = await fetch('https://api.frontcore.com/v2/nextcoursedates', {
      headers: {
        'X-API-Key': API_KEY,
        'Accept': 'application/json'
      }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/kurs/:kursId/deltakere', async (req, res) => {
  try {
    const response = await fetch(`https://api.frontcore.com/v2/participants?coursedate_id=${req.params.kursId}`, {
      headers: {
        'X-API-Key': API_KEY,
        'Accept': 'application/json'
      }
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, (error) => {
  if (error) {
    console.error('Error starting server:', error);
    return;
  }
  console.log(`Proxy server kjører på port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.info('SIGTERM signal mottatt.');
  process.exit(0);
}); 