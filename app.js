/*
  MAHESH LOOTS - META + TELEGRAM TRACKING
*/

const META_PIXEL_ID = "1119545540609026";
const WORKER_URL = "https://flat-thunder-e1e4.samalchinmaya612.workers.dev";


// ============================================================
// META PIXEL
// ============================================================

if (typeof fbq === "function") {
  fbq("init", META_PIXEL_ID);
  fbq("track", "PageView");
}


// ============================================================
// CLICK ID
// ============================================================

function getOrCreateClickId() {
  const key = "mahesh_loots_click_id";

  let id = localStorage.getItem(key);

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }

  return id;
}


// ============================================================
// COOKIE READER
// ============================================================

function getCookie(name) {
  const cookies = document.cookie.split(";");

  for (const cookie of cookies) {
    const [key, ...valueParts] = cookie.trim().split("=");

    if (key === name) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return "";
}


// ============================================================
// FBC
// ============================================================

function getFbc() {

  // First: check Meta's _fbc cookie
  const cookieFbc = getCookie("_fbc");

  if (cookieFbc) {
    localStorage.setItem("mahesh_fbc", cookieFbc);
    return cookieFbc;
  }

  // Second: check fbclid in URL
  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get("fbclid");

  if (fbclid) {
    const fbc = `fb.1.${Date.now()}.${fbclid}`;

    localStorage.setItem("mahesh_fbc", fbc);

    return fbc;
  }

  // Third: previously stored fbc
  return localStorage.getItem("mahesh_fbc") || "";
}


// ============================================================
// FBP
// ============================================================

function getFbp() {

  // First: read Meta's _fbp cookie
  const cookieFbp = getCookie("_fbp");

  if (cookieFbp) {
    localStorage.setItem("mahesh_fbp", cookieFbp);
    return cookieFbp;
  }

  // Second: previously stored fbp
  return localStorage.getItem("mahesh_fbp") || "";
}


// ============================================================
// WAIT FOR FBP
// ============================================================
//
// Meta Pixel may create _fbp shortly after initialization.
// We check repeatedly and save it once available.
//

function captureFbp() {

  let attempts = 0;

  const timer = setInterval(() => {

    const fbp = getCookie("_fbp");

    if (fbp) {

      localStorage.setItem("mahesh_fbp", fbp);

      console.log("FBP CAPTURED:", fbp);

      clearInterval(timer);
      return;
    }

    attempts++;

    if (attempts >= 50) {
      clearInterval(timer);

      console.log(
        "FBP was not found during initial capture."
      );
    }

  }, 100);
}


// Start capturing FBP
captureFbp();


// ============================================================
// INITIAL DATA
// ============================================================

const clickId = getOrCreateClickId();

const btn = document.getElementById("joinBtn");
const status = document.getElementById("status");


// ============================================================
// JOIN BUTTON
// ============================================================

btn.addEventListener("click", async () => {

  btn.disabled = true;

  status.textContent = "Preparing your Telegram invite…";


  // IMPORTANT:
  // Get fbc/fbp HERE, at click time.
  const fbc = getFbc();
  const fbp = getFbp();


  // Debug information
  console.log("================================");
  console.log("META TRACKING DATA");
  console.log("click_id:", clickId);
  console.log("fbc:", fbc);
  console.log("fbp:", fbp);
  console.log("page_url:", window.location.href);
  console.log("================================");


  // ==========================================================
  // BROWSER EVENTS
  // ==========================================================

  if (typeof fbq === "function") {

    fbq(
      "track",
      "Lead",
      {},
      {
        eventID: `click_${clickId}`
      }
    );


    fbq(
      "trackCustom",
      "TelegramJoinClick",
      {
        click_id: clickId,
        fbc: fbc,
        fbp: fbp
      },
      {
        eventID: `tgclick_${clickId}`
      }
    );
  }


  // ==========================================================
  // SEND ATTRIBUTION TO CLOUDFLARE
  // ==========================================================

  try {

    const response = await fetch(
      `${WORKER_URL}/generate-invite`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          click_id: clickId,
          fbc: fbc,
          fbp: fbp,
          page_url: window.location.href
        })
      }
    );


    const data = await response.json();


    console.log("WORKER RESPONSE:", data);


    if (!response.ok || !data.invite_url) {
      throw new Error(
        data.error || "Could not create invite"
      );
    }


    status.textContent = "Opening Telegram…";

    window.location.href = data.invite_url;


  } catch (error) {

    console.error("JOIN ERROR:", error);

    status.textContent =
      "Could not create the invite. Please try again.";

    btn.disabled = false;
  }

});
