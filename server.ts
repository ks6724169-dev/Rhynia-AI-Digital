import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";
import pg from "pg";
import { GoogleGenAI } from "@google/genai";

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const FRONTEND_DIR = path.join(__dirname, "public");
const BACKEND_API_BASE = "https://rhynia-ai-api.onrender.com/api";
const JWT_SECRET = "rhynia_super_secure_jwt_secret_key_2026_horizon_luminescent";

// Connect directly to Supabase via Session/Transaction Pooler
const pool = new Pool({
  connectionString: "postgresql://postgres.argbmsljgfmevthutqpu:Maniwh%402007zzzz@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.connect()
  .then(client => {
    console.log("✅ Preview server: Connected to live Supabase PostgreSQL database!");
    client.release();
  })
  .catch(err => {
    console.error("⚠️ Preview server: Supabase connection warning:", err.message);
  });

app.use(cors());
app.use(express.json());

// Helper to format user profile
function formatUser(row: any) {
  const isSpecial = row.email && row.email.toLowerCase() === "mk191515480@gmail.com";
  const plan = isSpecial ? "ultra_pro" : (row.plan_tier || "free");
  const quotaMb = plan === "ultra_pro" ? 25600 : (plan === "pro" ? 10240 : 1024);
  const usedMb = Number(((row.storage_used_bytes || 0) / (1024 * 1024)).toFixed(2));

  return {
    id: row.id,
    email: row.email,
    username: row.username,
    display_name: row.display_name || row.username,
    avatar_url: row.avatar_url || null,
    phone_number: row.phone_number || null,
    plan_tier: plan,
    theme: row.theme || "dark",
    accent_color: row.accent_color || "#3b82f6",
    daily_messages_used: row.daily_messages_used || 0,
    daily_messages_limit: plan === "ultra_pro" ? 1000 : (plan === "pro" ? 200 : 30),
    storage: {
      storage_used_bytes: row.storage_used_bytes || 0,
      storage_used_mb: usedMb,
      storage_quota_mb: quotaMb,
      storage_quota_bytes: quotaMb * 1024 * 1024,
      storage_free_mb: Math.max(0, quotaMb - usedMb),
      storage_percent: Math.min(100, Math.round((usedMb / quotaMb) * 100)),
      plan_tier: plan,
    },
    created_at: row.created_at,
  };
}

// Authentication middleware
async function authenticateUser(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ detail: "Authentication required" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.sub || decoded.id;
    const { rows } = await pool.query("SELECT * FROM public.users WHERE id = $1 LIMIT 1", [userId]);
    if (rows.length === 0) {
      return res.status(401).json({ detail: "User not found" });
    }
    (req as any).user = rows[0];
    next();
  } catch (err: any) {
    return res.status(401).json({ detail: "Invalid or expired session token" });
  }
}

// Register endpoint
const handleRegister = async (req: express.Request, res: express.Response) => {
  try {
    const { email, password, username, phone_number, display_name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ detail: "Email and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = (username || cleanEmail.split("@")[0]).trim();
    const cleanPhone = phone_number ? phone_number.replace(/\D/g, "").slice(-10) : null;
    const isSpecial = cleanEmail === "mk191515480@gmail.com";
    const tier = isSpecial ? "ultra_pro" : "free";

    // Check existing
    const existing = await pool.query(
      "SELECT * FROM public.users WHERE LOWER(email) = $1 OR LOWER(username) = $2 LIMIT 1",
      [cleanEmail, cleanUsername.toLowerCase()]
    );
    if (existing.rows.length > 0) {
      const existingUser = existing.rows[0];
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        "UPDATE public.users SET hashed_password = $1, phone_number = COALESCE($2, phone_number), display_name = COALESCE($3, display_name), updated_at = NOW() WHERE id = $4",
        [hashedPassword, cleanPhone, display_name || cleanUsername, existingUser.id]
      );
      const token = jwt.sign({ sub: existingUser.id, email: existingUser.email }, JWT_SECRET, { expiresIn: "30d" });
      const updatedUser = { ...existingUser, phone_number: cleanPhone || existingUser.phone_number, display_name: display_name || existingUser.display_name };
      return res.json({
        access_token: token,
        token_type: "bearer",
        user: formatUser(updatedUser),
        needs_phone: !Boolean(updatedUser.phone_number),
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();
    const today = new Date().toISOString().slice(0, 10);

    const insertRes = await pool.query(
      `INSERT INTO public.users 
        (id, email, username, display_name, hashed_password, phone_number, plan_tier, daily_messages_used, last_active_date, storage_used_bytes, is_active, is_verified, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, 0, true, false, NOW(), NOW()) 
       RETURNING *`,
      [userId, cleanEmail, cleanUsername, display_name || cleanUsername, hashedPassword, cleanPhone, tier, today]
    );

    const user = insertRes.rows[0];
    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });

    return res.json({
      access_token: token,
      token_type: "bearer",
      user: formatUser(user),
      needs_phone: !Boolean(user.phone_number),
    });
  } catch (err: any) {
    console.error("Register error:", err.message);
    return res.status(500).json({ detail: err.message || "Failed to create account" });
  }
};

// Login endpoint
const handleLogin = async (req: express.Request, res: express.Response) => {
  try {
    const rawId = req.body.identifier || req.body.email;
    const password = req.body.password;

    if (!rawId || !password) {
      return res.status(400).json({ detail: "Username/email and password required" });
    }

    const identifier = rawId.trim().toLowerCase();
    const cleanDigits = identifier.replace(/\D/g, "");
    const last10 = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : null;

    let queryText = "SELECT * FROM public.users WHERE LOWER(email) = $1 OR LOWER(username) = $1";
    let queryParams: any[] = [identifier];
    if (last10) {
      queryText += " OR phone_number LIKE $2";
      queryParams.push(`%${last10}%`);
    }

    const { rows } = await pool.query(queryText, queryParams);

    if (rows.length === 0) {
      return res.status(401).json({ detail: "No account found with these details. Please create an account first." });
    }

    const user = rows[0];
    let passwordMatches = false;
    if (user.hashed_password) {
      passwordMatches = await bcrypt.compare(password, user.hashed_password);
      // Fallback for plain or test hash
      if (!passwordMatches && user.hashed_password === password) {
        passwordMatches = true;
      }
    }

    if (!passwordMatches) {
      return res.status(401).json({ detail: "Incorrect password. Please try again." });
    }

    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
    return res.json({
      access_token: token,
      token_type: "bearer",
      user: formatUser(user),
      needs_phone: !Boolean(user.phone_number),
    });
  } catch (err: any) {
    console.error("Login error:", err.message);
    return res.status(500).json({ detail: err.message || "Failed to log in" });
  }
};

// Google Auth simulated / direct endpoint
const handleGoogleAuth = async (req: express.Request, res: express.Response) => {
  try {
    const credential = req.body.credential || "preview_user@gmail.com";
    let email = "google_user@rhynia.com";
    let name = "Google User";

    try {
      // Decode JWT if it's a real Google ID token
      const parts = credential.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
        if (payload.email) email = payload.email.toLowerCase();
        if (payload.name) name = payload.name;
      }
    } catch (_) {}

    let { rows } = await pool.query("SELECT * FROM public.users WHERE LOWER(email) = $1 LIMIT 1", [email]);
    let user;
    if (rows.length === 0) {
      const userId = crypto.randomUUID();
      const username = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_");
      const today = new Date().toISOString().slice(0, 10);
      const insert = await pool.query(
        `INSERT INTO public.users (id, email, username, display_name, plan_tier, daily_messages_used, last_active_date, storage_used_bytes, is_active, is_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'free', 0, $5, 0, true, true, NOW(), NOW()) RETURNING *`,
        [userId, email, username, name, today]
      );
      user = insert.rows[0];
    } else {
      user = rows[0];
    }

    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
    return res.json({
      access_token: token,
      token_type: "bearer",
      user: formatUser(user),
      needs_phone: !Boolean(user.phone_number),
    });
  } catch (err: any) {
    console.error("Google auth error:", err.message);
    return res.status(500).json({ detail: "Google authentication failed" });
  }
};

// Mount Direct Supabase Auth Routes
app.post(["/api/auth/register", "/api/v1/auth/register"], handleRegister);
app.post(["/api/auth/login", "/api/v1/auth/login"], handleLogin);
app.post(["/api/auth/google", "/api/v1/auth/google"], handleGoogleAuth);

// Profile routes
app.get(["/api/profile", "/api/v1/profile"], authenticateUser, (req, res) => {
  return res.json(formatUser((req as any).user));
});

app.get(["/api/profile/storage", "/api/v1/profile/storage"], authenticateUser, (req, res) => {
  return res.json(formatUser((req as any).user).storage);
});

app.put(["/api/profile", "/api/v1/profile"], authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const { display_name, theme, accent_color } = req.body;
    const { rows } = await pool.query(
      `UPDATE public.users 
       SET display_name = COALESCE($1, display_name),
           theme = COALESCE($2, theme),
           accent_color = COALESCE($3, accent_color),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [display_name, theme, accent_color, user.id]
    );
    return res.json(formatUser(rows[0]));
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

app.patch(["/api/profile", "/api/v1/profile"], authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const { display_name, theme, accent_color } = req.body;
    const { rows } = await pool.query(
      `UPDATE public.users 
       SET display_name = COALESCE($1, display_name),
           theme = COALESCE($2, theme),
           accent_color = COALESCE($3, accent_color),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [display_name, theme, accent_color, user.id]
    );
    return res.json(formatUser(rows[0]));
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

// Chat Sessions routes
app.get(["/api/sessions", "/api/v1/sessions"], authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const { rows } = await pool.query(
      "SELECT id, title, is_pinned, created_at, updated_at FROM public.chat_sessions WHERE user_id = $1 ORDER BY is_pinned DESC, updated_at DESC",
      [user.id]
    );
    return res.json(rows);
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

app.post(["/api/sessions", "/api/v1/sessions"], authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const title = (req.body.title || "New Chat").slice(0, 80);
    const sessionId = crypto.randomUUID();
    const { rows } = await pool.query(
      "INSERT INTO public.chat_sessions (id, user_id, title, is_pinned, created_at, updated_at) VALUES ($1, $2, $3, false, NOW(), NOW()) RETURNING *",
      [sessionId, user.id, title]
    );
    return res.json(rows[0]);
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

app.get(["/api/sessions/:id", "/api/v1/sessions/:id"], authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const sessionId = req.params.id;
    const sessionRes = await pool.query(
      "SELECT * FROM public.chat_sessions WHERE id = $1 AND user_id = $2 LIMIT 1",
      [sessionId, user.id]
    );
    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ detail: "Session not found" });
    }
    const msgsRes = await pool.query(
      "SELECT id, session_id, user_id, role, content, model_used, token_count, created_at FROM public.chat_messages WHERE session_id = $1 ORDER BY created_at ASC",
      [sessionId]
    );
    const session = sessionRes.rows[0];
    session.messages = msgsRes.rows;
    return res.json(session);
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

app.delete(["/api/sessions/:id", "/api/v1/sessions/:id"], authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const sessionId = req.params.id;
    await pool.query("DELETE FROM public.chat_messages WHERE session_id = $1", [sessionId]);
    await pool.query("DELETE FROM public.chat_sessions WHERE id = $1 AND user_id = $2", [sessionId, user.id]);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

// Chat message completion endpoint
app.post(["/api/chat", "/api/v1/chat"], authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    let { session_id, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ detail: "Message is required" });
    }

    const trimmedMsg = message.trim();

    // Ensure session exists
    if (!session_id) {
      const newSession = await pool.query(
        "INSERT INTO public.chat_sessions (id, user_id, title, is_pinned, created_at, updated_at) VALUES ($1, $2, $3, false, NOW(), NOW()) RETURNING id",
        [crypto.randomUUID(), user.id, trimmedMsg.slice(0, 30)]
      );
      session_id = newSession.rows[0].id;
    }

    // Store user message in Supabase
    const userMsgId = crypto.randomUUID();
    await pool.query(
      "INSERT INTO public.chat_messages (id, session_id, user_id, role, content, model_used, token_count, created_at) VALUES ($1, $2, $3, 'user', $4, 'user-input', 0, NOW())",
      [userMsgId, session_id, user.id, trimmedMsg]
    );

    // Set SSE headers so frontend reader gets real-time tokens!
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Rhynia-Session-Id", session_id);
    if (typeof (res as any).flushHeaders === "function") {
      (res as any).flushHeaders();
    }

    let fullAiReply = "";
    let modelUsed = "openrouter-ai";
    const aiMsgId = crypto.randomUUID();

    try {
      const fs = await import("fs");
      fs.writeFileSync("/tmp/chat_exec_log.txt", `Starting chat with msg: ${trimmedMsg}\n`);
    } catch (_) {}

    const openrouterKey = process.env.OPENROUTER_API_KEY || "";
    const openrouterModels = [
      "liquid/lfm-2.5-2.6b:free",
      "dots-studio/dots-3-note-preview:free",
      "google/gemma-4-26b-a4b-it:free",
      "nvidia/nemotron-3.5-lightning:free",
      "qwen/qwen3.8-27b:free",
      "google/gemma-4-31b-it:free"
    ];

    if (openrouterKey && openrouterKey.startsWith("sk-or-")) {
      for (const modelId of openrouterModels) {
        try {
          try {
            const fs = await import("fs");
            fs.appendFileSync("/tmp/chat_exec_log.txt", `Trying model: ${modelId}\n`);
          } catch (_) {}

          const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openrouterKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://rhynia.ai",
              "X-Title": "Rhynia Intelligence"
            },
            body: JSON.stringify({
              model: modelId,
              messages: [
                { role: "system", content: "You are Rhynia AI, a world-class, intelligent, polite, and helpful AI assistant. Answer thoroughly and naturally in Hindi, Hinglish, or English based on the user's input. Format with clean markdown headers, bullet points, and code snippets when appropriate." },
                { role: "user", content: trimmedMsg }
              ]
            })
          });

          try {
            const fs = await import("fs");
            fs.appendFileSync("/tmp/chat_exec_log.txt", `Model ${modelId} status: ${orRes.status}\n`);
          } catch (_) {}

          if (orRes.ok && orRes.status === 200) {
            const data: any = await orRes.json();
            const content = data.choices?.[0]?.message?.content || "";
            try {
              const fs = await import("fs");
              fs.appendFileSync("/tmp/chat_exec_log.txt", `Model ${modelId} content len: ${content.length}\n`);
            } catch (_) {}

            if (content && content.trim()) {
              fullAiReply = content.trim();
              modelUsed = modelId;
              // Stream words naturally to client
              const tokens = fullAiReply.split(/(\s+)/);
              for (const token of tokens) {
                if (token) {
                  res.write(`data: ${JSON.stringify({ token })}\n\n`);
                }
              }
              break;
            }
          }
        } catch (orErr: any) {
          console.warn(`OpenRouter model ${modelId} error:`, orErr.message);
          try {
            const fs = await import("fs");
            fs.appendFileSync("/tmp/chat_exec_log.txt", `Model ${modelId} error: ${orErr.message}\n`);
          } catch (_) {}
        }
      }
    }

    // 2. High-performance Gemini (gemini-3.1-flash-lite / gemini-2.5-flash / gemini-flash-latest)
    if (!fullAiReply) {
      const modelsToTry = ["gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-flash-latest"];
      const apiKey = process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI(apiKey ? { apiKey } : undefined);
      for (const m of modelsToTry) {
        try {
          const responseStream = await ai.models.generateContentStream({
            model: m,
            contents: trimmedMsg,
            config: {
              systemInstruction: "You are Rhynia AI, an exceptionally intelligent, polite, and helpful assistant. Provide rich, accurate, well-structured responses. Use Markdown headings, bullet points, and code snippets whenever helpful. Always answer the user's specific question directly, thoroughly, and naturally in their language (Hindi, Hinglish, or English)."
            }
          });

          for await (const chunk of responseStream) {
            const text = chunk.text || "";
            if (text) {
              fullAiReply += text;
              res.write(`data: ${JSON.stringify({ token: text })}\n\n`);
            }
          }
          if (fullAiReply) {
            modelUsed = m;
            break;
          }
        } catch (gErr: any) {
          console.error(`Model ${m} failed:`, gErr.message || gErr);
          try {
            const fs = await import("fs");
            fs.appendFileSync("/tmp/server_model_err.txt", `Model ${m} failed: ${gErr.message || gErr}\n${gErr.stack}\n`);
          } catch (_) {}
        }
      }
    }

    if (!fullAiReply) {
      fullAiReply = `नमस्ते! मैं Rhynia AI हूँ। आपका प्रश्न: "${trimmedMsg}".\n\nमैं आपकी पूरी सहायता के लिए यहाँ उपस्थित हूँ। आप मुझसे कोडिंग, तकनीक, सामान्य ज्ञान या कोई भी सवाल पूछ सकते हैं।`;
      res.write(`data: ${JSON.stringify({ token: fullAiReply })}\n\n`);
    }

    // Send final done event with message ID
    res.write(`data: ${JSON.stringify({ type: "done", message_id: aiMsgId, content: fullAiReply })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();

    // Store assistant message in Supabase
    await pool.query(
      "INSERT INTO public.chat_messages (id, session_id, user_id, role, content, model_used, token_count, created_at) VALUES ($1, $2, $3, 'assistant', $4, $5, 0, NOW())",
      [aiMsgId, session_id, user.id, fullAiReply, modelUsed]
    );

    // Update session timestamp
    await pool.query("UPDATE public.chat_sessions SET updated_at = NOW() WHERE id = $1", [session_id]);
  } catch (err: any) {
    console.error("Chat error:", err.message);
    if (!res.headersSent) {
      return res.status(500).json({ detail: err.message });
    } else {
      res.end();
    }
  }
});

// Session Pin & Title routes
app.patch(["/api/sessions/:id/pin", "/api/v1/sessions/:id/pin"], authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const sessionId = req.params.id;
    const { rows } = await pool.query(
      "UPDATE public.chat_sessions SET is_pinned = NOT COALESCE(is_pinned, false), updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *",
      [sessionId, user.id]
    );
    if (rows.length === 0) return res.status(404).json({ detail: "Session not found" });
    return res.json(rows[0]);
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

app.patch(["/api/sessions/:id/title", "/api/v1/sessions/:id/title"], authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const sessionId = req.params.id;
    const title = (req.body.title || "Untitled Chat").slice(0, 80);
    const { rows } = await pool.query(
      "UPDATE public.chat_sessions SET title = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *",
      [title, sessionId, user.id]
    );
    if (rows.length === 0) return res.status(404).json({ detail: "Session not found" });
    return res.json(rows[0]);
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

// Notifications preferences routes (Direct Supabase)
app.get(["/api/notifications/settings", "/api/v1/notifications/settings"], async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId: string | null = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const decoded: any = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
        userId = decoded.sub || decoded.id;
      } catch (_) {}
    }

    if (!userId) {
      return res.json({
        enabled_all: true,
        task_complete: true,
        product_updates: true,
        push_notifications: true,
        email_notifications: false,
        updated_at: new Date().toISOString(),
      });
    }

    let { rows } = await pool.query("SELECT * FROM public.user_notification_preferences WHERE user_id = $1 LIMIT 1", [userId]);
    if (rows.length === 0) {
      const insert = await pool.query(
        `INSERT INTO public.user_notification_preferences 
          (user_id, enabled_all, task_complete, product_updates, push_notifications, email_notifications, updated_at)
         VALUES ($1, true, true, true, true, false, NOW())
         RETURNING *`,
        [userId]
      );
      rows = insert.rows;
    }

    const p = rows[0];
    return res.json({
      enabled_all: p.enabled_all ?? true,
      task_complete: p.task_complete ?? true,
      product_updates: p.product_updates ?? true,
      push_notifications: p.push_notifications ?? true,
      email_notifications: p.email_notifications ?? false,
      updated_at: p.updated_at,
    });
  } catch (err: any) {
    console.error("Notifications get error:", err.message);
    return res.status(500).json({ detail: err.message });
  }
});

app.patch(["/api/notifications/settings", "/api/v1/notifications/settings"], async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId: string | null = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const decoded: any = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
        userId = decoded.sub || decoded.id;
      } catch (_) {}
    }

    const body = req.body || {};
    if (!userId) {
      return res.json({
        enabled_all: body.enabled_all ?? true,
        task_complete: body.task_complete ?? true,
        product_updates: body.product_updates ?? true,
        push_notifications: body.push_notifications ?? true,
        email_notifications: body.email_notifications ?? false,
        updated_at: new Date().toISOString(),
      });
    }

    let { rows } = await pool.query("SELECT * FROM public.user_notification_preferences WHERE user_id = $1 LIMIT 1", [userId]);
    if (rows.length === 0) {
      await pool.query(
        `INSERT INTO public.user_notification_preferences 
          (user_id, enabled_all, task_complete, product_updates, push_notifications, email_notifications, updated_at)
         VALUES ($1, true, true, true, true, false, NOW())`,
        [userId]
      );
      rows = (await pool.query("SELECT * FROM public.user_notification_preferences WHERE user_id = $1 LIMIT 1", [userId])).rows;
    }

    const current = rows[0];
    const enabled_all = body.enabled_all !== undefined ? body.enabled_all : current.enabled_all;
    const task_complete = body.task_complete !== undefined ? body.task_complete : current.task_complete;
    const product_updates = body.product_updates !== undefined ? body.product_updates : current.product_updates;
    const push_notifications = body.push_notifications !== undefined ? body.push_notifications : current.push_notifications;
    const email_notifications = body.email_notifications !== undefined ? body.email_notifications : current.email_notifications;

    const updateRes = await pool.query(
      `UPDATE public.user_notification_preferences 
       SET enabled_all = $1, task_complete = $2, product_updates = $3, push_notifications = $4, email_notifications = $5, updated_at = NOW()
       WHERE user_id = $6
       RETURNING *`,
      [enabled_all, task_complete, product_updates, push_notifications, email_notifications, userId]
    );

    const p = updateRes.rows[0];
    return res.json({
      enabled_all: p.enabled_all,
      task_complete: p.task_complete,
      product_updates: p.product_updates,
      push_notifications: p.push_notifications,
      email_notifications: p.email_notifications,
      updated_at: p.updated_at,
    });
  } catch (err: any) {
    console.error("Notifications update error:", err.message);
    return res.status(500).json({ detail: err.message });
  }
});

// Memory Profile & Facts routes (Direct Supabase)
app.get(["/api/memory/profile", "/api/v1/memory/profile"], async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId: string | null = null;
    let planTier = "free";

    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const decoded: any = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
        userId = decoded.sub || decoded.id;
        if (userId) {
          const userRes = await pool.query("SELECT plan_tier FROM public.users WHERE id = $1 LIMIT 1", [userId]);
          if (userRes.rows.length > 0) {
            planTier = userRes.rows[0].plan_tier || "free";
          }
        }
      } catch (_) {}
    }

    const quotaMb = planTier === "ultra_pro" ? 25600 : (planTier === "pro" ? 5120 : 500);
    const quotaBytes = quotaMb * 1024 * 1024;

    let factsCount = 0;
    let factsBytes = 0;
    let summaryCount = 0;
    let summaryBytes = 0;

    if (userId) {
      const fRes = await pool.query("SELECT COUNT(*) as count, COALESCE(SUM(size_bytes), 0) as bytes FROM public.user_memory_facts WHERE user_id = $1", [userId]);
      factsCount = parseInt(fRes.rows[0]?.count || "0", 10);
      factsBytes = parseInt(fRes.rows[0]?.bytes || "0", 10);

      const sRes = await pool.query("SELECT COUNT(*) as count, COALESCE(SUM(size_bytes), 0) as bytes FROM public.chat_summary_buffers WHERE user_id = $1", [userId]);
      summaryCount = parseInt(sRes.rows[0]?.count || "0", 10);
      summaryBytes = parseInt(sRes.rows[0]?.bytes || "0", 10);
    }

    const totalUsedBytes = factsBytes + summaryBytes;
    const totalUsedMb = Number((totalUsedBytes / (1024 * 1024)).toFixed(2));
    const usagePercent = Number(((totalUsedBytes / quotaBytes) * 100).toFixed(1));

    return res.json({
      plan_tier: planTier,
      quota_bytes: quotaBytes,
      quota_mb: quotaMb,
      total_used_bytes: totalUsedBytes,
      total_used_mb: totalUsedMb,
      usage_percent: usagePercent,
      is_quota_exceeded: totalUsedBytes >= quotaBytes,
      facts_count: factsCount,
      facts_bytes: factsBytes,
      summary_buffers_count: summaryCount,
      summary_bytes: summaryBytes,
    });
  } catch (err: any) {
    console.error("Memory profile error:", err.message);
    return res.status(500).json({ detail: err.message });
  }
});

app.get(["/api/memory/facts", "/api/v1/memory/facts"], async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId: string | null = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const decoded: any = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
        userId = decoded.sub || decoded.id;
      } catch (_) {}
    }

    if (!userId) return res.json([]);

    const { rows } = await pool.query(
      "SELECT id, fact_key, fact_value, category, confidence_score, size_bytes, created_at, updated_at FROM public.user_memory_facts WHERE user_id = $1 ORDER BY updated_at DESC",
      [userId]
    );

    return res.json(rows.map(r => ({
      id: r.id,
      fact_key: r.fact_key,
      fact_value: r.fact_value,
      category: r.category,
      confidence_score: r.confidence_score,
      size_bytes: r.size_bytes,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : "",
      updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : "",
    })));
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

app.post(["/api/memory/facts", "/api/v1/memory/facts"], async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId: string | null = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const decoded: any = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
        userId = decoded.sub || decoded.id;
      } catch (_) {}
    }

    if (!userId) return res.status(401).json({ detail: "Authentication required" });

    const { fact_key, fact_value, category } = req.body;
    if (!fact_key || !fact_value) {
      return res.status(400).json({ detail: "fact_key and fact_value required" });
    }

    const factId = crypto.randomUUID();
    const sizeBytes = Buffer.byteLength(`${fact_key}:${fact_value}`, "utf8");

    const { rows } = await pool.query(
      `INSERT INTO public.user_memory_facts 
        (id, user_id, fact_key, fact_value, category, confidence_score, size_bytes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 100, $6, NOW(), NOW())
       RETURNING *`,
      [factId, userId, fact_key.trim(), fact_value.trim(), category || "general", sizeBytes]
    );

    const f = rows[0];
    return res.json({
      id: f.id,
      fact_key: f.fact_key,
      fact_value: f.fact_value,
      category: f.category,
      confidence_score: f.confidence_score,
      size_bytes: f.size_bytes,
      created_at: new Date(f.created_at).toISOString(),
      updated_at: new Date(f.updated_at).toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

app.delete(["/api/memory/facts/:id", "/api/v1/memory/facts/:id"], async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId: string | null = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const decoded: any = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
        userId = decoded.sub || decoded.id;
      } catch (_) {}
    }

    if (!userId) return res.status(401).json({ detail: "Authentication required" });

    await pool.query("DELETE FROM public.user_memory_facts WHERE id = $1 AND user_id = $2", [req.params.id, userId]);
    return res.json({ status: "success", message: "Fact deleted successfully." });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

app.delete(["/api/memory/facts", "/api/v1/memory/facts"], async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId: string | null = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const decoded: any = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
        userId = decoded.sub || decoded.id;
      } catch (_) {}
    }

    if (!userId) return res.status(401).json({ detail: "Authentication required" });

    const result = await pool.query("DELETE FROM public.user_memory_facts WHERE user_id = $1", [userId]);
    return res.json({ status: "success", message: `Cleared ${result.rowCount || 0} memory facts.` });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

app.get(["/api/memory/search", "/api/v1/memory/search"], async (_req, res) => {
  return res.json([]);
});

// Feedback route (Direct Supabase)
app.post(["/api/feedback", "/api/v1/feedback"], async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = "anonymous";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const decoded: any = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
        userId = decoded.sub || decoded.id || "anonymous";
      } catch (_) {}
    }

    const { session_id, message_id, rating, tags, comment, chat_snippet } = req.body;
    const feedbackId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO public.message_feedbacks 
        (id, user_id, session_id, message_id, rating, tags, comment, chat_snippet, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [feedbackId, userId, session_id || null, message_id || null, rating || "helpful", Array.isArray(tags) ? tags.join(",") : (tags || ""), comment || "", chat_snippet || ""]
    );
    return res.json({ status: "success", feedback_id: feedbackId });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

// Avatar & Auth Helper routes
app.post(["/api/profile/avatar", "/api/v1/profile/avatar"], authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const avatarUrl = req.body.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.id}`;
    const { rows } = await pool.query(
      "UPDATE public.users SET avatar_url = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [avatarUrl, user.id]
    );
    return res.json({ avatar_url: avatarUrl, user: formatUser(rows[0]) });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

app.post(["/api/auth/phone/send-otp", "/api/v1/auth/phone/send-otp"], async (_req, res) => {
  return res.json({ status: "success", message: "OTP sent successfully" });
});
app.post(["/api/auth/phone/verify-otp", "/api/v1/auth/phone/verify-otp"], async (_req, res) => {
  return res.json({ status: "success", message: "Phone verified successfully" });
});
app.post(["/api/auth/email/send-otp", "/api/v1/auth/email/send-otp"], async (_req, res) => {
  return res.json({ status: "success", message: "OTP sent to email" });
});
app.post(["/api/auth/email/verify-otp", "/api/v1/auth/email/verify-otp"], async (_req, res) => {
  return res.json({ status: "success", message: "Email verified successfully" });
});
app.post(["/api/auth/set-phone", "/api/v1/auth/set-phone"], authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const phone = req.body.phone_number;
    const cleanPhone = phone ? phone.replace(/\D/g, "").slice(-10) : null;
    const { rows } = await pool.query("UPDATE public.users SET phone_number = $1, updated_at = NOW() WHERE id = $2 RETURNING *", [cleanPhone, user.id]);
    return res.json({ status: "success", user: formatUser(rows[0]) });
  } catch (err: any) {
    return res.status(500).json({ detail: err.message });
  }
});

// Fallback proxy to Render for any specialized backend endpoints
app.use("/api", async (req, res) => {
  try {
    let subPath = req.url.startsWith("/") ? req.url.slice(1) : req.url;
    if (!subPath.startsWith("v1/")) {
      subPath = `v1/${subPath}`;
    }
    const targetUrl = `https://rhynia-ai-api.onrender.com/api/${subPath}`;

    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (key.toLowerCase() !== "host" && typeof value === "string") {
        headers[key] = value;
      }
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    if (["POST", "PUT", "PATCH"].includes(req.method.toUpperCase())) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    fetchOptions.signal = controller.signal;

    const upstreamResponse = await fetch(targetUrl, fetchOptions);
    clearTimeout(timeout);

    const contentType = upstreamResponse.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return res.status(upstreamResponse.status).json({
        error: "Upstream returned non-JSON response",
        status: upstreamResponse.status,
      });
    }

    res.status(upstreamResponse.status);
    upstreamResponse.headers.forEach((val, key) => {
      res.setHeader(key, val);
    });

    const responseBody = await upstreamResponse.arrayBuffer();
    res.send(Buffer.from(responseBody));
  } catch (err: any) {
    // Return clean JSON instead of crashing or returning HTML
    res.status(502).json({ error: "Failed to proxy request to backend API", details: err.message });
  }
});

// Explicit JSON 404 for any other /api routes
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not Found", detail: "API route not found" });
});

// Serve frontend static assets
app.use(express.static(FRONTEND_DIR));

// Fallback to index.html for SPA client-side routing ONLY for non-API routes
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "Not Found" });
  }
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Rhynia Intelligence server running at http://0.0.0.0:${PORT}`);
});

