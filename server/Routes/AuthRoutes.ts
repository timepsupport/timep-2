import express from 'express'
import { LoginUser, LogoutUser, registerUser, VerifyUser } from '../controllers/AuthControllers';
import protect from '../middlewares/auth';

const AuthRouter = express. Router();

AuthRouter.post('/register', registerUser)
AuthRouter.post('/login', LoginUser)
AuthRouter.get('/verify', protect, VerifyUser)
AuthRouter.post('/logout', protect, LogoutUser)

export default AuthRouter