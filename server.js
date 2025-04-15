// server.js - Express API endpoint
const express = require('express');
const bodyParser = require('body-parser');
const { generatePDF } = require('./pdfGenerator');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '10mb' }));

app.post('/api/generate-pdf', async (req, res) => {
  try {
    const jsonData = req.body;
    
    if (!jsonData || !jsonData.questions || !Array.isArray(jsonData.questions)) {
      return res.status(400).json({ error: 'Invalid JSON structure. Questions array required.' });
    }
    
    const pdfBuffer = await generatePDF(jsonData);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="question_paper.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`PDF Generator API running on port ${port}`);
});
