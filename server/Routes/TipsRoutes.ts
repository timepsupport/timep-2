import express from 'express'
import { deleteTip, generateTip } from '../controllers/TipController';
import { getUsersTips } from '../controllers/UserController';
import { generateLimiter } from '../middlewares/RateLimiter.js';
import { validateGenerate, validateTipId } from '../middlewares/Validate.js';

const TipRouter = express.Router();

// ── Generate — rate limited + validated ──
TipRouter.post('/generate', generateLimiter, validateGenerate, generateTip)

// ── Delete — validate MongoDB ID ──
TipRouter.delete('/delete/:id', validateTipId, deleteTip)

// ── User tips ──
TipRouter.get('/user/tips', getUsersTips)

export default TipRouter;