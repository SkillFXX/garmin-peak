import { formatAssistantMarkdown } from "./utils.js";

export function injectStyles() {
  if (document.getElementById("llm-chat-styles")) return;
  const style = document.createElement("style");
  style.id = "llm-chat-styles";
  style.textContent = `
.llm-chat-container {
  width: 100%;
  background-color: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--stroke-container, #e0e0e0);
  border-radius: 10px;
  box-shadow: var(--shadow-sm, 0 4px 6px rgba(0, 0, 0, 0.05));
  display: flex;
  flex-direction: column;
  margin-bottom: 24px;
  height: 500px;
  font-family: inherit;
  color: var(--text-primary, #1a1a1a);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  overflow: hidden;
}

.llm-chat-header {
  padding: 14px 18px;
  font-weight: 600;
  font-size: 16px;
  border-bottom: 1px solid var(--stroke-container, #e0e0e0);
  background-color: rgba(247, 249, 250, 0.85);
  border-radius: 10px 10px 0 0;
  color: #007bc1;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
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
  opacity: 0;
  transform: translateY(6px);
  animation: llmMessageIn 0.25s ease-out forwards;
}

@keyframes llmMessageIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.llm-message.user {
  background-color: #007bc1;
  color: #ffffff;
  align-self: flex-end;
  border-bottom-right-radius: 3px;
}

/* Corrected Assistant Bubble with Gold Premium Touch */
.llm-message.assistant {
  background-color: #f0f4f8;
  color: #333333;
  align-self: flex-start;
  border-bottom-left-radius: 3px;
  
  /* Touche Premium : Bordure fine grise + accent doré à gauche */
  border: 1px solid #e1e8ed;
  border-left: 4px solid #d4af37; 
  
  /* Fix du bug d'animation : fusion des effets d'entrée et de flou */
  animation: llmAssistantIn 0.35s ease-out forwards;
}

/* Nouvelle animation propre pour l'assistant */
@keyframes llmAssistantIn {
  from {
    opacity: 0;
    transform: translateY(6px);
    filter: blur(3px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

.llm-message.assistant code {
  font-family: "Courier New", Courier, monospace;
}

.llm-message.assistant h1,
.llm-message.assistant h2,
.llm-message.assistant h3,
.llm-message.assistant h4,
.llm-message.assistant h5,
.llm-message.assistant h6,
.llm-message.assistant blockquote,
.llm-message.assistant hr,
.llm-message.assistant p {
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

.llm-chat-input-area {
  display: flex;
  padding: 12px 16px;
  border-top: 1px solid var(--stroke-container, #e0e0e0);
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 0 0 10px 10px;
}

.llm-chat-input-area input {
  flex: 1;
  padding: 12px 14px;
  border: 1px solid #ccd6dd;
  border-radius: 8px;
  margin-right: 12px;
  outline: none;
  font-size: 14px;
  color: #1a1a1a;
  transition: all 0.2s ease;
}

.llm-chat-input-area input:focus {
  border-color: #007bc1;
  box-shadow: 0 0 0 3px rgba(0, 123, 193, 0.15);
}

.llm-chat-input-area button {
  padding: 10px 20px;
  background-color: #007bc1;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.llm-chat-input-area button:hover {
  background-color: #005f9e;
}

.llm-chat-input-area button:active {
  transform: scale(0.98);
}

.llm-chat-input-area button.loading {
  background-color: #a0cce3;
  cursor: not-allowed;
  opacity: 0.8;
}
  `;
  document.head.appendChild(style);
}

export function displayMessage(role, text) {
  const container = document.getElementById("llm-messages");
  if (!container) return;

  const cleanText =
    role === "assistant"
      ? text.replace(/<think>[\s\S]*?<\/think>\s*/gi, "").trim()
      : text;
  if (!cleanText) return;

  const msgDiv = document.createElement("div");
  msgDiv.classList.add("llm-message", role);

  if (role === "assistant") {
    msgDiv.innerHTML = formatAssistantMarkdown(cleanText);
  } else {
    msgDiv.textContent = cleanText;
  }

  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}

export function updateLoadingState(isLoading) {
  const sendBtn = document.getElementById("llm-send");
  const inputEl = document.getElementById("llm-input");

  if (sendBtn) {
    sendBtn.disabled = isLoading;
    sendBtn.textContent = isLoading ? "..." : "Send";
    sendBtn.classList.toggle("loading", isLoading);
  }
  if (inputEl) inputEl.disabled = isLoading;
}

export function renderChatInterface(onSubmitCallback) {
  const parentColumn = document.querySelector(
    ".TwoColumnWideLeft-columnTwo-area",
  );
  if (!parentColumn || document.querySelector(".llm-chat-container")) return;

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

  parentColumn.prepend(chatContainer);
  injectStyles();

  const inputEl = document.getElementById("llm-input");
  const sendBtn = document.getElementById("llm-send");

  const submit = () => {
    const text = inputEl.value;
    if (!text.trim()) return;
    inputEl.value = "";
    onSubmitCallback(text);
  };

  sendBtn.addEventListener("click", submit);
  inputEl.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !sendBtn.disabled) submit();
  });
}
