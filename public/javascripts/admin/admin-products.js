// public/javascripts/admin-products.js
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('product-search-input');
    const filterBrand = document.getElementById('filter-brand');     // <-- MỚI
    const filterCategory = document.getElementById('filter-category'); // <-- MỚI
    const tableBody = document.getElementById('products-table-body');
    const paginationContainer = document.getElementById('products-pagination');
    const form = document.getElementById('product-filter-form');

    let debounceTimer;
    
    // Lấy giá trị hiện tại
    let currentQuery = searchInput ? searchInput.value : '';
    let currentBrand = filterBrand ? filterBrand.value : '';
    let currentCategory = filterCategory ? filterCategory.value : '';

    // Hàm chính: Gọi API và cập nhật UI
    async function fetchProducts(page = 1) {
        // Cập nhật state mới nhất
        currentQuery = searchInput.value;
        currentBrand = filterBrand.value;
        currentCategory = filterCategory.value;

        if (tableBody) tableBody.style.opacity = '0.5';

        try {
            // Gửi kèm brand và category trong params
            const params = new URLSearchParams({ 
                page, 
                q: currentQuery,
                brand: currentBrand,
                category: currentCategory
            });
            
            const res = await fetch(`/admin/products?${params.toString()}`, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });

            if (!res.ok) throw new Error('Network error');
            const data = await res.json();

            // Cập nhật UI
            renderTableBody(data.products);
            renderPagination(data.pagination, data.q, currentBrand, currentCategory);
            
        } catch (err) {
            console.error('Lỗi khi fetch sản phẩm:', err);
            if (tableBody) tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Không thể tải dữ liệu.</td></tr>';
        } finally {
            if (tableBody) tableBody.style.opacity = '1';
        }
    }

    // Helper: Vẽ lại bảng
    function renderTableBody(products) {
        if (!tableBody) return;
        if (products.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Không tìm thấy sản phẩm nào.</td></tr>';
            return;
        }
        tableBody.innerHTML = products.map(p => {
            const totalStock = (p.variants || []).reduce((acc, v) => acc + v.stock, 0);
            // Xử lý danh sách categories (mảng object)
            const catNames = (p.categoryIds || []).map(c => c.name).join(', ');
            
            return `
            <tr>
                <td>
                    <strong>${p.name}</strong><br>
                    <small class="text-muted">Slug: ${p.slug}</small>
                </td>
                <td>${p.brandId?.name || 'N/A'}</td>
                <td>${catNames || 'N/A'}</td>
                <td class="text-end">${(p.basePrice || 0).toLocaleString('vi-VN')}đ</td>
                <td class="text-center">${totalStock}</td>
                <td class="text-center">
                    <a href="/admin/products/${p._id}" class="btn btn-sm btn-info" title="Sửa">
                        <i class="fas fa-pencil-alt"></i>
                    </a>
                    <form action="/admin/products/${p._id}/delete" method="POST" class="d-inline" onsubmit="return confirm('Bạn có chắc muốn xóa sản phẩm này?');">
                        <button type="submit" class="btn btn-sm btn-danger" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </form>
                </td>
            </tr>
        `}).join('');
    }

    // Helper: Vẽ lại phân trang
    function renderPagination(pagination, q, brand, category) {
        if (!paginationContainer) return;
        if (pagination.totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }
        let html = '<ul class="pagination">';
        for (let i = 1; i <= pagination.totalPages; i++) {
            // Tạo link giữ nguyên các filter
            const params = new URLSearchParams({ q, brand, category, page: i });
            html += `
                <li class="page-item ${i === pagination.page ? 'active' : ''}">
                    <a class="page-link" href="?${params.toString()}" data-page="${i}">${i}</a>
                </li>`;
        }
        html += '</ul>';
        paginationContainer.innerHTML = html;
    }

    // === Lắng nghe sự kiện ===

    // 1. Gõ phím tìm kiếm
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => fetchProducts(1), 350);
        });
    }

    // 2. Thay đổi Dropdown (Thương hiệu & Danh mục)
    if (filterBrand) {
        filterBrand.addEventListener('change', () => fetchProducts(1));
    }
    if (filterCategory) {
        filterCategory.addEventListener('change', () => fetchProducts(1));
    }

    // 3. Chặn form submit
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault(); 
            fetchProducts(1);
        });
    }

    // 4. Click phân trang
    if (paginationContainer) {
        paginationContainer.addEventListener('click', (e) => {
            e.preventDefault();
            const link = e.target.closest('a.page-link');
            if (link) {
                const page = parseInt(link.dataset.page, 10);
                fetchProducts(page);
            }
        });
    }
});