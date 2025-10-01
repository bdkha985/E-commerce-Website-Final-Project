// public/javascripts/auth/forgot.js
(function () {
    const form = document.getElementById("forgotForm");
    const btn = document.getElementById("btnForgot");
    const box = document.getElementById("forgotAlert");
    if (!form || !btn || !box) return;

    const show = (type, msg) => {
        box.className = "alert alert-" + type;
        box.textContent = msg;
    };

    btn.addEventListener("click", async () => {
        const email = (form.email?.value || "").trim();
        if (!email) return show("danger", "Vui lòng nhập email");

        try {
            const r = await fetch("/api/auth/forgot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await r.json();
            if (!data.ok)
                return show("danger", data.message || "Gửi OTP thất bại");

            show(
                "success",
                "Nếu email tồn tại, mã OTP đã được gửi. Vui lòng kiểm tra hộp thư."
            );
            setTimeout(() => {
                location.href =
                    "/verify-otp?email=" + encodeURIComponent(email);
            }, 800);
        } catch (e) {
            show("danger", "Có lỗi kết nối, vui lòng thử lại");
        }
    });
})();
