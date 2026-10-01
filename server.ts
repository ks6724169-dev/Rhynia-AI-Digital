import express from "express";
import cors from "cors";
import path from "path";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";
import pg from "pg";

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const FRONTEND_DIR = path.join(__dirname, "services", "rhynia_saas", "frontend");
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
      "SELECT id, title, created_at, updated_at FROM public.chat_sessions WHERE user_id = $1 ORDER BY updated_at DESC",
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
    let { session_id, message, stream } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ detail: "Message is required" });
    }

    // Ensure session exists
    if (!session_id) {
      const newSession = await pool.query(
        "INSERT INTO public.chat_sessions (id, user_id, title, is_pinned, created_at, updated_at) VALUES ($1, $2, $3, false, NOW(), NOW()) RETURNING id",
        [crypto.randomUUID(), user.id, message.slice(0, 30)]
      );
      session_id = newSession.rows[0].id;
    }

    // Store user message in Supabase
    const userMsgId = crypto.randomUUID();
    await pool.query(
      "INSERT INTO public.chat_messages (id, session_id, user_id, role, content, model_used, token_count, created_at) VALUES ($1, $2, $3, 'user', $4, 'user-input', 0, NOW())",
      [userMsgId, session_id, user.id, message.trim()]
    );

    // Call Gemini API if available, or generate response
    let aiReply = "Namaste! Main Rhynia AI hoon. Aapka Supabase database ab successfully connect ho chuka hai, aur aapka data hamesha ke liye safe hai!";
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: message }] }],
            systemInstruction: { parts: [{ text: "You are Rhynia AI, an intelligent, helpful multilingual assistant." }] }
          })
        });
        if (geminiRes.ok) {
          const gData = await geminiRes.json();
          const candidateText = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) aiReply = candidateText;
        }
      } catch (gErr) {
        console.warn("Gemini call fallback:", gErr);
      }
    }

    // Store assistant message in Supabase
    const aiMsgId = crypto.randomUUID();
    await pool.query(
      "INSERT INTO public.chat_messages (id, session_id, user_id, role, content, model_used, token_count, created_at) VALUES ($1, $2, $3, 'assistant', $4, 'rhynia-intelligence', 0, NOW())",
      [aiMsgId, session_id, user.id, aiReply]
    );

    // Update session timestamp
    await pool.query("UPDATE public.chat_sessions SET updated_at = NOW() WHERE id = $1", [session_id]);

    return res.json({
      session_id,
      reply: aiReply,
      message_id: aiMsgId,
    });
  } catch (err: any) {
    console.error("Chat error:", err.message);
    return res.status(500).json({ detail: err.message });
  }
});

// Fallback proxy to Render for any specialized backend endpoints
app.use("/api", async (req, res) => {
  try {
    const subPath = req.url.startsWith("/") ? req.url.slice(1) : req.url;
    const targetUrl = `${BACKEND_API_BASE}/${subPath}`;

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

    const upstreamResponse = await fetch(targetUrl, fetchOptions);
    res.status(upstreamResponse.status);

    upstreamResponse.headers.forEach((val, key) => {
      res.setHeader(key, val);
    });

    const responseBody = await upstreamResponse.arrayBuffer();
    res.send(Buffer.from(responseBody));
  } catch (err: any) {
    console.error("API proxy error:", err.message);
    res.status(502).json({ error: "Failed to proxy request to backend API", details: err.message });
  }
});

// Serve frontend static assets
app.use(express.static(FRONTEND_DIR));

// Fallback to index.html for SPA client-side routing
app.use((_req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Rhynia Intelligence server running at http://0.0.0.0:${PORT}`);
});

