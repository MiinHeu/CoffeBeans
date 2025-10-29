// Cart utility functions (disabled in prototype mode internally)
import { Products, getSellPrice } from "./db.js";
import { session } from "./utils.js";

/**
 * Gets the current user's cart from localStorage
 * @returns {Array} The current user's cart items
 */
export function getCart() {
    if (typeof window !== "undefined" && window.PROTOTYPE_MODE) return [];
    const user = session.getUser();
    if (!user) return [];

    try {
        const carts = JSON.parse(localStorage.getItem("userCarts") || "{}");
        return carts[user.id] || [];
    } catch (e) {
        console.error("Error getting cart:", e);
        return [];
    }
}

/**
 * Saves the cart to localStorage
 * @param {Array} cart - The cart items to save
 */
export function setCart(cart) {
    if (typeof window !== "undefined" && window.PROTOTYPE_MODE) return;
    const user = session.getUser();
    if (!user) return;

    try {
        const carts = JSON.parse(localStorage.getItem("userCarts") || "{}");
        carts[user.id] = cart;
        localStorage.setItem("userCarts", JSON.stringify(carts));
        updateCartBadge();
    } catch (e) {
        console.error("Error saving cart:", e);
    }
}

/**
 * Updates the cart badge in the UI
 */
export function updateCartBadge() {
    const badge = document.getElementById("cart-badge");
    if (badge) {
        if (typeof window !== "undefined" && window.PROTOTYPE_MODE) {
            badge.textContent = "";
            badge.style.display = "none";
        } else {
            const count = getCart().reduce(
                (total, item) => total + (item.quantity || 1),
                0
            );
            badge.textContent = count;
            badge.style.display = count > 0 ? "flex" : "none";
        }
    }
}

/**
 * Checks if the current user is logged in
 * @returns {boolean} True if user is logged in, false otherwise
 */
function checkAuth() {
    return session.isLoggedIn();
}

/**
 * Redirects to login page with return URL
 * @param {string} returnUrl - The URL to return to after login
 */
function redirectToLogin(returnUrl = window.location.href) {
    window.location.href = `login.html?redirect=${encodeURIComponent(
        returnUrl
    )}`;
}

/**
 * Shows a login required message
 */
function showLoginRequired() {
    if (
        confirm(
            "Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng. Bạn có muốn đăng nhập ngay bây giờ?"
        )
    ) {
        redirectToLogin();
    }
}

/**
 * Adds a product to the cart
 * @param {string} productId - The ID of the product to add
 * @param {number} quantity - The quantity to add (default: 1)
 * @returns {boolean} True if successful, false otherwise
 */
export function addToCart(productId, quantity = 1) {
    if (typeof window !== "undefined" && window.PROTOTYPE_MODE) {
        alert("Prototype: Chức năng giỏ hàng đã tắt.");
        return false;
    }
    // Check if user is logged in
    if (!checkAuth()) {
        showLoginRequired();
        return false;
    }

    // Validate product
    const product = Products.list().find((p) => p.id === productId);
    if (!product) {
        console.error("Product not found:", productId);
        return false;
    }

    // Get current cart
    const cart = getCart();

    // Find existing item in cart
    const existingItem = cart.find((item) => item.id === productId);

    if (existingItem) {
        // Update quantity if item exists
        existingItem.quantity = (existingItem.quantity || 1) + quantity;
    } else {
        // Add new item to cart
        cart.push({
            id: productId,
            name: product.name,
            price: getSellPrice(productId).price,
            quantity: quantity,
            image: product.image || "",
        });
    }

    // Save cart
    setCart(cart);

    // Show success message
    showToast("Đã thêm vào giỏ hàng", "success");
    return true;
}

/**
 * Removes an item from the cart
 * @param {string} productId - The ID of the product to remove
 */
export function removeFromCart(productId) {
    if (typeof window !== "undefined" && window.PROTOTYPE_MODE) return [];
    const cart = getCart();
    const updatedCart = cart.filter((item) => item.id !== productId);
    setCart(updatedCart);
    return updatedCart;
}

/**
 * Updates the quantity of an item in the cart
 * @param {string} productId - The ID of the product to update
 * @param {number} quantity - The new quantity
 */
export function updateCartItemQuantity(productId, quantity) {
    if (typeof window !== "undefined" && window.PROTOTYPE_MODE) return [];
    if (quantity < 1) return removeFromCart(productId);

    const cart = getCart();
    const item = cart.find((item) => item.id === productId);

    if (item) {
        item.quantity = quantity;
        setCart(cart);
    }

    return cart;
}

/**
 * Clears the current user's cart
 */
export function clearCart() {
    if (typeof window !== "undefined" && window.PROTOTYPE_MODE) return;
    setCart([]);
}

/**
 * Shows a toast message
 * @param {string} message - The message to show
 * @param {string} type - The type of toast (success, error, info)
 */
function showToast(message, type = "info") {
    // Check if toast container exists, if not create it
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.style.position = "fixed";
        container.style.bottom = "20px";
        container.style.right = "20px";
        container.style.zIndex = "1000";
        document.body.appendChild(container);
    }

    // Create toast element
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.style.padding = "12px 24px";
    toast.style.marginBottom = "10px";
    toast.style.borderRadius = "4px";
    toast.style.background =
        type === "success"
            ? "#4caf50"
            : type === "error"
            ? "#f44336"
            : "#2196f3";
    toast.style.color = "white";
    toast.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    toast.style.transition = "opacity 0.3s, transform 0.3s";
    toast.textContent = message;

    // Add to container
    container.appendChild(toast);

    // Trigger reflow
    setTimeout(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
    }, 10);

    // Remove after delay
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-20px)";
        setTimeout(() => {
            container.removeChild(toast);
        }, 300);
    }, 3000);
}
