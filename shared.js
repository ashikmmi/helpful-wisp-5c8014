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
  const links = [["index.html", "Check-in", "checkin"], ["feedback.html", "Feedback", "feedback"], ["expense.html", "My expense", "expense"]];
  $("foot").innerHTML = links.map(l => l[2] === active ? "<b style='color:#fff'>" + l[1] + "</b>" : "<a href='" + l[0] + "'>" + l[1] + "</a>").join(" · ");
}
