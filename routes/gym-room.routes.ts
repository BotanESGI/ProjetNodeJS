import { Router } from 'express';
import { getAllGymRooms, createGymRoom, updateGymRoom, deleteGymRoom } from '../controllers/gym-room.controller';

const router = Router();

router.get('/', getAllGymRooms);
router.post('/', createGymRoom);
router.put('/:id', updateGymRoom);
router.delete('/:id', deleteGymRoom);

export default router;