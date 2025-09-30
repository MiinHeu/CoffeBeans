import { session } from "./utils.js";

const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");
const cartBadge = document.getElementById("cart-badge");

// Authentication state management
function updateAuthUI() {
    const accountText = document.getElementById("accountText");
    const loginItem = document.getElementById("loginItem");
    const registerItem = document.getElementById("registerItem");
    const profileItem = document.getElementById("profileItem");
    const logoutItem = document.getElementById("logoutItem");
    const logoutLink = document.getElementById("logoutLink");

    if (session.isLoggedIn()) {
        const user = session.getUser();
        accountText.textContent = `Xin chào, ${user.name}`;
        loginItem.style.display = "none";
        registerItem.style.display = "none";
        profileItem.style.display = "block";
        logoutItem.style.display = "block";
    } else {
        accountText.textContent = "Đăng nhập / Đăng ký";
        loginItem.style.display = "block";
        registerItem.style.display = "block";
        profileItem.style.display = "none";
        logoutItem.style.display = "none";
    }
}

// Logout functionality
document.getElementById("logoutLink")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
        session.logout();
        updateAuthUI();
        // Show success message
        const successMsg = document.createElement("div");
        successMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            font-size: 14px;
        `;
        successMsg.textContent = "Đã đăng xuất thành công!";
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
    }
});

// Check for login success message
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("login") === "success") {
    const successMsg = document.createElement("div");
    successMsg.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 1000;
        font-size: 14px;
    `;
    successMsg.textContent = "Đăng nhập thành công!";
    document.body.appendChild(successMsg);
    setTimeout(() => successMsg.remove(), 3000);

    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
}

menuBtn?.addEventListener("click", () => {
    const expanded = menuBtn.getAttribute("aria-expanded") === "true";
    menuBtn.setAttribute("aria-expanded", String(!expanded));
    mobileMenu.hidden = expanded;
});

let cartCount = 0;
document.addEventListener("click", (e) => {
    const target = e.target;
    if (target && target.classList && target.classList.contains("add")) {
        cartCount += 1;
        cartBadge.textContent = String(cartCount);
        target.textContent = "Đã thêm";
        setTimeout(() => (target.textContent = "Thêm"), 1200);
    }
});

// Initialize auth UI
updateAuthUI();

// Ẩn menu con khi cuộn xuống, hiện lại khi cuộn lên
let lastScrollTop = 0;
const subMenu = document.getElementById("subMenu");

window.addEventListener("scroll", function () {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > lastScrollTop) {
        subMenu.classList.add("hide"); // cuộn xuống thì ẩn
    } else {
        subMenu.classList.remove("hide"); // cuộn lên thì hiện lại
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
});
//phân trang
document.addEventListener("DOMContentLoaded", () => {
    const products = document.querySelectorAll("#san-pham .card");
    const itemsPerPage = 3; // số sản phẩm mỗi trang
    const totalPages = Math.ceil(products.length / itemsPerPage);
    const pagination = document.getElementById("pagination");
    let currentPage = 1;

    function showPage(page) {
        products.forEach((product, index) => {
            product.style.display =
                index >= (page - 1) * itemsPerPage &&
                index < page * itemsPerPage
                    ? "block"
                    : "none";
        });

        renderPagination();
    }

    function renderPagination() {
        pagination.innerHTML = "";

        // nút về trang đầu «
        const firstBtn = document.createElement("button");
        firstBtn.textContent = "«";
        firstBtn.disabled = currentPage === 1;
        firstBtn.addEventListener("click", () => {
            currentPage = 1;
            showPage(currentPage);
        });
        pagination.appendChild(firstBtn);

        // nút lùi 1 trang <
        const prevBtn = document.createElement("button");
        prevBtn.textContent = "<";
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                showPage(currentPage);
            }
        });
        pagination.appendChild(prevBtn);

        // các nút số trang
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement("button");
            btn.textContent = i;
            if (i === currentPage) btn.classList.add("active");
            btn.addEventListener("click", () => {
                currentPage = i;
                showPage(currentPage);
            });
            pagination.appendChild(btn);
        }

        // nút tiến 1 trang >
        const nextBtn = document.createElement("button");
        nextBtn.textContent = ">";
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener("click", () => {
            if (currentPage < totalPages) {
                currentPage++;
                showPage(currentPage);
            }
        });
        pagination.appendChild(nextBtn);

        // nút đến trang cuối »
        const lastBtn = document.createElement("button");
        lastBtn.textContent = "»";
        lastBtn.disabled = currentPage === totalPages;
        lastBtn.addEventListener("click", () => {
            currentPage = totalPages;
            showPage(currentPage);
        });
        pagination.appendChild(lastBtn);
    }

    // khởi tạo
    showPage(currentPage);
});
