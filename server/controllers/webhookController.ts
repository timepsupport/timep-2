import { Request, Response } from "express";
import { Webhook } from "svix";
import prisma from "../configs/prisma";

export const clerkWebhook = async (req: Request, res: Response) => {
  try {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
      console.log("❌ Missing CLERK_WEBHOOK_SECRET");
      return res.status(500).json({ message: "Missing CLERK_WEBHOOK_SECRET" });
    }

    const svix_id = req.headers["svix-id"] as string;
    const svix_timestamp = req.headers["svix-timestamp"] as string;
    const svix_signature = req.headers["svix-signature"] as string;

    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.log("❌ Missing svix headers");
      return res.status(400).json({ message: "Missing svix headers" });
    }

    const wh = new Webhook(WEBHOOK_SECRET);
    let evt: any;

    try {
      evt = wh.verify(req.body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err) {
      console.log("❌ Invalid webhook signature", err);
      return res.status(400).json({ message: "Invalid webhook signature" });
    }

    const { type, data } = evt;
    console.log(`✅ Webhook received: ${type}`);

    if (type === "user.created") {
  const email = data.email_addresses?.[0]?.email_address || `${data.id}@placeholder.com`;
  const userId = data.id;

await prisma.user.upsert({
  where: { id: userId },
  update: {},
  create: {
    id: userId,
    email,
    credits: 20,
    plan: "free",
  },
});

  console.log(`✅ User created: ${email} with 20 credits`);
}

    if (type === "user.deleted") {
      await prisma.user.delete({
        where: { id: data.id },
      });

      console.log(`🗑️ User deleted: ${data.id}`);
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error("❌ Webhook error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};