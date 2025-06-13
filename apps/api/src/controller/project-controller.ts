import { db } from '@/db/index';
import { AppError } from '@/lib/app-error';
import { catchAsync } from '@/lib/catch-async';
import { project } from '@repo/shared/db/schema';
import { and, eq } from 'drizzle-orm';
import { NextFunction, Request, Response, type RequestHandler } from 'express';

// Get all projects (only id and name)
export const getAllProjects: RequestHandler = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const projects = await db
      .select({
        id: project.id,
        name: project.name,
      })
      .from(project)
      .where(eq(project.userId, req.user!.id));

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
    const { id } = req.params;
    if (!id) {
      return next(new AppError('Project ID is required', 400));
    }

    const [projectData] = await db
      .select()
      .from(project)
      .where(and(eq(project.id, id), eq(project.userId, req.user!.id)))
      .limit(1);

    if (!projectData) {
      return next(new AppError('Project not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        project: projectData,
      },
    });
  }
);

// Create project
export const createProject: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, description, defaultBillable, defaultRate } = req.body;

    if (!name) {
      return next(new AppError('Project name is required', 400));
    }

    const [newProject] = await db
      .insert(project)
      .values({
        userId: req.user!.id,
        name,
        description: description || null,
        defaultBillable: defaultBillable || false,
        defaultRate: defaultRate || '0',
      })
      .returning();

    res.status(201).json({
      status: 'success',
      data: {
        project: newProject,
      },
    });
  }
);

// Update project
export const updateProject: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    if (!id) {
      return next(new AppError('Project ID is required', 400));
    }

    const { name, description, defaultBillable, defaultRate } = req.body;

    // Check if project exists and belongs to user
    const [existingProject] = await db
      .select()
      .from(project)
      .where(and(eq(project.id, id), eq(project.userId, req.user!.id)))
      .limit(1);

    if (!existingProject) {
      return next(new AppError('Project not found', 404));
    }

    const [updatedProject] = await db
      .update(project)
      .set({
        name: name || existingProject.name,
        description:
          description !== undefined ? description : existingProject.description,
        defaultBillable:
          defaultBillable !== undefined
            ? defaultBillable
            : existingProject.defaultBillable,
        defaultRate:
          defaultRate !== undefined ? defaultRate : existingProject.defaultRate,
        updatedAt: new Date(),
      })
      .where(and(eq(project.id, id), eq(project.userId, req.user!.id)))
      .returning();

    res.status(200).json({
      status: 'success',
      data: {
        project: updatedProject,
      },
    });
  }
);

// Delete project
export const deleteProject: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    if (!id) {
      return next(new AppError('Project ID is required', 400));
    }

    // Check if project exists and belongs to user
    const [existingProject] = await db
      .select()
      .from(project)
      .where(and(eq(project.id, id), eq(project.userId, req.user!.id)))
      .limit(1);

    if (!existingProject) {
      return next(new AppError('Project not found', 404));
    }

    await db
      .delete(project)
      .where(and(eq(project.id, id), eq(project.userId, req.user!.id)));

    res.status(204).json({
      status: 'success',
      data: null,
    });
  }
);
