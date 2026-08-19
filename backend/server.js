require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:4173',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('CORS not allowed: ' + origin));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

const authRoutes = require('./authRoutes');
app.use('/api/auth', authRoutes);

const projectRoutes = require('./projectRoutes');
app.use('/api/projects', projectRoutes);

const fileRoute = require('./fileRoute');
app.use('/api', fileRoute);

const chatRoute = require('./chatRoute');
app.use('/api', chatRoute);
const imageRoute = require('./imageRoute');
app.use('/api', imageRoute);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'SetrxAI backend is running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'SetrxAI API is live.' });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`SetrxAI backend chal raha hai: port ${PORT}`);
});
