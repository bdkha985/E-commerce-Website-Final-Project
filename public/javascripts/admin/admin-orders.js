// public/javascripts/admin-orders.js

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("order-search-input");
    const tableBody = document.getElementById("orders-table-body");
    const paginationContainer = document.getElementById("orders-pagination");
    const filterTitle = document.getElementById("filter-title");
    const filterLinks = document.querySelectorAll(".filter-link");
    const form = document.getElementById("order-filter-form");

    const sortSelect = document.getElementById("order-sort-select");
    const statusSelect = document.getElementById("order-status-select");
    const paymentSelect = document.getElementById("payment-status-select");

    let debounceTimer;
    let currentFilter = filterLinks[0]?.dataset.filter || "all";
    let currentQuery = searchInput ? searchInput.value : "";
    let currentSort = sortSelect ? sortSelect.value : "newest";
    let currentOStatus = statusSelect ? statusSelect.value : "all";
    let currentPStatus = paymentSelect ? paymentSelect.value : "all";

    async function fetchOrders(page = 1) {
        currentQuery = searchInput.value;
        currentSort = sortSelect.value;
        currentOStatus = statusSelect.value;
        currentPStatus = paymentSelect.value;

        if (tableBody) tableBody.style.opacity = "0.5";

        try {
            // Thêm tất cả tham số vào URL
            const params = new URLSearchParams({
                page,
                q: currentQuery,
                filter: currentFilter,
                sort: currentSort,
                o_status: currentOStatus,
                p_status: currentPStatus,
            });

            const res = await fetch(`/admin/orders?${params.toString()}`, {
                headers: { "X-Requested-With": "XMLHttpRequest" },
            });

            if (!res.ok) throw new Error("Network error");
            const data = await res.json();

            // Cập nhật UI
            renderTableBody(data.orders);
            renderPagination(data.pagination);
            if (filterTitle) filterTitle.textContent = data.filterTitle;
        } catch (err) {
            console.error("Lỗi khi fetch đơn hàng:", err);
            if (tableBody)
                tableBody.innerHTML =
                    '<tr><td colspan="7" class="text-center text-danger">Không thể tải dữ liệu.</td></tr>';
        } finally {
            if (tableBody) tableBody.style.opacity = "1";
        }
    }

    // (Hàm renderTableBody)
    function renderTableBody(orders) {
        if (!tableBody) return;
        if (orders.length === 0) {
            tableBody.innerHTML =
                '<tr><td colspan="7" class="text-center">Không tìm thấy đơn hàng nào.</td></tr>';
            return;
        }
        tableBody.innerHTML = orders
            .map(
                (order) => `
            <tr>
                <td><strong>${order.code}</strong></td>
                <td>${new Date(order.createdAt).toLocaleString("vi-VN")}</td>
                <td>
                    ${order.shippingAddress.fullName}<br>
                    <small>${order.email}</small>
                </td>
                <td class="text-end"><strong>${(
                    order.total || 0
                ).toLocaleString("vi-VN")}đ</strong></td>
                <td class="text-center">
                    ${
                        order.paymentStatus === "Paid"
                            ? '<span class="badge bg-success">Đã thanh toán</span>'
                            : `<span class="badge bg-warning text-dark">${order.paymentMethod}</span>`
                    }
                </td>
                <td class="text-center">
                    <span class="badge bg-secondary">${order.status}</span>
                </td>
                <td class="text-center">
                    <a href="/admin/orders/${
                        order._id
                    }" class="btn btn-sm btn-info" title="Xem chi tiết">
                        <i class="fas fa-eye"></i>
                    </a>
                </td>
            </tr>
        `
            )
            .join("");
    }

    // (Hàm renderPagination)
    function renderPagination(pagination) {
        if (!paginationContainer) return;
        if (pagination.totalPages <= 1) {
            paginationContainer.innerHTML = "";
            return;
        }
        let html = '<ul class="pagination">';
        for (let i = 1; i <= pagination.totalPages; i++) {
            html += `
                <li class="page-item ${i === pagination.page ? "active" : ""}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>`;
        }
        html += "</ul>";
        paginationContainer.innerHTML = html;
    }

    // 1. Gõ phím
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                fetchOrders(1);
            }, 350);
        });
    }

    // 2. Chặn form submit
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            fetchOrders(1);
        });
    }

    // 3. Click link phân trang
    if (paginationContainer) {
        paginationContainer.addEventListener("click", (e) => {
            e.preventDefault();
            const link = e.target.closest("a.page-link");
            if (link) {
                const page = parseInt(link.dataset.page, 10);
                fetchOrders(page);
            }
        });
    }

    // 4. Click link bộ lọc (Thời gian)
    filterLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            currentFilter = e.target.dataset.filter;
            fetchOrders(1);
        });
    });

    [sortSelect, statusSelect, paymentSelect].forEach((select) => {
        if (select) {
            select.addEventListener("change", () => {
                fetchOrders(1);
            });
        }
    });

    fetchOrders(1);
});
