import { CONFIG, SYSTEM_PROMPT } from "./config.js";
import { apiEndpoints } from "./endpoints.js";
import { sendToAiProvider, processToolCall } from "./aiService.js";
import {
  renderChatInterface,
  displayMessage,
  updateLoadingState,
} from "./ui.js";

let chatMessages = [SYSTEM_PROMPT];

async function handleUserMessage(text) {
  displayMessage("user", text);
  chatMessages.push({ role: "user", content: text });
  updateLoadingState(true);

  try {
    let isDone = false;
    const maxLoops = 5;
    let currentLoop = 0;

    while (!isDone && currentLoop < maxLoops) {
      currentLoop++;
      console.log(`Garmin Peak - Loop ${currentLoop} processing...`);

      console.log(
        "Garmin Peak - Sending messages to AI:",
        JSON.parse(JSON.stringify(chatMessages)),
      );
      const responseData = await sendToAiProvider(chatMessages, apiEndpoints);
      console.log("Garmin Peak - Raw AI response:", responseData);

      if (!responseData?.message) {
        let name;
        if (CONFIG.AI_PROVIDER === "groq") name = "GroqCloud";
        else if (CONFIG.AI_PROVIDER === "gemini") name = "Gemini";
        else name = "Ollama";
        displayMessage("assistant", `Communication error with ${name}.`);
        break;
      }

      const msg = responseData.message;
      console.log("Garmin Peak - AI message to push:", msg);
      chatMessages.push(msg);

      if (msg.tool_calls?.length > 0) {
        if (msg.content?.trim()) {
          displayMessage("assistant", msg.content);
        }

        for (const toolCall of msg.tool_calls) {
          const toolResult = await processToolCall(
            toolCall,
            apiEndpoints,
            (stageText) => {
              displayMessage("assistant", stageText);
            },
          );
          chatMessages.push(toolResult);
        }
      } else {
        isDone = true;
        if (msg.content) displayMessage("assistant", msg.content);
      }
    }

    if (currentLoop >= maxLoops && !isDone) {
      displayMessage("assistant", "Too many recursive calls, I had to stop.");
    }
  } catch (err) {
    console.error("Garmin Peak - Loop error:", err);
    displayMessage("assistant", "A critical error occurred during processing.");
  } finally {
    updateLoadingState(false);
  }
}

function init() {
  if (location.href.startsWith("https://connect.garmin.com/app/home")) {
    renderChatInterface(handleUserMessage);
  }
}

const domObserver = new MutationObserver(init);
domObserver.observe(document.body, { childList: true, subtree: true });

let lastUrl = location.href;
setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    init();
  }
}, 500);

init();
