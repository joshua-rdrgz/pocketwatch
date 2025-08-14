import {
  createTask,
  deleteTask,
  getTask,
  updateTask,
} from '@/controller/task-controller';
import { requireUserSession } from '@/middleware/auth';
import express, { type Router } from 'express';

const router: Router = express.Router();

// All task routes require authentication
router.use(requireUserSession);

// Task routes (BASE: /api/tasks)
router.route('/').post(createTask);

router.route('/:taskId').get(getTask).put(updateTask).delete(deleteTask);

export default router;
