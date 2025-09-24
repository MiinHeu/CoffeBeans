// Simple localStorage database for demo purposes
const DB_KEY = "caphe_db_v1";

const DefaultDB = {
    auth: {
        admins: [
            {
                id: "admin-1",
                email: "admin@caphe.vn",
                password: "123456",
                name: "Quản trị viên",
            },
        ],
    },
    users: [
        {
            id: "u1",
            email: "kh1@example.com",
            name: "Khách Hàng 1",
            locked: false,
            address: "HCM",
            phone: "0901000111",
            password: "123456",
        },
        {
            id: "u2",
            email: "kh2@example.com",
            name: "Khách Hàng 2",
            locked: false,
            address: "HN",
            phone: "0902000222",
            password: "123456",
        },
    ],
    productTypes: [
        { id: "t1", name: "Arabica", hidden: false, profitPercent: 20 },
        { id: "t2", name: "Robusta", hidden: false, profitPercent: 18 },
        { id: "t3", name: "Blend", hidden: false, profitPercent: 22 },
    ],
    products: [
        {
            id: "p1",
            typeId: "t1",
            code: "ARB-250",
            name: "Arabica Premium 250g",
            image: "",
            desc: "Hạt Arabica rang vừa",
            hidden: false,
            profitPercent: null,
        },
        {
            id: "p2",
            typeId: "t2",
            code: "ROB-500",
            name: "Robusta Bold 500g",
            image: "",
            desc: "Đậm đà cho phin",
            hidden: false,
            profitPercent: null,
        },
        {
            id: "p3",
            typeId: "t3",
            code: "BLD-1KG",
            name: "Signature Blend 1kg",
            image: "",
            desc: "Phối trộn cân bằng",
            hidden: false,
            profitPercent: null,
        },
    ],
    receipts: [
        // { id, date, status: 'draft'|'done', items:[{productId, costPrice, qty}] }
    ],
    orders: [
        // { id, userId, date, status: 'new'|'processing'|'shipped'|'canceled', items:[{productId, price, qty, address}], note }
    ],
};

function loadDB() {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
        localStorage.setItem(DB_KEY, JSON.stringify(DefaultDB));
        return JSON.parse(JSON.stringify(DefaultDB));
    }
    try {
        return JSON.parse(raw);
    } catch (e) {
        console.error("DB parse error, resetting", e);
        localStorage.setItem(DB_KEY, JSON.stringify(DefaultDB));
        return JSON.parse(JSON.stringify(DefaultDB));
    }
}

function saveDB(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export function dbGet() {
    return loadDB();
}
export function dbSet(next) {
    saveDB(next);
}

// Generic helpers
export function uid(prefix = "id") {
    return prefix + "-" + Math.random().toString(36).slice(2, 9);
}

// Collections APIs
export const AdminAuth = {
    login(email, password) {
        const db = loadDB();
        const admin = db.auth.admins.find(
            (a) => a.email === email && a.password === password
        );
        return admin || null;
    },
};

export const Users = {
    list() {
        return loadDB().users;
    },
    setAll(list) {
        const db = loadDB();
        db.users = list;
        saveDB(db);
    },
    resetPassword(id, newPass = "123456") {
        const db = loadDB();
        const u = db.users.find((x) => x.id === id);
        if (u) {
            u.password = newPass;
            saveDB(db);
        }
        return !!u;
    },
    toggleLock(id) {
        const db = loadDB();
        const u = db.users.find((x) => x.id === id);
        if (u) {
            u.locked = !u.locked;
            saveDB(db);
        }
        return !!u;
    },
};

export const Types = {
    list() {
        return loadDB().productTypes;
    },
    create(input) {
        const db = loadDB();
        const item = {
            id: uid("t"),
            name: input.name,
            hidden: false,
            profitPercent: input.profitPercent ?? 0,
        };
        db.productTypes.push(item);
        saveDB(db);
        return item;
    },
    update(id, patch) {
        const db = loadDB();
        const it = db.productTypes.find((x) => x.id === id);
        if (it) {
            Object.assign(it, patch);
            saveDB(db);
        }
        return it;
    },
    remove(id) {
        const db = loadDB();
        db.productTypes = db.productTypes.filter((x) => x.id !== id);
        saveDB(db);
    },
};

export const Products = {
    list() {
        return loadDB().products;
    },
    create(input) {
        const db = loadDB();
        const item = {
            id: uid("p"),
            typeId: input.typeId,
            code: input.code,
            name: input.name,
            image: input.image || "",
            desc: input.desc || "",
            hidden: false,
            profitPercent: input.profitPercent ?? null,
        };
        db.products.push(item);
        saveDB(db);
        return item;
    },
    update(id, patch) {
        const db = loadDB();
        const it = db.products.find((x) => x.id === id);
        if (it) {
            Object.assign(it, patch);
            saveDB(db);
        }
        return it;
    },
    remove(id) {
        const db = loadDB();
        db.products = db.products.filter((x) => x.id !== id);
        saveDB(db);
    },
};

export const Receipts = {
    list() {
        return loadDB().receipts;
    },
    create({ date, items }) {
        const db = loadDB();
        const item = {
            id: uid("r"),
            date,
            status: "draft",
            items: items || [],
        };
        db.receipts.push(item);
        saveDB(db);
        return item;
    },
    update(id, patch) {
        const db = loadDB();
        const it = db.receipts.find((x) => x.id === id);
        if (it && it.status === "draft") {
            Object.assign(it, patch);
            saveDB(db);
        }
        return it;
    },
    complete(id) {
        const db = loadDB();
        const it = db.receipts.find((x) => x.id === id);
        if (it) {
            it.status = "done";
            saveDB(db);
        }
        return it;
    },
};

export const Orders = {
    list() {
        return loadDB().orders;
    },
    create(order) {
        const db = loadDB();
        const item = {
            id: uid("o"),
            status: "new",
            date: order.date,
            userId: order.userId,
            items: order.items,
            note: order.note || "",
        };
        db.orders.push(item);
        saveDB(db);
        return item;
    },
    update(id, patch) {
        const db = loadDB();
        const it = db.orders.find((x) => x.id === id);
        if (it) {
            Object.assign(it, patch);
            saveDB(db);
        }
        return it;
    },
};

// Derived helpers
export function computeStock() {
    const { receipts, orders, products } = loadDB();
    const map = new Map(products.map((p) => [p.id, 0]));
    receipts.forEach((r) => {
        r.items.forEach((it) => {
            map.set(
                it.productId,
                (map.get(it.productId) || 0) + Number(it.qty)
            );
        });
    });
    orders.forEach((o) => {
        o.items.forEach((it) => {
            map.set(
                it.productId,
                (map.get(it.productId) || 0) - Number(it.qty)
            );
        });
    });
    return map; // productId -> qty
}

export function getSellPrice(productId) {
    const db = loadDB();
    // Cost = weighted avg from receipts
    let totalQty = 0;
    let totalCost = 0;
    db.receipts.forEach((r) => {
        r.items.forEach((it) => {
            if (it.productId === productId) {
                totalQty += Number(it.qty);
                totalCost += Number(it.qty) * Number(it.costPrice);
            }
        });
    });
    const cost = totalQty > 0 ? totalCost / totalQty : 0;
    const product = db.products.find((p) => p.id === productId);
    const type = db.productTypes.find((t) => t.id === product.typeId);
    const percent = product.profitPercent ?? type?.profitPercent ?? 0;
    const price = Math.round(cost * (1 + percent / 100));
    return { cost, percent, price };
}
