// public/javascripts/admin-orders.js
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('order-search-input');
    const tableBody = document.getElementById('orders-table-body');
    const paginationContainer = document.getElementById('orders-pagination');
    const filterTitle = document.getElementById('filter-title');
    const filterLinks = document.querySelectorAll('.filter-link');
    const form = document.getElementById('order-filter-form');

    let debounceTimer;
    let currentFilter = 'all';
    let currentQuery = searchInput ? searchInput.value : '';

    // Hàm chính: Gọi API và cập nhật UI
    async function fetchOrders(page = 1) {
        const q = currentQuery;
        const filter = currentFilter;

        // Thêm hiệu ứng loading
        if (tableBody) tableBody.style.opacity = '0.5';

        try {
            const params = new URLSearchParams({ page, q, filter });
            const res = await fetch(`/admin/orders?${params.toString()}`, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });

            if (!res.ok) throw new Error('Network error');
            const data = await res.json();

            // Cập nhật UI
            renderTableBody(data.orders);
            renderPagination(data.pagination, data.filter, data.q);
            if (filterTitle) filterTitle.textContent = data.filterTitle;
            
        } catch (err) {
            console.error('Lỗi khi fetch đơn hàng:', err);
            if (tableBody) tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Không thể tải dữ liệu.</td></tr>';
        } finally {
            if (tableBody) tableBody.style.opacity = '1';
        }
    }

    // Helper: Vẽ lại bảng
    function renderTableBody(orders) {
        if (!tableBody) return;
        if (orders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Không tìm thấy đơn hàng nào.</td></tr>';
            return;
        }
        tableBody.innerHTML = orders.map(order => `
            <tr>
                <td><strong>${order.code}</strong></td>
                <td>${new Date(order.createdAt).toLocaleString('vi-VN')}</td>
                <td>
                    ${order.shippingAddress.fullName}<br>
                    <small>${order.email}</small>
                </td>
                <td class="text-end"><strong>${(order.total || 0).toLocaleString('vi-VN')}đ</strong></td>
                <td class="text-center">
                    ${order.paymentStatus === 'Paid'
                        ? '<span class="badge bg-success">Đã thanh toán</span>'
                        : `<span class="badge bg-warning text-dark">${order.paymentMethod}</span>`
                    }
                </td>
                <td class="text-center">
                    <span class="badge bg-secondary">${order.status}</span>
                </td>
                <td class="text-center">
                    <a href="/admin/orders/${order._id}" class="btn btn-sm btn-info" title="Xem chi tiết">
                        <i class="fas fa-eye"></i>
                    </a>
                </td>
            </tr>
        `).join('');
    }

    // Helper: Vẽ lại phân trang
    function renderPagination(pagination, filter, q) {
        if (!paginationContainer) return;
        if (pagination.totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }
        let html = '<ul class="pagination">';
        for (let i = 1; i <= pagination.totalPages; i++) {
            html += `
                <li class="page-item ${i === pagination.page ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>`;
        }
        html += '</ul>';
        paginationContainer.innerHTML = html;
    }

    // === Lắng nghe sự kiện ===

    // 1. Gõ phím (Debounced)
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentQuery = e.target.value;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                fetchOrders(1); // Luôn về trang 1 khi tìm kiếm
            }, 350); // Chờ 350ms
        });
    }

    // 2. Chặn form submit
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault(); // Ngăn tải lại trang
            fetchOrders(1);
        });
    }

    // 3. Click link phân trang
    if (paginationContainer) {
        paginationContainer.addEventListener('click', (e) => {
            e.preventDefault();
            const link = e.target.closest('a.page-link');
            if (link) {
                const page = parseInt(link.dataset.page, 10);
                fetchOrders(page);
            }
        });
    }

    // 4. Click link bộ lọc
    filterLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            currentFilter = e.target.dataset.filter;
            fetchOrders(1); // Về trang 1 khi đổi bộ lọc
        });
    });

});