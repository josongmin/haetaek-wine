// routes/ai_suggestion.routes.js
import express from 'express';
import { suggestionFulltext, analyzeWineResults } from '../controllers/ai_suggestion.controller.js';

const router = express.Router();

router.post('/suggestion_fulltext', suggestionFulltext);
router.post('/analyze-wine-results', analyzeWineResults);

export default router;

