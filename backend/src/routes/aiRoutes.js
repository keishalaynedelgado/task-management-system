const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authMiddleware } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// AI chat route - requires authentication
router.post('/chat', authMiddleware, validate(schemas.aiChat), aiController.chatWithAI);

module.exports = router;