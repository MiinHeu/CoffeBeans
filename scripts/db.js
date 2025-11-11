// PROTOTYPE MODE: Minimal database for login/logout only
// All other data handling disabled per course requirements

const DB_KEY = "caphe_db_v1";

// Initialize default users in localStorage - PROTOTYPE ONLY
const DefaultDB = {
    users: [
        {
            id: "u1",
            email: "kh1@example.com",
            name: "Khách Hàng 1",
            phone: "0901000111",
            address: "HCM",
            password: "123456",
        },
        {
            id: "u2",
            email: "kh2@example.com",
            name: "Khách Hàng 2",
            phone: "0902000222",
            address: "HN",
            password: "123456",
        },
    ],
};

function initDB() {
    // Initialize DB if not exists
    const existing = localStorage.getItem(DB_KEY);
    if (!existing) {
        localStorage.setItem(DB_KEY, JSON.stringify(DefaultDB));
        console.log("✓ DB initialized with default users");
    }
}
<<<<<<< HEAD
=======

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
            price: input.price || 0,
            hidden: false,
            profitPercent: input.profitPercent ?? null,
            specs: input.specs || {
                weight: "",
                roastLevel: "Vừa",
                packaging: "Túi có van thoát khí",
                shelfLife: "12 tháng kể từ ngày sản xuất",
                origin: "",
                altitude: "",
                processingMethod: "Ướt",
            },
        };
        db.products.push(item);
        saveDB(db);
        return item;
    },
    update(id, patch) {
        const db = loadDB();
        const it = db.products.find((x) => x.id === id);
        if (it) {
            // Ensure price is always a number
            if (patch.price !== undefined) {
                patch.price = Number(patch.price) || 0;
            }
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
            id: order.id || uid("o"),
            status: order.status || "new",
            date: order.date || new Date().toISOString(),
            userId: order.userId,
            customerName: order.customerName || "",
            customerPhone: order.customerPhone || "",
            customerEmail: order.customerEmail || "",
            shippingAddress: order.shippingAddress || "",
            deliveryMethod: order.deliveryMethod || "delivery",
            paymentMethod: order.paymentMethod || "cod",
            note: order.note || "",
            subtotal: order.subtotal || 0,
            shipping: order.shipping || 0,
            total: order.total || 0,
            items: order.items.map((item) => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image || "",
            })),
        };
        db.orders.push(item);
        saveDB(db);
        return item;
    },
    update(id, patch) {
        const db = loadDB();
        const it = db.orders.find((x) => x.id === id);
        if (!it) return null;

        // Nếu đơn hàng đã bị hủy, không cho phép cập nhật trạng thái
        if (it.status === "canceled") {
            throw new Error("Không thể thay đổi trạng thái đơn hàng đã hủy");
        }

        // Nếu đang cập nhật trạng thái thành 'hủy', thêm hàng trở lại kho
        if (patch.status === "canceled") {
            // Tạo phiếu nhập kho để cộng lại hàng
            const receipt = {
                id: uid("rec"),
                date: new Date().toISOString(),
                status: "done",
                note: `Hủy đơn hàng #${id}`,
                items: it.items.map((item) => ({
                    productId: item.productId,
                    qty: item.quantity,
                    costPrice: 0, // Không theo dõi giá gốc khi hủy đơn
                })),
            };
            db.receipts.push(receipt);
        }

        // Cập nhật thông tin đơn hàng
        Object.assign(it, patch);
        saveDB(db);
        return it;
    },
};

// Derived helpers
export function computeStock() {
    const { receipts, orders, products } = loadDB();
    const map = new Map(products.map((p) => [p.id, 0]));
    // Only count receipts that are completed (status = 'done')
    receipts
        .filter((r) => r.status === "done")
        .forEach((r) => {
            r.items.forEach((it) => {
                map.set(
                    it.productId,
                    (map.get(it.productId) || 0) + Number(it.qty)
                );
            });
        });
    // Only subtract stock for orders that are not canceled
    orders
        .filter((o) => o.status !== "canceled")
        .forEach((o) => {
            o.items.forEach((it) => {
                map.set(
                    it.productId,
                    (map.get(it.productId) || 0) -
                        Number(it.quantity || it.qty || 0)
                );
            });
        });
    return map; // productId -> qty
}

export function getSellPrice(productId) {
    const db = loadDB();
    const product = db.products.find((p) => p.id === productId);

    // If product has a direct price set, use that
    if (product && typeof product.price === "number" && product.price > 0) {
        return {
            cost: 0,
            percent: 0,
            price: product.price,
        };
    }

    // Otherwise calculate price based on cost and profit percentage
    // Only consider completed receipts (status = 'done')
    let totalQty = 0;
    let totalCost = 0;
    db.receipts
        .filter((r) => r.status === "done")
        .forEach((r) => {
            r.items.forEach((it) => {
                if (it.productId === productId) {
                    totalQty += Number(it.qty);
                    totalCost += Number(it.qty) * Number(it.costPrice);
                }
            });
        });

    const cost = totalQty > 0 ? totalCost / totalQty : 0;
    const type = product
        ? db.productTypes.find((t) => t.id === product.typeId)
        : null;
    const percent = (product?.profitPercent ?? type?.profitPercent) || 0;
    const price = Math.round(cost * (1 + percent / 100));

    return {
        cost,
        percent,
        price: price > 0 ? price : 0,
    };
}
>>>>>>> 1af686ec77b3b8aa9491cdf5ff55a4e619669b74
