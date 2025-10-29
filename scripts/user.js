import { session } from "./utils.js";

// PROTOTYPE MODE: Only login/register simulation allowed.
// Keep minimal auth UI and logout. All other JS logic removed.

const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");

function updateAuthUI() {
    const accountText = document.getElementById("accountText");
    const loginItem = document.getElementById("loginItem");
    const registerItem = document.getElementById("registerItem");
    const profileItem = document.getElementById("profileItem");
    const logoutItem = document.getElementById("logoutItem");

    if (session.isLoggedIn()) {
        const user = session.getUser();
        if (accountText)
            accountText.textContent = `Xin chào, ${user?.name || "User"}`;
        if (loginItem) loginItem.style.display = "none";
        if (registerItem) registerItem.style.display = "none";
        if (profileItem) profileItem.style.display = "block";
        if (logoutItem) logoutItem.style.display = "block";
    } else {
        if (accountText) accountText.textContent = "Đăng nhập / Đăng ký";
        if (loginItem) loginItem.style.display = "block";
        if (registerItem) registerItem.style.display = "block";
        if (profileItem) profileItem.style.display = "none";
        if (logoutItem) logoutItem.style.display = "none";
    }
}

document.getElementById("logoutLink")?.addEventListener("click", (e) => {
    e.preventDefault();
    session.logout();
    updateAuthUI();
});

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("login") === "success") {
    // Clean URL only
    window.history.replaceState({}, document.title, window.location.pathname);
}

menuBtn?.addEventListener("click", () => {
    const expanded = menuBtn.getAttribute("aria-expanded") === "true";
    menuBtn.setAttribute("aria-expanded", String(!expanded));
    if (mobileMenu) mobileMenu.hidden = expanded;
});

updateAuthUI();
