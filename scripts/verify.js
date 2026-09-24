const fs = require("fs");
let fail = 0;
const ok = (c, m) => { console.log((c ? "PASS" : "FAIL") + "  " + m); if (!c) fail++; };

const html = fs.readFileSync("index.html", "utf8");
const css = fs.readFileSync("css/styles.css", "utf8");
const js = fs.readFileSync("js/main.js", "utf8");

// --- HTML essentials ---
ok(html.includes("<title>Mathavan Uma Mageshwari | Independent Author | THE LAST BLADE</title>"), "Page title exact");
ok(html.includes("Official website of Mathavan Uma Mageshwari, independent author of THE LAST BLADE, a cinematic revenge thriller about family, secrets, betrayal, survival, and revenge."), "Meta description exact");
const amazonCount = (html.match(/amzn\.in\/d\/0e9SRNmb/g) || []).length;
ok(amazonCount >= 6, "Amazon link appears " + amazonCount + " times (buttons + JSON-LD + FAQ + press references)");
const emailCount = (html.match(/madhavan4356@gmail\.com/g) || []).length;
ok(emailCount >= 4, "Author email appears 4+ times (got " + emailCount + ")");
["og:title", "og:description", "og:image", "twitter:card", "twitter:title", "twitter:description", "twitter:image"].forEach(t => ok(html.includes(t), "Meta present: " + t));
["home", "book", "about-book", "about", "journey", "contact", "buy", "nav-menu", "top"].forEach(id => ok(html.includes("id=\"" + id + "\""), "Section id: " + id));
["MATHAVAN UMA MAGESHWARI", "THE LAST BLADE", "A Cinematic Revenge Thriller of Family, Secrets, and Survival", "THE PAST NEVER STAYS BURIED.", "CONTACT THE AUTHOR", "Read About the Book", "Buy on Amazon", "Published", "Genre", "Lucy thought she had left the darkness behind", "Debut novel", "More stories to come", "All rights reserved"].forEach(s => ok(html.includes(s), "Content: " + s));
ok(!/drop--|butt --|<\/lb>|<paragraph|pointer-full|align-wrap|@ld:|WEBSITE_WATERTIGHT|data-remove|<a class="corrupted/.test(html), "No corrupted leftovers");

// tag balance quick check
const count = (re) => (html.match(re) || []).length;
ok(count(/<section\b/g) === count(/<\/section>/g), "section tags balanced (" + count(/<section\b/g) + ")");
ok(count(/<div\b/g) === count(/<\/div>/g), "div tags balanced (" + count(/<div\b/g) + ")");
ok(count(/<a\b/g) === count(/<\/a>/g), "a tags balanced (" + count(/<a\b/g) + ")");
ok(count(/<button\b/g) === count(/<\/button>/g), "button tags balanced");
ok(count(/<ul\b/g) === count(/<\/ul>/g) && count(/<ol\b/g) === count(/<\/ol>/g) && count(/<li\b/g) === count(/<\/li>/g), "list tags balanced");

// --- CSS ---
const openBraces = (css.match(/{/g) || []).length, closeBraces = (css.match(/}/g) || []).length;
ok(openBraces === closeBraces, "CSS braces balanced (" + openBraces + "/" + closeBraces + ")");
ok(!css.includes("align-wrap") && !css.includes("pointer-full"), "No invalid CSS props");
["--accent", "#0c0b0a", "prefers-reduced-motion", "@media (max-width: 760px)"].forEach(s => ok(css.includes(s), "CSS has: " + s));

// --- JS ---
try { new Function(js); ok(true, "JS parses cleanly"); } catch (e) { ok(false, "JS parse error: " + e.message); }

// --- SVG assets ---
["assets/book-cover.svg", "assets/og-image.svg", "assets/favicon.svg", "assets/apple-touch-icon.svg"].forEach(f => {
  const s = fs.readFileSync(f, "utf8").trim();
  ok(s.startsWith("<svg") && s.endsWith("</svg>"), f + " well-formed");
});
ok(fs.existsSync("robots.txt"), "robots.txt exists");

// --- Motion layer ---
ok(html.includes("class=\"no-js\""), "no-js guard on html element");
ok(html.includes("id=\"intro\""), "intro overlay present");
ok(html.includes("progress-bar"), "scroll progress bar present");
ok(html.includes("data-parallax=\"0.12\"") && html.includes("data-parallax=\"-0.06\""), "parallax attributes present");
ok(css.includes(".intro__mark") && css.includes(".progress-bar"), "motion CSS present");
ok(css.includes(".no-js .reveal") && css.includes(".no-js .intro"), "no-js fallbacks present");
ok(css.includes(".nav__link.is-active"), "active nav styling present");
ok(js.includes("tlb:intro-done") && js.includes("is-split-in"), "hero split-in logic present");
ok(js.includes("pointermove"), "tilt interaction present");

// --- Real images & latest features ---
const imgCheck = (f, minKB) => {
  const p = "assets/" + f;
  if (fs.existsSync(p)) {
    const kb = Math.round(fs.statSync(p).size / 1024);
    ok(kb >= minKB && kb < 600, p + " exists, " + kb + "KB (reasonable size)");
  } else {
    ok(false, p + " missing");
  }
};
imgCheck("book-cover.jpg", 60);
imgCheck("og-image.jpg", 40);
imgCheck("author-portrait.jpg", 15);
ok(html.includes("assets/book-cover.jpg"), "HTML uses book-cover.jpg");
ok(!html.includes("book-cover.svg"), "old SVG cover fully replaced");
ok(html.includes("assets/og-image.jpg"), "OG meta uses og-image.jpg");
ok(!html.includes("og-image.svg"), "old SVG OG image fully replaced");
ok(html.includes("assets/author-portrait.jpg"), "portrait wired into About section");
ok(!html.includes("about__monogram"), "monogram placeholder removed");
ok(html.includes("data-rain-canvas"), "rain canvas element present");
ok(css.includes(".hero__rain-canvas") && css.includes(".about__portrait"), "new CSS present");
ok(css.includes("section-title::after") && css.includes("media-reveal"), "landing animations present");
ok(js.includes("getContext") && js.includes("requestAnimationFrame"), "rain canvas JS present");
ok(js.includes("startRain") && js.includes("stopRain"), "rain pause logic present");

// --- Journey choreography ---
ok(html.includes("timeline__progress") && html.includes('class="timeline__item"'), "journey markup updated (progress bar + plain items)");
ok(!html.includes('timeline__item reveal'), "items no longer individually observed");
ok(css.includes(".timeline__item.is-drawn") && css.includes(".timeline.has-drawn .timeline__progress"), "journey per-item choreography CSS present");
ok(css.includes(".no-js .timeline__item"), "no-js timeline fallback present");

// --- Year counter + footer/meta choreography ---
ok(html.includes('data-count="2026"'), "year counter attribute present");
ok(html.includes("footer__col reveal"), "footer columns choreographed");
ok(css.includes(".footer__col > *") && css.includes("--child-i"), "footer cascade CSS present");
ok(css.includes(".book__meta.is-visible .book__meta-row"), "meta row choreography CSS present");
ok(js.includes("runYearCounter") && js.includes("data-count"), "year counter JS present");
ok(js.includes("--meta-delay"), "meta stagger JS present");

// --- Per-item journey + no toggle + version e ---
ok(js.includes("tlItemObserver") && js.includes("drawItem"), "per-item journey observer present");
ok(!js.includes("motion-toggle") && !css.includes(".motion-toggle"), "motion toggle fully removed");
ok(css.includes(".timeline__item.is-drawn") && css.includes(".timeline.has-drawn .timeline__progress"), "per-item reveal CSS present");
ok(js.includes("runYearCounter"), "per-year counter function present");
ok(html.includes("20260924g"), "cache version bumped to g");
ok(html.includes("data-rain"), "original CSS rain present");

// --- Blade cursor, clickable hint, animated progress, ambient polish ---
ok(fs.existsSync("assets/blade-cursor.svg") && fs.existsSync("assets/blade-cursor-accent.svg"), "blade cursor assets exist");
ok(css.includes(".blade-cursor") && js.includes("blade-cursor"), "blade cursor wired (CSS + JS)");
ok(css.includes(".progress-bar__glow"), "animated progress bar glow present");
ok(html.includes("progress-bar__glow"), "progress glow element present");
ok(!html.includes("hero__scroll\" aria-hidden") , "scroll hint no longer aria-hidden");
ok(html.includes("aria-label=\"Scroll down to the book section\""), "scroll hint is a real button");
ok(js.includes("scrollHint"), "scroll hint click handler present");
ok(css.includes(".eyebrow.is-visible") && css.includes("tl-shimmer"), "ambient polish present");
ok(!css.includes("transition-duration: 0.01ms !important"), "legacy animation-killer block removed");
ok(html.includes("20260924g"), "cache version bumped to g");

console.log(fail === 0 ? "\nALL CHECKS PASSED" : "\n" + fail + " CHECK(S) FAILED");
process.exit(fail === 0 ? 0 : 1);
