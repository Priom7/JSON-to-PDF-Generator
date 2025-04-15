// pdfGenerator.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// PDF Configuration
const CONFIG = {
  pageSize: 'A4',
  margin: {
    top: 50,
    bottom: 50,
    left: 40,
    right: 40
  },
  columns: 2, // Set to 2 columns
  columnGap: 20, // Gap between the two columns
  fonts: {
    regular: 'Helvetica',
    bold: 'Helvetica-Bold',
    italic: 'Helvetica-Oblique'
  },
  fontSize: {
    title: 16,
    header: 12,
    subHeader: 10,
    normal: 10,
    small: 8
  }
};

// Generate PDF from JSON data
async function generatePDF(data) {
  return new Promise((resolve, reject) => {
    try {
      // Create a PDF document
      const doc = new PDFDocument({
        size: CONFIG.pageSize,
        margin: CONFIG.margin,
        info: {
          Title: data.title || 'Question Paper',
          Author: data.author || 'PDF Generator',
          Subject: data.subject || '',
          Keywords: 'education, exam, questions'
        },
        bufferPages: true
      });

      // Buffer to collect PDF data
      const buffers = [];
      doc.on('data', buffer => buffers.push(buffer));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      
      // Error handling
      doc.on('error', err => reject(err));

      // Generate question paper
      generateHeader(doc, data);
      generateQuestions(doc, data.questions);
      generateAnswerKey(doc, data.questions);
      generateSolutions(doc, data.questions);
      
      // End the document
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Generate document header
function generateHeader(doc, data) {
  // Add logo if provided
  if (data.logoPath) {
    try {
      const logoPath = path.resolve(data.logoPath);
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, CONFIG.margin.left, CONFIG.margin.top, { width: 100 });
      }
    } catch (error) {
      console.warn('Logo could not be loaded:', error.message);
    }
  }

  // Center align for header
  const pageWidth = doc.page.width - CONFIG.margin.left - CONFIG.margin.right;
  
  // Title
  doc.font(CONFIG.fonts.bold)
     .fontSize(CONFIG.fontSize.title)
     .text(data.title || 'Question Paper', 
           CONFIG.margin.left, 
           CONFIG.margin.top + (data.logoPath ? 30 : 0), 
           { width: pageWidth, align: 'center' });

  // Subject and exam details
  doc.moveDown(0.5)
     .font(CONFIG.fonts.regular)
     .fontSize(CONFIG.fontSize.header)
     .text(`Subject: ${data.subject || 'General'}`, 
           { align: 'center' });

  // Exam info line (date, time, marks)
  doc.moveDown(0.3)
     .fontSize(CONFIG.fontSize.subHeader)
     .text(`Date: ${data.date || 'N/A'} | Time: ${data.duration || 'N/A'} | Total Marks: ${data.totalMarks || 'N/A'}`, 
           { align: 'center' });

  // Instructions if available
  if (data.instructions && Array.isArray(data.instructions) && data.instructions.length > 0) {
    doc.moveDown(1)
       .fontSize(CONFIG.fontSize.normal)
       .font(CONFIG.fonts.italic)
       .text('Instructions:', { continued: false })
       .font(CONFIG.fonts.regular);
    
    data.instructions.forEach((instruction, index) => {
      doc.text(`${index + 1}. ${instruction}`);
    });
  }

  // Starting point for questions
  doc.moveDown(1.5);
}

// Generate question content using two-column layout
function generateQuestions(doc, questions) {
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    doc.text('No questions available.');
    return;
  }

  doc.addPage()
     .font(CONFIG.fonts.bold)
     .fontSize(CONFIG.fontSize.header)
     .text('QUESTIONS', { align: 'center' })
     .moveDown(1);

  // Calculate column width
  const pageWidth = doc.page.width - CONFIG.margin.left - CONFIG.margin.right;
  const columnWidth = (pageWidth - CONFIG.columnGap) / CONFIG.columns;

  let currentX = CONFIG.margin.left;
  let currentY = doc.y;
  let columnHeight = doc.page.height - CONFIG.margin.top - CONFIG.margin.bottom;
  let currentColumn = 0;

  // Draw a vertical bar between the two columns
  const barX = CONFIG.margin.left + columnWidth + CONFIG.columnGap / 2;
  doc.moveTo(barX, CONFIG.margin.top + 50)
     .lineTo(barX, doc.page.height - CONFIG.margin.bottom)
     .stroke();

  // Process each question and position in columns
  questions.forEach((question, index) => {
    // Save position before writing content to check height
    const startY = currentY;

    // Write question number and text
    doc.font(CONFIG.fonts.bold)
       .fontSize(CONFIG.fontSize.normal)
       .text(`Q${index + 1}. `, currentX, currentY, { continued: true })
       .font(CONFIG.fonts.regular)
       .text(question.text || '', { width: columnWidth, align: 'justify' });

    // If it's an MCQ, add options
    if (question.type === 'mcq' && question.options && Array.isArray(question.options)) {
      doc.moveDown(0.5);

      question.options.forEach((option, optIndex) => {
        const optionLabel = String.fromCharCode(65 + optIndex); // A, B, C, D...
        doc.text(`${optionLabel}) ${option}`, { indent: 15, width: columnWidth - 15, align: 'justify' });
      });
    }

    // Add a bit of space after each question
    doc.moveDown(0.8);

    // Calculate how much vertical space the question took
    const endY = doc.y;
    const questionHeight = endY - startY;

    // Update current Y position
    currentY = endY;

    // Check if we need to move to next column or page
    if (currentY + 70 > CONFIG.margin.top + columnHeight) { // 70 is buffer for next question
      // If we're in the first column, move to second column
      if (currentColumn === 0) {
        currentColumn = 1;
        currentX = CONFIG.margin.left + columnWidth + CONFIG.columnGap;
        currentY = CONFIG.margin.top; // Start from top of second column
        doc.x = currentX;
        doc.y = currentY;
      } else {
        // We're already in the second column, add a new page
        doc.addPage();
        currentColumn = 0;
        currentX = CONFIG.margin.left;
        currentY = CONFIG.margin.top; // Start from top of first column

        // Redraw the vertical bar on the new page
        const newBarX = CONFIG.margin.left + columnWidth + CONFIG.columnGap / 2;
        doc.moveTo(newBarX, CONFIG.margin.top)
           .lineTo(newBarX, doc.page.height - CONFIG.margin.bottom)
           .stroke();

        doc.x = currentX;
        doc.y = currentY;
      }
    }

    // // Ensure the current column's content does not overflow into the next column
    // if (currentColumn === 1 && currentX < CONFIG.margin.left + columnWidth + CONFIG.columnGap) {
    //   currentX = CONFIG.margin.left + columnWidth + CONFIG.columnGap;
    // }
  });
}

// Generate answer key page
function generateAnswerKey(doc, questions) {
  // Start answer key on a new page
  doc.addPage()
     .font(CONFIG.fonts.bold)
     .fontSize(CONFIG.fontSize.header)
     .text('ANSWER KEY', { align: 'center' })
     .moveDown(1);
  
  // Create column layout for answers
  const pageWidth = doc.page.width - CONFIG.margin.left - CONFIG.margin.right;
  const answersPerRow = 4; // Organize answers in rows of 4
  const cellWidth = pageWidth / answersPerRow;
  
  let currentRow = 0;
  let currentCol = 0;
  
  // Process each answer
  questions.forEach((question, index) => {
    const questionNumber = index + 1;
    let answer = '';
    
    if (question.type === 'mcq' && question.correctOption !== undefined) {
      // Convert numeric index to letter (0 -> A, 1 -> B, etc.)
      answer = String.fromCharCode(65 + question.correctOption);
    } else if (question.answer) {
      // Use provided answer directly
      answer = question.answer;
    }
    
    // Calculate position
    const x = CONFIG.margin.left + (currentCol * cellWidth);
    const y = doc.y + (currentRow * 20); // 20 points height per answer row
    
    // Write answer
    doc.font(CONFIG.fonts.regular)
       .fontSize(CONFIG.fontSize.normal)
       .text(`${questionNumber}. ${answer}`, x, y, { width: cellWidth - 5 });
    
    // Update position for next answer
    currentCol++;
    if (currentCol >= answersPerRow) {
      currentCol = 0;
      currentRow++;
    }
    
    // Check if we need a new page
    if (y + 40 > doc.page.height - CONFIG.margin.bottom && index < questions.length - 1) {
      doc.addPage();
      currentRow = 0;
      doc.y = CONFIG.margin.top + 50;
    }
  });
}

// Generate solutions page
function generateSolutions(doc, questions) {
  // Start solutions on a new page
  doc.addPage()
     .font(CONFIG.fonts.bold)
     .fontSize(CONFIG.fontSize.header)
     .text('SOLUTIONS', { align: 'center' })
     .moveDown(1);
  
  // Process each solution
  questions.forEach((question, index) => {
    if (!question.solution) return; // Skip if no solution provided
    
    // Check if we need a new page
    if (doc.y + 150 > doc.page.height - CONFIG.margin.bottom) { // Rough estimate for new page check
      doc.addPage();
    }
    
    // Question number and text reference
    doc.font(CONFIG.fonts.bold)
       .fontSize(CONFIG.fontSize.normal)
       .text(`Question ${index + 1}: `, { continued: true })
       .font(CONFIG.fonts.italic)
       .text(question.text.substring(0, 60) + (question.text.length > 60 ? '...' : ''))
       .moveDown(0.5);
    
    // Solution text
    doc.font(CONFIG.fonts.regular)
       .text(question.solution);
    
    // Space between solutions
    doc.moveDown(1);
  });
}

module.exports = { generatePDF };
