import { Router } from 'express';
import { getAllTrainingStats, createTrainingStats, updateTrainingStats, deleteTrainingStats } from '../controllers/training-stats.controller';

const router = Router();

router.get('/', getAllTrainingStats);
router.post('/', createTrainingStats);
router.put('/:id', updateTrainingStats);
router.delete('/:id', deleteTrainingStats);

export default router;