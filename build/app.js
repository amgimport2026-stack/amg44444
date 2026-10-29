const FALLBACK_PRODUCTS = [
  {
    sku: "DEMO-101",
    category: "Pelotas",
    name: "Balón Fútbol Pro",
    price: 8.5,
    description: "Balón resistente para juego recreativo y entrenamiento.",
    art: "ball",
  },
  {
    sku: "DEMO-102",
    category: "Muñecas",
    name: "Muñeca Sonrisa",
    price: 12,
    description: "Muñeca con vestido colorido y accesorios básicos.",
    art: "doll",
  },
  {
    sku: "DEMO-103",
    category: "Vehículos",
    name: "Camión Constructor",
    price: 10.75,
    description: "Camión de juego con partes móviles de fácil manejo.",
    art: "truck",
  },
  {
    sku: "DEMO-104",
    category: "Didácticos",
    name: "Bloques Creativos",
    price: 9.25,
    description: "Set de construcción para estimular la imaginación.",
    art: "blocks",
  },
  {
    sku: "DEMO-105",
    category: "Aire libre",
    name: "Cometa Arcoíris",
    price: 6.9,
    description: "Cometa liviana, ideal para compartir al aire libre.",
    art: "kite",
  },
  {
    sku: "DEMO-106",
    category: "Peluchitos",
    name: "Oso Abrazo",
    price: 11.5,
    description: "Peluche de textura suave en un tamaño fácil de exhibir.",
    art: "bear",
  },
  {
    sku: "DEMO-107",
    category: "Juegos",
    name: "Mini Chef",
    price: 14.2,
    description: "Juego simbólico con utensilios para horas de diversión.",
    art: "chef",
  },
  {
    sku: "DEMO-108",
    category: "Didácticos",
    name: "Rompecabezas Safari",
    price: 7.45,
    description: "Piezas grandes y coloridas con ilustraciones de animales.",
    art: "puzzle",
  },
  {
    sku: "DEMO-109",
    category: "Vehículos",
    name: "Carrito Rally",
    price: 5.8,
    description: "Vehículo compacto de diseño deportivo y ruedas libres.",
    art: "car",
  },
  {
    sku: "DEMO-110",
    category: "Aire libre",
    name: "Burbujas Party",
    price: 4.95,
    description: "Entretenimiento práctico para reuniones y celebraciones.",
    art: "bubbles",
  },
  {
    sku: "DEMO-111",
    category: "Peluchitos",
    name: "Conejito Nube",
    price: 9.9,
    description: "Peluche suave con acabado delicado y orejas largas.",
    art: "rabbit",
  },
  {
    sku: "DEMO-112",
    category: "Juegos",
    name: "Set Doctor",
    price: 13.6,
    description: "Kit de roles para estimular el juego en equipo.",
    art: "doctor",
  },
];

const DEFAULT_CONFIG = {
  brandName: "AMG Juguetes",
  orderEmail: "1813638105@qq.com",
  whatsappNumber: "",
  sheetId: "1t3iEuHJabAXqDnyYL0ppdlEJcd0q5JsZZJQInDvnnyY",
  sheetName: "",
  formProvider: "formsubmit",
  formEndpoint: "",
  web3formsAccessKey: "",
  currency: "USD",
  locale: "es-VE",
  showDemoNotice: true,
};

const config = { ...DEFAULT_CONFIG, ...(window.AMG_CONFIG || {}) };
const CART_KEY = "amg-cart-v1";
const DEMO_PALETTES = ["#e6eefc", "#fff1b9", "#f8ded8", "#dff1e7", "#e8e2f8", "#f7e5d5"];
const state = {
  products: [],
  category: "all",
  search: "",
  sort: "featured",
  cart: loadCart(),
  dataSource: "loading",
  isSubmitting: false,
};

const elements = {
  grid: document.querySelector("#product-grid"),
  empty: document.querySelector("#catalog-empty"),
  categoryFilter: document.querySelector("#category-filter"),
  search: document.querySelector("#product-search"),
  sort: document.querySelector("#product-sort"),
  resultsCount: document.querySelector("[data-results-count]"),
  catalogStatus: document.querySelector("[data-catalog-status]"),
  statusText: document.querySelector("[data-status-text]"),
  clearFilters: [...document.querySelectorAll("[data-clear-filters]")],
  cartCount: [...document.querySelectorAll("[data-cart-count]")],
  cartDrawer: document.querySelector("#cart-drawer"),
  drawerBackdrop: document.querySelector("[data-drawer-backdrop]"),
  cartItems: document.querySelector("[data-cart-items]"),
  cartEmpty: document.querySelector("[data-cart-empty]"),
  cartFilled: document.querySelector("[data-cart-filled]"),
  cartFooter: document.querySelector("[data-cart-footer]"),
  cartSubtotal: document.querySelector("[data-cart-subtotal]"),
  checkoutDialog: document.querySelector("#checkout-dialog"),
  orderForm: document.querySelector("#order-form"),
  checkoutItems: document.querySelector("[data-checkout-items]"),
  checkoutCount: document.querySelector("[data-checkout-count]"),
  checkoutTotal: document.querySelector("[data-checkout-total]"),
  checkoutSuccess: document.querySelector("[data-checkout-success]"),
  orderCode: document.querySelector("[data-order-code]"),
  formMessage: document.querySelector("[data-form-message]"),
  submitOrder: document.querySelector("[data-submit-order]"),
  toast: document.querySelector("[data-toast]"),
};

let toastTimer;

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeHeader(value) {
  return normalizeText(value).replace(/[^a-z0-9\u4e00-\u9fff]+/g, "");
}

function parseNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const cleaned = String(value ?? "")
    .replace(/[^\d,.-]/g, "")
    .replace(/(?!^)-/g, "");

  if (!cleaned) return 0;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normalized = cleaned;

  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) {
      normalized = cleaned.replaceAll(".", "").replace(",", ".");
    } else {
      normalized = cleaned.replaceAll(",", "");
    }
  } else if (lastComma >= 0) {
    const decimals = cleaned.length - lastComma - 1;
    normalized = decimals > 0 && decimals <= 2 ? cleaned.replace(",", ".") : cleaned.replaceAll(",", "");
  } else if ((cleaned.match(/\./g) || []).length > 1) {
    normalized = cleaned.replaceAll(".", "");
  }

  const number = Number.parseFloat(normalized);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function normalizeImageUrl(value) {
  const source = String(value ?? "").trim();
  let url = source;
  if (!url) return "";

  const bbcodeImage = url.match(/\[img\](.*?)\[\/img\]/i);
  const htmlImage = url.match(/<img[^>]+src\s*=\s*["']([^"']+)["']/i);
  if (bbcodeImage?.[1]) {
    url = bbcodeImage[1].trim();
  } else if (htmlImage?.[1]) {
    url = htmlImage[1].trim();
  } else {
    const urls = url.match(/https?:\/\/[^\s[\]<>"']+/gi) || [];
    const directImage = urls.find(
      (candidate) =>
        /\.(?:avif|gif|jpe?g|png|webp)(?:\?.*)?$/i.test(candidate) ||
        /(?:i\.postimg\.cc|images\.|imagekit\.io|cloudinary\.com)/i.test(candidate),
    );
    url = directImage || urls[0] || url;
  }

  url = url.replaceAll("&amp;", "&");
  if (url.startsWith("//")) url = `https:${url}`;
  if (!/^https?:\/\//i.test(url)) return "";

  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
  if (driveMatch) {
    return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(driveMatch[1])}`;
  }

  if (/dropbox\.com/i.test(url)) {
    const parsed = new URL(url);
    parsed.searchParams.set("raw", "1");
    parsed.searchParams.delete("dl");
    return parsed.toString();
  }

  return url;
}

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function cleanCategory(value) {
  const parts = String(value ?? "")
    .split(/\r?\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length ? parts.join(" · ") : "Otros";
}

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    if (!Array.isArray(saved)) return [];

    return saved
      .filter((item) => item && String(item.sku ?? "").trim())
      .map((item) => ({
        sku: String(item.sku),
        name: String(item.name ?? ""),
        category: String(item.category ?? ""),
        price: Math.max(0, Number(item.price) || 0),
        image: normalizeImageUrl(item.image),
        backupImage: normalizeImageUrl(item.backupImage),
        quantity: Math.min(999, Math.max(1, Math.floor(Number(item.quantity) || 1))),
        demo: Boolean(item.demo),
        art: DEMO_PALETTES.includes(item.art) ? "blocks" : String(item.art || "blocks"),
      }));
  } catch {
    return [];
  }
}

function saveCart() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
  } catch {
    showToast("No se pudo guardar el pedido en este navegador.");
  }
}

function formatPrice(value) {
  try {
    return new Intl.NumberFormat(config.locale || "es-VE", {
      style: "currency",
      currency: config.currency || "USD",
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);
  } catch {
    return `$${(Number(value) || 0).toFixed(2)}`;
  }
}

function getProductIdentity(product, index) {
  const sku = String(product.sku || `SIN-SKU-${index + 1}`).trim();
  return {
    ...product,
    sku,
    id: sku || `product-${index + 1}`,
  };
}

function createFallbackProducts() {
  return FALLBACK_PRODUCTS.map((product, index) =>
    getProductIdentity(
      {
        ...product,
        image: "",
        backupImage: "",
        demo: true,
        palette: DEMO_PALETTES[index % DEMO_PALETTES.length],
      },
      index,
    ),
  );
}

function buildSheetEndpoint() {
  if (!config.sheetId) return "";
  const endpoint = new URL(
    `https://docs.google.com/spreadsheets/d/${encodeURIComponent(config.sheetId)}/gviz/tq`,
  );
  endpoint.searchParams.set("tqx", "out:json");
  if (config.sheetName) endpoint.searchParams.set("sheet", config.sheetName);
  endpoint.searchParams.set("_", String(Date.now()));
  return endpoint.toString();
}

function extractVisualizationPayload(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("La respuesta de Google Sheets no es JSON.");
  }
  return JSON.parse(text.slice(start, end + 1));
}

function readCell(cell) {
  if (!cell) return "";
  if (cell.f !== undefined && cell.f !== null) return cell.f;
  if (cell.v !== undefined && cell.v !== null) return cell.v;
  return "";
}

function headerMatches(header, aliases) {
  return aliases.some((alias) => header.includes(alias) || alias.includes(header));
}

function hasHeaderData(values) {
  const normalized = values.map(normalizeHeader);
  const known = [
    "categoria",
    "category",
    "分类",
    "nombre",
    "producto",
    "name",
    "商品名称",
    "sku",
    "货号",
    "precio",
    "price",
    "价格",
    "estado",
    "status",
    "状态",
  ];
  const hits = normalized.filter((value) => known.some((header) => headerMatches(value, [header]))).length;
  return hits >= 3;
}

function parseSheetPayload(payload) {
  const table = payload?.table;
  if (!table || !Array.isArray(table.rows)) {
    throw new Error("La hoja no contiene una tabla legible.");
  }

  let headers = (table.cols || []).map((column) => column?.label || column?.id || "");
  let firstDataRow = 0;
  const firstRowValues = (table.rows[0]?.c || []).map(readCell);

  if ((!headers.some(Boolean) || !hasHeaderData(headers)) && hasHeaderData(firstRowValues)) {
    headers = firstRowValues.map(String);
    firstDataRow = 1;
  }

  const normalizedHeaders = headers.map(normalizeHeader);
  const findColumn = (aliases) =>
    normalizedHeaders.findIndex((header) => header && headerMatches(header, aliases));

  const columns = {
    category: findColumn(["categoria", "category", "rubro", "分类"]),
    name: findColumn(["nombre", "producto", "articulo", "name", "商品名称", "产品名称"]),
    sku: findColumn(["sku", "codigo", "referencia", "货号", "编号"]),
    price: findColumn(["precio", "price", "preciounitario", "价格", "批发价"]),
    status: findColumn(["estado", "status", "状态"]),
    image: findColumn([
      "urlimagenprincipal",
      "imagenprincipal",
      "imagen",
      "foto",
      "image",
      "主图",
      "图片",
    ]),
    backupImage: findColumn([
      "urlimagenrespaldo",
      "imagenrespaldo",
      "urlimagenalternativa",
      "backupimage",
      "备用图片",
      "备用图",
    ]),
    description: findColumn(["descripcion", "notas", "description", "备注", "描述"]),
    packageLabel: findColumn(["paquete", "pack", "套装", "包装"]),
    packagePrice: findColumn(["paqueteprecio", "preciopaquete", "packprice"]),
    caseLabel: findColumn(["bulto", "caja", "箱", "整箱"]),
    casePrice: findColumn(["bultoprecio", "preciobulto", "boxprice", "caseprice"]),
  };

  if (columns.name < 0) {
    throw new Error("No se encontró la columna Nombre en la hoja.");
  }

  const valueAt = (cells, index) => (index >= 0 ? readCell(cells[index]) : "");
  const products = [];

  table.rows.slice(firstDataRow).forEach((row, rowIndex) => {
    const cells = row?.c || [];
    const name = cleanText(valueAt(cells, columns.name));
    if (!name) return;

    const rawStatus = normalizeText(valueAt(cells, columns.status));
    const inactiveStatuses = [
      "inactivo",
      "inactive",
      "desactivado",
      "no activo",
      "agotado",
      "oculto",
      "false",
      "0",
      "下架",
      "停用",
    ];
    if (rawStatus && inactiveStatuses.includes(rawStatus)) return;

    const rawPrice = valueAt(cells, columns.price);
    const sku = String(valueAt(cells, columns.sku)).trim() || `SIN-SKU-${rowIndex + 1}`;
    products.push(
      getProductIdentity(
        {
          sku,
          category: cleanCategory(valueAt(cells, columns.category)),
          name,
          price: parseNumber(rawPrice),
          priceLabel: String(rawPrice || "").trim(),
          description: cleanText(valueAt(cells, columns.description)),
          packageLabel: cleanText(valueAt(cells, columns.packageLabel)),
          packagePrice: parseNumber(valueAt(cells, columns.packagePrice)),
          caseLabel: cleanText(valueAt(cells, columns.caseLabel)),
          casePrice: parseNumber(valueAt(cells, columns.casePrice)),
          image: normalizeImageUrl(valueAt(cells, columns.image)),
          backupImage: normalizeImageUrl(valueAt(cells, columns.backupImage)),
          demo: false,
          art: "blocks",
          palette: DEMO_PALETTES[rowIndex % DEMO_PALETTES.length],
        },
        rowIndex,
      ),
    );
  });

  return products;
}

async function loadProducts() {
  const endpoint = buildSheetEndpoint();
  state.products = createFallbackProducts();
  state.dataSource = "demo";
  renderCatalog();
  renderCart();

  if (!endpoint) {
    useFallbackCatalog("Catálogo de muestra");
    return;
  }

  setCatalogStatus("Sincronizando catálogo...", "loading");
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(endpoint, {
      cache: "no-store",
      headers: { Accept: "application/json,text/plain,*/*" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Google Sheets respondió ${response.status}. Revisa el permiso de lectura.`);
    }

    const text = await response.text();
    const payload = extractVisualizationPayload(text);
    const products = parseSheetPayload(payload);

    state.products = products;
    state.dataSource = "sheet";
    state.cart = state.cart.filter((cartItem) => products.some((product) => product.sku === cartItem.sku));
    syncCartWithProducts();
    saveCart();
    renderCatalog();
    renderCart();
    setCatalogStatus(products.length ? "Catálogo actualizado" : "Sin productos activos", "live");
  } catch (error) {
    console.warn("No se pudo cargar Google Sheets:", error);
    useFallbackCatalog("Catálogo de muestra");
  } finally {
    window.clearTimeout(timeout);
  }
}

function useFallbackCatalog(statusText) {
  state.products = createFallbackProducts();
  state.dataSource = "demo";
  renderCatalog();
  renderCart();
  setCatalogStatus(config.showDemoNotice ? statusText : "Catálogo disponible", "demo");
}

function setCatalogStatus(text, status) {
  elements.statusText.textContent = text;
  elements.catalogStatus.classList.toggle("is-loading", status === "loading");
  elements.catalogStatus.classList.toggle("is-demo", status === "demo");
}

function syncCartWithProducts() {
  state.cart = state.cart.map((cartItem) => {
    const product = state.products.find((candidate) => candidate.sku === cartItem.sku);
    if (!product) return cartItem;
    return {
      ...cartItem,
      name: product.name,
      category: product.category,
      price: product.price,
      image: product.image,
      backupImage: product.backupImage,
      demo: product.demo,
      art: product.art,
    };
  });
}

function uniqueCategories() {
  const seen = new Set();
  return state.products
    .map((product) => product.category || "Otros")
    .filter((category) => {
      const key = normalizeText(category);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.localeCompare(b, "es"));
}

function renderCategoryFilter() {
  const categories = uniqueCategories();
  const allButton = `
    <button class="category-chip ${state.category === "all" ? "is-active" : ""}" type="button" data-category="all">
      Todos <span>${state.products.length}</span>
    </button>`;
  const categoryButtons = categories
    .map((category) => {
      const count = state.products.filter(
        (product) => normalizeText(product.category) === normalizeText(category),
      ).length;
      return `
        <button
          class="category-chip ${state.category === category ? "is-active" : ""}"
          type="button"
          data-category="${escapeHTML(category)}"
        >
          ${escapeHTML(category)} <span>${count}</span>
        </button>`;
    })
    .join("");

  elements.categoryFilter.innerHTML = allButton + categoryButtons;
}

function getFilteredProducts() {
  const search = normalizeText(state.search);
  const products = state.products.filter((product) => {
    const matchesCategory =
      state.category === "all" || normalizeText(product.category) === normalizeText(state.category);
    const searchable = normalizeText(`${product.name} ${product.sku} ${product.category}`);
    return matchesCategory && (!search || searchable.includes(search));
  });

  return products.sort((a, b) => {
    if (state.sort === "name") return a.name.localeCompare(b.name, "es");
    if (state.sort === "price-low") return a.price - b.price;
    if (state.sort === "price-high") return b.price - a.price;
    return 0;
  });
}

function renderCatalog() {
  renderCategoryFilter();
  const filtered = getFilteredProducts();
  elements.grid.innerHTML = filtered
    .map((product, index) => renderProductCard(product, index))
    .join("");
  elements.grid.hidden = filtered.length === 0;
  elements.empty.hidden = filtered.length !== 0;
  elements.resultsCount.textContent = `${filtered.length} ${
    filtered.length === 1 ? "producto" : "productos"
  }`;
  const hasFilters = state.category !== "all" || Boolean(state.search);
  elements.clearFilters.forEach((button) => {
    button.hidden = !hasFilters;
  });
  bindImageFallbacks(elements.grid);
}

function renderProductCard(product, index) {
  const price = formatPrice(product.price);
  const tierMarkup =
    product.packageLabel || product.caseLabel
      ? `
        <div class="product-tiers">
          ${
            product.packageLabel && product.packagePrice
              ? `<span><small>Paquete · ${escapeHTML(product.packageLabel)}</small><strong>${formatPrice(
                  product.packagePrice,
                )}</strong></span>`
              : ""
          }
          ${
            product.caseLabel && product.casePrice
              ? `<span><small>Bulto · ${escapeHTML(product.caseLabel)}</small><strong>${formatPrice(
                  product.casePrice,
                )}</strong></span>`
              : ""
          }
        </div>`
      : "";
  return `
    <article class="product-card" style="animation-delay:${Math.min(index * 35, 280)}ms">
      <div class="product-media" style="--card-bg:${escapeHTML(product.palette || DEMO_PALETTES[index % DEMO_PALETTES.length])}">
        ${renderProductVisual(product)}
        <span class="product-category-badge">${escapeHTML(product.category || "Otros")}</span>
        ${product.demo ? '<span class="product-demo-badge">Vista previa</span>' : ""}
      </div>
      <div class="product-body">
        <p class="product-sku">SKU ${escapeHTML(product.sku)}</p>
        <h3 class="product-title">${escapeHTML(product.name)}</h3>
        ${
          product.description
            ? `<p class="product-description">${escapeHTML(product.description)}</p>`
            : '<p class="product-description">Consulta disponibilidad con nuestro equipo.</p>'
        }
        ${tierMarkup}
        <div class="product-footer">
          <span class="price-wrap">
            <small>Precio unidad</small>
            <strong class="product-price">${escapeHTML(price)}</strong>
          </span>
          <button
            class="add-button"
            type="button"
            data-add-product="${escapeHTML(product.sku)}"
            aria-label="Añadir ${escapeHTML(product.name)} al carrito"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            <span>Añadir</span>
          </button>
        </div>
      </div>
    </article>`;
}

function renderProductVisual(product) {
  const mainImage = normalizeImageUrl(product.image);
  const backupImage = normalizeImageUrl(product.backupImage);
  if (!mainImage) {
    return `<div class="product-art">${illustrationFor(product.art)}</div>`;
  }
  return `
    <img
      src="${escapeHTML(mainImage)}"
      alt="${escapeHTML(product.name)}"
      loading="lazy"
      data-main-image="${escapeHTML(mainImage)}"
      data-backup-image="${escapeHTML(backupImage)}"
    />
    <div class="product-art" hidden>${illustrationFor(product.art)}</div>`;
}

function illustrationFor(type = "blocks") {
  const common = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 160" aria-hidden="true"';
  const visuals = {
    ball: `<svg ${common}><circle cx="89" cy="80" r="51" fill="#fff8ea"/><circle cx="89" cy="80" r="40"/><path d="m89 40 16 18-5 26-22 8-17-20 8-25 20-7Zm16 18 28-7M78 112l-3 20M89 40l-7-22M75 60 47 49M111 92l26 15"/></svg>`,
    doll: `<svg ${common}><circle cx="91" cy="42" r="24" fill="#fff8ea"/><path d="M67 42c4-26 45-33 52 1M79 42h1m22 0h1m-16 9c5 4 10 4 15 0M88 66v15m-32 14 31-15 32 15-5 47H62l-6-47Zm12 19h39"/></svg>`,
    truck: `<svg ${common}><path d="M18 57h91v62H18zM109 74h31l21 25v20h-52M18 119h142" fill="#fff8ea"/><circle cx="56" cy="119" r="15" fill="#fff"/><circle cx="133" cy="119" r="15" fill="#fff"/><path d="M37 76h49v25H37zm73 7h17l11 15h-28"/></svg>`,
    blocks: `<svg ${common}><path d="M28 91h57v46H28zM69 43h60v48H69zM111 92h43v45h-43z" fill="#fff8ea"/><path d="M49 74V91m74 0V71m18 21h-4M28 114h57m27-22h43"/></svg>`,
    kite: `<svg ${common}><path d="m88 18 47 58-47 61-47-61 47-58Z" fill="#fff8ea"/><path d="M88 18v119M41 76h94M88 137c-2 18 14 22 22 13s-4-25-20-12"/></svg>`,
    bear: `<svg ${common}><circle cx="55" cy="45" r="21" fill="#fff8ea"/><circle cx="124" cy="45" r="21" fill="#fff8ea"/><circle cx="90" cy="78" r="51" fill="#fff8ea"/><circle cx="72" cy="72" r="4"/><circle cx="108" cy="72" r="4"/><path d="M83 90c5 5 10 5 15 0m-23 19c9 7 20 7 29 0M61 141h57"/></svg>`,
    chef: `<svg ${common}><path d="M56 45c0-25 18-30 25-16 4-20 24-20 28 0 18-11 27 8 17 25H47c-8-13 0-25 9-9Z" fill="#fff8ea"/><path d="M58 54h70v56H58zM68 110v32h50v-32M77 78h32"/></svg>`,
    puzzle: `<svg ${common}><path d="M25 25h49v23c-16 3-14 25 0 28v25H25V76c16-2 16-23 0-25V25Zm53 0h52v30c-16 3-16 24 0 27v44H78V76c15-3 15-24 0-27V25Z" fill="#fff8ea"/></svg>`,
    car: `<svg ${common}><path d="M26 87c5-25 19-35 48-35h25c21 5 37 24 51 57H26V87Z" fill="#fff8ea"/><path d="M48 86h78M70 51l-9 35m48-32 4 32M19 120h148" /><circle cx="53" cy="121" r="15" fill="#fff"/><circle cx="127" cy="121" r="15" fill="#fff"/></svg>`,
    bubbles: `<svg ${common}><circle cx="58" cy="59" r="27" fill="#fff8ea"/><circle cx="111" cy="42" r="18" fill="#fff8ea"/><circle cx="116" cy="93" r="32" fill="#fff8ea"/><circle cx="65" cy="118" r="18" fill="#fff8ea"/><path d="m45 96 9 32 20 11"/></svg>`,
    rabbit: `<svg ${common}><path d="M58 63C42 28 58 6 73 43l10 22M110 63c16-35 0-57-15-20L85 65" fill="#fff8ea"/><circle cx="91" cy="93" r="44" fill="#fff8ea"/><circle cx="75" cy="88" r="3"/><circle cx="107" cy="88" r="3"/><path d="M87 99h8l-4 5-4-5Zm-24 15 68-27" /></svg>`,
    doctor: `<svg ${common}><path d="M25 51h85v83H25zM68 72h49v62H68z" fill="#fff8ea"/><path d="M46 92h43M46 110h30M90 94v22m-11-11h22"/></svg>`,
  };
  return visuals[type] || visuals.blocks;
}

function bindImageFallbacks(container) {
  container.querySelectorAll("img[data-main-image]").forEach((image) => {
    image.addEventListener("error", () => {
      const backup = normalizeImageUrl(image.dataset.backupImage);
      const current = image.getAttribute("src");
      if (backup && current !== backup) {
        image.src = backup;
        return;
      }
      image.hidden = true;
      const fallback = image.parentElement?.querySelector(".product-art");
      if (fallback) fallback.hidden = false;
    });
  });
}

function addToCart(sku) {
  const product = state.products.find((candidate) => candidate.sku === sku);
  if (!product) return;

  const existing = state.cart.find((item) => item.sku === sku);
  if (existing) {
    existing.quantity = Math.min(999, existing.quantity + 1);
  } else {
    state.cart.push({
      sku: product.sku,
      name: product.name,
      category: product.category,
      price: product.price,
      image: product.image,
      backupImage: product.backupImage,
      quantity: 1,
      demo: product.demo,
      art: product.art,
    });
  }

  saveCart();
  renderCart();
  showToast(`${product.name} añadido al pedido.`);
  pulseCartButton();
}

function changeQuantity(sku, change) {
  const item = state.cart.find((candidate) => candidate.sku === sku);
  if (!item) return;
  item.quantity = Math.min(999, Math.max(1, item.quantity + change));
  saveCart();
  renderCart();
}

function removeCartItem(sku) {
  state.cart = state.cart.filter((item) => item.sku !== sku);
  saveCart();
  renderCart();
}

function clearCart(withConfirmation = false) {
  if (!state.cart.length) return;
  if (withConfirmation && !window.confirm("¿Deseas eliminar todos los productos del pedido?")) return;
  state.cart = [];
  saveCart();
  renderCart();
  showToast("El pedido quedó vacío.");
}

function cartTotals() {
  return state.cart.reduce(
    (totals, item) => {
      totals.quantity += item.quantity;
      totals.subtotal += item.price * item.quantity;
      return totals;
    },
    { quantity: 0, subtotal: 0 },
  );
}

function renderCart() {
  const totals = cartTotals();
  elements.cartCount.forEach((count) => {
    count.textContent = String(totals.quantity);
  });

  const isEmpty = state.cart.length === 0;
  elements.cartEmpty.hidden = !isEmpty;
  elements.cartFilled.hidden = isEmpty;
  elements.cartFooter.hidden = isEmpty;
  elements.cartSubtotal.textContent = formatPrice(totals.subtotal);

  elements.cartItems.innerHTML = state.cart
    .map(
      (item) => `
        <article class="cart-item">
          <div class="cart-item-image" style="position:relative;background:${escapeHTML(
            DEMO_PALETTES[0],
          )}">
            ${renderCartVisual(item)}
          </div>
          <div class="cart-item-info">
            <p class="cart-item-sku">${escapeHTML(item.sku)}</p>
            <h3 class="cart-item-name">${escapeHTML(item.name)}</h3>
            <p class="cart-item-price">${formatPrice(item.price)} c/u</p>
            <div class="quantity-control" aria-label="Cantidad de ${escapeHTML(item.name)}">
              <button type="button" data-cart-action="decrease" data-sku="${escapeHTML(item.sku)}" aria-label="Quitar una unidad">−</button>
              <span>${item.quantity}</span>
              <button type="button" data-cart-action="increase" data-sku="${escapeHTML(item.sku)}" aria-label="Añadir una unidad">+</button>
            </div>
          </div>
          <div class="cart-item-right">
            <strong class="cart-item-total">${formatPrice(item.price * item.quantity)}</strong>
            <button class="remove-item" type="button" data-cart-action="remove" data-sku="${escapeHTML(item.sku)}" aria-label="Eliminar ${escapeHTML(item.name)}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m-9 0 1 14h10l1-14M10 11v6m4-6v6" /></svg>
            </button>
          </div>
        </article>`,
    )
    .join("");

  renderCheckoutPreview();
  bindImageFallbacks(elements.cartItems);
}

function renderCartVisual(item) {
  if (!item.image) {
    return `<div class="product-art">${illustrationFor(item.art)}</div>`;
  }
  return `
    <img
      src="${escapeHTML(item.image)}"
      alt=""
      data-main-image="${escapeHTML(item.image)}"
      data-backup-image="${escapeHTML(item.backupImage)}"
    />
    <div class="product-art" hidden>${illustrationFor(item.art)}</div>`;
}

function renderCheckoutPreview() {
  const totals = cartTotals();
  elements.checkoutCount.textContent = `${totals.quantity} ${
    totals.quantity === 1 ? "unidad" : "unidades"
  }`;
  elements.checkoutTotal.textContent = formatPrice(totals.subtotal);
  elements.checkoutItems.innerHTML = state.cart
    .map(
      (item) => `
        <div class="preview-item">
          <span>${escapeHTML(item.name)} <small>× ${item.quantity}</small></span>
          <strong>${formatPrice(item.price * item.quantity)}</strong>
        </div>`,
    )
    .join("");
}

function pulseCartButton() {
  document.querySelectorAll(".cart-button").forEach((button) => {
    button.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.07)" },
        { transform: "scale(1)" },
      ],
      { duration: 330, easing: "ease-out" },
    );
  });
}

function openCart() {
  elements.drawerBackdrop.hidden = false;
  elements.cartDrawer.classList.add("is-open");
  elements.cartDrawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-locked");
  requestAnimationFrame(() => elements.drawerBackdrop.classList.add("is-visible"));
  document.querySelector("[data-close-cart]")?.focus({ preventScroll: true });
}

function closeCart(immediate = false) {
  elements.cartDrawer.classList.remove("is-open");
  elements.cartDrawer.setAttribute("aria-hidden", "true");
  elements.drawerBackdrop.classList.remove("is-visible");
  const finish = () => {
    elements.drawerBackdrop.hidden = true;
    if (!elements.checkoutDialog.open) document.body.classList.remove("is-locked");
  };

  if (immediate) finish();
  else window.setTimeout(finish, 260);
}

function openCheckout() {
  if (!state.cart.length) {
    showToast("Agrega al menos un producto para continuar.");
    return;
  }
  closeCart(true);
  elements.orderForm.hidden = false;
  elements.checkoutSuccess.hidden = true;
  elements.formMessage.hidden = true;
  renderCheckoutPreview();

  if (typeof elements.checkoutDialog.showModal === "function") {
    elements.checkoutDialog.showModal();
  } else {
    elements.checkoutDialog.setAttribute("open", "");
  }
  document.body.classList.add("is-locked");
  window.setTimeout(() => elements.orderForm.querySelector('input[name="name"]')?.focus(), 100);
}

function closeCheckout() {
  if (typeof elements.checkoutDialog.close === "function") {
    elements.checkoutDialog.close();
  } else {
    elements.checkoutDialog.removeAttribute("open");
  }
  document.body.classList.remove("is-locked");
}

function clearFieldErrors() {
  elements.orderForm.querySelectorAll(".field").forEach((field) => {
    field.classList.remove("has-error");
    const input = field.querySelector("input, textarea");
    const error = field.querySelector(".field-error");
    input?.removeAttribute("aria-invalid");
    if (error) error.textContent = "";
  });
}

function setFieldError(input, message) {
  const field = input.closest(".field");
  field?.classList.add("has-error");
  input.setAttribute("aria-invalid", "true");
  const error = field?.querySelector(".field-error");
  if (error) error.textContent = message;
}

function validateOrderForm() {
  clearFieldErrors();
  const formData = new FormData(elements.orderForm);
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  let firstInvalid = null;

  if (name.length < 2) {
    const input = elements.orderForm.elements.name;
    setFieldError(input, "Escribe tu nombre.");
    firstInvalid ||= input;
  }

  if (phone.replace(/\D/g, "").length < 7) {
    const input = elements.orderForm.elements.phone;
    setFieldError(input, "Escribe un teléfono válido.");
    firstInvalid ||= input;
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const input = elements.orderForm.elements.email;
    setFieldError(input, "Revisa el correo electrónico.");
    firstInvalid ||= input;
  }

  if (firstInvalid) {
    firstInvalid.focus();
    return null;
  }

  return {
    name,
    company: String(formData.get("company") || "").trim(),
    phone,
    email,
    notes: String(formData.get("notes") || "").trim(),
  };
}

function createOrderNumber() {
  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `AMG-${date}-${suffix}`;
}

function buildOrderPayload(customer, orderNumber) {
  const totals = cartTotals();
  const itemLines = state.cart.map(
    (item, index) =>
      `${index + 1}. ${item.sku} | ${item.name} | Cantidad: ${item.quantity} | ` +
      `Precio unitario: ${formatPrice(item.price)} | Subtotal: ${formatPrice(item.price * item.quantity)}`,
  );
  const message = [
    `NUEVO PEDIDO ${orderNumber}`,
    "",
    "PRODUCTOS",
    ...itemLines,
    "",
    `Subtotal estimado: ${formatPrice(totals.subtotal)}`,
    "",
    "DATOS DEL CLIENTE",
    `Nombre: ${customer.name}`,
    `Empresa / tienda: ${customer.company || "No indicada"}`,
    `Teléfono / WhatsApp: ${customer.phone}`,
    `Correo: ${customer.email || "No indicado"}`,
    `Notas: ${customer.notes || "Sin notas"}`,
  ].join("\n");

  return {
    message,
    orderNumber,
    items: state.cart.map((item) => ({
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity,
    })),
    subtotal: totals.subtotal,
  };
}

async function submitOrder(event) {
  event.preventDefault();
  if (state.isSubmitting) return;

  const customer = validateOrderForm();
  if (!customer || !state.cart.length) return;

  const orderNumber = createOrderNumber();
  const order = buildOrderPayload(customer, orderNumber);
  const provider = config.formProvider || "formsubmit";
  let endpoint = config.formEndpoint;

  if (provider === "formsubmit" && !endpoint) {
    endpoint = `https://formsubmit.co/ajax/${encodeURIComponent(config.orderEmail)}`;
  }

  if (provider === "formspree" && !endpoint) {
    showSubmissionError(
      "Falta configurar el endpoint de Formspree. Crea el formulario y colócalo en config.js.",
      order,
    );
    return;
  }

  if (provider === "web3forms" && !config.web3formsAccessKey) {
    showSubmissionError(
      "Falta configurar la clave de Web3Forms en config.js.",
      order,
    );
    return;
  }

  const payload = {
    name: customer.name,
    company: customer.company,
    phone: customer.phone,
    notes: customer.notes,
    _subject: `Nuevo pedido ${orderNumber} · ${config.brandName}`,
    _template: "table",
    _captcha: "false",
    _honey: "",
    order_number: orderNumber,
    order_items: JSON.stringify(order.items),
    order_subtotal: order.subtotal,
    message: order.message,
  };

  if (customer.email) {
    payload.email = customer.email;
    payload._replyto = customer.email;
  }

  if (provider === "web3forms") {
    endpoint = endpoint || "https://api.web3forms.com/submit";
    payload.access_key = config.web3formsAccessKey;
    payload.subject = `Nuevo pedido ${orderNumber} · ${config.brandName}`;
  }

  state.isSubmitting = true;
  elements.formMessage.hidden = true;
  elements.submitOrder.disabled = true;
  elements.submitOrder.querySelector("span").textContent = "Enviando...";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    const responseText = await response.text();
    let result = null;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { message: responseText };
    }

    const explicitlyFailed =
      result?.success === false ||
      result?.success === "false" ||
      result?.ok === false ||
      /error|failed|no se pudo/i.test(String(result?.message || ""));

    if (!response.ok || explicitlyFailed) {
      throw new Error(result?.message || `El servicio respondió ${response.status}.`);
    }

    completeOrder(orderNumber);
  } catch (error) {
    console.error("No se pudo enviar el pedido:", error);
    showSubmissionError(
      "No pudimos enviar el pedido en este momento. Intenta de nuevo o usa el enlace de correo.",
      order,
    );
  } finally {
    state.isSubmitting = false;
    elements.submitOrder.disabled = false;
    elements.submitOrder.querySelector("span").textContent = "Enviar pedido";
  }
}

function completeOrder(orderNumber) {
  elements.orderCode.textContent = `Pedido ${orderNumber}`;
  elements.orderForm.hidden = true;
  elements.checkoutSuccess.hidden = false;
  state.cart = [];
  saveCart();
  renderCart();
  closeCart(true);
  elements.checkoutDialog.querySelector(".checkout-shell")?.scrollTo({ top: 0 });
}

function showSubmissionError(message, order) {
  const body = order?.message || "Consulta de pedido";
  const mailto = `mailto:${config.orderEmail}?subject=${encodeURIComponent(
    `Pedido desde ${config.brandName}`,
  )}&body=${encodeURIComponent(body)}`;
  elements.formMessage.innerHTML = `${escapeHTML(message)} <a href="${escapeHTML(
    mailto,
  )}">Enviar por correo directamente</a>.`;
  elements.formMessage.hidden = false;
  elements.formMessage.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function openWhatsAppOrder() {
  const customer = validateOrderForm();
  if (!customer || !state.cart.length) return;

  if (!config.whatsappNumber) {
    showToast("WhatsApp aún no está configurado. Puedes enviar el pedido por correo.");
    return;
  }

  const orderNumber = createOrderNumber();
  const order = buildOrderPayload(customer, orderNumber);
  const number = String(config.whatsappNumber).replace(/\D/g, "");
  const url = `https://wa.me/${number}?text=${encodeURIComponent(order.message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function resetFilters() {
  state.category = "all";
  state.search = "";
  state.sort = "featured";
  elements.search.value = "";
  elements.sort.value = "featured";
  renderCatalog();
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 2800);
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const addButton = event.target.closest("[data-add-product]");
    if (addButton) addToCart(addButton.dataset.addProduct);

    const categoryButton = event.target.closest("[data-category]");
    if (categoryButton) {
      state.category = categoryButton.dataset.category;
      renderCatalog();
    }
  });

  document.querySelectorAll("[data-open-cart]").forEach((button) => {
    button.addEventListener("click", openCart);
  });

  document.querySelectorAll("[data-close-cart]").forEach((button) => {
    button.addEventListener("click", () => closeCart());
  });

  document.querySelectorAll("[data-close-checkout]").forEach((button) => {
    button.addEventListener("click", closeCheckout);
  });

  elements.drawerBackdrop.addEventListener("click", () => closeCart());
  document.querySelector("[data-checkout]").addEventListener("click", openCheckout);
  elements.orderForm.addEventListener("submit", submitOrder);
  document.querySelector("[data-whatsapp-order]").addEventListener("click", openWhatsAppOrder);
  document.querySelector("[data-clear-cart]").addEventListener("click", () => clearCart(true));

  elements.cartItems.addEventListener("click", (event) => {
    const button = event.target.closest("[data-cart-action]");
    if (!button) return;
    const sku = button.dataset.sku;
    if (button.dataset.cartAction === "increase") changeQuantity(sku, 1);
    if (button.dataset.cartAction === "decrease") changeQuantity(sku, -1);
    if (button.dataset.cartAction === "remove") removeCartItem(sku);
  });

  elements.search.addEventListener("input", (event) => {
    state.search = event.target.value.trim();
    renderCatalog();
  });

  elements.sort.addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderCatalog();
  });

  elements.clearFilters.forEach((button) => {
    button.addEventListener("click", resetFilters);
  });

  elements.checkoutDialog.addEventListener("close", () => {
    document.body.classList.remove("is-locked");
    elements.formMessage.hidden = true;
    clearFieldErrors();
  });

  elements.checkoutDialog.addEventListener("click", (event) => {
    if (event.target === elements.checkoutDialog) closeCheckout();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && elements.cartDrawer.classList.contains("is-open")) {
      closeCart();
    }
  });
}

function initializeBrand() {
  document.querySelectorAll('a[href="mailto:1813638105@qq.com"]').forEach((link) => {
    link.href = `mailto:${config.orderEmail}`;
    if (link.textContent.includes("1813638105@qq.com")) {
      link.textContent = config.orderEmail;
    }
  });
  const footerEmail = [...document.querySelectorAll(".footer-links a")].find((link) =>
    link.href.startsWith("mailto:"),
  );
  if (footerEmail) footerEmail.textContent = config.orderEmail;
  document.querySelectorAll("[data-current-year]").forEach((year) => {
    year.textContent = String(new Date().getFullYear());
  });
}

initializeBrand();
bindEvents();
renderCart();
loadProducts();
