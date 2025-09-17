(() => {
  const loader = () => document.getElementById('app-loader');
  const show = () => loader() && loader().classList.add('active');
  const hide = () => loader() && loader().classList.remove('active');

  // 1) Ẩn khi trang render xong
  window.addEventListener('DOMContentLoaded', hide);
  window.addEventListener('load', hide);

  // 2) Hiện khi click các link nội bộ (cùng origin)
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;

    const href = a.getAttribute('href');
    const target = a.getAttribute('target');

    // bỏ qua các case không nên chặn
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
    if (target === '_blank' || a.hasAttribute('download')) return;

    try {
      const url = new URL(href, location.href);
      if (url.origin === location.origin) {
        // links nội bộ -> show loader (không preventDefault để vẫn điều hướng)
        show();
      }
    } catch { /* href không hợp lệ -> bỏ qua */ }
  }, true);

  // 3) Hiện khi submit form
  document.addEventListener('submit', (e) => {
    show();
  }, true);

  // 4) Trường hợp back/forward cache: hide khi quay lại
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) hide();
  });

  // 5) Phòng hờ: show khi beforeunload (có trình duyệt bỏ qua DOM change sự kiện này)
  window.addEventListener('beforeunload', show);
})();


document.addEventListener('DOMContentLoaded', () => {
  const cartHover = document.querySelector('.cart-hover');
  const miniCart  = document.querySelector('.mini-cart');
  let hideTimer;

  if (cartHover && miniCart) {
    cartHover.addEventListener('mouseenter', () => {
      clearTimeout(hideTimer);
      miniCart.style.display = 'block';
    });

    cartHover.addEventListener('mouseleave', () => {
      hideTimer = setTimeout(() => {
        miniCart.style.display = 'none';
      }, 300); // delay 300ms
    });

    miniCart.addEventListener('mouseenter', () => {
      clearTimeout(hideTimer);
    });

    miniCart.addEventListener('mouseleave', () => {
      hideTimer = setTimeout(() => {
        miniCart.style.display = 'none';
      }, 300);
    });
  }
});