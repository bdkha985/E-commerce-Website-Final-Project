// public/javascripts/auth/verify-otp.js
(function () {
    const form = document.getElementById("vForm");
    const btn = document.getElementById("btnVerify");
    const box = document.getElementById("vAlert");
    if (!form || !btn || !box) return;

    const show = (type, msg) => {
        box.className = "alert alert-" + type;
        box.textContent = msg;
    };

    btn.addEventListener("click", async () => {
        const email = (form.email?.value || "").trim();
        const otp = (form.otp?.value || "").trim();
        if (!email || !otp)
            return show("danger", "Vui lòng nhập đầy đủ email và OTP");

        try {
            const r = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp }),
            });
            const data = await r.json();
            if (!data.ok)
                return show("danger", data.message || "OTP không hợp lệ");

            // Chuyển sang reset password (kèm resetToken)
            location.href =
                "/reset-password?email=" +
                encodeURIComponent(email) +
                "&token=" +
                encodeURIComponent(data.resetToken);
        } catch (e) {
            show("danger", "Có lỗi kết nối, vui lòng thử lại");
        }
    });
})();
