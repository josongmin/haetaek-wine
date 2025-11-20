// routes/external_wine_search.routes.js
import express from 'express';
import { keywordSuggestion, getWineDetails, deleteCache, searchCandidatesWithPerplexity, searchCandidatesWithPerplexityV2, searchSingleCandidate, searchSingleCandidateV3 } from '../controllers/external_wine_search.controller.js';

const router = express.Router();

router.get('/keyword_suggesion', keywordSuggestion);
router.post('/keyword_suggesion', keywordSuggestion);
router.post('/get_wine_details', getWineDetails);
router.post('/search_candidates_with_perplexity', searchCandidatesWithPerplexity);
router.post('/search_candidates_with_perplexity_v2', searchCandidatesWithPerplexityV2);
router.post('/search_single_candidate', searchSingleCandidate);
router.post('/search_single_candidate_v3', searchSingleCandidateV3);
router.delete('/cache', deleteCache);
router.post('/cache/delete', deleteCache);

export default router;

