export function initHeader() {
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      const expanded = mobileMenu.hidden;
      mobileMenu.hidden = !expanded;
      menuBtn.setAttribute('aria-expanded', String(expanded));
    });
  }

  const mode = (window.CART_MODE || 'drawer');
  const cartLink = document.querySelector('a[aria-label="Giỏ hàng"]');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartOverlay = document.getElementById('cartDrawerOverlay');

  if (mode === 'drawer') {
    cartLink?.addEventListener('click', (e) => { e.preventDefault(); toggleCart(); });
    closeCartBtn?.addEventListener('click', closeCart);
    cartOverlay?.addEventListener('click', closeCart);
    document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closeCart(); });
  }
}

export function getCartSafe(){ try { return JSON.parse(localStorage.getItem('cart')||'[]'); } catch { return []; } }
export function setCartSafe(c){ localStorage.setItem('cart', JSON.stringify(c)); }

export function updateCartBadge(){ const b=document.getElementById('cart-badge'); if(b) b.textContent=String(getCartSafe().length); }

export function openCart(){
  const d=document.getElementById('cartDrawer');
  const o=document.getElementById('cartDrawerOverlay');
  if(d&&o){ d.hidden=false; o.hidden=false; }
}
export function closeCart(){
  const d=document.getElementById('cartDrawer');
  const o=document.getElementById('cartDrawerOverlay');
  if(d&&o){ d.hidden=true; o.hidden=true; }
}
export function toggleCart(){ const d=document.getElementById('cartDrawer'); if(!d) return; d.hidden?openCart():closeCart(); }


