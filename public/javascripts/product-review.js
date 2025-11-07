document.addEventListener('DOMContentLoaded', () => {

    // === Lấy các DOM element ===
    const reviewSection = document.getElementById('details-reviews');
    if (!reviewSection) return; // Không phải trang product-detail, thoát

    const productId = document.getElementById('btnAddToCart')?.dataset.productId;
    if (!productId) {
        console.error("Không tìm thấy Product ID");
        return;
    }
    
    // === 1. Logic gọi API và Render Review ===
    const reviewListEl = document.getElementById('review-list');
    const paginationContainer = document.getElementById('review-pagination-container');
    const totalCountEl = document.getElementById('review-total-count');

    async function fetchReviews(page = 1) {
        reviewListEl.innerHTML = '<p>Đang tải đánh giá...</p>';
        try {
            const res = await fetch(`/api/reviews/${productId}?page=${page}`);
            const data = await res.json();
            if (!data.ok) throw new Error('Không thể tải đánh giá');

            renderReviewList(data.reviews);
            renderReviewPagination(data.pagination);
            totalCountEl.textContent = data.pagination.totalReviews || 0;

        } catch (err) {
            reviewListEl.innerHTML = `<p class="alert alert-danger">${err.message}</p>`;
        }
    }

    function renderReviewList(reviews) {
        if (reviews.length === 0) {
            reviewListEl.innerHTML = '<p>Chưa có đánh giá nào cho sản phẩm này.</p>';
            return;
        }
        reviewListEl.innerHTML = reviews.map(r => `
            <div class="review-item">
                <div class="review-header">
                    <span class="review-author">${r.fullName} ${r.userId ? '' : '(Khách)'}</span>
                    ${r.rating ? `<span class="review-stars">${'★'.repeat(r.rating)}</span>` : ''}
                    <span class="review-date">${new Date(r.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <p class="review-comment">${r.comment || '<i>(Không có bình luận)</i>'}</p>
            </div>
        `).join('');
    }

    function renderReviewPagination(pagination) {
        // Yêu cầu PDF: Luôn hiển thị phân trang
        if (pagination.totalPages < 1) {
             paginationContainer.innerHTML = '';
             return;
        }

        let html = '<ul class="pagination">';
        for (let i = 1; i <= pagination.totalPages; i++) {
            html += `
                <li class="page-item ${i === pagination.page ? 'active' : ''}">
                    <span class="page-link" data-page="${i}" style="cursor:pointer;">${i}</span>
                </li>`;
        }
        html += '</ul>';
        paginationContainer.innerHTML = html;
    }

    // Xử lý click pagination
    paginationContainer.addEventListener('click', e => {
        if (e.target.matches('.page-link')) {
            e.preventDefault();
            const page = parseInt(e.target.dataset.page, 10);
            fetchReviews(page);
        }
    });

    // === 2. Xử lý Form 1: Gửi Rating (Đã đăng nhập) ===
    const ratingForm = document.getElementById('rating-form');
    const ratingAlert = document.getElementById('rating-alert');
    if (ratingForm) {
        ratingForm.addEventListener('submit', async e => {
            e.preventDefault();
            const btn = document.getElementById('btn-submit-rating');
            btn.disabled = true;
            btn.textContent = 'Đang gửi...';

            const payload = {
                rating: ratingForm.querySelector('input[name="rating"]:checked')?.value,
                comment: document.getElementById('rating-comment').value
            };

            if (!payload.rating) {
                showAlert(ratingAlert, 'danger', 'Vui lòng chọn số sao.');
                btn.disabled = false;
                btn.textContent = 'Gửi đánh giá';
                return;
            }

            try {
                const res = await fetch(`/api/reviews/${productId}/rate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message);

                // showAlert(ratingAlert, 'success', 'Gửi đánh giá thành công!');
                // ratingForm.reset();
                // fetchReviews(1); // Tải lại danh sách review
                location.reload();
            } catch (err) {
                showAlert(ratingAlert, 'danger', err.message);
                btn.disabled = false;
                btn.textContent = 'Gửi đánh giá';
            } finally {
                btn.disabled = false;
                btn.textContent = 'Gửi đánh giá';
            }
        });
    }

    // === 3. Xử lý Form 2: Gửi Comment (Khách) ===
    const commentForm = document.getElementById('comment-form');
    const commentAlert = document.getElementById('comment-alert');
    if (commentForm) {
        commentForm.addEventListener('submit', async e => {
            e.preventDefault();
            const btn = document.getElementById('btn-submit-comment');
            btn.disabled = true;
            btn.textContent = 'Đang gửi...';

            const payload = {
                fullName: document.getElementById('comment-name').value,
                comment: document.getElementById('comment-text').value
            };
            
            try {
                const res = await fetch(`/api/reviews/${productId}/comment`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message);

                // showAlert(commentAlert, 'success', 'Gửi bình luận thành công!');
                // commentForm.reset();
                // fetchReviews(1); // Tải lại danh sách review
                location.reload();
            } catch (err) {
                showAlert(commentAlert, 'danger', err.message);
                // Mở khóa nút nếu có lỗi
                btn.disabled = false;
                btn.textContent = 'Gửi bình luận';
            } finally {
                btn.disabled = false;
                btn.textContent = 'Gửi bình luận';
            }
        });
    }

    // === 4. Helper hiển thị thông báo ===
    function showAlert(alertEl, type, message) {
        alertEl.className = `alert alert-${type}`;
        alertEl.textContent = message;
        alertEl.style.display = 'block';
    }

    // === 5. Tải review lần đầu tiên khi trang load ===
    fetchReviews(1);
    
});