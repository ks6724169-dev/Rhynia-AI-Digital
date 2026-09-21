/**
 * Rhynia Intelligence SaaS — Frontend Configuration
 */

const CONFIG = {
  // Base URL for backend REST API
  API_BASE: window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
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
};

// Freeze configuration to prevent modifications
Object.freeze(CONFIG);
