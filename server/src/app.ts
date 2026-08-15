import path from 'node:path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authRouter } from './modules/auth/auth.routes';
import { certificateTemplatesRouter } from './modules/certificateTemplates/certificateTemplates.routes';
import { dashboardRouter } from './modules/dashboard/dashboard.routes';
import { eventsRouter } from './modules/events/events.routes';
import { organizationRouter } from './modules/organization/organization.routes';
import { verifyRouter } from './modules/verify/verify.routes';

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
    });
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/uploads/logos', express.static(path.join(env.STORAGE_DIR, 'logos')));

  app.use('/api/auth', authRouter);
  app.use('/api/events', eventsRouter);
  app.use('/api/certificate-templates', certificateTemplatesRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/organization', organizationRouter);
  app.use('/api/verify', verifyRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
