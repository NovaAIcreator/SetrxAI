// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const authRoutes = require('./authRoutes');
app.use('/api/auth', authRoutes);

const projectRoutes = require('./projectRoutes');
app.use('/api/projects', projectRoutes);

// Image generation temporarily disabled — dobara add karenge jab monetize ho jaaye
// const imageRoute = require('./imageRoute');
// app.use('/api', imageRoute);

const fileRoute = require('./fileRoute');
app.use('/api', fileRoute);

const chatRoute = require('./chatRoute');
app.use('/api', chatRoute);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'SetrxAI backend is running', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ SetrxAI backend chal raha hai: http://localhost:${PORT}`);
});