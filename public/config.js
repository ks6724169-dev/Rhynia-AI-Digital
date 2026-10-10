/**
 * Rhynia Intelligence SaaS — Frontend Configuration
 * Strict Brand Compliance: Rhynia
 */

const RhyniaNetwork = {
  // Ordered dual-cloud candidate endpoints: Local relative endpoint FIRST for 100% High Availability & zero latency
  hosts: [
    "/api/v1",
    "https://rhynia-ai-api.onrender.com/api/v1"
  ],
  activeHostIndex: 0,
  failureCount: 0,

  getActiveBase() {
    return this.hosts[this.activeHostIndex] || "/api/v1";
  },

  /**
   * Resilient fetch with automatic multi-cloud failover (Phase 2)
   * If primary host returns 5xx or fails at network level, immediately dispatches to secondary cloud.
   */
  async fetchWithFailover(endpointPath, options = {}) {
    const cleanPath = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;
    const startIdx = this.activeHostIndex;
    const totalHosts = this.hosts.length;
    let lastError = null;
    let lastResponse = null;

    for (let i = 0; i < totalHosts; i++) {
      const hostIdx = (startIdx + i) % totalHosts;
      const host = this.hosts[hostIdx];
      const targetUrl = `${host}${cleanPath}`;

      try {
        const response = await fetch(targetUrl, options);
        // If HTTP status is success or client-side error (4xx like 401, 400, 422), the server is healthy
        if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
          this.activeHostIndex = hostIdx;
          this.failureCount = 0;
          return response;
        }

        // 5xx Server Error or 429 Rate Limit from this host -> trigger failover to next cloud host
        lastResponse = response;
        console.warn(`[RhyniaNetwork] Host "${host}" responded with ${response.status}. Attempting edge failover...`);
      } catch (networkErr) {
        if (networkErr.name === "AbortError") {
          throw networkErr;
        }
        lastError = networkErr;
        console.warn(`[RhyniaNetwork] Host "${host}" network connection error: ${networkErr.message}. Failing over...`);
      }

      this.failureCount++;
    }

    if (lastResponse) {
      return lastResponse;
    }
    throw lastError || new Error("Rhynia Multi-Cloud connection unavailable. Please check your network.");
  }
};

window.RhyniaNetwork = RhyniaNetwork;
window.fetchWithFailover = (path, opts) => RhyniaNetwork.fetchWithFailover(path, opts);

const CONFIG = {
  get API_BASE() {
    return RhyniaNetwork.getActiveBase();
  },
  RENDER_BACKEND: "https://rhynia-ai-api.onrender.com/api/v1",

  // Google OAuth 2.0 Web Client ID
  GOOGLE_CLIENT_ID: "1001346913265-qbdhpbb69gen2mvcjtu56jepn1sld8os.apps.googleusercontent.com",

  // App Identity
  APP_NAME: "Rhynia",
  VERSION: "1.0.0",

  // Storage Keys
  TOKEN_KEY: "rhynia_token",
  USER_KEY: "rhynia_user",
  THEME_KEY: "rhynia_theme",
  SESSION_KEY: "rhynia_active_session",

  // Quotas & Plan Definitions
  PLANS: {
    free: { name: "Free Tier", max_msg_day: 20, max_storage_mb: 500 },
    pro: { name: "Pro Tier", max_msg_day: 300, max_storage_mb: 5120 },
    ultra_pro: { name: "Ultra Pro", max_msg_day: 1000, max_storage_mb: 25600 },
  }
};

window.CONFIG = CONFIG;

/**
 * Universal IndexedDB Storage for Profile Photos & Heavy Binary Assets
 * Prevents localStorage QuotaExceededError while guaranteeing permanent persistence across refreshes
 */
const AvatarDB = {
  dbName: "rhynia_storage",
  storeName: "avatars",
  async getDB() {
    return new Promise((resolve) => {
      try {
        if (typeof window === "undefined" || !window.indexedDB) return resolve(null);
        const req = indexedDB.open(AvatarDB.dbName, 1);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(AvatarDB.storeName)) {
            db.createObjectStore(AvatarDB.storeName);
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch (_) {
        resolve(null);
      }
    });
  },
  async set(key, val) {
    try {
      const db = await AvatarDB.getDB();
      if (!db) return false;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(AvatarDB.storeName, "readwrite");
          tx.objectStore(AvatarDB.storeName).put(val, key);
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => resolve(false);
        } catch (_) {
          resolve(false);
        }
      });
    } catch (_) {
      return false;
    }
  },
  async get(key) {
    try {
      const db = await AvatarDB.getDB();
      if (!db) return null;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(AvatarDB.storeName, "readonly");
          const req = tx.objectStore(AvatarDB.storeName).get(key);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        } catch (_) {
          resolve(null);
        }
      });
    } catch (_) {
      return null;
    }
  }
};

window.AvatarDB = AvatarDB;
