const CONFIG = {
  OLLAMA_BASE_URL: "http://localhost:11434",
  OLLAMA_MODEL: "qwen3.5",
  GARMIN_BASE: "https://connect.garmin.com/gc-api",
};

let apiEndpoints = null;
let chatMessages = [
  {
    role: "system",
    content:
      "Tu es un coach Garmin personnel. Tu aides l'utilisateur à analyser ses activités Garmin. IMPORTANT: Tu as déjà accès à l'identifiant UUID de l'utilisateur et à tous les outils/API disponibles. Tu dois appeler directement les outils nécessaires avec les bons arguments, sans jamais demander l'UUID à l'utilisateur, tu l'as déjà. Utilise-le automatiquement pour les appels API.",
  },
];

let userUuid = null;

function injectScriptToGetUUID() {
  const script = document.createElement("script");
  script.textContent = `
    window.postMessage({ type: 'GARMIN_AGENT_UUID', uuid: window?.VIEWER_USERPREFERENCES?.displayName || null }, '*');
  `;
  document.documentElement.appendChild(script);
  script.remove();
}

window.addEventListener("message", (event) => {
  if (event.source !== window || event.data.type !== "GARMIN_AGENT_UUID")
    return;
  userUuid = event.data.uuid;
  console.log("Garmin Peak - UUID captured:", userUuid);
});

(async () => {
  try {
    const src = chrome.runtime.getURL("endpoints.js");
    const module = await import(src);
    apiEndpoints = module.api;
    console.log("Garmin Peak - Endpoints loaded:", apiEndpoints !== null);
    injectScriptToGetUUID();
  } catch (err) {
    console.error("Garmin Peak - Failed to load endpoints:", err);
  }
})();

function formatTime(seconds, showSeconds = false) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (showSeconds) return `${h}h ${m}m ${s}s`;
  return `${h}h ${m}m`;
}

async function garminFetch(url) {
  try {
    const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
    const headers = {
      accept: "application/json, text/plain, */*",
      nk: "NT",
      "x-app-ver": window.URL_BUST_VALUE || "",
      "x-lang": "fr-FR",
      "x-requested-with": "XMLHttpRequest",
      ...(csrf && { "connect-csrf-token": csrf }),
    };

    const resp = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers,
    });

    if (!resp.ok) {
      console.error("API Error", `HTTP ${resp.status} on ${url}`);
      return null;
    }

    return await resp.json();
  } catch (e) {
    console.error("API Exception", `Fetch for ${url}: ${e.message}`);
    return null;
  }
}

function getAvailableTools() {
  if (!apiEndpoints) return [];
  return Object.entries(apiEndpoints).map(([name, config]) => {
    const properties = {};
    const required = [];

    if (config.params) {
      for (const [k, v] of Object.entries(config.params)) {
        properties[k] = {
          type: typeof v.type === "string" ? "string" : v.type,
          description: v.description,
        };
        required.push(k);
      }
    }

    if (config.query) {
      for (const [k, v] of Object.entries(config.query)) {
        properties[k] = { type: "string", description: v.description };
        if (v.required) required.push(k);
      }
    }

    return {
      type: "function",
      function: {
        name: name,
        description: config.description,
        parameters: {
          type: "object",
          properties: properties,
          required: required,
        },
      },
    };
  });
}

function displayMessage(role, text) {
  const messagesContainer = document.getElementById("llm-messages");
  if (!messagesContainer) return;
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("llm-message", role);

  const cleanText =
    role === "assistant"
      ? text.replace(/<think>[\s\S]*?<\/think>\s*/gi, "").trim()
      : text;

  if (cleanText) {
    msgDiv.textContent = cleanText;
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

function updateLoadingState(isLoading) {
  const sendBtn = document.getElementById("llm-send");
  const inputEl = document.getElementById("llm-input");
  if (sendBtn) {
    sendBtn.disabled = isLoading;
    if (isLoading) {
      sendBtn.textContent = "...";
      sendBtn.classList.add("loading");
    } else {
      sendBtn.textContent = "Envoyer";
      sendBtn.classList.remove("loading");
    }
  }
  if (inputEl) inputEl.disabled = isLoading;
}

async function sendToOllama() {
  const tools = getAvailableTools();
  try {
    const response = await fetch(`${CONFIG.OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: CONFIG.OLLAMA_MODEL,
        messages: chatMessages,
        tools: tools.length > 0 ? tools : undefined,
        stream: false,
      }),
    });
    if (!response.ok) throw new Error("HTTP error " + response.status);
    return await response.json();
  } catch (error) {
    console.error("Erreur communication Ollama", error);
    return null;
  }
}

async function handleToolCalls(toolCalls) {
  for (const toolCall of toolCalls) {
    const { name: funcName, arguments: rawArgs } = toolCall.function;
    console.log(`Garmin Peak - Tool call received: ${funcName}`, rawArgs);

    let args = {};
    try {
      args =
        typeof rawArgs === "string" ? JSON.parse(rawArgs || "{}") : rawArgs;
    } catch (e) {
      console.error("Garmin Peak - Error parsing tool arguments", e, rawArgs);
    }

    const endpointConfig = apiEndpoints[funcName];
    if (!endpointConfig) {
      chatMessages.push({
        role: "tool",
        content: JSON.stringify({
          error: "Outil/Endpoint non trouvé dans endpoints.js",
        }),
        name: funcName,
      });
      continue;
    }

    let url = endpointConfig.url;
    if (endpointConfig.params) {
      for (const k of Object.keys(endpointConfig.params)) {
        let val = args[k] || (k === "uuid" ? userUuid : null);
        if (val) {
          url = url.replace(`{${k}}`, encodeURIComponent(val));
        }
      }
    }

    const urlObj = new URL(url);
    if (endpointConfig.query) {
      for (const k of Object.keys(endpointConfig.query)) {
        let val = args[k];
        if (val !== undefined && val !== null) {
          urlObj.searchParams.append(k, val);
        }
      }
    }

    displayMessage("assistant", `Récupération en cours: ${funcName}...`);
    console.log(`Garmin Peak - Fetching ${urlObj.toString()}`);

    const data = await garminFetch(urlObj.toString());

    if (data) {
      console.log(
        `Garmin Peak - Data fetched for ${funcName} (${JSON.stringify(data).length} bytes)`,
      );
    } else {
      console.log(`Garmin Peak - Failed to fetch data for ${funcName}`);
    }

    chatMessages.push({
      role: "tool",
      content: JSON.stringify(
        data || { error: "Failed to fetch data or empty response" },
      ),
      name: funcName,
    });
  }
}

async function onSendMessage(text) {
  if (!text.trim()) return;
  displayMessage("user", text);
  chatMessages.push({ role: "user", content: text });

  updateLoadingState(true);

  try {
    let isDone = false;
    let maxLoops = 5;
    let currentLoop = 0;

    while (!isDone && currentLoop < maxLoops) {
      currentLoop++;
      console.log(`Garmin Peak - Loop ${currentLoop} thinking...`);
      const responseData = await sendToOllama();

      if (!responseData || !responseData.message) {
        displayMessage(
          "assistant",
          "⚠Erreur de communication avec l'API locale (Ollama).",
        );
        break;
      }

      const msg = responseData.message;
      chatMessages.push(msg);

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        await handleToolCalls(msg.tool_calls);
      } else {
        isDone = true;
        if (msg.content) {
          displayMessage("assistant", msg.content);
        }
      }
    }

    if (currentLoop >= maxLoops && !isDone) {
      displayMessage(
        "assistant",
        "Trop d'appels récursifs, j'ai dû m'arrêter.",
      );
    }
  } catch (err) {
    console.error("Garmin Peak - Agent loop error:", err);
    displayMessage(
      "assistant",
      "Une erreur critique s'est produite lors du traitement.",
    );
  } finally {
    updateLoadingState(false);
  }
}

function addMyDiv() {
  const column = document.querySelector(".TwoColumnWideLeft-columnTwo-area");
  if (!column) return;
  if (document.querySelector(".llm-chat-container")) return;

  const chatContainer = document.createElement("div");
  chatContainer.classList.add("llm-chat-container");

  chatContainer.innerHTML = `
    <div class="llm-chat-header">Garmin Peak</div>
    <div class="llm-chat-messages" id="llm-messages">
      <div class="llm-message assistant">Bonjour ! Je suis ton coach IA. Comment puis-je t'aider avec tes données de santé ou tes activités aujourd'hui ?</div>
    </div>
    <div class="llm-chat-input-area">
      <input type="text" id="llm-input" placeholder="Ex: 'Résumé de ma journée' ou 'Dernières activités'..." />
      <button id="llm-send">Envoyer</button>
    </div>
  `;

  column.prepend(chatContainer);

  const inputEl = document.getElementById("llm-input");
  const sendBtn = document.getElementById("llm-send");

  const submit = () => {
    const text = inputEl.value;
    inputEl.value = "";
    onSendMessage(text);
  };

  sendBtn.addEventListener("click", submit);
  inputEl.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !sendBtn.disabled) submit();
  });
}

const style = document.createElement("style");
style.textContent = `
  .llm-chat-container {
    width: 100%;
    background-color: var(--bg-card, #ffffff);
    border: 1px solid var(--stroke-container, #e0e0e0);
    border-radius: 8px;
    box-shadow: var(--shadow-sm, 0 4px 6px rgba(0,0,0,0.05));
    display: flex;
    flex-direction: column;
    margin-bottom: 24px;
    height: 500px;
    font-family: inherit;
    color: var(--text-primary, #1a1a1a);
  }
  .llm-chat-header {
    padding: 14px 18px;
    font-weight: 600;
    font-size: 16px;
    border-bottom: 1px solid var(--stroke-container, #e0e0e0);
    background-color: var(--bg-component, #f7f9fa);
    border-radius: 8px 8px 0 0;
    color: #007bc1;
  }
  .llm-chat-messages {
    flex: auto;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    background-color: var(--bg-main, #ffffff);
  }
  .llm-message {
    padding: 10px 14px;
    border-radius: 12px;
    max-width: 85%;
    word-wrap: break-word;
    font-size: 14px;
    line-height: 1.5;
    white-space: pre-wrap;
  }
  .llm-message.user {
    background-color: #007bc1;
    color: #ffffff;
    align-self: flex-end;
    border-bottom-right-radius: 2px;
  }
  .llm-message.assistant {
    background-color: #f0f4f8;
    color: #333333;
    align-self: flex-start;
    border-bottom-left-radius: 2px;
    border: 1px solid #e1e8ed;
  }
  .llm-chat-input-area {
    display: flex;
    padding: 12px 16px;
    border-top: 1px solid var(--stroke-container, #e0e0e0);
    background-color: var(--bg-component, #ffffff);
    border-radius: 0 0 8px 8px;
  }
  .llm-chat-input-area input {
    flex: 1;
    padding: 12px 14px;
    border: 1px solid #ccd6dd;
    border-radius: 6px;
    margin-right: 12px;
    outline: none;
    font-size: 14px;
    color: #1a1a1a;
    transition: border-color 0.2s;
  }
  .llm-chat-input-area input:focus {
    border-color: #007bc1;
  }
  .llm-chat-input-area button {
    padding: 10px 20px;
    background-color: #007bc1;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: background-color 0.2s, opacity 0.2s;
  }
  .llm-chat-input-area button:hover {
    background-color: #005f9e;
  }
  .llm-chat-input-area button.loading {
    background-color: #a0cce3;
    cursor: not-allowed;
    opacity: 0.8;
  }`;

document.head.appendChild(style);

let lastUrl = location.href;

const domObserver = new MutationObserver(() => {
  if (location.href.startsWith("https://connect.garmin.com/app/home")) {
    addMyDiv();
  }
});

domObserver.observe(document.body, { childList: true, subtree: true });

setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    if (lastUrl.startsWith("https://connect.garmin.com/app/home")) {
      addMyDiv();
    }
  }
}, 500);
