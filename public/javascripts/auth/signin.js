document.addEventListener('DOMContentLoaded', () => {
  console.log('[signin] DOM ready');

  const form = document.getElementById('signinForm');
  const btn  = document.getElementById('btnSignIn');
  const errorBox = document.getElementById('signinError');

  if (!form || !btn) {
    console.error('[signin] Missing form or button');
    return;
  }

  // Chặn submit do nhấn Enter
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[signin] prevented default submit');
  });

  btn.addEventListener('click', async () => {
    console.log('[signin] click handler fired');

    // reset lỗi + disable nút trong lúc gọi API
    if (errorBox) { errorBox.classList.add('d-none'); errorBox.textContent = ''; }
    btn.disabled = true;

    const fd = new FormData(form);
    const payload = {
      email: fd.get('email'),
      password: fd.get('password')
    };

    try {
      console.log('[signin] sending fetch…', payload.email);
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin', // để cookie session hoạt động
        body: JSON.stringify(payload)
      });

      // Dạng parser “an toàn”: thử đọc text -> cố parse JSON
      const text = await res.text();
      let data = {};
      try { data = JSON.parse(text); } catch { /* response không phải JSON */ }

      console.log('[signin] response status=', res.status, 'data=', data);

      if (!res.ok || !data.ok) {
        const msg = data.message || `Đăng nhập thất bại (HTTP ${res.status})`;
        showError(msg);
        btn.disabled = false;
        return;
      }

      // Thành công → điều hướng
      window.location.href = '/homepage';
    } catch (err) {
      console.error('[signin] fetch error:', err);
      showError('Không thể kết nối máy chủ.');
      btn.disabled = false;
    }
  });

  function showError(msg) {
    if (errorBox) {
      errorBox.textContent = msg;
      errorBox.classList.remove('d-none');
    } else {
      alert(msg);
    }
  }
});
