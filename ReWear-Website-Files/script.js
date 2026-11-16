// ---- Supabase connection (URL and key are set in supabase-config.js) ----
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Products now come from the Supabase "products" table
let products = [];

async function loadProducts() {
  const { data, error } = await db.from("products").select("*").order("id");

  if (error) {
    console.error("Supabase error:", error);
    showToast("Could not load products. Check supabase-config.js.");
    return;
  }

  products = data;
}

let cart = [];
let wishlist = JSON.parse(localStorage.getItem("rewearWishlist") || "[]");
let reviews = JSON.parse(localStorage.getItem("rewearReviews") || "{}");

let impact = JSON.parse(localStorage.getItem("rewearImpact") || JSON.stringify({
  sales: 0,
  swaps: 0,
  donations: 0
}));

let points = 0;

const $ = id => document.getElementById(id);

const productGrid = $("productGrid");
const searchInput = $("searchInput");
const categoryFilter = $("categoryFilter");
const emptyMessage = $("emptyMessage");
const toast = $("toast");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

let authMode = "login";
let currentUser = null;
const pointsStorageKey = email => `rewearPoints:${encodeURIComponent(email)}`;
if (currentUser) {
  points = Number(localStorage.getItem(pointsStorageKey(currentUser.email)) || 0);
}
const accountDialog = $("accountDialog");

function setAuthMode(mode) {
  authMode = mode;
  const signingUp = mode === "signup";

  $("accountTitle").textContent = signingUp
    ? "Create your account"
    : "Welcome back";
  $("accountSubmit").textContent = signingUp
    ? "Create account"
    : "Log in";

  $("accountName").hidden = !signingUp;
  $("accountNameLabel").hidden = !signingUp;
  $("accountConfirm").hidden = !signingUp;
  $("accountConfirmLabel").hidden = !signingUp;

  $("accountName").required = signingUp;
  $("accountConfirm").required = signingUp;
  $("accountPassword").autocomplete = signingUp
    ? "new-password"
    : "current-password";

  $("showLogin").classList.toggle("active", !signingUp);
  $("showSignup").classList.toggle("active", signingUp);
  $("accountMessage").textContent = "";
}

function requireLogin(action) {
  if (currentUser) return true;

  showToast(`Please log in or sign up to ${action}.`);
  setAuthMode("login");
  accountDialog.showModal();
  return false;
}

function updateAccountButton() {
  $("accountButton").textContent = currentUser
    ? `Hi, ${currentUser.name} · Log out`
    : "Log in";
  $("signupButton").hidden = Boolean(currentUser);
}

$("accountButton").addEventListener("click", async () => {
  if (currentUser) {
    await db.auth.signOut();
    showToast("Logged out.");
    return;
  }

  setAuthMode("login");
  accountDialog.showModal();
});

$("signupButton").addEventListener("click", () => {
  setAuthMode("signup");
  accountDialog.showModal();
});

$("closeAccount").addEventListener("click", () => accountDialog.close());

$("showLogin").addEventListener("click", () => setAuthMode("login"));
$("showSignup").addEventListener("click", () => setAuthMode("signup"));

$("accountForm").addEventListener("submit", async event => {
  event.preventDefault();

  const email = $("accountEmail").value.trim().toLowerCase();
  const password = $("accountPassword").value;
  const message = $("accountMessage");

  if (authMode === "signup") {
    if (password !== $("accountConfirm").value) {
      message.textContent = "Your passwords do not match.";
      return;
    }

    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: { data: { name: $("accountName").value.trim() } }
    });

    if (error) {
      message.textContent = error.message;
      return;
    }

    if (!data.session) {
      message.textContent =
        "Check your email to confirm your account, then log in.";
      return;
    }
  } else {
    const { error } = await db.auth.signInWithPassword({ email, password });

    if (error) {
      message.textContent = error.message;
      return;
    }
  }

  accountDialog.close();
  event.target.reset();
});

function saveAppData() {
  localStorage.setItem("rewearWishlist", JSON.stringify(wishlist));
  localStorage.setItem("rewearReviews", JSON.stringify(reviews));
  localStorage.setItem("rewearImpact", JSON.stringify(impact));
  if (currentUser) {
    localStorage.setItem(pointsStorageKey(currentUser.email), String(points));
  }
}

function addPoints(amount, reason) {
  if (!currentUser) {
    showToast("Log in to earn eco points.");
    return;
  }

  points += amount;
  saveAppData();
  updateRewards();
  showToast(`+${amount} points! ${reason}`);
}

function updateRewards() {
  $("rewardPoints").textContent = points;

  const nextTarget = points < 10 ? 10 : points < 50 ? 50 : 100;
  const previousTarget = points < 10 ? 0 : points < 50 ? 10 : 50;
  const progress = Math.min(
    100,
    ((points - previousTarget) / (nextTarget - previousTarget)) * 100
  );

  $("rewardProgress").style.width = `${progress}%`;

  if (points >= 100) {
    $("rewardMessage").textContent =
      "Amazing! You are a Sustainability Hero!";
    $("nextReward").textContent = "You unlocked all badges!";
  } else {
    $("rewardMessage").textContent =
      "Thank you for making fashion more sustainable!";
    $("nextReward").textContent =
      `${nextTarget - points} points to your next badge`;
  }

  updateBadge("badgeBeginner", points >= 10);
  updateBadge("badgeLover", points >= 50);
  updateBadge("badgeHero", points >= 100);
}

function updateBadge(id, unlocked) {
  const badge = $(id);
  badge.classList.toggle("unlocked", unlocked);
  badge.querySelector(".badge-status").textContent =
    unlocked ? "Unlocked ✓" : "Locked";
}

function updateImpact() {
  $("impactSales").textContent = impact.sales;
  $("impactSwaps").textContent = impact.swaps;
  $("impactDonations").textContent = impact.donations;

  const total = impact.sales + impact.swaps + impact.donations;
  $("impactTotal").textContent = total;
}

function getProductRating(productId) {
  const productReviews = reviews[productId] || [];

  if (productReviews.length === 0) {
    return "No reviews yet";
  }

  const average = productReviews.reduce(
    (sum, review) => sum + review.rating, 0
  ) / productReviews.length;

  return `★ ${average.toFixed(1)} (${productReviews.length} reviews)`;
}

function displayProducts() {
  const search = searchInput.value.toLowerCase();
  const category = categoryFilter.value;

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search);
    const matchesCategory =
      category === "all" || product.category === category;

    return matchesSearch && matchesCategory;
  });

  productGrid.innerHTML = "";
  emptyMessage.hidden = filteredProducts.length !== 0;

  filteredProducts.forEach(product => {
    productGrid.appendChild(createProductCard(product));
  });
}

function createProductCard(product) {
  const card = document.createElement("article");
  card.className = "product-card";

  const image = document.createElement("img");
  image.src = product.image;
  image.alt = product.name;
  image.loading = "lazy";

  const info = document.createElement("div");
  info.className = "product-info";

  const name = document.createElement("h3");
  name.textContent = product.name;

  const category = document.createElement("p");
  category.textContent = product.category;

  const seller = document.createElement("p");
  seller.textContent = `Seller: ${product.seller}`;

  const price = document.createElement("p");
  price.className = "product-price";
  price.textContent = `₱${product.price}`;

  const rating = document.createElement("p");
  rating.className = "rating-line";
  rating.textContent = getProductRating(product.id);

  const actions = document.createElement("div");
  actions.className = "product-actions";

  const favoriteButton = document.createElement("button");
  favoriteButton.className = "heart-button";
  favoriteButton.textContent = wishlist.includes(product.id) ? "♥" : "♡";
  favoriteButton.classList.toggle("active", wishlist.includes(product.id));
  favoriteButton.title = "Add to wishlist";

  favoriteButton.addEventListener("click", () => {
    if (!requireLogin("save favorites")) return;
    toggleWishlist(product.id);
  });

  const cartButton = document.createElement("button");
  cartButton.className = "primary-button";
  cartButton.textContent = "Add to Cart";
  cartButton.addEventListener("click", () => {
    if (!requireLogin("add items to your cart")) return;
    addToCart(product.id);
  });

  const reviewButton = document.createElement("button");
  reviewButton.className = "secondary-button";
  reviewButton.textContent = "Reviews";
  reviewButton.addEventListener("click", () => {
    if (!requireLogin("review products")) return;
    openReviews(product);
  });

  const chatButton = document.createElement("button");
  chatButton.className = "secondary-button";
  chatButton.textContent = "Chat Seller";
  chatButton.addEventListener("click", () => {
    if (!requireLogin("contact sellers")) return;
    openChat(product);
  });

  actions.append(favoriteButton, cartButton, reviewButton, chatButton);
  info.append(name, category, seller, price, rating, actions);
  card.append(image, info);

  return card;
}

searchInput.addEventListener("input", displayProducts);
categoryFilter.addEventListener("change", displayProducts);

function toggleWishlist(productId) {
  if (wishlist.includes(productId)) {
    wishlist = wishlist.filter(id => id !== productId);
    showToast("Removed from wishlist.");
  } else {
    wishlist.push(productId);
    showToast("Added to your wishlist!");
  }

  saveAppData();
  displayProducts();
  displayWishlist();
}

function displayWishlist() {
  const grid = $("wishlistGrid");
  const empty = $("wishlistEmpty");

  grid.innerHTML = "";

  const favoriteProducts = products.filter(product =>
    wishlist.includes(product.id)
  );

  empty.hidden = favoriteProducts.length !== 0;

  favoriteProducts.forEach(product => {
    grid.appendChild(createProductCard(product));
  });
}

function addToCart(productId) {
  const product = products.find(item => item.id === productId);
  if (!product) return;

  cart.push(product);
  updateCart();
  showToast(`${product.name} added to cart!`);
}

function updateCart() {
  const cartItems = $("cartItems");
  const cartTotal = $("cartTotal");

  $("cartCount").textContent = cart.length;
  cartItems.innerHTML = "";

  let total = 0;

  if (cart.length === 0) {
    cartItems.textContent = "Your cart is empty.";
  }

  cart.forEach((item, index) => {
    total += item.price;

    const row = document.createElement("div");
    row.className = "cart-item";

    const image = document.createElement("img");
    image.src = item.image;
    image.alt = item.name;

    const info = document.createElement("div");
    info.className = "cart-item-info";

    const name = document.createElement("strong");
    name.textContent = item.name;

    const price = document.createElement("span");
    price.textContent = `₱${item.price}`;

    info.append(name, price);

    const removeButton = document.createElement("button");
    removeButton.textContent = "Remove";

    removeButton.addEventListener("click", () => {
      cart.splice(index, 1);
      updateCart();
    });

    row.append(image, info, removeButton);
    cartItems.appendChild(row);
  });

  cartTotal.textContent = total;
}

$("cartButton").addEventListener("click", () => {
  if (!requireLogin("open your cart")) return;
  $("cartDialog").showModal();
});

$("closeCart").addEventListener("click", () => {
  $("cartDialog").close();
});

$("checkoutButton").addEventListener("click", () => {
  if (!requireLogin("check out")) return;
  if (cart.length === 0) {
    $("checkoutMessage").textContent = "Your cart is empty.";
    return;
  }

  $("checkoutMessage").textContent =
    "Enter your delivery address and payment method to continue.";
  $("checkoutForm").hidden = false;
});

$("checkoutForm").addEventListener("submit", event => {
  event.preventDefault();
  if (!requireLogin("place an order")) return;
  const address = $("deliveryAddress").value.trim();
  const paymentMethod = $("paymentMethod").value;
  if (!address || !paymentMethod || cart.length === 0) return;

  $("checkoutMessage").textContent =
    `Demo order placed! Delivery to ${address}. Payment: ${paymentMethod}.`;
  cart = [];
  updateCart();
  event.target.reset();
  event.target.hidden = true;
});

function openReviews(product) {
  $("reviewProductName").textContent = product.name;
  $("reviewProductId").value = product.id;
  displayReviews(product.id);
  $("reviewDialog").showModal();
}

function displayReviews(productId) {
  const list = $("reviewList");
  const productReviews = reviews[productId] || [];

  list.innerHTML = "";

  if (productReviews.length === 0) {
    list.textContent = "No reviews yet. Be the first to leave one!";
    return;
  }

  productReviews.forEach(review => {
    const entry = document.createElement("div");
    entry.className = "review-entry";

    const stars = document.createElement("div");
    stars.className = "review-stars";
    stars.textContent =
      "★".repeat(review.rating) + "☆".repeat(5 - review.rating);

    const comment = document.createElement("p");
    comment.textContent = review.comment;

    entry.append(stars, comment);
    list.appendChild(entry);
  });
}

$("closeReview").addEventListener("click", () => {
  $("reviewDialog").close();
});

$("reviewForm").addEventListener("submit", event => {
  event.preventDefault();

  const productId = $("reviewProductId").value;
  const rating = Number($("reviewRating").value);
  const comment = $("reviewText").value.trim();

  if (!rating || !comment) return;

  if (!reviews[productId]) {
    reviews[productId] = [];
  }

  reviews[productId].push({ rating, comment });

  saveAppData();
  displayReviews(productId);
  displayProducts();
  displayWishlist();

  event.target.reset();
  showToast("Thank you for your review!");
});

function openChat(product) {
  $("chatSellerName").textContent =
    `Seller: ${product.seller} | ${product.name}`;

  $("chatMessages").innerHTML = "";

  addChatBubble(
    "Hello! Thanks for your interest. How can I help you?",
    "seller"
  );

  $("chatDialog").showModal();
}

function addChatBubble(message, sender) {
  const bubble = document.createElement("div");
  bubble.className = sender === "user"
    ? "chat-bubble user-bubble"
    : "chat-bubble seller-bubble";

  bubble.textContent = message;
  $("chatMessages").appendChild(bubble);
  $("chatMessages").scrollTop = $("chatMessages").scrollHeight;
}

$("closeChat").addEventListener("click", () => {
  $("chatDialog").close();
});

$("chatForm").addEventListener("submit", event => {
  event.preventDefault();

  const input = $("chatInput");
  const message = input.value.trim();

  if (!message) return;

  addChatBubble(message, "user");
  input.value = "";

  setTimeout(() => {
    addChatBubble(
      "Thank you for your message! The seller will be happy to assist you.",
      "seller"
    );
  }, 600);
});

function setupPhotoPreview(inputId, previewId) {
  const input = $(inputId);
  const preview = $(previewId);

  input.addEventListener("change", () => {
    const file = input.files[0];
    preview.innerHTML = "";

    if (!file) {
      preview.textContent = "Your photo preview will appear here.";
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      input.value = "";
      preview.textContent = "Please select a JPG, PNG, or WEBP image.";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      input.value = "";
      preview.textContent = "Image is too large. Maximum size is 5 MB.";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const image = document.createElement("img");
      image.src = reader.result;
      image.alt = "Selected item photo";
      preview.appendChild(image);
    };

    reader.readAsDataURL(file);
  });
}

function readPhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("Please upload an item photo."));
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      reject(new Error("Please use a JPG, PNG, or WEBP photo."));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      reject(new Error("Your photo must be 5 MB or smaller."));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the photo."));

    reader.readAsDataURL(file);
  });
}

setupPhotoPreview("sellPhoto", "sellPreview");
setupPhotoPreview("swapPhoto", "swapPreview");
setupPhotoPreview("donatePhoto", "donatePreview");

function createRequestCard(data) {
  const card = document.createElement("article");
  card.className = "request-card";

  const image = document.createElement("img");
  image.src = data.photo;
  image.alt = data.title;

  const info = document.createElement("div");
  info.className = "request-info";

  const title = document.createElement("h3");
  title.textContent = data.title;

  info.appendChild(title);

  data.details.forEach(detail => {
    if (!detail) return;

    const paragraph = document.createElement("p");
    paragraph.textContent = detail;
    info.appendChild(paragraph);
  });

  const status = document.createElement("span");
  status.className = "request-status";
  status.textContent = data.status;

  info.appendChild(status);
  card.append(image, info);

  return card;
}

$("sellForm").addEventListener("submit", async event => {
  event.preventDefault();
  if (!requireLogin("sell clothes")) return;

  const message = $("sellMessage");
  const file = $("sellPhoto").files[0];

  try {
    const photo = await readPhoto(file);

    const name = $("itemName").value.trim();
    const category = $("itemCategory").value;
    const price = $("itemPrice").value;
    const contact = $("sellContact").value.trim();

    const card = createRequestCard({
      title: name,
      photo,
      details: [
        `Category: ${category}`,
        `Price: ₱${price}`,
        `Contact: ${contact}`
      ],
      status: "Listed for Sale"
    });

    $("sellItems").prepend(card);

    impact.sales++;
    saveAppData();
    updateImpact();

    message.textContent = "Your item has been added!";
    event.target.reset();
    $("sellPreview").textContent = "Your photo preview will appear here.";

    addPoints(10, "You listed an item for sale!");
  } catch (error) {
    message.textContent = error.message;
  }
});

$("swapForm").addEventListener("submit", async event => {
  event.preventDefault();
  if (!requireLogin("submit a swap request")) return;

  const message = $("swapMessageStatus");
  const file = $("swapPhoto").files[0];

  try {
    const photo = await readPhoto(file);

    const name = $("swapName").value.trim();
    const item = $("swapItem").value.trim();
    const wanted = $("swapWant").value.trim();
    const condition = $("swapCondition").value;
    const contact = $("swapContact").value.trim();
    const details = $("swapMessage").value.trim();

    const card = createRequestCard({
      title: item,
      photo,
      details: [
        `Posted by: ${name}`,
        `Looking for: ${wanted}`,
        `Condition: ${condition}`,
        `Contact: ${contact}`,
        details ? `Details: ${details}` : ""
      ],
      status: "Open for Swap"
    });

    $("swapRequests").prepend(card);

    impact.swaps++;
    saveAppData();
    updateImpact();

    message.textContent = "Your swap request has been submitted!";
    event.target.reset();
    $("swapPreview").textContent = "Your photo preview will appear here.";

    addPoints(15, "You submitted a swap request!");
  } catch (error) {
    message.textContent = error.message;
  }
});

$("donateForm").addEventListener("submit", async event => {
  event.preventDefault();
  if (!requireLogin("submit a donation")) return;

  const message = $("donateMessageStatus");
  const file = $("donatePhoto").files[0];

  try {
    const photo = await readPhoto(file);

    const name = $("donateName").value.trim();
    const item = $("donateItem").value.trim();
    const quantity = $("donateQuantity").value;
    const condition = $("donateCondition").value;
    const method = $("donateMethod").value;
    const contact = $("donateContact").value.trim();
    const details = $("donateMessage").value.trim();

    const card = createRequestCard({
      title: item,
      photo,
      details: [
        `Donated by: ${name}`,
        `Quantity: ${quantity}`,
        `Condition: ${condition}`,
        `Donation method: ${method}`,
        `Contact: ${contact}`,
        details ? `Details: ${details}` : ""
      ],
      status: "Donation Submitted"
    });

    $("donationRequests").prepend(card);

    impact.donations++;
    saveAppData();
    updateImpact();

    message.textContent = "Your donation has been submitted. Thank you!";
    event.target.reset();
    $("donatePreview").textContent = "Your photo preview will appear here.";

    addPoints(20, "Thank you for donating clothes!");
  } catch (error) {
    message.textContent = error.message;
  }
});

$("newsletterForm").addEventListener("submit", event => {
  event.preventDefault();
  if (!requireLogin("subscribe to the newsletter")) return;

  $("newsletterMessage").textContent =
    "Thank you for subscribing to ReWear!";

  event.target.reset();
});

$("menuToggle").addEventListener("click", () => {
  $("mainNav").classList.toggle("open");
});

document.querySelectorAll("#mainNav a").forEach(link => {
  link.addEventListener("click", () => {
    $("mainNav").classList.remove("open");
  });
});

$("year").textContent = new Date().getFullYear();
updateAccountButton();
updateCart();
updateImpact();
updateRewards();

async function init() {
  await loadProducts();
  displayProducts();
  displayWishlist();
}
init();

// Runs on page load and whenever someone logs in or out
db.auth.onAuthStateChange((event, session) => {
  if (session) {
    const wasLoggedOut = !currentUser;
    currentUser = {
      id: session.user.id,
      email: session.user.email,
      name: (session.user.user_metadata && session.user.user_metadata.name) || ""
    };
    points = Number(localStorage.getItem(pointsStorageKey(currentUser.email)) || 0);
    if (wasLoggedOut && event === "SIGNED_IN") {
      showToast(`Welcome${currentUser.name ? `, ${currentUser.name}` : ""}!`);
    }
  } else {
    currentUser = null;
    points = 0;
  }

  updateAccountButton();
  updateRewards();
});