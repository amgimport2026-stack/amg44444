const fs = require("node:fs");
const html = fs.readFileSync("scripts/rendered.html", "utf8");
const productCards = (html.match(/class="product-card"/g) || []).length;
const categoryChips = (html.match(/class="category-chip/g) || []).length;
const status = html.match(/<span data-status-text>([^<]+)<\/span>/)?.[1] || "not found";
const scripts = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map((match) => match[1]);

console.log({ bytes: Buffer.byteLength(html), productCards, categoryChips, status, scripts });
console.log("Includes fixture SKU:", html.includes("DEMO-101"));
console.log("Ends with:", html.slice(-300));
const gridStart = html.indexOf('id="product-grid"');
console.log("Grid start:", html.slice(gridStart, gridStart + 5000));
