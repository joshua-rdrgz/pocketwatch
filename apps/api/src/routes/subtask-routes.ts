import express, { type Router } from 'express';
import {
  createSubtask,
  updateSubtask,
  deleteSubtask,
} from '@/controller/subtask-controller.js';
import { requireUserSession } from '@/middleware/auth';

const router: Router = express.Router();

// All subtask routes require authentication
router.use(requireUserSession);

// Subtask routes
router.route('/').post(createSubtask);

router.route('/:id').put(updateSubtask).delete(deleteSubtask);

export default router;
