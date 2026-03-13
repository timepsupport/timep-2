import { Request, Response } from 'express';
import DailyBoost from '../models/DailyBoost';
import UserStreak from '../models/Userstreak';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5,
].filter(Boolean) as string[];

const generateWithRotation = async (prompt: string): Promise<string> => {
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_KEYS[i]);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err: any) {
      console.warn(`⚠️ Gemini key ${i + 1} failed: ${err.message}`);
    }
  }
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 2000, temperature: 0.7,
  });
  return response.choices[0].message.content || "";
};

const getClerkUserId = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  if (!token) return null;
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).sub;
  } catch { return null; }
};

const MONTHLY_TOPICS = [
  "Fibrillation auriculaire", "Insuffisance cardiaque", "Méningite bactérienne",
  "Pneumonie communautaire", "Diabète type 2", "Insuffisance rénale aiguë",
  "Anémie ferriprive", "Thrombose veineuse profonde", "Embolie pulmonaire",
  "AVC ischémique", "Infarctus du myocarde", "Hypertension artérielle",
  "Asthme bronchique", "BPCO", "Cirrhose hépatique", "Pancréatite aiguë",
  "Appendicite aiguë", "Sepsis", "Choc anaphylactique", "Épilepsie",
  "Hypothyroïdie", "Hyperthyroïdie", "Lupus érythémateux", "Polyarthrite rhumatoïde",
  "Leucémie aiguë", "Lymphome de Hodgkin", "Mélanome", "Psoriasis",
  "Schizophrénie", "Dépression majeure"
];

// Générer le boost du jour si pas encore créé
export const generateDailyBoost = async () => {
  const today = new Date().toISOString().split('T')[0];
  const existing = await DailyBoost.findOne({ date: today });
  if (existing) return existing;

  const dayOfMonth = new Date().getDate() - 1;
  const topic = MONTHLY_TOPICS[dayOfMonth % MONTHLY_TOPICS.length];
  const specialty = await detectSpecialty(topic);

  const prompt = `You are Timep AI, a medical learning assistant.

Generate a Daily Brain Boost for medical students about: "${topic}"

Respond ONLY with this exact JSON format, no markdown, no extra text:
{
  "title": "short engaging title",
  "content": "clear educational explanation in 3-4 sentences, mention key clinical points",
  "quiz": [
    {
      "question": "clinical question about ${topic}",
      "options": ["option A", "option B", "option C", "option D"],
      "correctIndex": 0,
      "explanation": "why this answer is correct"
    },
    {
      "question": "second question about ${topic}",
      "options": ["option A", "option B", "option C", "option D"],
      "correctIndex": 1,
      "explanation": "why this answer is correct"
    },
    {
      "question": "third question about ${topic}",
      "options": ["option A", "option B", "option C", "option D"],
      "correctIndex": 2,
      "explanation": "why this answer is correct"
    }
  ]
}`;

  const raw = await generateWithRotation(prompt);
  const clean = raw.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean);

  const boost = await DailyBoost.create({
    date: today,
    specialty,
    title: parsed.title,
    content: parsed.content,
    quiz: parsed.quiz,
  });

  console.log(`✅ Daily Boost generated: ${parsed.title}`);
  return boost;
};

const detectSpecialty = async (topic: string): Promise<string> => {
  const SPECIALTIES = [
    "Cardiologie", "Neurologie", "Pharmacologie", "Pneumologie",
    "Gastroentérologie", "Néphrologie", "Endocrinologie", "Infectiologie",
    "Hématologie", "Rhumatologie", "Chirurgie", "Pédiatrie",
    "Gynécologie", "Psychiatrie", "Dermatologie", "Urgences",
    "Anatomie", "Biochimie", "Physiologie", "Immunologie",
    "Ophtalmologie", "ORL", "Urologie", "Oncologie", "Radiologie"
  ];
  try {
    const result = await generateWithRotation(
      `Classify "${topic}" into one of: ${SPECIALTIES.join(", ")}. Reply with ONLY the specialty name.`
    );
    const cleaned = result.trim().replace(/['"]/g, '');
    return SPECIALTIES.includes(cleaned) ? cleaned : "General";
  } catch { return "General"; }
};

// GET /api/boost/today
export const getTodayBoost = async (req: Request, res: Response) => {
  try {
    const boost = await generateDailyBoost();
    res.json({ boost });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/boost/complete
export const completeBoost = async (req: Request, res: Response) => {
  try {
    const userId = getClerkUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const today = new Date().toISOString().split('T')[0];

    let streak = await UserStreak.findOne({ userId });
    if (!streak) {
      streak = await UserStreak.create({ userId, currentStreak: 0, longestStreak: 0, completedDates: [] });
    }

    // Déjà complété aujourd'hui
    if (streak.completedDates.includes(today)) {
      return res.json({ streak: streak.currentStreak, alreadyDone: true });
    }

    // Calculer le nouveau streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const newStreak = streak.lastCompletedDate === yesterdayStr
      ? streak.currentStreak + 1
      : 1;

    const longestStreak = Math.max(newStreak, streak.longestStreak);

    await UserStreak.findOneAndUpdate(
      { userId },
      {
        currentStreak: newStreak,
        longestStreak,
        lastCompletedDate: today,
        $push: { completedDates: today }
      }
    );

    res.json({ streak: newStreak, longestStreak, isNew: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/boost/streak
export const getStreak = async (req: Request, res: Response) => {
  try {
    const userId = getClerkUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const today = new Date().toISOString().split('T')[0];
    const streak = await UserStreak.findOne({ userId });

    if (!streak) return res.json({ currentStreak: 0, longestStreak: 0, completedToday: false });

    res.json({
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      completedToday: streak.completedDates.includes(today),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};