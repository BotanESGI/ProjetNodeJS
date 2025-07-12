import { Router } from 'express';
import { getAllChallenges, createChallenge, updateChallenge, deleteChallenge } from '../controllers/challenge.controller';

const router = Router();

router.get('/', getAllChallenges);
router.post('/', createChallenge);
router.put('/:id', updateChallenge);
router.delete('/:id', deleteChallenge);

export default router;