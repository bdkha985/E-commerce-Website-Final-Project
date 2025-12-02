document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("signupForm");
    const btn = document.getElementById("btnSignUp");
    const errorBox = document.getElementById("signupError");

    if (!form || !btn) return;

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    btn.addEventListener("click", async () => {
        if (errorBox) {
            errorBox.classList.add("d-none");
            errorBox.textContent = "";
        }
        btn.disabled = true;

        const fd = new FormData(form);
        const payload = {
            fullName: fd.get("fullName")?.trim(),
            email: fd.get("email")?.trim(),
            address: {
                street: fd.get("street")?.trim(),
                ward: fd.get("ward")?.trim(),
                city: fd.get("city")?.trim(),
                label: "Mặc định",
            },
        };

        if (
            !payload.fullName ||
            !payload.email ||
            !payload.address.street ||
            !payload.address.ward ||
            !payload.address.city
        ) {
            if (errorBox) {
                errorBox.textContent = "Vui lòng nhập đầy đủ thông tin.";
                errorBox.classList.remove("d-none");
            } else alert("Vui lòng nhập đầy đủ thông tin.");
            btn.disabled = false;
            return;
        }

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                const msg =
                    data.message || `Đăng ký thất bại (HTTP ${res.status})`;
                if (errorBox) {
                    errorBox.textContent = msg;
                    errorBox.classList.remove("d-none");
                } else alert(msg);
                btn.disabled = false;
                return;
            }

            sessionStorage.setItem("justSignedUp", "1");

            const modalEl = document.getElementById("signupSuccessModal");
            const btnGoHome = document.getElementById("btnGoHome");

            if (modalEl && window.bootstrap) {
                // 1. Hiện Modal
                const modal = new bootstrap.Modal(modalEl);
                modal.show();

                if (btnGoHome) {
                    btnGoHome.addEventListener("click", () => {
                        window.location.href = "/homepage";
                    });
                }

                setTimeout(() => {
                    window.location.href = "/homepage";
                }, 10000);
            } else {
                alert(
                    "Đăng ký thành công! Vui lòng kiểm tra email để nhận mật khẩu tạm thời."
                );
                window.location.href = "/homepage";
            }
        } catch (err) {
            if (errorBox) {
                errorBox.textContent = "Không thể kết nối máy chủ.";
                errorBox.classList.remove("d-none");
            } else alert("Không thể kết nối máy chủ.");
            btn.disabled = false;
        }
    });
});
