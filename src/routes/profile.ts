import * as profileHandlers from 'app/handlers/profile/profile.js';
import { requireAuth } from 'app/middleware/requireAuth/requireAuth.js';
import express from 'express';

const profileRouter = express.Router();

profileRouter.use(requireAuth);
profileRouter.get('/', profileHandlers.getProfile);
profileRouter.put('/', profileHandlers.updateProfile);

export { profileRouter };
