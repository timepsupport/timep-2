import "dotenv/config";
import express, { Request, Response } from 'express';
import cors from 'cors'
import connectDB from "./configs/db";
import session from 'express-session'
import MongoStore from 'connect-mongo'
import AuthRouter from "./Routes/AuthRoutes";
import TipRouter from "./Routes/TipsRoutes";
import UserRouter from "./Routes/UserRoutes";
import webhookRoutes from "./Routes/webhookRoutes";
import './configs/cronJobs';
import BoostRouter from './Routes/BoostRoutes';
import { globalLimiter, contactLimiter } from "./middlewares/RateLimiter.js";
import { validateContact } from "./middlewares/Validate.js";

declare module 'express-session' {
    interface SessionData {
        isLoggedIn: boolean;
        userId: string;
    }
}

connectDB();

const app = express();

// ── Global rate limiter — 100 req / 15min / IP ──
app.use(globalLimiter);

// ⚠️ WEBHOOK AVANT TOUT — doit être avant express.json()
app.use("/api/webhook", express.raw({ type: "application/json" }), webhookRoutes);

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}))

app.use(session({
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 },
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URL as string,
        collectionName: 'sessions',
    })
}))

app.use(express.json())
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Auth: ${req.headers.authorization ? 'YES' : 'NO'}`);
  next();
});

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});

app.use('/api/auth', AuthRouter)
app.use('/api/tip', TipRouter)
app.use('/api/user', UserRouter)
app.use('/api/boost', BoostRouter)

const port = process.env.PORT || 3000;

import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

// ── Contact route — rate limited + validated ──
app.post('/api/contact', contactLimiter, validateContact, async (req: Request, res: Response) => {
  const { name, email, message } = req.body;
  await resend.emails.send({
    from: 'Timep <onboarding@resend.dev>',
    to: 'saraakamar123@gmail.com',
    subject: `[Timep] Message from ${name}`,
    html: `<p><b>From:</b> ${name} (${email})</p><p>${message}</p>`
  });
  res.json({ success: true });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});