// public/javascripts/account.js
(function () {
    const $ = (s) => document.querySelector(s);
    const $$ = (s) => document.querySelectorAll(s);

    const ORDER_LIMIT = 5;

    const showAlert = (el, type, msg) => {
        el.className = `alert alert-${type}`;
        el.textContent = msg;
    };
    const hideAlert = (el) => {
        el.className = "alert d-none";
        el.textContent = "";
    };
    const formatCurrency = (val) => (val || 0).toLocaleString('vi-VN') + 'đ';

    /**
     * Helper render các nút phân trang
     */
    function renderPagination(containerId, pagination, clickHandlerName) {
        const container = $(`#${containerId}`);
        if (!container) return;

        const { page, totalPages } = pagination;
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '<ul class="pagination">';
        
        // Nút Previous
        html += `<li class="page-item ${page === 1 ? 'disabled' : ''}">
            <span class="page-link" ${page > 1 ? `onclick="${clickHandlerName}(${page - 1})"` : ''}>«</span>
        </li>`;

        // Các nút số
        for (let i = 1; i <= totalPages; i++) {
            html += `<li class="page-item ${i === page ? 'active' : ''}">
                <span class="page-link" ${i !== page ? `onclick="${clickHandlerName}(${i})"` : ''}>${i}</span>
            </li>`;
        }

        // Nút Next
        html += `<li class="page-item ${page >= totalPages ? 'disabled' : ''}">
            <span class="page-link" ${page < totalPages ? `onclick="${clickHandlerName}(${page + 1})"` : ''}>»</span>
        </li>`;
        
        html += '</ul>';
        container.innerHTML = html;
    }

    // === 1. LOGIC TABS ===
    $$(".account-menu button").forEach((btn) => {
        btn.addEventListener("click", () => {
            $$(".account-menu button").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            $$(".tab-panel").forEach((p) => p.classList.add("d-none"));
            $("#tab-" + btn.dataset.tab).classList.remove("d-none");

            if (btn.dataset.tab === 'orders' && !$('#order-list-container').innerHTML.includes('order-item-row')) {
                loadOrderHistory(1);
            }
            if (btn.dataset.tab === 'addresses' && !$('#addrList').innerHTML.includes('addr-item')) {
                loadAddresses();
            }
        });
    });

    // === 2. LOGIC PROFILE & PASSWORD ===
    async function loadMe() {
        const r = await fetch("/api/account/me");
        const data = await r.json();
        if (!data.ok) return;
        const u = data.user;
        $("#accName").textContent = u.fullName;
        if ($("#accEmail")) $("#accEmail").textContent = u.email || "";
        const prof = $("#formProfile");
        prof.fullName.value = u.fullName || "";
        prof.email.value = u.email || "";
        prof.phone.value = u.phone || "";
        renderLoyalty(u.loyaltyPoints);
    }
    function renderLoyalty(lp) {
    const box = document.getElementById("loyaltyBox");
    
    // Empty state
    if (!lp || !lp.balance) {
        box.innerHTML = `
            <div class="loyalty-empty">
                <div class="loyalty-empty-icon">🎁</div>
                <div class="loyalty-empty-text">Chưa có điểm thưởng</div>
                <div class="loyalty-empty-desc">Mua sắm để tích điểm và nhận ưu đãi!</div>
            </div>
        `;
        return;
    }
    
    // Format date
    const lastUpdated = lp.lastUpdatedAt 
        ? new Date(lp.lastUpdatedAt).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : "Chưa có hoạt động";
    
    const nextTier = 1000;
    const progress = Math.min((lp.balance / nextTier) * 100, 100);
    
    box.innerHTML = `
        <div class="loyalty-card">
            <!-- Header -->
            <div class="loyalty-header">
                <div class="loyalty-icon">⭐</div>
                <div class="loyalty-badge">Thành viên VIP</div>
            </div>
            
            <!-- Balance Display -->
            <div class="loyalty-balance">
                <div class="loyalty-label">Điểm tích lũy của bạn</div>
                <div class="loyalty-points">
                    ${lp.balance.toLocaleString('vi-VN')}
                    <span class="loyalty-currency">điểm</span>
                </div>
            </div>
            
            <!-- Info Grid -->
            <div class="loyalty-info">
                <div class="loyalty-info-item">
                    <div class="loyalty-info-label">
                        <i class="fas fa-clock"></i>
                        Cập nhật lần cuối
                    </div>
                    <div class="loyalty-info-value">${lastUpdated}</div>
                </div>
                
                <div class="loyalty-info-item">
                    <div class="loyalty-info-label">
                        <i class="fas fa-gift"></i>
                        Giá trị quy đổi
                    </div>
                    <div class="loyalty-info-value">${(lp.balance).toLocaleString('vi-VN')}đ</div>
                </div>
            </div>
            
            
            <!-- Note -->
            <div class="loyalty-note">
                <i class="fas fa-info-circle"></i>
                <strong>Cách tích điểm:</strong> Bạn nhận 10% điểm theo giá trị đơn hàng. 
                Sử dụng điểm để giảm giá cho đơn hàng tiếp theo!
            </div>
        </div>
    `;
}

    $("#btnSaveProfile")?.addEventListener("click", async () => {
        const alert = $("#profileAlert");
        hideAlert(alert);
        const body = {
            fullName: $("#formProfile").fullName.value.trim(),
            email: $("#formProfile").email.value.trim(),
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

    // === 3. LOGIC ĐỊA CHỈ ===
    async function loadAddresses() {
        const r = await fetch("/api/account/addresses");
        const data = await r.json();
        if (!data.ok) return;
        const list = $("#addrList");
        list.innerHTML = "";
        
        if (data.addresses.length === 0) {
            list.innerHTML = '<div class="empty-state"><p>Bạn chưa thêm địa chỉ nào.</p></div>';
            return;
        }
        
        (data.addresses || []).forEach((a, i) => {
            const div = document.createElement("div");
            div.className = "addr-item";
            div.innerHTML = `
        <div><b>${a.label}</b> ${
                a.isDefault
                    ? '<span class="badge status-pending" style="background: #dbeafe; color: #1e40af;">Mặc định</span>'
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
    $("#btnAddAddress")?.addEventListener("click", () => {
        const form = $("#formAddress");
        form.reset();
        $("#addrMode").value = "add";
        $("#addrIdx").value = "-1";
        $("#modalAddressTitle").textContent = "Thêm địa chỉ mới";
        new bootstrap.Modal($("#modalAddress")).show();
    });
    $("#btnSaveAddress")?.addEventListener("click", async () => {
        const mode = $("#addrMode").value;
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
            $("#delIdx").value = idx;
            new bootstrap.Modal($("#modalConfirmDelete")).show();
            return;
        }
        if (btn.dataset.act === "edit") {
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

    // === 4. LOGIC ĐƠN HÀNG ===
    const orderListView = $('#order-list-view');
    const orderDetailView = $('#order-detail-view');
    const orderListContainer = $('#order-list-container');
    const orderDetailContainer = $('#order-detail-container');
    const btnBackToList = $('#btn-back-to-list');
    const btnRefreshOrders = $('#btn-refresh-orders');
    
    function renderOrderRow(order) {
        return `
            <div class="order-item-row">
                <div class="order-info">
                    <span class="order-code">#${order.code}</span>
                    <span class="order-date">${new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <div class="order-total">${formatCurrency(order.total)}</div>
                <div class="order-status">
                    <span class="badge status-${(order.status || 'pending').toLowerCase()}">${order.status || 'Pending'}</span>
                </div>
                <div class="order-actions">
                    <button class="btn btn-sm btn-outline-dark btn-view-detail" data-code="${order.code}">Xem</button>
                </div>
            </div>
        `;
    }
    
    function renderOrderDetail(order) {
        const itemsHtml = order.items.map(item => `
            <div class="summary-item">
                <img src="${item.image || 'https://placehold.co/80x80?text=No+Img'}" alt="${item.name}">
                <div class="summary-item-info">
                    <span class="name">${item.name} (x${item.quantity})</span>
                    <span class="sku">SKU: ${item.sku}</span>
                </div>
                <span class="price">${formatCurrency(item.price * item.quantity)}</span>
            </div>
        `).join('');
        const statusHistoryHtml = order.statusHistory.slice().reverse().map(hist => `
            <tr>
                <td><span class="badge status-${hist.status?.toLowerCase()}">${hist.status}</span></td>
                <td>${new Date(hist.updatedAt).toLocaleString('vi-VN')}</td>
            </tr>
        `).join('');
        const paymentMethodText = (order.paymentMethod === 'COD') ? 'Thanh toán khi nhận hàng (COD)' : 'Đã thanh toán (VNPAY)';

        return `
            <div class="order-result-summary" style="background: #fff;">
                <h3>Chi tiết Đơn hàng #${order.code}</h3>
                <div class="summary-items-list">${itemsHtml}</div>
                <div class="summary-breakdown">
                    <div class="sum-row"><span>Tạm tính</span><strong>${formatCurrency(order.subtotal)}</strong></div>
                    ${order.discountApplied > 0 ? `<div class="sum-row success"><span>Giảm giá (${order.discountCode})</span><strong>-${formatCurrency(order.discountApplied)}</strong></div>` : ''}
                    ${order.loyaltyPointsUsed > 0 ? `<div class="sum-row success"><span>Dùng điểm thưởng</span><strong>-${formatCurrency(order.loyaltyPointsUsed)}</strong></div>` : ''}
                    <div class="sum-row"><span>Vận chuyển</span><strong>${formatCurrency(order.shippingFee)}</strong></div>
                    <div class="sum-row"><span>Thuế</span><strong>${formatCurrency(order.tax)}</strong></div>
                    <div class="sum-row total"><span>Tổng cộng</span><span class="amount">${formatCurrency(order.total)}</span></div>
                </div>
            </div>
            <div class="order-details-grid" style="margin-top: 24px;">
                <div class="order-details-col">
                    <h3>Thông tin giao hàng</h3>
                    <p>
                        <strong>${order.shippingAddress.fullName}</strong><br>
                        ${order.shippingAddress.phone}<br>
                        ${order.email}<br>
                        ${order.shippingAddress.street}, ${order.shippingAddress.ward}, ${order.shippingAddress.city}
                    </p>

                    ${order.notes ? `
                        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #eee;">
                            <strong>Ghi chú:</strong><br>
                            <span style="color: #475569; font-style: italic;">"${order.notes}"</span>
                        </div>
                    ` : ''}
                </div>
                <div class="order-details-col">
                    <h3>Thanh toán & Trạng thái</h3>
                    <p><strong>Phương thức:</strong><br>${paymentMethodText}</p>
                    <h3 style="margin-top: 16px;">Lịch sử trạng thái</h3>
                    <table class="status-history-table">
                        <thead><tr><th>Trạng thái</th><th>Thời gian</th></tr></thead>
                        <tbody>${statusHistoryHtml}</tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // Tải 1 trang đơn hàng (phân trang server)
    window.loadOrderHistory = async (page = 1) => {
        orderListContainer.innerHTML = '<div class="loading-overlay" style="display: flex;"><div class="spinner"></div></div>';
        try {
            const res = await fetch(`/api/account/orders?page=${page}&limit=${ORDER_LIMIT}`);
            const data = await res.json();
            if (!data.ok) throw new Error(data.message);

            if (data.orders.length === 0) {
                orderListContainer.innerHTML = '<div class="empty-state"><p>Bạn chưa có đơn hàng nào.</p></div>';
            } else {
                orderListContainer.innerHTML = data.orders.map(renderOrderRow).join('');
            }
            renderPagination('order-pagination-container', data.pagination, 'loadOrderHistory');
        } catch (err) {
            orderListContainer.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
        }
    }

    async function loadOrderDetail(code) {
        orderDetailContainer.innerHTML = '<div class="loading-overlay" style="display: flex;"><div class="spinner"></div></div>';
        orderListView.classList.add('d-none');
        orderDetailView.classList.remove('d-none');
        try {
            const res = await fetch(`/api/account/orders/${code}`);
            const data = await res.json();
            if (!data.ok) throw new Error(data.message);
            orderDetailContainer.innerHTML = renderOrderDetail(data.order);
        } catch (err) {
            orderDetailContainer.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
        }
    }

    // Gán sự kiện
    btnBackToList?.addEventListener('click', (e) => {
        e.preventDefault();
        orderDetailView.classList.add('d-none');
        orderListView.classList.remove('d-none');
    });
    btnRefreshOrders?.addEventListener('click', () => loadOrderHistory(1));

    orderListContainer.addEventListener('click', (e) => {
        const detailButton = e.target.closest('.btn-view-detail');
        if (detailButton) {
            const code = detailButton.dataset.code;
            loadOrderDetail(code);
        }
    });

    loadMe();
    loadAddresses();

})();