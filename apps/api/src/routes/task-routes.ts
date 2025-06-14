import express, { type Router } from 'express';
import {
  getAllTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from '@/controller/task-controller';
import { requireUserSession } from '@/middleware/auth';
import { getSubtasksByTask } from '@/controller/subtask-controller';

const router: Router = express.Router();

// All task routes require authentication
router.use(requireUserSession);

// Task routes
router.route('/').get(getAllTasks).post(createTask);

router.route('/:id').get(getTask).put(updateTask).delete(deleteTask);

router.route('/:id/subtasks').get(getSubtasksByTask);

export default router;
