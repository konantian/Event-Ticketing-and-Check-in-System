const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(bodyParser.json());

// TODO: Define routes for user authentication
// Example: app.post('/api/register', async (req, res) => { ... });

// TODO: Define routes for event management
// Example: app.post('/api/events', async (req, res) => { ... });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 