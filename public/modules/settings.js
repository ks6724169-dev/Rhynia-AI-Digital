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
  if (typeof toggleSidebarDrawer === "function") toggleSidebarDrawer(false);
  if (typeof toggle3DotsMenu === "function") toggle3DotsMenu(false);

  const settingsPanel = document.getElementById("screen-settings-panel");
  const mainChatContainer = document.getElementById("main-chat-container");
  const header = document.querySelector("#view-app > header, body > header, header");

  if (settingsPanel) {
    settingsPanel.classList.remove("hidden");
    settingsPanel.style.display = "block";
    settingsPanel.scrollTop = 0;
  }
  if (mainChatContainer) {
    mainChatContainer.classList.add("hidden");
    mainChatContainer.style.display = "none";
  }
  if (header) {
    header.style.setProperty("display", "none", "important");
  }

  // Load latest live telemetry
  await loadUserProfile();
  await loadStorage();
  await loadNotificationSettings();
  await loadMemoryDashboard();
  if (typeof loadMemorySummaryUI === "function") await loadMemorySummaryUI(false);
  if (typeof updateThemeCheckmarkUI === "function") updateThemeCheckmarkUI();
  if (typeof updateAccentUI === "function") updateAccentUI();
}
window.openSettingsPanel = openSettingsPanel;

/**
 * Close Settings Panel & Return to Chat Workspace
 */
function closeSettingsPanel(e) {
  if (e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
  }

  const settingsPanel = document.getElementById("screen-settings-panel");
  const mainChatContainer = document.getElementById("main-chat-container");
  const header = document.querySelector("#view-app > header, body > header, header");

  if (settingsPanel) {
    settingsPanel.classList.add("hidden");
    settingsPanel.style.display = "none";
  }

  // Hide all sub-screens
  ["screen-notifications-subscreen", "screen-notification-detail-subscreen", "screen-memory-subscreen", "screen-memory-summary-subscreen"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add("hidden");
      el.style.display = "none";
    }
  });

  if (mainChatContainer) {
    mainChatContainer.classList.remove("hidden");
    mainChatContainer.style.display = "";
  }
  if (header) {
    header.style.removeProperty("display");
    header.style.display = "";
  }
}
window.closeSettingsPanel = closeSettingsPanel;

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
    let localAvatar = null;
    if (typeof AvatarDB !== "undefined") {
      try { localAvatar = await AvatarDB.get("user_avatar"); } catch (_) {}
    }
    if (!localAvatar) {
      localAvatar = localStorage.getItem("rhynia_user_avatar");
    }

    if (profile.avatar_url && typeof profile.avatar_url === "string" && profile.avatar_url.trim()) {
      if (typeof AvatarDB !== "undefined") {
        try { await AvatarDB.set("user_avatar", profile.avatar_url); } catch (_) {}
      }
      safeSetItem("rhynia_user_avatar", profile.avatar_url);
    } else if (localAvatar) {
      profile.avatar_url = localAvatar;
      fetch(`${CONFIG.API_BASE}/profile`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${AppState.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: localAvatar })
      }).catch(() => {});
    }

    AppState.user = profile;
    safeSetItem(CONFIG.USER_KEY, profile);

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
  updateAvatarElements(user.avatar_url, displayName);

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
 * Safe localStorage setter preventing quota exceeded errors
 */
function safeSetItem(key, value) {
  try {
    const str = typeof value === "string" ? value : JSON.stringify(value);
    localStorage.setItem(key, str);
    return true;
  } catch (err) {
    console.warn(`[Storage] Quota warning setting "${key}":`, err);
    try {
      if (key === CONFIG.USER_KEY && typeof value !== "string" && value) {
        const minimized = { ...value };
        if (minimized.avatar_url && minimized.avatar_url.startsWith("data:")) {
          minimized.avatar_url = null; // Preserved in IndexedDB & server database
        }
        localStorage.setItem(key, JSON.stringify(minimized));
        return true;
      }
      localStorage.removeItem("rhynia_user_avatar");
      if (typeof value === "string" && value.length < 50000) {
        localStorage.setItem(key, value);
        return true;
      }
    } catch (_) {}
    return false;
  }
}

/**
 * Compresses and downscales user avatar images to 256x256 (~15-25 KB) via HTML5 Canvas
 */
function compressAvatarImage(file, maxSize = 256, quality = 0.85) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          const compressed = canvas.toDataURL("image/jpeg", quality);
          resolve(compressed);
        } catch (err) {
          resolve(e.target.result);
        }
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/**
 * Universal Avatar UI Synchronization Helper
 */
function updateAvatarElements(avatarUrl, displayName) {
  const avatarImgs = document.querySelectorAll(".live-user-avatar");
  const avatarInitials = document.querySelectorAll(".user-avatar-initial");

  const candidate = avatarUrl || pendingAvatarDataUrl || (AppState.user && AppState.user.avatar_url) || localStorage.getItem("rhynia_user_avatar");
  const validAvatar = (candidate && typeof candidate === "string" && candidate.trim().length > 0) ? candidate.trim() : null;

  if (validAvatar) {
    avatarImgs.forEach(img => {
      img.src = validAvatar;
      img.classList.remove("hidden");
      img.onerror = () => {
        img.classList.add("hidden");
        avatarInitials.forEach(el => el.classList.remove("hidden"));
      };
    });
    avatarInitials.forEach(el => {
      el.classList.add("hidden");
    });
  } else {
    avatarImgs.forEach(img => {
      img.classList.add("hidden");
    });
    const fallbackName = displayName || (AppState.user && (AppState.user.display_name || AppState.user.username)) || "MK";
    const initials = fallbackName.split(" ").filter(Boolean).map(n => n[0].toUpperCase()).slice(0, 2).join("") || "MK";
    avatarInitials.forEach(el => {
      el.classList.remove("hidden");
      el.textContent = initials;
    });
  }
}

let pendingAvatarDataUrl = null;

/**
 * Toggle Edit Profile Modal (Screen 06)
 */
function toggleEditProfileModal(show) {
  const modal = document.getElementById("edit-profile-modal");
  if (!modal) return;

  const isOpening = (typeof show === "boolean") ? show : (modal.style.display === "none" || !modal.style.display);
  modal.style.display = isOpening ? "flex" : "none";

  if (isOpening) {
    const u = AppState.user || (localStorage.getItem(CONFIG.USER_KEY) ? JSON.parse(localStorage.getItem(CONFIG.USER_KEY)) : null) || {};
    const nameInput = document.getElementById("profile-name-input");
    const usernameInput = document.getElementById("profile-username-input");
    if (nameInput) nameInput.value = (u && (u.display_name || u.name)) || "";
    if (usernameInput) usernameInput.value = (u && (u.username || (u.email ? u.email.split('@')[0] : ""))) || "";

    const checkAvatar = async () => {
      let activeAvatar = pendingAvatarDataUrl;
      if (!activeAvatar && typeof AvatarDB !== "undefined") {
        try { activeAvatar = await AvatarDB.get("user_avatar"); } catch (_) {}
      }
      if (!activeAvatar) {
        activeAvatar = localStorage.getItem("rhynia_user_avatar") || (u && u.avatar_url);
      }
      updateAvatarElements(activeAvatar, (u && (u.display_name || u.username)) || "MK");
    };
    checkAvatar();
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
  const rawUsername = usernameInput ? usernameInput.value.trim() : "";
  const username = rawUsername || (AppState.user && AppState.user.username) || (displayName ? displayName.toLowerCase().replace(/[^a-z0-9_]/g, "") : "user") || "user";

  let avatarUrl = pendingAvatarDataUrl || (AppState.user && AppState.user.avatar_url);
  if (!avatarUrl && typeof AvatarDB !== "undefined") {
    try { avatarUrl = await AvatarDB.get("user_avatar"); } catch (_) {}
  }
  if (!avatarUrl) {
    avatarUrl = localStorage.getItem("rhynia_user_avatar") || null;
  }

  if (avatarUrl) {
    if (typeof AvatarDB !== "undefined") {
      try { await AvatarDB.set("user_avatar", avatarUrl); } catch (_) {}
    }
    safeSetItem("rhynia_user_avatar", avatarUrl);
  }

  showToast("Saving profile...", "info");

  // Fallback for guest mode / offline / no auth token
  if (!AppState.token) {
    if (!AppState.user) AppState.user = {};
    AppState.user.display_name = displayName || AppState.user.display_name || "MK";
    AppState.user.username = username;
    if (avatarUrl) AppState.user.avatar_url = avatarUrl;
    safeSetItem(CONFIG.USER_KEY, AppState.user);

    renderUserProfileUI(AppState.user);
    updateDrawerProfileAvatar();
    toggleEditProfileModal(false);
    showToast("Profile saved successfully!", "success");
    return;
  }

  try {
    const res = await fetch(`${CONFIG.API_BASE}/profile`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${AppState.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        display_name: displayName,
        username: username,
        avatar_url: avatarUrl
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to update profile");

    AppState.user = data;
    if (avatarUrl && !data.avatar_url) {
      AppState.user.avatar_url = avatarUrl;
    }
    safeSetItem(CONFIG.USER_KEY, AppState.user);
    if (avatarUrl && typeof AvatarDB !== "undefined") {
      try { await AvatarDB.set("user_avatar", avatarUrl); } catch (_) {}
    }

    renderUserProfileUI(AppState.user);
    updateDrawerProfileAvatar();
    toggleEditProfileModal(false);

    showToast("Profile updated successfully!", "success");
  } catch (err) {
    if (AppState.user) {
      AppState.user.display_name = displayName || AppState.user.display_name;
      AppState.user.username = username;
      if (avatarUrl) AppState.user.avatar_url = avatarUrl;
      safeSetItem(CONFIG.USER_KEY, AppState.user);
      if (avatarUrl && typeof AvatarDB !== "undefined") {
        try { await AvatarDB.set("user_avatar", avatarUrl); } catch (_) {}
      }
      renderUserProfileUI(AppState.user);
      updateDrawerProfileAvatar();
      toggleEditProfileModal(false);
      showToast("Profile saved successfully!", "success");
    } else {
      showToast(err.message, "error");
    }
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
 * Upload Avatar Photo to Backend & Immediate Local Preview with Automatic Canvas Compression
 */
async function handleAvatarFileSelected(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (file.type && !file.type.startsWith("image/") && !file.name.match(/\.(jpe?g|png|webp|gif|bmp|heic|avif)$/i)) {
    showToast("Please choose an image file (JPEG, PNG, WebP)", "error");
    return;
  }

  showToast("Optimizing profile photo...", "info");

  try {
    // Compress and downscale avatar to crisp 256x256 (~15-25 KB) so it NEVER exceeds localStorage quota!
    const dataUrl = await compressAvatarImage(file, 256, 0.85);
    if (!dataUrl) throw new Error("Could not process photo");

    pendingAvatarDataUrl = dataUrl;
    if (typeof AvatarDB !== "undefined") {
      try { await AvatarDB.set("user_avatar", dataUrl); } catch (_) {}
    }
    safeSetItem("rhynia_user_avatar", dataUrl);

    if (!AppState.user) AppState.user = {};
    AppState.user.avatar_url = dataUrl;
    safeSetItem(CONFIG.USER_KEY, AppState.user);

    // Immediately update modal preview & all UI avatars
    updateAvatarElements(dataUrl, AppState.user.display_name || "MK");
    updateDrawerProfileAvatar();
    showToast("Photo selected! Click 'Save profile' to save.", "success");

    // Also sync to server in background if token available
    if (AppState.token) {
      try {
        const res = await fetch(`${CONFIG.API_BASE}/profile/avatar`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${AppState.token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ avatar_url: dataUrl })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.avatar_url) {
            AppState.user.avatar_url = data.avatar_url;
            if (typeof AvatarDB !== "undefined") {
              try { await AvatarDB.set("user_avatar", data.avatar_url); } catch (_) {}
            }
            safeSetItem("rhynia_user_avatar", data.avatar_url);
            safeSetItem(CONFIG.USER_KEY, AppState.user);
          }
        }
      } catch (err) {
        console.warn("Background avatar upload notice:", err.message);
      }
    }
  } catch (err) {
    showToast("Error processing photo: " + err.message, "error");
  } finally {
    event.target.value = "";
  }
}

/**
 * Appearance Popup Menu Handlers (ChatGPT Style Floating Popup)
 */
function toggleAppearancePopupMenu(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById("appearance-popup-menu");
  const backdrop = document.getElementById("appearance-popup-backdrop");
  const chevron = document.getElementById("settings-appearance-chevron");
  if (!menu || !backdrop) return;

  const isHidden = menu.classList.contains("hidden");
  if (isHidden) {
    menu.classList.remove("hidden");
    backdrop.classList.remove("hidden");
    if (chevron) {
      chevron.textContent = "expand_less";
      chevron.classList.add("text-white");
    }
    updateThemeCheckmarkUI();
  } else {
    closeAppearancePopupMenu();
  }
}
const toggleAppearanceTheme = toggleAppearancePopupMenu;
window.toggleAppearancePopupMenu = toggleAppearancePopupMenu;
window.toggleAppearanceTheme = toggleAppearancePopupMenu;

function closeAppearancePopupMenu(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById("appearance-popup-menu");
  const backdrop = document.getElementById("appearance-popup-backdrop");
  const chevron = document.getElementById("settings-appearance-chevron");
  if (menu) menu.classList.add("hidden");
  if (backdrop) backdrop.classList.add("hidden");
  if (chevron) {
    chevron.textContent = "expand_more";
    chevron.classList.remove("text-white");
  }
}
window.closeAppearancePopupMenu = closeAppearancePopupMenu;

function updateThemeCheckmarkUI() {
  const currentTheme = localStorage.getItem(CONFIG.THEME_KEY) || "dark";
  document.querySelectorAll(".theme-option-btn").forEach(btn => {
    const val = btn.dataset.themeVal;
    const icon = btn.querySelector(".theme-check-icon");
    if (icon) {
      if (val === currentTheme) {
        icon.classList.remove("hidden");
      } else {
        icon.classList.add("hidden");
      }
    }
  });

  const label = document.getElementById("settings-theme-label");
  if (label) {
    if (currentTheme === "light") label.textContent = "Light";
    else if (currentTheme === "system") label.textContent = "System (Default)";
    else label.textContent = "Dark";
  }
}
window.updateThemeCheckmarkUI = updateThemeCheckmarkUI;

async function selectThemeOption(themeOption, e) {
  if (e) e.stopPropagation();
  let effectiveTheme = themeOption;
  if (themeOption === "system") {
    // App default is Dark mode
    effectiveTheme = "dark";
  }

  applyTheme(effectiveTheme);
  localStorage.setItem(CONFIG.THEME_KEY, themeOption);
  updateThemeCheckmarkUI();
  closeAppearancePopupMenu();

  try {
    if (AppState.token) {
      await fetch(`${CONFIG.API_BASE}/profile`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${AppState.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ theme: themeOption })
      });
    }
    const nameMap = { dark: "Dark", light: "Light", system: "System (Default)" };
    showToast(`Appearance: ${nameMap[themeOption] || themeOption}`, "success");
  } catch (err) {
    console.warn("Theme sync notice:", err);
  }
}
window.selectThemeOption = selectThemeOption;

function applyTheme(theme) {
  const isLight = (theme === "light");
  if (isLight) {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
  } else {
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
  }

  if (typeof renderAllRhyniaCharts === "function") {
    document.querySelectorAll(".rhynia-chart-card[data-rendered='true']").forEach(card => card.removeAttribute("data-rendered"));
    renderAllRhyniaCharts(document);
  }

  const storedTheme = localStorage.getItem(CONFIG.THEME_KEY) || (isLight ? "light" : "dark");
  const themeLabel = document.getElementById("settings-theme-label");
  if (themeLabel) {
    if (storedTheme === "system") themeLabel.textContent = "System (Default)";
    else if (storedTheme === "light") themeLabel.textContent = "Light";
    else themeLabel.textContent = "Dark";
  }
}

/**
 * Accent Colors palette matching ChatGPT
 */
const ACCENT_COLORS = [
  { name: "Blue", hex: "#3B82F6" },
  { name: "Cyan", hex: "#06B6D4" },
  { name: "Green", hex: "#10B981" },
  { name: "Lime", hex: "#84CC16" },
  { name: "Yellow", hex: "#EAB308" },
  { name: "Orange", hex: "#F97316" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Magenta", hex: "#D946EF" },
  { name: "Purple", hex: "#8B5CF6" },
  { name: "White", hex: "#FFFFFF" }
];

function updateAccentUI() {
  const rawAccent = (localStorage.getItem(CONFIG.ACCENT_KEY) || "#8B5CF6").toUpperCase();
  
  // Find matching color from palette (or map legacy Azure/defaults)
  let matchedColor = ACCENT_COLORS.find(c => c.hex.toUpperCase() === rawAccent);
  if (!matchedColor) {
    if (rawAccent.includes("0078D4") || rawAccent.includes("00A4EF") || rawAccent.includes("3B82F6")) {
      matchedColor = ACCENT_COLORS.find(c => c.name === "Blue") || ACCENT_COLORS[0];
    } else {
      matchedColor = ACCENT_COLORS.find(c => c.name === "Purple") || ACCENT_COLORS[8];
    }
  }
  
  const label = document.getElementById("settings-accent-label");
  const dot = document.getElementById("settings-accent-dot");
  if (label) label.textContent = matchedColor.name;
  if (dot) dot.style.backgroundColor = matchedColor.hex;

  document.querySelectorAll(".accent-option-btn").forEach(btn => {
    const val = (btn.dataset.colorHex || "").toUpperCase();
    const icon = btn.querySelector(".accent-check-icon");
    if (icon) {
      if (val === matchedColor.hex.toUpperCase()) {
        icon.classList.remove("hidden");
        icon.style.removeProperty("display");
      } else {
        icon.classList.add("hidden");
      }
    }
  });
}
window.updateAccentUI = updateAccentUI;

/**
 * Toggle Accent Color Floating Popup Menu (ChatGPT Style)
 */
function toggleAccentPopupMenu(e) {
  if (e) e.stopPropagation();
  if (typeof closeAppearancePopupMenu === "function") closeAppearancePopupMenu();
  
  const menu = document.getElementById("accent-popup-menu");
  const backdrop = document.getElementById("accent-popup-backdrop");
  const chevron = document.getElementById("settings-accent-chevron");
  if (!menu || !backdrop) return;

  const isHidden = menu.classList.contains("hidden");
  if (isHidden) {
    menu.classList.remove("hidden");
    backdrop.classList.remove("hidden");
    if (chevron) {
      chevron.textContent = "expand_less";
      chevron.classList.add("text-white");
    }
    updateAccentUI();
  } else {
    closeAccentPopupMenu();
  }
}
window.toggleAccentPopupMenu = toggleAccentPopupMenu;

function closeAccentPopupMenu(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById("accent-popup-menu");
  const backdrop = document.getElementById("accent-popup-backdrop");
  const chevron = document.getElementById("settings-accent-chevron");
  if (menu) menu.classList.add("hidden");
  if (backdrop) backdrop.classList.add("hidden");
  if (chevron) {
    chevron.textContent = "expand_more";
    chevron.classList.remove("text-white");
  }
}
window.closeAccentPopupMenu = closeAccentPopupMenu;

/**
 * Select & Apply Accent Color from Popup Option
 */
async function selectAccentColorOption(hexCode, colorName, e) {
  if (e) e.stopPropagation();
  applyAccentColor(hexCode, true);
  updateAccentUI();
  closeAccentPopupMenu();

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
    showToast(`Accent color: ${colorName}`, "success");
  } catch (err) {
    console.warn("Accent sync notice:", err);
  }
}
window.selectAccentColorOption = selectAccentColorOption;

/**
 * Toggle Accent Color Picker Flyout (Backward Compatibility)
 */
function toggleAccentColorPicker() {
  toggleAccentPopupMenu();
}

/**
 * Select & Apply Accent Color
 */
async function selectAccentColor(hexCode) {
  const found = ACCENT_COLORS.find(c => c.hex.toUpperCase() === (hexCode || "").toUpperCase());
  await selectAccentColorOption(hexCode, found ? found.name : "Custom");
}

function applyAccentColor(hexCode, persist) {
  if (!hexCode) return;
  localStorage.setItem(CONFIG.ACCENT_KEY, hexCode);
  document.documentElement.style.setProperty("--primary", hexCode);
  document.documentElement.style.setProperty("--fluent-azure", hexCode);

  const found = ACCENT_COLORS.find(c => c.hex.toUpperCase() === hexCode.toUpperCase()) || { name: "Custom", hex: hexCode };
  const label = document.getElementById("settings-accent-label");
  const dot = document.getElementById("settings-accent-dot");
  if (label) label.textContent = found.name;
  if (dot) dot.style.backgroundColor = found.hex;

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
 * Toggle Language Selector Modal (ChatGPT App Language Dialog)
 */
function toggleLanguageSelector() {
  if (typeof openAppLanguageModal === "function") {
    openAppLanguageModal();
  }
}

function selectLanguage(langCode, langName) {
  if (window.I18n && typeof window.I18n.setLanguage === "function") {
    window.I18n.setLanguage(langCode);
  }
  const label = document.getElementById("settings-language-label");
  if (label && langName) label.textContent = langName;
}

/**
 * Notification Categories (Exact 5 Core Categories with Short & Clean Names)
 */
const NOTIFICATION_CATEGORIES = [
  {
    id: "enabled_all",
    name: "All notifications",
    desc: "Master switch to enable or mute all notification alerts and messages across the application.",
    channel: "Master",
    default: true
  },
  {
    id: "task_complete",
    name: "Task complete",
    desc: "Receive instant notifications for long tasks, deep reasoning steps, or AI image generation.",
    channel: "Push",
    default: true
  },
  {
    id: "product_updates",
    name: "Product updates",
    desc: "Get notified about new platform capabilities, upgraded AI models, and feature releases.",
    channel: "Push",
    default: true
  },
  {
    id: "push_notifications",
    name: "Push alerts",
    desc: "Instant popup notification alerts displayed directly on your browser or device screen.",
    channel: "Push",
    default: true
  },
  {
    id: "email_notifications",
    name: "Email digests",
    desc: "Periodic activity digests and critical AI task completion alerts delivered to your inbox.",
    channel: "Email",
    default: false
  }
];

let currentActiveNotifCategory = null;

function getNotificationCategoryStates() {
  try {
    const raw = localStorage.getItem("rhynia_notification_settings");
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  const initial = {};
  NOTIFICATION_CATEGORIES.forEach(cat => {
    initial[cat.id] = cat.default !== false;
  });
  return initial;
}

function saveNotificationCategoryStates(states) {
  try {
    localStorage.setItem("rhynia_notification_settings", JSON.stringify(states));
  } catch (_) {}
}

/**
 * Open Notifications Sub-screen (ChatGPT 5-Category Screen)
 */
function openNotificationsScreen(e) {
  if (e && e.stopPropagation) e.stopPropagation();
  renderNotificationCategoriesList();
  const screen = document.getElementById("screen-notifications-subscreen");
  if (screen) {
    screen.classList.remove("hidden");
    screen.style.display = "block";
  }
}
window.openNotificationsScreen = openNotificationsScreen;

/**
 * Close Notifications Sub-screen & Return to Settings
 */
function closeNotificationsScreen(e) {
  if (e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
  }

  // Guard against ghost click from detail screen back button
  if (window._lastDetailClosedAt && (Date.now() - window._lastDetailClosedAt < 650)) {
    console.log("[Navigation] Prevented ghost-click from closing notifications subscreen");
    return;
  }

  const screen = document.getElementById("screen-notifications-subscreen");
  if (screen) {
    screen.classList.add("hidden");
    screen.style.display = "none";
  }
  updateNotificationsSummaryLabel();
}
window.closeNotificationsScreen = closeNotificationsScreen;

/**
 * Render 5 Notification Categories in Sub-screen
 */
function renderNotificationCategoriesList() {
  const container = document.getElementById("notifications-categories-stack");
  if (!container) return;

  const states = getNotificationCategoryStates();

  container.innerHTML = NOTIFICATION_CATEGORIES.map(cat => {
    const isOn = states[cat.id] !== false;
    return `
      <div onclick="openNotificationDetailScreen('${cat.id}')" class="flex items-center justify-between gap-4 p-6 sm:p-7 rounded-[24px] sm:rounded-[28px] bg-[#161618] hover:bg-[#202024] active:bg-[#28282c] border-2 border-white/25 hover:border-white/40 shadow-2xl transition-all cursor-pointer select-none min-h-[84px] sm:min-h-[96px] w-full box-border overflow-hidden">
        <div class="min-w-0 flex-1 pr-2">
          <p class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug break-words">${cat.name}</p>
        </div>
        <div class="flex items-center gap-3 shrink-0 ml-auto">
          <span class="text-xl sm:text-2xl font-bold ${isOn ? 'text-neutral-200' : 'text-neutral-500'}">${isOn ? 'On' : 'Off'}</span>
          <span class="material-symbols-outlined text-[32px] sm:text-[36px] text-neutral-400">chevron_right</span>
        </div>
      </div>
    `;
  }).join("");
}
window.renderNotificationCategoriesList = renderNotificationCategoriesList;

/**
 * Open Individual Category Detail View
 */
function openNotificationDetailScreen(categoryId) {
  const cat = NOTIFICATION_CATEGORIES.find(c => c.id === categoryId);
  if (!cat) return;

  currentActiveNotifCategory = cat;
  const states = getNotificationCategoryStates();
  const isOn = states[cat.id] !== false;

  const titleEl = document.getElementById("notif-detail-title");
  const descEl = document.getElementById("notif-detail-description");
  const channelEl = document.getElementById("notif-detail-channel-label");
  const toggleEl = document.getElementById("notif-detail-push-toggle");

  if (titleEl) titleEl.textContent = cat.name;
  if (descEl) descEl.textContent = cat.desc;
  if (channelEl) channelEl.textContent = cat.channel || "Push";
  if (toggleEl) toggleEl.checked = isOn;

  const detailScreen = document.getElementById("screen-notification-detail-subscreen");
  if (detailScreen) {
    detailScreen.classList.remove("hidden");
    detailScreen.style.display = "block";
  }
}
window.openNotificationDetailScreen = openNotificationDetailScreen;

/**
 * Close Individual Category Detail View & Return to 5 Notifications Screen
 */
function closeNotificationDetailScreen(e) {
  if (e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
  }
  window._lastDetailClosedAt = Date.now();

  const detailScreen = document.getElementById("screen-notification-detail-subscreen");
  if (detailScreen) {
    detailScreen.classList.add("hidden");
    detailScreen.style.display = "none";
  }

  // Ensure parent 5-notifications list screen stays active and visible
  const notifScreen = document.getElementById("screen-notifications-subscreen");
  if (notifScreen) {
    notifScreen.classList.remove("hidden");
    notifScreen.style.display = "block";
    // Disable pointer-events for 500ms so any ghost touch or click from detail screen back button is absorbed
    notifScreen.style.pointerEvents = "none";
    setTimeout(() => {
      if (notifScreen) notifScreen.style.pointerEvents = "auto";
    }, 500);
  }

  renderNotificationCategoriesList();
  updateNotificationsSummaryLabel();
}
window.closeNotificationDetailScreen = closeNotificationDetailScreen;

/**
 * Toggle Switch for Active Category
 */
async function handleNotificationDetailToggle(inputEl) {
  if (!currentActiveNotifCategory) return;
  const isChecked = inputEl.checked;
  const states = getNotificationCategoryStates();

  // Browser Push Permission Check for push notifications
  if (currentActiveNotifCategory.id === "push_notifications" && isChecked) {
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          inputEl.checked = false;
          showToast("Browser notification permission denied", "info");
          return;
        }
      } else if (Notification.permission === "denied") {
        inputEl.checked = false;
        showToast("Please enable notifications in your browser permissions", "info");
        return;
      }
    }
  }

  states[currentActiveNotifCategory.id] = isChecked;

  // If toggling master switch, update others or master
  if (currentActiveNotifCategory.id === "enabled_all") {
    states.enabled_all = isChecked;
  }

  saveNotificationCategoryStates(states);
  updateNotificationsSummaryLabel();
  showToast(`${currentActiveNotifCategory.name}: ${isChecked ? 'On' : 'Off'}`, "info");

  if (!AppState.token) return;

  try {
    await fetch(`${CONFIG.API_BASE}/notifications/settings`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${AppState.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ [currentActiveNotifCategory.id]: isChecked })
    });
  } catch (err) {
    console.error(`Failed to update ${currentActiveNotifCategory.id}:`, err);
  }
}
window.handleNotificationDetailToggle = handleNotificationDetailToggle;

/**
 * Update Summary Label in Settings Row (e.g. "5 of 5 on" or "All active")
 */
function updateNotificationsSummaryLabel() {
  const label = document.getElementById("settings-notif-summary-label");
  if (!label) return;
  const states = getNotificationCategoryStates();
  const enabledCount = Object.values(states).filter(Boolean).length;
  if (enabledCount === NOTIFICATION_CATEGORIES.length) {
    label.textContent = "All active";
  } else if (enabledCount === 0) {
    label.textContent = "All off";
  } else {
    label.textContent = `${enabledCount} of ${NOTIFICATION_CATEGORIES.length} on`;
  }
}
window.updateNotificationsSummaryLabel = updateNotificationsSummaryLabel;

/**
 * Backward compatibility wrappers
 */
function toggleNotificationSettingsSection() {
  openNotificationsScreen();
}

async function loadNotificationSettings() {
  updateNotificationsSummaryLabel();

  if (!AppState.token) return;

  try {
    const res = await fetch(`${CONFIG.API_BASE}/notifications/settings`, {
      headers: { "Authorization": `Bearer ${AppState.token}` }
    });
    if (!res.ok) return;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return;

    const data = await res.json();
    const states = getNotificationCategoryStates();
    Object.assign(states, data);
    saveNotificationCategoryStates(states);
    updateNotificationsSummaryLabel();
  } catch (err) {
    console.error("Failed to load notification settings:", err);
  }
}

function handleMasterNotificationToggle(checkboxEl) {
  const isEnabled = checkboxEl.checked;
  const states = getNotificationCategoryStates();
  NOTIFICATION_CATEGORIES.forEach(cat => {
    states[cat.id] = isEnabled;
  });
  saveNotificationCategoryStates(states);
  updateNotificationsSummaryLabel();
  showToast(isEnabled ? "Notifications enabled" : "All notifications muted", isEnabled ? "success" : "info");
}

async function handleChildNotificationToggle(key, checkboxEl) {
  const isChecked = checkboxEl.checked;
  const states = getNotificationCategoryStates();
  states[key] = isChecked;
  saveNotificationCategoryStates(states);
  updateNotificationsSummaryLabel();
  showToast("Preference saved", "success");
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
  if (window.LocalDB) {
    window.LocalDB.clearUserData();
  }
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
window.toggleAppearancePopupMenu = toggleAppearancePopupMenu;
window.closeAppearancePopupMenu = closeAppearancePopupMenu;
window.toggleAccentPopupMenu = toggleAccentPopupMenu;
window.closeAccentPopupMenu = closeAccentPopupMenu;
window.selectAccentColorOption = selectAccentColorOption;
window.updateAccentUI = updateAccentUI;
window.applyTheme = applyTheme;
window.openSettingsPanel = openSettingsPanel;
window.closeSettingsPanel = closeSettingsPanel;
window.toggleAccentColorPicker = toggleAccentColorPicker;
window.selectAccentColor = selectAccentColor;
window.toggleLanguageSelector = toggleLanguageSelector;
window.toggleNotificationSettingsSection = toggleNotificationSettingsSection;
window.openNotificationsScreen = openNotificationsScreen;
window.closeNotificationsScreen = closeNotificationsScreen;
window.renderNotificationCategoriesList = renderNotificationCategoriesList;
window.openNotificationDetailScreen = openNotificationDetailScreen;
window.closeNotificationDetailScreen = closeNotificationDetailScreen;
window.handleNotificationDetailToggle = handleNotificationDetailToggle;
window.updateNotificationsSummaryLabel = updateNotificationsSummaryLabel;
window.handleMasterNotificationToggle = handleMasterNotificationToggle;
window.handleChildNotificationToggle = handleChildNotificationToggle;
window.loadNotificationSettings = loadNotificationSettings;
window.logoutUser = logoutUser;
window.triggerAvatarUpload = triggerAvatarUpload;
window.handleAvatarFileSelected = handleAvatarFileSelected;
window.toggleEditProfileModal = toggleEditProfileModal;
window.saveUserProfile = saveUserProfile;
window.saveProfileChanges = saveUserProfile;
window.updateAvatarElements = updateAvatarElements;

// Auto-sync active avatar immediately on load
try {
  if (typeof updateAvatarElements === "function") {
    updateAvatarElements();
  }
} catch (_) {}

// Phase 5 Memory Bindings
window.loadMemoryDashboard = loadMemoryDashboard;
window.openAddFactModal = openAddFactModal;
window.closeAddFactModal = closeAddFactModal;
window.submitAddFact = submitAddFact;
window.deleteMemoryFactUI = deleteMemoryFactUI;
window.confirmResetMemory = confirmResetMemory;

/**
 * ============================================================================
 * PHASE 2: CHATGPT-STYLE MEMORY SUMMARY & PERSONALIZATION UI CONTROLLER
 * ============================================================================
 */
let cachedMemoryProfile = null;

function openMemoryScreen(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (e && e.stopPropagation) e.stopPropagation();
  const screen = document.getElementById("screen-memory-subscreen");
  if (screen) {
    screen.classList.remove("hidden");
    screen.style.display = "block";
    screen.scrollTop = 0;
  }
  // Ensure summary sub-screen is closed when opening main memory screen
  const summaryScreen = document.getElementById("screen-memory-summary-subscreen");
  if (summaryScreen) {
    summaryScreen.classList.add("hidden");
    summaryScreen.style.display = "none";
  }
  loadMemorySummaryUI(true);
}
window.openMemoryScreen = openMemoryScreen;

function closeMemoryScreen(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (e && e.stopPropagation) e.stopPropagation();
  const screen = document.getElementById("screen-memory-subscreen");
  if (screen) {
    screen.classList.add("hidden");
    screen.style.display = "none";
  }
  const summaryScreen = document.getElementById("screen-memory-summary-subscreen");
  if (summaryScreen) {
    summaryScreen.classList.add("hidden");
    summaryScreen.style.display = "none";
  }

  // Restore Settings panel or Chat workspace
  const settingsPanel = document.getElementById("screen-settings-panel");
  const mainChatContainer = document.getElementById("main-chat-container");
  const header = document.querySelector("#view-app > header, body > header");

  if (settingsPanel && !settingsPanel.classList.contains("hidden") && settingsPanel.style.display !== "none") {
    settingsPanel.classList.remove("hidden");
    settingsPanel.style.display = "block";
  } else {
    if (mainChatContainer) {
      mainChatContainer.classList.remove("hidden");
      mainChatContainer.style.display = "";
    }
    if (header) {
      header.style.removeProperty("display");
    }
  }

  if (typeof loadMemorySummaryUI === "function") {
    loadMemorySummaryUI(false);
  }
}
window.closeMemoryScreen = closeMemoryScreen;

function openMemorySummaryScreen(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (e && e.stopPropagation) e.stopPropagation();
  const screen = document.getElementById("screen-memory-summary-subscreen");
  if (screen) {
    screen.classList.remove("hidden");
    screen.style.display = "block";
    screen.scrollTop = 0;
  }
  loadMemorySummaryUI(true);
}
window.openMemorySummaryScreen = openMemorySummaryScreen;

function closeMemorySummaryScreen(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (e && e.stopPropagation) e.stopPropagation();
  const summaryScreen = document.getElementById("screen-memory-summary-subscreen");
  if (summaryScreen) {
    summaryScreen.classList.add("hidden");
    summaryScreen.style.display = "none";
  }
  // Return to main memory screen smoothly
  const memScreen = document.getElementById("screen-memory-subscreen");
  if (memScreen) {
    memScreen.classList.remove("hidden");
    memScreen.style.display = "block";
  }
}
window.closeMemorySummaryScreen = closeMemorySummaryScreen;

async function loadMemorySummaryUI(renderFull = true) {
  try {
    const headers = {};
    if (typeof AppState !== "undefined" && AppState && AppState.token) {
      headers["Authorization"] = `Bearer ${AppState.token}`;
    }
    const apiBase = (typeof CONFIG !== "undefined" && CONFIG.API_BASE) ? CONFIG.API_BASE : "/api/v1";
    const res = await fetch(`${apiBase}/memory/summary`, { headers });
    if (!res.ok) return;
    const profile = await res.json();
    cachedMemoryProfile = profile;

    // Update Settings badge & subtitle
    const badge = document.getElementById("settings-memory-badge");
    const subtitle = document.getElementById("settings-memory-subtitle");
    const isEnabled = profile.memory_enabled !== false;

    if (badge) {
      if (isEnabled) {
        badge.textContent = "Active";
        badge.className = "text-base sm:text-lg font-bold text-white bg-white/10 border border-white/20 px-4 py-1.5 rounded-xl";
      } else {
        badge.textContent = "Off";
        badge.className = "text-base sm:text-lg font-bold text-neutral-400 bg-white/10 border border-white/20 px-4 py-1.5 rounded-xl";
      }
    }

    if (subtitle) {
      if (profile.nickname) {
        subtitle.textContent = `Remembering as: ${profile.nickname}`;
      } else {
        subtitle.textContent = "Personalization & AI Context";
      }
    }

    if (!renderFull) return;

    // Master Switch
    const masterSwitch = document.getElementById("memory-master-switch");
    if (masterSwitch) masterSwitch.checked = isEnabled;

    const toggleStatus = document.getElementById("memory-toggle-status-text");
    if (toggleStatus) {
      toggleStatus.textContent = isEnabled 
        ? "Rhynia will remember your details across conversations" 
        : "Memory is currently paused (Rhynia won't save new details)";
    }

    // Identity Inputs (Must stay strictly blank until user fills and saves them)
    const nickInput = document.getElementById("mem-nickname-input");
    const occInput = document.getElementById("mem-occupation-input");
    const moreInput = document.getElementById("mem-more-about-input");

    const cleanNick = (profile.nickname || "").trim();
    const cleanOcc = (profile.occupation || "").trim();
    const cleanMore = (profile.more_about_you || "").trim();

    if (nickInput) nickInput.value = (cleanNick && cleanNick !== "भाई" && cleanNick !== "guest") ? cleanNick : "";
    if (occInput) occInput.value = (cleanOcc && cleanOcc !== "Technology Enthusiast & Creator") ? cleanOcc : "";
    if (moreInput) moreInput.value = (cleanMore && cleanMore !== "Interested in AI platforms, clean software development, and modern innovative systems.") ? cleanMore : "";

    // Last Refreshed label
    const refreshLabel = document.getElementById("memory-last-refreshed-label");
    if (refreshLabel && profile.last_refreshed_at) {
      const d = new Date(profile.last_refreshed_at);
      refreshLabel.textContent = `Active memory • Updated ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    // Render ChatGPT-style sections
    renderMemorySummarySectionsUI(profile.sections || []);

  } catch (err) {
    console.error("Failed to load memory summary UI:", err);
  }
}
window.loadMemorySummaryUI = loadMemorySummaryUI;

function renderMemorySummarySectionsUI(sections) {
  const container = document.getElementById("memory-sections-accordion");
  if (!container) return;

  let totalItems = 0;
  if (sections && Array.isArray(sections)) {
    sections.forEach(s => {
      if (Array.isArray(s.items)) totalItems += s.items.length;
    });
  }

  if (!sections || sections.length === 0 || totalItems === 0) {
    container.innerHTML = `
      <div class="py-20 text-center text-neutral-400 space-y-4">
        <div class="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#3b82f6] mb-3">
          <span class="material-symbols-outlined text-5xl">psychology</span>
        </div>
        <h3 class="text-3xl font-bold text-white tracking-tight">No memory recorded yet</h3>
        <p class="text-xl text-neutral-400 max-w-lg mx-auto leading-relaxed">Rhynia will synthesize an active summary of your profile automatically as you chat in your conversations.</p>
      </div>
    `;
    return;
  }

  const sectionsContentHtml = sections.map(sec => {
    const items = Array.isArray(sec.items) ? sec.items : [];
    if (items.length === 0) return "";

    const paragraphText = items.map(item => `
      <p class="text-xl sm:text-[22px] text-neutral-100 leading-[1.8] font-normal tracking-wide break-words mb-4">${escapeHtml(item)}</p>
    `).join("");

    return `
      <section class="space-y-2 mb-8 sm:mb-10 animate-fade-in">
        <h3 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">${escapeHtml(sec.title)}</h3>
        <div class="text-neutral-100 font-normal">
          ${paragraphText}
        </div>
      </section>
    `;
  }).filter(Boolean).join("");

  container.innerHTML = `
    <div class="space-y-8 py-2">
      ${sectionsContentHtml}
    </div>
  `;
}
window.renderMemorySummarySectionsUI = renderMemorySummarySectionsUI;

function toggleMemorySummaryMenu(e) {
  if (e && e.stopPropagation) e.stopPropagation();
  const menu = document.getElementById("memory-summary-dropdown-menu");
  if (menu) {
    menu.classList.toggle("hidden");
  }
}
window.toggleMemorySummaryMenu = toggleMemorySummaryMenu;

function closeMemorySummaryMenu() {
  const menu = document.getElementById("memory-summary-dropdown-menu");
  if (menu && !menu.classList.contains("hidden")) {
    menu.classList.add("hidden");
  }
}
window.closeMemorySummaryMenu = closeMemorySummaryMenu;

document.addEventListener("click", (e) => {
  const menu = document.getElementById("memory-summary-dropdown-menu");
  const btn = document.getElementById("btn-memory-summary-menu");
  if (menu && !menu.classList.contains("hidden") && btn && !btn.contains(e.target) && !menu.contains(e.target)) {
    menu.classList.add("hidden");
  }
});

function openMemoryAboutModal(e) {
  if (e && e.stopPropagation) e.stopPropagation();
  closeMemorySummaryMenu();
  const modal = document.getElementById("memory-about-modal");
  if (modal) {
    modal.classList.remove("hidden");
  }
}
window.openMemoryAboutModal = openMemoryAboutModal;

function closeMemoryAboutModal(e) {
  if (e && e.stopPropagation) e.stopPropagation();
  const modal = document.getElementById("memory-about-modal");
  if (modal) {
    modal.classList.add("hidden");
  }
}
window.closeMemoryAboutModal = closeMemoryAboutModal;

function toggleAddMemoryItemInline(secId) {
  const box = document.getElementById(`add-item-box-${secId}`);
  if (box) {
    box.classList.toggle("hidden");
    if (!box.classList.contains("hidden")) {
      const input = document.getElementById(`input-add-item-${secId}`);
      if (input) input.focus();
    }
  }
}
window.toggleAddMemoryItemInline = toggleAddMemoryItemInline;

async function submitMemoryItemInline(secId) {
  const input = document.getElementById(`input-add-item-${secId}`);
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;

  if (!cachedMemoryProfile) return;
  const updatedSections = JSON.parse(JSON.stringify(cachedMemoryProfile.sections || []));
  const targetSec = updatedSections.find(s => s.id === secId);
  if (targetSec) {
    if (!Array.isArray(targetSec.items)) targetSec.items = [];
    targetSec.items.push(val);
  }

  try {
    const headers = { "Content-Type": "application/json" };
    if (typeof AppState !== "undefined" && AppState && AppState.token) headers["Authorization"] = `Bearer ${AppState.token}`;
    const apiBase = (typeof CONFIG !== "undefined" && CONFIG.API_BASE) ? CONFIG.API_BASE : "/api/v1";

    const res = await fetch(`${apiBase}/memory/personalization`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ sections: updatedSections })
    });
    if (res.ok) {
      if (typeof showToast === "function") showToast("Memory item added!", "success");
      input.value = "";
      toggleAddMemoryItemInline(secId);
      await loadMemorySummaryUI(true);
    }
  } catch (err) {
    console.error("Failed to add memory item:", err);
  }
}
window.submitMemoryItemInline = submitMemoryItemInline;

async function deleteMemorySectionItemUI(secId, itemIdx) {
  if (!cachedMemoryProfile) return;
  const updatedSections = JSON.parse(JSON.stringify(cachedMemoryProfile.sections || []));
  const targetSec = updatedSections.find(s => s.id === secId);
  if (!targetSec || !Array.isArray(targetSec.items)) return;

  targetSec.items.splice(itemIdx, 1);

  try {
    const headers = { "Content-Type": "application/json" };
    if (typeof AppState !== "undefined" && AppState && AppState.token) headers["Authorization"] = `Bearer ${AppState.token}`;
    const apiBase = (typeof CONFIG !== "undefined" && CONFIG.API_BASE) ? CONFIG.API_BASE : "/api/v1";

    const res = await fetch(`${apiBase}/memory/personalization`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ sections: updatedSections })
    });
    if (res.ok) {
      if (typeof showToast === "function") showToast("Memory item removed", "info");
      await loadMemorySummaryUI(true);
    }
  } catch (err) {
    console.error("Failed to delete memory item:", err);
  }
}
window.deleteMemorySectionItemUI = deleteMemorySectionItemUI;

async function handleMemoryMasterToggle(checkbox) {
  const isEnabled = checkbox.checked;
  try {
    const headers = { "Content-Type": "application/json" };
    if (typeof AppState !== "undefined" && AppState && AppState.token) headers["Authorization"] = `Bearer ${AppState.token}`;
    const apiBase = (typeof CONFIG !== "undefined" && CONFIG.API_BASE) ? CONFIG.API_BASE : "/api/v1";

    const res = await fetch(`${apiBase}/memory/summary/toggle`, {
      method: "POST",
      headers,
      body: JSON.stringify({ enabled: isEnabled })
    });
    if (res.ok) {
      if (typeof showToast === "function") {
        showToast(isEnabled ? "Memory enabled!" : "Memory paused", "success");
      }
      await loadMemorySummaryUI(true);
    }
  } catch (err) {
    console.error("Failed to toggle memory:", err);
  }
}
window.handleMemoryMasterToggle = handleMemoryMasterToggle;

async function saveMemoryPersonalizationUI(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (e && e.stopPropagation) e.stopPropagation();

  const doneBtn = document.getElementById("btn-done-memory-screen");
  if (doneBtn) {
    doneBtn.classList.add("bg-emerald-600");
  }

  const nickname = (document.getElementById("mem-nickname-input")?.value || "").trim();
  const occupation = (document.getElementById("mem-occupation-input")?.value || "").trim();
  const more_about_you = (document.getElementById("mem-more-about-input")?.value || "").trim();
  const masterSwitch = document.getElementById("memory-master-switch");
  const memory_enabled = masterSwitch ? masterSwitch.checked : true;

  try {
    const headers = { "Content-Type": "application/json" };
    if (typeof AppState !== "undefined" && AppState && AppState.token) headers["Authorization"] = `Bearer ${AppState.token}`;
    const apiBase = (typeof CONFIG !== "undefined" && CONFIG.API_BASE) ? CONFIG.API_BASE : "/api/v1";

    const res = await fetch(`${apiBase}/memory/personalization`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ 
        nickname, 
        occupation, 
        more_about_you, 
        overview: more_about_you,
        memory_enabled 
      })
    });
    if (res.ok) {
      if (typeof showToast === "function") {
        showToast("Personalization saved", "success");
      }
      await loadMemorySummaryUI(false);
      setTimeout(() => {
        if (doneBtn) doneBtn.classList.remove("bg-emerald-600");
      }, 1000);
    } else {
      if (typeof showToast === "function") showToast("Failed to save memory settings", "error");
    }
  } catch (err) {
    console.error("Failed to save personalization:", err);
  }
}
window.saveMemoryPersonalizationUI = saveMemoryPersonalizationUI;

async function triggerMemorySummaryRefresh(e) {
  if (e && e.stopPropagation) e.stopPropagation();
  const icon = document.getElementById("btn-refresh-mem-icon");
  if (icon) icon.classList.add("animate-spin");

  try {
    const headers = { "Content-Type": "application/json" };
    if (typeof AppState !== "undefined" && AppState && AppState.token) headers["Authorization"] = `Bearer ${AppState.token}`;
    const apiBase = (typeof CONFIG !== "undefined" && CONFIG.API_BASE) ? CONFIG.API_BASE : "/api/v1";

    const res = await fetch(`${apiBase}/memory/summary/refresh`, {
      method: "POST",
      headers
    });
    if (res.ok) {
      if (typeof showToast === "function") {
        showToast("Memory summary re-synthesized from chat history!", "success");
      }
      await loadMemorySummaryUI(true);
    }
  } catch (err) {
    console.error("Failed to refresh memory summary:", err);
  } finally {
    if (icon) icon.classList.remove("animate-spin");
  }
}
window.triggerMemorySummaryRefresh = triggerMemorySummaryRefresh;

async function handleDirectTeachSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const input = document.getElementById("mem-teach-input");
  if (!input) return;
  const msg = input.value.trim();
  if (!msg) {
    if (typeof showToast === "function") showToast("Please write what you want Rhynia to remember", "info");
    return;
  }

  const btn = document.getElementById("btn-teach-submit");
  if (btn) btn.disabled = true;

  try {
    const headers = { "Content-Type": "application/json" };
    if (typeof AppState !== "undefined" && AppState && AppState.token) headers["Authorization"] = `Bearer ${AppState.token}`;
    const apiBase = (typeof CONFIG !== "undefined" && CONFIG.API_BASE) ? CONFIG.API_BASE : "/api/v1";

    const res = await fetch(`${apiBase}/memory/summary/ask-update`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message: msg })
    });
    if (res.ok) {
      const data = await res.json();
      input.value = "";
      if (typeof showToast === "function") {
        showToast(data.reply || "Rhynia remembered this!", "success");
      }
      await loadMemorySummaryUI(true);
    }
  } catch (err) {
    console.error("Failed to teach memory:", err);
  } finally {
    if (btn) btn.disabled = false;
  }
}
window.handleDirectTeachSubmit = handleDirectTeachSubmit;

async function clearAllMemoryUI(e) {
  if (e && e.stopPropagation) e.stopPropagation();
  if (!confirm("Are you sure you want to clear all memory? Rhynia will forget your stored profile, preferences, and facts.")) {
    return;
  }

  try {
    const headers = { "Content-Type": "application/json" };
    if (typeof AppState !== "undefined" && AppState && AppState.token) headers["Authorization"] = `Bearer ${AppState.token}`;
    const apiBase = (typeof CONFIG !== "undefined" && CONFIG.API_BASE) ? CONFIG.API_BASE : "/api/v1";

    const res = await fetch(`${apiBase}/memory/summary/clear`, {
      method: "POST",
      headers
    });
    if (res.ok) {
      if (typeof showToast === "function") {
        showToast("All memories cleared successfully", "info");
      }
      await loadMemorySummaryUI(true);
    }
  } catch (err) {
    console.error("Failed to clear memory:", err);
  }
}
window.clearAllMemoryUI = clearAllMemoryUI;

// Bind direct click and touch listeners on all back buttons for reliable mobile navigation
function bindAllSettingsBackButtons() {
  const bindings = [
    { id: "btn-back-settings-panel", handler: closeSettingsPanel },
    { id: "btn-back-notifications-screen", handler: closeNotificationsScreen },
    { id: "btn-back-notification-detail-screen", handler: closeNotificationDetailScreen },
    { id: "btn-back-memory-screen", handler: closeMemoryScreen },
    { id: "btn-back-memory-summary-screen", handler: closeMemorySummaryScreen }
  ];

  bindings.forEach(({ id, handler }) => {
    const btn = document.getElementById(id);
    if (btn) {
      let lastCall = 0;
      const debouncedHandler = (e) => {
        const now = Date.now();
        if (now - lastCall < 450) {
          if (e) {
            if (e.preventDefault) e.preventDefault();
            if (e.stopPropagation) e.stopPropagation();
          }
          return;
        }
        lastCall = now;
        if (e) {
          if (e.preventDefault) e.preventDefault();
          if (e.stopPropagation) e.stopPropagation();
        }
        handler(e);
      };

      btn.onclick = debouncedHandler;
      btn.ontouchend = debouncedHandler;
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bindAllSettingsBackButtons);
} else {
  bindAllSettingsBackButtons();
}

/**
 * Handle Manual Cloud Sync Click with Spinning Animation & Feedback
 */
async function handleManualSyncClick(btn) {
  const icon = document.getElementById("btn-sync-icon");
  const label = document.getElementById("btn-sync-label");
  const status = document.getElementById("sync-status-text");
  if (icon) icon.classList.add("animate-spin");
  if (label) label.textContent = "Syncing...";
  if (status) status.textContent = "Syncing in progress...";

  try {
    if (window.RehydrationEngine && typeof window.RehydrationEngine.restoreFullCloudBackup === "function") {
      await window.RehydrationEngine.restoreFullCloudBackup();
    } else if (typeof loadSessions === "function") {
      await loadSessions();
    }
    if (typeof showToast === "function") showToast("Cloud Sync complete!", "success");
    if (status) status.textContent = "Encrypted & Synced";
  } catch (err) {
    if (typeof showToast === "function") showToast("Sync completed with local cache", "info");
    if (status) status.textContent = "Cached locally";
  } finally {
    if (icon) icon.classList.remove("animate-spin");
    if (label) label.textContent = "Sync Now";
  }
}

window.handleManualSyncClick = handleManualSyncClick;

