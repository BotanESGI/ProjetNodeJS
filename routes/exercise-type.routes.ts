import { Router } from 'express';
import { getAllExerciseTypes, createExerciseType, updateExerciseType, deleteExerciseType } from '../controllers/exercise-type.controller';

const router = Router();

router.get('/', getAllExerciseTypes);
router.post('/', createExerciseType);
router.put('/:id', updateExerciseType);
router.delete('/:id', deleteExerciseType);

export default router;