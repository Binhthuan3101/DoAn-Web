const API_BASE = "/api";

let products = [];
let cart = JSON.parse(localStorage.getItem("cart") || "[]");
let wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
let currentCategory = "";
let currentUser = JSON.parse(localStorage.getItem("user") || "null");
let token = localStorage.getItem("token") || null;
let searchTimeout = null;

function formatPrice(price) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg z-[80] transition-all ${isError ? "bg-red-500 text-white" : "bg-white text-ink"}`;
  toast.classList.remove("translate-y-20", "opacity-0");
  setTimeout(() => toast.classList.add("translate-y-20", "opacity-0"), 2800);
}

function toggleMobile() {
  document.getElementById("mobileNav").classList.toggle("hidden");
}

function showPage(name) {
  ["home", "shop", "about", "contact", "orders"].forEach((p) => {
    const el = document.getElementById("page-" + p);
    if (el) el.classList.add("hidden");
  });
  if (name === "home") {
    document.getElementById("page-home").classList.remove("hidden");
    document.getElementById("page-shop").classList.remove("hidden");
  } else {
    document.getElementById("page-" + name).classList.remove("hidden");
    if (name === "shop")
      document.getElementById("page-shop").classList.remove("hidden");
    if (name === "orders") loadMyOrders();
  }
  document.getElementById("mobileNav").classList.add("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateAuthUI() {
  const authButtons = document.getElementById("authButtons");
  const userInfo = document.getElementById("userInfo");
  const btnMobile = document.getElementById("btn-mobile");
  if (currentUser && token) {
    authButtons.className = "hidden sm:hidden gap-2";
    userInfo.classList.remove("hidden");
    userInfo.classList.add("flex");
    btnMobile.classList.add("hidden");
    document.getElementById("userName").textContent = currentUser.fullName;
  } else {
    authButtons.className = "hidden sm:flex items-center gap-2";
    userInfo.classList.add("hidden");
    userInfo.classList.remove("flex");
    btnMobile.classList.remove("hidden");
  }
}

function toggleUserMenu() {
  document.getElementById("userMenu").classList.toggle("hidden");
}

function updateBadges() {
  const cartQty = cart.reduce((s, i) => s + i.quantity, 0);
  const cartBadge = document.getElementById("cartBadge");
  cartBadge.textContent = cartQty;
  cartBadge.classList.toggle("hidden", cartQty === 0);
  const wishBadge = document.getElementById("wishBadge");
  wishBadge.textContent = wishlist.length;
  wishBadge.classList.toggle("hidden", wishlist.length === 0);
}

async function fetchProducts(search = "", category = "") {
  const loading = document.getElementById("loading");
  const empty = document.getElementById("emptyState");
  const grid = document.getElementById("productGrid");
  loading.classList.remove("hidden");
  empty.classList.add("hidden");
  grid.innerHTML = "";
  try {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (category) params.append("category", category);
    const res = await fetch(`${API_BASE}/products?${params}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    products = json.data;
    applySort();
  } catch (err) {
    showToast("Không thể tải sản phẩm", true);
  } finally {
    loading.classList.add("hidden");
  }
}

async function loadCategories() {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    const json = await res.json();
    const cats = json.success
      ? json.data
      : [
          { CategoryName: "Laptop" },
          { CategoryName: "Smartphone" },
          { CategoryName: "Phụ kiện" },
        ];
    const wrap = document.getElementById("categoryFilter");
    wrap.innerHTML =
      `<button onclick="filterCategory('')" class="cat-btn px-4 py-2 rounded-full bg-neon text-ink text-sm font-semibold">Tất cả</button>` +
      cats
        .map(
          (c) =>
            `<button onclick="filterCategory('${c.CategoryName}')" class="cat-btn px-4 py-2 rounded-full border border-line text-sm hover:border-neon">${c.CategoryName}</button>`,
        )
        .join("");
  } catch {
    document.getElementById("categoryFilter").innerHTML = `
      <button onclick="filterCategory('')" class="cat-btn px-4 py-2 rounded-full bg-neon text-ink text-sm font-semibold">Tất cả</button>
      <button onclick="filterCategory('Laptop')" class="cat-btn px-4 py-2 rounded-full border border-line text-sm">Laptop</button>
      <button onclick="filterCategory('Smartphone')" class="cat-btn px-4 py-2 rounded-full border border-line text-sm">Smartphone</button>
      <button onclick="filterCategory('Phụ kiện')" class="cat-btn px-4 py-2 rounded-full border border-line text-sm">Phụ kiện</button>`;
  }
}

function applySort() {
  const mode = document.getElementById("sortSelect").value;
  let list = [...products];
  if (mode === "priceAsc") list.sort((a, b) => a.Price - b.Price);
  if (mode === "priceDesc") list.sort((a, b) => b.Price - a.Price);
  if (mode === "name")
    list.sort((a, b) => a.ProductName.localeCompare(b.ProductName, "vi"));
  renderProducts(list);
}

function renderProducts(list) {
  const grid = document.getElementById("productGrid");
  const empty = document.getElementById("emptyState");
  if (!list.length) {
    empty.classList.remove("hidden");
    grid.innerHTML = "";
    return;
  }
  empty.classList.add("hidden");
  grid.innerHTML = list
    .map((p) => {
      const loved = wishlist.includes(p.ProductID);
      return `
    <div class="bg-panel border border-line rounded-2xl overflow-hidden card-hover transition flex flex-col">
      <div class="relative">
        <img src="${p.ImageURL || "https://placehold.co/400x300"}" class="w-full h-48 object-cover cursor-pointer" onclick="openDetail(${p.ProductID})" />
        <button onclick="toggleWish(${p.ProductID})" class="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50">${loved ? "♥" : "♡"}</button>
      </div>
      <div class="p-4 flex-1 flex flex-col">
        <p class="text-xs text-neon">${p.CategoryName || ""}</p>
        <h3 class="font-semibold text-white mt-1 cursor-pointer" onclick="openDetail(${p.ProductID})">${p.ProductName}</h3>
        <p class="text-sm text-slate-400 mt-1 line-clamp-2 flex-1">${p.Description || ""}</p>
        <div class="mt-3 flex items-center justify-between">
          <span class="font-bold text-gold">${formatPrice(p.Price)}</span>
          <span class="text-xs text-slate-500">Kho: ${p.Stock}</span>
        </div>
        <button onclick="addToCart(${p.ProductID})" ${p.Stock <= 0 ? "disabled" : ""}
          class="mt-3 w-full py-2 rounded-xl bg-neon text-ink font-semibold disabled:opacity-40">
          ${p.Stock <= 0 ? "Hết hàng" : "Thêm vào giỏ"}
        </button>
      </div>
    </div>`;
    })
    .join("");
}

function handleSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const keyword = document.getElementById("searchInput").value.trim();
    showPage("shop");
    fetchProducts(keyword, currentCategory);
  }, 350);
}
function syncSearch(v) {
  document.getElementById("searchInput").value = v;
  handleSearch();
}
function filterCategory(cat) {
  currentCategory = cat;
  showPage("shop");
  document.querySelectorAll(".cat-btn").forEach((btn) => {
    btn.classList.remove("bg-neon", "text-ink");
    btn.classList.add("border", "border-line");
  });
  event?.target?.classList.add("bg-neon", "text-ink");
  fetchProducts(document.getElementById("searchInput").value.trim(), cat);
}

function openDetail(id) {
  const p = products.find((x) => x.ProductID === id);
  if (!p) return;
  document.getElementById("detailContent").innerHTML = `
    <div class="grid md:grid-cols-2 gap-5">
      <img src="${p.ImageURL}" class="rounded-xl w-full h-56 object-cover" />
      <div>
        <p class="text-neon text-sm">${p.CategoryName}</p>
        <h3 class="text-2xl font-bold text-white mt-1">${p.ProductName}</h3>
        <p class="text-gold text-xl font-bold mt-3">${formatPrice(p.Price)}</p>
        <p class="text-slate-400 mt-3">${p.Description || ""}</p>
        <p class="text-sm mt-2">Tồn kho: ${p.Stock}</p>
        <button onclick="addToCart(${p.ProductID}); closeDetail();" class="mt-4 px-5 py-2 bg-neon text-ink font-bold rounded-xl">Thêm vào giỏ</button>
      </div>
    </div>`;
  const m = document.getElementById("detailModal");
  m.classList.remove("hidden");
  m.classList.add("flex");
}
function closeDetail() {
  const m = document.getElementById("detailModal");
  m.classList.add("hidden");
  m.classList.remove("flex");
}

function addToCart(productId) {
  const product = products.find((p) => p.ProductID === productId);
  if (!product || product.Stock <= 0) return;
  const existing = cart.find((i) => i.productId === productId);
  if (existing) {
    if (existing.quantity >= product.Stock)
      return showToast("Không đủ hàng", true);
    existing.quantity += 1;
  } else {
    cart.push({
      productId: product.ProductID,
      name: product.ProductName,
      price: product.Price,
      image: product.ImageURL,
      quantity: 1,
      stock: product.Stock,
    });
  }
  localStorage.setItem("cart", JSON.stringify(cart));
  updateBadges();
  showToast("Đã thêm vào giỏ");
}

function openCart() {
  renderCart();
  document.getElementById("cartOverlay").classList.remove("hidden");
  document.getElementById("cartPanel").classList.remove("translate-x-full");
}
function closeCart() {
  document.getElementById("cartPanel").classList.add("translate-x-full");
  setTimeout(
    () => document.getElementById("cartOverlay").classList.add("hidden"),
    250,
  );
}
function renderCart() {
  const box = document.getElementById("cartItems");
  if (!cart.length) {
    box.innerHTML =
      '<p class="text-center text-slate-500 py-10">Giỏ hàng trống</p>';
    document.getElementById("cartTotal").textContent = formatPrice(0);
    return;
  }
  let total = 0;
  box.innerHTML = cart
    .map((item, i) => {
      total += item.price * item.quantity;
      return `<div class="flex gap-3">
      <img src="${item.image}" class="w-16 h-16 rounded-lg object-cover" />
      <div class="flex-1">
        <p class="text-sm text-white">${item.name}</p>
        <p class="text-gold text-sm">${formatPrice(item.price)}</p>
        <div class="flex items-center gap-2 mt-1">
          <button onclick="changeQty(${i},-1)" class="w-6 h-6 border border-line rounded">-</button>
          <span>${item.quantity}</span>
          <button onclick="changeQty(${i},1)" class="w-6 h-6 border border-line rounded">+</button>
          <button onclick="removeItem(${i})" class="ml-auto text-red-400 text-xs">Xoá</button>
        </div>
      </div>
    </div>`;
    })
    .join("");
  document.getElementById("cartTotal").textContent = formatPrice(total);
}
function changeQty(i, d) {
  const item = cart[i];
  const q = item.quantity + d;
  if (q < 1 || q > item.stock) return;
  item.quantity = q;
  localStorage.setItem("cart", JSON.stringify(cart));
  updateBadges();
  renderCart();
}
function removeItem(i) {
  cart.splice(i, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  updateBadges();
  renderCart();
}

function toggleWish(id) {
  if (wishlist.includes(id)) wishlist = wishlist.filter((x) => x !== id);
  else wishlist.push(id);
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  updateBadges();
  applySort();
}
function openWishlist() {
  const box = document.getElementById("wishList");
  const items = products.filter((p) => wishlist.includes(p.ProductID));
  box.innerHTML = items.length
    ? items
        .map(
          (p) => `
    <div class="flex justify-between items-center border border-line rounded-xl p-3">
      <span>${p.ProductName}</span>
      <button onclick="addToCart(${p.ProductID})" class="text-neon text-sm">Thêm giỏ</button>
    </div>`,
        )
        .join("")
    : '<p class="text-slate-500">Chưa có sản phẩm yêu thích</p>';
  const m = document.getElementById("wishModal");
  m.classList.remove("hidden");
  m.classList.add("flex");
}
function closeWishlist() {
  const m = document.getElementById("wishModal");
  m.classList.add("hidden");
  m.classList.remove("flex");
}

function showCheckoutForm() {
  if (!cart.length) return showToast("Giỏ hàng trống", true);
  if (currentUser) {
    document.getElementById("customerName").value = currentUser.fullName || "";
    document.getElementById("customerPhone").value = currentUser.phone || "";
    document.getElementById("customerAddress").value =
      currentUser.address || "";
  }
  closeCart();
  const m = document.getElementById("checkoutModal");
  m.classList.remove("hidden");
  m.classList.add("flex");
}
function closeCheckout() {
  const m = document.getElementById("checkoutModal");
  m.classList.add("hidden");
  m.classList.remove("flex");
}

async function submitOrder(e) {
  e.preventDefault();
  const payload = {
    customerName: document.getElementById("customerName").value.trim(),
    customerPhone: document.getElementById("customerPhone").value.trim(),
    customerAddress: document.getElementById("customerAddress").value.trim(),
    items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
  };
  try {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    showToast(json.message);
    cart = [];
    localStorage.setItem("cart", JSON.stringify(cart));
    updateBadges();
    closeCheckout();
    fetchProducts(
      document.getElementById("searchInput").value,
      currentCategory,
    );
  } catch (err) {
    showToast(err.message || "Đặt hàng thất bại", true);
  }
}

function openLoginModal() {
  const m = document.getElementById("loginModal");
  m.classList.remove("hidden");
  m.classList.add("flex");
  document.body.classList.add("overflow-y-hidden");
}
function closeLoginModal() {
  const m = document.getElementById("loginModal");
  m.classList.add("hidden");
  m.classList.remove("flex");
  document.body.classList.remove("overflow-y-hidden");
}
function openRegisterModal() {
  const m = document.getElementById("registerModal");
  m.classList.remove("hidden");
  m.classList.add("flex");

  document.body.classList.add("overflow-y-hidden");
}
function closeRegisterModal() {
  const m = document.getElementById("registerModal");
  m.classList.add("hidden");
  m.classList.remove("flex");
  document.body.classList.remove("overflow-y-hidden");
}
function switchToRegister() {
  closeLoginModal();
  openRegisterModal();
}
function switchToLogin() {
  closeRegisterModal();
  openLoginModal();
}

async function handleLogin(e) {
  e.preventDefault();
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: document.getElementById("loginEmail").value.trim(),
        password: document.getElementById("loginPassword").value,
      }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    token = json.data.token;
    currentUser = json.data.user;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(currentUser));
    updateAuthUI();
    closeLoginModal();
    showToast("Đăng nhập thành công");
  } catch (err) {
    showToast(err.message, true);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: document.getElementById("regFullName").value.trim(),
        email: document.getElementById("regEmail").value.trim(),
        phone: document.getElementById("regPhone").value.trim(),
        password: document.getElementById("regPassword").value,
        address: document.getElementById("regAddress").value.trim(),
      }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    token = json.data.token;
    currentUser = json.data.user;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(currentUser));
    updateAuthUI();
    closeRegisterModal();
    showToast("Đăng ký thành công");
  } catch (err) {
    showToast(err.message, true);
  }
}

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  document.getElementById("userMenu").classList.add("hidden");
  updateAuthUI();
  showToast("Đã đăng xuất");
  showPage("home");
}

async function loadMyOrders() {
  const box = document.getElementById("ordersList");
  if (!token) {
    box.innerHTML = "<p>Vui lòng đăng nhập để xem đơn hàng.</p>";
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/orders/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    if (!json.data.length) {
      box.innerHTML = '<p class="text-slate-400">Chưa có đơn hàng.</p>';
      return;
    }
    box.innerHTML = json.data
      .map(
        (o) => `
      <div class="border border-line rounded-2xl p-4 bg-panel">
        <div class="flex justify-between"><b class="text-white">#${o.OrderID}</b><span class="text-neon">${o.Status}</span></div>
        <p class="text-sm text-slate-400 mt-1">${new Date(o.OrderDate).toLocaleString("vi-VN")} • ${formatPrice(o.TotalAmount)}</p>
        <ul class="mt-2 text-sm">${(o.items || []).map((i) => `<li>${i.ProductName} × ${i.Quantity}</li>`).join("")}</ul>
      </div>`,
      )
      .join("");
  } catch (err) {
    box.innerHTML = `<p class="text-red-300">${err.message}</p>`;
  }
}

function sendContact(e) {
  e.preventDefault();
  showToast("Đã gửi liên hệ! Chúng tôi sẽ phản hồi sớm.");
  e.target.reset();
}
function subscribeNews() {
  const email = document.getElementById("newsEmail").value.trim();
  if (!email) return showToast("Nhập email", true);
  showToast("Đã đăng ký nhận ưu đãi");
  document.getElementById("newsEmail").value = "";
}

document.addEventListener("DOMContentLoaded", () => {
  updateAuthUI();
  updateBadges();
  loadCategories();
  fetchProducts();
  showPage("home");
});
