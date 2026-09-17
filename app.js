/*
  CONFIGURATION
  -------------
  1. Replace META_PIXEL_ID with your Meta Pixel ID.
  2. Replace WORKER_URL with your Cloudflare Worker URL.
*/
const META_PIXEL_ID = "1119545540609026";
const WORKER_URL = "https://flat-thunder-e1e4.samalchinmaya612.workers.dev";

if (META_PIXEL_ID !== "1119545540609026") {
  fbq('init', META_PIXEL_ID);
  fbq('track', 'PageView');
}

function getOrCreateClickId() {
  const key = "mahesh_loots_click_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function getFbc() {
  const params = new URLSearchParams(location.search);
  const fbclid = params.get("fbclid");
  if (!fbclid) return localStorage.getItem("mahesh_fbc") || "";
  const fbc = `fb.1.${Date.now()}.${fbclid}`;
  localStorage.setItem("mahesh_fbc", fbc);
  return fbc;
}

function getFbp() {
  const match = document.cookie.match(/(?:^|;\s*)_fbp=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : (localStorage.getItem("mahesh_fbp") || "");
}

const clickId = getOrCreateClickId();
const fbc = getFbc();
const fbp = getFbp();

const btn = document.getElementById("joinBtn");
const status = document.getElementById("status");

btn.addEventListener("click", async () => {
  btn.disabled = true;
  status.textContent = "Preparing your Telegram invite…";

  if (META_PIXEL_ID !== "YOUR_META_PIXEL_ID") {
    fbq('track', 'Lead', {}, {eventID: `click_${clickId}`});
    fbq('trackCustom', 'TelegramJoinClick', {click_id: clickId}, {eventID: `tgclick_${clickId}`});
  }

  try {
    const response = await fetch(`${WORKER_URL}/generate-invite`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        click_id: clickId,
        fbc,
        fbp,
        page_url: location.href
      })
    });

    const data = await response.json();
    if (!response.ok || !data.invite_url) throw new Error(data.error || "Could not create invite");

    status.textContent = "Opening Telegram…";
    window.location.href = data.invite_url;
  } catch (err) {
    console.error(err);
    status.textContent = "Could not create the invite. Please try again.";
    btn.disabled = false;
  }
});
