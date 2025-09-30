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
        } else {
            sessionStorage.removeItem("user_id");
            sessionStorage.removeItem("user_data");
        }
    },
    logout() {
        sessionStorage.removeItem("user_id");
        sessionStorage.removeItem("user_data");
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
