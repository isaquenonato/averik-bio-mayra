const AVERIK_ANALYTICS = {
  profileSlug: "mayra",
  supabaseUrl: "https://moddxhnxtafccjssizob.supabase.co",
  publishableKey: "sb_publishable_VEzYHxMlW8Ue942DIxeB5A_faLEjQ1z"
};

function normalizeSource(value) {
  if (!value) return null;

  const source = value.toLowerCase().trim();

  if (source.includes("tiktok")) return "tiktok";
  if (source.includes("instagram") || source === "ig") return "instagram";
  if (source.includes("facebook") || source === "fb") return "facebook";

  return source.replace(/[^a-z0-9_-]/g, "").slice(0, 50) || null;
}

function sourceFromReferrer() {
  if (!document.referrer) return "direct";

  try {
    const host = new URL(document.referrer).hostname.toLowerCase();

    if (host.includes("tiktok")) return "tiktok";
    if (host.includes("instagram")) return "instagram";
    if (host.includes("facebook") || host.includes("fb.com")) return "facebook";

    return "other";
  } catch {
    return "other";
  }
}

function sourceFromPath() {
  const parts = window.location.pathname
    .split("/")
    .filter(Boolean)
    .map(part => part.toLowerCase());

  const knownSources = ["tiktok", "instagram", "facebook"];
  const match = parts.find(part => knownSources.includes(part));

  return match || null;
}

function getTrafficSource() {
  const pathSource = sourceFromPath();

  if (pathSource) {
    sessionStorage.setItem("averik_source", pathSource);
    return pathSource;
  }

  const params = new URLSearchParams(window.location.search);
  const utmSource = normalizeSource(params.get("utm_source"));

  if (utmSource) {
    sessionStorage.setItem("averik_source", utmSource);
    return utmSource;
  }

  const storedSource = sessionStorage.getItem("averik_source");
  if (storedSource) return storedSource;

  const referrerSource = sourceFromReferrer();
  sessionStorage.setItem("averik_source", referrerSource);

  return referrerSource;
}

function getDeviceType() {
  const ua = navigator.userAgent.toLowerCase();

  if (/ipad|tablet|(android(?!.*mobile))/.test(ua)) return "tablet";
  if (/mobi|android|iphone|ipod/.test(ua)) return "mobile";

  return "desktop";
}

async function callTrackingRpc(functionName, payload) {
  try {
    const response = await fetch(
      `${AVERIK_ANALYTICS.supabaseUrl}/rest/v1/rpc/${functionName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": AVERIK_ANALYTICS.publishableKey
        },
        body: JSON.stringify(payload),
        keepalive: true
      }
    );

    if (!response.ok) {
      console.warn(`Averik Analytics: ${functionName} não foi registrado.`);
    }
  } catch (error) {
    console.warn("Averik Analytics indisponível.", error);
  }
}

const trafficSource = getTrafficSource();
const deviceType = getDeviceType();

callTrackingRpc("track_visit", {
  p_profile_slug: AVERIK_ANALYTICS.profileSlug,
  p_source: trafficSource,
  p_referrer: document.referrer || null,
  p_device_type: deviceType
});

document.querySelectorAll(".link-btn").forEach((button) => {
  button.addEventListener("click", () => {
    button.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(0.985)" },
        { transform: "scale(1)" }
      ],
      { duration: 180 }
    );

    callTrackingRpc("track_click", {
      p_profile_slug: AVERIK_ANALYTICS.profileSlug,
      p_source: trafficSource,
      p_card_id: button.dataset.cardId || "unknown",
      p_card_name: button.dataset.cardName || button.textContent.trim(),
      p_device_type: deviceType
    });
  });
});
