import * as profileHandlers from 'app/handlers/profile/profile.js';
import { requireAuth } from 'app/middleware/requireAuth/requireAuth.js';
import { asyncHandler } from 'app/utils/asyncHandler.js';
import express from 'express';

const profileRouter = express.Router();

profileRouter.use(requireAuth);
profileRouter.get('/', asyncHandler(profileHandlers.getProfile));
profileRouter.put('/', asyncHandler(profileHandlers.updateProfile));

export { profileRouter };
