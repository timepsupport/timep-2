import { Request, Response } from "express";
import prisma from "../configs/prisma";
import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ── Clients ──
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Spécialités médicales ──
const SPECIALTIES = [
  "Cardiologie", "Neurologie", "Pharmacologie", "Pneumologie",
  "Gastroentérologie", "Néphrologie", "Endocrinologie", "Infectiologie",
  "Hématologie", "Rhumatologie", "Chirurgie", "Pédiatrie",
  "Gynécologie", "Psychiatrie", "Dermatologie", "Urgences",
  "Anatomie", "Biochimie", "Physiologie", "Immunologie",
  "Ophtalmologie", "ORL", "Urologie", "Oncologie", "Radiologie"
];

const detectSpecialty = async (title: string): Promise<string> => {
  try {
    const prompt = `You are a medical classifier. Given this medical topic: "${title}"
    
Classify it into exactly ONE of these specialties:
${SPECIALTIES.join(", ")}

If none match, respond with "General".
Respond with ONLY the specialty name, nothing else.`;

    const specialty = await generateWithRotation(prompt);
    const cleaned = specialty.trim().replace(/['"]/g, '');
    return SPECIALTIES.includes(cleaned) ? cleaned : "General";
  } catch {
    return "General";
  }
};

// ── Rotation : Gemini (6 clés) → Groq ──
const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5,
  process.env.GEMINI_API_KEY_6,
].filter(Boolean) as string[];

const generateWithRotation = async (prompt: string): Promise<string> => {
  // 1. Try each Gemini key in order
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_KEYS[i]);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      console.log(`✅ Gemini key ${i + 1} used`);
      return result.response.text();
    } catch (err: any) {
      console.warn(`⚠️ Gemini key ${i + 1} failed: ${err.message}`);
    }
  }

  // 2. Fallback to Groq
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "Tu es Timep AI, un assistant d'apprentissage médical. Réponds TOUJOURS en français. Suis les instructions EXACTEMENT. Retourne UNIQUEMENT ce qui est demandé. Pas de texte supplémentaire."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });
    console.log("✅ Groq used");
    return response.choices[0].message.content || "";
  } catch (groqError: any) {
    console.error("❌ All providers failed:", groqError.message);
    throw new Error("All AI providers failed. Please try again later.");
  }
};

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
import Tip from "../models/Tip";
import { GenerateContentConfig, HarmBlockThreshold, HarmCategory } from "@google/genai";
import ai from "../configs/ai";

// ─────────────────────────────────────────────
// 🔑 TYPE NORMALIZER — ROOT FIX
// Maps any frontend label to the correct stylePrompts key
// "Chunking Strategy" → "chunking_strategy", "Mnemonic" → "mnemonic", etc.
// ─────────────────────────────────────────────
const normalizeType = (type: string): string => {
  return type.toLowerCase().trim().replace(/[\s\-]+/g, "_");
};

// ─────────────────────────────────────────────
// 🔒 SECURITY
// ─────────────────────────────────────────────
const sanitizeHtml = (html: string): string => {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<script[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]*/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[^>]*>/gi, "");
};

const sanitizeSvg = (svg: string): string => {
  return svg
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<script[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]*/gi, "")
    .replace(/javascript\s*:/gi, "");
};

// ─────────────────────────────────────────────
// 🎨 ILLUSTRATION FALLBACK
// ─────────────────────────────────────────────
const textToIllustrationSvg = (rawText: string, title: string): string => {
  const lines = rawText
    .split("\n")
    .map(l => l.replace(/^\*+\s*/, "").replace(/^-+\s*/, "").replace(/^•\s*/, "").trim())
    .filter(l => l.length > 4 && !/^(visual anchor|revision prompt|illustration|learning tip)/i.test(l));

  const pairs: { label: string; desc: string }[] = lines.map(line => {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0 && colonIdx < 40) {
      return { label: line.slice(0, colonIdx).trim(), desc: line.slice(colonIdx + 1).trim() };
    }
    return { label: "", desc: line };
  }).filter(p => p.desc.length > 2);

  const W = 560;
  const PADDING = 24;
  const CARD_H = 60;
  const GAP = 14;
  const titleH = 50;
  const totalH = titleH + PADDING + pairs.length * (CARD_H + GAP) + PADDING;
  const colors = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

  const escapeXml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const wrapText = (text: string, maxChars = 55): string[] => {
    const words = text.split(" ");
    const result: string[] = [];
    let current = "";
    for (const word of words) {
      if ((current + " " + word).trim().length > maxChars) {
        if (current) result.push(current.trim());
        current = word;
      } else {
        current = (current + " " + word).trim();
      }
    }
    if (current) result.push(current.trim());
    return result;
  };

  let cardsHtml = "";
  let y = titleH + PADDING;

  pairs.forEach((pair, i) => {
    const color = colors[i % colors.length];
    const descLines = wrapText(escapeXml(pair.desc));
    const cardHeight = Math.max(CARD_H, 20 + descLines.length * 16 + 10);
    cardsHtml += `
  <rect x="${PADDING}" y="${y}" width="${W - PADDING * 2}" height="${cardHeight}" rx="10" fill="#1e293b" stroke="${color}" stroke-width="1.5"/>
  ${pair.label ? `<rect x="${PADDING}" y="${y}" width="160" height="${cardHeight}" rx="10" fill="${color}" opacity="0.15"/>
  <text x="${PADDING + 12}" y="${y + cardHeight / 2 + 5}" fill="${color}" font-size="12" font-family="sans-serif" font-weight="700">${escapeXml(pair.label)}</text>` : ""}
  ${descLines.map((line, li) =>
    `<text x="${pair.label ? PADDING + 172 : PADDING + 14}" y="${y + 20 + li * 16}" fill="#e2e8f0" font-size="12" font-family="sans-serif">${line}</text>`
  ).join("")}
  <circle cx="${PADDING + 8}" cy="${y + cardHeight / 2}" r="5" fill="${color}"/>`;
    y += cardHeight + GAP;
  });

  const lineEnd = y - GAP;
  const lineStart = titleH + PADDING + CARD_H / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${Math.max(totalH, y + PADDING)}" style="width:100%;background:#0f172a;border-radius:12px;display:block;">
  <rect x="0" y="0" width="${W}" height="${titleH}" rx="12" fill="#6366f1" opacity="0.2"/>
  <rect x="0" y="${titleH - 12}" width="${W}" height="12" fill="#0f172a"/>
  <text x="${W / 2}" y="${titleH / 2 + 6}" fill="#a5b4fc" font-size="16" font-family="sans-serif" font-weight="bold" text-anchor="middle">${escapeXml(title)}</text>
  <line x1="${PADDING + 8}" y1="${lineStart}" x2="${PADDING + 8}" y2="${lineEnd}" stroke="#334155" stroke-width="1.5" stroke-dasharray="4,3"/>
  ${cardsHtml}
</svg>`;
};

// ─────────────────────────────────────────────
// 🎯 EMOJI MAP
// ─────────────────────────────────────────────
const emojiMap: { keywords: string[]; emoji: string }[] = [
  { keywords: ["heart", "cardiac", "cardio", "myocard", "coronary"], emoji: "❤️" },
  { keywords: ["pericardium", "pericarditis", "pericardial"], emoji: "🫀" },
  { keywords: ["lung", "pulmonary", "pneumo", "respiratory", "breath", "airway", "pleural", "pneumothorax"], emoji: "🫁" },
  { keywords: ["pain", "chest pain", "ache", "sharp", "angina", "pleuritic", "discomfort"], emoji: "⚡" },
  { keywords: ["fever", "temperature", "febrile", "hyperthermia"], emoji: "🌡️" },
  { keywords: ["inflammation", "inflammatory", "redness", "swelling", "edema"], emoji: "🔴" },
  { keywords: ["infection", "virus", "viral", "bacterial", "bacteria", "fungal", "pathogen", "microbial"], emoji: "🦠" },
  { keywords: ["blood", "hemorrhage", "bleeding", "hematoma", "hemoglobin", "hemothorax"], emoji: "🩸" },
  { keywords: ["medication", "drug", "pill", "nsaid", "ibuprofen", "aspirin", "treatment", "therapy", "medicine", "colchicine", "statin"], emoji: "💊" },
  { keywords: ["injection", "needle", "syringe", "iv", "intravenous", "heparin", "anticoagulant"], emoji: "💉" },
  { keywords: ["surgery", "surgical", "operation", "procedure", "incision", "pericardiectomy", "thoracostomy", "pleurodesis"], emoji: "🔪" },
  { keywords: ["ecg", "ekg", "electrocardiogram", "st elevation", "arrhythmia", "rhythm", "tachycardia", "bradycardia"], emoji: "📈" },
  { keywords: ["ultrasound", "echo", "echocardiogram", "imaging", "mri", "ct scan", "xray", "x-ray", "chest x-ray", "cxr", "radiograph"], emoji: "🩻" },
  { keywords: ["lab", "laboratory", "blood test", "troponin", "crp", "esr", "biomarker", "enzyme", "marker"], emoji: "🧪" },
  { keywords: ["bacteria", "antibiotic", "microbiology", "culture", "microscop"], emoji: "🔬" },
  { keywords: ["autoimmune", "lupus", "rheumatoid", "sle", "immune", "antibody", "immunosuppressant"], emoji: "🧬" },
  { keywords: ["cancer", "malignancy", "tumor", "metastasis", "oncology", "lymphoma"], emoji: "🎗️" },
  { keywords: ["kidney", "renal", "uremia", "dialysis", "nephr"], emoji: "🫘" },
  { keywords: ["brain", "neuro", "stroke", "cerebral", "neurological", "cranial"], emoji: "🧠" },
  { keywords: ["bone", "fracture", "skeleton", "orthopedic", "rib", "calcium"], emoji: "🦴" },
  { keywords: ["skin", "rash", "dermatology", "subcutaneous", "dermatitis", "cyanosis"], emoji: "🩹" },
  { keywords: ["warning", "emergency", "critical", "danger", "urgent", "tamponade", "tension", "life-threatening"], emoji: "⚠️" },
  { keywords: ["check", "normal", "resolved", "success", "recovery", "healed", "discharge"], emoji: "✅" },
  { keywords: ["fluid", "effusion", "ascites", "exudate", "transudate", "drainage", "decompression"], emoji: "💧" },
  { keywords: ["dyspnea", "shortness of breath", "tachypnea", "hypoxia", "oxygen", "breathless"], emoji: "😮‍💨" },
  { keywords: ["nausea", "vomiting", "gastrointestinal", "diarrhea", "gi", "abdominal"], emoji: "🤢" },
  { keywords: ["fatigue", "weakness", "malaise", "tired", "lethargy"], emoji: "😴" },
  { keywords: ["trauma", "injury", "wound", "penetrating", "blunt", "accident"], emoji: "🤕" },
  { keywords: ["diet", "nutrition", "food", "obesity", "weight", "bmi"], emoji: "🥗" },
  { keywords: ["exercise", "rehabilitation", "cardiac rehab", "physical therapy", "activity"], emoji: "🏃" },
  { keywords: ["smoking", "tobacco", "cigarette", "nicotine"], emoji: "🚬" },
  { keywords: ["diabetes", "glucose", "insulin", "glycemic", "hyperglycemia"], emoji: "🍬" },
  { keywords: ["hypertension", "blood pressure", "hypertensive", "hypotension"], emoji: "📊" },
  { keywords: ["cholesterol", "lipid", "dyslipidemia", "triglyceride", "atherosclerosis"], emoji: "🫙" },
  { keywords: ["aorta", "aortic", "valve", "mitral", "stenosis", "regurgitation", "tricuspid"], emoji: "🔄" },
  { keywords: ["thrombosis", "clot", "thrombus", "embolism", "dvt", "pe", "pulmonary embolism"], emoji: "🩺" },
  { keywords: ["hospital", "icu", "intensive care", "admission", "hospitalization"], emoji: "🏥" },
  { keywords: ["diagnosis", "diagnose", "differential", "workup", "assessment"], emoji: "🔍" },
  { keywords: ["prognosis", "outcome", "mortality", "survival", "recurrence", "complication"], emoji: "📋" },
  { keywords: ["prevention", "prophylaxis", "vaccine", "vaccination", "protective"], emoji: "🛡️" },
  { keywords: ["pathophysiology", "mechanism", "pathology", "process"], emoji: "⚙️" },
  { keywords: ["anatomy", "structure", "location", "position", "layer"], emoji: "📍" },
  { keywords: ["friction", "rub", "sound", "murmur", "auscultation", "breath sound"], emoji: "👂" },
  { keywords: ["trachea", "tracheal", "mediastin", "shift", "deviation"], emoji: "↔️" },
  { keywords: ["spontaneous", "primary", "secondary", "idiopathic"], emoji: "❓" },
  { keywords: ["oxygen", "hypoxemia", "saturation", "spo2", "o2"], emoji: "💨" },
  { keywords: ["dressler", "post-mi", "post mi", "autoimmune pericarditis"], emoji: "🔁" },
  { keywords: ["definition", "what is", "overview", "introduction", "concept"], emoji: "📖" },
  { keywords: ["cause", "etiology", "risk factor", "predispos"], emoji: "🎯" },
  { keywords: ["sign", "symptom", "presentation", "clinical", "manifestation"], emoji: "🩺" },
  { keywords: ["management", "treatment plan", "approach", "protocol"], emoji: "📝" },
];

const getEmoji = (text: string): string => {
  const lower = text.toLowerCase();
  for (const entry of emojiMap) {
    if (entry.keywords.some(k => lower.includes(k))) return entry.emoji;
  }
  return "🔹";
};

// ─────────────────────────────────────────────
// 🔧 FLOWCHART HTML BUILDER
// ─────────────────────────────────────────────
const buildFlowchartHtml = (steps: string[]): string => {
  if (steps.length === 0) return "";

  const arrow =
    "<div style=\"display:flex;flex-direction:column;align-items:center;gap:2px;margin:4px 0;\">" +
    "<div style=\"width:2px;height:20px;background:#6366f1;\"></div>" +
    "<div style=\"width:0;height:0;border-left:9px solid transparent;border-right:9px solid transparent;border-top:12px solid #6366f1;\"></div>" +
    "</div>";

  const stepsHtml = steps.map((label: string, i: number) => {
    const isFirst = i === 0;
    const isLast = i === steps.length - 1;
    const bg = isFirst ? "#6366f1" : isLast ? "#10b981" : "#1e293b";
    const color = (isFirst || isLast) ? "white" : "#e2e8f0";
    const border = (!isFirst && !isLast) ? "border:1px solid #334155;" : "";
    const shadow = isFirst
      ? "box-shadow:0 2px 10px #6366f166;"
      : isLast ? "box-shadow:0 2px 10px #10b98166;" : "";
    return (
      "<div style=\"background:" + bg + ";color:" + color + ";padding:12px 28px;" +
      "border-radius:10px;font-weight:" + (isFirst || isLast ? "bold" : "normal") + ";" +
      "text-align:center;max-width:360px;width:100%;" + border + shadow + ";font-size:13px;line-height:1.5;\">" +
      label + "</div>" + (!isLast ? arrow : "")
    );
  }).join("");

  return sanitizeHtml(
    "<div style=\"display:flex;flex-direction:column;align-items:center;gap:0;font-family:sans-serif;padding:16px;width:100%;\">" +
    stepsHtml + "</div>"
  );
};

// ─────────────────────────────────────────────
// 🔧 UNIVERSAL FLOWCHART STEP EXTRACTOR
// ─────────────────────────────────────────────
const extractFlowchartSteps = (obj: any): string[] => {
  if (Array.isArray(obj)) {
    return obj.map((item: any) => {
      if (typeof item === "string") return item;
      const textFields = [
        "description", "step_description", "label", "title",
        "name", "text", "content", "node_label", "step_title"
      ];
      for (const field of textFields) {
        if (item[field] && typeof item[field] === "string" && item[field].length > 3) {
          return item[field].replace(/\n/g, " ").trim();
        }
      }
      for (const key of Object.keys(item)) {
        if (
          typeof item[key] === "string" &&
          item[key].length > 3 &&
          !key.includes("url") &&
          !key.includes("image") &&
          !key.includes("anchor") &&
          key !== "visual_anchor" &&
          key !== "anchor_image" &&
          key !== "id" &&
          key !== "type" &&
          key !== "source" &&
          key !== "target"
        ) {
          return item[key].replace(/\n/g, " ").trim();
        }
      }
      return "";
    }).filter((s: string) => s.length > 2);
  }

  if (typeof obj === "object" && obj !== null) {
    if (obj.edges && obj.nodes && obj.start_node !== undefined) {
      const nodeMap: Record<string, string> = {};
      const startId = typeof obj.start_node === "string"
        ? obj.start_node
        : (obj.start_node.id || "");

      if (typeof obj.start_node === "string") {
        nodeMap[startId] = startId;
      } else {
        nodeMap[startId] = (obj.start_node.label || obj.start_node.description || startId).replace(/\n/g, " ").trim();
      }

      for (const n of obj.nodes) {
        if (typeof n === "object" && n.id) {
          const label = n.label || n.description || n.name || n.title || n.id || "";
          nodeMap[n.id] = label.replace(/\n/g, " ").trim();
        }
      }

      const next: Record<string, string[]> = {};
      for (const e of obj.edges) {
        if (!next[e.source]) next[e.source] = [];
        next[e.source].push(e.target);
      }

      const visited = new Set<string>();
      const queue: string[] = [startId];
      const ordered: string[] = [];

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);
        if (nodeMap[current]) ordered.push(nodeMap[current]);
        const nexts = next[current] || [];
        for (const n of nexts) {
          if (!visited.has(n)) queue.push(n);
        }
      }

      if (ordered.length > 0) return ordered;
    }

    if (obj.learning_tip) {
      const result = extractFlowchartSteps(obj.learning_tip);
      if (result.length > 0) return result;
    }

    const arrayFields = [
      "flowchart", "steps", "nodes", "items", "content",
      "stages", "events", "process", "sequence", "flow"
    ];
    for (const field of arrayFields) {
      if (Array.isArray(obj[field]) && obj[field].length > 0) {
        const result = extractFlowchartSteps(obj[field]);
        if (result.length > 0) return result;
      }
    }

    for (const key of Object.keys(obj)) {
      if (Array.isArray(obj[key]) && obj[key].length > 1) {
        const result = extractFlowchartSteps(obj[key]);
        if (result.length > 0) return result;
      }
    }
  }

  return [];
};

// ─────────────────────────────────────────────
// Tip Prompts
// ─────────────────────────────────────────────
const stylePrompts: Record<string, string> = {

  // ── TEXT TYPES ──

// Dans TipController.ts, remplace le prompt "mnemonic" par celui-ci :

"mnemonic": `
You are generating a MNEMONIC to help memorize KEY MEDICAL FACTS about the topic.

RULES:
- The mnemonic sentence must help remember CLINICALLY USEFUL information (classes, side effects, indications, mechanisms, steps...)
- NEVER make a sentence that just spells out the topic name itself
- The letters must stand for MEDICALLY MEANINGFUL words related to the topic content
- Example for Beta-blockers: "Some Have More Beta Activity" → S=Sotalol, H=half-life varies, M=Metoprolol cardioselective, B=Bradycardia risk, A=Atenolol

Return ONLY this exact format:

**Mnemonic:** [Your one mnemonic sentence here — letters spell out key facts, NOT the topic name]

**Stands for:**
- [Letter] = [Medically meaningful word or concept]
- [Letter] = [Medically meaningful word or concept]
(one bullet per letter)

**What it helps remember:** [One sentence explaining WHAT CLINICAL CONTENT this covers]

No introduction. No extra text. No markdown code blocks.
`,
  "acronym": `
Return ONLY one medical acronym relevant to the topic.
Format:
**Acronym:** [THE ACRONYM]

- A = [word]
- B = [word]
(one bullet per letter)

No introduction. No extra text.
`,

  "analogy": `
Return ONLY one short, powerful medical analogy (3–5 sentences max).
No introduction. No explanation outside the analogy.
`,

  "story_encoding": `
You MUST return ONLY raw HTML. No text before. No text after. No markdown.

Return a short engaging story (6–10 sentences) using this EXACT structure:

<div style="font-family:sans-serif;color:#e2e8f0;line-height:1.8;padding:8px;">
  <div style="color:#a5b4fc;font-weight:bold;font-size:16px;margin-bottom:12px;">📖 [Story Title Here]</div>
  <p style="margin:0 0 12px 0;">[Opening paragraph — set the scene using a metaphor from the user's interests]</p>
  <p style="margin:0 0 12px 0;">[Middle paragraph — describe the pathophysiology or key mechanism through the story]</p>
  <p style="margin:0 0 12px 0;"><strong style="color:#f59e0b;">Key moment:</strong> [Climax — the critical clinical event or turning point]</p>
  <p style="margin:0 0 12px 0;">[Resolution — treatment or outcome of the story]</p>
  <div style="margin-top:16px;padding:10px;background:#1e293b;border-left:3px solid #6366f1;border-radius:4px;">
    <div style="color:#a5b4fc;font-weight:bold;font-size:12px;margin-bottom:6px;">🧠 What the story teaches:</div>
    <div style="font-size:13px;color:#94a3b8;">[One sentence summary of the medical lesson]</div>
  </div>
</div>

Replace ALL placeholder text with real medical content. START with <div — NOTHING before it. END with </div> — NOTHING after it.
`,

  "chunking_strategy": `
You MUST return ONLY raw HTML. No text before. No text after. No markdown.

Break the topic into 4–6 logical chunks using this EXACT structure:

<div style="font-family:sans-serif;display:flex;flex-direction:column;gap:12px;padding:8px;">
  <div style="background:#1e293b;border-left:4px solid #6366f1;border-radius:8px;padding:12px;">
    <div style="color:#a5b4fc;font-weight:bold;font-size:13px;margin-bottom:6px;">📦 Chunk 1 — [Chunk Title e.g. What is it?]</div>
    <div style="color:#e2e8f0;font-size:13px;line-height:1.6;">[Content of this chunk — 1-3 sentences]</div>
  </div>
  <div style="background:#1e293b;border-left:4px solid #0ea5e9;border-radius:8px;padding:12px;">
    <div style="color:#7dd3fc;font-weight:bold;font-size:13px;margin-bottom:6px;">📦 Chunk 2 — [Chunk Title e.g. Why does it happen?]</div>
    <div style="color:#e2e8f0;font-size:13px;line-height:1.6;">[Content of this chunk]</div>
  </div>
  <div style="background:#1e293b;border-left:4px solid #10b981;border-radius:8px;padding:12px;">
    <div style="color:#6ee7b7;font-weight:bold;font-size:13px;margin-bottom:6px;">📦 Chunk 3 — [Chunk Title e.g. How does it present?]</div>
    <div style="color:#e2e8f0;font-size:13px;line-height:1.6;">[Content of this chunk]</div>
  </div>
</div>

Add more chunk divs as needed (up to 6). Alternate border colors: #6366f1, #0ea5e9, #10b981, #f59e0b, #ef4444, #8b5cf6.
Replace ALL placeholder text with real medical content. START with <div — NOTHING before it. END with </div> — NOTHING after it.
`,

  "clinical_algorithm": `
You MUST return ONLY raw HTML. No text before. No text after. No markdown.

Return a step-by-step clinical algorithm using this EXACT structure:

<div style="font-family:sans-serif;display:flex;flex-direction:column;gap:0;padding:8px;">
  <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:4px;">
    <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;">
      <div style="width:28px;height:28px;border-radius:50%;background:#6366f1;color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;">1</div>
      <div style="width:2px;flex:1;background:#334155;min-height:24px;"></div>
    </div>
    <div style="background:#1e293b;border-radius:8px;padding:10px 14px;flex:1;margin-bottom:8px;">
      <div style="color:#a5b4fc;font-weight:bold;font-size:13px;">[Step Title]</div>
      <div style="color:#94a3b8;font-size:12px;margin-top:4px;line-height:1.5;">[Step description — key action or finding]</div>
    </div>
  </div>
</div>

Include 5–8 steps. The last step should have background:#10b981 on the number circle instead of #6366f1.
Replace ALL placeholder text with real clinical steps for this topic. START with <div — NOTHING before it. END with </div> — NOTHING after it.
`,

  "comparative_table": `
You MUST return ONLY raw HTML starting with <table and ending with </table>.
Absolutely NO text before <table. Absolutely NO text after </table>.
No markdown. No code fences. No explanation. No preamble.

Copy this structure EXACTLY and replace every placeholder with real medical data for the topic:

<table style="width:100%;border-collapse:collapse;font-size:13px;font-family:sans-serif;"><thead><tr style="background:#1e293b;color:white;"><th style="padding:10px;border:1px solid #334155;text-align:left;color:#a5b4fc;">Feature</th><th style="padding:10px;border:1px solid #334155;text-align:left;">[Real Condition A Name]</th><th style="padding:10px;border:1px solid #334155;text-align:left;">[Real Condition B Name]</th></tr></thead><tbody><tr style="background:#0f172a;color:#e2e8f0;"><td style="padding:10px;border:1px solid #334155;font-weight:600;color:#a5b4fc;">[Feature 1]</td><td style="padding:10px;border:1px solid #334155;">[Value A1]</td><td style="padding:10px;border:1px solid #334155;">[Value B1]</td></tr><tr style="background:#0d1526;color:#e2e8f0;"><td style="padding:10px;border:1px solid #334155;font-weight:600;color:#a5b4fc;">[Feature 2]</td><td style="padding:10px;border:1px solid #334155;">[Value A2]</td><td style="padding:10px;border:1px solid #334155;">[Value B2]</td></tr></tbody></table>

Requirements:
- Minimum 6 rows of real medical data
- Alternate row bg: #0f172a and #0d1526
- Replace [Real Condition A Name] and [Real Condition B Name] with actual condition names
- Replace every [Feature] and [Value] with real accurate medical content
- YOUR FIRST CHARACTER must be < and YOUR LAST CHARACTER must be >
`,

  "high_yield_snapshot_table": `
You MUST return ONLY a raw HTML table. No text before. No text after. No markdown. No code fences.

<table style="width:100%;border-collapse:collapse;font-size:13px;font-family:sans-serif;">
  <thead>
    <tr style="background:#1e293b;color:white;">
      <th style="padding:8px;border:1px solid #334155;text-align:left;color:#a5b4fc;">Parameter</th>
      <th style="padding:8px;border:1px solid #334155;text-align:left;">Value</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background:#0f172a;color:#e2e8f0;">
      <td style="padding:8px;border:1px solid #334155;font-weight:600;color:#a5b4fc;">Parameter 1</td>
      <td style="padding:8px;border:1px solid #334155;">Value 1</td>
    </tr>
  </tbody>
</table>

Replace all cells with real high-yield medical data for this topic. Add minimum 8 rows. Alternate row bg: #0f172a and #0d1526.
START with <table — NOTHING before it. END with </table> — NOTHING after it.
`,

"mindmap": `
You MUST return ONLY a valid SVG. No text before. No text after. No markdown.

Create a radial mindmap SVG for the topic. Use this structure:
- Central node in the middle (large ellipse, purple)
- 4-6 branch nodes around it connected with curved lines
- Each branch has 2-3 leaf nodes

EXACT positions to use:
- Central node: cx="400" cy="300"
- Top-left branch: cx="200" cy="140"
- Top-right branch: cx="600" cy="140"
- Left branch: cx="120" cy="300"  (plus à gauche)
- Right branch: cx="880" cy="300" (plus à droite)
- Bottom-left branch: cx="200" cy="460"
- Bottom-right branch: cx="600" cy="460"
Left branch leaves: place at x < 80 (far left).
Right branch leaves: place at x > 920 (far right).
viewBox="0 0 1100 750" to give more horizontal space.
Leaves: place them further outside from their branch, away from center, no overlapping.

CRITICAL: Every branch MUST have a colored ellipse node drawn ON TOP of its connection line.
Draw in this order: 1) all paths first, 2) all ellipses on top, 3) all text on top of ellipses.
Branch ellipses: rx="65" ry="28", each a different color.
Central ellipse: rx="80" ry="35" fill="#6366f1".
Never leave a branch as just a line — every branch endpoint MUST have a visible colored ellipse with text.
Adjust each ellipse size to fit its text: rx = max(60, characters * 4.5).

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 750" style="width:100%;background:#0f172a;border-radius:12px;">
  <!-- draw all paths first -->
  <path d="M400,300 Q300,220 200,140" stroke="#0ea5e9" stroke-width="2" fill="none"/>
  <!-- then all ellipses on top -->
  <ellipse cx="400" cy="300" rx="80" ry="35" fill="#6366f1"/>
  <text x="400" y="305" text-anchor="middle" fill="white" font-size="14" font-family="sans-serif" font-weight="bold">[TOPIC]</text>
  <ellipse cx="200" cy="140" rx="65" ry="28" fill="#0ea5e9"/>
  <text x="200" y="145" text-anchor="middle" fill="white" font-size="12" font-family="sans-serif">[Branch 1]</text>
  <!-- leaf -->
  <path d="M200,112 Q160,80 120,65" stroke="#334155" stroke-width="1.5" fill="none"/>
  <rect x="60" y="52" width="130" height="22" rx="6" fill="#1e293b"/>
  <text x="125" y="67" text-anchor="middle" fill="#94a3b8" font-size="10" font-family="sans-serif">[Leaf 1]</text>
</svg>

Replace ALL placeholder text with real medical content in French.
Add 4-6 branches with 2-3 leaves each using the exact positions above.
Use curved paths (Q curves) for all connections.
Branch colors: #6366f1, #0ea5e9, #10b981, #f59e0b, #ef4444, #8b5cf6.
Leaves must be placed FAR from their branch — at least 130px away. Leaf rect width minimum 130px.
Branch label text must be SHORT — maximum 3 words. If the topic is long, abbreviate it.
Central node label: maximum 4 words.
Leaf text must be MAXIMUM 4 words — truncate or abbreviate if longer. Never write full sentences in leaves.
Leaf rect width = exactly 140px, height = exactly 26px. Text must fit inside.
Bottom branches must be spaced at least 200px apart horizontally.
Bottom-left leaves: place BELOW and to the LEFT of their branch.
Bottom-right leaves: place BELOW and to the RIGHT of their branch.
Leaves must NEVER overlap their own branch ellipse — minimum 80px distance from branch center.
START with <svg — NOTHING before it. END with </svg> — NOTHING after it.
`,

"cause_mechanism_consequence": `
You MUST return ONLY raw HTML. No text before. No text after. No markdown.
CRITICAL: You MUST include ALL 3 sections (CAUSE, MÉCANISME, CONSÉQUENCE). Max 2 bullet points per section, max 2 sentences each bullet. Be concise — completeness is more important than detail.
Target: specialist physicians (ECN/USMLE). Use exact pathophysiology, real thresholds, drug names, guideline references (ESC/HAS/ACC). All in French. No analogies.

<div style="display:flex;flex-direction:column;gap:0;padding:4px;font-family:sans-serif;">

  <div style="background:linear-gradient(135deg,#1e2d4a,#1a2540);border-radius:14px 14px 4px 4px;padding:16px 18px;border-top:3px solid #60a5fa;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
      <div style="background:#1d4ed8;color:white;font-size:11px;font-weight:bold;padding:3px 10px;border-radius:20px;">⚡ CAUSE</div>
      <div style="color:#93c5fd;font-size:11px;font-weight:600;">[subtitle: main etiology]</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      <div style="display:flex;align-items:baseline;gap:8px;"><span style="color:#60a5fa;font-size:12px;flex-shrink:0;">▸</span><span style="color:#e2e8f0;font-size:12px;line-height:1.6;">[Detailed cause 1 with mechanism and epidemiology]</span></div>
      <div style="display:flex;align-items:baseline;gap:8px;"><span style="color:#60a5fa;font-size:12px;flex-shrink:0;">▸</span><span style="color:#e2e8f0;font-size:12px;line-height:1.6;">[Detailed cause 2 with specific context]</span></div>
      <div style="display:flex;align-items:baseline;gap:8px;"><span style="color:#60a5fa;font-size:12px;flex-shrink:0;">▸</span><span style="color:#e2e8f0;font-size:12px;line-height:1.6;">[Risk factors and predisposing conditions with prevalence]</span></div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:10px;">
      <span style="background:rgba(96,165,250,0.15);border:1px solid rgba(96,165,250,0.3);color:#93c5fd;font-size:10px;font-weight:bold;padding:2px 8px;border-radius:12px;">[key threshold]</span>
      <span style="background:rgba(96,165,250,0.15);border:1px solid rgba(96,165,250,0.3);color:#93c5fd;font-size:10px;font-weight:bold;padding:2px 8px;border-radius:12px;">[guideline ref]</span>
    </div>
  </div>

  <div style="display:flex;justify-content:center;align-items:center;height:28px;background:linear-gradient(#1a2540,#162613);">
    <div style="display:flex;flex-direction:column;align-items:center;gap:1px;">
      <div style="width:2px;height:12px;background:linear-gradient(#60a5fa,#34d399);"></div>
      <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid #34d399;"></div>
    </div>
  </div>

  <div style="background:linear-gradient(135deg,#1a2d1a,#162613);padding:16px 18px;border-left:3px solid #34d399;border-right:3px solid #34d399;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
      <div style="background:#065f46;color:#6ee7b7;font-size:11px;font-weight:bold;padding:3px 10px;border-radius:20px;">⚙️ MÉCANISME</div>
      <div style="color:#6ee7b7;font-size:11px;font-weight:600;">[subtitle: core pathophysiology]</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      <div style="display:flex;align-items:baseline;gap:8px;"><span style="color:#34d399;font-size:12px;flex-shrink:0;">▸</span><span style="color:#e2e8f0;font-size:12px;line-height:1.6;">[Step 1: molecular/cellular level with exact mechanism]</span></div>
      <div style="display:flex;align-items:baseline;gap:8px;"><span style="color:#34d399;font-size:12px;flex-shrink:0;">▸</span><span style="color:#e2e8f0;font-size:12px;line-height:1.6;">[Step 2: organ-level consequence with values]</span></div>
      <div style="display:flex;align-items:baseline;gap:8px;"><span style="color:#34d399;font-size:12px;flex-shrink:0;">▸</span><span style="color:#e2e8f0;font-size:12px;line-height:1.6;">[Step 3: systemic consequence with hemodynamic data]</span></div>
      <div style="display:flex;align-items:baseline;gap:8px;"><span style="color:#34d399;font-size:12px;flex-shrink:0;">▸</span><span style="color:#e2e8f0;font-size:12px;line-height:1.6;">[Compensatory mechanism and its limits]</span></div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:10px;">
      <span style="background:rgba(52,211,153,0.15);border:1px solid rgba(52,211,153,0.3);color:#6ee7b7;font-size:10px;font-weight:bold;padding:2px 8px;border-radius:12px;">[threshold 1]</span>
      <span style="background:rgba(52,211,153,0.15);border:1px solid rgba(52,211,153,0.3);color:#6ee7b7;font-size:10px;font-weight:bold;padding:2px 8px;border-radius:12px;">[threshold 2]</span>
    </div>
  </div>

  <div style="display:flex;justify-content:center;align-items:center;height:28px;background:linear-gradient(#162613,#3d1515);">
    <div style="display:flex;flex-direction:column;align-items:center;gap:1px;">
      <div style="width:2px;height:12px;background:linear-gradient(#34d399,#f87171);"></div>
      <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid #f87171;"></div>
    </div>
  </div>

  <div style="background:linear-gradient(135deg,#3d1515,#2d1010);border-radius:4px 4px 14px 14px;padding:16px 18px;border-bottom:3px solid #f87171;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
      <div style="background:#991b1b;color:#fca5a5;font-size:11px;font-weight:bold;padding:3px 10px;border-radius:20px;">💥 CONSÉQUENCE</div>
      <div style="color:#fca5a5;font-size:11px;font-weight:600;">[subtitle: main clinical outcome]</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      <div style="display:flex;align-items:baseline;gap:8px;"><span style="color:#f87171;font-size:12px;flex-shrink:0;">▸</span><span style="color:#e2e8f0;font-size:12px;line-height:1.6;">[Main symptom with pathophysiological explanation]</span></div>
      <div style="display:flex;align-items:baseline;gap:8px;"><span style="color:#f87171;font-size:12px;flex-shrink:0;">▸</span><span style="color:#e2e8f0;font-size:12px;line-height:1.6;">[Main complication with incidence/prevalence data]</span></div>
      <div style="display:flex;align-items:baseline;gap:8px;"><span style="color:#f87171;font-size:12px;flex-shrink:0;">▸</span><span style="color:#e2e8f0;font-size:12px;line-height:1.6;">[First-line treatment with drug name, dose, indication per guidelines]</span></div>
    </div>
    <div style="margin-top:10px;padding:8px 12px;background:rgba(239,68,68,0.1);border-radius:8px;border:1px solid rgba(239,68,68,0.25);">
      <div style="color:#fca5a5;font-size:10px;font-weight:bold;margin-bottom:4px;">⚠️ SI NON TRAITÉ</div>
      <div style="color:#fbd5d5;font-size:12px;line-height:1.5;">[Worst case outcome with mortality rate and timeframe from guidelines]</div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:10px;">
      <span style="background:rgba(248,113,113,0.15);border:1px solid rgba(248,113,113,0.3);color:#fca5a5;font-size:10px;font-weight:bold;padding:2px 8px;border-radius:12px;">[drug/intervention]</span>
      <span style="background:rgba(248,113,113,0.15);border:1px solid rgba(248,113,113,0.3);color:#fca5a5;font-size:10px;font-weight:bold;padding:2px 8px;border-radius:12px;">[guideline ref]</span>
    </div>
  </div>

</div>

Replace ALL placeholders with detailed precise medical content in French. Include exact pathophysiology, real thresholds, drug names, guideline references. No analogies. START with <div — NOTHING before. END with </div> — NOTHING after.
`,

  "step_by_step_breakdown": `
Return ONLY numbered steps. Each step on its own line. No extra text outside the steps.
Format:
1. [Step]
2. [Step]
3. [Step]
`,

  "socratic_questioning": `
You MUST return ONLY raw HTML. No text before. No text after. No markdown.
 
Generate 5 Socratic questions that progressively deepen understanding of the topic.
Questions must go from surface → mechanism → clinical application → critical thinking.
Each question must be clinically relevant and thought-provoking for a medical student.
All in French.
 
Use EXACTLY this HTML structure:
 
<div style="display:flex;flex-direction:column;gap:12px;padding:4px;">
 
  <div style="background:linear-gradient(135deg,#1e1b4b,#2d1f5e);border-left:4px solid #818cf8;border-radius:12px;padding:14px 16px;">
    <div style="color:#a5b4fc;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Question 1 — Fondamentaux</div>
    <div style="color:#e2e8f0;font-size:13px;line-height:1.6;">[Surface-level question about definition or basic concept]</div>
  </div>
 
  <div style="background:linear-gradient(135deg,#1a1f3d,#1e2d4a);border-left:4px solid #60a5fa;border-radius:12px;padding:14px 16px;">
    <div style="color:#93c5fd;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Question 2 — Mécanisme</div>
    <div style="color:#e2e8f0;font-size:13px;line-height:1.6;">[Question about pathophysiology or mechanism]</div>
  </div>
 
  <div style="background:linear-gradient(135deg,#1a2e1a,#1e3d2a);border-left:4px solid #34d399;border-radius:12px;padding:14px 16px;">
    <div style="color:#6ee7b7;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Question 3 — Application clinique</div>
    <div style="color:#e2e8f0;font-size:13px;line-height:1.6;">[Question linking mechanism to clinical presentation]</div>
  </div>
 
  <div style="background:linear-gradient(135deg,#2d1f1a,#3d2a1a);border-left:4px solid #fb923c;border-radius:12px;padding:14px 16px;">
    <div style="color:#fdba74;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Question 4 — Décision thérapeutique</div>
    <div style="color:#e2e8f0;font-size:13px;line-height:1.6;">[Question about treatment choice and reasoning]</div>
  </div>
 
  <div style="background:linear-gradient(135deg,#2d1a2a,#3d1a35);border-left:4px solid #f472b6;border-radius:12px;padding:14px 16px;">
    <div style="color:#f9a8d4;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Question 5 — Pensée critique</div>
    <div style="color:#e2e8f0;font-size:13px;line-height:1.6;">[Challenging question about edge cases, complications or controversies]</div>
  </div>
 
</div>
 
Replace ALL placeholders with real medical Socratic questions in French about the topic. START with <div — NOTHING before it. END with </div> — NOTHING after it.
`,

// Dans TipController.ts, remplace le prompt "teach_back_method" par :

"teach_back_method": `
You are generating a Teach Back exercise for a medical student.

First, choose ONE specific clinical question about the topic. It must be precise and clinically relevant, like:
- "Explique la démarche diagnostique de [topic]"
- "Décris la physiopathologie de [topic]"  
- "Quels sont les examens paracliniques et leur interprétation dans [topic]"
- "Explique la prise en charge thérapeutique de [topic]"
- "Décris les signes cliniques et leur mécanisme dans [topic]"

Return EXACTLY this format, nothing else:

QUESTION: [Your specific clinical question here]
---
[Complete, detailed, structured answer to that question — 150 to 250 words — written in French — use bullet points and structure]

No introduction. No extra text. Start with QUESTION: and nothing else before it.
`,

  "exam_simulation_flash": `
Return ONLY 5 rapid-fire Q&A pairs. Format exactly:

**Q1:** [Question]
**A1:** [Answer]

**Q2:** [Question]
**A2:** [Answer]

(continue for Q3, Q4, Q5)

No extra commentary.
`,

// Dans TipController.ts, remplace le prompt "mini_case_challenge" par :

// Dans TipController.ts, remplace le prompt "mini_case_challenge" par :

"mini_case_challenge": `
You MUST return ONLY raw HTML. No text before. No text after. No markdown.

You are generating 3 progressive MCQ questions at ECN/USMLE level for medical students.

STEP 1 — Detect the topic type:
- If it's a DISEASE/PATHOLOGY → use a clinical case scenario
- If it's a DRUG/PHARMACOLOGY → use a prescription scenario (patient who needs treatment or has side effects)
- If it's ANATOMY/PHYSIOLOGY → use a mechanism/application scenario
- If it's a PROCEDURE/TECHNIQUE → use a clinical decision scenario

STEP 2 — Build the clinical scenario accordingly:
- For disease: age, sex, symptoms with duration, exam findings, key paraclinical values
- For pharmacology: patient profile, indication or adverse effect, drug interaction context
- For anatomy/physiology: clinical situation where the mechanism is tested
- Always include specific numbers, values, thresholds

STEP 3 — Build 4 hierarchical questions adapted to the topic:
- For disease: Q1=diagnostic positif, Q2=bilan paraclinique/physiopathologie, Q3=traitement selon guidelines
- For pharmacology: Q1=mécanisme d'action, Q2=indication précise/effet indésirable, Q3=contre-indication/interaction
- For anatomy/physiology: Q1=mécanisme, Q2=conséquence clinique/diagnostic, Q3=traitement
- NEVER use "Toutes les réponses précédentes"
- Wrong answers must be plausible differentials requiring real reasoning
- Explanations must cite guidelines (HAS/ESC/ACC) or mechanisms

Use this EXACT HTML structure:

<div style="font-family:sans-serif;display:flex;flex-direction:column;gap:20px;padding:8px;">

  <div style="background:#1e293b;border-radius:12px;padding:16px;border-left:4px solid #0ea5e9;">
    <div style="color:#7dd3fc;font-weight:bold;font-size:12px;margin-bottom:8px;">🏥 CAS CLINIQUE</div>
    <div style="color:#e2e8f0;font-size:13px;line-height:1.7;">[Detailed scenario adapted to topic type with specific values]</div>
  </div>

  <div style="color:#a5b4fc;font-weight:bold;font-size:13px;">❓ Question 1/3 — [First hierarchical question]</div>
  <div style="display:flex;flex-direction:column;gap:8px;">
    <div style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:10px 14px;color:#e2e8f0;font-size:13px;">A. [Plausible option]</div>
    <div style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:10px 14px;color:#e2e8f0;font-size:13px;">B. [Plausible option]</div>
    <div style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:10px 14px;color:#e2e8f0;font-size:13px;">C. [Plausible option]</div>
    <div style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:10px 14px;color:#e2e8f0;font-size:13px;">D. [Plausible option]</div>
  </div>
  <details style="background:#1e293b;border-radius:8px;padding:12px;border-left:4px solid #10b981;">
    <summary style="color:#6ee7b7;font-weight:bold;font-size:13px;cursor:pointer;">✅ Voir la réponse</summary>
    <div style="color:#e2e8f0;font-size:13px;margin-top:10px;line-height:1.6;"><strong style="color:#10b981;">Réponse : [Letter]. [Answer]</strong><br/><br/>[Explanation]</div>
  </details>

  <hr style="border-color:#334155;"/>

  <div style="color:#a5b4fc;font-weight:bold;font-size:13px;">❓ Question 2/3 — [Second hierarchical question]</div>
  <div style="display:flex;flex-direction:column;gap:8px;">
    <div style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:10px 14px;color:#e2e8f0;font-size:13px;">A. [Plausible option]</div>
    <div style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:10px 14px;color:#e2e8f0;font-size:13px;">B. [Plausible option]</div>
    <div style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:10px 14px;color:#e2e8f0;font-size:13px;">C. [Plausible option]</div>
    <div style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:10px 14px;color:#e2e8f0;font-size:13px;">D. [Plausible option]</div>
  </div>
  <details style="background:#1e293b;border-radius:8px;padding:12px;border-left:4px solid #10b981;">
    <summary style="color:#6ee7b7;font-weight:bold;font-size:13px;cursor:pointer;">✅ Voir la réponse</summary>
    <div style="color:#e2e8f0;font-size:13px;margin-top:10px;line-height:1.6;"><strong style="color:#10b981;">Réponse : [Letter]. [Answer]</strong><br/><br/>[Explanation]</div>
  </details>

  <hr style="border-color:#334155;"/>

  <div style="color:#a5b4fc;font-weight:bold;font-size:13px;">❓ Question 3/3 — [Third hierarchical question]</div>
  <div style="display:flex;flex-direction:column;gap:8px;">
    <div style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:10px 14px;color:#e2e8f0;font-size:13px;">A. [Plausible option]</div>
    <div style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:10px 14px;color:#e2e8f0;font-size:13px;">B. [Plausible option]</div>
    <div style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:10px 14px;color:#e2e8f0;font-size:13px;">C. [Plausible option]</div>
    <div style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:10px 14px;color:#e2e8f0;font-size:13px;">D. [Plausible option]</div>
  </div>
  <details style="background:#1e293b;border-radius:8px;padding:12px;border-left:4px solid #10b981;">
    <summary style="color:#6ee7b7;font-weight:bold;font-size:13px;cursor:pointer;">✅ Voir la réponse</summary>
    <div style="color:#e2e8f0;font-size:13px;margin-top:10px;line-height:1.6;"><strong style="color:#10b981;">Réponse : [Letter]. [Answer]</strong><br/><br/>[Explanation]</div>
  </details>


</div>

Replace ALL placeholders with real high-level medical content in French. ECN/USMLE difficulty. Adapt scenario and questions to topic type. Keep explanations CONCISE (2-3 lines max) to stay within token limits. START with <div — NOTHING before it. END with </div> — NOTHING after it.
`,

// Dans TipController.ts, remplace le prompt "error_detection_mode" par :

"error_detection_mode": `
You are generating an Error Detection game for medical students.

Generate 3 clinical cases. Each case contains a short medical statement with ONE deliberate medical error.

TYPES OF ERRORS — rotate between these, do NOT use only dosage errors:
- Wrong diagnosis (e.g. confusing aortic stenosis with regurgitation)
- Wrong first-line exam (e.g. ordering CT before echo, or X-ray before ECG)
- Wrong treatment choice (e.g. beta-blocker contraindicated in this context)
- Wrong pathophysiology (e.g. systolic vs diastolic, preload vs afterload)
- Wrong clinical sign attributed to wrong cause
- Wrong threshold or classification (e.g. FEVG < 40% stated as < 55%)
- Wrong timing or sequence in management
- Drug contraindicated in this specific condition

Each of the 3 cases must use a DIFFERENT type of error from the list above.

Return EXACTLY this format with --- between each case:

CASE: [2-3 sentence medical statement in French containing ONE subtle but important medical error]
ERROR: [The exact wrong word or phrase from the text — copy it exactly as written]
CORRECTION: [The correct medical information to replace the error]
EXPLANATION: [1-2 sentences explaining why it's wrong and what the correct reasoning is]

---

CASE: [Next case...]
ERROR: [...]
CORRECTION: [...]
EXPLANATION: [...]

---

CASE: [Next case...]
ERROR: [...]
CORRECTION: [...]
EXPLANATION: [...]

Rules:
- Errors must be SUBTLE and clinically relevant — not obvious
- The ERROR field must be copiable word-for-word from the CASE text
- Write in French
- No introduction, no extra text, start directly with CASE:
`,

  "timeline_anchor": `
You MUST return ONLY raw HTML. No text before. No text after. No markdown.

Return an HTML timeline using this EXACT structure:

<div style="display:flex;flex-direction:column;gap:0;font-family:sans-serif;padding:10px;">
  <div style="display:flex;align-items:flex-start;gap:12px;">
    <div style="display:flex;flex-direction:column;align-items:center;">
      <div style="width:14px;height:14px;border-radius:50%;background:#6366f1;margin-top:3px;flex-shrink:0;"></div>
      <div style="width:2px;flex:1;background:#334155;min-height:36px;"></div>
    </div>
    <div style="padding-bottom:20px;">
      <div style="color:#a5b4fc;font-weight:bold;">Event Title</div>
      <div style="color:#94a3b8;font-size:13px;">Short description of what happens at this stage.</div>
    </div>
  </div>
</div>

Replace ALL placeholder text with real medical content about the topic.
Add 5 to 8 events/stages minimum.
START your response with <div — NOTHING before it.
END your response with </div> — NOTHING after it.`,

  "icon_based_mapping": `
Return ONLY an HTML list. Each item MUST start with a real emoji character relevant to the medical content.
Use actual emojis like: ❤️ 🫁 🩺 💊 🔬 ⚡ 🌡️ 🧬 💉 🩸 🫀 🧪 ⚠️ ✅ 🔴 💧 🦠 🧠 🩻 📋
DO NOT describe icons in text. Use the actual emoji symbol.

<ul style="list-style:none;padding:0;font-family:sans-serif;">
  <li style="display:flex;gap:10px;align-items:flex-start;padding:8px 0;color:#e2e8f0;border-bottom:1px solid #1e293b;">
    <span style="font-size:20px;">❤️</span>
    <span>Medical fact about the topic here</span>
  </li>
</ul>

Pick the most medically relevant emoji for each fact. Add 8-12 items. No text before or after.
`,

  "disease_poster": `
You MUST return ONLY raw HTML. No text before. No text after. No markdown.

Create a visual disease poster using this EXACT structure:

<div style="font-family:sans-serif;padding:12px;display:flex;flex-direction:column;gap:12px;">
  <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;padding:16px;text-align:center;">
    <div style="font-size:22px;font-weight:bold;color:white;">[Disease Name]</div>
    <div style="font-size:12px;color:#e0e7ff;margin-top:4px;">[One-line definition]</div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
    <div style="background:#1e293b;border-radius:10px;padding:12px;border-left:4px solid #ef4444;">
      <div style="color:#fca5a5;font-weight:bold;font-size:12px;margin-bottom:6px;">⚠️ CAUSES</div>
      <div style="color:#e2e8f0;font-size:12px;line-height:1.6;">[List main causes]</div>
    </div>
    <div style="background:#1e293b;border-radius:10px;padding:12px;border-left:4px solid #f59e0b;">
      <div style="color:#fcd34d;font-weight:bold;font-size:12px;margin-bottom:6px;">🩺 SYMPTOMS</div>
      <div style="color:#e2e8f0;font-size:12px;line-height:1.6;">[List main symptoms]</div>
    </div>
    <div style="background:#1e293b;border-radius:10px;padding:12px;border-left:4px solid #0ea5e9;">
      <div style="color:#7dd3fc;font-weight:bold;font-size:12px;margin-bottom:6px;">🔬 DIAGNOSIS</div>
      <div style="color:#e2e8f0;font-size:12px;line-height:1.6;">[Key diagnostic steps]</div>
    </div>
    <div style="background:#1e293b;border-radius:10px;padding:12px;border-left:4px solid #10b981;">
      <div style="color:#6ee7b7;font-weight:bold;font-size:12px;margin-bottom:6px;">💊 TREATMENT</div>
      <div style="color:#e2e8f0;font-size:12px;line-height:1.6;">[Main treatment options]</div>
    </div>
  </div>
  <div style="background:#1e293b;border-radius:10px;padding:12px;border-left:4px solid #8b5cf6;">
    <div style="color:#c4b5fd;font-weight:bold;font-size:12px;margin-bottom:6px;">⚡ HIGH-YIELD FACTS</div>
    <div style="color:#e2e8f0;font-size:12px;line-height:1.6;">[3-4 key exam facts about this disease]</div>
  </div>
</div>

Replace ALL placeholder text with real medical content about the topic.
START with <div — NOTHING before it. END with </div> — NOTHING after it.
`,

  // Dans TipController.ts, remplace le prompt "simplified_flowchart" par :

// Dans TipController.ts, remplace le prompt "simplified_flowchart" par :

"simplified_flowchart": `
You MUST return ONLY raw HTML. No text before. No text after. No markdown. No code blocks.

IMPORTANT: You are generating a clinical decision algorithm based on validated guidelines (ESC 2021, HAS, ACC/AHA). Each decision node must contain the EXACT criterion from the guideline (threshold, score, classification). Each action node must specify the intervention with timing and modality. Be exhaustive and precise — this is for specialist physicians.

Generate a clinical decision flowchart as HTML with inline styles.

CRITICAL VISUAL RULES:
- Decision nodes (diamond) must use clip-path, NOT transform:rotate. Use this exact style for diamonds:
  position:relative, width:240px, height:110px, with inner absolute div using clip-path:polygon(50% 0%,100% 50%,50% 100%,0% 50%) and a relative inner div for text
- NO analogies, NO metaphors — strict clinical language only
- Include real guideline-based thresholds (e.g. FEVG < 50%, gradient moyen > 40mmHg, surface < 1cm², score GRACE > 140)
- Each action node must specify WHAT + HOW + WHEN (e.g. "ETT dans les 24h + hémocultures x3 avant ATB")
- Minimum 2 decision nodes with YES/NO branches
- All text in French
- Max 8 nodes total

Use EXACTLY this HTML structure:

<div style="display:flex;flex-direction:column;align-items:center;gap:0;width:100%;font-family:sans-serif;padding:8px 0;">

  <!-- START node -->
  <div style="background:linear-gradient(135deg,#6366f1,#818cf8);color:white;font-weight:bold;font-size:13px;padding:12px 24px;border-radius:20px;text-align:center;max-width:280px;">
    [Starting clinical condition with precise entry criteria]
  </div>

  <!-- Arrow down -->
  <div style="width:2px;height:24px;background:#6366f1;"></div>
  <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:10px solid #6366f1;"></div>

  <!-- DECISION diamond 1 -->
  <div style="position:relative;width:240px;height:110px;margin:4px 0;display:flex;align-items:center;justify-content:center;">
    <div style="position:absolute;inset:0;clip-path:polygon(50% 0%,100% 50%,50% 100%,0% 50%);background:#1e2d4a;"></div>
    <div style="position:relative;color:#a5b4fc;font-size:11px;font-weight:bold;text-align:center;padding:0 48px;line-height:1.4;">
      [Exact guideline criterion with threshold?]
    </div>
  </div>

  <!-- OUI / NON branches -->
  <div style="display:flex;width:100%;justify-content:space-around;align-items:flex-start;margin-top:4px;gap:8px;">

    <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;">
      <span style="color:#10b981;font-size:11px;font-weight:bold;">OUI</span>
      <div style="width:2px;height:18px;background:#10b981;"></div>
      <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #10b981;"></div>
      <div style="background:#0f3d2e;border:1.5px solid #10b981;color:#6ee7b7;font-size:12px;padding:10px 12px;border-radius:10px;text-align:center;max-width:150px;line-height:1.4;">
        [Specific intervention: what + how + when]
      </div>
    </div>

    <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;">
      <span style="color:#f87171;font-size:11px;font-weight:bold;">NON</span>
      <div style="width:2px;height:18px;background:#f87171;"></div>
      <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #f87171;"></div>
      <div style="background:#3d1515;border:1.5px solid #f87171;color:#fca5a5;font-size:12px;padding:10px 12px;border-radius:10px;text-align:center;max-width:150px;line-height:1.4;">
        [Specific intervention: what + how + when]
      </div>
    </div>

  </div>

  <!-- Arrow to second decision -->
  <div style="width:2px;height:24px;background:#6366f1;margin-top:16px;"></div>
  <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:10px solid #6366f1;"></div>

  <!-- DECISION diamond 2 -->
  <div style="position:relative;width:240px;height:110px;margin:4px 0;display:flex;align-items:center;justify-content:center;">
    <div style="position:absolute;inset:0;clip-path:polygon(50% 0%,100% 50%,50% 100%,0% 50%);background:#1e2d4a;"></div>
    <div style="position:relative;color:#a5b4fc;font-size:11px;font-weight:bold;text-align:center;padding:0 48px;line-height:1.4;">
      [Second guideline criterion with threshold?]
    </div>
  </div>

  <div style="display:flex;width:100%;justify-content:space-around;align-items:flex-start;margin-top:4px;gap:8px;">

    <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;">
      <span style="color:#10b981;font-size:11px;font-weight:bold;">OUI</span>
      <div style="width:2px;height:18px;background:#10b981;"></div>
      <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #10b981;"></div>
      <div style="background:#0f3d2e;border:1.5px solid #10b981;color:#6ee7b7;font-size:12px;padding:10px 12px;border-radius:10px;text-align:center;max-width:150px;line-height:1.4;">
        [Specific intervention]
      </div>
    </div>

    <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;">
      <span style="color:#f87171;font-size:11px;font-weight:bold;">NON</span>
      <div style="width:2px;height:18px;background:#f87171;"></div>
      <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #f87171;"></div>
      <div style="background:#3d1515;border:1.5px solid #f87171;color:#fca5a5;font-size:12px;padding:10px 12px;border-radius:10px;text-align:center;max-width:150px;line-height:1.4;">
        [Specific intervention]
      </div>
    </div>

  </div>

  <!-- Arrow to end -->
  <div style="width:2px;height:24px;background:#6366f1;margin-top:16px;"></div>
  <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:10px solid #6366f1;"></div>

  <!-- END node -->
  <div style="background:linear-gradient(135deg,#10b981,#34d399);color:white;font-weight:bold;font-size:13px;padding:12px 24px;border-radius:20px;text-align:center;max-width:280px;">
    [Final outcome / follow-up plan]
  </div>

</div>

Replace ALL placeholders with real guideline-based clinical content in French. Use exact ESC/HAS/ACC/AHA criteria. NO analogies. NO metaphors. START with <div — NOTHING before it. END with </div> — NOTHING after it.
`,
};

// ─────────────────────────────────────────────
// 🔹 PARSE MARKDOWN TABLE → HTML
// ─────────────────────────────────────────────
const parseMarkdownTable = (text: string, type: string): string | null => {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.startsWith("|"));
  if (lines.length < 2) return null;

  const parseRow = (line: string) =>
    line.split("|").map(c => c.trim()).filter((_, i, arr) => i !== 0 && i !== arr.length - 1);

  const headers = parseRow(lines[0]);
  const bodyLines = lines.slice(2);
  const isSnapshot = type === "high_yield_snapshot_table";

  const headerCells = headers.map(h =>
    `<th style="padding:${isSnapshot ? "8" : "10"}px;border:1px solid #334155;text-align:left;">${h}</th>`
  ).join("");

  const bodyRows = bodyLines.map((line, i) => {
    const cells = parseRow(line);
    const bg = i % 2 === 0 ? "#0f172a" : "#0d1526";
    const cellsHtml = cells.map((c, ci) =>
      `<td style="padding:${isSnapshot ? "8" : "10"}px;border:1px solid #334155;${ci === 0 ? "font-weight:600;color:#a5b4fc;" : ""}">${c}</td>`
    ).join("");
    return `<tr style="background:${bg};color:#e2e8f0;">${cellsHtml}</tr>`;
  }).join("");

  return `<table style="width:100%;border-collapse:collapse;font-size:14px;">
  <thead><tr style="background:#1e293b;color:white;">${headerCells}</tr></thead>
  <tbody>${bodyRows}</tbody>
</table>`;
};

// ─────────────────────────────────────────────
// 🔹 CONVERT JSON / TEXT → HTML
// ─────────────────────────────────────────────
const convertJsonToHtml = (rawText: string, type: string, title = ""): string => {
  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^```(?:json|svg|html|xml)?\s*/i, "").replace(/```$/i, "").trim();

  // ── Direct HTML table ──
  if ((type === "comparative_table" || type === "high_yield_snapshot_table") && cleaned.startsWith("<table")) {
    return sanitizeHtml(cleaned);
  }

  // ── Table buried in extra text — extract it ──
  if (type === "comparative_table" || type === "high_yield_snapshot_table") {
    const tableMatch = cleaned.match(/<table[\s\S]*<\/table>/i);
    if (tableMatch) return sanitizeHtml(tableMatch[0]);
  }

  // ── Markdown table ──
  if ((type === "comparative_table" || type === "high_yield_snapshot_table") && cleaned.includes("|")) {
    const result = parseMarkdownTable(cleaned, type);
    if (result) return sanitizeHtml(result);
  }

  // ── SVG ──
  if (cleaned.startsWith("<svg")) {
    return sanitizeSvg(cleaned);
  }

  // ── DISEASE POSTER fallback (if HTML not returned) ──
  if (type === "disease_poster" && !cleaned.startsWith("<")) {
    return sanitizeHtml(cleaned);
  }

  // ── simplified_flowchart ──
  if (type === "simplified_flowchart") {
    const fullText = cleaned.replace(/\n/g, " ");

    const stripJunk = (s: string): string => {
      let r = s
        .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{1F300}-\u{1F9FF}]/gu, "")
        .replace(/^\s*\d+\.\s*The\s+"[^"]*"\s*-\s*/i, "")
        .replace(/^\s*\d+\.\s*/i, "")
        .replace(/^\s*Step\s*\d+[:\.]?\s*/i, "")
        .replace(/^[\*\-•]\s*/, "")
        .replace(/\s*\([^)]{0,120}\)\s*/g, "")
        .replace(/^The\s+"[^"]*"\s*-\s*/i, "")
        .trim();
      if (r.length > 70) {
        const dot = r.indexOf(".");
        r = dot > 10 ? r.slice(0, dot).trim() : r.slice(0, 65).trim();
      }
      return r;
    };

    if (cleaned.includes("graph TD") || cleaned.includes("graph LR") || cleaned.includes("```mermaid")) {
      const mermaidText = cleaned.replace(/```mermaid|```/g, "");
      const nodeLabels = [...mermaidText.matchAll(/\[([^\]]{3,60})\]/g)]
        .map(m => m[1].replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&").trim())
        .filter((s, i, arr) => arr.indexOf(s) === i)
        .filter(s => s.length > 2);
      if (nodeLabels.length > 0) return buildFlowchartHtml(nodeLabels);
    }

    if (cleaned.startsWith("[")) {
      try {
        const arr = JSON.parse(cleaned);
        if (Array.isArray(arr)) {
          const steps = arr.map((s: any) => stripJunk(String(s))).filter((s: string) => s.length > 2);
          if (steps.length > 0) return buildFlowchartHtml(steps);
        }
      } catch {}
    }

    if (cleaned.startsWith("{")) {
      try {
        const parsed2 = JSON.parse(cleaned);
        const extractAllStrings = (obj: any, depth = 0): string[] => {
          if (depth > 5) return [];
          if (typeof obj === "string") return obj.length > 3 ? [obj] : [];
          if (Array.isArray(obj)) return obj.flatMap(item => extractAllStrings(item, depth + 1));
          if (typeof obj === "object" && obj !== null) {
            const skipKeys = ["tip_type", "topic", "type", "id", "source", "target", "url", "image", "anchor_image", "visual_anchor", "step_number"];
            const preferKeys = ["anchor_text", "step", "label", "title", "name", "text", "content", "description", "flowchart_steps"];
            for (const key of preferKeys) {
              if (obj[key]) {
                const result = extractAllStrings(obj[key], depth + 1);
                if (result.length >= 3) return result;
              }
            }
            return Object.entries(obj)
              .filter(([k]) => !skipKeys.includes(k))
              .flatMap(([, v]) => extractAllStrings(v, depth + 1));
          }
          return [];
        };
        const raw = extractAllStrings(parsed2);
        const steps = raw.map(stripJunk).filter((s: string) => s.length > 3);
        if (steps.length > 0) return buildFlowchartHtml(steps);
      } catch {}
    }

    if (cleaned.startsWith("<")) return sanitizeHtml(cleaned);

    if (/->|→|-->|↳|↓/.test(fullText)) {
      const steps = fullText
        .split(/->|→|-->|↳|↓/)
        .map(stripJunk)
        .filter((s: string) => s.length > 2);
      if (steps.length > 0) return buildFlowchartHtml(steps);
    }

    const steps = cleaned
      .split("\n")
      .map((l: string) => stripJunk(l))
      .filter((l: string) =>
        l.length > 4 &&
        !/^(key takeaway|based on|simplified|flowchart|tip|title|mode|anchor|learning)/i.test(l)
      );
    if (steps.length > 0) return buildFlowchartHtml(steps);
  }

  // ── Plain text timeline_anchor fallback ──
  if (type === "timeline_anchor" && !cleaned.startsWith("<") && !cleaned.startsWith("{") && !cleaned.startsWith("[")) {
    const lines = cleaned
      .split("\n")
      .map((l: string) => l.replace(/^\*+\s*/, "").replace(/^-+\s*/, "").replace(/^•\s*/, "").trim())
      .filter((l: string) => l.length > 4);

    const eventHtml = lines.map((line: string) => {
      const colonIdx = line.indexOf(":");
      const evtTitle = colonIdx > 0 && colonIdx < 60 ? line.slice(0, colonIdx).trim() : line.slice(0, 40);
      const desc = colonIdx > 0 && colonIdx < 60 ? line.slice(colonIdx + 1).trim() : "";
      return (
        "<div style=\"display:flex;align-items:flex-start;gap:12px;\">" +
        "<div style=\"display:flex;flex-direction:column;align-items:center;\">" +
        "<div style=\"width:14px;height:14px;border-radius:50%;background:#6366f1;margin-top:3px;flex-shrink:0;\"></div>" +
        "<div style=\"width:2px;flex:1;background:#334155;min-height:36px;\"></div>" +
        "</div>" +
        "<div style=\"padding-bottom:20px;\">" +
        "<div style=\"color:#a5b4fc;font-weight:bold;\">" + evtTitle + "</div>" +
        (desc ? "<div style=\"color:#94a3b8;font-size:13px;\">" + desc + "</div>" : "") +
        "</div></div>"
      );
    }).join("");

    return sanitizeHtml(
      "<div style=\"display:flex;flex-direction:column;gap:0;font-family:sans-serif;padding:10px;\">" + eventHtml + "</div>"
    );
  }

  // ── Already HTML ──
  if (cleaned.startsWith("<")) {
    return sanitizeHtml(cleaned);
  }

  // ── Plain text mindmap parser ──
  if (type === "mindmap") {
    const lines = cleaned.split("\n");
    let central = "Topic";
    for (const line of lines) {
      const m = line.match(/central\s*(node|idea|topic)?[:：]\s*(.+)/i);
      if (m) { central = m[2].trim(); break; }
    }

    interface MNode { label: string; depth: number; children: MNode[]; }
    const cleanLabel = (s: string) =>
      s.replace(/^\*+\s*/, "").replace(/^-+\s*/, "").replace(/^#+\s*/, "").trim();

    const items: { label: string; depth: number }[] = [];
    for (const line of lines) {
      const raw = cleanLabel(line);
      if (!raw || raw.length < 2) continue;
      if (/central\s*(node|idea|topic)?[:：]/i.test(raw)) continue;
      if (/mindmap|learning tip|^tip\b/i.test(raw) && raw.length < 40) continue;
      const indent = line.search(/\S/);
      items.push({ label: raw.replace(/:$/, ""), depth: indent });
    }

    if (items.length === 0) return rawText;

    const uniqueDepths = [...new Set(items.map(i => i.depth))].sort((a, b) => a - b);
    const levelOf = (d: number) => uniqueDepths.indexOf(d);
    const branches: MNode[] = [];
    const stack: MNode[] = [];

    for (const item of items) {
      const level = levelOf(item.depth);
      const node: MNode = { label: item.label, depth: level, children: [] };
      if (level === 0) {
        branches.push(node);
        stack.length = 0;
        stack.push(node);
      } else {
        while (stack.length > 1 && stack[stack.length - 1].depth >= level) stack.pop();
        stack[stack.length - 1].children.push(node);
        stack.push(node);
      }
    }

    const renderMindNodes = (nodes: MNode[], depth: number): string =>
      nodes.map(n => {
        const bg = depth === 1 ? "#0ea5e9" : "#1e293b";
        const color = depth === 1 ? "white" : "#94a3b8";
        const childHtml = n.children.length > 0
          ? `<div style="padding-left:10px;border-left:2px solid #334155;margin-top:4px;display:flex;flex-direction:column;gap:3px;">${renderMindNodes(n.children, depth + 1)}</div>`
          : "";
        return `<div style="display:flex;flex-direction:column;gap:3px;">
          <div style="background:${bg};color:${color};padding:${depth === 1 ? "6px 12px" : "4px 8px"};border-radius:8px;font-size:${depth === 1 ? "12px" : "11px"};">${n.label}</div>
          ${childHtml}
        </div>`;
      }).join("");

    const branchesHtml = branches.map(b =>
      `<div style="background:#0f172a;border:1px solid #1e293b;border-radius:14px;padding:12px;min-width:180px;max-width:250px;">
        <div style="background:#6366f1;color:white;padding:7px 14px;border-radius:10px;font-weight:700;font-size:13px;margin-bottom:8px;">${b.label}</div>
        <div style="display:flex;flex-direction:column;gap:4px;">${renderMindNodes(b.children, 1)}</div>
      </div>`
    ).join("");

    return sanitizeHtml(`<div style="display:flex;flex-direction:column;align-items:center;gap:20px;font-family:sans-serif;padding:16px;">
  <div style="background:#6366f1;color:white;padding:12px 28px;border-radius:20px;font-weight:bold;font-size:16px;text-align:center;">${central}</div>
  <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;align-items:flex-start;">${branchesHtml}</div>
</div>`);
  }

  // ── Plain text icon_based_mapping parser ──
  if (type === "icon_based_mapping") {
    const lines = cleaned.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 2);
    if (!cleaned.startsWith("{") && !cleaned.startsWith("[")) {
      const itemHtml = lines.map((line: string) => {
        const text = line.replace(/^\*+\s*/, "").replace(/^-+\s*/, "").replace(/^•\s*/, "").trim();
        if (!text || text.length < 3) return "";
        const emojiMatch = text.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*/u);
        const icon = emojiMatch ? emojiMatch[1] : getEmoji(text);
        const cleanText = emojiMatch ? text.replace(emojiMatch[0], "").trim() : text;
        return `<li style="display:flex;gap:10px;align-items:flex-start;padding:8px 0;color:#e2e8f0;border-bottom:1px solid #1e293b;">
    <span style="font-size:20px;">${icon}</span>
    <span>${cleanText}</span>
  </li>`;
      }).filter(Boolean).join("");
      return sanitizeHtml(`<ul style="list-style:none;padding:0;font-family:sans-serif;">${itemHtml}</ul>`);
    }
  }

  // ── JSON parse ──
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return rawText;
  }

  // ── comparative_table ──
  if (type === "comparative_table") {
    let rows: { feature: string; values: string[] }[] = [];
    let headers: string[] = [];
    const data = parsed.learning_tip && parsed.learning_tip.content
      ? parsed.learning_tip.content
      : parsed.content || parsed.table || parsed.comparative_table || parsed;

    const fromColumns = (cols: any[]) => {
      headers = cols.map((c: any) => c.header || "");
      const rowCount = cols[0] && cols[0].items ? cols[0].items.length : 0;
      rows = Array.from({ length: rowCount }, (_, i) => ({
        feature: cols[0] && cols[0].items ? cols[0].items[i] : "",
        values: cols.slice(1).map((c: any) => c.items ? c.items[i] : ""),
      }));
    };

    if (data && data.headers && data.rows) {
      headers = data.headers;
      rows = data.rows.map((r: any) => ({
        feature: r.cells ? r.cells[0] : r.feature || "",
        values: r.cells ? r.cells.slice(1) : [r[Object.keys(r)[1]] || "", r[Object.keys(r)[2]] || ""],
      }));
    } else if (data && data.columns && Array.isArray(data.columns)) {
      fromColumns(data.columns);
    } else if (Array.isArray(data) && data[0] && data[0].columns) {
      fromColumns(data[0].columns);
    } else if (Array.isArray(data) && data[0] && data[0].feature !== undefined) {
      const keys = Object.keys(data[0] || {});
      headers = ["Feature", ...keys.filter(k => k !== "feature")];
      rows = data.map((r: any) => ({ feature: r.feature || "", values: keys.filter(k => k !== "feature").map(k => r[k] || "") }));
    } else if (Array.isArray(data)) {
      const keys = Object.keys(data[0] || {});
      headers = keys;
      rows = data.map((r: any) => ({ feature: r[keys[0]] || "", values: keys.slice(1).map(k => r[k] || "") }));
    }

    if (rows.length === 0) return rawText;
    const colHeaders = headers.length >= 3 ? headers : ["Feature", "Value A", "Value B"];
    const headerCells = colHeaders.map(h => `<th style="padding:10px;border:1px solid #334155;text-align:left;">${h}</th>`).join("");
    const bodyRows = rows.map((r, i) => {
      const bg = i % 2 === 0 ? "#0f172a" : "#0d1526";
      const dataCells = r.values.map(v => `<td style="padding:10px;border:1px solid #334155;">${v}</td>`).join("");
      return `<tr style="background:${bg};color:#e2e8f0;"><td style="padding:10px;border:1px solid #334155;font-weight:600;color:#a5b4fc;">${r.feature}</td>${dataCells}</tr>`;
    }).join("");
    return sanitizeHtml(`<table style="width:100%;border-collapse:collapse;font-size:14px;">
  <thead><tr style="background:#1e293b;color:white;">${headerCells}</tr></thead>
  <tbody>${bodyRows}</tbody>
</table>`);
  }

  // ── high_yield_snapshot_table ──
  if (type === "high_yield_snapshot_table") {
    const data = parsed.learning_tip && parsed.learning_tip.content
      ? parsed.learning_tip.content
      : parsed.content || parsed.snapshot || parsed.table || parsed;
    let rows: { param: string; value: string }[] = [];

    if (data && data.headers && data.rows) {
      rows = data.rows.map((r: any) => ({
        param: r.cells ? r.cells[0] : r.parameter || r.param || "",
        value: r.cells ? r.cells[1] : r.value || ""
      }));
    } else if (Array.isArray(data)) {
      rows = data.map((r: any) => { const keys = Object.keys(r); return { param: r[keys[0]] || "", value: r[keys[1]] || "" }; });
    } else if (typeof data === "object") {
      rows = Object.entries(data).map(([k, v]) => ({ param: k, value: String(v) }));
    }

    if (rows.length === 0) return rawText;
    const bodyRows = rows.map((r, i) => {
      const bg = i % 2 === 0 ? "#0f172a" : "#0d1526";
      return `<tr style="background:${bg};color:#e2e8f0;">
        <td style="padding:8px;border:1px solid #334155;font-weight:600;color:#a5b4fc;">${r.param}</td>
        <td style="padding:8px;border:1px solid #334155;">${r.value}</td>
      </tr>`;
    }).join("");
    return sanitizeHtml(`<table style="width:100%;border-collapse:collapse;font-size:14px;">
  <thead><tr style="background:#1e293b;color:white;">
    <th style="padding:8px;border:1px solid #334155;text-align:left;">Parameter</th>
    <th style="padding:8px;border:1px solid #334155;text-align:left;">Value</th>
  </tr></thead>
  <tbody>${bodyRows}</tbody>
</table>`);
  }

  // ── mindmap JSON ──
  if (type === "mindmap") {
    const root = parsed.mindmap_tip || parsed.mindmap ||
      (parsed.learning_tip && parsed.learning_tip.content) ||
      parsed.content || parsed;
    const central = root.central_idea || root.central_topic || root.topic || root.center || "Topic";
    const branches: any[] = root.branches || root.nodes || [];

    const renderNodes = (nodes: any[], depth: number): string => {
      if (!nodes || nodes.length === 0) return "";
      const bg = depth === 1 ? "#0ea5e9" : "#1e293b";
      const color = depth === 1 ? "white" : "#94a3b8";
      return nodes.map((n: any) => {
        const label = typeof n === "string" ? n : n.leaf || n.idea || n.name || n.label || n.topic || "";
        const rawChildren = typeof n === "object" ? (n.nodes || n.subtopics || n.sub_branches || n.children || n.details || []) : [];
        const children: any[] = Array.isArray(rawChildren) ? rawChildren : typeof rawChildren === "string" ? [{ label: rawChildren, children: [] }] : [];
        const childrenHtml = children.length > 0
          ? `<div style="padding-left:10px;border-left:2px solid #334155;margin-top:4px;display:flex;flex-direction:column;gap:4px;">${renderNodes(children, depth + 1)}</div>`
          : "";
        return `<div style="display:flex;flex-direction:column;gap:4px;">
          <div style="background:${bg};color:${color};padding:${depth === 1 ? "8px 14px" : "5px 10px"};border-radius:${depth === 1 ? "12px" : "6px"};font-size:${depth === 1 ? "13px" : "11px"};font-weight:${depth === 1 ? "600" : "normal"};">${label}</div>
          ${childrenHtml}
        </div>`;
      }).join("");
    };

    const branchHtml = branches.map((b: any) => {
      const label = typeof b === "string" ? b : b.leaf || b.idea || b.name || b.label || b.topic || "";
      const rawChildren = typeof b === "object" ? (b.nodes || b.subtopics || b.sub_branches || b.children || b.details || []) : [];
      const children: any[] = Array.isArray(rawChildren) ? rawChildren : typeof rawChildren === "string" ? [{ label: rawChildren, children: [] }] : [];
      return `<div style="background:#0f172a;border:1px solid #1e293b;border-radius:14px;padding:12px;min-width:180px;max-width:240px;">
        <div style="background:#6366f1;color:white;padding:7px 14px;border-radius:10px;font-weight:700;font-size:13px;margin-bottom:8px;">${label}</div>
        <div style="display:flex;flex-direction:column;gap:4px;">${renderNodes(children, 1)}</div>
      </div>`;
    }).join("");

    return sanitizeHtml(`<div style="display:flex;flex-direction:column;align-items:center;gap:20px;font-family:sans-serif;padding:16px;">
  <div style="background:#6366f1;color:white;padding:12px 28px;border-radius:20px;font-weight:bold;font-size:16px;text-align:center;">${central}</div>
  <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;align-items:flex-start;">${branchHtml}</div>
</div>`);
  }

  // ── timeline_anchor JSON ──
  if (type === "timeline_anchor") {
    const data = (parsed.learning_tip && parsed.learning_tip.content) || parsed.content || parsed.timeline || parsed;
    const events: any[] = Array.isArray(data) ? data : data.events || data.steps || [];
    const eventHtml = events.map((e: any) => {
      const evtTitle = e.title || e.event || e.name || e.step || "";
      const desc = e.description || e.detail || e.details || e.content || "";
      return (
        "<div style=\"display:flex;align-items:flex-start;gap:12px;\">" +
        "<div style=\"display:flex;flex-direction:column;align-items:center;\">" +
        "<div style=\"width:14px;height:14px;border-radius:50%;background:#6366f1;margin-top:3px;flex-shrink:0;\"></div>" +
        "<div style=\"width:2px;flex:1;background:#334155;min-height:36px;\"></div>" +
        "</div>" +
        "<div style=\"padding-bottom:20px;\">" +
        "<div style=\"color:#a5b4fc;font-weight:bold;\">" + evtTitle + "</div>" +
        "<div style=\"color:#94a3b8;font-size:13px;\">" + desc + "</div>" +
        "</div></div>"
      );
    }).join("");
    return sanitizeHtml(
      "<div style=\"display:flex;flex-direction:column;gap:0;font-family:sans-serif;padding:10px;\">" + eventHtml + "</div>"
    );
  }

  // ── icon_based_mapping JSON ──
  if (type === "icon_based_mapping") {
    const data = (parsed.learning_tip && parsed.learning_tip.content) || parsed.content || parsed.items || parsed.mapping || parsed;
    const items: any[] = Array.isArray(data) ? data : data.points || data.bullet_points || data.facts || [];

    const itemHtml = items.map((item: any) => {
      let icon = "";
      let text = "";
      if (typeof item === "string") {
        const emojiMatch = item.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*/u);
        if (emojiMatch) { icon = emojiMatch[1]; text = item.replace(emojiMatch[0], "").trim(); }
        else { text = item; icon = getEmoji(text); }
      } else {
        const rawIcon = item.icon || item.emoji || item.symbol || "";
        text = item.text || item.point || item.content || item.description || item.fact || item.label || "";
        icon = (rawIcon && rawIcon.length <= 4) ? rawIcon : getEmoji(text);
      }
      return `<li style="display:flex;gap:10px;align-items:flex-start;padding:8px 0;color:#e2e8f0;border-bottom:1px solid #1e293b;">
    <span style="font-size:20px;">${icon}</span>
    <span>${text}</span>
  </li>`;
    }).join("");

    return sanitizeHtml(`<ul style="list-style:none;padding:0;font-family:sans-serif;">${itemHtml}</ul>`);
  }

  return rawText;
};

// ─────────────────────────────────────────────
// 🔹 GENERATE TIP
// ─────────────────────────────────────────────
export const generateTip = async (req: Request, res: Response) => {
  try {
    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const { title, content, type, interests, aspect, language } = req.body;

    if (!title || !type || !aspect) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // ─── KEY FIX: normalize type before any lookup ───
    const normalizedType = normalizeType(type);

    // ── Vérifier et débiter les crédits ──
    const user = await prisma.user.findUnique({
      where: { id: clerkUserId }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.credits <= 0) {
      return res.status(403).json({ success: false, message: "No credits left" });
    }

    await prisma.user.update({
      where: { id: clerkUserId },
      data: { credits: { decrement: 1 } }
    });

    const tip = await Tip.create({
      userId: clerkUserId,
      title,
      type: normalizedType,
      interests,
      aspect,
      isGenerating: true,
    });

    const typePrompt = (stylePrompts[normalizedType] || "").replace('"{title}"', '"' + title + '"');

    const HTML_TYPES = [
  "comparative_table", "high_yield_snapshot_table", "mindmap",
  "timeline_anchor", "simplified_flowchart", "icon_based_mapping",
  "disease_poster", "story_encoding", "chunking_strategy", "clinical_algorithm",
  "cause_mechanism_consequence", "socratic_questioning",
  "mini_case_challenge", "error_detection_mode"  // ← ces 4 doivent être là
];

    const isStructuredType = HTML_TYPES.includes(normalizedType);
  
  
    const combinedPrompt = isStructuredType ? `
You are Timep AI, a medical learning assistant for MEDICAL STUDENTS and SPECIALIST PHYSICIANS.
Réponds toujours en français.
Target audience: Medical students (ECN/USMLE level) and resident physicians. Use precise medical terminology, real thresholds, drug names, and guideline references (HAS/ESC/ACC/AHA).

Generate a "${normalizedType}" learning tip for the topic: "${title}".

CRITICAL RULE: The user loves ${interests && interests.length > 0 ? interests.join(", ") : "medicine"}. You MUST integrate these interests as metaphors, analogies, or anchors throughout the content. This is NOT optional.

CRITICAL: You MUST follow the format

${typePrompt}

Topic: "${title}"
Replace ALL placeholder text with real medical content about this topic. Use the user's interests (${interests && interests.length > 0 ? interests.join(", ") : "none"}) as creative anchors.
` : `
You are Timep AI, a medical learning assistant for MEDICAL STUDENTS and SPECIALIST PHYSICIANS.
Réponds toujours en français.
Target audience: Medical students (ECN/USMLE level) and resident physicians. Use precise medical terminology, real thresholds, drug names, and guideline references (HAS/ESC/ACC/AHA).

Generate a "${normalizedType}" learning tip for the topic: "${title}".
Learning Mode: ${aspect}

CRITICAL RULE: The user loves ${interests && interests.length > 0 ? interests.join(", ") : "medicine"}. You MUST integrate these interests as metaphors, analogies, or anchors throughout the content. This is NOT optional.

STRICT FORMAT RULES (follow exactly):
${typePrompt}

Additional rules:
- Adapt creatively to the user's interests but keep it medically accurate and concise.
- Directly usable for revision.
- NO introduction sentence.
- NO extra commentary outside the format above.
- All placeholder text in the format must be replaced with real, accurate medical content about "${title}".

Now generate the tip.
`;
    const generatedText = await generateWithRotation(combinedPrompt);

    if (!generatedText) throw new Error("No text returned from AI");

    tip.content = HTML_TYPES.includes(normalizedType)
      ? convertJsonToHtml(generatedText, normalizedType, title)
      : generatedText;

    // ── Détecter la spécialité en arrière-plan ──
    detectSpecialty(title).then(specialty => {
      Tip.findByIdAndUpdate(tip._id, { specialty }).catch(console.error);
      console.log(`🏥 Specialty detected: ${specialty} for "${title}"`);
    });

    tip.isGenerating = false;
    await tip.save();

    res.status(201).json({ success: true, data: tip });

  } catch (error) {
    console.error("Generate Tip Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ─────────────────────────────────────────────
// 🔹 DELETE TIP
// ─────────────────────────────────────────────
export const deleteTip = async (req: Request, res: Response) => {
  try {
    const userId = getClerkUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const { id } = req.params;
    const tip = await Tip.findOneAndDelete({ _id: id, userId });

    if (!tip) {
      return res.status(404).json({ success: false, message: "Tip not found" });
    }

    res.json({ success: true, message: "Tip deleted successfully" });

  } catch (error) {
    console.error("Delete Tip Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ─────────────────────────────────────────────
// 🔹 GET USER TIPS
// ─────────────────────────────────────────────
export const getUserTips = async (req: Request, res: Response) => {
  try {
    const userId = getClerkUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    const tips = await Tip.find({ userId }).sort({ createdAt: -1 });
    res.json({ tip: tips });

  } catch (error) {
    console.error("Get User Tips Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

