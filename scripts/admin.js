// Hàm hiển thị modal form chung
function showModalForm(title, content, onClose = null) {
    // Xóa các modal cũ nếu có
    document.querySelectorAll(".modal-overlay").forEach((el) => el.remove());

    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0,0,0,0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        padding: 20px;
    `;

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";
    modalContent.style.cssText = `
        background: var(--panel);
        border: 1px solid #24242a;
        border-radius: 14px;
        padding: 24px;
        max-width: 600px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    `;

    modalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: var(--accent);">${title}</h2>
            <button class="btn" id="modalClose" style="background: transparent; border: none; font-size: 24px; cursor: pointer; color: var(--text);">×</button>
        </div>
        <div>${content}</div>
        <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
            <button class="btn-primary" id="modalConfirm">Xác nhận</button>
            <button class="btn" id="modalCancel">Hủy</button>
        </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    const closeModal = () => {
        modal.remove();
        if (onClose) onClose();
    };

    modal.querySelector("#modalClose").addEventListener("click", closeModal);
    modal.querySelector("#modalCancel").addEventListener("click", closeModal);
    modal.querySelector("#modalConfirm").addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });

    return modal;
}
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
    // qs("#q").addEventListener("input", (e) => {
    //     const v = e.target.value.toLowerCase();
    //     const f = users.filter(
    //         (u) =>
    //             u.name.toLowerCase().includes(v) ||
    //             u.email.toLowerCase().includes(v)
    //     );
    //     paint(f);
    // });
    tb.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-act]");
        if (!btn) return;
        const id = btn.getAttribute("data-id");
        const act = btn.getAttribute("data-act");
        const user = users.find((u) => u.id === id);
        if (act === "reset") {
            showModalForm(
                "Reset mật khẩu",
                `<p>Bạn có chắc chắn muốn reset mật khẩu cho khách hàng <strong>${
                    user?.name || ""
                }</strong>?</p>
                <p style="color: var(--muted); font-size: 14px;">Mật khẩu mới sẽ được gửi qua email: ${
                    user?.email || ""
                }</p>`
            );
        }
        if (act === "toggle") {
            const action = user?.locked ? "Mở khóa" : "Khóa";
            showModalForm(
                `${action} tài khoản`,
                `<p>Bạn có chắc chắn muốn ${action.toLowerCase()} tài khoản của khách hàng <strong>${
                    user?.name || ""
                }</strong>?</p>
                <p style="color: var(--muted); font-size: 14px;">Email: ${
                    user?.email || ""
                }</p>`
            );
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
    qs("#addType").addEventListener("click", () => {
        showModalForm(
            "Thêm loại sản phẩm",
            `<label>Tên loại <input type="text" id="typeName" placeholder="Nhập tên loại" style="width: 100%;"></label>
            <label>% Lợi nhuận <input type="number" id="typeProfit" placeholder="0" min="0" step="1" style="width: 100%;"></label>`
        );
    });
    tb.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        const id = b.getAttribute("data-id");
        const act = b.getAttribute("data-act");
        const t = Types.list().find((x) => x.id === id);
        if (act === "edit") {
            showModalForm(
                "Sửa loại sản phẩm",
                `<label>Tên loại <input type="text" id="typeName" value="${
                    t?.name || ""
                }" style="width: 100%;"></label>
                <label>% Lợi nhuận <input type="number" id="typeProfit" value="${
                    t?.profitPercent || 0
                }" min="0" step="1" style="width: 100%;"></label>`
            );
        }
        if (act === "toggle") {
            const action = t?.hidden ? "Hiện" : "Ẩn";
            showModalForm(
                `${action} loại sản phẩm`,
                `<p>Bạn có chắc chắn muốn ${action.toLowerCase()} loại sản phẩm <strong>${
                    t?.name || ""
                }</strong>?</p>`
            );
        }
        if (act === "del") {
            showModalForm(
                "Xóa loại sản phẩm",
                `<p style="color: var(--danger);">Bạn có chắc chắn muốn xóa loại sản phẩm <strong>${
                    t?.name || ""
                }</strong>?</p>
                <p style="color: var(--muted); font-size: 14px;">Hành động này không thể hoàn tác.</p>`
            );
        }
    });
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
    // Vô hiệu hóa tìm kiếm - chỉ là giao diện
    // qs("#q").addEventListener("input", (e) => {
    //     const v = e.target.value.toLowerCase();
    //     const f = Products.list().filter(
    //         (p) =>
    //             p.name.toLowerCase().includes(v) ||
    //             p.code.toLowerCase().includes(v)
    //     );
    //     paint(f);
    // });
    pf.addEventListener("submit", (e) => {
        e.preventDefault();
        const data = {
            typeId: qs("#ptype").value,
            code: qs("#pcode").value.trim(),
            name: qs("#pname").value.trim(),
            image: qs("#pimg").value.trim(),
            desc: qs("#pdesc").value.trim(),
        };
        // Logic đã bị vô hiệu hóa - chỉ hiển thị thông báo thành công
        if (state.editing) {
            alert("Đã cập nhật sản phẩm thành công");
            state.editing = null;
        } else {
            alert("Đã thêm sản phẩm thành công");
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
        const tmap = new Map(Types.list().map((t) => [t.id, t.name]));
        if (act === "edit") {
            const typeOptions = Types.list()
                .filter((t) => !t.hidden)
                .map(
                    (t) =>
                        `<option value="${t.id}" ${
                            t.id === p.typeId ? "selected" : ""
                        }>${t.name}</option>`
                )
                .join("");
            showModalForm(
                "Sửa sản phẩm",
                `<label>Loại<select id="editPtype" style="width: 100%;">${typeOptions}</select></label>
                <label>Mã <input type="text" id="editPcode" value="${
                    p?.code || ""
                }" style="width: 100%;"></label>
                <label>Tên <input type="text" id="editPname" value="${
                    p?.name || ""
                }" style="width: 100%;"></label>
                <label>Hình (URL) <input type="text" id="editPimg" value="${
                    p?.image || ""
                }" style="width: 100%;"></label>
                <label>Mô tả<textarea id="editPdesc" style="width: 100%; min-height: 80px;">${
                    p?.desc || ""
                }</textarea></label>`
            );
        }
        if (act === "toggle") {
            const action = p?.hidden ? "Hiện" : "Ẩn";
            showModalForm(
                `${action} sản phẩm`,
                `<p>Bạn có chắc chắn muốn ${action.toLowerCase()} sản phẩm <strong>${
                    p?.name || ""
                }</strong>?</p>`
            );
        }
        if (act === "del") {
            showModalForm(
                "Xóa sản phẩm",
                `<p style="color: var(--danger);">Bạn có chắc chắn muốn xóa sản phẩm <strong>${
                    p?.name || ""
                }</strong>?</p>
                <p style="color: var(--muted); font-size: 14px;">Hành động này không thể hoàn tác.</p>`
            );
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
        )}" readonly></label></div>
        <div id="items"></div>
        <div class="row"><button class="btn" type="button" id="addI">+ Thêm dòng</button></div>
        <div class="row"><button class="btn-primary" type="submit">Lưu phiếu</button><button class="btn" id="resetR" type="button">Làm mới</button></div>
      </form>
    </section>
    <section class="panel">
      <div class="row" style="justify-content:space-between"><h2>Danh mục phiếu</h2><input id="q" placeholder="Tìm "></div>
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
    qs("#addI").addEventListener("click", () => {
        showModalForm(
            "Thêm dòng",
            `<p>Thêm dòng sản phẩm mới vào phiếu nhập hàng.</p>
            <label>Sản phẩm <select id="addProduct" style="width: 100%;">
                ${products
                    .map((p) => `<option value="${p.id}">${p.name}</option>`)
                    .join("")}
            </select></label>
            <label>Giá nhập <input type="number" id="addCost" placeholder="0" min="0" step="1000" style="width: 100%;"></label>
            <label>Số lượng <input type="number" id="addQty" placeholder="1" min="1" step="1" style="width: 100%;"></label>`
        );
    });
    qs("#rf").addEventListener("submit", (e) => {
        e.preventDefault();
        const date = qs("#rdate").value;
        const list = qsa(".grid-3", items).map((row) => ({
            productId: qs(".ri-product", row).value,
            costPrice: Number(qs(".ri-cost", row).value || 0),
            qty: Number(qs(".ri-qty", row).value || 0),
        }));
        // Logic đã bị vô hiệu hóa - chỉ hiển thị thông báo thành công và refresh UI
        if (state.editing) {
            alert("Đã cập nhật phiếu nhập hàng thành công");
        } else {
            alert("Đã thêm phiếu nhập hàng thành công");
        }
        renderReceipts();
    });
    qs("#resetR").addEventListener("click", () => {
        showModalForm(
            "Làm mới",
            `<p>Bạn có chắc chắn muốn làm mới form phiếu nhập hàng?</p>
            <p style="color: var(--muted); font-size: 14px;">Tất cả dữ liệu chưa lưu sẽ bị mất.</p>`
        );
    });

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
        <button class="btn" data-act="edit" data-id="${r.id}">Sửa</button>
        <button class="btn" data-act="done" data-id="${
            r.id
        }">Hoàn thành</button>
      </td></tr>`
            )
            .join("");
    }
    paint();
    // Vô hiệu hóa tìm kiếm - chỉ là giao diện
    // qs("#q").addEventListener("input", (e) => {
    //     const v = e.target.value.toLowerCase();
    //     const list = Receipts.list();
    //     // Tìm kiếm logic...
    // });
    tb.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        const id = b.getAttribute("data-id");
        const act = b.getAttribute("data-act");
        const r = Receipts.list().find((x) => x.id === id);
        if (act === "edit") {
            showModalForm(
                "Sửa phiếu nhập hàng",
                `<p>Chỉnh sửa thông tin phiếu nhập hàng #${r?.id || id}.</p>
                <label>Ngày nhập <input type="date" id="editRdate" value="${
                    r?.date || ""
                }" style="width: 100%;"></label>
                <p style="color: var(--muted); font-size: 14px;">Số dòng: ${
                    r?.items.length || 0
                }</p>`
            );
        }
        if (act === "done") {
            showModalForm(
                "Hoàn thành phiếu nhập hàng",
                `<p>Bạn có chắc chắn muốn hoàn thành phiếu nhập hàng #${
                    r?.id || id
                }?</p>
                <p style="color: var(--muted); font-size: 14px;">Sau khi hoàn thành, phiếu nhập hàng sẽ được cập nhật vào tồn kho.</p>`
            );
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
                `<div class="row"><span style="min-width:140px">${t.name}</span><input type="text" placeholder="Nhập % lợi nhuận" data-id="${t.id}" class="pp-type" style="width: 100px;"><span>%</span><button class="btn" data-act="saveT" data-id="${t.id}">Lưu</button></div>`
        )
        .join("");
    prodsDiv.innerHTML = products
        .map(
            (p) =>
                `<div class="row"><span style="min-width:220px">${p.name}</span><input type="text" placeholder="(kế thừa loại)" data-id="${p.id}" class="pp-prod" style="width: 100px;"><span>%</span><button class="btn" data-act="saveP" data-id="${p.id}">Lưu</button></div>`
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
        const v = qs(`input.pp-type[data-id="${id}"]`).value || "";
        showModalForm(
            "Cập nhật % lợi nhuận theo loại",
            `<p>Giá trị nhập: <strong>${v || "Trống"}%</strong></p>
            <p style="color: var(--muted); font-size: 14px;">Bạn có chắc chắn muốn cập nhật % lợi nhuận?</p>`
        );
    });
    prodsDiv.addEventListener("click", (e) => {
        const b = e.target.closest('button[data-act="saveP"]');
        if (!b) return;
        const id = b.getAttribute("data-id");
        const el = qs(`input.pp-prod[data-id="${id}"]`);
        const v = el.value === "" ? "(kế thừa loại)" : el.value;
        showModalForm(
            "Cập nhật % lợi nhuận theo sản phẩm",
            `<p>Giá trị nhập: <strong>${v}%</strong></p>
            <p style="color: var(--muted); font-size: 14px;">Bạn có chắc chắn muốn cập nhật % lợi nhuận?</p>`
        );
    });
}

// Orders module
function renderOrders() {
    // Dữ liệu mẫu cho giao diện
    const sampleOrders = [
        {
            id: "ORD-001",
            date: "2025-11-01",
            userId: "Nguyễn Văn A",
            items: [
                { productId: "ARB-250", quantity: 2, price: 250000 },
                { productId: "ROB-500", quantity: 1, price: 450000 },
            ],
            status: "new",
            note: "Giao hàng trong giờ hành chính",
        },
        {
            id: "ORD-002",
            date: "2025-11-02",
            userId: "Trần Thị B",
            items: [{ productId: "ARB-250", quantity: 3, price: 250000 }],
            status: "processing",
            note: "",
        },
        {
            id: "ORD-003",
            date: "2025-11-03",
            userId: "Lê Văn C",
            items: [
                { productId: "ROB-500", quantity: 2, price: 450000 },
                { productId: "ARB-250", quantity: 1, price: 250000 },
            ],
            status: "shipped",
            note: "Đã giao hàng thành công",
        },
        {
            id: "ORD-004",
            date: "2025-11-04",
            userId: "Phạm Thị D",
            items: [{ productId: "ARB-250", quantity: 1, price: 250000 }],
            status: "new",
            note: "",
        },
        {
            id: "ORD-005",
            date: "2025-11-05",
            userId: "Hoàng Văn E",
            items: [{ productId: "ROB-500", quantity: 1, price: 450000 }],
            status: "processing",
            note: "Khách yêu cầu giao nhanh",
        },
        {
            id: "ORD-006",
            date: "2025-11-06",
            userId: "Nguyễn Thị F",
            items: [
                { productId: "ARB-250", quantity: 2, price: 250000 },
                { productId: "ROB-500", quantity: 1, price: 450000 },
                { productId: "ARB-250", quantity: 1, price: 250000 },
            ],
            status: "shipped",
            note: "",
        },
        {
            id: "ORD-007",
            date: "2025-11-07",
            userId: "Đặng Văn G",
            items: [{ productId: "ROB-500", quantity: 1, price: 450000 }],
            status: "canceled",
            note: "Khách hủy đơn",
        },
        {
            id: "ORD-008",
            date: "2025-11-08",
            userId: "Võ Thị H",
            items: [{ productId: "ARB-250", quantity: 3, price: 250000 }],
            status: "new",
            note: "",
        },
    ];
    app.innerHTML = `
    <section class="panel">
        <h1>Quản lý đơn đặt hàng của khách hàng</h1>
        <div class="row">
            <label>Từ <input type="date" id="d1" ></label>
            <label>Đến <input type="date" id="d2" ></label>
            <label>Trạng thái 
                <select id="st"  >
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
        // Hiển thị tất cả đơn hàng (không lọc)
        const list = [...sampleOrders];
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
                        <button class="btn" data-id="${
                            o.id
                        }" data-act="update">Cập nhật tình trạng đơn hàng</button>
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

    // Vô hiệu hóa tìm kiếm - chỉ là giao diện
    // ["d1", "d2", "st"].forEach((id) => {
    //     const element = qs("#" + id);
    //     if (element) {
    //         element.addEventListener("change", paint);
    //     }
    // });

    // Vẽ danh sách ban đầu
    paint();

    // Xử lý sự kiện xem chi tiết đơn hàng và cập nhật
    tb.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        const id = b.getAttribute("data-id");
        const act = b.getAttribute("data-act");
        const order = sampleOrders.find((x) => x.id === id);
        if (!order) return;

        if (act === "view") {
            showOrderDetail(order);
        } else if (act === "update") {
            showModalForm(
                "Cập nhật tình trạng đơn hàng",
                `<p>Đơn hàng: <strong>#${order.id}</strong></p>
                <p>Khách hàng: <strong>${order.userId}</strong></p>
                <label>Trạng thái 
                    <select id="updateStatus" style="width: 100%;">
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
                </label>`
            );
        }
    });
}

// Hàm hiển thị chi tiết đơn hàng
function showOrderDetail(order) {
    // Dữ liệu mẫu cho khách hàng
    const user = {
        name: order.userId,
        email: `${order.userId.toLowerCase().replace(/\s+/g, "")}@email.com`,
        phone: "0901234567",
        address: "123 Đường ABC, Quận XYZ, TP.HCM",
    };

    // Dữ liệu mẫu cho sản phẩm
    const productMap = {
        "ARB-250": { name: "Arabica Premium 250g", code: "ARB-250" },
        "ROB-500": { name: "Robusta Đặc Biệt 500g", code: "ROB-500" },
    };

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
                <p><strong>Trạng thái:</strong> ${
                    statusMessages[order.status] || order.status
                }</p>
                <p><strong>Tổng tiền:</strong> ${fmt.currency(total)}</p>
                ${
                    order.note
                        ? `<p><strong>Ghi chú:</strong> ${order.note}</p>`
                        : ""
                }
            </div>
            
            <div>
                <h4>Thông tin khách hàng</h4>
                <p><strong>Tên:</strong> ${user.name || "N/A"}</p>
                <p><strong>Email:</strong> ${user.email || "N/A"}</p>
                <p><strong>Điện thoại:</strong> ${
                    user.phone || "Chưa cập nhật"
                }</p>
                <p><strong>Địa chỉ:</strong> ${
                    user.address || "Chưa cập nhật"
                }</p>
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
                                const product = productMap[item.productId] || {
                                    name: item.productId,
                                    code: item.productId,
                                };
                                return `
                                <tr>
                                    <td>${product.name}</td>
                                    <td>${product.code}</td>
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
    </div>`;

    showModalForm(
        "Chi tiết đơn hàng",
        html
            .replace('<button class="btn" id="closeDetail">✕ Đóng</button>', "")
            .replace(
                /<div class="row" style="margin-top: 20px;">.*?<\/div>/s,
                ""
            )
    );
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

        // Giao diện đơn giản hơn
        app.innerHTML = `
        <section class="panel">
            <div class="panel-header">
                <h1>Quản lý tồn kho </h1>
            </div>

            <div style="margin-bottom:16px;">
                <div class="grid-3" style="gap:12px;">
                    <label>
                        Sản phẩm
                        <select id="searchProduct" style="width:100%; padding:8px; border-radius:6px; border:1px solid #2b2b30; background:var(--panel); color:var(--text);">
                            <option value="">-- Chọn sản phẩm --</option>
                            ${products.map(p => `<option value="${p.id}">${p.name} (${p.code})</option>`).join("")}
                        </select>
                    </label>
                    <label>
                        Loại
                        <select id="searchType" style="width:100%; padding:8px; border-radius:6px; border:1px solid #2b2b30; background:var(--panel); color:var(--text);">
                            <option value="">-- Chọn loại --</option>
                            ${Types.list().filter(t => !t.hidden).map(t => `<option value="${t.id}">${t.name}</option>`).join("")}
                        </select>
                    </label>
                    <label>
                        Thời điểm
                        <input type="date" id="searchDate" style="width:100%; padding:8px; border-radius:6px; border:1px solid #2b2b30; background:var(--panel); color:var(--text);">
                    </label>
                </div>

                <div style="margin-top:12px; display:flex; gap:8px;">
                    <button class="btn-primary" id="searchStockBtn">Xác nhận</button>
                    <button class="btn" id="resetSearchBtn">Làm mới</button>
                </div>
            </div>

            <div style="margin-bottom:12px; padding:12px; background: rgba(239,68,68,0.05); border-radius:8px;">
                <strong style="color:var(--accent)">Cảnh báo sản phẩm sắp hết hàng</strong>
                <p style="color:var(--muted); margin:6px 0 0 0;">Sẽ hiển thị danh sách sản phẩm có tồn thấp ở đây.</p>
            </div>

            <div class="table-wrap">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Mã</th>
                            <th>Tên</th>
                            <th class="text-right">Tồn</th>
                            <th>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody id="stockTableBody">
                        ${products.length === 0 ? '<tr><td colspan="4" class="text-center">Không có sản phẩm</td></tr>' : ''}
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

        if (products.length === 0) return;

        // Render danh sách sản phẩm (đơn giản)
        tbody.innerHTML = products.map(product => {
            const quantity = stock.get(product.id) || 0;
            const isLowStock = quantity > 0 && quantity < 5;
            let status = isLowStock ? '<span class="badge badge-warning">Sắp hết</span>' :
                         (quantity === 0 ? '<span class="badge badge-danger">Hết hàng</span>' :
                         '<span class="badge badge-success">Còn hàng</span>');
            if (isLowStock) lowStockProducts.push(product.name);
            return `
                <tr>
                    <td>${product.code || "N/A"}</td>
                    <td>${product.name || "N/A"}</td>
                    <td class="text-right">${quantity.toLocaleString()}</td>
                    <td>${status}</td>
                </tr>`;
        }).join("");

        // Hiển thị cảnh báo (đơn giản)
        if (lowStockProducts.length > 0) {
            const warningDiv = qs("#lowStockWarning");
            if (warningDiv) {
                warningDiv.innerHTML = `
                    <strong style="color:var(--accent)">⚠ Có ${lowStockProducts.length} sản phẩm sắp hết</strong>
                    <div style="margin-top:8px; color:var(--muted)">${lowStockProducts.slice(0,5).map(p => `<span>${p}</span>`).join(", ")}${lowStockProducts.length>5? ' ...':''}</div>
                `;
            }
        }

        // Sự kiện: Xác nhận mở modal hiển thị form (không xử lý tìm kiếm)
        const searchStockBtn = qs("#searchStockBtn");
        const resetSearchBtn = qs("#resetSearchBtn");

        function openSearchModal(mode = "search") {
            const currProduct = qs("#searchProduct").value || "";
            const currType = qs("#searchType").value || "";
            const currDate = qs("#searchDate").value || "";

            

            const modal = showModalForm(mode==="search" ? "Tra cứu số lượng tồn" : "Làm mới tìm kiếm", formHtml, () => {});
            // đính kèm sự kiện cho nút trong modal
            setTimeout(() => {
                modal.querySelector("#m_confirm")?.addEventListener("click", (e) => {
                    // Chỉ đóng modal — không thực hiện tìm kiếm
                    modal.remove();
                });
                modal.querySelector("#m_cancel")?.addEventListener("click", (e) => {
                    modal.remove();
                });
            }, 0);
        }

        if (searchStockBtn) {
            searchStockBtn.addEventListener("click", () => openSearchModal("search"));
        }
        if (resetSearchBtn) {
            resetSearchBtn.addEventListener("click", () => openSearchModal("reset"));
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
