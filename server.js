const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 3000;

/* 🟦 Disable cache */
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

/* 🟦 Smart input formatting */
function formatInput(input) {
  input = input.trim();

  if (!input.includes(" ") && !input.includes(".")) {
    return `https://www.${input}.com`;
  }

  if (/^([\w-]+\.)+[\w-]+/.test(input)) {
    return input.startsWith("http") ? input : `https://${input}`;
  }

  return `https://duckduckgo.com/?q=${encodeURIComponent(input)}`;
}

/* 🟦 UI (kept exactly as you had it) */
app.get("/", (req, res) => {
  res.send(`

<!DOCTYPE html>
<html>
<head>
<title>Ultra Browser</title>

<style>
/* (ALL YOUR ORIGINAL CSS — unchanged) */
body {
  margin: 0;
  font-family: Arial;
  background: #0f172a;
  color: white;
}
.topbar { display: flex; padding: 8px; background: #1e293b; gap: 6px; }
input { flex: 1; padding: 6px; border-radius: 6px; border: none; outline: none; }
button { padding: 6px 10px; border: none; border-radius: 6px; background: #475569; color: white; cursor: pointer; }
.tabs { display: flex; background: #020617; padding: 6px; gap: 6px; overflow-x: auto; }
.tab { padding: 6px 12px; background: #334155; border-radius: 8px; cursor: pointer; display: flex; gap: 6px; align-items: center; white-space: nowrap; }
.tab.active { background: #64748b; }
.tab span.close { cursor: pointer; font-weight: bold; }
.tab span.close:hover { color: red; }
iframe { width: 100%; height: calc(100vh - 90px); border: none; }
</style>
</head>

<body>

<div class="tabs" id="tabs"></div>

<div class="topbar">
  <button onclick="goBack()">←</button>
  <button onclick="goForward()">→</button>
  <input id="url" placeholder="Search or enter URL">
  <button onclick="go()">Go</button>
  <button onclick="newTab()">+</button>
</div>

<iframe id="frame"></iframe>

<script>
let tabs = [];
let current = 0;

function newTab(url = "") {
  tabs.push({ url, title: "New Tab" });
  current = tabs.length - 1;
  renderTabs();
  load(url);
}

function renderTabs() {
  const bar = document.getElementById("tabs");
  bar.innerHTML = "";

  tabs.forEach((t, i) => {
    const tab = document.createElement("div");
    tab.className = "tab";
    if (i === current) tab.classList.add("active");

    const title = document.createElement("span");
    title.innerText = t.title;

    const close = document.createElement("span");
    close.innerText = "✕";
    close.className = "close";

    close.onclick = (e) => {
      e.stopPropagation();
      closeTab(i);
    };

    tab.onclick = () => {
      current = i;
      load(tabs[i].url);
      renderTabs();
    };

    tab.appendChild(title);
    tab.appendChild(close);
    bar.appendChild(tab);
  });
}

function closeTab(i) {
  tabs.splice(i, 1);
  if (tabs.length === 0) return newTab();
  current = Math.max(0, i - 1);
  load(tabs[current].url);
  renderTabs();
}

function load(val) {
  if (!val) return;

  const url = formatInput(val);
  tabs[current].url = val;
  tabs[current].title = val;

  document.getElementById("frame").src =
    "/proxy?url=" + encodeURIComponent(url);

  renderTabs();
}

function go() {
  load(document.getElementById("url").value);
}

document.getElementById("url").addEventListener("keydown", (e) => {
  if (e.key === "Enter") go();
});

function goBack() {
  document.getElementById("frame").contentWindow.history.back();
}

function goForward() {
  document.getElementById("frame").contentWindow.history.forward();
}

newTab("https://google.com");
</script>

</body>
</html>

  `);
});

/* 🟦 PROXY (unchanged behavior, just safer routing) */
app.get("/proxy", (req, res) => {
  let url = req.query.url;
  if (!url) return res.send("No URL");

  return createProxyMiddleware({
    target: url,
    changeOrigin: true,
    secure: false,
    onError: () => res.send("Blocked or failed to load")
  })(req, res);
});

/* 🟦 START SERVER (FIXED) */
app.listen(PORT, () => {
  console.log("App running on port " + PORT);
});