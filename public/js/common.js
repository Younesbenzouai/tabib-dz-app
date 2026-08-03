// public/js/common.js
async function api(path, options = {}) {
  const res = await fetch("/api" + path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Une erreur est survenue.");
  return data;
}

const colors = ["#0575e6", "#1a9b5c", "#c9752b", "#a44fd8", "#d84f8a"];
function colorFor(id) {
  return colors[((id % colors.length) + colors.length) % colors.length];
}

const dayNames = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
const monthNames = ["jan", "fév", "mar", "avr", "mai", "juin", "juil", "août", "sept", "oct", "nov", "déc"];

function toDate(isoDay) {
  const [y, m, d] = isoDay.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function fmtDay(isoDay, short) {
  const d = toDate(isoDay);
  if (short) return { d: dayNames[d.getDay()], n: d.getDate() };
  return `${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]}`;
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

let currentUser = null;

async function initHeader(activeKey) {
  const el = document.getElementById("app-header");
  try {
    currentUser = await api("/auth/me");
  } catch (e) {
    currentUser = null;
  }

  const rightSide = currentUser
    ? `<span style="font-size:13.5px; color:var(--muted); margin-right:4px;">Bonjour, ${currentUser.fullName.split(" ")[0]}</span>
       <button class="btn-outline" onclick="doLogout()">Se déconnecter</button>`
    : `<a href="/login.html" class="btn-outline" style="display:inline-block;">Se connecter</a>`;

  const accountLink = currentUser && currentUser.role === "patient"
    ? `<a class="navlink ${activeKey === "account" ? "active" : ""}" href="/account.html">Mes rendez-vous</a>`
    : `<a class="navlink ${activeKey === "account" ? "active" : ""}" href="/login.html">Mes rendez-vous</a>`;

  const proLink = currentUser && currentUser.role === "doctor"
    ? `<a class="navlink ${activeKey === "pro" ? "active" : ""}" href="/pro.html">Espace médecin</a>`
    : `<a class="navlink ${activeKey === "pro" ? "active" : ""}" href="/login.html?role=doctor">Espace médecin</a>`;

  el.innerHTML = `
    <div class="nav-inner">
      <a href="/index.html" class="logo"><span class="sq">T</span>Tabib.dz</a>
      <a class="navlink ${activeKey === "home" ? "active" : ""}" href="/index.html">Rechercher</a>
      ${accountLink}
      ${proLink}
      <div class="nav-spacer"></div>
      ${rightSide}
    </div>
  `;
}

async function doLogout() {
  await api("/auth/logout", { method: "POST" });
  window.location.href = "/index.html";
}

function requireLogin(role) {
  if (!currentUser || (role && currentUser.role !== role)) {
    window.location.href = "/login.html" + (role ? "?role=" + role : "");
    return false;
  }
  return true;
}
