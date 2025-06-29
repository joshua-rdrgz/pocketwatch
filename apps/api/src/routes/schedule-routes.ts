import { getSchedule } from '@/controller/schedule-controller';
import { requireUserSession } from '@/middleware/auth';
import express, { type Router } from 'express';

const router: Router = express.Router();

// All schedule routes require authentication
router.use(requireUserSession);

// Schedule routes (BASE: /api/schedule)
router.route('/').get(getSchedule);

export default router;
