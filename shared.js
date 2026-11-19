"use strict";
/* ============ EDIT THIS ONE PLACE ============ */
const CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbwNIDa2VWNbsSKqnbPlUq9DrI_iQ1tNvKMZwWYmkP3r-1QpZYZnSTgcdncmmwm4xfPS/exec",                                   // paste your Google Apps Script web-app URL here (ends with /exec)
  EVENT_NAME: "WINTER GETTOGETHER",
  EVENT_LINE: "Friday, 20 November 2026 · Istirah",
  CURRENCY: "SAR"
};
/* ============================================= */

const $ = id => document.getElementById(id);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const showMsg = (el, text) => { el.textContent = text; el.classList.remove("hidden"); };

function normMobile(raw){
  let d = String(raw || "").replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 1632)).replace(/\D/g, "");
  if (d.startsWith("00966")) d = d.slice(5); else if (d.startsWith("966")) d = d.slice(3);
  d = d.replace(/^0+/, "");
  return d.length >= 9 ? d.slice(-9) : "";
}
function fmtTime(iso){ try { return new Date(iso).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}); } catch(e){ return ""; } }
function fmtMoney(n){ return Number(n).toLocaleString(undefined, {maximumFractionDigits:2}); }

async function call(opts){
  if (!CONFIG.API_URL) throw new Error("This page isn't connected to the guest list yet. Please tell the organiser.");
  let r;
  try { r = await fetch(opts.url, opts.init); }
  catch(e){ throw new Error("Couldn't reach the server. Please check your internet connection and try again."); }
  let d;
  try { d = await r.json(); } catch(e){ throw new Error("Unexpected reply from the server. Please try again."); }
  if (!d.ok) throw new Error(d.error || "Server error");
  return d;
}
const apiGet = params => call({url: CONFIG.API_URL + "?" + new URLSearchParams(Object.assign({_: Date.now()}, params)).toString()});
const apiPost = body => call({url: CONFIG.API_URL, init: {method: "POST", headers: {"Content-Type": "text/plain;charset=utf-8"}, body: JSON.stringify(body)}});

function pageInit(pageTitle, active){
  $("evline").textContent = CONFIG.EVENT_LINE;
  if (pageTitle) $("pagetag").textContent = pageTitle;
  const snow = $("snow");
  for (let i = 0; i < 24; i++){
    const s = document.createElement("i"); s.textContent = "❄";
    s.style.left = (Math.random() * 100) + "%"; s.style.fontSize = (10 + Math.random() * 16) + "px";
    s.style.animationDuration = (9 + Math.random() * 12) + "s"; s.style.animationDelay = (-Math.random() * 15) + "s";
    snow.appendChild(s);
  }
  const links = [["index.html", "Check-in", "checkin"], ["eventlist.html", "Event list", "eventlist"], ["responsible.html", "Responsible", "responsible"], ["feedback.html", "Feedback", "feedback"], ["expense.html", "My expense", "expense"]];
  const gated = {checkin: 1, feedback: 1, expense: 1};      // these links stay greyed out until they are opened
  const draw = cfg => {                          // cfg: undefined = still loading, null = unknown, object = known
    $("foot").innerHTML = links.map(l => {
      if (l[2] === active) return "<b style='color:#fff'>" + l[1] + "</b>";
      const closed = gated[l[2]] && (cfg === undefined || (cfg && !cfg[l[2]]));
      return closed ? "<span class='off' title='Opens at the end of the event'>" + l[1] + " (soon)</span>" : "<a href='" + l[0] + "'>" + l[1] + "</a>";
    }).join(" · ") + (window.FOOT_EXTRA || "");
  };
  draw(undefined);
  getConfig().then(draw);
}
function opensText(cfg){
  const d = new Date(cfg.opensAt);
  const day = d.toLocaleDateString("en-GB", {timeZone: "Asia/Riyadh", weekday: "long", day: "numeric", month: "long", year: "numeric"});
  const tm = d.toLocaleTimeString("en-US", {timeZone: "Asia/Riyadh", hour: "numeric", minute: "2-digit", hour12: true});
  return day + " at " + tm + " (Saudi time)";
}
async function getConfig(){
  try { return (await apiGet({action: "config"})).config; } catch(e){ return null; }
}

/* ---------- read-only lists (Event list / Responsible), live from the Google Sheet ---------- */
function linkify(text){
  return esc(text).replace(/\+?\d[\d\s\-()]{7,}\d/g, m => {
    const digits = m.replace(/\D/g, "");
    return digits.length >= 9 && digits.length <= 15 ? "<a href='tel:" + (m.trim().startsWith("+") ? "+" : "") + digits + "'>" + m + "</a>" : m;
  });
}
async function loadList(which){
  const box = $("listBox"), note = $("listNote"), q = $("q"), btn = $("refreshBtn");
  note.classList.add("hidden"); btn.disabled = true;
  try {
    const d = await apiGet({action: "list", which});
    const rows = d.rows || [];
    if (!rows.length){ box.innerHTML = ""; showMsg(note, "Nothing has been added here yet. Please check again later."); note.className = "msg warn"; return; }
    let hi = rows.findIndex(r => r.filter(c => c).length >= 2); if (hi < 0) hi = 0;
    const head = rows[hi], body = rows.slice(hi + 1);
    const width = Math.max(head.length, ...body.map(r => r.length));
    const cols = Array.from({length: width}, (_, i) => head[i] || "");
    const title = rows.slice(0, hi).map(r => r.filter(c => c).join(" ")).join(" · ");
    $("listTitle").textContent = title;
    $("listTitle").classList.toggle("hidden", !title);
    const draw = () => {
      const f = q.value.trim().toLowerCase();
      const shown = body.filter(r => !f || r.join(" ").toLowerCase().includes(f));
      box.innerHTML = shown.length
        ? "<table class='lt'><thead><tr>" + cols.map(h => "<th>" + esc(h) + "</th>").join("") + "</tr></thead><tbody>" +
          shown.map(r => "<tr>" + cols.map((h, i) => "<td data-label='" + esc(h) + "'>" + linkify(r[i] || "") + "</td>").join("") + "</tr>").join("") + "</tbody></table>"
        : "<p class='sub' style='margin:8px 0 0'>No matches.</p>";
    };
    q.oninput = draw; draw();
  } catch(e){ box.innerHTML = ""; note.className = "msg bad"; showMsg(note, e.message); }
  finally { btn.disabled = false; }
}
