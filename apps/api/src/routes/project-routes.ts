import {
  createProject,
  deleteProject,
  getAllProjects,
  getProject,
  updateProject,
} from '@/controller/project-controller';
import { getTasksByProject } from '@/controller/task-controller';
import { requireUserSession } from '@/middleware/auth';
import express, { type Router } from 'express';

const router: Router = express.Router();

// All project routes require authentication
router.use(requireUserSession);

// Project routes
router.route('/').get(getAllProjects).post(createProject);

router.route('/:id').get(getProject).put(updateProject).delete(deleteProject);

router.route('/:id/tasks').get(getTasksByProject);

export default router;
