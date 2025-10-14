import {
    dbGet,
    dbSet,
    Users,
    Types,
    Products,
    Receipts,
    Orders,
    computeStock,
    getSellPrice,
} from "./db.js";
import { fmt, session, paginate, qs, qsa } from "./utils.js";

// Guard admin session
if (!session.isAdmin()) {
    location.href = "admin-login.html";
}

// Xử lý đăng xuất
document.getElementById("logout")?.addEventListener("click", (e) => {
    e.preventDefault();
    session.setAdmin(false);
    location.href = "admin-login.html";
});

// Khởi tạo ứng dụng
const app = document.getElementById("app");
if (!app) {
    document.body.innerHTML =
        '<div style="padding: 20px; color: red;">Lỗi: Không tìm thấy phần tử #app</div>';
    throw new Error("Không tìm thấy phần tử #app");
}

// Khởi tạo sidebar
const side = document.querySelectorAll(".sidebar button");
if (side.length === 0) {
    console.warn("Không tìm thấy nút điều hướng trong sidebar");
} else {
    side.forEach((b) => {
        b.addEventListener("click", () => {
            side.forEach((x) => x.classList.remove("active"));
            b.classList.add("active");
            try {
                route(b.dataset.view);
            } catch (error) {
                console.error("Lỗi khi chuyển trang:", error);
                app.innerHTML = `
                    <div class="alert alert-danger">
                        <h3>Đã xảy ra lỗi</h3>
                        <p>${error.message || "Không thể tải trang"}</p>
                    </div>`;
            }
        });
    });
}

// Hàm định tuyến
function route(view) {
    switch (view) {
        case "users":
            renderUsers();
            break;
        case "types":
            renderTypes();
            break;
        case "products":
            renderProducts();
            break;
        case "receipts":
            renderReceipts();
            break;
        case "pricing":
            renderPricing();
            break;
        case "orders":
            renderOrders();
            break;
        case "stock":
            // Force refresh stock data when navigating to stock page
            setTimeout(() => {
                renderStock();
            }, 100);
            break;
        default:
            renderDashboard();
    }
}

function renderDashboard() {
    const db = dbGet();
    app.innerHTML = `
    <section class="panel">
      <h1>Tổng quan</h1>
      <div class="grid-3">
        <div class="panel"><h3>Người dùng</h3><div class="badge">${db.users.length} khách</div></div>
        <div class="panel"><h3>Sản phẩm</h3><div class="badge">${db.products.length} mặt hàng</div></div>
        <div class="panel"><h3>Đơn hàng</h3><div class="badge">${db.orders.length} đơn</div></div>
      </div>
    </section>`;
}

// Users module
function renderUsers() {
    const users = Users.list();
    app.innerHTML = `
    <section class="panel">
      <div class="row" style="justify-content:space-between"><h1>Khách hàng</h1>
        <input id="q" placeholder="Tìm theo tên/email"></div>
      <div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Tên</th><th>Email</th><th>Điện thoại</th><th>Trạng thái</th><th></th></tr></thead><tbody id="tb"></tbody></table></div>
    </section>`;
    const tb = qs("#tb");
    function paint(list) {
        tb.innerHTML = list
            .map(
                (u, i) => `<tr>
      <td>${i + 1}</td><td>${u.name}</td><td>${u.email}</td><td>${
                    u.phone || ""
                }</td>
      <td>${
          u.locked
              ? '<span class="badge">Đã khóa</span>'
              : '<span class="badge">Hoạt động</span>'
      }</td>
      <td style="text-align:right">
        <button class="btn" data-act="reset" data-id="${
            u.id
        }">Reset mật khẩu</button>
        <button class="btn" data-act="toggle" data-id="${u.id}">${
                    u.locked ? "Mở khóa" : "Khóa"
                }</button>
      </td></tr>`
            )
            .join("");
    }
    paint(users);
    qs("#q").addEventListener("input", (e) => {
        const v = e.target.value.toLowerCase();
        const f = users.filter(
            (u) =>
                u.name.toLowerCase().includes(v) ||
                u.email.toLowerCase().includes(v)
        );
        paint(f);
    });
    tb.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-act]");
        if (!btn) return;
        const id = btn.getAttribute("data-id");
        const act = btn.getAttribute("data-act");
        if (act === "reset") {
            Users.resetPassword(id);
            alert("Đã reset mật khẩu về 123456");
        }
        if (act === "toggle") {
            Users.toggleLock(id);
            renderUsers();
        }
    });
}

// Types module
function renderTypes() {
    const types = Types.list();
    app.innerHTML = `
    <section class="panel">
      <div class="row" style="justify-content:space-between"><h1>Loại sản phẩm</h1>
        <button class="btn-primary" id="addType">Thêm loại</button></div>
      <div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Tên</th><th>% lợi nhuận</th><th>Hiển thị</th><th></th></tr></thead><tbody id="tb"></tbody></table></div>
    </section>`;
    const tb = qs("#tb");
    function paint() {
        const list = Types.list();
        tb.innerHTML = list
            .map(
                (t, i) => `<tr>
      <td>${i + 1}</td><td>${t.name}</td><td>${t.profitPercent || 0}%</td><td>${
                    t.hidden ? "Ẩn" : "Hiện"
                }</td>
      <td style="text-align:right">
        <button class="btn" data-act="edit" data-id="${t.id}">Sửa</button>
        <button class="btn" data-act="toggle" data-id="${t.id}">${
                    t.hidden ? "Hiện" : "Ẩn"
                }</button>
        <button class="btn-danger" data-act="del" data-id="${t.id}">Xóa</button>
      </td></tr>`
            )
            .join("");
    }
    paint();
    qs("#addType").addEventListener("click", () => showTypeDialog());
    tb.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        const id = b.getAttribute("data-id");
        const act = b.getAttribute("data-act");
        if (act === "edit") {
            const t = Types.list().find((x) => x.id === id);
            showTypeDialog(t);
        }
        if (act === "toggle") {
            const t = Types.list().find((x) => x.id === id);
            Types.update(id, { hidden: !t.hidden });
            paint();
        }
        if (act === "del") {
            if (confirm("Xóa loại?")) {
                Types.remove(id);
                paint();
            }
        }
    });
    function showTypeDialog(type) {
        const name = prompt("Tên loại", type?.name || "");
        if (name == null) return;
        const pp = Number(
            prompt("% lợi nhuận (theo loại)", type?.profitPercent ?? 0) || 0
        );
        if (type) {
            Types.update(type.id, { name, profitPercent: pp });
        } else {
            Types.create({ name, profitPercent: pp });
        }
        paint();
    }
}

// Products module
function renderProducts() {
    const state = { editing: null };
    const types = Types.list().filter((t) => !t.hidden);
    const products = Products.list();
    app.innerHTML = `
    <section class="panel">
      <h1>Sản phẩm</h1>
      <form id="pf" class="grid-3">
        <label>Loại<select id="ptype">${types
            .map((t) => `<option value="${t.id}">${t.name}</option>`)
            .join("")}</select></label>
        <label>Mã <input id="pcode" required placeholder="ARB-250"></label>
        <label>Tên <input id="pname" required placeholder="Arabica Premium 250g"></label>
        <label>Hình (URL) <input id="pimg" placeholder="https://..."></label>
        <label class="grid-2" style="grid-column:1/-1">Mô tả<textarea id="pdesc"></textarea></label>
        <div class="row"><button class="btn-primary" type="submit">Lưu</button><button id="resetP" class="btn" type="button">Làm mới</button></div>
      </form>
    </section>
    <section class="panel">
      <div class="row" style="justify-content:space-between"><h2>Danh sách</h2><input id="q" placeholder="Tìm theo tên/mã"></div>
      <div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Mã</th><th>Tên</th><th>Loại</th><th>Hiển thị</th><th></th></tr></thead><tbody id="tb"></tbody></table></div>
    </section>`;
    const tb = qs("#tb");
    const pf = qs("#pf");
    function paint(list = Products.list()) {
        const tmap = new Map(Types.list().map((t) => [t.id, t.name]));
        tb.innerHTML = list
            .map(
                (p, i) => `<tr>
      <td>${i + 1}</td><td>${p.code}</td><td>${p.name}</td><td>${
                    tmap.get(p.typeId) || ""
                }</td><td>${p.hidden ? "Ẩn" : "Hiện"}</td>
      <td style="text-align:right">
        <button class="btn" data-act="edit" data-id="${p.id}">Sửa</button>
        <button class="btn" data-act="toggle" data-id="${p.id}">${
                    p.hidden ? "Hiện" : "Ẩn"
                }</button>
        <button class="btn-danger" data-act="del" data-id="${p.id}">Xóa</button>
      </td></tr>`
            )
            .join("");
    }
    paint(products);
    qs("#q").addEventListener("input", (e) => {
        const v = e.target.value.toLowerCase();
        const f = Products.list().filter(
            (p) =>
                p.name.toLowerCase().includes(v) ||
                p.code.toLowerCase().includes(v)
        );
        paint(f);
    });
    pf.addEventListener("submit", (e) => {
        e.preventDefault();
        const data = {
            typeId: qs("#ptype").value,
            code: qs("#pcode").value.trim(),
            name: qs("#pname").value.trim(),
            image: qs("#pimg").value.trim(),
            desc: qs("#pdesc").value.trim(),
        };
        if (state.editing) {
            Products.update(state.editing, data);
            state.editing = null;
        } else {
            Products.create(data);
        }
        pf.reset();
        paint();
    });
    qs("#resetP").addEventListener("click", () => {
        state.editing = null;
        pf.reset();
    });
    tb.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        const id = b.getAttribute("data-id");
        const act = b.getAttribute("data-act");
        const p = Products.list().find((x) => x.id === id);
        if (act === "edit") {
            state.editing = id;
            qs("#ptype").value = p.typeId;
            qs("#pcode").value = p.code;
            qs("#pname").value = p.name;
            qs("#pimg").value = p.image;
            qs("#pdesc").value = p.desc;
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
        if (act === "toggle") {
            Products.update(id, { hidden: !p.hidden });
            paint();
        }
        if (act === "del") {
            if (confirm("Xóa sản phẩm?")) {
                Products.remove(id);
                paint();
            }
        }
    });
}

// Receipts module
function renderReceipts() {
    const state = { editing: null };
    const products = Products.list();
    app.innerHTML = `
    <section class="panel">
      <h1>Phiếu nhập hàng</h1>
      <form id="rf" class="panel">
        <div class="row"><label>Ngày nhập <input type="date" id="rdate" value="${fmt.dateISO(
            new Date()
        )}"></label></div>
        <div id="items"></div>
        <div class="row"><button class="btn" type="button" id="addI">+ Thêm dòng</button></div>
        <div class="row"><button class="btn-primary" type="submit">Lưu phiếu</button><button class="btn" id="resetR" type="button">Làm mới</button></div>
      </form>
    </section>
    <section class="panel">
      <div class="row" style="justify-content:space-between"><h2>Danh mục phiếu</h2><input id="q" placeholder="Tìm theo mã sản phẩm"></div>
      <div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Ngày</th><th>Trạng thái</th><th>Số dòng</th><th></th></tr></thead><tbody id="tb"></tbody></table></div>
    </section>`;
    const items = qs("#items");
    function addRow(
        row = { productId: products[0]?.id, costPrice: 0, qty: 1 }
    ) {
        const select = `<select class="ri-product">${products
            .map(
                (p) =>
                    `<option value="${p.id}" ${
                        p.id === row.productId ? "selected" : ""
                    }>${p.name}</option>`
            )
            .join("")}</select>`;
        const div = document.createElement("div");
        div.className = "grid-3";
        div.innerHTML = `<label>Sản phẩm ${select}</label><label>Giá nhập <input type="number" class="ri-cost" min="0" step="1000" value="${row.costPrice}"></label><label>Số lượng <input type="number" class="ri-qty" min="1" step="1" value="${row.qty}"></label>`;
        items.appendChild(div);
    }
    addRow();
    qs("#addI").addEventListener("click", () => addRow());
    qs("#rf").addEventListener("submit", (e) => {
        e.preventDefault();
        const date = qs("#rdate").value;
        const list = qsa(".grid-3", items).map((row) => ({
            productId: qs(".ri-product", row).value,
            costPrice: Number(qs(".ri-cost", row).value || 0),
            qty: Number(qs(".ri-qty", row).value || 0),
        }));
        if (state.editing) {
            Receipts.update(state.editing, { date, items: list });
        } else {
            Receipts.create({ date, items: list });
        }
        renderReceipts();

        // Trigger stock update event for user pages
        window.dispatchEvent(new CustomEvent("stockUpdated"));
    });
    qs("#resetR").addEventListener("click", () => renderReceipts());

    const tb = qs("#tb");
    function paint() {
        const list = Receipts.list();
        tb.innerHTML = list
            .map(
                (r, i) => `<tr>
      <td>${i + 1}</td><td>${r.date}</td><td>${r.status}</td><td>${
                    r.items.length
                }</td>
      <td style="text-align:right">
        <button class="btn" data-act="edit" data-id="${r.id}" ${
                    r.status !== "draft" ? "disabled" : ""
                }>Sửa</button>
        <button class="btn" data-act="done" data-id="${r.id}" ${
                    r.status !== "draft" ? "disabled" : ""
                }>Hoàn thành</button>
      </td></tr>`
            )
            .join("");
    }
    paint();
    tb.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        const id = b.getAttribute("data-id");
        const act = b.getAttribute("data-act");
        const r = Receipts.list().find((x) => x.id === id);
        if (act === "edit") {
            state.editing = id;
            qs("#rdate").value = r.date;
            items.innerHTML = "";
            r.items.forEach(addRow);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
        if (act === "done") {
            Receipts.complete(id);
            paint();

            // If we're on the stock page, refresh it too
            const activeButton = document.querySelector(
                ".sidebar button.active"
            );
            if (activeButton && activeButton.dataset.view === "stock") {
                renderStock();
            }

            // Trigger stock update event for user pages
            window.dispatchEvent(new CustomEvent("stockUpdated"));
        }
    });
}

// Pricing module
function renderPricing() {
    const types = Types.list();
    const products = Products.list();
    app.innerHTML = `
    <section class="panel"><h1>Giá bán</h1>
      <div class="grid-2">
        <div class="panel"><h3>Theo loại</h3><div id="types"></div></div>
        <div class="panel"><h3>Theo sản phẩm</h3><div id="prods"></div></div>
      </div>
      <section class="panel"><h3>Tra cứu giá</h3>
        <div class="table-wrap"><table class="table"><thead><tr><th>Mã</th><th>Tên</th><th>Giá vốn</th><th>%LN</th><th>Giá bán</th></tr></thead><tbody id="tb"></tbody></table></div>
      </section>
    </section>`;
    const typesDiv = qs("#types");
    const prodsDiv = qs("#prods");
    typesDiv.innerHTML = types
        .map(
            (t) =>
                `<div class="row"><span style="min-width:140px">${
                    t.name
                }</span><input type="number" min="0" step="1" value="${
                    t.profitPercent || 0
                }" data-id="${
                    t.id
                }" class="pp-type"><span>%</span><button class="btn" data-act="saveT" data-id="${
                    t.id
                }">Lưu</button></div>`
        )
        .join("");
    prodsDiv.innerHTML = products
        .map(
            (p) =>
                `<div class="row"><span style="min-width:220px">${
                    p.name
                }</span><input type="number" min="0" step="1" value="${
                    p.profitPercent ?? ""
                }" placeholder="(kế thừa loại)" data-id="${
                    p.id
                }" class="pp-prod"><span>%</span><button class="btn" data-act="saveP" data-id="${
                    p.id
                }">Lưu</button></div>`
        )
        .join("");
    function paint() {
        const list = products.map((p) => ({
            code: p.code,
            name: p.name,
            ...getSellPrice(p.id),
        }));
        qs("#tb").innerHTML = list
            .map(
                (r) =>
                    `<tr><td>${r.code}</td><td>${r.name}</td><td>${fmt.currency(
                        r.cost
                    )}</td><td>${r.percent || 0}%</td><td>${fmt.currency(
                        r.price
                    )}</td></tr>`
            )
            .join("");
    }
    paint();
    typesDiv.addEventListener("click", (e) => {
        const b = e.target.closest('button[data-act="saveT"]');
        if (!b) return;
        const id = b.getAttribute("data-id");
        const v = Number(qs(`input.pp-type[data-id="${id}"]`).value || 0);
        Types.update(id, { profitPercent: v });
        paint();
    });
    prodsDiv.addEventListener("click", (e) => {
        const b = e.target.closest('button[data-act="saveP"]');
        if (!b) return;
        const id = b.getAttribute("data-id");
        const el = qs(`input.pp-prod[data-id="${id}"]`);
        const v = el.value === "" ? null : Number(el.value || 0);
        Products.update(id, { profitPercent: v });
        paint();
    });
}

// Orders module
function renderOrders() {
    const orders = Orders.list();
    app.innerHTML = `
    <section class="panel">
        <h1>Đơn hàng</h1>
        <div class="row">
            <label>Từ <input type="date" id="d1"></label>
            <label>Đến <input type="date" id="d2"></label>
            <label>Trạng thái 
                <select id="st">
                    <option value="">Tất cả</option>
                    <option value="new">Mới đặt</option>
                    <option value="processing">Đã xử lý</option>
                    <option value="shipped">Đã giao</option>
                    <option value="canceled">Hủy</option>
                </select>
            </label>
        </div>
        <div class="table-wrap">
            <table class="table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Ngày</th>
                        <th>Khách</th>
                        <th>SL mặt hàng</th>
                        <th>Trạng thái</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody id="tb"></tbody>
            </table>
        </div>
    </section>`;

    const tb = qs("#tb");

    function paint() {
        const d1 = qs("#d1").value;
        const d2 = qs("#d2").value;
        const st = qs("#st").value;
        let list = [...orders]; // Tạo bản sao của danh sách đơn hàng

        // Lọc đơn hàng
        if (d1) list = list.filter((o) => o.date >= d1);
        if (d2) list = list.filter((o) => o.date <= d2);
        if (st) list = list.filter((o) => o.status === st);

        // Hiển thị danh sách đơn hàng
        tb.innerHTML = list
            .map(
                (o, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${o.date}</td>
                    <td>${o.userId || "-"}</td>
                    <td>${o.items.length}</td>
                    <td>${getStatusDisplay(o.status)}</td>
                    <td style="text-align:right">
                        <button class="btn" data-id="${
                            o.id
                        }" data-act="view">Xem</button>
                    </td>
                </tr>`
            )
            .join("");
    }

    // Hàm chuyển đổi mã trạng thái thành tên hiển thị
    function getStatusDisplay(status) {
        const statusMap = {
            new: "Mới đặt",
            processing: "Đã xử lý",
            shipped: "Đã giao",
            canceled: "Đã hủy",
        };
        return statusMap[status] || status;
    }

    // Thêm sự kiện lọc
    ["d1", "d2", "st"].forEach((id) => {
        const element = qs("#" + id);
        if (element) {
            element.addEventListener("change", paint);
        }
    });

    // Vẽ danh sách ban đầu
    paint();

    // Xử lý sự kiện xem chi tiết đơn hàng
    tb.addEventListener("click", (e) => {
        const b = e.target.closest('button[data-act="view"]');
        if (!b) return;

        const id = b.getAttribute("data-id");
        const order = Orders.list().find((x) => x.id === id);
        if (!order) return;

        showOrderDetail(order);
    });
}

// Hàm hiển thị chi tiết đơn hàng
function showOrderDetail(order) {
    const user = Users.list().find((u) => u.id === order.userId);
    const products = Products.list();
    const pmap = new Map(products.map((p) => [p.id, p]));
    const total = order.items.reduce(
        (sum, it) => sum + it.quantity * it.price,
        0
    );

    const statusMessages = {
        new: "Mới đặt",
        processing: "Đã xử lý",
        shipped: "Đã giao",
        canceled: "Đã hủy",
    };

    const isCanceled = order.status === "canceled";

    const html = `
    <div class="order-detail">
        <div class="row" style="justify-content: space-between; align-items: center;">
            <h3>Chi tiết đơn hàng #${order.id}</h3>
            <button class="btn" id="closeDetail">✕ Đóng</button>
        </div>
        
        <div class="grid-2">
            <div>
                <h4>Thông tin đơn hàng</h4>
                <p><strong>Ngày đặt:</strong> ${order.date}</p>
                <p><strong>Trạng thái:</strong> 
                    <select id="ust" style="margin-left: 8px;" ${
                        isCanceled ? "disabled" : ""
                    }>
                        <option value="new" ${
                            order.status === "new" ? "selected" : ""
                        }>Mới đặt</option>
                        <option value="processing" ${
                            order.status === "processing" ? "selected" : ""
                        }>Đã xử lý</option>
                        <option value="shipped" ${
                            order.status === "shipped" ? "selected" : ""
                        }>Đã giao</option>
                        <option value="canceled" ${
                            order.status === "canceled" ? "selected" : ""
                        }>Hủy</option>
                    </select>
                    ${
                        isCanceled
                            ? '<p style="color: red; margin-top: 5px;">Không thể thay đổi trạng thái đơn hàng đã hủy</p>'
                            : ""
                    }
                </p>
                <p><strong>Tổng tiền:</strong> ${fmt.currency(total)}</p>
                ${
                    order.note
                        ? `<p><strong>Ghi chú:</strong> ${order.note}</p>`
                        : ""
                }
            </div>
            
            <div>
                <h4>Thông tin khách hàng</h4>
                ${
                    user
                        ? `
                    <p><strong>Tên:</strong> ${user.name || "N/A"}</p>
                    <p><strong>Email:</strong> ${user.email || "N/A"}</p>
                    <p><strong>Điện thoại:</strong> ${
                        user.phone || "Chưa cập nhật"
                    }</p>
                    <p><strong>Địa chỉ:</strong> ${
                        user.address || "Chưa cập nhật"
                    }</p>
                `
                        : "<p>Khách vãng lai</p>"
                }
            </div>
        </div>
        
        <div>
            <h4>Chi tiết sản phẩm</h4>
            <div class="table-wrap">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Sản phẩm</th>
                            <th>Mã</th>
                            <th>Số lượng</th>
                            <th>Đơn giá</th>
                            <th>Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items
                            .map((item) => {
                                const product = pmap.get(item.productId);
                                return `
                                <tr>
                                    <td>${
                                        product ? product.name : item.productId
                                    }</td>
                                    <td>${
                                        product
                                            ? product.code || "N/A"
                                            : item.productId
                                    }</td>
                                    <td>${item.quantity}</td>
                                    <td>${fmt.currency(item.price)}</td>
                                    <td>${fmt.currency(
                                        item.quantity * item.price
                                    )}</td>
                                </tr>`;
                            })
                            .join("")}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="row" style="margin-top: 20px;">
            <button class="btn-primary" id="save" ${
                isCanceled ? "disabled" : ""
            }>
                Cập nhật trạng thái
            </button>
            <button class="btn" id="closeBtn">
                Đóng
            </button>
        </div>
    </div>`;

    // Tạo và hiển thị modal
    const wrap = document.createElement("section");
    wrap.className = "panel";
    wrap.style.marginBottom = "20px";
    wrap.innerHTML = html;

    // Xóa các modal cũ nếu có
    document
        .querySelectorAll(".order-detail-modal")
        .forEach((el) => el.remove());

    // Thêm modal mới
    const modal = document.createElement("div");
    modal.className = "order-detail-modal";
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.right = "0";
    modal.style.bottom = "0";
    modal.style.backgroundColor = "rgba(0,0,0,0.5)";
    modal.style.display = "flex";
    modal.style.justifyContent = "center";
    modal.style.alignItems = "flex-start";
    modal.style.padding = "40px 20px";
    modal.style.overflowY = "auto";
    modal.style.zIndex = "1000";

    modal.appendChild(wrap);
    document.body.appendChild(modal);

    // Xử lý sự kiện đóng modal
    const closeModal = () => {
        modal.remove();
    };

    // Đóng khi click ra ngoài modal
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Đóng khi click nút đóng
    const closeBtn = wrap.querySelector("#closeBtn");
    const closeDetailBtn = wrap.querySelector("#closeDetail");

    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (closeDetailBtn) closeDetailBtn.addEventListener("click", closeModal);

    // Xử lý sự kiện lưu
    const saveBtn = wrap.querySelector("#save");
    if (saveBtn) {
        saveBtn.addEventListener("click", function () {
            const newStatus = wrap.querySelector("#ust").value;
            const oldStatus = order.status;
            const stock = computeStock(); // Lấy thông tin tồn kho mới nhất

            try {
                // Kiểm tra nếu đơn hàng đã bị hủy
                if (oldStatus === "canceled") {
                    throw new Error(
                        "Không thể thay đổi trạng thái đơn hàng đã hủy"
                    );
                }

                // Cập nhật trạng thái đơn hàng
                Orders.update(order.id, { status: newStatus });

                // Logic hủy đơn hàng đã được xử lý trong Orders.update()
                // Không cần xử lý thêm ở đây vì Orders.update() đã tạo receipt để cộng hàng trở lại kho

                // Hiển thị thông báo thành công
                if (newStatus === "canceled") {
                    alert("Đã hủy đơn hàng và cập nhật lại số lượng tồn kho.");
                } else {
                    const statusText = statusMessages[newStatus] || newStatus;
                    alert(`Cập nhật trạng thái đơn hàng thành: ${statusText}`);
                }

                // Đóng modal và làm mới danh sách
                closeModal();
                renderOrders();
            } catch (error) {
                // Hiển thị thông báo lỗi nếu có
                console.error("Lỗi khi cập nhật đơn hàng:", error);
                alert(
                    error.message ||
                        "Có lỗi xảy ra khi cập nhật trạng thái đơn hàng"
                );
            }
        });
    }
}

// Stock module
function renderStock() {
    try {
        // Lấy dữ liệu sản phẩm và tồn kho
        const products = Products.list();
        const stock = computeStock();
        const lowStockProducts = [];

        // Kiểm tra phần tử app
        if (!app) {
            console.error("Không tìm thấy phần tử app");
            return;
        }

        // Tạo giao diện bảng tồn kho
        app.innerHTML = `
        <section class="panel">
            <div class="panel-header">
                <h1>Quản lý tồn kho</h1>
                <div class="actions">
                    <button id="refreshStock" class="btn">
                        <i class="fas fa-sync-alt"></i> Làm mới
                    </button>
                </div>
            </div>
            <div class="table-wrap">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Mã sản phẩm</th>
                            <th>Tên sản phẩm</th>
                            <th class="text-right">Số lượng tồn</th>
                            <th>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody id="stockTableBody">
                        ${
                            products.length === 0
                                ? '<tr><td colspan="4" class="text-center">Không có sản phẩm nào</td></tr>'
                                : ""
                        }
                    </tbody>
                </table>
            </div>
        </section>`;

        // Lấy tham chiếu đến tbody
        const tbody = qs("#stockTableBody");
        if (!tbody) {
            console.error("Không tìm thấy bảng tồn kho");
            return;
        }

        // Nếu không có sản phẩm, không cần render tiếp
        if (products.length === 0) return;

        // Render danh sách sản phẩm
        tbody.innerHTML = products
            .map((product) => {
                const quantity = stock.get(product.id) || 0;
                const isLowStock = quantity < 5;
                let status = "";

                if (isLowStock) {
                    lowStockProducts.push(product.name);
                    status = '<span class="badge badge-warning">Sắp hết</span>';
                } else if (quantity === 0) {
                    status = '<span class="badge badge-danger">Hết hàng</span>';
                } else {
                    status =
                        '<span class="badge badge-success">Còn hàng</span>';
                }

                return `
                    <tr>
                        <td>${product.code || "N/A"}</td>
                        <td>${product.name || "N/A"}</td>
                        <td class="text-right">${quantity.toLocaleString()}</td>
                        <td>${status}</td>
                    </tr>`;
            })
            .join("");

        // Thêm sự kiện làm mới
        const refreshBtn = qs("#refreshStock");
        if (refreshBtn) {
            refreshBtn.addEventListener("click", () => {
                renderStock();
            });
        }

        // Auto-refresh stock every 3 seconds when on stock page
        const stockRefreshInterval = setInterval(() => {
            // Only refresh if we're currently on the stock page
            const activeButton = document.querySelector(
                ".sidebar button.active"
            );
            if (activeButton && activeButton.dataset.view === "stock") {
                renderStock();
            }
        }, 3000);

        // Clean up interval when leaving stock page
        const originalRoute = window.route;
        window.route = function (view) {
            if (view !== "stock") {
                clearInterval(stockRefreshInterval);
            }
            originalRoute(view);
        };

        // Hiển thị cảnh báo nếu có sản phẩm sắp hết hàng
        if (lowStockProducts.length > 0) {
            const warningMsg = `Cảnh báo: Có ${lowStockProducts.length} sản phẩm sắp hết hàng`;
            console.warn(warningMsg, lowStockProducts);
        }
    } catch (error) {
        console.error("Lỗi khi tải kho hàng:", error);
        if (app) {
            app.innerHTML = `
            <div class="alert alert-danger">
                <h3>Đã xảy ra lỗi khi tải kho hàng</h3>
                <p>${error.message || "Vui lòng thử lại sau"}</p>
                <button onclick="location.reload()" class="btn btn-primary mt-2">
                    <i class="fas fa-sync-alt"></i> Tải lại trang
                </button>
            </div>`;
        }
    }
}

route("dashboard");
