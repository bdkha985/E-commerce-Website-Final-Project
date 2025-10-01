// public/javascripts/auth/reset-password.js
(function () {
    const f = document.getElementById("rForm");
    const btn = document.getElementById("btnReset");
    const box = document.getElementById("rAlert");
    if (!f || !btn || !box) return;

    const show = (type, msg) => {
        box.className = "alert alert-" + type;
        box.textContent = msg;
    };

    btn.addEventListener("click", async () => {
        const newPass = f.newPassword?.value || "";
        const confirm = document.getElementById("confirm")?.value || "";
        if (newPass !== confirm)
            return show("danger", "Xác nhận mật khẩu không khớp");

        const body = {
            email: f.email?.value,
            resetToken: f.token?.value,
            newPassword: newPass,
        };

        try {
            const r = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await r.json();
            if (!data.ok)
                return show("danger", data.message || "Đổi mật khẩu thất bại");

            show(
                "success",
                "Đổi mật khẩu thành công, chuyển tới trang đăng nhập…"
            );
            setTimeout(() => (location.href = "/signin"), 800);
        } catch (e) {
            show("danger", "Có lỗi kết nối, vui lòng thử lại");
        }
    });
})();
