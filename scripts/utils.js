// Global prototype flag: Only login/register simulation is allowed
if (typeof window !== "undefined") {
    window.PROTOTYPE_MODE = true;
}

export const fmt = {
    currency(v) {
        return Number(v || 0).toLocaleString("vi-VN");
    },
    dateISO(d) {
        return new Date(d).toISOString().slice(0, 10);
    },
};

export const session = {
    isAdmin() {
        return sessionStorage.getItem("is_admin") === "1";
    },
    setAdmin(v) {
        v
            ? sessionStorage.setItem("is_admin", "1")
            : sessionStorage.removeItem("is_admin");
    },
    isLoggedIn() {
        return sessionStorage.getItem("user_id") !== null;
    },
    getUser() {
        const userId = sessionStorage.getItem("user_id");
        if (!userId) return null;

        try {
            const userData = sessionStorage.getItem("user_data");
            return userData ? JSON.parse(userData) : null;
        } catch (e) {
            return null;
        }
    },
    setUser(user) {
        if (user) {
            sessionStorage.setItem("user_id", user.id);
            sessionStorage.setItem("user_data", JSON.stringify(user));

            // Restore user's cart when logging in
            this.restoreUserCart(user.id);
        } else {
            sessionStorage.removeItem("user_id");
            sessionStorage.removeItem("user_data");
        }
    },
    restoreUserCart(userId) {
        try {
            const carts = JSON.parse(localStorage.getItem("userCarts") || "{}");
            const userCart = carts[userId] || [];

            // Restore cart to generic storage for compatibility with cart.html
            localStorage.setItem("cart", JSON.stringify(userCart));

            // Restore selected items
            const selectedCarts = JSON.parse(
                localStorage.getItem("userCartSelected") || "{}"
            );
            const userSelected = selectedCarts[userId] || [];
            localStorage.setItem("cart_selected", JSON.stringify(userSelected));

            console.log(
                `Restored cart for user ${userId}:`,
                userCart.length,
                "items,",
                userSelected.length,
                "selected"
            );
        } catch (e) {
            console.error("Error restoring user cart:", e);
        }
    },
    logout() {
        // Get user before clearing session data
        const user = this.getUser();

        // Save current cart and selected items to user-specific storage before logout
        if (user) {
            try {
                const currentCart = JSON.parse(
                    localStorage.getItem("cart") || "[]"
                );
                const currentSelected = JSON.parse(
                    localStorage.getItem("cart_selected") || "[]"
                );

                // Save cart
                if (currentCart.length > 0) {
                    const carts = JSON.parse(
                        localStorage.getItem("userCarts") || "{}"
                    );
                    carts[user.id] = currentCart;
                    localStorage.setItem("userCarts", JSON.stringify(carts));
                }

                // Save selected items
                if (currentSelected.length > 0) {
                    const selectedCarts = JSON.parse(
                        localStorage.getItem("userCartSelected") || "{}"
                    );
                    selectedCarts[user.id] = currentSelected;
                    localStorage.setItem(
                        "userCartSelected",
                        JSON.stringify(selectedCarts)
                    );
                }
            } catch (e) {
                console.error("Error saving cart before logout:", e);
            }
        }

        // Clear session data
        sessionStorage.removeItem("user_id");
        sessionStorage.removeItem("user_data");

        // Clear generic cart data so new users don't see previous user's cart
        try {
            localStorage.removeItem("cart");
            localStorage.removeItem("cart_selected");
        } catch (e) {
            console.error("Error clearing generic cart on logout:", e);
        }
    },
};

export function paginate(items, page = 1, pageSize = 8) {
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const p = Math.min(Math.max(1, page), pages);
    const start = (p - 1) * pageSize;
    const end = start + pageSize;
    return { page: p, pages, total, data: items.slice(start, end) };
}

export function qs(sel, root = document) {
    return root.querySelector(sel);
}
export function qsa(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
}
