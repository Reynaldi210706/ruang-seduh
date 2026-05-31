const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const LS_KEYS = {
  settings: "ruangSeduhSettings",
  menus: "ruangSeduhMenus",
  promos: "ruangSeduhPromos",
  gallery: "ruangSeduhGallery",
  reviews: "ruangSeduhReviews",
  faq: "ruangSeduhFaq",
  cart: "ruangSeduhCart",
  reservations: "ruangSeduhReservations",
};

const DEFAULT_SETTINGS = {
  name: "Ruang Seduh",
  tagline: "Kopi hangat untuk waktu yang lebih tenang.",
  about: "",
  hours: "",
  address: "",
  maps: "",
  whatsapp: "",
  email: "",
  instagram: "",
  primary: "#7b4b2a",
  cream: "#fff8ee",
  brown: "#4b2f20",
  textColor: "#18100c",
  shadowMode: "soft",
  font: "system",
  radius: "soft",
  density: "comfortable",
  fee: 0,
  promoCode: "",
  promoDiscount: 0,
  dark: false,
};

let state = {
  settings: load(LS_KEYS.settings, DEFAULT_SETTINGS),
  menus: load(LS_KEYS.menus, []),
  promos: load(LS_KEYS.promos, []),
  gallery: load(LS_KEYS.gallery, []),
  reviews: load(LS_KEYS.reviews, []),
  faq: load(LS_KEYS.faq, []),
  cart: load(LS_KEYS.cart, []),
  reservations: load(LS_KEYS.reservations, []),
  reviewIndex: 0,
  appliedPromo: null,
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function rupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(number || 0));
}

function clean(value) {
  return String(value || "").trim();
}

function escapeHtml(value) {
  return String(value || "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[char],
  );
}

function phoneDigits(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  return digits;
}

function whatsappUrl(phone, message) {
  const digits = phoneDigits(phone);
  if (!digits) return "#";
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function toast(message, type = "info") {
  const wrap = $("#toastWrap");
  const item = document.createElement("div");
  item.className = `toast ${type}`;
  item.textContent = message;
  wrap.appendChild(item);
  setTimeout(() => item.remove(), 3300);
}

function openModal(html) {
  $("#modalContent").innerHTML = html;
  $("#modalOverlay").classList.add("show");
  $("#modalOverlay").setAttribute("aria-hidden", "false");
}

function closeModal() {
  $("#modalOverlay").classList.remove("show");
  $("#modalOverlay").setAttribute("aria-hidden", "true");
  $("#modalContent").innerHTML = "";
}

function confirmAction(message, onConfirm) {
  openModal(`
    <h2>Konfirmasi</h2>
    <p>${escapeHtml(message)}</p>
    <div class="form-actions">
      <button class="btn danger" id="confirmYes" type="button">Ya, lanjutkan</button>
      <button class="btn soft" id="confirmNo" type="button">Batal</button>
    </div>
  `);
  $("#confirmYes").addEventListener("click", () => {
    closeModal();
    onConfirm();
  });
  $("#confirmNo").addEventListener("click", closeModal);
}

function init() {
  applySettings();
  bindEvents();
  renderAll();
  setTimeout(() => $("#loadingScreen").classList.add("hide"), 650);
  observeReveal();
}

function applySettings() {
  const s = state.settings;
  document.title = s.name || "Ruang Seduh";
  document.documentElement.style.setProperty(
    "--primary",
    s.primary || "#7b4b2a",
  );
  document.documentElement.style.setProperty(
    "--primary-dark",
    shadeColor(s.primary || "#7b4b2a", -28),
  );
  document.documentElement.style.setProperty("--cream", s.cream || "#fff8ee");
  document.documentElement.style.setProperty("--brown", s.brown || "#4b2f20");
  document.documentElement.style.setProperty(
    "--text-custom",
    s.textColor || "#18100c",
  );
  document.body.classList.toggle("dark", !!s.dark);
  document.body.classList.toggle("font-serif", s.font === "serif");
  document.body.classList.toggle("font-rounded", s.font === "rounded");
  document.body.classList.toggle("radius-modern", s.radius === "modern");
  document.body.classList.toggle("radius-round", s.radius === "round");
  document.body.classList.toggle("shadow-bold", s.shadowMode === "bold");
  document.body.classList.toggle("shadow-clean", s.shadowMode === "clean");
  document.body.classList.toggle("density-compact", s.density === "compact");
  document.body.classList.toggle("density-spacious", s.density === "spacious");

  $("#brandName").textContent = s.name || "Ruang Seduh";
  $("#brandTagline").textContent = s.tagline || "";
  $("#brandMark").textContent = initials(s.name || "Ruang Seduh");
  $("#heroTitle").textContent = s.name || "Ruang Seduh";
  $("#heroSubtitle").textContent = s.tagline || "Tagline belum diisi.";
  $("#aboutText").textContent =
    s.about ||
    "Cerita cafe belum diisi. Kamu bisa mengisinya dari halaman Kelola.";
  $("#homeAbout").textContent =
    s.about ||
    "Cerita cafe belum diisi. Buka halaman Kelola untuk mengisi cerita cafe.";
  $("#homeHours").textContent = s.hours || "Belum diisi.";
  $("#homeAddress").textContent = s.address || "Belum diisi.";
  $("#homePhone").textContent = s.whatsapp || "Belum diisi.";
  $("#contactAddress").textContent =
    s.address || "Informasi kontak belum tersedia.";
  $("#contactPhone").textContent = s.whatsapp || "Belum diisi.";
  $("#contactEmail").textContent = s.email
    ? `Email: ${s.email}`
    : "Email belum diisi.";
  $("#contactInstagram").textContent = s.instagram
    ? `Instagram: ${s.instagram}`
    : "Instagram belum diisi.";
  $("#mapsLink").href = s.maps || "#";
  $("#waContactLink").href = whatsappUrl(
    s.whatsapp,
    `Halo ${s.name || "Ruang Seduh"}, saya ingin bertanya.`,
  );
  $("#footerText").textContent =
    `© 2026 ${s.name || "Ruang Seduh"}. Kopi hangat, obrolan ringan, dan waktu yang lebih tenang.`;
  const themeBtn = $("#themeToggle");
  themeBtn.textContent = s.dark ? "☕" : "🌙";
  themeBtn.title = s.dark ? "Pakai mode terang" : "Pakai mode gelap";
  themeBtn.setAttribute("aria-label", themeBtn.title);

  fillSettingsForm();
}

function shadeColor(hex, percent) {
  let color = String(hex || "#7b4b2a").replace("#", "");
  if (color.length !== 6) return "#4a2b19";
  const num = parseInt(color, 16);
  const amt = Math.round(2.55 * percent);
  const r = Math.max(0, Math.min(255, (num >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
}

function initials(name) {
  return (
    String(name || "RS")
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "RS"
  );
}

function renderAll() {
  renderStats();
  renderCategoryOptions();
  renderMenu();
  renderCart();
  renderPromos();
  renderGallery();
  renderReviews();
  renderReservations();
  renderFaq();
  renderManageLists();
}

function renderStats() {
  $("#statMenu").textContent = state.menus.length;
  $("#statPromo").textContent = state.promos.filter(
    (p) => p.status !== "inactive",
  ).length;
  $("#statReview").textContent = state.reviews.length;
}

function renderCategoryOptions() {
  const categories = [
    ...new Set(state.menus.map((item) => clean(item.category)).filter(Boolean)),
  ].sort();
  const select = $("#categoryFilter");
  select.innerHTML = `<option value="">Semua kategori</option>${categories.map((cat) => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join("")}`;
  const galleryCategories = [
    ...new Set(
      state.gallery.map((item) => clean(item.category)).filter(Boolean),
    ),
  ].sort();
  $("#galleryFilter").innerHTML =
    `<option value="">Semua kategori</option>${galleryCategories.map((cat) => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join("")}`;
}

function getFilteredMenus() {
  const q = clean($("#menuSearch")?.value).toLowerCase();
  const category = $("#categoryFilter")?.value || "";
  const badge = $("#badgeFilter")?.value || "";
  const sort = $("#sortMenu")?.value || "default";

  let items = [...state.menus];
  if (q)
    items = items.filter((item) =>
      `${item.name} ${item.category} ${item.description}`
        .toLowerCase()
        .includes(q),
    );
  if (category) items = items.filter((item) => item.category === category);
  if (badge) {
    items = items.filter((item) => {
      if (badge === "best") return item.best;
      if (badge === "new") return item.newItem;
      if (badge === "promo") return item.promo;
      if (badge === "favorite") return item.favorite;
      return true;
    });
  }
  if (sort === "low") items.sort((a, b) => Number(a.price) - Number(b.price));
  if (sort === "high") items.sort((a, b) => Number(b.price) - Number(a.price));
  if (sort === "name")
    items.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  return items;
}

function renderMenu() {
  const grid = $("#menuGrid");
  const items = getFilteredMenus();
  grid.innerHTML = items
    .map(
      (item) => `
    <article class="menu-card">
      <div class="menu-visual">${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">` : "☕"}</div>
      <div class="badge-row">${badgesHtml(item)}</div>
      <h3>${escapeHtml(item.name)}</h3>
      <p>${escapeHtml(item.description || "Deskripsi menu belum tersedia.")}</p>
      <small>${escapeHtml(item.category || "Tanpa kategori")}</small>
      <div class="price-row">
        <strong>${rupiah(item.price)}</strong>
        <div class="item-actions">
          <button class="icon-btn" type="button" data-detail-menu="${item.id}" aria-label="Detail">👁</button>
          <button class="icon-btn" type="button" data-toggle-fav="${item.id}" aria-label="Favorit">${item.favorite ? "♥" : "♡"}</button>
          <button class="btn primary small" type="button" data-add-cart="${item.id}">Tambah</button>
        </div>
      </div>
    </article>
  `,
    )
    .join("");
  $("#menuEmpty").classList.toggle(
    "hidden",
    state.menus.length !== 0 || items.length !== 0,
  );
  if (state.menus.length !== 0 && items.length === 0) {
    grid.innerHTML = `<div class="empty-state"><span>🔎</span><h3>Menu tidak ditemukan.</h3><p>Coba ubah kata kunci atau filter.</p></div>`;
  }
}

function badgesHtml(item) {
  const badges = [];
  if (item.best) badges.push('<span class="badge best">Best Seller</span>');
  if (item.newItem) badges.push('<span class="badge new">Menu Baru</span>');
  if (item.promo) badges.push('<span class="badge promo">Promo</span>');
  if (item.favorite) badges.push('<span class="badge">Favorit</span>');
  return badges.join("");
}

function renderCart() {
  const list = $("#cartList");
  list.innerHTML = state.cart
    .map((row) => {
      const item = state.menus.find((menu) => menu.id === row.menuId);
      if (!item) return "";
      return `
      <div class="cart-item">
        <div>
          <strong>${escapeHtml(item.name)}</strong>
          <p>${rupiah(item.price)} × ${row.qty}</p>
        </div>
        <div class="item-actions">
          <button class="icon-btn" type="button" data-dec-cart="${item.id}">−</button>
          <strong>${row.qty}</strong>
          <button class="icon-btn" type="button" data-inc-cart="${item.id}">+</button>
          <button class="icon-btn" type="button" data-remove-cart="${item.id}">×</button>
        </div>
      </div>
    `;
    })
    .join("");
  $("#cartEmpty").classList.toggle("hidden", state.cart.length > 0);
  $("#cartCount").textContent = state.cart.reduce(
    (sum, row) => sum + Number(row.qty || 0),
    0,
  );
  renderSummary();
  save(LS_KEYS.cart, state.cart);
}

function cartTotals() {
  const subtotal = state.cart.reduce((sum, row) => {
    const item = state.menus.find((menu) => menu.id === row.menuId);
    return sum + Number(item?.price || 0) * Number(row.qty || 0);
  }, 0);
  const fee = Math.round(subtotal * (Number(state.settings.fee || 0) / 100));
  const discount = state.appliedPromo
    ? Math.round(
        (subtotal + fee) * (Number(state.appliedPromo.discount || 0) / 100),
      )
    : 0;
  return {
    subtotal,
    fee,
    discount,
    total: Math.max(0, subtotal + fee - discount),
  };
}

function renderSummary() {
  const totals = cartTotals();
  $("#subtotalText").textContent = rupiah(totals.subtotal);
  $("#feeText").textContent = rupiah(totals.fee);
  $("#discountText").textContent = `-${rupiah(totals.discount)}`;
  $("#totalText").textContent = rupiah(totals.total);
}

function addToCart(menuId) {
  const existing = state.cart.find((row) => row.menuId === menuId);
  if (existing) existing.qty += 1;
  else state.cart.push({ menuId, qty: 1 });
  toast("Menu ditambahkan ke keranjang.", "success");
  renderCart();
}

function changeCart(menuId, diff) {
  const row = state.cart.find((item) => item.menuId === menuId);
  if (!row) return;
  row.qty += diff;
  if (row.qty <= 0)
    state.cart = state.cart.filter((item) => item.menuId !== menuId);
  renderCart();
}

function renderPromos() {
  const grid = $("#promoGrid");
  const activePromos = state.promos.filter(
    (item) => item.status !== "inactive",
  );
  grid.innerHTML = activePromos
    .map(
      (item) => `
    <article class="promo-card">
      <div class="badge-row"><span class="badge promo">${item.code ? escapeHtml(item.code) : "Promo"}</span>${item.status === "active" ? '<span class="badge best">Aktif</span>' : ""}</div>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.description || "Detail promo belum tersedia.")}</p>
      <p><strong>Diskon:</strong> ${Number(item.discount || 0)}%</p>
      <div class="countdown" data-countdown="${escapeHtml(item.endDate || "")}"></div>
      <button class="btn soft small" type="button" data-detail-promo="${item.id}">Lihat Detail</button>
    </article>
  `,
    )
    .join("");
  $("#promoEmpty").classList.toggle("hidden", activePromos.length > 0);
  updateCountdowns();
}

function updateCountdowns() {
  $$("[data-countdown]").forEach((box) => {
    const date = box.dataset.countdown;
    if (!date) {
      box.innerHTML = "<span>Tanggal belum ditentukan</span>";
      return;
    }
    const diff = new Date(date).getTime() - Date.now();
    if (diff <= 0) {
      box.innerHTML = "<span>Sudah berakhir</span>";
      return;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
    const minutes = Math.floor(diff / (1000 * 60)) % 60;
    box.innerHTML = `<span>${days} hari</span><span>${hours} jam</span><span>${minutes} menit</span>`;
  });
}

function renderGallery() {
  const filter = $("#galleryFilter")?.value || "";
  const items = filter
    ? state.gallery.filter((item) => item.category === filter)
    : state.gallery;
  $("#galleryGrid").innerHTML = items
    .map(
      (item) => `
    <article class="gallery-card">
      <div class="gallery-visual">${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">` : "🖼️"}</div>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.description || "Keterangan foto belum tersedia.")}</p>
      <small>${escapeHtml(item.category || "Tanpa kategori")}</small>
      <div class="form-actions">
        <button class="btn soft small" type="button" data-detail-gallery="${item.id}">Lihat Foto</button>
      </div>
    </article>
  `,
    )
    .join("");
  $("#galleryEmpty").classList.toggle("hidden", state.gallery.length > 0);
}

function renderReviews() {
  const slider = $("#reviewSlider");
  const empty = state.reviews.length === 0;
  $("#reviewEmpty").classList.toggle("hidden", !empty);
  if (empty) {
    slider.innerHTML = "";
    $("#ratingAverage").textContent = "0.0";
    return;
  }
  if (state.reviewIndex >= state.reviews.length) state.reviewIndex = 0;
  const item = state.reviews[state.reviewIndex];
  slider.innerHTML = `
    <article class="review-card">
      <div class="stars">${"★".repeat(Number(item.rating || 0))}${"☆".repeat(5 - Number(item.rating || 0))}</div>
      <p>“${escapeHtml(item.text)}”</p>
      <strong>${escapeHtml(item.name)}</strong>
      <button class="btn soft small" type="button" data-delete-review="${item.id}">Hapus Review</button>
    </article>
  `;
  const avg =
    state.reviews.reduce((sum, row) => sum + Number(row.rating || 0), 0) /
    state.reviews.length;
  $("#ratingAverage").textContent = avg.toFixed(1);
}

function renderReservations() {
  $("#reservationList").innerHTML = state.reservations
    .map(
      (item) => `
    <div class="stack-item">
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <p>${escapeHtml(item.date)} ${escapeHtml(item.time)} · ${escapeHtml(item.people)} orang</p>
        <small>${escapeHtml(item.notes || "Tidak ada catatan.")}</small>
      </div>
      <a class="btn soft small" href="${whatsappUrl(state.settings.whatsapp, reservationMessage(item))}" target="_blank" rel="noreferrer">WhatsApp</a>
    </div>
  `,
    )
    .join("");
  $("#reservationEmpty").classList.toggle(
    "hidden",
    state.reservations.length > 0,
  );
}

function reservationMessage(item) {
  return `Halo ${state.settings.name || "Ruang Seduh"}, saya ingin reservasi.\n\nNama: ${item.name}\nTanggal: ${item.date}\nJam: ${item.time}\nJumlah: ${item.people} orang\nCatatan: ${item.notes || "-"}`;
}

function renderFaq() {
  $("#faqList").innerHTML = state.faq
    .map(
      (item) => `
    <div class="faq-item">
      <button class="faq-question" type="button">
        <span>${escapeHtml(item.question)}</span>
        <span>+</span>
      </button>
      <div class="faq-answer hidden">${escapeHtml(item.answer)}</div>
    </div>
  `,
    )
    .join("");
  $("#faqEmpty").classList.toggle("hidden", state.faq.length > 0);
}

function renderManageLists() {
  $("#manageMenuList").innerHTML = state.menus
    .map((item) =>
      manageItemHtml(
        item.name,
        `${item.category || "Tanpa kategori"} · ${rupiah(item.price)}`,
        "menu",
        item.id,
      ),
    )
    .join("");
  $("#managePromoList").innerHTML = state.promos
    .map((item) =>
      manageItemHtml(
        item.title,
        `${item.code || "Tanpa kode"} · ${item.discount || 0}%`,
        "promo",
        item.id,
      ),
    )
    .join("");
  $("#manageGalleryList").innerHTML = state.gallery
    .map((item) =>
      manageItemHtml(
        item.title,
        item.category || "Tanpa kategori",
        "gallery",
        item.id,
      ),
    )
    .join("");
  $("#manageFaqList").innerHTML = state.faq
    .map((item) => manageItemHtml(item.question, "FAQ", "faq", item.id))
    .join("");
  const reviewList = $("#manageReviewList");
  const reviewEmpty = $("#manageReviewEmpty");
  if (reviewList) {
    reviewList.innerHTML = state.reviews
      .map(
        (item) => `
      <div class="manage-item">
        <div>
          <strong>${escapeHtml(item.name)}</strong>
          <p>${"★".repeat(Number(item.rating || 0))}${"☆".repeat(5 - Number(item.rating || 0))} · ${escapeHtml(item.text.slice(0, 80))}${item.text.length > 80 ? "..." : ""}</p>
        </div>
        <div class="item-actions">
          <button class="btn soft small" type="button" data-detail-review="${item.id}">Detail</button>
          <button class="btn danger small" type="button" data-delete-review="${item.id}">Hapus</button>
        </div>
      </div>
    `,
      )
      .join("");
  }
  if (reviewEmpty)
    reviewEmpty.classList.toggle("hidden", state.reviews.length > 0);
}

function manageItemHtml(title, meta, type, id) {
  return `
    <div class="manage-item">
      <div>
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(meta)}</p>
      </div>
      <div class="item-actions">
        <button class="btn soft small" type="button" data-edit-${type}="${id}">Edit</button>
        <button class="btn danger small" type="button" data-delete-${type}="${id}">Hapus</button>
      </div>
    </div>
  `;
}

function fillSettingsForm() {
  const s = state.settings;
  $("#setName").value = s.name || "";
  $("#setTagline").value = s.tagline || "";
  $("#setAbout").value = s.about || "";
  $("#setHours").value = s.hours || "";
  $("#setWhatsapp").value = s.whatsapp || "";
  $("#setEmail").value = s.email || "";
  $("#setInstagram").value = s.instagram || "";
  $("#setAddress").value = s.address || "";
  $("#setMaps").value = s.maps || "";
  $("#setPrimary").value = s.primary || "#7b4b2a";
  $("#setCream").value = s.cream || "#fff8ee";
  $("#setBrown").value = s.brown || "#4b2f20";
  $("#setTextColor").value = s.textColor || "#18100c";
  $("#setShadow").value = s.shadowMode || "soft";
  $("#setFont").value = s.font || "system";
  $("#setRadius").value = s.radius || "soft";
  $("#setDensity").value = s.density || "comfortable";
  $("#setFee").value = s.fee || 0;
  $("#setPromoCode").value = s.promoCode || "";
  $("#setPromoDiscount").value = s.promoDiscount || 0;
}

function bindEvents() {
  $("#modalClose").addEventListener("click", closeModal);
  $("#modalOverlay").addEventListener("click", (event) => {
    if (event.target.id === "modalOverlay") closeModal();
  });
  $("#navToggle").addEventListener("click", () =>
    $("#navLinks").classList.toggle("open"),
  );
  $$("#navLinks a").forEach((link) =>
    link.addEventListener("click", () =>
      $("#navLinks").classList.remove("open"),
    ),
  );
  $("#themeToggle").addEventListener("click", () => {
    state.settings.dark = !state.settings.dark;
    save(LS_KEYS.settings, state.settings);
    applySettings();
    updateModeLabel();
  });
  $("#quickCartBtn").addEventListener(
    "click",
    () => (location.hash = "#pesanan"),
  );
  $("#backToTop").addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" }),
  );

  ["menuSearch", "categoryFilter", "badgeFilter", "sortMenu"].forEach((id) => {
    $(`#${id}`).addEventListener("input", renderMenu);
    $(`#${id}`).addEventListener("change", renderMenu);
  });
  $("#resetMenuFilter").addEventListener("click", () => {
    $("#menuSearch").value = "";
    $("#categoryFilter").value = "";
    $("#badgeFilter").value = "";
    $("#sortMenu").value = "default";
    renderMenu();
  });

  $("#galleryFilter").addEventListener("change", renderGallery);
  $("#resetGalleryFilter").addEventListener("click", () => {
    $("#galleryFilter").value = "";
    renderGallery();
  });

  document.addEventListener("click", handleDocumentClick);
  window.addEventListener("scroll", handleScroll);

  $("#settingsForm").addEventListener("submit", saveSettingsForm);
  $("#previewThemeBtn")?.addEventListener("click", () =>
    toast("Warna yang dipilih sudah terlihat di halaman.", "info"),
  );
  $$("[data-theme-preset]").forEach((button) =>
    button.addEventListener("click", () =>
      applyThemePreset(button.dataset.themePreset),
    ),
  );
  $("#menuForm").addEventListener("submit", saveMenuForm);
  $("#promoForm").addEventListener("submit", savePromoForm);
  $("#galleryForm").addEventListener("submit", saveGalleryForm);
  $("#faqForm").addEventListener("submit", saveFaqForm);
  $("#reservationForm").addEventListener("submit", saveReservationForm);
  $("#reviewForm").addEventListener("submit", saveReviewForm);

  $("#applyPromoBtn").addEventListener("click", applyPromoCode);
  $("#receiptBtn").addEventListener("click", showReceipt);
  $("#whatsappOrderBtn").addEventListener("click", sendOrderWhatsApp);
  $("#clearCartBtn").addEventListener("click", () =>
    confirmAction("Kosongkan semua item di keranjang?", () => {
      state.cart = [];
      state.appliedPromo = null;
      renderCart();
      toast("Keranjang sudah dikosongkan.", "success");
    }),
  );
  $("#clearReservationBtn").addEventListener("click", () =>
    confirmAction("Hapus semua riwayat reservasi?", () => {
      state.reservations = [];
      save(LS_KEYS.reservations, state.reservations);
      renderReservations();
      toast("Reservasi dihapus.", "success");
    }),
  );
  $("#prevReview").addEventListener("click", () => {
    state.reviewIndex = Math.max(0, state.reviewIndex - 1);
    renderReviews();
  });
  $("#nextReview").addEventListener("click", () => {
    state.reviewIndex =
      (state.reviewIndex + 1) % Math.max(1, state.reviews.length);
    renderReviews();
  });

  $("#cancelMenuEdit").addEventListener("click", resetMenuForm);
  $("#cancelPromoEdit").addEventListener("click", resetPromoForm);
  $("#cancelGalleryEdit").addEventListener("click", resetGalleryForm);
  $("#cancelFaqEdit").addEventListener("click", resetFaqForm);

  $("#exportDataBtn").addEventListener("click", exportData);
  $("#importDataInput").addEventListener("change", importData);
  $("#resetCartOnlyBtn").addEventListener("click", () =>
    confirmAction("Kosongkan keranjang saja?", () => {
      state.cart = [];
      save(LS_KEYS.cart, state.cart);
      renderCart();
      toast("Keranjang sudah dikosongkan.", "success");
    }),
  );
  $("#resetMenuOnlyBtn").addEventListener("click", () =>
    confirmAction("Hapus semua menu yang tersimpan?", () => {
      state.menus = [];
      state.cart = [];
      save(LS_KEYS.menus, state.menus);
      save(LS_KEYS.cart, state.cart);
      renderAll();
      toast("Semua menu sudah dihapus.", "success");
    }),
  );
  $("#resetPromoOnlyBtn").addEventListener("click", () =>
    confirmAction("Hapus semua promo yang tersimpan?", () => {
      state.promos = [];
      save(LS_KEYS.promos, state.promos);
      renderAll();
      toast("Semua promo sudah dihapus.", "success");
    }),
  );
  $("#resetGalleryOnlyBtn").addEventListener("click", () =>
    confirmAction("Hapus semua foto galeri yang tersimpan?", () => {
      state.gallery = [];
      save(LS_KEYS.gallery, state.gallery);
      renderAll();
      toast("Semua foto galeri sudah dihapus.", "success");
    }),
  );
  $("#resetReviewOnlyBtn").addEventListener("click", () =>
    confirmAction("Hapus semua ulasan yang tersimpan?", () => {
      state.reviews = [];
      save(LS_KEYS.reviews, state.reviews);
      renderAll();
      toast("Semua review sudah dihapus.", "success");
    }),
  );
  $("#resetAllDataBtn").addEventListener("click", () =>
    confirmAction("Hapus semua isi Ruang Seduh di browser ini?", resetAllData),
  );

  setInterval(updateCountdowns, 60000);
}

function handleScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  $("#scrollProgress").style.width =
    `${Math.max(0, Math.min(100, (scrollY / max) * 100))}%`;
  $("#backToTop").classList.toggle("show", scrollY > 500);
  const ids = [
    "home",
    "menu",
    "pesanan",
    "reservasi",
    "promo",
    "galeri",
    "review",
    "kontak",
    "kelola",
  ];
  let active = "home";
  ids.forEach((id) => {
    const section = document.getElementById(id);
    if (section && section.offsetTop - 130 <= scrollY) active = id;
  });
  $$("#navLinks a").forEach((a) =>
    a.classList.toggle("active", a.getAttribute("href") === `#${active}`),
  );
}

function observeReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) =>
        entry.target.classList.toggle("visible", entry.isIntersecting),
      );
    },
    { threshold: 0.12 },
  );
  $$(".reveal").forEach((el) => observer.observe(el));
}

function handleDocumentClick(event) {
  const target = event.target.closest(
    "[data-open-tab],[data-add-cart],[data-inc-cart],[data-dec-cart],[data-remove-cart],[data-detail-menu],[data-toggle-fav],[data-detail-promo],[data-detail-gallery],[data-detail-review],[data-delete-review],[data-edit-menu],[data-delete-menu],[data-edit-promo],[data-delete-promo],[data-edit-gallery],[data-delete-gallery],[data-edit-faq],[data-delete-faq],.faq-question",
  );
  if (!target) return;

  if (target.dataset.openTab) openManageTab(target.dataset.openTab);
  if (target.dataset.addCart) addToCart(target.dataset.addCart);
  if (target.dataset.incCart) changeCart(target.dataset.incCart, 1);
  if (target.dataset.decCart) changeCart(target.dataset.decCart, -1);
  if (target.dataset.removeCart)
    confirmAction("Hapus item dari keranjang?", () => {
      state.cart = state.cart.filter(
        (row) => row.menuId !== target.dataset.removeCart,
      );
      renderCart();
      toast("Item dihapus.", "success");
    });
  if (target.dataset.detailMenu) showMenuDetail(target.dataset.detailMenu);
  if (target.dataset.toggleFav) toggleFavorite(target.dataset.toggleFav);
  if (target.dataset.detailPromo) showPromoDetail(target.dataset.detailPromo);
  if (target.dataset.detailGallery)
    showGalleryDetail(target.dataset.detailGallery);
  if (target.dataset.detailReview)
    showReviewDetail(target.dataset.detailReview);
  if (target.dataset.deleteReview)
    confirmAction("Hapus review ini?", () => {
      state.reviews = state.reviews.filter(
        (row) => row.id !== target.dataset.deleteReview,
      );
      save(LS_KEYS.reviews, state.reviews);
      renderReviews();
      renderManageLists();
      renderStats();
      toast("Review dihapus.", "success");
    });
  if (target.dataset.editMenu) editMenu(target.dataset.editMenu);
  if (target.dataset.deleteMenu)
    confirmAction("Hapus menu ini?", () =>
      deleteItem("menus", LS_KEYS.menus, target.dataset.deleteMenu),
    );
  if (target.dataset.editPromo) editPromo(target.dataset.editPromo);
  if (target.dataset.deletePromo)
    confirmAction("Hapus promo ini?", () =>
      deleteItem("promos", LS_KEYS.promos, target.dataset.deletePromo),
    );
  if (target.dataset.editGallery) editGallery(target.dataset.editGallery);
  if (target.dataset.deleteGallery)
    confirmAction("Hapus foto ini?", () =>
      deleteItem("gallery", LS_KEYS.gallery, target.dataset.deleteGallery),
    );
  if (target.dataset.editFaq) editFaq(target.dataset.editFaq);
  if (target.dataset.deleteFaq)
    confirmAction("Hapus FAQ ini?", () =>
      deleteItem("faq", LS_KEYS.faq, target.dataset.deleteFaq),
    );
  if (target.classList.contains("faq-question")) {
    const answer = target.parentElement.querySelector(".faq-answer");
    answer.classList.toggle("hidden");
    target.querySelector("span:last-child").textContent =
      answer.classList.contains("hidden") ? "+" : "−";
  }
}

function openManageTab(tabId) {
  location.hash = "#kelola";
  $$(".tab-btn").forEach((btn) =>
    btn.classList.toggle("active", btn.dataset.tab === tabId),
  );
  $$(".tab-panel").forEach((panel) =>
    panel.classList.toggle("active", panel.id === tabId),
  );
}

$$(".tab-btn").forEach((btn) =>
  btn.addEventListener("click", () => openManageTab(btn.dataset.tab)),
);

function saveSettingsForm(event) {
  event.preventDefault();
  const whatsappValue = clean($("#setWhatsapp").value);
  const emailValue = clean($("#setEmail").value);
  const mapsValue = clean($("#setMaps").value);
  if (whatsappValue && phoneDigits(whatsappValue).length < 9)
    return toast("Nomor WhatsApp belum benar.", "error");
  if (emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue))
    return toast("Format email belum benar.", "error");
  if (mapsValue && !/^https?:\/\//i.test(mapsValue))
    return toast(
      "Link Google Maps harus diawali http:// atau https://.",
      "error",
    );
  state.settings = {
    ...state.settings,
    name: clean($("#setName").value) || "Ruang Seduh",
    tagline: clean($("#setTagline").value),
    about: clean($("#setAbout").value),
    hours: clean($("#setHours").value),
    whatsapp: whatsappValue,
    email: emailValue,
    instagram: clean($("#setInstagram").value),
    address: clean($("#setAddress").value),
    maps: mapsValue,
    primary: $("#setPrimary").value,
    cream: $("#setCream").value,
    brown: $("#setBrown").value,
    textColor: $("#setTextColor").value,
    shadowMode: $("#setShadow").value,
    font: $("#setFont").value,
    radius: $("#setRadius").value,
    density: $("#setDensity").value,
    fee: Number($("#setFee").value || 0),
    promoCode: clean($("#setPromoCode").value).toUpperCase(),
    promoDiscount: Number($("#setPromoDiscount").value || 0),
  };
  save(LS_KEYS.settings, state.settings);
  applySettings();
  renderCart();
  toast("Tampilan berhasil disimpan.", "success");
}

function saveMenuForm(event) {
  event.preventDefault();
  const name = clean($("#menuNameInput").value);
  const price = Number($("#menuPriceInput").value || 0);
  if (!name) return toast("Nama menu perlu diisi dulu.", "error");
  if (price < 0) return toast("Harga belum sesuai.", "error");
  const id = $("#menuEditId").value || uid();
  const item = {
    id,
    name,
    category: clean($("#menuCategoryInput").value),
    price,
    image: clean($("#menuImageInput").value),
    description: clean($("#menuDescInput").value),
    best: $("#menuBestInput").checked,
    newItem: $("#menuNewInput").checked,
    promo: $("#menuPromoInput").checked,
    favorite: $("#menuFavInput").checked,
  };
  const index = state.menus.findIndex((row) => row.id === id);
  if (index >= 0) state.menus[index] = item;
  else state.menus.push(item);
  save(LS_KEYS.menus, state.menus);
  resetMenuForm();
  renderAll();
  toast("Menu berhasil disimpan.", "success");
}

function resetMenuForm() {
  $("#menuForm").reset();
  $("#menuEditId").value = "";
}

function editMenu(id) {
  const item = state.menus.find((row) => row.id === id);
  if (!item) return;
  openManageTab("menuManage");
  $("#menuEditId").value = item.id;
  $("#menuNameInput").value = item.name || "";
  $("#menuCategoryInput").value = item.category || "";
  $("#menuPriceInput").value = item.price || 0;
  $("#menuImageInput").value = item.image || "";
  $("#menuDescInput").value = item.description || "";
  $("#menuBestInput").checked = !!item.best;
  $("#menuNewInput").checked = !!item.newItem;
  $("#menuPromoInput").checked = !!item.promo;
  $("#menuFavInput").checked = !!item.favorite;
}

function savePromoForm(event) {
  event.preventDefault();
  const title = clean($("#promoTitleInput").value);
  if (!title) return toast("Judul promo perlu diisi dulu.", "error");
  const endDateValue = $("#promoEndInput").value;
  if (endDateValue) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(endDateValue);
    if (endDate < today)
      return toast(
        "Tanggal promo sudah lewat. Pilih tanggal yang masih berlaku.",
        "error",
      );
  }
  const id = $("#promoEditId").value || uid();
  const item = {
    id,
    title,
    code: clean($("#promoCodeManageInput").value).toUpperCase(),
    discount: Number($("#promoDiscountInput").value || 0),
    endDate: endDateValue,
    status: $("#promoStatusInput").value,
    description: clean($("#promoDescInput").value),
  };
  const index = state.promos.findIndex((row) => row.id === id);
  if (index >= 0) state.promos[index] = item;
  else state.promos.push(item);
  save(LS_KEYS.promos, state.promos);
  resetPromoForm();
  renderAll();
  toast("Promo berhasil disimpan.", "success");
}

function resetPromoForm() {
  $("#promoForm").reset();
  $("#promoEditId").value = "";
}

function editPromo(id) {
  const item = state.promos.find((row) => row.id === id);
  if (!item) return;
  openManageTab("promoManage");
  $("#promoEditId").value = item.id;
  $("#promoTitleInput").value = item.title || "";
  $("#promoCodeManageInput").value = item.code || "";
  $("#promoDiscountInput").value = item.discount || 0;
  $("#promoEndInput").value = item.endDate || "";
  $("#promoStatusInput").value = item.status || "active";
  $("#promoDescInput").value = item.description || "";
}

function saveGalleryForm(event) {
  event.preventDefault();
  const title = clean($("#galleryTitleInput").value);
  const image = clean($("#galleryImageInput").value);
  if (!title) return toast("Judul foto perlu diisi dulu.", "error");
  if (image && !/^https?:\/\//i.test(image))
    return toast("Link foto harus diawali http:// atau https://.", "error");
  const id = $("#galleryEditId").value || uid();
  const item = {
    id,
    title,
    category: clean($("#galleryCategoryInput").value),
    image,
    description: clean($("#galleryDescInput").value),
  };
  const index = state.gallery.findIndex((row) => row.id === id);
  if (index >= 0) state.gallery[index] = item;
  else state.gallery.push(item);
  save(LS_KEYS.gallery, state.gallery);
  resetGalleryForm();
  renderAll();
  toast("Foto galeri berhasil disimpan.", "success");
}

function resetGalleryForm() {
  $("#galleryForm").reset();
  $("#galleryEditId").value = "";
}

function editGallery(id) {
  const item = state.gallery.find((row) => row.id === id);
  if (!item) return;
  openManageTab("galleryManage");
  $("#galleryEditId").value = item.id;
  $("#galleryTitleInput").value = item.title || "";
  $("#galleryCategoryInput").value = item.category || "";
  $("#galleryImageInput").value = item.image || "";
  $("#galleryDescInput").value = item.description || "";
}

function saveFaqForm(event) {
  event.preventDefault();
  const question = clean($("#faqQuestionInput").value);
  const answer = clean($("#faqAnswerInput").value);
  if (!question || !answer)
    return toast("Pertanyaan dan jawaban perlu diisi dulu.", "error");
  const id = $("#faqEditId").value || uid();
  const item = { id, question, answer };
  const index = state.faq.findIndex((row) => row.id === id);
  if (index >= 0) state.faq[index] = item;
  else state.faq.push(item);
  save(LS_KEYS.faq, state.faq);
  resetFaqForm();
  renderAll();
  toast("FAQ berhasil disimpan.", "success");
}

function resetFaqForm() {
  $("#faqForm").reset();
  $("#faqEditId").value = "";
}

function editFaq(id) {
  const item = state.faq.find((row) => row.id === id);
  if (!item) return;
  openManageTab("faqManage");
  $("#faqEditId").value = item.id;
  $("#faqQuestionInput").value = item.question || "";
  $("#faqAnswerInput").value = item.answer || "";
}

function deleteItem(stateKey, storageKey, id) {
  state[stateKey] = state[stateKey].filter((item) => item.id !== id);
  save(storageKey, state[stateKey]);
  renderAll();
  toast("Data sudah dihapus.", "success");
}

function saveReservationForm(event) {
  event.preventDefault();
  const item = {
    id: uid(),
    name: clean($("#resName").value),
    phone: clean($("#resPhone").value),
    date: $("#resDate").value,
    time: $("#resTime").value,
    people: $("#resPeople").value,
    notes: clean($("#resNotes").value),
  };
  if (!item.name || !item.phone || !item.date || !item.time || !item.people)
    return toast("Lengkapi data reservasi dulu.", "error");
  state.reservations.unshift(item);
  save(LS_KEYS.reservations, state.reservations);
  $("#reservationForm").reset();
  renderReservations();
  toast("Reservasi berhasil dibuat.", "success");
  openModal(`
    <h2>Reservasi Siap Dikirim</h2>
    <p>Ringkasan reservasi sudah siap. Kirim ke WhatsApp cafe agar bisa dikonfirmasi.</p>
    <div class="receipt-box">
      <p><strong>Nama:</strong> ${escapeHtml(item.name)}</p>
      <p><strong>Tanggal:</strong> ${escapeHtml(item.date)} ${escapeHtml(item.time)}</p>
      <p><strong>Jumlah:</strong> ${escapeHtml(item.people)} orang</p>
      <p><strong>Catatan:</strong> ${escapeHtml(item.notes || "-")}</p>
    </div>
    <div class="form-actions">
      <a class="btn primary" target="_blank" rel="noreferrer" href="${whatsappUrl(state.settings.whatsapp, reservationMessage(item))}">Kirim WhatsApp</a>
    </div>
  `);
}

function saveReviewForm(event) {
  event.preventDefault();
  const item = {
    id: uid(),
    name: clean($("#reviewName").value),
    rating: Number($("#reviewRating").value),
    text: clean($("#reviewText").value),
  };
  if (!item.name || !item.rating || !item.text)
    return toast("Nama, rating, dan ulasan perlu diisi dulu.", "error");
  state.reviews.unshift(item);
  save(LS_KEYS.reviews, state.reviews);
  $("#reviewForm").reset();
  renderReviews();
  renderManageLists();
  renderStats();
  toast("Review berhasil ditambahkan.", "success");
}

function applyPromoCode() {
  const code = clean($("#promoCodeInput").value).toUpperCase();
  if (!code) return toast("Masukkan kode promo dulu.", "error");
  const promo = state.promos.find(
    (item) => item.code === code && item.status !== "inactive",
  );
  if (promo) {
    state.appliedPromo = promo;
    toast("Kode promo berhasil digunakan.", "success");
  } else if (state.settings.promoCode && state.settings.promoCode === code) {
    state.appliedPromo = { code, discount: state.settings.promoDiscount };
    toast("Kode promo berhasil digunakan.", "success");
  } else {
    state.appliedPromo = null;
    toast("Kode promo tidak ditemukan.", "error");
  }
  renderSummary();
}

function showReceipt() {
  if (!state.cart.length) return toast("Keranjang masih kosong.", "error");
  const totals = cartTotals();
  openModal(`
    <h2>Struk Digital</h2>
    <div class="receipt-box">
      <h3>${escapeHtml(state.settings.name || "Ruang Seduh")}</h3>
      <p>${new Date().toLocaleString("id-ID")}</p>
      ${state.cart
        .map((row) => {
          const item = state.menus.find((menu) => menu.id === row.menuId);
          return item
            ? `<div class="receipt-line"><span>${escapeHtml(item.name)} × ${row.qty}</span><strong>${rupiah(Number(item.price) * row.qty)}</strong></div>`
            : "";
        })
        .join("")}
      <div class="receipt-line"><span>Subtotal</span><strong>${rupiah(totals.subtotal)}</strong></div>
      <div class="receipt-line"><span>Biaya Layanan</span><strong>${rupiah(totals.fee)}</strong></div>
      <div class="receipt-line"><span>Diskon</span><strong>-${rupiah(totals.discount)}</strong></div>
      <div class="receipt-line"><span>Total</span><strong>${rupiah(totals.total)}</strong></div>
      <p>Mode: ${escapeHtml($("#orderMode").value)}</p>
      <p>Meja: ${escapeHtml($("#tableNumber").value || "-")}</p>
      <p>Catatan: ${escapeHtml($("#orderNotes").value || "-")}</p>
    </div>
    <div class="form-actions">
      <button class="btn primary" type="button" onclick="window.print()">Print Struk</button>
    </div>
  `);
}

function sendOrderWhatsApp() {
  if (!state.cart.length) return toast("Keranjang masih kosong.", "error");
  if (!state.settings.whatsapp)
    return toast("Nomor WhatsApp cafe belum diisi di Kelola.", "error");
  const totals = cartTotals();
  const lines = state.cart
    .map((row) => {
      const item = state.menus.find((menu) => menu.id === row.menuId);
      return item
        ? `- ${item.name} x${row.qty} = ${rupiah(Number(item.price) * row.qty)}`
        : "";
    })
    .filter(Boolean)
    .join("\n");
  const msg = `Halo ${state.settings.name || "Ruang Seduh"}, saya ingin memesan:\n\n${lines}\n\nMode: ${$("#orderMode").value}\nMeja: ${$("#tableNumber").value || "-"}\nCatatan: ${$("#orderNotes").value || "-"}\nTotal: ${rupiah(totals.total)}`;
  window.open(whatsappUrl(state.settings.whatsapp, msg), "_blank");
}

function showMenuDetail(id) {
  const item = state.menus.find((row) => row.id === id);
  if (!item) return;
  openModal(`
    <h2>${escapeHtml(item.name)}</h2>
    <div class="menu-visual">${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">` : "☕"}</div>
    <div class="badge-row">${badgesHtml(item)}</div>
    <p>${escapeHtml(item.description || "Deskripsi menu belum tersedia.")}</p>
    <p><strong>Kategori:</strong> ${escapeHtml(item.category || "Tanpa kategori")}</p>
    <p><strong>Harga:</strong> ${rupiah(item.price)}</p>
    <div class="form-actions"><button class="btn primary" type="button" data-add-cart="${item.id}">Tambah ke Keranjang</button></div>
  `);
}

function showPromoDetail(id) {
  const item = state.promos.find((row) => row.id === id);
  if (!item) return;
  openModal(`
    <h2>${escapeHtml(item.title)}</h2>
    <p>${escapeHtml(item.description || "Detail promo belum tersedia.")}</p>
    <p><strong>Kode:</strong> ${escapeHtml(item.code || "-")}</p>
    <p><strong>Diskon:</strong> ${Number(item.discount || 0)}%</p>
    <p><strong>Berakhir:</strong> ${escapeHtml(item.endDate || "Belum diisi")}</p>
  `);
}

function showGalleryDetail(id) {
  const item = state.gallery.find((row) => row.id === id);
  if (!item) return;
  openModal(`
    <h2>${escapeHtml(item.title)}</h2>
    <div class="gallery-visual">${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">` : "🖼️"}</div>
    <p>${escapeHtml(item.description || "Keterangan foto belum tersedia.")}</p>
    <p><strong>Kategori:</strong> ${escapeHtml(item.category || "Tanpa kategori")}</p>
  `);
}

function showReviewDetail(id) {
  const item = state.reviews.find((row) => row.id === id);
  if (!item) return;
  openModal(`
    <h2>Ulasan dari ${escapeHtml(item.name)}</h2>
    <div class="review-card">
      <div class="stars">${"★".repeat(Number(item.rating || 0))}${"☆".repeat(5 - Number(item.rating || 0))}</div>
      <p>“${escapeHtml(item.text)}”</p>
    </div>
  `);
}

function toggleFavorite(id) {
  const item = state.menus.find((row) => row.id === id);
  if (!item) return;
  item.favorite = !item.favorite;
  save(LS_KEYS.menus, state.menus);
  renderMenu();
}

function exportData() {
  const data = {
    settings: state.settings,
    menus: state.menus,
    promos: state.promos,
    gallery: state.gallery,
    reviews: state.reviews,
    faq: state.faq,
    cart: state.cart,
    reservations: state.reservations,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `ruang-seduh-data-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast("Cadangan data berhasil dibuat.", "success");
}

function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      state.settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
      state.menus = Array.isArray(data.menus) ? data.menus : [];
      state.promos = Array.isArray(data.promos) ? data.promos : [];
      state.gallery = Array.isArray(data.gallery) ? data.gallery : [];
      state.reviews = Array.isArray(data.reviews) ? data.reviews : [];
      state.faq = Array.isArray(data.faq) ? data.faq : [];
      state.cart = Array.isArray(data.cart) ? data.cart : [];
      state.reservations = Array.isArray(data.reservations)
        ? data.reservations
        : [];
      persistAll();
      applySettings();
      renderAll();
      toast("Cadangan data berhasil dipakai.", "success");
    } catch {
      toast("File data belum sesuai.", "error");
    }
    event.target.value = "";
  };
  reader.readAsText(file);
}

function persistAll() {
  save(LS_KEYS.settings, state.settings);
  save(LS_KEYS.menus, state.menus);
  save(LS_KEYS.promos, state.promos);
  save(LS_KEYS.gallery, state.gallery);
  save(LS_KEYS.reviews, state.reviews);
  save(LS_KEYS.faq, state.faq);
  save(LS_KEYS.cart, state.cart);
  save(LS_KEYS.reservations, state.reservations);
}

function resetAllData() {
  Object.values(LS_KEYS).forEach((key) => localStorage.removeItem(key));
  state = {
    settings: structuredClone(DEFAULT_SETTINGS),
    menus: [],
    promos: [],
    gallery: [],
    reviews: [],
    faq: [],
    cart: [],
    reservations: [],
    reviewIndex: 0,
    appliedPromo: null,
  };
  applySettings();
  renderAll();
  toast("Semua isi di browser ini sudah dihapus.", "success");
}

function applyThemePreset(name) {
  const presets = {
    coffee: {
      primary: "#8b4f2b",
      cream: "#f7f2ea",
      brown: "#3a2115",
      textColor: "#18100c",
      shadowMode: "soft",
      dark: false,
    },
    darkcoffee: {
      primary: "#c8874d",
      cream: "#15100d",
      brown: "#fff8ed",
      textColor: "#fff8ed",
      shadowMode: "bold",
      dark: true,
    },
    mocha: {
      primary: "#7b4b2a",
      cream: "#ffffff",
      brown: "#4b2f20",
      textColor: "#17110d",
      shadowMode: "clean",
      dark: false,
    },
  };
  const preset = presets[name];
  if (!preset) return;
  state.settings = { ...state.settings, ...preset };
  save(LS_KEYS.settings, state.settings);
  applySettings();
  toast("Tema berhasil dipakai.", "success");
}

document.addEventListener("DOMContentLoaded", init);

/* Alive UI interactions */
(function initAliveInteractions() {
  const cursorGlow = document.getElementById("cursorGlow");
  if (cursorGlow) {
    window.addEventListener("mousemove", (event) => {
      cursorGlow.style.left = `${event.clientX}px`;
      cursorGlow.style.top = `${event.clientY}px`;
    });
    window.addEventListener("mouseleave", () => {
      cursorGlow.style.opacity = "0";
    });
    window.addEventListener("mouseenter", () => {
      cursorGlow.style.opacity = ".75";
    });
  }

  document.addEventListener("click", (event) => {
    const clickable = event.target.closest(
      ".btn, .mini-action, .icon-btn, .tab-btn, .theme-preset",
    );
    if (!clickable) return;

    const rect = clickable.getBoundingClientRect();
    const ripple = document.createElement("span");
    const size = Math.max(rect.width, rect.height);
    ripple.className = "ripple-effect";
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;

    clickable.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
})();

/* Final living polish: live clock, mood line, and consistent micro interaction */
(function initLivingPolish() {
  const moods = [
    "Suasana hari ini hangat.",
    "Waktu yang pas untuk secangkir kopi.",
    "Pelan-pelan saja, kopi enak butuh waktu.",
    "Ruang Seduh siap menemani waktu santai.",
    "Obrolan ringan selalu cocok dengan kopi hangat.",
  ];

  function updateLiveMood() {
    const clock = document.getElementById("liveClock");
    const mood = document.getElementById("liveMoodText");
    if (clock) {
      const now = new Date();
      clock.textContent = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (mood) {
      const index = Math.floor(Date.now() / 7000) % moods.length;
      mood.textContent = moods[index];
    }
  }

  updateLiveMood();
  setInterval(updateLiveMood, 1000);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const overlay = document.getElementById("modalOverlay");
      if (overlay?.classList.contains("show")) {
        document.getElementById("modalClose")?.click();
      }
    }
  });
})();

/* Header/time final fix */
function updateModeLabel() {
  const modeStatus = document.getElementById("modeStatus");
  if (modeStatus && window.state?.settings) {
    modeStatus.textContent = window.state.settings.dark ? "Dark" : "Soft";
  } else if (modeStatus) {
    const isDark = document.body.classList.contains("dark");
    modeStatus.textContent = isDark ? "Dark" : "Soft";
  }
}

(function initFullRealtimeClock() {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const moods = [
    "Suasana hari ini hangat.",
    "Waktu yang pas untuk secangkir kopi.",
    "Pelan-pelan saja, kopi enak butuh waktu.",
    "Ruang Seduh siap menemani waktu santai.",
    "Obrolan ringan selalu cocok dengan kopi hangat.",
  ];

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function updateClock() {
    const now = new Date();
    const liveClock = document.getElementById("liveClock");
    const liveMood = document.getElementById("liveMoodText");

    if (liveClock) {
      const text = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()} · ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      liveClock.textContent = text;
    }

    if (liveMood) {
      const index = Math.floor(Date.now() / 7000) % moods.length;
      liveMood.textContent = moods[index];
    }

    updateModeLabel();
  }

  updateClock();
  setInterval(updateClock, 1000);
})();

/* Final spacing mode/time helper */
function updateModeLabel() {
  const modeStatus = document.getElementById("modeStatus");
  if (!modeStatus) return;
  const isDark = document.body.classList.contains("dark");
  modeStatus.textContent = isDark ? "Dark" : "Soft";
}

(function initFinalRealtimeClockClean() {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const moods = [
    "Suasana hari ini hangat.",
    "Waktu yang pas untuk secangkir kopi.",
    "Pelan-pelan saja, kopi enak butuh waktu.",
    "Ruang Seduh siap menemani waktu santai.",
    "Obrolan ringan selalu cocok dengan kopi hangat.",
  ];

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function tick() {
    const now = new Date();
    const liveClock = document.getElementById("liveClock");
    const liveMood = document.getElementById("liveMoodText");

    if (liveClock) {
      liveClock.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()} · ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    }

    if (liveMood) {
      const index = Math.floor(Date.now() / 7000) % moods.length;
      liveMood.textContent = moods[index];
    }

    updateModeLabel();
  }

  tick();
  setInterval(tick, 1000);
})();

/* Hosting-ready realtime clock */
(function initHostingRealtimeClock() {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const moods = [
    "Waktu yang pas untuk secangkir kopi.",
    "Ruang Seduh siap menemani waktu santai.",
    "Obrolan ringan selalu cocok dengan kopi hangat.",
    "Suasana hari ini hangat.",
  ];

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function updateClock() {
    const now = new Date();
    const liveClock = document.getElementById("liveClock");
    const liveMood = document.getElementById("liveMoodText");

    if (liveClock) {
      liveClock.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()} · ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    }

    if (liveMood) {
      liveMood.textContent =
        moods[Math.floor(Date.now() / 7000) % moods.length];
    }

    if (typeof updateModeLabel === "function") updateModeLabel();
  }

  updateClock();
  setInterval(updateClock, 1000);
})();

/* Back to top hosting-ready */
(function backToTopHostingReady() {
  const btn = document.getElementById("backToTop");
  if (!btn) return;
  btn.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" }),
  );
  function toggleBackTop() {
    btn.classList.toggle("show", window.scrollY > 120);
  }
  window.addEventListener("scroll", toggleBackTop, { passive: true });
  toggleBackTop();
})();

/* Final hard fix: header top + visible back to top */
(function finalHeaderAndBackTopFix() {
  const backBtn = document.getElementById("backToTop");

  function showBackButton() {
    if (!backBtn) return;
    if (window.scrollY > 80) {
      backBtn.classList.add("show");
      backBtn.style.opacity = "1";
      backBtn.style.pointerEvents = "auto";
      backBtn.style.transform = "translateY(0)";
    } else {
      backBtn.classList.remove("show");
      backBtn.style.opacity = "0";
      backBtn.style.pointerEvents = "none";
      backBtn.style.transform = "translateY(10px)";
    }
  }

  if (backBtn) {
    backBtn.addEventListener("click", (event) => {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    window.addEventListener("scroll", showBackButton, { passive: true });
    showBackButton();
  }
})();
