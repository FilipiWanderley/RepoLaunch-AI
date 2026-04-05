const tabs = document.querySelectorAll(".tab");
const screens = document.querySelectorAll(".screen");
const langButtons = document.querySelectorAll(".lang-btn");

const i18n = {
  pt: {
    "hero.tag": "MVP PREVIEW",
    "hero.title": "RepoLaunch AI",
    "hero.subtitle": "Transforme aprendizado em projetos reais prontos para GitHub",
    "stats.mode": "Modo ativo",
    "stats.files": "Arquivos gerados",
    "stats.status": "Status",
    "stats.running": "running",
    "panel.title": "Telas do MVP",
    "tabs.overview": "Overview",
    "tabs.analyze": "Analyze",
    "tabs.generate": "Generate",
    "tabs.outputs": "Outputs",
    "tabs.security": "Security",
    "overview.title": "Visão geral do produto",
    "overview.desc": "O fluxo abaixo representa o coração do MVP já implementado na CLI:",
    "analyze.title": "Tela de análise",
    "analyze.desc": "Recebe texto, arquivo ou pasta e extrai intenção, contexto e tema.",
    "analyze.inputLabel": "Input do usuário",
    "analyze.chipTheme": "tema: IA aplicada",
    "analyze.chipIntent": "intenção: visibilidade profissional",
    "analyze.chipRisk": "risco: input seguro",
    "generate.title": "Tela de geração",
    "generate.desc": "Modo recruiter selecionado com geração dos documentos core.",
    "outputs.title": "Preview de outputs gerados",
    "outputs.desc": "Carregado automaticamente da pasta outputs.",
    "outputs.loading": "Carregando...",
    "outputs.loadError": "Nao foi possivel carregar este arquivo. Rode novamente o comando generate.",
    "security.title": "Tela de segurança",
    "security.desc": "Controles ativos no MVP:",
    "security.item1": "Normalização e bloqueio de padrões de prompt injection.",
    "security.item2": "Separação entre system prompt e user input.",
    "security.item3": "Bloqueio de comandos potencialmente perigosos.",
    "security.aiTitle": "Resiliência de IA",
    "security.item4": "Timeout, retry e fallback entre providers."
  },
  en: {
    "hero.tag": "MVP PREVIEW",
    "hero.title": "RepoLaunch AI",
    "hero.subtitle": "Turn learning into real projects ready for GitHub",
    "stats.mode": "Active mode",
    "stats.files": "Generated files",
    "stats.status": "Status",
    "stats.running": "running",
    "panel.title": "MVP Screens",
    "tabs.overview": "Overview",
    "tabs.analyze": "Analyze",
    "tabs.generate": "Generate",
    "tabs.outputs": "Outputs",
    "tabs.security": "Security",
    "overview.title": "Product overview",
    "overview.desc": "The flow below represents the core MVP already implemented in the CLI:",
    "analyze.title": "Analyze screen",
    "analyze.desc": "Receives text, file or folder and extracts intent, context and theme.",
    "analyze.inputLabel": "User input",
    "analyze.chipTheme": "theme: Applied AI",
    "analyze.chipIntent": "intent: professional visibility",
    "analyze.chipRisk": "risk: secure input",
    "generate.title": "Generate screen",
    "generate.desc": "Recruiter mode selected with generation of core documents.",
    "outputs.title": "Generated outputs preview",
    "outputs.desc": "Automatically loaded from the outputs folder.",
    "outputs.loading": "Loading...",
    "outputs.loadError": "Could not load this file. Run the generate command again.",
    "security.title": "Security screen",
    "security.desc": "Active controls in the MVP:",
    "security.item1": "Normalization and blocking of prompt injection patterns.",
    "security.item2": "Separation between system prompt and user input.",
    "security.item3": "Blocking potentially dangerous commands.",
    "security.aiTitle": "AI resilience",
    "security.item4": "Timeout, retry and fallback across providers."
  }
};

let currentLang = "pt";

function activateScreen(screenName) {
  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.screen === screenName);
  });

  screens.forEach((screen) => {
    screen.classList.toggle("active", screen.id === `screen-${screenName}`);
  });
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => activateScreen(tab.dataset.screen));
});

function applyTranslations(lang) {
  currentLang = lang;

  document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    const value = i18n[lang]?.[key];
    if (value) {
      element.textContent = value;
    }
  });

  langButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === lang);
  });
}

langButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const lang = button.dataset.lang;
    if (!lang) {
      return;
    }
    applyTranslations(lang);
  });
});

async function loadFile(path, targetId) {
  const target = document.getElementById(targetId);
  if (!target) {
    return;
  }

  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error("arquivo nao encontrado");
    }
    const text = await response.text();
    target.textContent = text.slice(0, 1500);
  } catch {
    target.textContent = i18n[currentLang]["outputs.loadError"];
  }
}

async function hydrateStats() {
  try {
    const response = await fetch("/outputs/export-manifest.json");
    if (!response.ok) {
      return;
    }

    const data = await response.json();
    const files = Array.isArray(data.files) ? data.files : [];
    const countEl = document.getElementById("files-count");
    if (countEl) {
      countEl.textContent = String(files.length);
    }
  } catch {
    // fallback silencioso para nao quebrar a tela
  }
}

loadFile("/outputs/README.md", "out-readme");
loadFile("/outputs/ROADMAP.md", "out-roadmap");
hydrateStats();
applyTranslations("pt");
