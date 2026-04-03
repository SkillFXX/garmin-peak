const CONFIG = {
  OLLAMA_BASE_URL: "http://localhost:11434",
  OLLAMA_MODEL: "gemma4:latest",
  GARMIN_BASE: "https://connect.garmin.com/gc-api",
};

let apiEndpoints = null;
let chatMessages = [
  {
    role: "system",
    content: `You are a professional Garmin performance coach and data analyst. Your role is to help the user understand, analyze, and improve their sports performance using Garmin activity data. You operate in a strict tool-first workflow. Current date: ${new Date().toISOString().split("T")[0]} All tool outputs use: - Time → seconds - Distance → meters - Speed → meters/second You MUST convert all values into human-friendly units: - Time → hh:mm:ss - Distance → kilometers (km) - Speed → km/h - Pace (if relevant) → min/km Round values appropriately for readability. Don't just repeat the data you're analyzing; summarize it and analyze it. Respond mainly with short, concise sentences unless asked otherwise.`,
  },
];

function formatAssistantMarkdown(rawText) {
  let escaped = rawText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  escaped = escaped.replace(/^---$/gm, "<hr />");
  escaped = escaped
    .replace(/^######\s+(.*)$/gm, "<h6>$1</h6>")
    .replace(/^#####\s+(.*)$/gm, "<h5>$1</h5>")
    .replace(/^####\s+(.*)$/gm, "<h4>$1</h4>")
    .replace(/^###\s+(.*)$/gm, "<h3>$1</h3>")
    .replace(/^##\s+(.*)$/gm, "<h2>$1</h2>")
    .replace(/^#\s+(.*)$/gm, "<h1>$1</h1>");
  escaped = escaped.replace(/^>\s?(.*)$/gm, "<blockquote>$1</blockquote>");
  escaped = escaped.replace(/`([^`]+)`/g, "<code>$1</code>");
  escaped = escaped
    .replace(/\*\*(.+?)\*\*/g, '<span class="llm-bold">$1</span>')
    .replace(/__(.+?)__/g, '<span class="llm-bold">$1</span>')
    .replace(/==(.+?)==/g, '<span class="llm-underline">$1</span>')
    .replace(/~~(.+?)~~/g, '<span class="llm-strikethrough">$1</span>');
  escaped = escaped.replace(/\n/g, "<br>");
  return escaped;
}

(async () => {
  try {
    const src = chrome.runtime.getURL("endpoints.js");
    const module = await import(src);
    apiEndpoints = module.api;
    console.log("Garmin Peak - Endpoints loaded:", apiEndpoints !== null);
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

  if (!cleanText) return;

  if (role === "assistant") {
    msgDiv.innerHTML = formatAssistantMarkdown(cleanText);
  } else {
    msgDiv.textContent = cleanText;
  }

  messagesContainer.appendChild(msgDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
      sendBtn.textContent = "Send";
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
    const { id: callId } = toolCall;
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
        tool_call_id: callId,
        name: funcName,
        content: JSON.stringify({ error: "Tool/Endpoint not found" }),
      });
      continue;
    }

    let finalUrl = endpointConfig.url;

    if (endpointConfig.params) {
      for (const paramKey of Object.keys(endpointConfig.params)) {
        if (args[paramKey] !== undefined) {
          finalUrl = finalUrl.replace(`{${paramKey}}`, args[paramKey]);
        }
      }
    }

    const urlObj = new URL(finalUrl);
    if (endpointConfig.query) {
      for (const queryKey of Object.keys(endpointConfig.query)) {
        const val = args[queryKey];
        if (
          val !== undefined &&
          val !== null &&
          !endpointConfig.url.includes(`{${queryKey}}`)
        ) {
          urlObj.searchParams.append(queryKey, val);
        }
      }
    }

    displayMessage("assistant", `Data Recovery : ${funcName}...`);

    const targetUrl = urlObj.toString();
    console.log(`Garmin Peak - Fetching: ${targetUrl}`);

    const data = await garminFetch(targetUrl);

    console.log(endpointConfig.ignore);

    const ignore = endpointConfig.ignore || [];

    const stack = [data];

    while (stack.length) {
      const obj = stack.pop();
      if (!obj || typeof obj !== "object") continue;

      for (const key in obj) {
        if (ignore.includes(key)) {
          delete obj[key];
        } else {
          stack.push(obj[key]);
        }
      }
    }

    const toolResponse = data
      ? JSON.stringify(data)
      : JSON.stringify({ error: "No data or empty response" });

    chatMessages.push({
      role: "tool",
      tool_call_id: callId,
      name: funcName,
      content: toolResponse,
    });

    console.log(`Garmin Peak - Tool ${funcName} processed.`);
    console.log(`Garmin Peak - Tool response:`, toolResponse);
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
          "Communication error with the local API (Ollama).",
        );
        break;
      }

      const msg = responseData.message;
      chatMessages.push(msg);

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        if (msg.content && msg.content.trim()) {
          displayMessage("assistant", msg.content);
        }
        await handleToolCalls(msg.tool_calls);
      } else {
        isDone = true;
        if (msg.content) {
          displayMessage("assistant", msg.content);
        }
      }
    }

    if (currentLoop >= maxLoops && !isDone) {
      displayMessage("assistant", "Too many recursive calls, I had to stop.");
    }
  } catch (err) {
    console.error("Garmin Peak - Agent loop error:", err);
    displayMessage("assistant", "A critical error occurred during processing.");
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
      <div class="llm-message assistant">Hello! I'm your AI coach. How can I help you with your health data or activities today?</div>
    </div>
    <div class="llm-chat-input-area">
      <input type="text" id="llm-input" placeholder="Ex: 'Summary of my day' or 'Latest activities'..." />
      <button id="llm-send">Send</button>
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

  .llm-message.assistant code,
  .llm-message.assistant pre {
    font-family: "Courier New", Courier, monospace;
  }
  .llm-message.assistant h1,
  .llm-message.assistant h2,
  .llm-message.assistant h3,
  .llm-message.assistant h4,
  .llm-message.assistant h5,
  .llm-message.assistant h6,
  .llm-message.assistant blockquote,
  .llm-message.assistant hr 
  .llm-message.assistant p,
  .llm-message.assistant ul,
  .llm-message.assistant ol,
  .llm-message.assistant code,
  .llm-message.assistant pre {
    margin: 0 0 0.5em 0;
  }
  .llm-bold {
    font-weight: 700;
  }
  .llm-underline {
    text-decoration: underline;
  }
  .llm-strikethrough {
    text-decoration: line-through;
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
