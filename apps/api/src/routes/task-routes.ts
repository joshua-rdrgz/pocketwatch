import {
  getSubtasksByTask,
  updateSubtaskOrder,
} from '@/controller/subtask-controller';
import {
  createTask,
  deleteTask,
  getAllTasks,
  getTask,
  updateTask,
} from '@/controller/task-controller';
import { requireUserSession } from '@/middleware/auth';
import express, { type Router } from 'express';

const router: Router = express.Router();

// All task routes require authentication
router.use(requireUserSession);

// Task routes
router.route('/').get(getAllTasks).post(createTask);

router.route('/:id').get(getTask).put(updateTask).delete(deleteTask);

router.route('/:id/subtasks').get(getSubtasksByTask);

router.route('/:id/subtasks/order').patch(updateSubtaskOrder);

export default router;
