const { spawn } = require("node:child_process");
const os = require("node:os");
const path = require("node:path");

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const debuggingPort = 9333;
const browser = spawn(
  edgePath,
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    `--remote-debugging-port=${debuggingPort}`,
    `--user-data-dir=${path.join(os.tmpdir(), "amg-e2e-profile")}`,
    "http://127.0.0.1:4173",
  ],
  { stdio: "ignore" },
);

let socket;
let commandId = 0;
const pending = new Map();
const exceptions = [];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDebugger() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const pages = await fetch(`http://127.0.0.1:${debuggingPort}/json/list`).then((response) =>
        response.json(),
      );
      const page = pages.find((item) => item.type === "page");
      if (page) return page;
    } catch {
      // Edge is still starting.
    }
    await delay(200);
  }
  throw new Error("Edge DevTools no respondió.");
}

function send(method, params = {}) {
  const id = ++commandId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
  });
}

async function evaluate(expression) {
  const response = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.text || "Error al ejecutar la prueba.");
  }
  return response.result?.value;
}

async function run() {
  const page = await waitForDebugger();
  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const request = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
    }
    if (message.method === "Runtime.exceptionThrown") {
      exceptions.push(message.params.exceptionDetails.text);
    }
  });

  await send("Runtime.enable");
  await send("Page.enable");
  await send("Page.reload", { ignoreCache: true });
  await delay(500);
  await evaluate(`localStorage.clear()`);
  await send("Page.reload", { ignoreCache: true });
  await delay(1800);

  const initial = await evaluate(`({
    title: document.title,
    cards: document.querySelectorAll(".product-card").length,
    categories: [...document.querySelectorAll("[data-category]")].map((button) => button.textContent.trim()),
    products: [...document.querySelectorAll(".product-title")].map((item) => item.textContent.trim()),
    images: [...document.querySelectorAll(".product-media img")].map((image) => ({
      src: image.getAttribute("src"),
      loaded: image.complete && image.naturalWidth > 0
    })),
    tierBlocks: document.querySelectorAll(".product-tiers").length,
    status: document.querySelector("[data-status-text]")?.textContent.trim(),
    hasConfig: Boolean(window.AMG_CONFIG)
  })`);

  await evaluate(`document.querySelector("[data-add-product]").click()`);
  await delay(150);
  const afterAdd = await evaluate(`({
    count: document.querySelector("[data-cart-count]").textContent.trim(),
    saved: JSON.parse(localStorage.getItem("amg-cart-v1") || "[]").length
  })`);

  await evaluate(`document.querySelector("[data-open-cart]").click()`);
  await delay(150);
  const drawer = await evaluate(`({
    open: document.querySelector("#cart-drawer").classList.contains("is-open"),
    items: document.querySelectorAll(".cart-item").length,
    checkoutVisible: !document.querySelector("[data-cart-footer]").hidden
  })`);

  await evaluate(`document.querySelector("[data-checkout]").click()`);
  await delay(150);
  const checkout = await evaluate(`({
    open: document.querySelector("#checkout-dialog").open,
    fields: document.querySelectorAll("#order-form input, #order-form textarea").length,
    previewItems: document.querySelectorAll(".preview-item").length,
    total: document.querySelector("[data-checkout-total]").textContent.trim()
  })`);

  await evaluate(`document.querySelector("[data-submit-order]").click()`);
  await delay(100);
  const validation = await evaluate(`({
    errors: document.querySelectorAll(".field.has-error").length,
    focusedField: document.activeElement?.getAttribute("name"),
    stillOpen: document.querySelector("#checkout-dialog").open
  })`);

  await evaluate(`(() => {
    const form = document.querySelector("#order-form");
    form.elements.name.value = "Cliente de prueba";
    form.elements.company.value = "Tienda de prueba";
    form.elements.phone.value = "+58 412 000 0000";
    form.elements.email.value = "prueba@example.com";
    form.elements.notes.value = "Prueba local, no enviar.";
    window.__submittedOrder = null;
    window.fetch = async (url, options = {}) => {
      window.__submittedOrder = { url: String(url), body: JSON.parse(options.body || "{}") };
      return new Response(JSON.stringify({ success: "true", message: "OK" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    };
    document.querySelector("[data-submit-order]").click();
  })()`);
  await delay(250);
  const submitted = await evaluate(`({
    url: window.__submittedOrder?.url,
    orderNumber: window.__submittedOrder?.body?.order_number,
    hasItems: Boolean(window.__submittedOrder?.body?.order_items),
    messageHasSku: window.__submittedOrder?.body?.message?.includes("SKU") ?? false,
    successVisible: !document.querySelector("[data-checkout-success]").hidden,
    cartCleared: JSON.parse(localStorage.getItem("amg-cart-v1") || "[]").length === 0
  })`);

  const result = { initial, afterAdd, drawer, checkout, validation, submitted, exceptions };
  console.log(JSON.stringify(result, null, 2));

  const passed =
    initial.cards > 0 &&
    initial.hasConfig &&
    initial.tierBlocks > 0 &&
    afterAdd.count === "1" &&
    afterAdd.saved === 1 &&
    drawer.open &&
    drawer.items === 1 &&
    drawer.checkoutVisible &&
    checkout.open &&
    checkout.fields >= 5 &&
    checkout.previewItems === 1 &&
    validation.errors === 2 &&
    validation.stillOpen &&
    submitted.url.includes("formsubmit.co") &&
    submitted.orderNumber?.startsWith("AMG-") &&
    submitted.hasItems &&
    submitted.successVisible &&
    submitted.cartCleared &&
    exceptions.length === 0;

  if (!passed) process.exitCode = 1;
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      socket?.close();
    } catch {
      // Ignore socket cleanup errors.
    }
    browser.kill();
  });
