import { CONFIG } from "./config.js";
import { buildPathTree, pruneData } from "./utils.js";
import { garminFetch } from "./api.js";

export function getAvailableTools(apiEndpoints) {
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
        name,
        description: config.description,
        parameters: { type: "object", properties, required },
      },
    };
  });
}

export async function sendToAiProvider(chatMessages, apiEndpoints) {
  const isGroq = CONFIG.AI_PROVIDER === "groq";
  const isGemini = CONFIG.AI_PROVIDER === "gemini";
  const isOllama = CONFIG.AI_PROVIDER === "ollama";

  const url = isGroq
    ? `${CONFIG.GROQ_BASE_URL}/chat/completions`
    : isGemini
      ? `${CONFIG.GEMINI_BASE_URL}chat/completions`
      : `${CONFIG.OLLAMA_BASE_URL}/api/chat`;

  const tools = getAvailableTools(apiEndpoints);

  const headers = { "Content-Type": "application/json" };
  if (isGroq) {
    if (!CONFIG.GROQ_API_KEY) throw new Error("Groq API key not configured");
    headers["Authorization"] = `Bearer ${CONFIG.GROQ_API_KEY}`;
  } else if (isGemini) {
    if (!CONFIG.GEMINI_API_KEY)
      throw new Error("Gemini API key not configured");
    headers["Authorization"] = `Bearer ${CONFIG.GEMINI_API_KEY}`;
  }

  const body = {
    model: isGroq
      ? CONFIG.GROQ_MODEL
      : isGemini
        ? CONFIG.GEMINI_MODEL
        : CONFIG.OLLAMA_MODEL,
    messages: chatMessages,
    tools: tools.length > 0 ? tools : undefined,
    ...(isOllama
      ? { stream: false }
      : { tool_choice: "auto", temperature: 0.7 }),
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`HTTP error ${response.status}`);

  const data = await response.json();
  console.debug("AI Provider Raw Response:", data);
  return isGroq || isGemini ? transformGroqResponse(data) : data;
}

function transformGroqResponse(data) {
  const message = data.choices[0].message;
  const transformed = { role: message.role, content: message.content || "" };

  if (message.tool_calls?.length > 0) {
    transformed.tool_calls = message.tool_calls.map((tc) => ({
      id: tc.id,
      type: tc.type || "function",
      function: {
        name: tc.function?.name,
        arguments:
          typeof tc.function?.arguments === "string"
            ? tc.function.arguments
            : JSON.stringify(tc.function?.arguments ?? {}),
      },
    }));
  }
  return { message: transformed };
}

export async function processToolCall(toolCall, apiEndpoints, onNotifyStage) {
  const { id: callId, function: func } = toolCall;
  let args = {};

  try {
    args =
      typeof func.arguments === "string"
        ? JSON.parse(func.arguments || "{}")
        : func.arguments;
  } catch (e) {
    console.error("Error parsing tool arguments", e, func.arguments);
  }

  const endpointConfig = apiEndpoints[func.name];
  if (!endpointConfig) {
    return {
      role: "tool",
      tool_call_id: callId,
      name: func.name,
      content: JSON.stringify({ error: "Tool not found" }),
    };
  }

  let finalUrl = endpointConfig.url;
  if (endpointConfig.params) {
    for (const key of Object.keys(endpointConfig.params)) {
      if (args[key] !== undefined)
        finalUrl = finalUrl.replace(`{${key}}`, args[key]);
    }
  }

  const urlObj = new URL(finalUrl);
  if (endpointConfig.query) {
    for (const key of Object.keys(endpointConfig.query)) {
      const val = args[key];
      if (
        val !== undefined &&
        val !== null &&
        !endpointConfig.url.includes(`{${key}}`)
      ) {
        urlObj.searchParams.append(key, val);
      }
    }
  }

  if (onNotifyStage) onNotifyStage(`Retrieving : ${func.name}...`);

  const data = await garminFetch(urlObj.toString());
  const keepTree = buildPathTree(endpointConfig.keep);
  const ignoreTree =
    keepTree && Object.keys(keepTree).length > 0
      ? null
      : buildPathTree(endpointConfig.ignore);

  pruneData(data, keepTree, ignoreTree);

  return {
    role: "tool",
    tool_call_id: callId,
    name: func.name,
    content: data
      ? JSON.stringify(data)
      : JSON.stringify({ error: "No data response" }),
  };
}
