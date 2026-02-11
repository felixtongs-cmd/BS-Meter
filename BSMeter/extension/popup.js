(function () {
  "use strict";

  const DASHBOARD_URL = "https://bsmeter.vercel.app";
  const STORAGE_KEYS = { isPro: "isPro" };

  function $(id) {
    return document.getElementById(id);
  }

  chrome.storage.local.get([STORAGE_KEYS.isPro], function (data) {
    const status = $("popup-status");
    const dashboard = $("popup-dashboard");
    const login = $("popup-login");

    dashboard.href = DASHBOARD_URL;
    login.href = DASHBOARD_URL + "/login";

    if (data.isPro) {
      status.textContent = "You have Pro. Unlimited checks on product pages.";
      dashboard.style.display = "block";
      dashboard.textContent = "Open Dashboard";
      login.style.display = "none";
    } else {
      status.textContent = "Free: 3 checks per day. Upgrade for unlimited.";
      dashboard.style.display = "block";
      login.style.display = "block";
    }
  });
})();
