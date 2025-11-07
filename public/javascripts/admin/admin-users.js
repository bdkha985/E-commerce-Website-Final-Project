// public/javascripts/admin-users.js
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("user-search-input");
    const tableBody = document.getElementById("users-table-body");
    const paginationContainer = document.getElementById("users-pagination");
    const form = document.getElementById("user-filter-form");

    let debounceTimer;
    let currentQuery = searchInput ? searchInput.value : "";

    async function fetchUsers(page = 1) {
        const q = currentQuery;
        if (tableBody) tableBody.style.opacity = "0.5";

        try {
            const params = new URLSearchParams({ page, q });
            const res = await fetch(`/admin/users?${params.toString()}`, {
                headers: { "X-Requested-With": "XMLHttpRequest" },
            });

            if (!res.ok) throw new Error("Network error");
            const data = await res.json();

            renderTableBody(data.users);
            renderPagination(data.pagination, data.q);
        } catch (err) {
            console.error("Lỗi khi fetch user:", err);
            if (tableBody)
                tableBody.innerHTML =
                    '<tr><td colspan="6" class="text-center text-danger">Không thể tải dữ liệu.</td></tr>';
        } finally {
            if (tableBody) tableBody.style.opacity = "1";
        }
    }

    function renderTableBody(users) {
        if (!tableBody) return;
        if (users.length === 0) {
            tableBody.innerHTML =
                '<tr><td colspan="6" class="text-center">Không tìm thấy người dùng.</td></tr>';
            return;
        }
        tableBody.innerHTML = users
            .map(
                (user) => `
            <tr>
                <td><strong>${user.fullName}</strong></td>
                <td>
                    ${user.email}<br>
                    <small class="text-muted">${user.phone || "N/A"}</small>
                </td>
                <td class="text-center">${user.loyaltyPoints?.balance || 0}</td>
                <td>${new Date(user.createdAt).toLocaleDateString("vi-VN")}</td>
                <td class="text-center">
                    ${
                        user.isBanned
                            ? '<span class="badge bg-danger">Đã Khóa</span>'
                            : '<span class="badge bg-success">Hoạt động</span>'
                    }
                </td>
                <td class="text-center">
                    <a href="/admin/users/${
                        user._id
                    }" class="btn btn-sm btn-info me-1" title="Sửa thông tin">
                        <i class="fas fa-pencil-alt"></i>
                    </a>
                    
                    <form action="/admin/users/${
                        user._id
                    }/toggle-ban" method="POST" class="d-inline" onsubmit="return confirm('Bạn có chắc muốn thay đổi trạng thái tài khoản này?');">
                        ${
                            user.isBanned
                                ? `<button type="submit" class="btn btn-sm btn-success" title="Mở khóa">
                                 <i class="fas fa-check-circle"></i>
                               </button>`
                                : `<button type="submit" class="btn btn-sm btn-danger" title="Khóa">
                                 <i class="fas fa-ban"></i>
                               </button>`
                        }
                    </form>
                </td>
            </tr>
        `
            )
            .join("");
    }

    function renderPagination(pagination, q) {
        if (!paginationContainer) return;
        if (pagination.totalPages <= 1) {
            paginationContainer.innerHTML = "";
            return;
        }
        let html = '<ul class="pagination">';
        for (let i = 1; i <= pagination.totalPages; i++) {
            const params = new URLSearchParams({ q, page: i });
            html += `
                <li class="page-item ${i === pagination.page ? "active" : ""}">
                    <a class="page-link" href="?${params.toString()}" data-page="${i}">${i}</a>
                </li>`;
        }
        html += "</ul>";
        paginationContainer.innerHTML = html;
    }

    // Lắng nghe sự kiện
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            currentQuery = e.target.value;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                fetchUsers(1);
            }, 350);
        });
    }

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            fetchUsers(1);
        });
    }

    if (paginationContainer) {
        paginationContainer.addEventListener("click", (e) => {
            e.preventDefault();
            const link = e.target.closest("a.page-link");
            if (link) {
                const page = parseInt(link.dataset.page, 10);
                fetchUsers(page);
            }
        });
    }
});
