import { session, qs } from "./utils.js";

// PROTOTYPE MODE: Admin panel shows UI only, no logic/data.

if (!session.isAdmin()) {
    location.href = "admin-login.html";
}

document.getElementById("logout")?.addEventListener("click", (e) => {
    e.preventDefault();
    session.setAdmin(false);
    location.href = "admin-login.html";
});

const app = document.getElementById("app");
if (!app) {
    document.body.innerHTML =
        '<div style="padding: 20px; color: red;">Lỗi: Không tìm thấy phần tử #app</div>';
    throw new Error("Không tìm thấy phần tử #app");
}

function renderStatic(view) {
    const section = (title, body = "") => `
    <section class="panel">
      <h1>${title}</h1>
      ${body}
    </section>`;

    switch (view) {
        case "users":
            app.innerHTML = section(
                "Khách hàng",
                '<form class="grid-3" style="margin-bottom:16px">\
                    <label>Tên <input placeholder="Nguyễn Văn A"></label>\
                    <label>Email <input placeholder="user@example.com"></label>\
                    <label>Điện thoại <input placeholder="0901 234 567"></label>\
                    <div class="row" style="grid-column:1/-1"><button class="btn" type="button" disabled>Lưu</button><button class="btn" type="button" disabled>Làm mới</button></div>\
                </form>\
                <div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Tên</th><th>Email</th><th>Điện thoại</th><th>Trạng thái</th><th></th></tr></thead><tbody>\
                <tr><td>1</td><td>Khách Hàng 1</td><td>kh1@example.com</td><td>0901 000 111</td><td><span class="badge">Hoạt động</span></td><td style="text-align:right"><button class="btn" disabled>Sửa</button></td></tr>\
                <tr><td>2</td><td>Khách Hàng 2</td><td>kh2@example.com</td><td>0902 000 222</td><td><span class="badge">Hoạt động</span></td><td style="text-align:right"><button class="btn" disabled>Sửa</button></td></tr>\
                </tbody></table></div>'
            );
            break;
        case "types":
            app.innerHTML = section(
                "Loại sản phẩm",
                '<form class="grid-3" style="margin-bottom:16px">\
                    <label>Tên loại <input placeholder="Arabica"></label>\
                    <label>% lợi nhuận <input type="number" min="0" step="1" placeholder="20"></label>\
                    <label>Trạng thái <select><option>Hiện</option><option>Ẩn</option></select></label>\
                    <div class="row" style="grid-column:1/-1"><button class="btn" type="button" disabled>Lưu</button><button class="btn" type="button" disabled>Làm mới</button></div>\
                </form>\
                <div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Tên</th><th>% lợi nhuận</th><th>Hiển thị</th><th></th></tr></thead><tbody>\
                <tr><td>1</td><td>Arabica</td><td>20%</td><td>Hiện</td><td style="text-align:right"><button class="btn" disabled>Sửa</button></td></tr>\
                <tr><td>2</td><td>Robusta</td><td>18%</td><td>Hiện</td><td style="text-align:right"><button class="btn" disabled>Sửa</button></td></tr>\
                </tbody></table></div>'
            );
            break;
        case "products":
            app.innerHTML = section(
                "Sản phẩm",
                '<form class="grid-3">\
                    <label>Loại<select><option>Arabica</option><option>Robusta</option><option>Blend</option></select></label>\
                    <label>Mã <input placeholder="ARB-250"></label>\
                    <label>Tên <input placeholder="Arabica Premium 250g"></label>\
                    <label>Hình (URL) <input placeholder="https://..."></label>\
                    <label class="grid-2" style="grid-column:1/-1">Mô tả<textarea placeholder="Mô tả sản phẩm..."></textarea></label>\
                    <div class="row"><button class="btn" type="button" disabled>Lưu</button><button class="btn" type="button" disabled>Làm mới</button></div>\
                </form>'
            );
            break;
        case "receipts":
            app.innerHTML = section(
                "Phiếu nhập hàng",
                '<form class="panel" style="margin-bottom:16px">\
                    <div class="row"><label>Ngày nhập <input type="date"></label></div>\
                    <div class="grid-3">\
                        <label>Sản phẩm <select><option>Arabica Premium 250g</option></select></label>\
                        <label>Giá nhập <input type="number" min="0" step="1000" placeholder="120000"></label>\
                        <label>Số lượng <input type="number" min="1" step="1" placeholder="10"></label>\
                    </div>\
                    <div class="row"><button class="btn" type="button" disabled>+ Thêm dòng</button><button class="btn" type="button" disabled>Lưu phiếu</button></div>\
                </form>\
                <div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Ngày</th><th>Trạng thái</th><th>Số dòng</th><th></th></tr></thead><tbody>\
                <tr><td>1</td><td>2025-10-01</td><td>draft</td><td>2</td><td style="text-align:right"><button class="btn" disabled>Sửa</button></td></tr>\
                </tbody></table></div>'
            );
            break;
        case "pricing":
            app.innerHTML = section(
                "Giá bán",
                '<div class="grid-2">\
                    <div class="panel"><h3>Theo loại</h3>\
                        <div class="row"><span style="min-width:140px">Arabica</span><input type="number" min="0" step="1" value="20" style="width:100px"><span>%</span><button class="btn" disabled>Lưu</button></div>\
                        <div class="row"><span style="min-width:140px">Robusta</span><input type="number" min="0" step="1" value="18" style="width:100px"><span>%</span><button class="btn" disabled>Lưu</button></div>\
                    </div>\
                    <div class="panel"><h3>Theo sản phẩm</h3>\
                        <div class="row"><span style="min-width:220px">Arabica Premium 250g</span><input type="number" min="0" step="1" placeholder="(kế thừa loại)" style="width:120px"><span>%</span><button class="btn" disabled>Lưu</button></div>\
                    </div>\
                </div>\
                <section class="panel"><h3>Tra cứu giá</h3>\
                    <div class="table-wrap"><table class="table"><thead><tr><th>Mã</th><th>Tên</th><th>Giá vốn</th><th>%LN</th><th>Giá bán</th></tr></thead><tbody><tr><td>ARB-250</td><td>Arabica Premium 250g</td><td>0đ</td><td>0%</td><td>135.000đ</td></tr></tbody></table></div>\
                </section>'
            );
            break;
        case "orders":
            app.innerHTML = section(
                "Đơn hàng",
                '<div class="row" style="margin-bottom:12px">\
                    <label>Từ <input type="date"></label>\
                    <label>Đến <input type="date"></label>\
                    <label>Trạng thái <select><option>Tất cả</option><option>Mới đặt</option><option>Đã xử lý</option><option>Đã giao</option><option>Hủy</option></select></label>\
                </div>\
                <div class="table-wrap"><table class="table"><thead><tr><th>#</th><th>Ngày</th><th>Khách</th><th>SL mặt hàng</th><th>Trạng thái</th><th></th></tr></thead><tbody>\
                <tr><td>1</td><td>2025-10-02</td><td>u1</td><td>3</td><td>Mới đặt</td><td style="text-align:right"><button class="btn" disabled>Xem</button></td></tr>\
                </tbody></table></div>'
            );
            break;
        case "stock":
            app.innerHTML = section(
                "Quản lý tồn kho",
                '<div class="table-wrap"><table class="table"><thead><tr><th>Mã sản phẩm</th><th>Tên sản phẩm</th><th class="text-right">Số lượng tồn</th><th>Trạng thái</th></tr></thead><tbody>\
                <tr><td>ARB-250</td><td>Arabica Premium 250g</td><td class="text-right">—</td><td><span class="badge">Không theo dõi</span></td></tr>\
                </tbody></table></div>'
            );
            break;
        default:
            app.innerHTML = `
    <section class="panel">
      <h1>Tổng quan</h1>
      <div class="grid-3">
                <div class="panel"><h3>Người dùng</h3><div class="badge">-</div></div>
                <div class="panel"><h3>Sản phẩm</h3><div class="badge">-</div></div>
                <div class="panel"><h3>Đơn hàng</h3><div class="badge">-</div></div>
      </div>
    </section>`;
    }
}

const side = document.querySelectorAll(".sidebar button");
side.forEach((b) => {
    b.addEventListener("click", () => {
        side.forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        renderStatic(b.dataset.view);
    });
});

renderStatic("dashboard");
