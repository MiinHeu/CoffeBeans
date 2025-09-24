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

document.getElementById("logout")?.addEventListener("click", (e) => {
    e.preventDefault();
    session.setAdmin(false);
    location.href = "admin-login.html";
});

const app = document.getElementById("app");
const side = document.querySelectorAll(".sidebar button");
side.forEach((b) =>
    b.addEventListener("click", () => {
        side.forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        route(b.dataset.view);
    })
);

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
            renderStock();
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
    <section class="panel"><h1>Đơn hàng</h1>
      <div class="row"><label>Từ <input type="date" id="d1"></label><label>Đến <input type="date" id="d2"></label>
      <label>Trạng thái <select id="st"><option value="">Tất cả</option><option value="new">Mới đặt</option><option value="processing">Đã xử lý</option><option value="shipped">Đã giao</option><option value="canceled">Hủy</option></select></label>
      </div>
      <div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Ngày</th><th>Khách</th><th>SL mặt hàng</th><th>Trạng thái</th><th></th></tr></thead><tbody id="tb"></tbody></table></div>
    </section>`;
    const tb = qs("#tb");
    function paint() {
        const d1 = qs("#d1").value;
        const d2 = qs("#d2").value;
        const st = qs("#st").value;
        let list = Orders.list();
        if (d1) list = list.filter((o) => o.date >= d1);
        if (d2) list = list.filter((o) => o.date <= d2);
        if (st) list = list.filter((o) => o.status === st);
        tb.innerHTML = list
            .map(
                (o, i) => `<tr><td>${i + 1}</td><td>${o.date}</td><td>${
                    o.userId || "-"
                }</td><td>${o.items.length}</td><td>${o.status}</td>
      <td style="text-align:right"><button class="btn" data-id="${
          o.id
      }" data-act="view">Xem</button></td></tr>`
            )
            .join("");
    }
    ["d1", "d2", "st"].forEach((id) =>
        qs("#" + id).addEventListener("change", paint)
    );
    paint();
    tb.addEventListener("click", (e) => {
        const b = e.target.closest('button[data-act="view"]');
        if (!b) return;
        const id = b.getAttribute("data-id");
        const o = Orders.list().find((x) => x.id === id);
        const html = `<h3>Đơn ${o.id}</h3><p>Ngày: ${o.date}</p><p>Khách: ${
            o.userId || "-"
        }</p><ul>${o.items
            .map(
                (it) =>
                    `<li>${it.productId} x ${it.qty} @ ${fmt.currency(
                        it.price
                    )}</li>`
            )
            .join("")}</ul>
      <label>Trạng thái <select id="ust"><option value="new">Mới đặt</option><option value="processing">Đã xử lý</option><option value="shipped">Đã giao</option><option value="canceled">Hủy</option></select></label>`;
        const wrap = document.createElement("section");
        wrap.className = "panel";
        wrap.innerHTML =
            html +
            '<div class="row"><button class="btn-primary" id="save">Cập nhật</button></div>';
        app.prepend(wrap);
        qs("#ust").value = o.status;
        qs("#save").addEventListener("click", () => {
            Orders.update(id, { status: qs("#ust").value });
            renderOrders();
        });
    });
}

// Stock module
function renderStock() {
    const products = Products.list();
    const stock = computeStock();
    const low = [];
    app.innerHTML = `
    <section class="panel"><h1>Tồn kho</h1>
      <div class="table-wrap"><table class="table"><thead><tr><th>Mã</th><th>Tên</th><th>Tồn</th><th>Cảnh báo</th></tr></thead><tbody id="tb"></tbody></table></div>
    </section>`;
    const tb = qs("#tb");
    tb.innerHTML = products
        .map((p) => {
            const qty = stock.get(p.id) || 0;
            const warn = qty < 5 ? "Sắp hết" : "";
            if (warn) low.push(p.name);
            return `<tr><td>${p.code}</td><td>${p.name}</td><td>${qty}</td><td>${warn}</td></tr>`;
        })
        .join("");
}

route("dashboard");
