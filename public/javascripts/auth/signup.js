document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signupForm');
  const btn  = document.getElementById('btnSignUp');
  const errorBox = document.getElementById('signupError');

  if (!form || !btn) return;

  form.addEventListener('submit', e => { e.preventDefault(); e.stopPropagation(); });

  btn.addEventListener('click', async () => {
    if (errorBox) { errorBox.classList.add('d-none'); errorBox.textContent = ''; }
    btn.disabled = true;

    const fd = new FormData(form);
    const payload = {
      fullName: fd.get('fullName')?.trim(),
      email: fd.get('email')?.trim(),
      phone: fd.get('phone')?.trim(),
      password: fd.get('password'),
      confirmPassword: fd.get('confirmPassword')
    };

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      });

      const text = await res.text();
      let data = {}; try { data = JSON.parse(text); } catch {}

      if (!res.ok || !data.ok) {
        const msg = data.message || `Đăng ký thất bại (HTTP ${res.status})`;
        if (errorBox) { errorBox.textContent = msg; errorBox.classList.remove('d-none'); }
        else alert(msg);
        btn.disabled = false;
        return;
      }

      // set cờ nếu muốn hiện toast ở homepage
      sessionStorage.setItem('justSignedUp', '1');
      window.location.href = '/homepage';
    } catch (err) {
      if (errorBox) { errorBox.textContent = 'Không thể kết nối máy chủ.'; errorBox.classList.remove('d-none'); }
      else alert('Không thể kết nối máy chủ.');
      btn.disabled = false;
    }
  });
});
