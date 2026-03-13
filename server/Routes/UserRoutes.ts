import express from 'express';
import {
  getTipbyId, getUsersTips, getCredits, getAnalytics,
  getReviews, markReviewed, assignGroup,
  createFolder, getFolders, deleteFolder
} from '../controllers/UserController';

const UserRouter = express.Router();

UserRouter.get('/tips', getUsersTips)
UserRouter.get('/tip/:id', getTipbyId)
UserRouter.get('/credits', getCredits)
UserRouter.get('/analytics', getAnalytics)
UserRouter.get('/reviews', getReviews)
UserRouter.post('/review/:id', markReviewed)
UserRouter.post('/tip/:id/group', assignGroup)
UserRouter.post('/folders', createFolder)
UserRouter.get('/folders', getFolders)
UserRouter.delete('/folders/:id', deleteFolder)



export default UserRouter;
