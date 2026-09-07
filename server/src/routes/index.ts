import { Router } from 'express';
import { authRouter } from './auth.js';
import { meRouter, usersRouter } from './users.js';
import { projectsRouter } from './projects.js';
import { projectComponentsRouter, componentsRouter } from './components.js';
import { materialsOnComponentRouter, materialsRouter } from './materials.js';
import { budgetRouter } from './budget.js';
import { scheduleRouter } from './schedule.js';
import { personnelRouter } from './personnel.js';
import { dailyRecordsRouter } from './dailyRecords.js';
import { projectActivityRouter, historyRouter } from './activity.js';
import { notificationsRouter } from './notifications.js';
import { reportsRouter } from './reports.js';
import { settingsRouter } from './settings.js';
import { projectInvitationsRouter, invitationsRouter } from './invitations.js';

// Component-scoped domains nested under /components/:componentId/*
componentsRouter.use('/:componentId/materials', materialsOnComponentRouter);
componentsRouter.use('/:componentId/budget', budgetRouter);
componentsRouter.use('/:componentId/schedule', scheduleRouter);
componentsRouter.use('/:componentId/personnel', personnelRouter);

// Project-scoped sub-resources nested under /projects/:projectId/*
projectsRouter.use('/:projectId/components', projectComponentsRouter);
projectsRouter.use('/:projectId/invitations', projectInvitationsRouter);
projectsRouter.use('/:projectId/daily-records', dailyRecordsRouter);
projectsRouter.use('/:projectId/activity', projectActivityRouter);
projectsRouter.use('/:projectId/reports', reportsRouter);

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/me', meRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/projects', projectsRouter);
apiRouter.use('/components', componentsRouter);
apiRouter.use('/materials', materialsRouter);
apiRouter.use('/invitations', invitationsRouter);
apiRouter.use('/notifications', notificationsRouter);
apiRouter.use('/settings', settingsRouter);
apiRouter.use('/history', historyRouter);
