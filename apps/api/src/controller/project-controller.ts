import { Request, Response, NextFunction, type RequestHandler } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db/index';
import { project } from '@/db/schema';
import { AppError } from '@/lib/app-error';
import { catchAsync } from '@/lib/catch-async';

// Get all projects (only id and name)
export const getAllProjects: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    const projects = await db
      .select({
        id: project.id,
        name: project.name,
      })
      .from(project)
      .where(eq(project.userId, req.user.id));

    res.status(200).json({
      status: 'success',
      results: projects.length,
      data: {
        projects,
      },
    });
  }
);

// Get single project (all fields)
export const getProject: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    const { id } = req.params;

    const projectData = await db
      .select()
      .from(project)
      .where(and(eq(project.id, id), eq(project.userId, req.user.id)))
      .limit(1);

    if (projectData.length === 0) {
      return next(new AppError('Project not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        project: projectData[0],
      },
    });
  }
);

// Create project
export const createProject: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    const { name, description, defaultBillable, defaultRate } = req.body;

    if (!name) {
      return next(new AppError('Project name is required', 400));
    }

    const newProject = await db
      .insert(project)
      .values({
        userId: req.user.id,
        name,
        description: description || null,
        defaultBillable: defaultBillable || false,
        defaultRate: defaultRate || '0',
      })
      .returning();

    res.status(201).json({
      status: 'success',
      data: {
        project: newProject[0],
      },
    });
  }
);

// Update project
export const updateProject: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    const { id } = req.params;
    const { name, description, defaultBillable, defaultRate } = req.body;

    // Check if project exists and belongs to user
    const existingProject = await db
      .select()
      .from(project)
      .where(and(eq(project.id, id), eq(project.userId, req.user.id)))
      .limit(1);

    if (existingProject.length === 0 || !Array.isArray(existingProject)) {
      return next(new AppError('Project not found', 404));
    }

    const updatedProject = await db
      .update(project)
      .set({
        name: name || existingProject[0].name,
        description:
          description !== undefined
            ? description
            : existingProject[0].description,
        defaultBillable:
          defaultBillable !== undefined
            ? defaultBillable
            : existingProject[0].defaultBillable,
        defaultRate:
          defaultRate !== undefined
            ? defaultRate
            : existingProject[0].defaultRate,
        updatedAt: new Date(),
      })
      .where(and(eq(project.id, id), eq(project.userId, req.user.id)))
      .returning();

    res.status(200).json({
      status: 'success',
      data: {
        project: updatedProject[0],
      },
    });
  }
);

// Delete project
export const deleteProject: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    const { id } = req.params;

    // Check if project exists and belongs to user
    const existingProject = await db
      .select()
      .from(project)
      .where(and(eq(project.id, id), eq(project.userId, req.user.id)))
      .limit(1);

    if (existingProject.length === 0) {
      return next(new AppError('Project not found', 404));
    }

    await db
      .delete(project)
      .where(and(eq(project.id, id), eq(project.userId, req.user.id)));

    res.status(204).json({
      status: 'success',
      data: null,
    });
  }
);
