document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("signinForm");
    const btn = document.getElementById("btnSignIn");
    const errorBox = document.getElementById("signinError");

    if (!form || !btn) {
        console.error("[signin] Missing form or button");
        return;
    }

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("[signin] prevented default submit");
    });

    btn.addEventListener("click", async () => {
        console.log("[signin] click handler fired");

        if (errorBox) {
            errorBox.classList.add("d-none");
            errorBox.textContent = "";
        }
        btn.disabled = true;

        const fd = new FormData(form);
        const payload = {
            email: fd.get("email"),
            password: fd.get("password"),
        };

        try {
            console.log("[signin] sending fetch…", payload.email);
            const res = await fetch("/api/auth/signin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok || !data.ok) {
                const msg =
                    data.message || `Đăng nhập thất bại (HTTP ${res.status})`;
                showError(msg);
                btn.disabled = false;
                return;
            }

            if (data.forcePasswordChange) {
                window.location.href = "/force-change-password";
            } else {
                const redirectUrl = data.redirectUrl || "/homepage";
                window.location.href = redirectUrl;
            }
        } catch (err) {
            console.error("[signin] fetch error:", err);
            showError("Không thể kết nối máy chủ.");
            btn.disabled = false;
        }
    });

    function showError(msg) {
        if (errorBox) {
            errorBox.textContent = msg;
            errorBox.classList.remove("d-none");
        } else {
            alert(msg);
        }
    }
});
