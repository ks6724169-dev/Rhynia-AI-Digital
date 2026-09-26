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

  if (settingsPanel) settingsPanel.classList.remove("hidden");
  if (mainChatContainer) mainChatContainer.classList.add("hidden");

  // Load latest live telemetry
  await loadUserProfile();
  await loadStorage();
  await loadNotificationSettings();
}

/**
 * Close Settings Panel & Return to Chat Workspace
 */
function closeSettingsPanel() {
  const settingsPanel = document.getElementById("screen-settings-panel");
  const mainChatContainer = document.getElementById("main-chat-container");

  if (settingsPanel) settingsPanel.classList.add("hidden");
  if (mainChatContainer) mainChatContainer.classList.remove("hidden");
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
  if (nameEl) nameEl.textContent = displayName;

  if (typeof updateEmptyStateUserName === "function") {
    updateEmptyStateUserName(user);
  }

  const emailEl = document.getElementById("settings-user-email");
  if (emailEl) emailEl.textContent = email;

  const phoneEl = document.getElementById("settings-user-phone");
  if (phoneEl) phoneEl.textContent = phone;

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
  toggleAccentColorPicker();

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

  const usedMb = metrics.storage_used_mb || 0;
  const quotaMb = metrics.storage_quota_mb || 500;
  const freeMb = metrics.storage_free_mb || Math.max(0, quotaMb - usedMb);
  const usedPct = metrics.storage_used_percentage || Math.min(100, Math.round((usedMb / quotaMb) * 100));

  // Dynamic Text Badge: "X MB of 500 MB used (Y%)"
  const badgeEl = document.getElementById("settings-storage-badge");
  if (badgeEl) {
    badgeEl.textContent = `${usedMb} MB of ${quotaMb} MB used (${usedPct}%)`;
  }

  // Calculate Breakdown segments:
  // Split used into Threads (60%) and Media (40%) or proportional
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
  if (freeVal) freeVal.textContent = `${freeMb} MB`;
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
window.saveProfileChanges = saveProfileChanges;

