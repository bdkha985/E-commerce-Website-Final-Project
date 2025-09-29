(function () {
    const $ = (s) => document.querySelector(s);
    const $$ = (s) => document.querySelectorAll(s);

    // Tabs
    $$(".account-menu button").forEach((btn) => {
        btn.addEventListener("click", () => {
            $$(".account-menu button").forEach((b) =>
                b.classList.remove("active")
            );
            btn.classList.add("active");

            $$(".tab-panel").forEach((p) => p.classList.add("d-none"));
            $("#tab-" + btn.dataset.tab).classList.remove("d-none");
        });
    });

    // Helpers
    const showAlert = (el, type, msg) => {
        el.className = `alert alert-${type}`;
        el.textContent = msg;
    };
    const hideAlert = (el) => {
        el.className = "alert d-none";
        el.textContent = "";
    };

    // Load profile
    async function loadMe() {
        const r = await fetch("/api/account/me");
        const data = await r.json();
        if (!data.ok) return;

        const u = data.user;
        $("#accName").textContent = u.fullName;
        if ($("#accEmail")) $("#accEmail").textContent = u.email || "";
        const prof = $("#formProfile");
        prof.fullName.value = u.fullName || "";
        prof.phone.value = u.phone || "";
        renderLoyalty(u.loyaltyPoints);
    }

    function renderLoyalty(lp) {
        const box = $("#loyaltyBox");
        if (!lp) return (box.textContent = "Chưa có điểm thưởng");
        box.innerHTML = `
      <div class="p-3 border rounded-3">
        <div><b>Số điểm:</b> ${lp.balance ?? 0}</div>
        <div><b>Cập nhật:</b> ${
            lp.lastUpdatedAt ? new Date(lp.lastUpdatedAt).toLocaleString() : "—"
        }</div>
        <small class="text-muted">Bạn nhận ~10% điểm theo giá trị đơn hàng, dùng cho đơn sau.</small>
      </div>
    `;
    }

    // Save profile
    $("#btnSaveProfile")?.addEventListener("click", async () => {
        const alert = $("#profileAlert");
        hideAlert(alert);
        const body = {
            fullName: $("#formProfile").fullName.value.trim(),
            phone: $("#formProfile").phone.value.trim(),
        };
        const r = await fetch("/api/account/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await r.json();
        if (!data.ok)
            return showAlert(
                alert,
                "danger",
                data.message || "Cập nhật thất bại"
            );
        showAlert(alert, "success", "Cập nhật thành công");
        $("#accName").textContent = body.fullName;
    });

    // Change password
    $("#btnChangePass")?.addEventListener("click", async () => {
        const f = $("#formChangePass");
        const alert = $("#passAlert");
        hideAlert(alert);

        const body = {
            currentPassword: f.currentPassword.value,
            newPassword: f.newPassword.value,
            confirmPassword: f.confirmPassword.value,
        };
        const r = await fetch("/api/account/change-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await r.json();
        if (!data.ok)
            return showAlert(
                alert,
                "danger",
                data.message || "Đổi mật khẩu thất bại"
            );
        showAlert(alert, "success", "Đổi mật khẩu thành công");
        f.reset();
    });

    // Addresses
    async function loadAddresses() {
        const r = await fetch("/api/account/addresses");
        const data = await r.json();
        if (!data.ok) return;
        const list = $("#addrList");
        list.innerHTML = "";
        (data.addresses || []).forEach((a, i) => {
            const div = document.createElement("div");
            div.className = "addr-item";
            div.innerHTML = `
        <div><b>${a.label}</b> ${
                a.isDefault
                    ? '<span class="badge text-bg-primary ms-1">Mặc định</span>'
                    : ""
            }</div>
        <div class="meta">${a.street}, ${a.ward}, ${a.city}</div>
        <div class="actions">
          <button class="btn btn-sm btn-outline-secondary" data-act="edit" data-idx="${i}">Sửa</button>
          <button class="btn btn-sm btn-outline-danger" data-act="del" data-idx="${i}">Xoá</button>
          ${
              a.isDefault
                  ? ""
                  : `<button class="btn btn-sm btn-outline-dark" data-act="def" data-idx="${i}">Đặt mặc định</button>`
          }
        </div>
      `;
            list.appendChild(div);
        });
    }

    // mở modal
    $("#btnAddAddress")?.addEventListener("click", () => {
        const form = $("#formAddress");
        form.reset();
        $("#addrMode").value = "add";
        $("#addrIdx").value = "-1";
        $("#modalAddressTitle").textContent = "Thêm địa chỉ mới";
        new bootstrap.Modal($("#modalAddress")).show();
    });

    // -------- SAVE (ADD or EDIT) --------
    $("#btnSaveAddress")?.addEventListener("click", async () => {
        const mode = $("#addrMode").value; // 'add' | 'edit'
        const idx = $("#addrIdx").value;
        const form = $("#formAddress");
        const payload = Object.fromEntries(new FormData(form).entries());

        let r;
        if (mode === "add") {
            r = await fetch("/api/account/addresses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
        } else {
            r = await fetch(`/api/account/addresses/${idx}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
        }

        const data = await r.json();
        if (data.ok) {
            bootstrap.Modal.getInstance($("#modalAddress"))?.hide();
            form.reset();
            await loadAddresses();
        } else {
            alert(data.message || "Lưu địa chỉ thất bại");
        }
    });
    // -------- CONFIRM DELETE --------
    $("#btnConfirmDelete")?.addEventListener("click", async () => {
        const idx = $("#delIdx").value;
        const r = await fetch(`/api/account/addresses/${idx}`, {
            method: "DELETE",
        });
        const data = await r.json();
        if (data.ok) {
            bootstrap.Modal.getInstance($("#modalConfirmDelete"))?.hide();
            await loadAddresses();
        } else {
            alert(data.message || "Xóa địa chỉ thất bại");
        }
    });
    // -------- LIST ITEM ACTIONS (edit / delete / default) --------
    $("#addrList")?.addEventListener("click", async (e) => {
        const btn = e.target.closest("button[data-act]");
        if (!btn) return;
        const idx = btn.dataset.idx;

        if (btn.dataset.act === "def") {
            await fetch(`/api/account/addresses/${idx}/default`, {
                method: "POST",
            });
            return loadAddresses();
        }

        if (btn.dataset.act === "del") {
            // mở modal confirm delete
            $("#delIdx").value = idx;
            new bootstrap.Modal($("#modalConfirmDelete")).show();
            return;
        }

        if (btn.dataset.act === "edit") {
            // fetch lại để đảm bảo dữ liệu mới nhất
            const r0 = await fetch("/api/account/addresses");
            const d0 = await r0.json();
            const cur = d0.addresses?.[idx];
            if (!cur) return;

            const form = $("#formAddress");
            form.label.value = cur.label || "";
            form.street.value = cur.street || "";
            form.ward.value = cur.ward || "";
            form.city.value = cur.city || "";

            $("#addrMode").value = "edit";
            $("#addrIdx").value = String(idx);
            $("#modalAddressTitle").textContent = "Sửa địa chỉ";
            new bootstrap.Modal($("#modalAddress")).show();
            return;
        }
    });
    // init
    loadMe();
    loadAddresses();
})();
