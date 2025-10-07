// Vercel serverless function entry point
const { createServer } = require('./server.ts');

module.exports = createServer();