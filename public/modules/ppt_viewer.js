/**
 * Rhynia Intelligence SaaS — Interactive Presentation Player & PPTX Viewer
 * 
 * Features:
 * - 16:9 Widescreen slide deck player embedded inside chat
 * - 35+ Executive Themes Catalogue with on-the-fly theme switcher
 * - Running Header (Category Pill & Title) & Running Footer (Presenter, Date, Slide Counter)
 * - Wikipedia & HD Visual Image Embedding with Lightbox Zoom
 * - Complete Layout Diversity: Cover, Agenda, Metrics, Charts, Tables, Roadmaps, Split, Matrix, Showcase, Conclusion
 * - Full-screen presentation mode with keyboard navigation (ArrowLeft, ArrowRight, Escape)
 * - 1-Click native .pptx download directly to user's device
 */

(function () {
  "use strict";

  // Global presentation decks state registry
  window.RhyniaDecks = window.RhyniaDecks || {};

  /**
   * 20 Curated PowerPoint Themes with 5-Color Palette Swatches, Geometric Art Types & Typography
   */
  const THEME_STYLES = {
    // 1. Corporate Azure (Microsoft Office standard)
    corporate_azure: {
      key: "corporate_azure",
      label: "Office Azure",
      artType: "waves_corner",
      fontFamily: "font-sans",
      bg: "bg-[#0c1a2e]",
      border: "border-blue-900/50",
      accent: "#0078D4",
      accentBg: "bg-[#0078D4]/20 text-[#4cc2ff]",
      cardBg: "bg-[#11233d]/90 border-blue-800/40",
      textHeading: "text-white",
      textBody: "text-slate-200",
      textMuted: "text-slate-400",
      borderSubtle: "border-blue-800/30",
      swatches: ["#0c1a2e", "#0078D4", "#4cc2ff", "#11233d", "#f8fafc"]
    },
    // 2. Wall Street Navy (Gold & Bronze executive)
    wall_street_navy: {
      key: "wall_street_navy",
      label: "Facet Navy",
      artType: "facet_diagonal",
      fontFamily: "font-serif",
      bg: "bg-[#0a1628]",
      border: "border-blue-950/60",
      accent: "#eab308",
      accentBg: "bg-[#eab308]/15 text-[#facc15]",
      cardBg: "bg-[#102440]/90 border-blue-800/40",
      textHeading: "text-white",
      textBody: "text-slate-200",
      textMuted: "text-slate-400",
      borderSubtle: "border-white/10",
      swatches: ["#0a1628", "#102440", "#eab308", "#facc15", "#f8fafc"]
    },
    // 3. Enterprise Gray (Light crisp modern)
    enterprise_gray: {
      key: "enterprise_gray",
      label: "Gallery Light",
      artType: "inner_plate",
      fontFamily: "font-sans",
      bg: "bg-[#f8fafc]",
      border: "border-slate-300",
      accent: "#2563eb",
      accentBg: "bg-blue-100 text-blue-800 font-semibold",
      cardBg: "bg-white border-slate-200 shadow-sm",
      textHeading: "text-slate-900",
      textBody: "text-slate-700",
      textMuted: "text-slate-500",
      borderSubtle: "border-slate-200",
      swatches: ["#f8fafc", "#ffffff", "#2563eb", "#64748b", "#0f172a"],
      isLight: true
    },
    // 4. Executive Platinum (Clean steel off-white)
    executive_platinum: {
      key: "executive_platinum",
      label: "Integral Slate",
      artType: "inner_plate",
      fontFamily: "font-sans",
      bg: "bg-[#f1f5f9]",
      border: "border-slate-300",
      accent: "#1e3a8a",
      accentBg: "bg-indigo-100 text-indigo-900 font-semibold",
      cardBg: "bg-white border-slate-200 shadow-sm",
      textHeading: "text-slate-900",
      textBody: "text-slate-700",
      textMuted: "text-slate-500",
      borderSubtle: "border-slate-200",
      swatches: ["#f1f5f9", "#ffffff", "#1e3a8a", "#475569", "#0f172a"],
      isLight: true
    },
    // 5. Cyber Dark (Deep obsidian neon cyan)
    cyber_dark: {
      key: "cyber_dark",
      label: "Ion Obsidian",
      artType: "neon_grid",
      fontFamily: "font-mono",
      bg: "bg-[#0b0e14]",
      border: "border-cyan-900/50",
      accent: "#00a4ef",
      accentBg: "bg-[#00a4ef]/15 text-[#00a4ef]",
      cardBg: "bg-[#131b26]/90 border-cyan-800/30",
      textHeading: "text-white",
      textBody: "text-slate-200",
      textMuted: "text-slate-400",
      borderSubtle: "border-white/10",
      swatches: ["#0b0e14", "#131b26", "#00a4ef", "#34d399", "#f8fafc"]
    },
    // 6. Quantum Violet (Laser violet & magenta)
    quantum_violet: {
      key: "quantum_violet",
      label: "Celestial Violet",
      artType: "minimal_pill",
      fontFamily: "font-sans",
      bg: "bg-[#0f0a1c]",
      border: "border-purple-900/50",
      accent: "#a855f7",
      accentBg: "bg-[#a855f7]/15 text-[#c084fc]",
      cardBg: "bg-[#1b1233]/90 border-purple-800/30",
      textHeading: "text-white",
      textBody: "text-purple-100",
      textMuted: "text-purple-300",
      borderSubtle: "border-purple-900/30",
      swatches: ["#0f0a1c", "#1b1233", "#a855f7", "#ec4899", "#faf5ff"]
    },
    // 7. Circuit Green (Terminal emerald & cyan)
    circuit_green: {
      key: "circuit_green",
      label: "Vapor Green",
      artType: "neon_grid",
      fontFamily: "font-mono",
      bg: "bg-[#08140f]",
      border: "border-emerald-900/50",
      accent: "#22c55e",
      accentBg: "bg-[#22c55e]/15 text-[#4ade80]",
      cardBg: "bg-[#0e241a]/90 border-emerald-800/30",
      textHeading: "text-white",
      textBody: "text-emerald-100",
      textMuted: "text-emerald-300",
      borderSubtle: "border-emerald-900/30",
      swatches: ["#08140f", "#0e241a", "#22c55e", "#38bdf8", "#f0fdf4"]
    },
    // 8. Cloud Slate (Dark slate & sky blue)
    cloud_slate: {
      key: "cloud_slate",
      label: "Parallax Slate",
      artType: "waves_corner",
      fontFamily: "font-sans",
      bg: "bg-[#0f172a]",
      border: "border-slate-800/60",
      accent: "#38bdf8",
      accentBg: "bg-[#38bdf8]/15 text-[#38bdf8]",
      cardBg: "bg-[#1e293b]/90 border-slate-700/40",
      textHeading: "text-white",
      textBody: "text-slate-200",
      textMuted: "text-slate-400",
      borderSubtle: "border-slate-800/50",
      swatches: ["#0f172a", "#1e293b", "#38bdf8", "#6366f1", "#f8fafc"]
    },
    // 9. DevOps Charcoal (Zinc charcoal & vibrant orange)
    devops_charcoal: {
      key: "devops_charcoal",
      label: "Frame Charcoal",
      artType: "banded",
      fontFamily: "font-mono",
      bg: "bg-[#18181b]",
      border: "border-zinc-800/60",
      accent: "#f97316",
      accentBg: "bg-[#f97316]/15 text-[#fb923c]",
      cardBg: "bg-[#27272a]/90 border-zinc-700/40",
      textHeading: "text-white",
      textBody: "text-zinc-200",
      textMuted: "text-zinc-400",
      borderSubtle: "border-zinc-800/50",
      swatches: ["#18181b", "#27272a", "#f97316", "#0ea5e9", "#fafafa"]
    },
    // 10. AI Silicon (Titanium & green)
    ai_silicon: {
      key: "ai_silicon",
      label: "Circuit Titanium",
      artType: "frame_borders",
      fontFamily: "font-mono",
      bg: "bg-[#121418]",
      border: "border-neutral-800/60",
      accent: "#76b900",
      accentBg: "bg-[#76b900]/15 text-[#a3e635]",
      cardBg: "bg-[#1c2026]/90 border-neutral-700/40",
      textHeading: "text-white",
      textBody: "text-neutral-200",
      textMuted: "text-neutral-400",
      borderSubtle: "border-neutral-800/50",
      swatches: ["#121418", "#1c2026", "#76b900", "#a3e635", "#f4f4f5"]
    },
    // 11. YC Startup Orange
    yc_orange: {
      key: "yc_orange",
      label: "Metropolitan",
      artType: "banded",
      fontFamily: "font-sans",
      bg: "bg-[#0f0f11]",
      border: "border-orange-950/60",
      accent: "#ff6600",
      accentBg: "bg-[#ff6600]/15 text-[#ff6600]",
      cardBg: "bg-[#1a1a1e]/90 border-orange-900/30",
      textHeading: "text-white",
      textBody: "text-neutral-200",
      textMuted: "text-neutral-400",
      borderSubtle: "border-orange-950/50",
      swatches: ["#0f0f11", "#1a1a1e", "#ff6600", "#f59e0b", "#ffffff"]
    },
    // 12. Unicorn Purple (Royal violet & orchid)
    unicorn_purple: {
      key: "unicorn_purple",
      label: "Savon Orchid",
      artType: "minimal_pill",
      fontFamily: "font-sans",
      bg: "bg-[#100c20]",
      border: "border-violet-900/50",
      accent: "#8b5cf6",
      accentBg: "bg-[#8b5cf6]/15 text-[#a78bfa]",
      cardBg: "bg-[#1c1636]/90 border-violet-800/30",
      textHeading: "text-white",
      textBody: "text-violet-100",
      textMuted: "text-violet-300",
      borderSubtle: "border-violet-900/30",
      swatches: ["#100c20", "#1c1636", "#8b5cf6", "#ec4899", "#f5f3ff"]
    },
    // 13. SaaS Indigo
    saas_indigo: {
      key: "saas_indigo",
      label: "Banded Indigo",
      artType: "banded",
      fontFamily: "font-sans",
      bg: "bg-[#0c0f1e]",
      border: "border-indigo-900/50",
      accent: "#6366f1",
      accentBg: "bg-[#6366f1]/15 text-[#818cf8]",
      cardBg: "bg-[#151a34]/90 border-indigo-800/30",
      textHeading: "text-white",
      textBody: "text-indigo-100",
      textMuted: "text-indigo-300",
      borderSubtle: "border-indigo-900/30",
      swatches: ["#0c0f1e", "#151a34", "#6366f1", "#06b6d4", "#eef2ff"]
    },
    // 14. Academic Slate (Deep Oxford navy & sky)
    academic_slate: {
      key: "academic_slate",
      label: "Retrospect Slate",
      artType: "split_canvas",
      fontFamily: "font-serif",
      bg: "bg-[#121826]",
      border: "border-slate-800/60",
      accent: "#4f91ff",
      accentBg: "bg-[#4f91ff]/15 text-[#60a5fa]",
      cardBg: "bg-[#1c263a]/90 border-slate-700/40",
      textHeading: "text-white",
      textBody: "text-slate-200",
      textMuted: "text-slate-400",
      borderSubtle: "border-slate-800/50",
      swatches: ["#121826", "#1c263a", "#4f91ff", "#cbd5e1", "#ffffff"]
    },
    // 15. Chalkboard (Deep green & chalk yellow)
    chalkboard_dark: {
      key: "chalkboard_dark",
      label: "Chalkboard",
      artType: "frame_borders",
      fontFamily: "font-serif",
      bg: "bg-[#12201a]",
      border: "border-emerald-950/60",
      accent: "#fde047",
      accentBg: "bg-[#fde047]/15 text-[#fde047]",
      cardBg: "bg-[#1c3028]/90 border-emerald-900/40",
      textHeading: "text-white",
      textBody: "text-emerald-100",
      textMuted: "text-emerald-300",
      borderSubtle: "border-emerald-900/30",
      swatches: ["#12201a", "#1c3028", "#fde047", "#34d399", "#ffffff"]
    },
    // 16. Scholar Paper (Warm antique parchment)
    scholar_paper: {
      key: "scholar_paper",
      label: "Antique Parchment",
      artType: "split_canvas",
      fontFamily: "font-serif",
      bg: "bg-[#faf8f5]",
      border: "border-amber-200/80",
      accent: "#a03c28",
      accentBg: "bg-amber-100 text-amber-900 font-semibold",
      cardBg: "bg-white border-amber-200 shadow-sm",
      textHeading: "text-stone-900",
      textBody: "text-stone-700",
      textMuted: "text-stone-500",
      borderSubtle: "border-amber-200/60",
      swatches: ["#faf8f5", "#ffffff", "#a03c28", "#d97706", "#292524"],
      isLight: true
    },
    // 17. STEM Cyan (Abyssal Navy & cyan)
    stem_cyan: {
      key: "stem_cyan",
      label: "Quotable Cyan",
      artType: "facet_diagonal",
      fontFamily: "font-mono",
      bg: "bg-[#0c1622]",
      border: "border-cyan-900/50",
      accent: "#06b6d4",
      accentBg: "bg-[#06b6d4]/15 text-[#22d3ee]",
      cardBg: "bg-[#142438]/90 border-cyan-800/30",
      textHeading: "text-white",
      textBody: "text-cyan-100",
      textMuted: "text-cyan-300",
      borderSubtle: "border-cyan-900/30",
      swatches: ["#0c1622", "#142438", "#06b6d4", "#3b82f6", "#f0fdfa"]
    },
    // 18. Sunset Coral (Midnight plum & coral)
    sunset_coral: {
      key: "sunset_coral",
      label: "Organic Coral",
      artType: "minimal_pill",
      fontFamily: "font-sans",
      bg: "bg-[#1c0e12]",
      border: "border-rose-900/50",
      accent: "#fb7185",
      accentBg: "bg-[#fb7185]/15 text-[#fda4af]",
      cardBg: "bg-[#30181e]/90 border-rose-800/30",
      textHeading: "text-white",
      textBody: "text-rose-100",
      textMuted: "text-rose-300",
      borderSubtle: "border-rose-900/30",
      swatches: ["#1c0e12", "#30181e", "#fb7185", "#f97316", "#fff1f2"]
    },
    // 19. Clinical Blue (Light arctic clinical)
    clinical_blue: {
      key: "clinical_blue",
      label: "Slice Arctic",
      artType: "inner_plate",
      fontFamily: "font-sans",
      bg: "bg-[#f5faff]",
      border: "border-sky-200",
      accent: "#0284c7",
      accentBg: "bg-sky-100 text-sky-800 font-semibold",
      cardBg: "bg-white border-sky-100 shadow-sm",
      textHeading: "text-slate-900",
      textBody: "text-slate-700",
      textMuted: "text-slate-500",
      borderSubtle: "border-sky-200",
      swatches: ["#f5faff", "#ffffff", "#0284c7", "#38bdf8", "#0f172a"],
      isLight: true
    },
    // 20. Eco Forest (Dark emerald pine)
    eco_forest: {
      key: "eco_forest",
      label: "Badge Emerald",
      artType: "waves_corner",
      fontFamily: "font-sans",
      bg: "bg-[#081610]",
      border: "border-emerald-950/60",
      accent: "#22c55e",
      accentBg: "bg-[#22c55e]/15 text-[#4ade80]",
      cardBg: "bg-[#0f281c]/90 border-emerald-900/30",
      textHeading: "text-white",
      textBody: "text-emerald-100",
      textMuted: "text-emerald-300",
      borderSubtle: "border-emerald-950/60",
      swatches: ["#081610", "#0f281c", "#22c55e", "#84cc16", "#f0fdf4"]
    }
  };

  // Backward compatibility aliases
  THEME_STYLES.executive_dark = THEME_STYLES.cyber_dark;
  THEME_STYLES.emerald_minimal = THEME_STYLES.eco_forest;
  THEME_STYLES.clean_light = THEME_STYLES.enterprise_gray;
  THEME_STYLES.pitch_dark = THEME_STYLES.devops_charcoal;
  THEME_STYLES.venture_capital = THEME_STYLES.corporate_azure;
  THEME_STYLES.strategic_monochrome = THEME_STYLES.enterprise_gray;
  THEME_STYLES.consulting_cobalt = THEME_STYLES.corporate_azure;
  THEME_STYLES.founder_minimal = THEME_STYLES.enterprise_gray;
  THEME_STYLES.university_burgundy = THEME_STYLES.sunset_coral;
  THEME_STYLES.research_teal = THEME_STYLES.circuit_green;
  THEME_STYLES.neon_pulse = THEME_STYLES.quantum_violet;
  THEME_STYLES.minimal_peach = THEME_STYLES.scholar_paper;
  THEME_STYLES.bold_crimson = THEME_STYLES.sunset_coral;
  THEME_STYLES.pastel_creative = THEME_STYLES.enterprise_gray;
  THEME_STYLES.editorial_beige = THEME_STYLES.scholar_paper;
  THEME_STYLES.vibrant_tropical = THEME_STYLES.circuit_green;
  THEME_STYLES.pharma_mint = THEME_STYLES.clinical_blue;
  THEME_STYLES.renewable_lime = THEME_STYLES.eco_forest;
  THEME_STYLES.biotech_aqua = THEME_STYLES.stem_cyan;

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * Renders Geometric Theme Artwork Background Layer
   */
  function renderThemeBackgroundArtwork(theme) {
    if (!theme) return "";
    const art = theme.artType || "waves_corner";
    const accent = theme.accent || "#0078D4";

    if (art === "waves_corner") {
      return `
        <div class="pointer-events-none absolute inset-0 overflow-hidden z-0 theme-art-bg" aria-hidden="true">
          <svg class="absolute -bottom-8 -left-8 w-72 sm:w-96 h-48 sm:h-64 opacity-25" viewBox="0 0 400 300" fill="none">
            <path d="M0,150 C120,240 220,60 400,180 L400,300 L0,300 Z" fill="${accent}" fill-opacity="0.35"/>
            <path d="M0,200 C140,90 260,260 400,220 L400,300 L0,300 Z" fill="${accent}" fill-opacity="0.6"/>
          </svg>
          <div class="absolute top-0 right-0 w-80 h-1.5 opacity-60" style="background: linear-gradient(270deg, ${accent}, transparent)"></div>
        </div>
      `;
    }
    if (art === "inner_plate") {
      return `
        <div class="pointer-events-none absolute inset-0 overflow-hidden z-0 theme-art-bg" aria-hidden="true">
          <div class="absolute inset-2 sm:inset-3 rounded-2xl border ${theme.borderSubtle || 'border-white/10'} bg-white/[0.02]"></div>
          <div class="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2" style="border-color: ${accent}"></div>
          <div class="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2" style="border-color: ${accent}"></div>
        </div>
      `;
    }
    if (art === "banded") {
      return `
        <div class="pointer-events-none absolute inset-0 overflow-hidden z-0 theme-art-bg" aria-hidden="true">
          <div class="absolute top-0 inset-x-0 h-2 opacity-90 shadow-sm" style="background-color: ${accent}"></div>
          <div class="absolute bottom-0 inset-x-0 h-1.5 opacity-70" style="background-color: ${accent}"></div>
        </div>
      `;
    }
    if (art === "facet_diagonal") {
      return `
        <div class="pointer-events-none absolute inset-0 overflow-hidden z-0 theme-art-bg" aria-hidden="true">
          <div class="absolute top-0 right-0 w-36 h-36 opacity-15" style="background: linear-gradient(135deg, transparent 50%, ${accent} 50%)"></div>
          <div class="absolute bottom-0 left-0 w-28 h-28 opacity-15" style="background: linear-gradient(-45deg, transparent 50%, ${accent} 50%)"></div>
          <div class="absolute top-0 left-0 w-full h-[1px] opacity-30" style="background: linear-gradient(90deg, ${accent}, transparent)"></div>
        </div>
      `;
    }
    if (art === "neon_grid") {
      return `
        <div class="pointer-events-none absolute inset-0 overflow-hidden z-0 theme-art-bg" aria-hidden="true">
          <div class="absolute inset-0 opacity-[0.06]" style="background-image: radial-gradient(${accent} 1.5px, transparent 1.5px); background-size: 24px 24px;"></div>
          <div class="absolute inset-x-0 bottom-0 h-28 opacity-20 pointer-events-none" style="background-image: linear-gradient(to top, ${accent}, transparent);"></div>
        </div>
      `;
    }
    if (art === "split_canvas") {
      return `
        <div class="pointer-events-none absolute inset-0 overflow-hidden z-0 theme-art-bg" aria-hidden="true">
          <div class="absolute inset-y-0 left-0 w-1/4 opacity-10 border-r border-white/10" style="background-color: ${accent}"></div>
          <div class="absolute bottom-0 inset-x-0 h-1" style="background-color: ${accent}"></div>
        </div>
      `;
    }
    if (art === "minimal_pill") {
      return `
        <div class="pointer-events-none absolute inset-0 overflow-hidden z-0 theme-art-bg" aria-hidden="true">
          <div class="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl opacity-15 pointer-events-none" style="background-color: ${accent}"></div>
          <div class="absolute -bottom-16 -left-16 w-56 h-56 rounded-full blur-3xl opacity-15 pointer-events-none" style="background-color: ${accent}"></div>
        </div>
      `;
    }
    // Default / frame_borders
    return `
      <div class="pointer-events-none absolute inset-0 overflow-hidden z-0 theme-art-bg" aria-hidden="true">
        <div class="absolute inset-2 sm:inset-3 border border-white/5 pointer-events-none"></div>
        <div class="absolute top-2 left-2 w-2 h-2" style="background-color: ${accent}"></div>
        <div class="absolute top-2 right-2 w-2 h-2" style="background-color: ${accent}"></div>
      </div>
    `;
  }

  /**
   * Cleans presentation topic title by removing prompt prefixes/suffixes
   */
  function cleanTopicTitle(rawTitle) {
    if (!rawTitle) return "Presentation";
    let text = rawTitle.trim();
    const prefixPatterns = [
      /^(?:please\s+|plz\s+)?\b(?:mujhe\s+|hume\s+)?(?:ek\s+|1\s+)?(?:ppt|presentation|slides|deck)\s*(?:banao|banado|bana\s*do|banaiye|create|creat|make|generate|chahiye)\s*(?:on|par|pe|about|for|ke\s*liye|of)?\s*/i,
      /^(?:please\s+|plz\s+)?\b(?:create|creat|make|build|generate|design|prepare|write|give\s*me)\b\s*(?:\ba\b|\ban\b)?\s*(?:\bpresentation\b|\bppt\b|\bslide\s*deck\b|\bslides\b|\bdeck\b)?\s*(?:\bof\b|\bon\b|\babout\b|\bfor\b|\bregarding\b)?\s*(?:\btopic\b|\btoic\b)?\s*(?:\bis\b|\bon\b|\bof\b|\ba\b|\ban\b)?\s*/i,
      /^(?:ek\s+|1\s+)?\b(?:ppt|presentation|deck)\b\s*(?:on|par|pe|about|ke\s*liye|of)?\s*/i,
      /^(?:\btopic\b|\btoic\b)\s*[:\-–—]?\s*/i
    ];
    const suffixPatterns = [
      /\s*(?:par|pe|ke\s*upar|ke\s*baare\s*me|ke\s*bare\s*me)\s*(?:ek\s+)?(?:\d+\s*(?:slide|slides|page|pages)\s*(?:ka|ki|me)?)?\s*(?:ppt|presentation|slides)?\s*(?:banao|banado|bana\s*do|banaiye|chahiye)?\s*$/i,
      /\s*(?:toic|topic)\s*(?:me|par|pe)?\s*(?:\d+\s*(?:slide|slides|page|pages))?\s*(?:me|ka|ki|banao|banado|bana\s*do)?\s*$/i,
      /\s*(?:ke\s*liye|par|pe|ke\s*upar|ke\s*bare\s*me)?\s*\d+\s*(?:slide|slides|page|pages)\s*(?:ka|ki|me)?\s*(?:ppt|presentation)?\s*(?:banao|banado|bana\s*do|ke\s*sath)?\s*$/i,
      /\s*(?:ek\s+)?(?:ppt|presentation|deck)\s*(?:banao|banado|bana\s*do|banaiye|chahiye)?\s*$/i,
      /\s*(?:in\s+hindi|hindi\s+me|in\s+english|english\s+me)\s*$/i,
      /\s*(?:with\s+photos?|with\s+images?|photo\s+ke\s*sath|image\s+ke\s*sath|pictures?\s+ke\s*sath)\s*$/i,
      /\s*(?:banao|banado|bana\s*do|banaiye|chahiye|create|creat|make)\s*$/i,
      /\s*(?:पर|पे|के\s*बारे\s*में|के\s*ऊपर)\s*(?:\d+\s*स्लाइड\s*(?:की|का|में)?)?\s*(?:पीपीटी|प्रेजेंटेशन)?\s*(?:बनाओ|बना\s*दो|चाहिए)?\s*$/i,
      /\s*\d+\s*स्लाइड\s*(?:की|का|में)?\s*(?:पीपीटी|प्रेजेंटेशन)?\s*(?:बनाओ|बना\s*दो)?\s*$/i,
      /\s*(?:बनाओ|बना\s*दो|चाहिए)\s*$/i
    ];

    for (let i = 0; i < 4; i++) {
      for (const pat of prefixPatterns) {
        text = text.replace(pat, "").trim();
      }
      for (const pat of suffixPatterns) {
        text = text.replace(pat, "").trim();
      }
      text = text.replace(/^(?:\bof\b|\bon\b|\babout\b|\ba\b|\ban\b|\bthe\b|\btopic\b|\btoic\b|\bka\b|\bki\b|\bke\b)\s+/i, "").trim();
    }

    text = text.replace(/["'`]/g, "").replace(/^[-:;,.\s]+|[-:;,.\s]+$/g, "");
    if (text.length >= 2) {
      if (text === text.toUpperCase() || text === text.toLowerCase() || text.split(" ").some(w => w === w.toLowerCase())) {
        text = text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase());
      }
      return text;
    }
    return rawTitle || "Executive Presentation";
  }

  /**
   * Builds the HTML container for a Presentation Deck
   */
  window.renderPresentationDeckHTML = function (deckData) {
    if (!deckData || !deckData.slides || deckData.slides.length === 0) {
      return `<div class="p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs">Invalid presentation data</div>`;
    }

    const deckId = "deck_" + Math.random().toString(36).substring(2, 9);
    window.RhyniaDecks[deckId] = {
      data: deckData,
      currentSlideIndex: 0,
      chartInstances: {}
    };

    const themeKey = deckData.theme || "executive_dark";
    const theme = THEME_STYLES[themeKey] || THEME_STYLES.executive_dark;
    const totalSlides = deckData.slides.length;
    const cleanTitle = cleanTopicTitle(deckData.title || "Executive Presentation");
    deckData.title = cleanTitle;
    const downloadUrl = deckData.download_url || "#";
    const filename = deckData.filename || `${cleanTitle}.pptx`;
    const fileSizeKb = deckData.file_size_bytes ? Math.round(deckData.file_size_bytes / 1024) : 48;

    // 20 Curated PowerPoint Themes list for visual gallery
    const CURATED_THEME_KEYS = [
      "corporate_azure", "wall_street_navy", "enterprise_gray", "executive_platinum",
      "cyber_dark", "quantum_violet", "circuit_green", "cloud_slate",
      "devops_charcoal", "ai_silicon", "yc_orange", "unicorn_purple",
      "saas_indigo", "academic_slate", "chalkboard_dark", "scholar_paper",
      "stem_cyan", "sunset_coral", "clinical_blue", "eco_forest"
    ];

    const themeCardsHtml = CURATED_THEME_KEYS.map(k => {
      const t = THEME_STYLES[k];
      if (!t) return "";
      const isCurrent = (k === themeKey || (THEME_STYLES[themeKey] && THEME_STYLES[themeKey].label === t.label));
      return `
        <button type="button" 
          onclick="pptViewerSelectTheme('${deckId}', '${k}')" 
          data-deck-theme-card="${deckId}"
          data-theme-key="${k}"
          class="group flex flex-col rounded-xl overflow-hidden ${isCurrent ? 'border-2 border-[#0078D4] ring-2 ring-[#0078D4]/40' : 'border border-white/10 hover:border-white/30'} bg-black/40 text-left transition-all hover:scale-[1.02]">
          <!-- Mini Slide Preview -->
          <div class="h-11 w-full flex items-center justify-center relative ${t.bg} border-b border-white/10">
            <span class="text-base font-bold font-serif" style="color: ${t.accent}">Aa</span>
            ${isCurrent ? '<span class="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#0078D4] text-white flex items-center justify-center text-[9px] font-bold"><span class="material-symbols-outlined text-[10px]">check</span></span>' : ''}
          </div>
          <!-- Info & 5-Color Swatch Strip -->
          <div class="p-1.5 bg-[#12161f]">
            <div class="text-[11px] font-medium text-white truncate leading-tight">${t.label}</div>
            <div class="flex items-center gap-1 mt-1">
              ${(t.swatches || [t.accent]).map(c => `<span class="w-2.5 h-2.5 rounded-sm border border-black/30" style="background-color: ${c}"></span>`).join('')}
            </div>
          </div>
        </button>
      `;
    }).join("");

    return `
      <div id="${deckId}" class="rhynia-deck-wrapper my-4 rounded-2xl border ${theme.border} ${theme.bg} shadow-2xl transition-all relative overflow-visible" data-current-theme="${themeKey}">
        <!-- Top Control Bar (z-40 relative with backdrop blur) -->
        <div class="relative z-40 flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-black/60 border-b border-white/10 backdrop-blur-md rounded-t-2xl">
          <!-- Clean Topic Header: ONLY Topic Name Show Ho -->
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-8 h-8 rounded-lg bg-[#0078D4]/20 border border-[#0078D4]/40 flex items-center justify-center text-[#4cc2ff] flex-shrink-0">
              <span class="material-symbols-outlined text-[18px]">co_present</span>
            </span>
            <div class="min-w-0">
              <h4 class="font-bold text-sm sm:text-base text-white truncate max-w-xs sm:max-w-md" title="${escapeHtml(cleanTitle)}">${escapeHtml(cleanTitle)}</h4>
            </div>
          </div>

          <!-- Navigation & Action Buttons -->
          <div class="flex items-center gap-2 flex-wrap">
            <!-- Slide Counter & Arrows -->
            <div class="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5 text-xs text-neutral-300">
              <button type="button" onclick="pptViewerPrevSlide('${deckId}')" class="p-1.5 hover:text-white hover:bg-white/10 rounded transition-all disabled:opacity-30 disabled:pointer-events-none" id="${deckId}-prev-btn" title="Previous Slide (Left Arrow)">
                <span class="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <span class="px-2 font-mono text-[11px] font-medium text-white" id="${deckId}-counter">
                1 / ${totalSlides}
              </span>
              <button type="button" onclick="pptViewerNextSlide('${deckId}')" class="p-1.5 hover:text-white hover:bg-white/10 rounded transition-all disabled:opacity-30 disabled:pointer-events-none" id="${deckId}-next-btn" title="Next Slide (Right Arrow)">
                <span class="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>

            <!-- Fullscreen Present Button -->
            <button type="button" onclick="openPresentationFullScreen('${deckId}')" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 border border-white/10" title="Full-Screen Presentation Mode (Keyboard: Arrow Keys & Space)">
              <span class="material-symbols-outlined text-[15px] text-[#4cc2ff]">fullscreen</span>
              <span class="hidden sm:inline">Present</span>
            </button>

            <!-- PowerPoint Style Design Menu Popover Button -->
            <button type="button" onclick="pptViewerToggleDesignMenu('${deckId}', event)" class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 border border-white/10" id="${deckId}-design-btn" title="PowerPoint Design Themes (20 Themes & Palettes)">
              <span class="material-symbols-outlined text-[15px] text-[#facc15]">palette</span>
              <span class="hidden sm:inline">Design</span>
              <span class="material-symbols-outlined text-[14px] text-neutral-400">arrow_drop_down</span>
            </button>

            <!-- 3-in-1 Download Button (PowerPoint, PDF, Word) -->
            <button type="button" onclick="pptViewerToggleDownloadMenu('${deckId}', event)" class="px-3.5 py-1.5 rounded-lg bg-[#0078D4] hover:bg-[#1084d9] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-[#0078D4]/25 active:scale-95" id="${deckId}-download-btn" title="Download Presentation (PowerPoint, PDF, Word)">
              <span class="material-symbols-outlined text-[16px]">download</span>
              <span>Download</span>
              <span class="material-symbols-outlined text-[14px] text-white/70">arrow_drop_down</span>
            </button>
          </div>

          <!-- Design Themes Popover (Placed inside Top Control Bar at z-50, perfectly centered and floating ABOVE slide stage) -->
          <div id="${deckId}-design-popover" onclick="event.stopPropagation()" class="hidden absolute left-1/2 -translate-x-1/2 top-[calc(100%+8px)] w-[calc(100%-20px)] max-w-xl max-h-[440px] overflow-y-auto z-50 p-4 rounded-2xl bg-[#0b0f17] border border-white/20 shadow-2xl animate-fade-in custom-scrollbar">
            <div class="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-[#facc15]">palette</span>
                <div>
                  <h5 class="text-xs font-bold text-white leading-tight">PowerPoint Design Themes</h5>
                  <p class="text-[10px] text-neutral-400">Select any theme to restyle all slides instantly</p>
                </div>
              </div>
              <button type="button" onclick="pptViewerToggleDesignMenu('${deckId}', event)" class="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-white/10 text-xs">
                <span class="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              ${themeCardsHtml}
            </div>
          </div>

          <!-- Download Popover Dropdown (Placed inside Top Control Bar at z-50, floating ABOVE slide stage) -->
          <div id="${deckId}-download-popover" onclick="event.stopPropagation()" class="hidden absolute right-3 top-[calc(100%+8px)] w-72 max-w-[calc(100%-20px)] z-50 p-2.5 rounded-2xl bg-[#0b0f17] border border-white/20 shadow-2xl animate-fade-in">
            <div class="px-2 py-1 mb-1.5 border-b border-white/10 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Select Export Format
            </div>
            <!-- 1. PowerPoint -->
            <button type="button" onclick="pptViewerExportDeck('${deckId}', 'pptx')" class="w-full text-left p-2.5 rounded-xl hover:bg-white/10 flex items-start gap-3 transition-all group">
              <span class="w-8 h-8 rounded-lg bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform flex-shrink-0">
                <span class="material-symbols-outlined text-[18px]">slideshow</span>
              </span>
              <div class="min-w-0 flex-1">
                <div class="font-bold text-xs text-white flex items-center gap-1.5">
                  <span>PowerPoint</span>
                  <span class="text-[9px] bg-orange-500/20 text-orange-300 px-1 py-0.2 rounded font-mono font-normal">.pptx</span>
                </div>
                <div class="text-[10px] text-neutral-400 leading-snug mt-0.5">Editable 16:9 widescreen with real Excel charts</div>
              </div>
            </button>
            <!-- 2. PDF -->
            <button type="button" onclick="pptViewerExportDeck('${deckId}', 'pdf')" class="w-full text-left p-2.5 rounded-xl hover:bg-white/10 flex items-start gap-3 transition-all group mt-1">
              <span class="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform flex-shrink-0">
                <span class="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              </span>
              <div class="min-w-0 flex-1">
                <div class="font-bold text-xs text-white flex items-center gap-1.5">
                  <span>PDF Document</span>
                  <span class="text-[9px] bg-red-500/20 text-red-300 px-1 py-0.2 rounded font-mono font-normal">.pdf</span>
                </div>
                <div class="text-[10px] text-neutral-400 leading-snug mt-0.5">Vector slides, clean formatting for print & sharing</div>
              </div>
            </button>
            <!-- 3. Word -->
            <button type="button" onclick="pptViewerExportDeck('${deckId}', 'docx')" class="w-full text-left p-2.5 rounded-xl hover:bg-white/10 flex items-start gap-3 transition-all group mt-1">
              <span class="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform flex-shrink-0">
                <span class="material-symbols-outlined text-[18px]">description</span>
              </span>
              <div class="min-w-0 flex-1">
                <div class="font-bold text-xs text-white flex items-center gap-1.5">
                  <span>Word Document</span>
                  <span class="text-[9px] bg-blue-500/20 text-blue-300 px-1 py-0.2 rounded font-mono font-normal">.docx</span>
                </div>
                <div class="text-[10px] text-neutral-400 leading-snug mt-0.5">Structured executive brief with headings & tables</div>
              </div>
            </button>
          </div>
        </div>

        <!-- 16:9 Slide Stage Viewport (z-10 relative) -->
        <div class="relative z-10 w-full aspect-[16/9] min-h-[320px] max-h-[580px] overflow-hidden flex flex-col justify-between p-3 sm:p-5 ${theme.fontFamily || ''}" id="${deckId}-stage">
          ${renderThemeBackgroundArtwork(theme)}
          ${renderSlideContent(deckData.slides[0], 0, totalSlides, deckId, theme, deckData)}
        </div>

        <!-- Bottom Slide Thumbnail Strip / Dots Bar (z-10 relative rounded-b-2xl) -->
        <div class="relative z-10 flex items-center justify-between px-4 py-2.5 bg-black/30 border-t border-white/5 text-[11px] text-neutral-400 rounded-b-2xl">
          <div class="flex items-center gap-1.5 overflow-x-auto py-1 max-w-[70%]" id="${deckId}-dots">
            ${deckData.slides.map((s, idx) => `
              <button type="button" onclick="pptViewerGoToSlide('${deckId}', ${idx})" class="w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono transition-all ${idx === 0 ? 'bg-[#0078D4] text-white font-bold shadow' : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'}" id="${deckId}-dot-${idx}" title="Slide ${idx + 1}: ${escapeHtml(s.title || '')}">
                ${idx + 1}
              </button>
            `).join('')}
          </div>
          <div class="flex items-center gap-2 text-[10px] text-neutral-400">
            <span class="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Real Excel Charts • Tables • HD Images</span>
          </div>
        </div>
      </div>
    `.trim();
  };

  /**
   * Running Header Markup
   */
  function renderRunningHeader(slide, theme) {
    const cat = slide.category || "EXECUTIVE STRATEGY";
    const title = slide.title || "Overview";
    const headingColor = theme.textHeading || "text-white";
    const borderSubtle = theme.borderSubtle || "border-white/10";
    return `
      <div class="relative z-20 w-full pb-2 mb-1.5 border-b ${borderSubtle} flex items-center justify-between">
        <div>
          <span class="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${theme.accentBg} px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
            <span class="material-symbols-outlined text-[12px]">verified</span>
            ${escapeHtml(cat)}
          </span>
          <h2 class="text-base sm:text-xl font-bold ${headingColor} mt-1 leading-tight truncate max-w-xl sm:max-w-2xl">${escapeHtml(title)}</h2>
        </div>
      </div>
    `;
  }

  /**
   * Running Footer Markup
   */
  function renderRunningFooter(index, total, presenter, theme) {
    const pName = presenter || "Rhynia AI";
    const headingColor = theme.textHeading || "text-white";
    const mutedColor = theme.textMuted || "text-neutral-400";
    const borderSubtle = theme.borderSubtle || "border-white/10";
    return `
      <div class="relative z-20 w-full pt-2 pb-0.5 mt-auto border-t ${borderSubtle} flex items-center justify-between text-[10px] sm:text-[11px] ${mutedColor}">
        <div class="flex items-center gap-1.5 truncate max-w-[45%]">
          <span class="font-medium ${headingColor}">Presented by: ${escapeHtml(pName)}</span>
          <span class="hidden sm:inline">•</span>
          <span class="hidden sm:inline">Rhynia Intelligence</span>
        </div>
        <div class="hidden md:inline ${mutedColor} font-mono text-[10px]">Confidential • 2026 Edition</div>
        <div class="font-mono ${headingColor} font-bold bg-white/5 px-2 py-0.5 rounded text-[10px]">
          Slide ${index + 1} / ${total}
        </div>
      </div>
    `;
  }

  /**
   * Render single slide content based on layout type
   */
  function renderSlideContent(slide, index, total, deckId, theme, deckData) {
    if (!slide) return `<div class="text-neutral-400 text-xs">Slide empty</div>`;

    const layout = slide.layout || "cards";
    const presenter = slide.presenter || deckData?.presenter || "Rhynia AI";
    const headingColor = theme.textHeading || "text-white";
    const bodyColor = theme.textBody || "text-neutral-200";
    const mutedColor = theme.textMuted || "text-neutral-400";
    const borderSubtle = theme.borderSubtle || "border-white/10";

    // Layout 1: Title Cover Slide (Photo 5 / Executive Architecture)
    if (layout === "title" || index === 0) {
      const heroImg = slide.image_url;
      const dateStr = slide.date || "27 September 2026";
      const locStr = slide.location || "Executive HQ / New Delhi";
      const goalStr = slide.goal || "Strategic Implementation & Action";

      if (heroImg) {
        return `
          <div class="h-full w-full flex flex-col justify-between p-2 sm:p-4 relative z-10 animate-fade-in ${theme.fontFamily || ''}">
            <div class="flex-1 flex flex-col sm:flex-row items-center justify-between gap-3 min-h-0 my-1">
              <!-- Left: Framed Title Box -->
              <div class="flex-1 p-4 sm:p-5 rounded-2xl ${theme.cardBg} border ${borderSubtle} shadow-xl flex flex-col justify-center text-left">
                <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${theme.accentBg} border ${borderSubtle} self-start mb-2">
                  <span class="material-symbols-outlined text-[12px]">stars</span>
                  <span>PROJECT NATURE • ${escapeHtml(slide.category || "EXECUTIVE MASTERCLASS")}</span>
                </div>
                <h1 class="text-xl sm:text-3xl font-extrabold ${headingColor} tracking-tight mb-2 leading-tight">
                  ${escapeHtml(slide.title || "Executive Presentation")}
                </h1>
                <p class="text-xs sm:text-sm ${mutedColor} font-normal line-clamp-2 mb-2">
                  ${escapeHtml(slide.subtitle || "Strategic Roadmap & High-Impact Analysis")}
                </p>
                <!-- Double Ring Motif -->
                <div class="flex items-center gap-2 text-xs font-mono font-bold my-1" style="color: ${theme.accent}">
                  <span class="w-12 h-[1px] bg-current opacity-40"></span>
                  <span>◎</span>
                  <span class="w-12 h-[1px] bg-current opacity-40"></span>
                </div>
              </div>

              <!-- Right: Hero Image Preview Card -->
              <div class="w-full sm:w-[36%] h-[130px] sm:h-full max-h-[210px] rounded-2xl overflow-hidden border ${borderSubtle} bg-black/40 shadow-xl relative group cursor-pointer" onclick="window.openRhyniaLightbox('${heroImg}', '${escapeHtml(slide.title)}')">
                <img src="${heroImg}" alt="${escapeHtml(slide.title)}" class="w-full h-full object-cover transition-transform group-hover:scale-105" referrerpolicy="no-referrer" />
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span class="material-symbols-outlined text-white text-[22px] opacity-0 group-hover:opacity-100 transition-opacity drop-shadow">zoom_in</span>
                </div>
              </div>
            </div>

            <!-- 4-Point Structured Metadata Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full my-1 relative z-20">
              <div class="p-2 sm:p-2.5 rounded-xl ${theme.cardBg} border ${borderSubtle} text-left">
                <span class="text-[9px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                  <span class="material-symbols-outlined text-[12px]" style="color: ${theme.accent}">person</span>
                  Presented By
                </span>
                <div class="text-xs font-bold ${headingColor} truncate mt-0.5">${escapeHtml(slide.presented_by || presenter)}</div>
                <span class="text-[8.5px] text-neutral-400">Rhynia AI</span>
              </div>
              <div class="p-2 sm:p-2.5 rounded-xl ${theme.cardBg} border ${borderSubtle} text-left">
                <span class="text-[9px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                  <span class="material-symbols-outlined text-[12px]" style="color: ${theme.accent}">calendar_today</span>
                  Date
                </span>
                <div class="text-xs font-bold ${headingColor} truncate mt-0.5">${escapeHtml(dateStr)}</div>
                <span class="text-[8.5px] text-neutral-400">Executive Edition</span>
              </div>
              <div class="p-2 sm:p-2.5 rounded-xl ${theme.cardBg} border ${borderSubtle} text-left">
                <span class="text-[9px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                  <span class="material-symbols-outlined text-[12px]" style="color: ${theme.accent}">location_on</span>
                  Location
                </span>
                <div class="text-xs font-bold ${headingColor} truncate mt-0.5">${escapeHtml(locStr)}</div>
                <span class="text-[8.5px] text-neutral-400">Corporate HQ</span>
              </div>
              <div class="p-2 sm:p-2.5 rounded-xl ${theme.cardBg} border ${borderSubtle} text-left">
                <span class="text-[9px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                  <span class="material-symbols-outlined text-[12px]" style="color: ${theme.accent}">flag</span>
                  Goal
                </span>
                <div class="text-xs font-bold ${headingColor} truncate mt-0.5">${escapeHtml(goalStr)}</div>
                <span class="text-[8.5px] text-neutral-400">Strategic Focus</span>
              </div>
            </div>

            <!-- Bottom Running Tag -->
            <div class="w-full pt-1.5 mt-auto border-t ${borderSubtle} flex items-center justify-between text-[9px] ${mutedColor}">
              <span class="font-mono">Rhynia Intelligence Platform</span>
              <span class="font-mono">CONFIDENTIAL • 2026 EDITION</span>
              <span class="font-mono">16:9 Widescreen</span>
            </div>
          </div>
        `;
      }

      return `
        <div class="h-full w-full flex flex-col justify-between p-3 sm:p-6 text-center relative z-10 animate-fade-in ${theme.fontFamily || ''}">
          <!-- Centered Framed Title Box -->
          <div class="w-full max-w-2xl mx-auto p-4 sm:p-6 rounded-2xl ${theme.cardBg} border ${borderSubtle} shadow-2xl relative my-auto">
            <div class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest ${theme.accentBg} border ${borderSubtle} mb-2">
              <span class="material-symbols-outlined text-[13px]">stars</span>
              <span>PROJECT NATURE • ${escapeHtml(slide.category || "EXECUTIVE MASTERCLASS")}</span>
            </div>
            <h1 class="text-2xl sm:text-4xl font-extrabold ${headingColor} tracking-tight leading-tight my-1 sm:my-2">
              ${escapeHtml(slide.title || "Executive Presentation")}
            </h1>
            <p class="text-xs sm:text-sm ${mutedColor} max-w-xl mx-auto font-normal leading-relaxed">
              ${escapeHtml(slide.subtitle || "Strategic Roadmap & High-Impact Analysis")}
            </p>
          </div>

          <!-- Decorative Center Divider Emblem -->
          <div class="flex items-center justify-center gap-3 my-2 text-xs font-mono font-bold" style="color: ${theme.accent}">
            <span class="w-16 sm:w-28 h-[1px] bg-current opacity-40"></span>
            <span class="text-sm">◎</span>
            <span class="w-16 sm:w-28 h-[1px] bg-current opacity-40"></span>
          </div>

          <!-- 4-Point Structured Metadata Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 w-full max-w-3xl mx-auto my-1 relative z-20">
            <div class="p-2 sm:p-2.5 rounded-xl ${theme.cardBg} border ${borderSubtle} text-left">
              <span class="text-[9px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                <span class="material-symbols-outlined text-[12px]" style="color: ${theme.accent}">person</span>
                Presented By
              </span>
              <div class="text-xs sm:text-sm font-bold ${headingColor} truncate mt-0.5">${escapeHtml(slide.presented_by || presenter)}</div>
              <span class="text-[8.5px] text-neutral-400">Rhynia AI</span>
            </div>
            <div class="p-2 sm:p-2.5 rounded-xl ${theme.cardBg} border ${borderSubtle} text-left">
              <span class="text-[9px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                <span class="material-symbols-outlined text-[12px]" style="color: ${theme.accent}">calendar_today</span>
                Date
              </span>
              <div class="text-xs sm:text-sm font-bold ${headingColor} truncate mt-0.5">${escapeHtml(dateStr)}</div>
              <span class="text-[8.5px] text-neutral-400">Executive Edition</span>
            </div>
            <div class="p-2 sm:p-2.5 rounded-xl ${theme.cardBg} border ${borderSubtle} text-left">
              <span class="text-[9px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                <span class="material-symbols-outlined text-[12px]" style="color: ${theme.accent}">location_on</span>
                Location
              </span>
              <div class="text-xs sm:text-sm font-bold ${headingColor} truncate mt-0.5">${escapeHtml(locStr)}</div>
              <span class="text-[8.5px] text-neutral-400">Corporate HQ</span>
            </div>
            <div class="p-2 sm:p-2.5 rounded-xl ${theme.cardBg} border ${borderSubtle} text-left">
              <span class="text-[9px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                <span class="material-symbols-outlined text-[12px]" style="color: ${theme.accent}">flag</span>
                Goal
              </span>
              <div class="text-xs sm:text-sm font-bold ${headingColor} truncate mt-0.5">${escapeHtml(goalStr)}</div>
              <span class="text-[8.5px] text-neutral-400">Strategic Focus</span>
            </div>
          </div>

          <!-- Bottom Running Tag -->
          <div class="w-full pt-1.5 mt-auto border-t ${borderSubtle} flex items-center justify-between text-[9px] sm:text-[10px] ${mutedColor}">
            <span class="font-mono">Rhynia Intelligence Platform</span>
            <span class="font-mono">CONFIDENTIAL • 2026 EDITION</span>
            <span class="font-mono">16:9 Widescreen</span>
          </div>
        </div>
      `;
    }

    // Header & Footer for all other slides
    const headerHtml = renderRunningHeader(slide, theme);
    const footerHtml = renderRunningFooter(index, total, presenter, theme);

    // Layout 2: Agenda
    if (layout === "agenda") {
      const agendaItems = slide.items || [];
      return `
        <div class="h-full w-full flex flex-col justify-between animate-fade-in relative z-10 ${theme.fontFamily || ''}">
          ${headerHtml}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 overflow-y-auto py-1">
            ${agendaItems.map((item, idx) => `
              <div class="p-3.5 rounded-xl ${theme.cardBg} flex items-start gap-3 border transition-colors hover:border-[#0078D4]/50">
                <div class="w-7 h-7 rounded-lg bg-[#0078D4]/20 border border-[#0078D4]/40 text-[#4cc2ff] font-bold text-xs flex items-center justify-center flex-shrink-0">
                  0${idx + 1}
                </div>
                <div class="min-w-0">
                  <h3 class="text-xs sm:text-sm font-bold text-white truncate">${escapeHtml(item.title || "")}</h3>
                  <p class="text-[11px] sm:text-xs text-neutral-300 mt-0.5 leading-snug">${escapeHtml(item.desc || "")}</p>
                </div>
              </div>
            `).join('')}
          </div>
          ${footerHtml}
        </div>
      `;
    }

    // Layout 3: Cards / KPI
    if (layout === "cards" || layout === "kpi" || layout === "content") {
      const cards = slide.cards || [];
      const colClass = cards.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
      return `
        <div class="h-full w-full flex flex-col justify-between animate-fade-in relative z-10 ${theme.fontFamily || ''}">
          ${headerHtml}
          <div class="grid grid-cols-1 ${colClass} gap-3 sm:gap-4 flex-1 py-1">
            ${cards.map(c => `
              <div class="p-4 sm:p-5 rounded-xl ${theme.cardBg} border flex flex-col justify-between hover:border-[#0078D4]/60 transition-all">
                <div>
                  <span class="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-400 block">${escapeHtml(c.title || "Key Metric")}</span>
                  ${c.stat ? `<div class="text-2xl sm:text-4xl font-extrabold text-[#4cc2ff] my-2 sm:my-3 tracking-tight">${escapeHtml(c.stat)}</div>` : ''}
                </div>
                <p class="text-xs sm:text-sm text-neutral-200 leading-relaxed font-normal">${escapeHtml(c.desc || "")}</p>
              </div>
            `).join('')}
          </div>
          ${footerHtml}
        </div>
      `;
    }

    // Layout 4: Chart (Optimized spacing so chart labels never collide with footer)
    if (layout === "chart" || layout === "graph") {
      const takeaways = slide.takeaways || [];
      const chartCanvasId = `${deckId}-chart-${index}`;
      return `
        <div class="h-full w-full flex flex-col justify-between animate-fade-in relative z-10 ${theme.fontFamily || ''}">
          ${headerHtml}
          <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center min-h-0 my-1">
            <div class="sm:col-span-2 h-[155px] sm:h-[195px] max-h-[200px] w-full relative flex items-center justify-center p-2 rounded-xl bg-black/20 border border-white/5">
              <canvas id="${chartCanvasId}" class="max-h-full max-w-full"></canvas>
            </div>
            <div class="sm:col-span-1 p-3 rounded-xl ${theme.cardBg} border flex flex-col gap-1.5 max-h-[195px] overflow-y-auto">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#4cc2ff] flex items-center gap-1">
                <span class="material-symbols-outlined text-[13px]">lightbulb</span>
                Strategic Takeaways
              </span>
              <ul class="text-xs text-neutral-200 space-y-1">
                ${takeaways.map(t => `
                  <li class="flex items-start gap-1.5">
                    <span class="text-[#0078D4] font-bold text-xs leading-none mt-0.5">✔</span>
                    <span class="leading-snug text-[11px] sm:text-xs">${escapeHtml(t)}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>
          ${footerHtml}
        </div>
      `;
    }

    // Layout 5: Table
    if (layout === "table") {
      const headers = slide.headers || [];
      const rows = slide.rows || [];
      return `
        <div class="h-full w-full flex flex-col animate-fade-in">
          ${headerHtml}
          <div class="flex-1 overflow-x-auto overflow-y-auto rounded-xl border border-white/10 ${theme.cardBg} my-1">
            <table class="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr class="bg-white/10 text-white font-semibold border-b border-white/10">
                  ${headers.map(h => `<th class="px-3.5 py-2 font-bold tracking-wide">${escapeHtml(h)}</th>`).join('')}
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5 text-neutral-200">
                ${rows.map((row, rIdx) => `
                  <tr class="${rIdx % 2 === 1 ? 'bg-white/[0.03]' : ''} hover:bg-white/[0.07] transition-colors">
                    ${row.map(cell => `<td class="px-3.5 py-1.5 leading-relaxed">${escapeHtml(cell)}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ${footerHtml}
        </div>
      `;
    }

    // Layout 6: Process Roadmap
    if (layout === "process" || layout === "timeline") {
      const steps = slide.steps || [];
      return `
        <div class="h-full w-full flex flex-col animate-fade-in">
          ${headerHtml}
          <div class="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 overflow-x-auto py-2 my-1">
            ${steps.map((st, sIdx) => `
              <div class="flex-1 min-w-[130px] p-3 sm:p-3.5 rounded-xl ${theme.cardBg} border flex flex-col justify-between relative group hover:border-[#0078D4] transition-all">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-[#4cc2ff] bg-[#0078D4]/20 px-2 py-0.5 rounded-full border border-[#0078D4]/30">
                      ${escapeHtml(st.phase || `Phase ${sIdx + 1}`)}
                    </span>
                    <span class="w-5 h-5 rounded-full bg-white/10 text-xs flex items-center justify-center font-bold text-white">${sIdx + 1}</span>
                  </div>
                  <h3 class="text-xs sm:text-sm font-bold text-white mb-1">${escapeHtml(st.title || "")}</h3>
                  <p class="text-[11px] text-neutral-300 leading-relaxed">${escapeHtml(st.desc || "")}</p>
                </div>
              </div>
              ${sIdx < steps.length - 1 ? `
                <div class="hidden sm:flex items-center text-neutral-500 flex-shrink-0">
                  <span class="material-symbols-outlined text-[20px] text-[#0078D4]">arrow_forward</span>
                </div>
              ` : ''}
            `).join('')}
          </div>
          ${footerHtml}
        </div>
      `;
    }

    // Layout 7: Split Two-Column Comparison
    if (layout === "split" || layout === "comparison") {
      const leftCol = slide.left_column || { title: "Traditional Approach", points: ["Manual overhead", "High latency"] };
      const rightCol = slide.right_column || { title: "Modern Architecture", points: ["Autonomous intelligence", "Zero latency"] };
      return `
        <div class="h-full w-full flex flex-col animate-fade-in">
          ${headerHtml}
          <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 py-1 my-1">
            <div class="p-4 rounded-xl ${theme.cardBg} border flex flex-col">
              <span class="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[15px]">close</span>
                ${escapeHtml(leftCol.title || "Legacy Framework")}
              </span>
              <ul class="text-xs sm:text-sm text-neutral-300 space-y-2 flex-1 overflow-y-auto">
                ${(leftCol.points || []).map(p => `<li class="flex items-start gap-2"><span class="text-neutral-500">•</span><span>${escapeHtml(p)}</span></li>`).join('')}
              </ul>
            </div>
            <div class="p-4 rounded-xl ${theme.cardBg} border border-[#0078D4]/60 flex flex-col">
              <span class="text-xs font-bold text-[#4cc2ff] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[15px]">check_circle</span>
                ${escapeHtml(rightCol.title || "Modern Architecture")}
              </span>
              <ul class="text-xs sm:text-sm text-white space-y-2 flex-1 overflow-y-auto">
                ${(rightCol.points || []).map(p => `<li class="flex items-start gap-2"><span class="text-[#0078D4] font-bold">✔</span><span>${escapeHtml(p)}</span></li>`).join('')}
              </ul>
            </div>
          </div>
          ${footerHtml}
        </div>
      `;
    }

    // Layout 8: 4-Box Quadrant / Matrix
    if (layout === "matrix" || layout === "quadrant") {
      const quadrants = slide.quadrants || [
        { title: "Drivers", desc: "Core momentum." },
        { title: "Scale", desc: "Enterprise growth." },
        { title: "Security", desc: "Governance." },
        { title: "Milestones", desc: "Target delivery." }
      ];
      return `
        <div class="h-full w-full flex flex-col animate-fade-in">
          ${headerHtml}
          <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 py-1 my-1">
            ${quadrants.map((q, qIdx) => `
              <div class="p-3.5 rounded-xl ${theme.cardBg} border flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="text-xs font-bold text-[#4cc2ff] uppercase tracking-wider">${escapeHtml(q.title || `Quadrant ${qIdx+1}`)}</span>
                    <span class="text-[10px] font-mono text-neutral-400">0${qIdx+1}</span>
                  </div>
                  <p class="text-xs text-neutral-300 leading-relaxed">${escapeHtml(q.desc || "")}</p>
                </div>
              </div>
            `).join('')}
          </div>
          ${footerHtml}
        </div>
      `;
    }

    // Layout 9: Image & Content Showcase
    if (layout === "image_content" || layout === "showcase") {
      const points = slide.points || ["Key observation and insights."];
      const imgUrl = slide.image_url;
      return `
        <div class="h-full w-full flex flex-col animate-fade-in">
          ${headerHtml}
          <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 py-1 items-center my-1">
            <div class="p-4 rounded-xl ${theme.cardBg} border flex flex-col h-full justify-between">
              <span class="text-xs font-bold text-[#4cc2ff] uppercase tracking-wider mb-2">Key Highlights</span>
              <ul class="text-xs sm:text-sm text-neutral-200 space-y-2 flex-1 overflow-y-auto">
                ${points.map(pt => `<li class="flex items-start gap-2"><span class="text-[#0078D4] font-bold">✔</span><span>${escapeHtml(pt)}</span></li>`).join('')}
              </ul>
            </div>
            <div class="h-[180px] sm:h-full max-h-[260px] rounded-xl overflow-hidden border border-white/15 bg-black/40 shadow-xl relative group cursor-pointer" onclick="window.openRhyniaLightbox('${imgUrl || ''}', '${escapeHtml(slide.title)}')">
              ${imgUrl ? `<img src="${imgUrl}" alt="${escapeHtml(slide.title)}" class="w-full h-full object-cover transition-transform group-hover:scale-105" referrerpolicy="no-referrer"/>` : `<div class="flex items-center justify-center h-full text-neutral-500 text-xs">Visual Grounding</div>`}
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <span class="material-symbols-outlined text-white text-[22px] opacity-0 group-hover:opacity-100 transition-opacity drop-shadow">zoom_in</span>
              </div>
            </div>
          </div>
          ${footerHtml}
        </div>
      `;
    }

    // Layout 10: Conclusion
    if (layout === "conclusion") {
      const takeaways = slide.takeaways || [];
      const contact = slide.contact_info || "Rhynia Intelligence • Executive AI";
      return `
        <div class="h-full w-full flex flex-col justify-between animate-fade-in">
          ${headerHtml}
          <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 py-1 items-stretch my-1">
            <div class="sm:col-span-2 p-4 rounded-xl ${theme.cardBg} border flex flex-col justify-between">
              <span class="text-xs font-bold text-[#4cc2ff] uppercase tracking-wider mb-2">Core Strategic Deliverables</span>
              <div class="space-y-2 overflow-y-auto">
                ${takeaways.map(t => `
                  <div class="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-start gap-2.5">
                    <span class="material-symbols-outlined text-[#107c41] text-[16px] flex-shrink-0 mt-0.5">check_circle</span>
                    <p class="text-xs text-neutral-200 leading-relaxed font-medium">${escapeHtml(t)}</p>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="sm:col-span-1 p-4 rounded-xl ${theme.cardBg} border border-[#0078D4]/50 flex flex-col justify-between">
              <div>
                <span class="text-lg font-bold text-white block mb-1">THANK YOU</span>
                <span class="text-xs text-[#4cc2ff] block mb-3">Questions & Discussion</span>
                <p class="text-[11px] text-neutral-300 leading-relaxed">${escapeHtml(contact.replace(/\n/g, ' • '))}</p>
              </div>
              <span class="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded text-center block mt-3">Ready for Delivery</span>
            </div>
          </div>
          ${footerHtml}
        </div>
      `;
    }

    // Default Fallback
    return `
      <div class="h-full w-full flex flex-col animate-fade-in">
        ${headerHtml}
        <div class="p-6 text-neutral-300 text-sm flex-1">${escapeHtml(slide.title)}</div>
        ${footerHtml}
      </div>
    `;
  }

  /**
   * On-the-fly theme switcher
   */
  window.pptViewerChangeTheme = function (deckId, newThemeKey) {
    const deck = window.RhyniaDecks[deckId];
    if (!deck) return;

    deck.data.theme = newThemeKey;
    const theme = THEME_STYLES[newThemeKey] || THEME_STYLES.corporate_azure;
    const wrapper = document.getElementById(deckId);
    if (wrapper) {
      wrapper.className = `rhynia-deck-wrapper my-4 rounded-2xl border ${theme.border} ${theme.bg} shadow-2xl transition-all relative overflow-visible`;
      wrapper.dataset.currentTheme = newThemeKey;
    }

    const stage = document.getElementById(`${deckId}-stage`);
    if (stage) {
      stage.className = `relative z-10 w-full aspect-[16/9] min-h-[320px] max-h-[580px] overflow-hidden flex flex-col justify-between p-3 sm:p-5 ${theme.fontFamily || ''}`;
    }

    // Update active highlight in design popover
    const allCards = document.querySelectorAll(`[data-deck-theme-card="${deckId}"]`);
    allCards.forEach(card => {
      const cardTheme = card.dataset.themeKey;
      if (cardTheme === newThemeKey) {
        card.className = "group flex flex-col rounded-xl overflow-hidden border-2 border-[#0078D4] ring-2 ring-[#0078D4]/40 bg-black/40 text-left transition-all scale-[1.02]";
      } else {
        card.className = "group flex flex-col rounded-xl overflow-hidden border border-white/10 hover:border-white/30 bg-black/40 text-left transition-all hover:scale-[1.02]";
      }
    });

    window.pptViewerGoToSlide(deckId, deck.currentSlideIndex);
  };

  /**
   * Toggle PowerPoint Design Popover Menu
   */
  window.pptViewerToggleDesignMenu = function (deckId, event) {
    if (event) event.stopPropagation();
    const popover = document.getElementById(`${deckId}-design-popover`);
    const dlPopover = document.getElementById(`${deckId}-download-popover`);
    if (dlPopover) dlPopover.classList.add("hidden");
    if (!popover) return;
    popover.classList.toggle("hidden");
  };

  /**
   * Toggle 3-in-1 Download Popover Menu
   */
  window.pptViewerToggleDownloadMenu = function (deckId, event) {
    if (event) event.stopPropagation();
    const popover = document.getElementById(`${deckId}-download-popover`);
    const designPopover = document.getElementById(`${deckId}-design-popover`);
    if (designPopover) designPopover.classList.add("hidden");
    if (!popover) return;
    popover.classList.toggle("hidden");
  };

  /**
   * Select Theme from Design Popover
   */
  window.pptViewerSelectTheme = function (deckId, newThemeKey) {
    window.pptViewerChangeTheme(deckId, newThemeKey);
    const popover = document.getElementById(`${deckId}-design-popover`);
    if (popover) popover.classList.add("hidden");
    if (typeof showToast === "function") {
      const t = THEME_STYLES[newThemeKey];
      showToast(`Design theme set to ${t ? t.label : newThemeKey}`, "info");
    }
  };

  /**
   * Export Presentation Deck in PPTX, PDF, or DOCX format
   */
  window.pptViewerExportDeck = async function (deckId, format) {
    const deck = window.RhyniaDecks[deckId];
    if (!deck) return;

    // Close download popover
    const popover = document.getElementById(`${deckId}-download-popover`);
    if (popover) popover.classList.add("hidden");

    const fmt = (format || "pptx").toLowerCase();
    const formatLabels = {
      pptx: "PowerPoint (.pptx)",
      pdf: "PDF Document (.pdf)",
      docx: "Word Document (.docx)"
    };
    const label = formatLabels[fmt] || fmt.toUpperCase();

    if (typeof showToast === "function") {
      showToast(`Generating ${label}...`, "info");
    }

    try {
      const token = (window.AppState && window.AppState.token) || localStorage.getItem("rhynia_token");
      const headers = {
        "Content-Type": "application/json"
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const payload = {
        format: fmt,
        title: deck.data.title || "Presentation",
        theme: deck.data.theme || "corporate_azure",
        presenter: deck.data.presenter || "Rhynia AI",
        slides: deck.data.slides || []
      };

      const apiBase = (window.CONFIG && window.CONFIG.API_BASE) || "/api/v1";
      const res = await fetch(`${apiBase}/ppt/export`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Export failed with HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const cleanTitle = (deck.data.title || "Presentation").trim().replace(/[/\\?%*:|"<>]/g, "_");
      a.download = `${cleanTitle}.${fmt}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);

      if (typeof showToast === "function") {
        showToast(`${label} downloaded successfully!`, "success");
      }
    } catch (err) {
      console.error("Presentation export error:", err);
      // Fallback if existing download_url exists and format is pptx
      if (fmt === "pptx" && deck.data.download_url && deck.data.download_url !== "#") {
        window.downloadPptxFile(deck.data.download_url, `${deck.data.title || "presentation"}.pptx`);
      } else {
        if (typeof showToast === "function") {
          showToast(`Export failed: ${err.message || "Server error"}`, "error");
        }
      }
    }
  };

  // Close open popovers when clicking anywhere outside
  if (!window._rhyniaDeckClickBound) {
    window._rhyniaDeckClickBound = true;
    document.addEventListener("click", function (e) {
      const popovers = document.querySelectorAll("[id$='-design-popover'], [id$='-download-popover']");
      popovers.forEach(p => {
        if (!p.contains(e.target) && !e.target.closest("[id$='-design-btn']") && !e.target.closest("[id$='-download-btn']")) {
          p.classList.add("hidden");
        }
      });
    });
  }

  /**
   * Switch to next slide
   */
  window.pptViewerNextSlide = function (deckId) {
    const deck = window.RhyniaDecks[deckId];
    if (!deck) return;
    if (deck.currentSlideIndex < deck.data.slides.length - 1) {
      window.pptViewerGoToSlide(deckId, deck.currentSlideIndex + 1);
    }
  };

  /**
   * Switch to prev slide
   */
  window.pptViewerPrevSlide = function (deckId) {
    const deck = window.RhyniaDecks[deckId];
    if (!deck) return;
    if (deck.currentSlideIndex > 0) {
      window.pptViewerGoToSlide(deckId, deck.currentSlideIndex - 1);
    }
  };

  /**
   * Go to specific slide index
   */
  window.pptViewerGoToSlide = function (deckId, targetIndex) {
    const deck = window.RhyniaDecks[deckId];
    if (!deck || !deck.data.slides[targetIndex]) return;

    deck.currentSlideIndex = targetIndex;
    const total = deck.data.slides.length;
    const themeKey = deck.data.theme || "executive_dark";
    const theme = THEME_STYLES[themeKey] || THEME_STYLES.executive_dark;

    // Update Counter
    const counterEl = document.getElementById(`${deckId}-counter`);
    if (counterEl) counterEl.textContent = `${targetIndex + 1} / ${total}`;

    // Update Buttons state
    const prevBtn = document.getElementById(`${deckId}-prev-btn`);
    const nextBtn = document.getElementById(`${deckId}-next-btn`);
    if (prevBtn) prevBtn.disabled = targetIndex === 0;
    if (nextBtn) nextBtn.disabled = targetIndex === total - 1;

    // Update Dots
    for (let i = 0; i < total; i++) {
      const dot = document.getElementById(`${deckId}-dot-${i}`);
      if (dot) {
        if (i === targetIndex) {
          dot.className = "w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono transition-all bg-[#0078D4] text-white font-bold shadow";
        } else {
          dot.className = "w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono transition-all bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white";
        }
      }
    }

    // Render Slide in Stage with Artwork Layer
    const stage = document.getElementById(`${deckId}-stage`);
    if (stage) {
      stage.innerHTML = renderThemeBackgroundArtwork(theme) + renderSlideContent(deck.data.slides[targetIndex], targetIndex, total, deckId, theme, deck.data);
      
      // If this slide is a chart, initialize Chart.js
      if (deck.data.slides[targetIndex].layout === "chart") {
        setTimeout(() => {
          initSlideChart(deckId, targetIndex, deck.data.slides[targetIndex]);
        }, 50);
      }
    }

    // If Fullscreen is open, update fullscreen stage too
    const fsStage = document.getElementById("rhynia-presentation-fs-stage");
    if (fsStage && !document.getElementById("rhynia-presentation-fs-modal").classList.contains("hidden")) {
      fsStage.className = `w-full max-w-6xl aspect-[16/9] rounded-2xl ${theme.bg} border ${theme.border} shadow-2xl p-4 sm:p-8 overflow-hidden flex flex-col justify-between relative ${theme.fontFamily || ''}`;
      fsStage.innerHTML = renderThemeBackgroundArtwork(theme) + renderSlideContent(deck.data.slides[targetIndex], targetIndex, total, deckId, theme, deck.data);
      if (deck.data.slides[targetIndex].layout === "chart") {
        setTimeout(() => {
          initSlideChart(deckId, targetIndex, deck.data.slides[targetIndex]);
        }, 50);
      }
      const fsCounter = document.getElementById("rhynia-fs-counter");
      if (fsCounter) fsCounter.textContent = `${targetIndex + 1} / ${total}`;
    }
  };

  /**
   * Initializes Chart.js on chart slides
   */
  function initSlideChart(deckId, slideIndex, slideData) {
    if (typeof Chart === "undefined") return;

    const canvasId = `${deckId}-chart-${slideIndex}`;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const deck = window.RhyniaDecks[deckId];
    if (deck && deck.chartInstances[canvasId]) {
      deck.chartInstances[canvasId].destroy();
      delete deck.chartInstances[canvasId];
    }

    const chartType = (slideData.chart_type || "column").toLowerCase();
    const categories = slideData.categories || ["2023", "2024", "2025", "2026"];
    const series = slideData.series || [{ name: "Value", values: [30, 50, 75, 100] }];

    let jsChartType = "bar";
    let indexAxis = "x";
    if (chartType === "bar") {
      jsChartType = "bar";
      indexAxis = "y";
    } else if (chartType === "pie" || chartType === "donut") {
      jsChartType = "pie";
    } else if (chartType === "line") {
      jsChartType = "line";
    }

    const palette = [
      "#0078D4", "#00a4ef", "#4cc2ff", "#107c41", "#ffb900", "#d83b01", "#b4009e"
    ];

    const datasets = series.map((s, idx) => {
      const color = palette[idx % palette.length];
      return {
        label: s.name || `Series ${idx + 1}`,
        data: s.values || [],
        backgroundColor: jsChartType === "pie" ? palette : color + "cc",
        borderColor: color,
        borderWidth: 2,
        borderRadius: jsChartType === "bar" ? 4 : 0,
        fill: jsChartType === "line" ? { target: 'origin', above: color + '22' } : false,
        tension: 0.35,
      };
    });

    const config = {
      type: jsChartType,
      data: {
        labels: categories,
        datasets: datasets,
      },
      options: {
        indexAxis: indexAxis,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: series.length > 1 || jsChartType === "pie",
            labels: { color: "#e5e2e1", font: { size: 11, family: "Segoe UI" } }
          },
          tooltip: {
            backgroundColor: "#1f1f1f",
            titleColor: "#ffffff",
            bodyColor: "#e5e2e1",
            borderColor: "rgba(255,255,255,0.15)",
            borderWidth: 1,
            cornerRadius: 8,
            padding: 8
          }
        },
        scales: jsChartType === "pie" ? {} : {
          x: {
            ticks: { color: "#a0aab8", font: { size: 10 } },
            grid: { color: "rgba(255,255,255,0.06)" }
          },
          y: {
            ticks: { color: "#a0aab8", font: { size: 10 } },
            grid: { color: "rgba(255,255,255,0.06)" }
          }
        }
      }
    };

    const newChart = new Chart(canvas, config);
    if (deck) {
      deck.chartInstances[canvasId] = newChart;
    }
  }

  /**
   * 1-Click PPTX File Download
   */
  window.downloadPptxFile = async function (downloadUrl, filename) {
    if (!downloadUrl || downloadUrl === "#") {
      if (typeof showToast === "function") showToast("Download URL not available", "error");
      return;
    }

    try {
      if (typeof showToast === "function") showToast("Downloading presentation...", "info");
      const token = (window.AppState && window.AppState.token) || localStorage.getItem("rhynia_token");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};

      const res = await fetch(downloadUrl, { headers });
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename.endsWith(".pptx") ? filename : `${filename}.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);

      if (typeof showToast === "function") showToast("PowerPoint (.pptx) downloaded successfully!", "success");
    } catch (e) {
      console.warn("Blob download failed, using direct anchor fallback:", e);
      window.open(downloadUrl, "_blank");
    }
  };

  /**
   * Fullscreen Presentation Mode
   */
  let activeFsDeckId = null;

  window.openPresentationFullScreen = function (deckId) {
    const deck = window.RhyniaDecks[deckId];
    if (!deck) return;

    activeFsDeckId = deckId;
    let modal = document.getElementById("rhynia-presentation-fs-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "rhynia-presentation-fs-modal";
      modal.className = "fixed inset-0 z-[9999] bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-8 animate-fade-in";
      modal.innerHTML = `
        <!-- Fullscreen Top Bar -->
        <div class="flex items-center justify-between text-white pb-3 border-b border-white/10">
          <div class="flex items-center gap-3">
            <span class="w-8 h-8 rounded-lg bg-[#0078D4]/20 border border-[#0078D4]/40 flex items-center justify-center text-[#4cc2ff]">
              <span class="material-symbols-outlined text-[20px]">co_present</span>
            </span>
            <span id="rhynia-fs-title" class="font-bold text-sm sm:text-base">Presentation Mode</span>
          </div>
          <div class="flex items-center gap-3">
            <span id="rhynia-fs-counter" class="font-mono text-xs sm:text-sm text-neutral-300 bg-white/10 px-3 py-1 rounded-full"></span>
            <button type="button" onclick="closePresentationFullScreen()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all" title="Exit Fullscreen (Escape)">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        <!-- Fullscreen Slide Stage -->
        <div class="flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden">
          <div id="rhynia-presentation-fs-stage" class="w-full max-w-6xl aspect-[16/9] rounded-2xl bg-[#0b0e14] border border-cyan-900/40 shadow-2xl p-4 sm:p-8 overflow-hidden flex flex-col justify-between"></div>
        </div>

        <!-- Fullscreen Bottom Floating Controls -->
        <div class="flex items-center justify-center gap-4 pt-3 border-t border-white/10">
          <button type="button" onclick="pptViewerPrevSlide(activeFsDeckId)" class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all">
            <span class="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Previous</span>
          </button>
          <span class="text-xs text-neutral-400 font-mono hidden sm:inline">Use Arrow Keys (◀ / ▶) or Space to Navigate</span>
          <button type="button" onclick="pptViewerNextSlide(activeFsDeckId)" class="px-4 py-2 rounded-xl bg-[#0078D4] hover:bg-[#1084d9] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-[#0078D4]/30">
            <span>Next</span>
            <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      `;
      document.body.appendChild(modal);
    }

    modal.classList.remove("hidden");
    const titleEl = document.getElementById("rhynia-fs-title");
    if (titleEl) titleEl.textContent = deck.data.title || "Presentation";

    window.pptViewerGoToSlide(deckId, deck.currentSlideIndex);

    window.addEventListener("keydown", handlePresentationKeyDown);
  };

  window.closePresentationFullScreen = function () {
    const modal = document.getElementById("rhynia-presentation-fs-modal");
    if (modal) modal.classList.add("hidden");
    activeFsDeckId = null;
    window.removeEventListener("keydown", handlePresentationKeyDown);
  };

  function handlePresentationKeyDown(e) {
    if (!activeFsDeckId) return;
    if (e.key === "Escape") {
      window.closePresentationFullScreen();
    } else if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
      window.pptViewerNextSlide(activeFsDeckId);
    } else if (e.key === "ArrowLeft") {
      window.pptViewerPrevSlide(activeFsDeckId);
    }
  }

})();
