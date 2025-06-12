import express, { type Router } from 'express';
import {
  getAllProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from '@/controller/project-controller';
import { requireUserSession } from '@/middleware/auth';

const router: Router = express.Router();

// All project routes require authentication
router.use(requireUserSession);

// Project routes
router.route('/').get(getAllProjects).post(createProject);

router.route('/:id').get(getProject).put(updateProject).delete(deleteProject);

export default router;
