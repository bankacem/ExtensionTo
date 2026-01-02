
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 3003;

app.use(cors());
app.use(bodyParser.json());

const dbExtensionsPath = path.join(__dirname, 'db_extensions.json');
const dbBlogPath = path.join(__dirname, 'db_blog.json');

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to read data from JSON file
const readData = (filePath) => {
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
};

// Helper function to write data to JSON file
const writeData = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

// API endpoints for extensions
app.get('/api/extensions', (req, res) => {
  const extensions = readData(dbExtensionsPath);
  res.json(extensions);
});

app.post('/api/extensions', (req, res) => {
  const newExtensions = req.body;
  writeData(dbExtensionsPath, newExtensions);
  res.json({ message: 'Extensions data updated successfully' });
});

// API endpoints for blog posts
app.get('/api/blog', (req, res) => {
  const blogPosts = readData(dbBlogPath);
  res.json(blogPosts);
});

app.post('/api/blog', (req, res) => {
  const newBlogPosts = req.body;
  writeData(dbBlogPath, newBlogPosts);
  res.json({ message: 'Blog data updated successfully' });
});

// Secure API endpoint for AI content generation
app.post('/api/generate-content', async (req, res) => {
  const { keyword } = req.body;

  if (!keyword) {
    return res.status(400).json({ error: 'Keyword is required' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `اكتب مقال SEO احترافي حول "${keyword}" بالعربية. التنسيق JSON: { "title": "...", "content": "...", "excerpt": "...", "readTime": "..." }`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    res.json(JSON.parse(text));
  } catch (error) {
    console.error('AI content generation failed:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

// Secure API endpoint for SEO audit
app.post('/api/seo-audit', async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `أنت خبير SEO محترف. قم بتحليل هذا العنوان: "${title}" والمحتوى: "${content.substring(0, 1000)}". أعطني 3 نصائح محددة باللغة العربية لتحسين الترتيب في جوجل.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    res.json({ auditResult: text });
  } catch (error) {
    console.error('SEO audit failed:', error);
    res.status(500).json({ error: 'Failed to perform SEO audit' });
  }
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
