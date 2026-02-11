(function () {
  "use strict";
  window.addEventListener("message", function (event) {
    if (event.source !== window) return;
    if (event.data && event.data.type === "BSMETER_PRO_SYNC") {
      chrome.storage.local.set({
        isPro: !!event.data.isPro,
        hasAutoscan: !!event.data.hasAutoscan
      });
    }
  });
})();
