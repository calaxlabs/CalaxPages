/* =====================================================================
   location-map.js
   Fills every <img class="map-img"> inside a .surface-map element with
   a static map image centered on the user's approximate location, at
   country/region precision — no GPS, no permission prompt.

   How it works:
   1. Calls a free IP-geolocation API (ipapi.co) to get lat/lon + a zoom
      level appropriate for "country" or "region" precision.
   2. Falls back to a whole-earth view (zoom 1, centered on 0,0) if the
      lookup fails or is blocked (ad-blockers, offline, etc).
   3. Builds a static map URL from OpenStreetMap's free static renderer
      (no API key required) and sets it as the image source.
   4. style.css's .surface-map .map-img filter turns the naturally light
      map dark and low-detail — this file only handles positioning it.

   Usage: include after your HTML, or with `defer`:
     <img class="map-img" alt="">
     <script src="location-map.js" defer></script>

   Swap MAP_PROVIDER for Mapbox/MapTiler if you have an API key and want
   sharper tiles — the URL builder is isolated at the bottom for that.
   ===================================================================== */

(function () {
  "use strict";

  const WHOLE_EARTH = { lat: 20, lon: 0, zoom: 1 };

  function zoomForPrecision(data) {
    // Prefer region (state/province) precision when available, else country.
    if (data.region) return 6;
    if (data.country_name) return 4;
    return WHOLE_EARTH.zoom;
  }

  function buildStaticMapUrl({ lat, lon, zoom }) {
    const width = 1600;
    const height = 900;
    // OpenStreetMap's free static map renderer — no key required.
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=${zoom}&size=${width}x${height}&maptype=mapnik`;
  }

  function applyMap(coords) {
    const url = buildStaticMapUrl(coords);
    document.querySelectorAll(".surface-map .map-img").forEach((img) => {
      img.src = url;
      img.addEventListener("load", () => img.classList.add("is-loaded"), { once: true });
      // If the tile server fails, keep the plain dark .surface-map background.
      img.addEventListener("error", () => img.classList.remove("is-loaded"), { once: true });
    });
  }

  function init() {
    // Default immediately to whole-earth so the page never waits on network.
    applyMap(WHOLE_EARTH);

    fetch("https://ipapi.co/json/")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        if (typeof data.latitude !== "number" || typeof data.longitude !== "number") {
          return; // keep whole-earth default
        }
        applyMap({
          lat: data.latitude,
          lon: data.longitude,
          zoom: zoomForPrecision(data),
        });
      })
      .catch(() => {
        // network/API failure — whole-earth view already applied, do nothing
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
