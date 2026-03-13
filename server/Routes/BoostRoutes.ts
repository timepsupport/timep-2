import express from 'express';
import { getTodayBoost, completeBoost, getStreak } from '../controllers/BoostController';

const BoostRouter = express.Router();

BoostRouter.get('/today', getTodayBoost);
BoostRouter.post('/complete', completeBoost);
BoostRouter.get('/streak', getStreak);

export default BoostRouter;