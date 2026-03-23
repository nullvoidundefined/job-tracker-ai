import express from "express";

import * as profileHandlers from "app/handlers/profile/profile.js";
import { requireAuth } from "app/middleware/requireAuth/requireAuth.js";

const profileRouter = express.Router();

profileRouter.use(requireAuth);
profileRouter.get("/", profileHandlers.getProfile);
profileRouter.put("/", profileHandlers.updateProfile);

export { profileRouter };
