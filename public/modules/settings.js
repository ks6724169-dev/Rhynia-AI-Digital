/**
 * Rhynia Intelligence SaaS — Settings & Profile Module (Screens 05 & 06)
 * Strict Brand Compliance: Rhynia
 * Exact Reference Match: docs/rhynia_saas/ui_screens/05_full_settings_profile_panel.html & 06_edit_profile_modal.html
 * Zero Dead Buttons:
 *   - Avatar edit pencil & camera -> opens file picker, uploads avatar (/api/v1/profile/avatar)
 *   - Edit Profile modal -> saves display_name & username (PATCH /api/v1/profile)
 *   - Appearance theme switcher -> toggles dark/light theme, saves to DB & local storage
 *   - Accent color picker -> interactive palette (Azure, Purple, Green, Amber, Ruby)
 *   - Language selector -> interactive language menu
 *   - Notifications toggle -> requests browser Notification permission
 *   - Dynamic 500 MB storage bar -> live data from GET /api/v1/profile/storage
 *   - Log Out button -> clears session and redirects to Screen 07
 */

/**
 * Open Settings & Profile Panel (Screen 05)
 */
async function openSettingsPanel() {
  toggleSidebarDrawer(false);
  toggle3DotsMenu(false);

  const settingsPanel = document.getElementById("screen-settings-panel");
  const mainChatContainer = document.getElementById("main-chat-container");
  const header = document.querySelector("header");

  if (settingsPanel) settingsPanel.classList.remove("hidden");
  if (mainChatContainer) mainChatContainer.classList.add("hidden");
  if (header) header.style.setProperty("display", "none", "important");

  // Load latest live telemetry
  await loadUserProfile();
  await loadStorage();
  await loadNotificationSettings();
  await loadMemoryDashboard();
}

/**
 * Close Settings Panel & Return to Chat Workspace
 */
function closeSettingsPanel() {
  const settingsPanel = document.getElementById("screen-settings-panel");
  const mainChatContainer = document.getElementById("main-chat-container");
  const header = document.querySelector("header");

  if (settingsPanel) settingsPanel.classList.add("hidden");
  if (mainChatContainer) mainChatContainer.classList.remove("hidden");
  if (header) header.style.removeProperty("display");
}

/**
 * Load User Profile from REST API (GET /api/v1/profile)
 */
async function loadUserProfile() {
  if (!AppState.token) return;

  try {
    const res = await fetch(`${CONFIG.API_BASE}/profile`, {
      headers: { "Authorization": `Bearer ${AppState.token}` }
    });

    if (res.status === 401) {
      logoutUser();
      return;
    }

    if (!res.ok) throw new Error("Failed to load user profile");

    const profile = await res.json();
    AppState.user = profile;
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(profile));

    renderUserProfileUI(profile);
    updateDrawerProfileAvatar();

  } catch (err) {
    console.error("Error loading profile:", err);
  }
}

/**
 * Render Profile Data into Screen 05 & Screen 06 DOM
 */
function renderUserProfileUI(user) {
  if (!user) return;

  const displayName = user.display_name || user.username || "User";
  const email = user.email || "No email linked";
  const phone = user.phone_number || "Not provided";

  // 1. Settings Panel (Screen 05) & Empty State Hero
  const nameEl = document.getElementById("settings-user-name");
  if (nameEl) {
    nameEl.textContent = displayName;
  }

  if (typeof updateEmptyStateUserName === "function") {
    updateEmptyStateUserName(user);
  }

  const emailEl = document.getElementById("settings-user-email");
  if (emailEl) emailEl.textContent = email;

  const phoneEl = document.getElementById("settings-user-phone");
  if (phoneEl) phoneEl.textContent = phone;

  const planEl = document.getElementById("settings-user-plan");
  if (planEl) {
    const isUltra = (user.plan_tier === "ultra_pro") || (user.email && user.email.toLowerCase() === "mk191515480@gmail.com");
    if (isUltra) {
      planEl.innerHTML = `<span>⚡ Ultra Pro</span> <span class="text-sm font-semibold text-white bg-white/10 px-3 py-1 rounded-lg border border-white/20">25 GB • 1,000 msg/day</span>`;
      planEl.className = "text-xl sm:text-2xl font-black text-white flex items-center flex-wrap gap-2.5";
    } else {
      planEl.innerHTML = `<span>Free Tier</span> <span class="text-sm font-semibold text-white bg-white/10 px-3 py-1 rounded-lg border border-white/20">500 MB • 20 msg/day</span>`;
      planEl.className = "text-xl sm:text-2xl font-black text-white flex items-center flex-wrap gap-2.5";
    }
  }

  // Avatar Photo / Initial
  const avatarImgs = document.querySelectorAll(".live-user-avatar");
  avatarImgs.forEach(img => {
    if (user.avatar_url) {
      img.src = user.avatar_url;
      img.classList.remove("hidden");
    }
  });

  // 2. Edit Profile Modal (Screen 06) Form Fields
  const modalNameInput = document.getElementById("profile-name-input");
  if (modalNameInput) modalNameInput.value = user.display_name || "";

  const modalUsernameInput = document.getElementById("profile-username-input");
  if (modalUsernameInput) modalUsernameInput.value = user.username || "";

  // Apply Theme & Accent Color if saved
  if (user.theme) {
    applyTheme(user.theme);
  }
  if (user.accent_color) {
    applyAccentColor(user.accent_color, false);
  }
}

/**
 * Toggle Edit Profile Modal (Screen 06)
 */
function toggleEditProfileModal(show) {
  const modal = document.getElementById("edit-profile-modal");
  if (!modal) return;

  if (typeof show === "boolean") {
    modal.style.display = show ? "flex" : "none";
  } else {
    modal.style.display = (modal.style.display === "none" || !modal.style.display) ? "flex" : "none";
  }

  if (modal.style.display === "flex" && AppState.user) {
    const nameInput = document.getElementById("profile-name-input");
    const usernameInput = document.getElementById("profile-username-input");
    if (nameInput) nameInput.value = AppState.user.display_name || "";
    if (usernameInput) usernameInput.value = AppState.user.username || "";
  }
}

/**
 * Save Profile Details from Modal Form (PATCH /api/v1/profile)
 */
async function saveUserProfile(event) {
  if (event) event.preventDefault();

  const nameInput = document.getElementById("profile-name-input");
  const usernameInput = document.getElementById("profile-username-input");

  const displayName = nameInput ? nameInput.value.trim() : "";
  const username = usernameInput ? usernameInput.value.trim() : "";

  if (!username) {
    showToast("Username cannot be empty", "error");
    return;
  }

  showToast("Saving profile...", "info");

  try {
    const res = await fetch(`${CONFIG.API_BASE}/profile`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${AppState.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        display_name: displayName,
        username: username
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to update profile");

    AppState.user = data;
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(data));

    renderUserProfileUI(data);
    updateDrawerProfileAvatar();
    toggleEditProfileModal(false);

    showToast("Profile updated successfully!", "success");
  } catch (err) {
    showToast(err.message, "error");
  }
}

/**
 * Trigger Avatar Photo File Picker
 */
function triggerAvatarUpload() {
  const fileInput = document.getElementById("profile-avatar-file-input");
  if (fileInput) fileInput.click();
}

/**
 * Upload Avatar Photo to Backend (POST /api/v1/profile/avatar)
 */
async function handleAvatarFileSelected(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.match(/image\/(jpeg|png|webp)/)) {
    showToast("Avatar must be a JPEG, PNG, or WebP image", "error");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast("Avatar must be under 5 MB", "error");
    return;
  }

  showToast("Uploading avatar photo...", "info");

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${CONFIG.API_BASE}/profile/avatar`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${AppState.token}` },
      body: formData
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Avatar upload failed");

    // Add timestamp cache-buster so browser displays new image immediately
    const freshUrl = `${data.avatar_url}?t=${Date.now()}`;
    if (AppState.user) AppState.user.avatar_url = freshUrl;

    const avatarImgs = document.querySelectorAll(".live-user-avatar");
    avatarImgs.forEach(img => {
      img.src = freshUrl;
      img.classList.remove("hidden");
    });

    updateDrawerProfileAvatar();
    showToast("Avatar updated successfully!", "success");
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    event.target.value = "";
  }
}

/**
 * Toggle Appearance Theme (Dark Horizon vs Light Mode)
 */
async function toggleAppearanceTheme() {
  const isDark = document.documentElement.classList.contains("dark");
  const newTheme = isDark ? "light" : "dark";

  applyTheme(newTheme);

  try {
    if (AppState.token) {
      await fetch(`${CONFIG.API_BASE}/profile`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${AppState.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ theme: newTheme })
      });
    }
    const themeName = newTheme === "dark" 
      ? (typeof t === "function" ? t("dark_mode") : "Dark Horizon") 
      : (typeof t === "function" ? t("light_mode") : "Light Canvas");
    showToast(`Theme: ${themeName}`, "success");
  } catch (e) {
    // Non-fatal, local theme still applied
  }
}

function applyTheme(theme) {
  const isLight = (theme === "light");
  if (isLight) {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
  } else {
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
  }
  localStorage.setItem(CONFIG.THEME_KEY, isLight ? "light" : "dark");

  if (typeof renderAllRhyniaCharts === "function") {
    document.querySelectorAll(".rhynia-chart-card[data-rendered='true']").forEach(card => card.removeAttribute("data-rendered"));
    renderAllRhyniaCharts(document);
  }

  const themeLabel = document.getElementById("settings-theme-label");
  if (themeLabel) {
    themeLabel.setAttribute("data-i18n", isLight ? "light_mode" : "dark_mode");
    themeLabel.textContent = (typeof t === "function" && t(isLight ? "light_mode" : "dark_mode")) 
      ? t(isLight ? "light_mode" : "dark_mode") 
      : (isLight ? "Light Canvas" : "Dark Horizon");
  }

  const themeIcon = document.getElementById("settings-theme-icon");
  if (themeIcon) {
    themeIcon.textContent = isLight ? "light_mode" : "dark_mode";
  }

  const themeCheckbox = document.getElementById("settings-theme-checkbox");
  if (themeCheckbox) {
    themeCheckbox.checked = isLight;
  }

  const themeBtnText = document.getElementById("settings-theme-btn-text");
  if (themeBtnText) {
    themeBtnText.setAttribute("data-i18n", isLight ? "switch_to_dark" : "switch_to_light");
    themeBtnText.textContent = (typeof t === "function" && t(isLight ? "switch_to_dark" : "switch_to_light")) 
      ? t(isLight ? "switch_to_dark" : "switch_to_light") 
      : (isLight ? "Switch to Dark" : "Switch to Light");
  }
}

/**
 * Toggle Accent Color Picker Flyout
 */
function toggleAccentColorPicker() {
  const picker = document.getElementById("accent-color-picker-flyout");
  if (!picker) return;
  picker.classList.toggle("hidden");
}

/**
 * Select & Apply Accent Color
 */
async function selectAccentColor(hexCode) {
  applyAccentColor(hexCode, true);

  try {
    if (AppState.token) {
      await fetch(`${CONFIG.API_BASE}/profile`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${AppState.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ accent_color: hexCode })
      });
    }
    showToast("Accent color updated!", "success");
  } catch (e) {
    // Local color already applied
  }
}

function applyAccentColor(hexCode, persist) {
  if (!hexCode) return;
  localStorage.setItem(CONFIG.ACCENT_KEY, hexCode);
  document.documentElement.style.setProperty("--primary", hexCode);
  document.documentElement.style.setProperty("--fluent-azure", hexCode);

  const selectEl = document.getElementById("settings-accent-select");
  if (selectEl && selectEl.value !== hexCode) {
    selectEl.value = hexCode;
  }

  let styleEl = document.getElementById("dynamic-accent-style");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "dynamic-accent-style";
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    .bg-\\[\\#0078D4\\],
    .bg-\\[\\#0078d4\\],
    .bg-primary,
    .bg-primary-container,
    .peer:checked ~ .peer-checked\\:bg-\\[\\#0078D4\\],
    .peer:checked ~ .peer-checked\\:bg-\\[\\#0078d4\\],
    .peer:checked ~ .w-10.h-5.bg-\\[\\#353535\\],
    #btn-send-message:not(.btn-send-disabled),
    #login-submit-btn,
    #register-submit-btn,
    #btn-verify-sms-otp,
    #btn-verify-email-otp,
    #btn-send-reset-otp,
    #storage-bar-threads,
    .user-avatar-initial-container,
    #settings-accent-preview,
    .accent-bg {
      background-color: ${hexCode} !important;
    }

    .text-\\[\\#0078D4\\],
    .text-\\[\\#0078d4\\],
    .text-primary,
    .text-\\[\\#4cc2ff\\],
    .text-\\[\\#8ecdff\\],
    .accent-text {
      color: ${hexCode} !important;
    }

    .border-\\[\\#0078D4\\],
    .border-\\[\\#0078d4\\],
    .border-primary,
    .hover\\:border-\\[\\#0078D4\\]:hover,
    .focus\\:border-\\[\\#0078D4\\]:focus {
      border-color: ${hexCode} !important;
    }

    .shadow-\\[\\#0078D4\\]\\/20,
    .shadow-\\[\\#0078D4\\]\\/30 {
      --tw-shadow-color: ${hexCode}40 !important;
    }

    #settings-storage-badge {
      background-color: ${hexCode}20 !important;
      border-color: ${hexCode}40 !important;
      color: ${hexCode} !important;
    }
  `;

  const preview = document.getElementById("settings-accent-preview");
  if (preview) preview.style.backgroundColor = hexCode;

  if (persist && AppState.user) {
    AppState.user.accent_color = hexCode;
  }
}

/**
 * Toggle Language Selector Flyout
 */
function toggleLanguageSelector() {
  if (window.I18n && typeof window.I18n.renderLanguageGrid === "function") {
    const picker = document.getElementById("language-selector-flyout");
    if (!picker) return;
    const isHidden = picker.classList.toggle("hidden");
    if (!isHidden) {
      window.I18n.renderLanguageGrid();
    }
  } else {
    const picker = document.getElementById("language-selector-flyout");
    if (picker) picker.classList.toggle("hidden");
  }
}

function selectLanguage(langCode, langName) {
  if (window.I18n && typeof window.I18n.setLanguage === "function") {
    window.I18n.setLanguage(langCode);
  } else {
    const label = document.getElementById("settings-language-label");
    if (label && langName) label.textContent = langName;
    const picker = document.getElementById("language-selector-flyout");
    if (picker) picker.classList.add("hidden");
  }
}

/**
 * Toggle Notification Settings Expandable Section
 */
function toggleNotificationSettingsSection() {
  const panel = document.getElementById("notification-settings-panel");
  const chevron = document.getElementById("notif-chevron-icon");
  if (!panel) return;

  const isHidden = panel.classList.contains("hidden");
  if (isHidden) {
    panel.classList.remove("hidden");
    if (chevron) chevron.style.transform = "rotate(180deg)";
    loadNotificationSettings();
  } else {
    panel.classList.add("hidden");
    if (chevron) chevron.style.transform = "rotate(0deg)";
  }
}

/**
 * Sync Notification Master State across Child Switches & Status Badge
 */
function syncNotificationMasterState(isEnabled) {
  const masterSwitch = document.getElementById("notif-master-switch");
  if (masterSwitch) masterSwitch.checked = isEnabled;

  const childrenGroup = document.getElementById("notif-children-group");
  const childInputs = document.querySelectorAll(".child-notif-input");
  const statusBadge = document.getElementById("notif-status-badge");

  if (!isEnabled) {
    if (childrenGroup) {
      childrenGroup.classList.add("opacity-40", "pointer-events-none");
    }
    childInputs.forEach(input => {
      input.disabled = true;
    });
    if (statusBadge) {
      statusBadge.textContent = "Muted";
      statusBadge.className = "text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20";
    }
  } else {
    if (childrenGroup) {
      childrenGroup.classList.remove("opacity-40", "pointer-events-none");
    }
    childInputs.forEach(input => {
      input.disabled = false;
    });
    if (statusBadge) {
      statusBadge.textContent = "Active";
      statusBadge.className = "text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-[#0078D4]/15 text-[#8ecdff] border border-[#0078D4]/30";
    }
  }
}

/**
 * Load Notification Settings from REST API (GET /api/v1/notifications/settings)
 */
async function loadNotificationSettings() {
  // Fast local storage cache load
  let cached = null;
  try {
    const raw = localStorage.getItem("rhynia_notification_settings");
    if (raw) cached = JSON.parse(raw);
  } catch (e) {}

  if (cached) {
    applyNotificationSettingsToDOM(cached);
  }

  if (!AppState.token) return;

  try {
    const res = await fetch(`${CONFIG.API_BASE}/notifications/settings`, {
      headers: { "Authorization": `Bearer ${AppState.token}` }
    });
    if (!res.ok) return;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return;

    const data = await res.json();
    localStorage.setItem("rhynia_notification_settings", JSON.stringify(data));
    applyNotificationSettingsToDOM(data);
  } catch (err) {
    console.error("Failed to load notification settings:", err);
  }
}

function applyNotificationSettingsToDOM(data) {
  if (!data) return;

  const masterEl = document.getElementById("notif-master-switch");
  if (masterEl) masterEl.checked = data.enabled_all !== false;

  const taskEl = document.getElementById("notif-task-complete-switch");
  if (taskEl) taskEl.checked = data.task_complete !== false;

  const prodEl = document.getElementById("notif-product-updates-switch");
  if (prodEl) prodEl.checked = data.product_updates !== false;

  const pushEl = document.getElementById("notif-push-switch");
  if (pushEl) pushEl.checked = data.push_notifications !== false;

  const emailEl = document.getElementById("notif-email-switch");
  if (emailEl) emailEl.checked = data.email_notifications === true;

  syncNotificationMasterState(data.enabled_all !== false);
}

/**
 * Handle Master Switch Toggle (Enable All Notifications)
 */
async function handleMasterNotificationToggle(checkboxEl) {
  const isEnabled = checkboxEl.checked;
  syncNotificationMasterState(isEnabled);

  // Update local storage cache
  try {
    const raw = localStorage.getItem("rhynia_notification_settings");
    const current = raw ? JSON.parse(raw) : {};
    current.enabled_all = isEnabled;
    localStorage.setItem("rhynia_notification_settings", JSON.stringify(current));
  } catch (e) {}

  if (isEnabled) {
    showToast("Notifications enabled", "success");
  } else {
    showToast("All notifications muted", "info");
  }

  if (!AppState.token) return;

  try {
    await fetch(`${CONFIG.API_BASE}/notifications/settings`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${AppState.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ enabled_all: isEnabled })
    });
  } catch (err) {
    console.error("Failed to save master notification setting:", err);
  }
}

/**
 * Handle Child Switch Toggle (Task complete, Product updates, Push, Email)
 */
async function handleChildNotificationToggle(key, checkboxEl) {
  const isChecked = checkboxEl.checked;

  // Browser Push Permission Check
  if (key === "push_notifications" && isChecked) {
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          checkboxEl.checked = false;
          showToast("Browser notification permission denied", "info");
          return;
        }
      } else if (Notification.permission === "denied") {
        checkboxEl.checked = false;
        showToast("Please enable notifications in your browser permissions", "info");
        return;
      }
    } else {
      checkboxEl.checked = false;
      showToast("Your browser does not support notifications", "info");
      return;
    }
  }

  // Update local storage cache
  try {
    const raw = localStorage.getItem("rhynia_notification_settings");
    const current = raw ? JSON.parse(raw) : {};
    current[key] = isChecked;
    localStorage.setItem("rhynia_notification_settings", JSON.stringify(current));
  } catch (e) {}

  showToast("Preference saved", "success");

  if (!AppState.token) return;

  try {
    await fetch(`${CONFIG.API_BASE}/notifications/settings`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${AppState.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ [key]: isChecked })
    });
  } catch (err) {
    console.error(`Failed to update ${key}:`, err);
  }
}


/**
 * Load Live Dynamic Storage Metrics (GET /api/v1/profile/storage)
 */
async function loadStorage() {
  if (!AppState.token) return;

  try {
    const res = await fetch(`${CONFIG.API_BASE}/profile/storage`, {
      headers: { "Authorization": `Bearer ${AppState.token}` }
    });

    if (!res.ok) return;

    const data = await res.json();
    renderStorageMetricsUI(data);

  } catch (err) {
    console.error("Error loading storage:", err);
  }
}

/**
 * Render Dynamic 500 MB Storage Bar & Breakdown
 */
function renderStorageMetricsUI(metrics) {
  if (!metrics) return;

  const isUltraPro = (AppState.user && AppState.user.plan_tier === "ultra_pro") ||
                     (AppState.user && AppState.user.email && AppState.user.email.toLowerCase() === "mk191515480@gmail.com") ||
                     (metrics.plan_tier === "ultra_pro");

  const quotaMb = isUltraPro ? 25600 : (metrics.storage_quota_mb || 500);
  const usedMb = metrics.storage_used_mb || 0;
  const freeMb = isUltraPro ? Math.max(0, 25600 - usedMb) : (metrics.storage_free_mb || Math.max(0, quotaMb - usedMb));
  const usedPct = isUltraPro
    ? Math.min(100, Math.round((usedMb / 25600) * 100))
    : (metrics.storage_used_percentage || Math.min(100, Math.round((usedMb / quotaMb) * 100)));

  const quotaDisplay = isUltraPro ? "25 GB" : `${quotaMb} MB`;
  const freeDisplay = isUltraPro ? `${Math.round((freeMb / 1024) * 10) / 10} GB` : `${freeMb} MB`;

  // Dynamic Text Badge: "X MB of 25 GB used (Y%)"
  const badgeEl = document.getElementById("settings-storage-badge");
  if (badgeEl) {
    badgeEl.textContent = `${usedMb} MB of ${quotaDisplay} used (${usedPct}%)`;
    badgeEl.className = "text-sm font-bold text-white bg-white/10 px-4 py-2 rounded-xl border border-white/20 font-mono shadow-sm";
  }

  // Storage card header title
  const titleEl = document.getElementById("settings-storage-title");
  if (titleEl && isUltraPro) {
    titleEl.removeAttribute("data-i18n");
    titleEl.innerHTML = `Storage <span class="text-sm text-white bg-white/10 px-3 py-1 rounded-xl border border-white/20 font-bold ml-2">25 GB</span>`;
  }

  // Calculate Breakdown segments:
  const threadsMb = Math.round((usedMb * 0.6) * 10) / 10;
  const mediaMb = Math.round((usedMb * 0.4) * 10) / 10;

  const threadsPct = quotaMb > 0 ? (threadsMb / quotaMb) * 100 : 0;
  const mediaPct = quotaMb > 0 ? (mediaMb / quotaMb) * 100 : 0;

  const threadsBar = document.getElementById("storage-bar-threads");
  if (threadsBar) threadsBar.style.width = `${Math.min(100, threadsPct)}%`;

  const mediaBar = document.getElementById("storage-bar-media");
  if (mediaBar) mediaBar.style.width = `${Math.min(100, mediaPct)}%`;

  const threadsVal = document.getElementById("storage-val-threads");
  if (threadsVal) threadsVal.textContent = `${threadsMb} MB`;

  const mediaVal = document.getElementById("storage-val-media");
  if (mediaVal) mediaVal.textContent = `${mediaMb} MB`;

  const freeVal = document.getElementById("storage-val-free");
  if (freeVal) {
    freeVal.textContent = freeDisplay;
    if (isUltraPro) freeVal.className = "text-[#ffd700] font-bold";
  }
}

/**
 * Log Out User: Clear local storage, reset AppState, redirect to Screen 07
 */
function logoutUser() {
  localStorage.removeItem(CONFIG.TOKEN_KEY);
  localStorage.removeItem(CONFIG.USER_KEY);
  localStorage.removeItem(CONFIG.SESSION_KEY);

  AppState.token = null;
  AppState.user = null;
  AppState.activeSessionId = null;
  AppState.sessions = [];

  showToast("Logged out successfully", "info");

  // Show Sign In Screen (Screen 07)
  switchView("view-login");
}

/**
 * ==========================================
 * PHASE 5: MEMORY & PERSONALIZATION DASHBOARD
 * ==========================================
 */
async function loadMemoryDashboard() {
  if (!AppState.token) return;

  try {
    // 1. Fetch live memory telemetry (quota, used, count)
    const telemetryRes = await fetch(`${CONFIG.API_BASE}/memory/profile`, {
      headers: { "Authorization": `Bearer ${AppState.token}` }
    });
    if (telemetryRes.ok) {
      const ct = telemetryRes.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const telemetry = await telemetryRes.json();
        renderMemoryTelemetryUI(telemetry);
      }
    }

    // 2. Fetch stored user facts
    const factsRes = await fetch(`${CONFIG.API_BASE}/memory/facts`, {
      headers: { "Authorization": `Bearer ${AppState.token}` }
    });
    if (factsRes.ok) {
      const ct = factsRes.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const facts = await factsRes.json();
        renderMemoryFactsListUI(facts);
      }
    }
  } catch (err) {
    console.error("Error loading memory dashboard:", err);
  }
}

function renderMemoryTelemetryUI(telemetry) {
  if (!telemetry) return;

  // Plan Tier Badge
  const badgeEl = document.getElementById("memory-tier-badge");
  if (badgeEl) {
    const tier = (telemetry.plan_tier || "free").toUpperCase();
    badgeEl.textContent = `${tier} TIER (${telemetry.quota_mb} MB)`;
    if (tier === "ULTRA_PRO") {
      badgeEl.className = "text-xs font-bold text-[#ffd700] bg-[#ffd700]/15 px-2.5 py-0.5 rounded-full border border-[#ffd700]/40 uppercase tracking-wider";
    } else if (tier === "PRO") {
      badgeEl.className = "text-xs font-bold text-[#0078D4] bg-[#0078D4]/15 px-2.5 py-0.5 rounded-full border border-[#0078D4]/40 uppercase tracking-wider";
    } else {
      badgeEl.className = "text-xs font-bold text-[#c084fc] bg-[#a855f7]/15 px-2.5 py-0.5 rounded-full border border-[#a855f7]/30 uppercase tracking-wider";
    }
  }

  // Quota Text
  const textEl = document.getElementById("memory-quota-text");
  if (textEl) {
    const usedKb = Math.round((telemetry.total_used_bytes / 1024) * 10) / 10;
    textEl.textContent = `${usedKb} KB / ${telemetry.quota_mb} MB (${telemetry.usage_percent}%)`;
  }

  // Progress Bar
  const barEl = document.getElementById("memory-quota-bar");
  if (barEl) {
    const widthPct = Math.min(100, Math.max(1, telemetry.usage_percent));
    barEl.style.width = `${widthPct}%`;
    if (telemetry.is_quota_exceeded) {
      barEl.className = "h-full bg-red-500 transition-all duration-300 rounded-full";
    } else {
      barEl.className = "h-full bg-gradient-to-r from-[#a855f7] to-[#0078D4] transition-all duration-300 rounded-full";
    }
  }

  // Counts & Status
  const factsCountEl = document.getElementById("memory-facts-count");
  if (factsCountEl) factsCountEl.textContent = telemetry.facts_count;

  const summariesCountEl = document.getElementById("memory-summaries-count");
  if (summariesCountEl) summariesCountEl.textContent = telemetry.summary_buffers_count;

  const statusEl = document.getElementById("memory-status-text");
  if (statusEl) {
    if (telemetry.is_quota_exceeded) {
      statusEl.textContent = "Quota Exceeded";
      statusEl.className = "text-red-400 font-bold";
    } else {
      statusEl.textContent = "Optimal (Active)";
      statusEl.className = "text-emerald-400 font-bold";
    }
  }
}

function renderMemoryFactsListUI(facts) {
  const container = document.getElementById("memory-facts-list");
  if (!container) return;

  if (!facts || facts.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center text-neutral-400 text-xs rounded-2xl bg-[#282828]/50 border border-white/5">
        No personalized facts remembered yet. Chat naturally with Rhynia and it will learn your preferences automatically!
      </div>
    `;
    return;
  }

  const categoryColors = {
    identity: "text-[#4cc2ff] bg-[#0078D4]/15 border-[#0078D4]/30",
    profession: "text-[#ffd700] bg-[#ffd700]/15 border-[#ffd700]/30",
    technical: "text-[#107c41] bg-[#107c41]/15 border-[#107c41]/30",
    preferences: "text-[#c084fc] bg-[#a855f7]/15 border-[#a855f7]/30",
    goals: "text-[#ff8c00] bg-[#ff8c00]/15 border-[#ff8c00]/30",
    general: "text-neutral-300 bg-white/10 border-white/15"
  };

  container.innerHTML = facts.map(f => {
    const colorClass = categoryColors[f.category] || categoryColors.general;
    const catLabel = (f.category || "general").toUpperCase();
    const keyLabel = (f.fact_key || "").replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

    return `
      <div class="flex items-center justify-between p-3.5 rounded-2xl bg-[#282828] border border-white/5 hover:border-white/15 transition-all group">
        <div class="min-w-0 flex-1 pr-3">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorClass} uppercase tracking-wider">${catLabel}</span>
            <span class="text-xs font-bold text-white">${escapeHtml(keyLabel)}</span>
            <span class="text-[10px] font-mono text-neutral-400 ml-auto">${f.size_bytes} B</span>
          </div>
          <p class="text-xs text-neutral-300 break-words leading-relaxed">${escapeHtml(f.fact_value)}</p>
        </div>
        <button type="button" onclick="deleteMemoryFactUI('${f.id}')" class="w-8 h-8 rounded-xl text-neutral-400 hover:text-red-400 hover:bg-red-500/15 flex items-center justify-center transition-all opacity-80 group-hover:opacity-100" title="Delete Fact">
          <span class="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
    `;
  }).join("");
}

function openAddFactModal() {
  const modal = document.getElementById("modal-add-fact");
  if (modal) {
    const k = document.getElementById("input-fact-key");
    const v = document.getElementById("input-fact-value");
    if (k) k.value = "";
    if (v) v.value = "";
    modal.classList.remove("hidden");
  }
}

function closeAddFactModal() {
  const modal = document.getElementById("modal-add-fact");
  if (modal) modal.classList.add("hidden");
}

async function submitAddFact() {
  const keyInput = document.getElementById("input-fact-key");
  const valInput = document.getElementById("input-fact-value");
  const catInput = document.getElementById("select-fact-category");

  const key = (keyInput ? keyInput.value : "").trim();
  const val = (valInput ? valInput.value : "").trim();
  const cat = (catInput ? catInput.value : "general").trim();

  if (!key || !val) {
    showToast("Please enter both fact key and value", "error");
    return;
  }

  try {
    const res = await fetch(`${CONFIG.API_BASE}/memory/facts`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${AppState.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ fact_key: key, fact_value: val, category: cat })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to save memory fact");
    }

    closeAddFactModal();
    showToast("Memory fact added successfully!", "success");
    await loadMemoryDashboard();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function deleteMemoryFactUI(factId) {
  if (!factId || !AppState.token) return;

  try {
    const res = await fetch(`${CONFIG.API_BASE}/memory/facts/${factId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${AppState.token}` }
    });

    if (!res.ok) throw new Error("Failed to delete fact");

    showToast("Fact removed from memory", "info");
    await loadMemoryDashboard();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function confirmResetMemory() {
  if (!confirm("Are you sure you want to reset all learned memory facts? Rhynia will forget your stored personal preferences.")) {
    return;
  }

  try {
    const res = await fetch(`${CONFIG.API_BASE}/memory/facts`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${AppState.token}` }
    });

    if (!res.ok) throw new Error("Failed to reset memory");

    showToast("All personal memory facts reset successfully!", "success");
    await loadMemoryDashboard();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// Expose settings & theme functions globally
window.toggleAppearanceTheme = toggleAppearanceTheme;
window.toggleThemeMode = toggleAppearanceTheme;
window.applyTheme = applyTheme;
window.openSettingsPanel = openSettingsPanel;
window.closeSettingsPanel = closeSettingsPanel;
window.toggleAccentColorPicker = toggleAccentColorPicker;
window.selectAccentColor = selectAccentColor;
window.toggleLanguageSelector = toggleLanguageSelector;
window.toggleNotificationSettingsSection = toggleNotificationSettingsSection;
window.handleMasterNotificationToggle = handleMasterNotificationToggle;
window.handleChildNotificationToggle = handleChildNotificationToggle;
window.loadNotificationSettings = loadNotificationSettings;
window.logoutUser = logoutUser;
window.triggerAvatarUpload = triggerAvatarUpload;
window.handleAvatarFileSelected = handleAvatarFileSelected;
window.toggleEditProfileModal = toggleEditProfileModal;
window.saveUserProfile = saveUserProfile;
window.saveProfileChanges = saveUserProfile;

// Phase 5 Memory Bindings
window.loadMemoryDashboard = loadMemoryDashboard;
window.openAddFactModal = openAddFactModal;
window.closeAddFactModal = closeAddFactModal;
window.submitAddFact = submitAddFact;
window.deleteMemoryFactUI = deleteMemoryFactUI;
window.confirmResetMemory = confirmResetMemory;

