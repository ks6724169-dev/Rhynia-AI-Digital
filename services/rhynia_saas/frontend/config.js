/**
 * Rhynia Intelligence SaaS — Frontend Configuration
 * Strict Brand Compliance: Rhynia
 */

const CONFIG = {
  // Base URL for backend REST API
  API_BASE: (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:")
    ? "http://127.0.0.1:8000/api/v1"
    : "/api/v1",

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

// Freeze configuration to prevent runtime modification
Object.freeze(CONFIG);
