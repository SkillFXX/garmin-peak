export function formatAssistantMarkdown(rawText) {
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

  return escaped.replace(/\n/g, "<br>");
}

export function formatTime(seconds, showSeconds = false) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return showSeconds ? `${h}h ${m}m ${s}s` : `${h}h ${m}m`;
}

export function buildPathTree(paths) {
  const tree = {};
  if (!Array.isArray(paths)) return tree;
  for (const path of paths) {
    const parts = String(path).split(".");
    let node = tree;
    for (const part of parts) {
      if (!node[part]) node[part] = {};
      node = node[part];
    }
    node.__leaf = true;
  }
  return tree;
}

export function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function pruneData(value, keepTree = null) {
  if (Array.isArray(value)) {
    for (const item of value) {
      pruneData(item, keepTree);
    }
    return;
  }

  if (!isPlainObject(value) || !keepTree) {
    return;
  }

  for (const key of Object.keys(value)) {
    const nextTree = keepTree[key];

    if (!nextTree) {
      delete value[key];
      continue;
    }

    if (isPlainObject(value[key]) || Array.isArray(value[key])) {
      pruneData(value[key], nextTree);
    }
  }
}
