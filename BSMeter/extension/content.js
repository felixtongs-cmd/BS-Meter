(function () {
  "use strict";

  const DAILY_LIMIT = 3;
  const STORAGE_KEYS = { isPro: "isPro", hasAutoscan: "hasAutoscan", checksUsed: "checksUsed", date: "checksDate" };
  const MAX_REVIEWS = 5;

  function getHost() {
    try {
      return new URL(window.location.href).hostname;
    } catch {
      return "";
    }
  }

  function isAmazon(host) {
    return /\.amazon\.(com|com\.au)$/.test(host);
  }

  function isShopify(host) {
    return /\.(shopify\.com|myshopify\.com)$/.test(host);
  }

  function isAlibaba(host) {
    return /\.(alibaba\.com|alibaba\.com\.cn)$/.test(host);
  }

  /** Only show/inject on product pages to avoid broken UI on search or listing pages. */
  function isProductPage() {
    const host = getHost();
    const path = window.location.pathname || "";
    if (isAmazon(host)) {
      return /\/dp\/[a-zA-Z0-9]+/.test(path) || /\/gp\/product\/[a-zA-Z0-9]+/.test(path) || /\/product\/[a-zA-Z0-9]+/.test(path);
    }
    if (isShopify(host)) {
      return /\/products\/[^/]+/.test(path);
    }
    if (isAlibaba(host)) {
      return /\/product-detail\//.test(path) || /\/product\//.test(path);
    }
    return false;
  }

  function getProductImageUrl() {
    const host = getHost();
    if (isAmazon(host)) {
      const landing = document.getElementById("landingImage");
      if (landing && landing.src) return landing.src;
      const imgBlk = document.querySelector("#imgBlkFront");
      if (imgBlk && imgBlk.src) return imgBlk.src;
      const dynamic = document.querySelector(".a-dynamic-image[data-a-dynamic-image]");
      if (dynamic) {
        const attr = dynamic.getAttribute("data-a-dynamic-image");
        if (attr) {
          try {
            const obj = JSON.parse(attr);
            let bestUrl = dynamic.src || null;
            let bestW = 0;
            for (const url in obj) {
              const w = obj[url];
              const num = typeof w === "number" ? w : parseInt(String(w).split(",")[0], 10) || 0;
              if (num > bestW) {
                bestW = num;
                bestUrl = url;
              }
            }
            if (bestUrl) return bestUrl;
          } catch (_) {}
        }
        if (dynamic.src) return dynamic.src;
      }
      const mainImg = document.querySelector("#main-image, .imageBlock img");
      return mainImg && mainImg.src ? mainImg.src : null;
    }
    if (isShopify(host)) {
      const mainMedia = document.querySelector(".product__media img, .product-single__photo img, [data-product-image] img, .product-gallery__image img");
      if (mainMedia && mainMedia.src) return mainMedia.src;
      const productImgs = document.querySelectorAll('img[src*="cdn.shopify.com"][src*="products"]');
      for (const img of productImgs) {
        const src = (img.src || "").trim();
        if (src && !/\.(ico|svg)/i.test(src)) return src;
      }
      const anyCdn = document.querySelector('img[src*="cdn.shopify"]');
      return anyCdn ? anyCdn.src : null;
    }
    if (isAlibaba(host)) {
      const mainImg = document.querySelector(".product-detail-gallery img, .magnifier-image img, [class*=\"product-image\"] img, .detail-gallery img");
      if (mainImg && mainImg.src) return mainImg.src;
      const galleryImg = document.querySelector('img[src*="alicdn.com"][src*="product"]');
      if (galleryImg) return galleryImg.src;
      const firstProductImg = document.querySelector('.images-view-list img, .image-view img');
      return firstProductImg ? firstProductImg.src : null;
    }
    return null;
  }

  function getProductTitle() {
    const host = getHost();
    if (isAmazon(host)) {
      const el = document.getElementById("productTitle") || document.querySelector("#title h1");
      return el ? el.textContent.trim() : "";
    }
    if (isShopify(host)) {
      const el = document.querySelector("h1.product__title, .product-single__title, h1");
      return el ? el.textContent.trim() : "";
    }
    if (isAlibaba(host)) {
      const el = document.querySelector("h1.product-title, .product-title-text, h1[class*='title']");
      return el ? el.textContent.trim() : "";
    }
    return "";
  }

  /** Get unique review texts by container (one per review) to avoid duplicates and capture full body. */
  function getReviewTexts(maxCount) {
    const host = getHost();
    const seen = new Set();
    const texts = [];

    function addText(t) {
      const key = t.slice(0, 80).toLowerCase();
      if (t.length < 15 || seen.has(key)) return;
      seen.add(key);
      texts.push(t);
    }

    if (isAmazon(host)) {
      const reviewBodies = document.querySelectorAll('[data-hook="review-body"]');
      for (const el of reviewBodies) {
        const t = (el.textContent || "").trim();
        addText(t);
        if (texts.length >= maxCount) return texts;
      }
      const reviewTextContent = document.querySelectorAll(".review-text-content");
      for (const el of reviewTextContent) {
        const t = (el.textContent || "").trim();
        addText(t);
        if (texts.length >= maxCount) return texts;
      }
      const expanderContent = document.querySelectorAll(".a-expander-content");
      for (const el of expanderContent) {
        const t = (el.textContent || "").trim();
        addText(t);
        if (texts.length >= maxCount) return texts;
      }
      const reviewRows = document.querySelectorAll(".review-text span.a-expander-partial-collapse-content, .review-text [data-hook=\"review-body\"]");
      for (const el of reviewRows) {
        const t = (el.textContent || "").trim();
        addText(t);
        if (texts.length >= maxCount) return texts;
      }
    } else if (isShopify(host)) {
      const selectors = [".spr-review-content-body", ".review__content", "[data-review-body]", ".jdgm-rev__body", ".loox-review-body"];
      for (const sel of selectors) {
        const nodes = document.querySelectorAll(sel);
        for (const node of nodes) {
          const t = (node.textContent || "").trim();
          addText(t);
          if (texts.length >= maxCount) return texts;
        }
      }
    } else if (isAlibaba(host)) {
      const selectors = [
        ".review-content", ".review-detail", "[class*='review-content']",
        "[class*='review-detail']", ".feedback-content", ".buyer-feedback-content",
        ".detail-review-content", "[class*='feedback'] .content",
        ".mod-detail-reviews .content", ".reviews-list .content"
      ];
      for (const sel of selectors) {
        const nodes = document.querySelectorAll(sel);
        for (const node of nodes) {
          const t = (node.textContent || "").trim();
          addText(t);
          if (texts.length >= maxCount) return texts;
        }
      }
      const reviewTexts = document.querySelectorAll("[class*='review'] p, [class*='feedback'] p, [class*='comment'] p");
      for (const node of reviewTexts) {
        const t = (node.textContent || "").trim();
        addText(t);
        if (texts.length >= maxCount) return texts;
      }
    }
    return texts;
  }

  function analyzeReviewText(text) {
    let score = 0;
    const reasons = [];
    if (!text || text.length < 20) return { score: 0, reasons: ["Too short to analyze"] };

    const lower = text.toLowerCase();

    const capsRatio = (text.match(/[A-Z]/g) || []).length / Math.max(text.length, 1);
    if (capsRatio > 0.3) {
      score += 25;
      reasons.push("Heavy ALL CAPS usage");
    }

    const repetitive = ["kindly", "the item", "amazing product", "best ever", "highly recommend", "five stars", "came in", "exactly as described", "as described", "would recommend", "great product"];
    for (const phrase of repetitive) {
      if (lower.includes(phrase)) {
        score += 15;
        reasons.push("Repetitive phrase: \"" + phrase + "\"");
        break;
      }
    }

    const generic = ["amazing", "best product", "love it", "great quality", "exactly as described", "would buy again", "highly recommend", "game changer", "must have"];
    let genericCount = 0;
    for (const g of generic) {
      if (lower.includes(g)) genericCount++;
    }
    if (genericCount >= 2) {
      score += 20;
      reasons.push("Generic praise phrases");
    }

    const exclamations = (text.match(/!+/g) || []).length;
    if (exclamations > 2) {
      score += 10;
      reasons.push("Excessive exclamation marks");
    }

    const botOrAiPhrases = [
      "i received this product", "received this item", "in exchange for", "honest review", "my honest opinion",
      "disclaimer", "i was not compensated", "all opinions are my own", "voluntary review",
      "as an amazon affiliate", "as a vine voice", "vine member", "early reviewer"
    ];
    for (let i = 0; i < botOrAiPhrases.length; i++) {
      if (lower.indexOf(botOrAiPhrases[i]) !== -1) {
        score += 25;
        reasons.push("Bot/incentivized review language");
        break;
      }
    }

    if (lower.indexOf("thank you") !== -1 && lower.indexOf("customer") !== -1) {
      score += 15;
      reasons.push("Template-like phrasing");
    }

    const sentenceCount = (text.match(/[.!?]+/g) || []).length;
    if (text.length > 100 && sentenceCount <= 2) {
      score += 10;
      reasons.push("Long block of text (possible AI)");
    }

    return { score: Math.min(score, 100), reasons };
  }

  function analyzeReviews(reviewTexts) {
    if (!reviewTexts || reviewTexts.length === 0) {
      return { susScore: 0, reasons: [], noReviews: true };
    }
    let totalScore = 0;
    const allReasons = [];
    for (const text of reviewTexts) {
      const { score, reasons } = analyzeReviewText(text);
      totalScore += score;
      allReasons.push(...reasons);
    }
    const count = reviewTexts.length;
    const avgScore = Math.round(totalScore / count);
    const uniqueReasons = [...new Set(allReasons)].slice(0, 5);
    return { susScore: Math.min(avgScore, 100), reasons: uniqueReasons, noReviews: false };
  }

  function canRunCheck() {
    return new Promise(function (resolve) {
      chrome.storage.local.get([STORAGE_KEYS.isPro, STORAGE_KEYS.hasAutoscan, STORAGE_KEYS.checksUsed, STORAGE_KEYS.date], function (data) {
        const isPro = !!data[STORAGE_KEYS.isPro];
        const hasAutoscan = !!data[STORAGE_KEYS.hasAutoscan];
        if (isPro) {
          resolve({ allowed: true, isPro: true, hasAutoscan: hasAutoscan });
          return;
        }
        const today = new Date().toDateString();
        const lastDate = data[STORAGE_KEYS.date] || "";
        const used = parseInt(data[STORAGE_KEYS.checksUsed], 10) || 0;
        const checksUsed = today === lastDate ? used : 0;
        const allowed = checksUsed < DAILY_LIMIT;
        resolve({ allowed, isPro: false, hasAutoscan: false, checksUsed, limit: DAILY_LIMIT });
      });
    });
  }

  function incrementCheckCount() {
    return new Promise(function (resolve) {
      chrome.storage.local.get([STORAGE_KEYS.checksUsed, STORAGE_KEYS.date], function (data) {
        const today = new Date().toDateString();
        const lastDate = data[STORAGE_KEYS.date] || "";
        const used = parseInt(data[STORAGE_KEYS.checksUsed], 10) || 0;
        const checksUsed = today === lastDate ? used + 1 : 1;
        chrome.storage.local.set(
          { [STORAGE_KEYS.checksUsed]: checksUsed, [STORAGE_KEYS.date]: today },
          resolve
        );
      });
    });
  }

  function openGoogleLens(imageUrl) {
    if (!imageUrl || typeof imageUrl !== "string") return;
    try {
      const encoded = encodeURIComponent(imageUrl.trim());
      window.open("https://lens.google.com/uploadbyurl?url=" + encoded, "_blank", "noopener");
    } catch (_) {}
  }

  function scoreClass(score) {
    if (score <= 33) return "low";
    if (score <= 66) return "medium";
    return "high";
  }

  function renderPanel(result, imageUrl, limitInfo) {
    const panel = document.getElementById("bs-meter-panel");
    const scoreEl = document.getElementById("bs-meter-score");
    const reasonsEl = document.getElementById("bs-meter-reasons");
    const lensWrap = document.getElementById("bs-meter-lens-wrap");
    const limitEl = document.getElementById("bs-meter-limit-msg");
    const ctaEl = document.getElementById("bs-meter-cta");

    scoreEl.textContent = result.noReviews ? "—" : result.susScore;
    scoreEl.className = "bs-meter-score " + (result.noReviews ? "" : scoreClass(result.susScore));
    const noReviewMsg = result.noReviews
      ? (imageUrl ? "No reviews found. Use Dropship check to search the product image." : "No reviews found on this page.")
      : "No obvious red flags in sampled reviews.";
    reasonsEl.innerHTML = result.reasons.length
      ? result.reasons.map((r) => "<div class=\"bs-meter-detail\">" + escapeHtml(r) + "</div>").join("")
      : "<div class=\"bs-meter-detail\">" + escapeHtml(noReviewMsg) + "</div>";

    if (imageUrl && lensWrap) {
      lensWrap.style.display = "block";
      const lensBtn = document.getElementById("bs-meter-lens-btn");
      if (lensBtn) {
        lensBtn.onclick = function () { openGoogleLens(imageUrl); };
      }
    } else if (lensWrap) {
      lensWrap.style.display = "none";
    }

    if (limitEl) {
      limitEl.style.display = limitInfo && !limitInfo.isPro ? "block" : "none";
      if (limitInfo) limitEl.textContent = "Checks used today: " + limitInfo.checksUsed + " / " + limitInfo.limit;
    }
    if (ctaEl) ctaEl.style.display = limitInfo && !limitInfo.isPro ? "block" : "none";
    const alibabaCta = document.getElementById("bs-meter-alibaba-cta");
    if (alibabaCta) {
      alibabaCta.style.display = (isAlibaba(getHost()) && limitInfo && limitInfo.isPro && !limitInfo.hasAutoscan) ? "block" : "none";
    }
    panel.classList.add("visible");
  }

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function runCheck() {
    canRunCheck().then(function (limitInfo) {
      if (!limitInfo.allowed) {
        const panel = document.getElementById("bs-meter-panel");
        const scoreEl = document.getElementById("bs-meter-score");
        const reasonsEl = document.getElementById("bs-meter-reasons");
        const limitEl = document.getElementById("bs-meter-limit-msg");
        const ctaEl = document.getElementById("bs-meter-cta");
        const lensWrap = document.getElementById("bs-meter-lens-wrap");
        scoreEl.textContent = "—";
        scoreEl.className = "bs-meter-score";
        reasonsEl.innerHTML = "<div class=\"bs-meter-detail\">Daily free limit reached. Go Pro for unlimited checks.</div>";
        if (lensWrap) lensWrap.style.display = "none";
        if (limitEl) { limitEl.style.display = "block"; limitEl.textContent = "Checks used: " + limitInfo.checksUsed + " / " + limitInfo.limit; }
        if (ctaEl) ctaEl.style.display = "block";
        panel.classList.add("visible");
        return;
      }

      const reviewTexts = getReviewTexts(MAX_REVIEWS);
      const result = analyzeReviews(reviewTexts);
      const imageUrl = getProductImageUrl();

      incrementCheckCount().then(function () {
        canRunCheck().then(function (updated) {
          renderPanel(result, imageUrl, updated);
        });
      });
    });
  }

  function injectUI() {
    if (document.getElementById("bs-meter-float")) return;
    if (!isProductPage()) return;

    const float = document.createElement("div");
    float.id = "bs-meter-float";

    const btn = document.createElement("button");
    btn.id = "bs-meter-btn";
    btn.type = "button";
    btn.innerHTML = "💩 BS Meter";
    btn.addEventListener("click", function () {
      const panel = document.getElementById("bs-meter-panel");
      if (panel.classList.contains("visible")) {
        panel.classList.remove("visible");
      } else {
        runCheck();
      }
    });

    const panel = document.createElement("div");
    panel.id = "bs-meter-panel";
    panel.innerHTML =
      "<h3>Sus Score</h3>" +
      "<div id=\"bs-meter-score\" class=\"bs-meter-score\">—</div>" +
      "<div id=\"bs-meter-reasons\"></div>" +
      "<div id=\"bs-meter-lens-wrap\" style=\"display:none\"><button type=\"button\" id=\"bs-meter-lens-btn\">🔍 Dropship check (Google Lens)</button></div>" +
      "<div id=\"bs-meter-limit-msg\" class=\"bs-meter-limit-msg\" style=\"display:none\"></div>" +
      "<div id=\"bs-meter-cta\" class=\"bs-meter-cta\" style=\"display:none\"><a href=\"https://bsmeter.vercel.app\" target=\"_blank\" rel=\"noopener\">Go Pro — Unlimited checks</a></div>" +
      "<div id=\"bs-meter-alibaba-cta\" class=\"bs-meter-cta\" style=\"display:none\"><a href=\"https://bsmeter.vercel.app\" target=\"_blank\" rel=\"noopener\">Upgrade to Autoscan — Alibaba + auto-scan</a></div>";

    float.appendChild(btn);
    document.body.appendChild(float);
    document.body.appendChild(panel);
  }

  function maybeAutoScan() {
    if (!isAlibaba(getHost()) || !isProductPage()) return;
    chrome.storage.local.get([STORAGE_KEYS.hasAutoscan], function (data) {
      if (data[STORAGE_KEYS.hasAutoscan]) {
        setTimeout(runCheck, 1500);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      injectUI();
      maybeAutoScan();
    });
  } else {
    injectUI();
    maybeAutoScan();
  }
})();
