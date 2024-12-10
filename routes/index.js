import express from 'express';
import AppController from '../controllers/AppController';
import AuthController from '../controllers/AuthController';
import UsersController from '../controllers/UsersController';
import FilesController from '../controllers/FilesController';
import { basicAuthenticate, xTokenAuthenticate } from '../middlewares/auth';
import { APIError, errorResponse } from '../middlewares/error';

/**
 * Injects routes into the Express application
 * @param {Express} app - The Express application instance
 */
const injectRoutes = (app) => {
  // Application status routes
  app.get('/status', AppController.getStatus);
  app.get('/stats', AppController.getStats);

  // Authentication routes
  app.get('/connect', basicAuthenticate, AuthController.getConnect);
  app.get('/disconnect', xTokenAuthenticate, AuthController.getDisconnect);

  // User routes
  app.post('/users', UsersController.postNew);
  app.get('/users/me', xTokenAuthenticate, UsersController.getMe);

  // File management routes
  app.post('/files', xTokenAuthenticate, FilesController.postUpload);
  app.get('/files/:id', xTokenAuthenticate, FilesController.getShow);
  app.get('/files', xTokenAuthenticate, FilesController.getIndex);
  app.put('/files/:id/publish', xTokenAuthenticate, FilesController.putPublish);
  app.put('/files/:id/unpublish', xTokenAuthenticate, FilesController.putUnpublish);
  app.get('/files/:id/data', xTokenAuthenticate, FilesController.getFile);

  // Handle invalid routes
  app.all('*', (req, res, next) => {
    errorResponse(new APIError(404, `Cannot ${req.method} ${req.url}`), req, res, next);
  });

  // Global error handling middleware
  app.use(errorResponse);
};

export default injectRoutes;