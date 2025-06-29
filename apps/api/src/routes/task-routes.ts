import {
  createSubtask,
  deleteSubtask,
  getSubtasksByTask,
  updateSubtask,
  updateSubtaskOrder,
} from '@/controller/subtask-controller';
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

router.route('/:taskId/subtasks').get(getSubtasksByTask).post(createSubtask);

router.route('/:taskId/subtasks/order').patch(updateSubtaskOrder);

router
  .route('/:taskId/subtasks/:subtaskId')
  .put(updateSubtask)
  .delete(deleteSubtask);

export default router;
