import { Request, Response } from 'express';
import Tip from '../models/Tip';
import Folder from '../models/Folder';
import prisma from '../configs/prisma';

const getClerkUserId = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  if (!token) return null;
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).sub;
  } catch {
    return null;
  }
};

const REVIEW_INTERVALS = [1, 3, 7, 14, 30];

export const getUsersTips = async (req: Request, res: Response) => {
  try {
    const userId = getClerkUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const tips = await Tip.find({ userId }).sort({ createdAt: -1 });
    res.json({ tips });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getTipbyId = async (req: Request, res: Response) => {
  try {
    const userId = getClerkUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const { id } = req.params;
    const tip = await Tip.findOne({ _id: id });
    res.json({ tip });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCredits = async (req: Request, res: Response) => {
  try {
    const userId = getClerkUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ credits: user.credits });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = getClerkUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const tips = await Tip.find({ userId }).sort({ createdAt: -1 });
    const totalTips = tips.length;

    const byType: Record<string, number> = {};
    tips.forEach(tip => {
      byType[tip.type] = (byType[tip.type] || 0) + 1;
    });

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const byDay = last7Days.map(day => ({
      day: new Date(day).toLocaleDateString('en', { weekday: 'short' }),
      tips: tips.filter(t => new Date(t.createdAt).toISOString().split('T')[0] === day).length
    }));

    let streak = 0;
    for (let i = 0; i < last7Days.length; i++) {
      const day = last7Days[last7Days.length - 1 - i];
      const hasTip = tips.some(t => new Date(t.createdAt).toISOString().split('T')[0] === day);
      if (hasTip) streak++;
      else break;
    }

    const topTypes = Object.entries(byType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    res.json({ totalTips, byType, byDay, streak, topTypes });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getReviews = async (req: Request, res: Response) => {
  try {
    const userId = getClerkUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const tips = await Tip.find({
      userId,
      nextReviewDate: { $lte: today }
    }).sort({ nextReviewDate: 1 });

    res.json({ reviews: tips, count: tips.length });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const markReviewed = async (req: Request, res: Response) => {
  try {
    const userId = getClerkUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const { id } = req.params;
    const tip = await Tip.findOne({ _id: id, userId });
    if (!tip) return res.status(404).json({ message: "Tip not found" });

    const reviewCount = (tip.reviewCount || 0) + 1;
    const interval = REVIEW_INTERVALS[Math.min(reviewCount, REVIEW_INTERVALS.length - 1)];
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    await Tip.findByIdAndUpdate(id, { reviewCount, nextReviewDate });
    res.json({ success: true, nextReviewDate, interval });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const assignGroup = async (req: Request, res: Response) => {
  try {
    const userId = getClerkUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const { id } = req.params;
    const { group } = req.body;

    await Tip.findOneAndUpdate({ _id: id, userId }, { group });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createFolder = async (req: Request, res: Response) => {
  try {
    const userId = getClerkUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const { name, specialty } = req.body;
    if (!name || !specialty) return res.status(400).json({ message: "Name and specialty required" });

    const existing = await Folder.findOne({ userId, name, specialty });
    if (existing) return res.status(400).json({ message: "Folder already exists" });

    const folder = await Folder.create({ userId, name, specialty });
    res.json({ folder });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getFolders = async (req: Request, res: Response) => {
  try {
    const userId = getClerkUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const { specialty } = req.query;
    const folders = await Folder.find({
      userId,
      ...(specialty ? { specialty: specialty as string } : {})
    }).sort({ createdAt: -1 });

    res.json({ folders });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteFolder = async (req: Request, res: Response) => {
  try {
    const userId = getClerkUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const { id } = req.params;
    const folder = await Folder.findOneAndDelete({ _id: id, userId });
    if (folder) {
      await Tip.updateMany({ userId, group: folder.name }, { $unset: { group: 1 } });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
