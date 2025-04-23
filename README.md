# 📄 Custom PDF Generator for Question Papers

A lightweight, browserless REST API that generates print-ready PDF question papers from structured JSON data using **PDFKit** — ideal for educational platforms that require professional formatting without the overhead of headless browsers like Puppeteer.

---

## 🚀 Features

- 📘 Generates PDF directly from JSON using [PDFKit](https://github.com/foliojs/pdfkit)
- 🧾 Structured two-column question format
- ✅ Supports multiple question types: **MCQ, numerical, descriptive**
- 📑 Separate sections for **questions**, **answer key**, and **solutions**
- ✏️ Clean and print-friendly layout
- ⚡ Fast and efficient (no browser required)
- 🖼️ Supports images, formulas (SVG), and custom logos/fonts

---
<img src="https://github.com/Priom7/JSON-to-PDF-Generator/blob/main/sample-output.png" alt="JSON to PDF Generator" width="100%" height="auto">
---

## 🛠️ Setup Instructions

### 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### 📦 Installation

```bash
git clone https://github.com/Priom7/JSON-to-PDF-Generator.git
cd JSON-to-PDF-Generator

# Install dependencies
npm install

# Start the server
npm start
```

API will be available at:  
**`http://localhost:3000/api/generate-pdf`**

---

## 📡 API Documentation

### 📍 Endpoint

```
POST /api/generate-pdf
```

**Content-Type**: `application/json`  
**Response**: `application/pdf`

### 📥 Request Body Example

```json
{
  "title": "Physics Examination Paper",
  "subject": "Physics",
  "date": "April 15, 2025",
  "duration": "3 hours",
  "totalMarks": 100,
  "instructions": [
    "All questions are compulsory",
    "There is no negative marking"
  ],
  "questions": [
    {
      "type": "mcq",
      "text": "A particle moves along the x-axis...",
      "options": ["300 J", "900 J", "1000 J", "3000 J"],
      "correctOption": 3,
      "solution": "Work done = ∫F(x)dx from x=0 to x=10..."
    }
  ]
}
```

### ✅ Success Response

- `Status: 200 OK`
- `Content-Type: application/pdf`
- Body: Binary PDF file

### ❌ Error Responses

- `400 Bad Request` – Invalid JSON
- `500 Internal Server Error` – PDF generation failed

---

## 📐 JSON Schema

| Field         | Type               | Description                                |
| ------------- | ------------------ | ------------------------------------------ |
| `title`       | `String`           | Title of the examination paper             |
| `subject`     | `String`           | Subject name                               |
| `date`        | `String`           | Exam date                                  |
| `duration`    | `String`           | Exam duration (e.g., `"3 hours"`)          |
| `totalMarks`  | `Number`           | Total marks                                |
| `instructions`| `Array<String>`    | Exam instructions                          |
| `questions`   | `Array<Object>`    | List of questions                          |

### 🎯 Question Object

| Field          | Type               | Description                                               |
| -------------- | ------------------ | --------------------------------------------------------- |
| `type`         | `String`           | `"mcq"`, `"numerical"`, or `"descriptive"`                |
| `text`         | `String`           | Question text                                             |
| `options`      | `Array<String>`    | (For MCQ) Answer options                                  |
| `correctOption`| `Number`           | (For MCQ) Index of correct option                         |
| `answer`       | `String`           | Correct answer (numerical/descriptive)                   |
| `solution`     | `String`           | Detailed solution explanation                            |
| `images`       | `Array<Object>`    | (Optional) Images with `path`, `width`, `height`, `position` |

---

## 🎨 Customization

### 🧱 Layout Configuration (`pdfGenerator.js`)

```js
const CONFIG = {
  pageSize: 'A4',
  margin: { top: 50, bottom: 50, left: 40, right: 40 },
  columns: 2,
  columnGap: 20,
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
```

### 🔡 Custom Fonts

1. Add your `.ttf` font files to a `fonts/` directory.
2. Register them in `pdfGenerator.js`:

```js
doc.registerFont('CustomFont', 'fonts/CustomFont.ttf');
```

Update config:

```js
fonts: {
  regular: 'CustomFont',
  bold: 'CustomFont-Bold',
  italic: 'CustomFont-Italic'
}
```

### 🖼️ Logo Support

Include in JSON:

```json
"logoPath": "path/to/logo.png"
```

---

## 🔢 Math & Image Support

- **Simple Math**: Unicode math characters
- **Complex Math**: Include `<svg>` in question text or integrate [mathjax-node](https://github.com/mathjax/MathJax-node)
- **Images**:

```json
"images": [
  {
    "path": "path/to/image.png",
    "width": 300,
    "height": 200,
    "position": "center"
  }
]
```

---

## 📄 Page Numbering

Add to `pdfGenerator.js`:

```js
doc.on('pageAdded', () => {
  const pageCount = doc.bufferedPageRange().count;
  doc.switchToPage(pageCount - 1);
  doc.fontSize(8)
     .text(`Page ${pageCount}`, doc.page.width / 2, doc.page.height - 20, { align: 'center' });
});
```

---

## 🐳 Docker Deployment

### 🧾 Dockerfile

```dockerfile
FROM node:16-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

### 📦 Build & Run

```bash
docker build -t pdf-generator .
docker run -p 3000:3000 pdf-generator
```

---

## ☁️ Cloud Deployment

### AWS Elastic Beanstalk

```bash
eb init
eb create pdf-generator-env
eb deploy
```

### Heroku

```bash
heroku create
git push heroku main
```

---

## 🧪 Test Script

Create `sample-data.json`, then run:

```bash
node test.js
```

**`test.js`** example:

```js
const fs = require('fs');
const path = require('path');
const { generatePDF } = require('./pdfGenerator');

async function testPDFGeneration() {
  const dataPath = path.join(__dirname, 'sample-data.json');
  if (!fs.existsSync(dataPath)) return console.error('sample-data.json not found');

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const pdf = await generatePDF(data);
  fs.writeFileSync('output-test.pdf', pdf);
  console.log('PDF generated → output-test.pdf');
}

testPDFGeneration().catch(console.error);
```

---

## 🛡️ Security & Optimization

- ✅ Input validation & sanitization
- 🔐 Add authentication for production
- ⏳ Use queues for batch requests
- 🧠 Add caching for templates
- 🚫 Rate limiting to prevent abuse

---

## 🐞 Troubleshooting

| Issue                           | Solution                                                      |
| ------------------------------ | ------------------------------------------------------------- |
| Large JSON payload              | `bodyParser.json({ limit: '50mb' })`                         |
| Fonts not rendering             | Ensure correct path and supported format (TTF/OTF)           |
| Images not displaying           | Check file path and permissions                              |
| Memory issues with large PDFs  | Use streaming instead of buffering                           |

Enable debug logs:

```bash
DEBUG=true node server.js
```

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m "Add your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request 🚀
