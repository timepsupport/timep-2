import cron from 'node-cron';
import prisma from './prisma';
import Tip from '../models/Tip';
import { Resend } from 'resend';
import { generateDailyBoost } from '../controllers/BoostController';
import fs from 'fs';

const resend = new Resend(process.env.RESEND_API_KEY);
const FLAG_FILE = './last_reset.txt';

// ── Vérifie au démarrage si le reset a été fait aujourd'hui ──
const checkAndResetCredits = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const lastResetDate = fs.existsSync(FLAG_FILE) ? fs.readFileSync(FLAG_FILE, 'utf8').trim() : '';

    if (lastResetDate === today) {
      console.log('✅ Startup check: Credits already reset today');
      return;
    }

    const result = await prisma.user.updateMany({
      where: { credits: { lt: 20 } },
      data: { credits: 20 }
    });

    fs.writeFileSync(FLAG_FILE, today);
    console.log(`✅ Startup check: Credits reset for ${result.count} users`);
  } catch (error) {
    console.error('❌ Startup credit check failed:', error);
  }
};

// ── Vérifie au démarrage si le Daily Boost du jour existe ──
const checkAndGenerateDailyBoost = async () => {
  try {
    await generateDailyBoost();
    console.log('✅ Startup check: Daily Boost ready');
  } catch (error) {
    console.error('❌ Startup Daily Boost check failed:', error);
  }
};

// ── Lancer les vérifications au démarrage ──
checkAndResetCredits();
checkAndGenerateDailyBoost();

// ── Reset crédits chaque jour à minuit ──
cron.schedule('0 0 * * *', async () => {
  const today = new Date().toISOString().split('T')[0];
  await prisma.user.updateMany({ data: { credits: 20 } });
  fs.writeFileSync(FLAG_FILE, today);
  console.log('✅ Credits reset for all users');
});

// ── Générer le Daily Boost à minuit ──
cron.schedule('0 0 * * *', async () => {
  await generateDailyBoost();
  console.log('✅ Daily Boost generated');
});

// ── Email de rappel chaque jour à 8h ──
cron.schedule('0 8 * * *', async () => {
  console.log('📧 Sending review reminders...');

  try {
    const users = await prisma.user.findMany();

    for (const user of users) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const tipsToReview = await Tip.find({
        userId: user.id,
        nextReviewDate: { $lte: today }
      }).limit(5);

      if (tipsToReview.length === 0) continue;

      const bySpecialty = tipsToReview.reduce((acc: Record<string, string[]>, tip) => {
        const s = (tip as any).specialty || 'General';
        if (!acc[s]) acc[s] = [];
        acc[s].push(tip.title);
        return acc;
      }, {});

      const specialtyLines = Object.entries(bySpecialty)
        .map(([specialty, titles]) => `
          <div style="margin-bottom:16px">
            <p style="font-weight:600;color:#f9a8d4;margin:0 0 6px 0">${specialty}</p>
            ${titles.map(t => `<p style="margin:0 0 4px 16px;color:#cbd5e1">• ${t}</p>`).join('')}
          </div>
        `).join('');

      const total = tipsToReview.length;

      await resend.emails.send({
        from: 'Timep AI <reminders@timep.ai>',
        to: user.email,
        subject: `🧠 You have ${total} tip${total > 1 ? 's' : ''} to review today`,
        html: `
          <div style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:40px;max-width:520px;margin:0 auto;border-radius:16px">
            <img src="https://timep.ai/logo-timep.svg" alt="Timep AI" style="height:36px;margin-bottom:24px;filter:brightness(0) invert(1)" />
            <h1 style="font-size:22px;font-weight:700;margin:0 0 8px 0">Time to review! 🔥</h1>
            <p style="color:#94a3b8;margin:0 0 24px 0">
              You have <strong style="color:#f472b6">${total} tip${total > 1 ? 's' : ''}</strong> waiting for review today.
            </p>
            <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:24px">
              ${specialtyLines}
            </div>
            <a href="https://timep.ai/analytics" 
               style="display:inline-block;background:#db2777;color:white;padding:12px 28px;border-radius:50px;font-weight:600;text-decoration:none;font-size:14px">
              Review Now →
            </a>
            <p style="color:#475569;font-size:12px;margin-top:32px">
              Timep AI · Medical Learning Platform<br/>
              <a href="https://timep.ai/unsubscribe" style="color:#475569">Unsubscribe</a>
            </p>
          </div>
        `
      });

      console.log(`✅ Email sent to ${user.email} (${total} tips)`);
    }
  } catch (error) {
    console.error('❌ Error sending review emails:', error);
  }
});