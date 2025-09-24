const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");
const cartBadge = document.getElementById("cart-badge");

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
