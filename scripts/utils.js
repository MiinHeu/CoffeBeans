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
