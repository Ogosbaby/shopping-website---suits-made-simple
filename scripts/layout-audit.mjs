// =============================================================================
// Suits Made Simple — responsive layout audit
//
// Drives the locally installed Chrome over the DevTools Protocol (no npm
// dependencies) and reports, for every page at every breakpoint:
//
//   • horizontal overflow, with the elements that cause it
//   • broken images
//   • undersized tap targets on touch viewports
//   • runtime exceptions and console errors
//
// Screenshots are written to `public/_review/`, which the running server serves,
// so they can be opened at http://localhost:3000/_review/<route>-<width>.png
//
//   node scripts/layout-audit.mjs
//   node scripts/layout-audit.mjs --base http://localhost:3000 --only /,/shop
// =============================================================================

import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const ROOT = process.cwd();
// Served by the app so the screenshots can be opened in a browser; ignored by git.
const REVIEW_DIR = path.join(ROOT, "public", "_review");
const PROFILE_DIR = path.join(ROOT, ".cache", "chrome-profile");
const PORT = 9333;

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844, mobile: true },
  { name: "tablet", width: 768, height: 1024, mobile: true },
  { name: "desktop", width: 1440, height: 900, mobile: false },
  { name: "wide", width: 1920, height: 1080, mobile: false },
];

const ROUTES = [
  { path: "/", slug: "home" },
  { path: "/shop", slug: "shop" },
  { path: "/shop?colour=Grey", slug: "shop-colour" },
  { path: "/shop?occasion=Sunday%20Service", slug: "shop-occasion" },
  { path: "/fit-guide", slug: "fit-guide" },
  { path: "/products/the-vineyard-linen", slug: "product" },
  { path: "/cart", slug: "cart" },
  { path: "/checkout", slug: "checkout" },
  { path: "/login", slug: "login" },
];

/**
 * Runs in the page. Returns everything the report needs about the layout.
 */
const PROBE = `(() => {
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  const describe = (el) => {
    const cls = typeof el.className === "string" ? el.className : "";
    const text = (el.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 42);
    return (
      el.tagName.toLowerCase() +
      (el.id ? "#" + el.id : "") +
      (cls ? "." + cls.split(/\\s+/).filter(Boolean).slice(0, 2).join(".") : "") +
      (text ? ' "' + text + '"' : "")
    );
  };

  const offenders = [];
  const scrollers = new Set();
  for (const el of document.body.querySelectorAll("*")) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    if (window.getComputedStyle(el).overflowX === "auto" || window.getComputedStyle(el).overflowX === "scroll") {
      scrollers.add(el);
    }
    const spillsRight = rect.right > vw + 1;
    const spillsLeft = rect.left < -1;
    if (spillsRight || spillsLeft) {
      // Ignore anything inside a container that intentionally scrolls.
      let scroller = el.parentElement;
      let contained = false;
      while (scroller) {
        if (scrollers.has(scroller)) { contained = true; break; }
        scroller = scroller.parentElement;
      }
      if (contained) continue;
      if (el.closest("[aria-hidden='true']") && el.closest("[aria-hidden='true']") !== el) continue;
      offenders.push({
        what: describe(el),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
      });
    }
  }

  const brokenImages = [...document.images]
    .filter((img) => img.complete && img.naturalWidth === 0)
    .map((img) => img.currentSrc || img.src);

  const smallTargets = [];
  for (const el of document.querySelectorAll("a, button, input, select, [role='tab']")) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    if (rect.height < 28 || rect.width < 20) {
      smallTargets.push({ what: describe(el), w: Math.round(rect.width), h: Math.round(rect.height) });
    }
  }

  return {
    vw,
    vh,
    scrollWidth: document.documentElement.scrollWidth,
    overflow: document.documentElement.scrollWidth - vw,
    docHeight: document.documentElement.scrollHeight,
    offenders: offenders.slice(0, 12),
    offenderCount: offenders.length,
    brokenImages,
    smallTargets: smallTargets.slice(0, 12),
    smallTargetCount: smallTargets.length,
    images: document.images.length,
  };
})()`;

function findChrome() {
  for (const candidate of CHROME_CANDIDATES) {
    if (candidate && existsSync(candidate)) return candidate;
  }
  throw new Error("Chrome not found. Set CHROME_PATH to the browser executable.");
}

async function main() {
  const args = process.argv.slice(2);
  const baseIndex = args.indexOf("--base");
  const base = baseIndex >= 0 ? args[baseIndex + 1] : "http://localhost:3000";
  const onlyIndex = args.indexOf("--only");
  const only = onlyIndex >= 0 ? args[onlyIndex + 1]?.split(",") : null;
  const routes = only ? ROUTES.filter((route) => only.includes(route.path)) : ROUTES;

  await mkdir(REVIEW_DIR, { recursive: true });
  await mkdir(PROFILE_DIR, { recursive: true });

  const chrome = findChrome();
  const child = spawn(
    chrome,
    [
      "--headless=new",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${PROFILE_DIR}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      "--hide-scrollbars",
      "--disable-extensions",
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  let failures = 0;
  let audit = null;

  try {
    const target = await waitForTarget();
    audit = await connect(target.webSocketDebuggerUrl);
    await audit.send("Page.enable");
    await audit.send("Runtime.enable");
    await audit.send("Log.enable");

    for (const viewport of VIEWPORTS) {
      await audit.send("Emulation.setDeviceMetricsOverride", {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1,
        mobile: viewport.mobile,
      });

      for (const route of routes) {
        const url = `${base}${route.path}`;
        audit.resetLog();

        await audit.send("Page.navigate", { url });
        await waitForReady(audit);

        const probe = await audit.evaluate(PROBE);
        const log = audit.takeLog();

        const label = `${viewport.name.padEnd(8)} ${route.path}`;
        const problems = [];
        if (probe.overflow > 1) problems.push(`OVERFLOW ${probe.overflow}px`);
        if (probe.brokenImages.length) problems.push(`${probe.brokenImages.length} broken img`);
        if (log.errors.length) problems.push(`${log.errors.length} console error(s)`);

        if (problems.length === 0) {
          console.log(`  ok    ${label}`);
        } else {
          failures += 1;
          console.log(`  FAIL  ${label}  ${problems.join(", ")}`);
          if (probe.overflow > 1) {
            console.log(`          offenders (${probe.offenderCount}):`);
            for (const offender of probe.offenders) {
              console.log(`            ${offender.left}…${offender.right} (w ${offender.width})  ${offender.what}`);
            }
          }
          for (const src of probe.brokenImages) console.log(`          broken: ${src}`);
          for (const error of log.errors) console.log(`          log: ${error}`);
        }

        if (probe.smallTargetCount > 0) {
          console.log(`          note: ${probe.smallTargetCount} small tap target(s)`);
          for (const target of probe.smallTargets) {
            console.log(`            ${target.w}x${target.h}  ${target.what}`);
          }
        }

        const shot = await audit.send("Page.captureScreenshot", { format: "png" });
        await writeFile(
          path.join(REVIEW_DIR, `${route.slug}-${viewport.width}.png`),
          Buffer.from(shot.data, "base64")
        );
      }
    }
  } finally {
    if (audit) audit.close();
    child.kill();
  }

  console.log(`\nScreenshots: ${path.relative(ROOT, REVIEW_DIR)}`);
  if (failures > 0) {
    console.log(`${failures} check(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log("No layout breaks found.");
  }
}

async function waitForReady(audit, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  // Let the load event settle and webfonts swap before measuring.
  await new Promise((resolve) => setTimeout(resolve, 450));
  while (Date.now() < deadline) {
    const state = await audit.evaluate("document.readyState");
    if (state === "complete") break;
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  await audit.evaluate("document.fonts && document.fonts.ready");
  await new Promise((resolve) => setTimeout(resolve, 350));
}

async function waitForTarget() {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const targets = await response.json();
      const page = targets.find((entry) => entry.type === "page" && entry.webSocketDebuggerUrl);
      if (page) return page;
    } catch {
      // DevTools endpoint is not up yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Chrome DevTools endpoint did not become available.");
}

function connect(url) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    const pending = new Map();
    const listeners = new Set();
    let nextId = 0;
    let log = { errors: [] };

    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && pending.has(message.id)) {
        const { resolve: done, reject: fail } = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) fail(new Error(`${message.error.message}`));
        else done(message.result);
        return;
      }
      for (const listener of listeners) listener(message);
    });

    const events = (message) => {
      if (message.method === "Runtime.exceptionThrown") {
        const details = message.params?.exceptionDetails;
        log.errors.push(details?.exception?.description ?? details?.text ?? "exception");
      }
      if (message.method === "Log.entryAdded" && message.params?.entry?.level === "error") {
        log.errors.push(message.params.entry.text);
      }
    };

    socket.addEventListener("open", () => {
      listeners.add(events);
      resolve({
        send(method, params = {}) {
          const id = (nextId += 1);
          socket.send(JSON.stringify({ id, method, params }));
          return new Promise((done, fail) => {
            pending.set(id, { resolve: done, reject: fail });
            setTimeout(() => {
              if (pending.delete(id)) fail(new Error(`${method} timed out`));
            }, 30_000);
          });
        },
        async evaluate(expression) {
          const result = await this.send("Runtime.evaluate", {
            expression,
            returnByValue: true,
            awaitPromise: true,
          });
          return result?.result?.value;
        },
        resetLog() {
          log = { errors: [] };
        },
        takeLog() {
          return { errors: [...new Set(log.errors)] };
        },
        close() {
          socket.close();
        },
      });
    });

    socket.addEventListener("error", () => reject(new Error("Failed to connect to Chrome.")));
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
