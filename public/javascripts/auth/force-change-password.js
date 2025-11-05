(function () {
    const form = document.getElementById("fcForm");
    const btn = document.getElementById("btnForceChange");
    const box = document.getElementById("fcAlert");
    if (!form || !btn || !box) return;

    const show = (type, msg) => {
        box.className = "alert alert-" + type;
        box.textContent = msg;
    };

    btn.addEventListener("click", async () => {
        const newPass = form.newPassword?.value || "";
        const confirm = form.confirmPassword?.value || "";

        if (newPass.length < 6) return show("danger", "Mật khẩu phải ít nhất 6 ký tự");
        if (newPass !== confirm) return show("danger", "Mật khẩu xác nhận không khớp");

        btn.disabled = true;
        show("info", "Đang xử lý...");

        try {
            const r = await fetch("/api/auth/force-change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newPassword: newPass }),
            });
            const data = await r.json();

            if (!data.ok) {
                btn.disabled = false;
                return show("danger", data.message || "Đổi mật khẩu thất bại");
            }

            // Thành công, chuyển đến trang chủ
            show("success", "Đổi mật khẩu thành công. Đang chuyển đến trang chủ...");
            setTimeout(() => (location.href = "/homepage"), 1000);

        } catch (e) {
            btn.disabled = false;
            show("danger", "Có lỗi kết nối, vui lòng thử lại");
        }
    });
})();