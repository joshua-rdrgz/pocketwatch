import { healthCheck, protectedRoute } from '@/controller/base-controller';
import { requireUserSession } from '@/middleware/auth';
import express, { type Router } from 'express';
import projectRoutes from './project-routes';
import subtaskRoutes from './subtask-routes';
import taskRoutes from './task-routes';

const router: Router = express.Router();

// Health check endpoint
router.get('/health', healthCheck);

// Protected demo route
router.get('/protected', requireUserSession, protectedRoute);

// Mount resource routes
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/subtasks', subtaskRoutes);

export default router;
