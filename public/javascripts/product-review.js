// public/javascripts/product-review.js
// Reviews section – no page reload, auto refresh after submit

document.addEventListener('DOMContentLoaded', () => {
  // ---- Helpers ----
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const fmtDate = (d) => new Date(d).toLocaleDateString('vi-VN');
  const escapeHtml = (s = '') =>
    s.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

  // ---- DOM targets ----
  const productId =
    $('#reviews-meta')?.dataset.productId ||
    $('#pd-variants')?.dataset.productId ||
    $('#btnAddToCart')?.dataset.productId;

  if (!productId) return; // Không phải trang product detail

  const reviewListEl = $('#review-list');
  const paginationContainer = $('#review-pagination-container');
  const totalCountEl = $('#review-total-count');

  const ratingForm = $('#rating-form');
  const ratingAlert = $('#rating-alert');
  const ratingComment = $('#rating-comment');
  const btnSubmitRating = $('#btn-submit-rating');

  const commentForm = $('#comment-form');
  const commentAlert = $('#comment-alert');
  const commentName = $('#comment-name');
  const commentText = $('#comment-text');
  const btnSubmitComment = $('#btn-submit-comment');

  // ---- Fetch & render ----
  async function fetchReviews(page = 1) {
    if (reviewListEl) reviewListEl.innerHTML = '<p>Đang tải đánh giá...</p>';
    try {
      const res = await fetch(`/api/reviews/${productId}?page=${page}`, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.message || 'Không thể tải đánh giá');

      renderReviewList(data.reviews || []);
      renderReviewPagination(data.pagination || { page: 1, totalPages: 1 });
      if (totalCountEl) totalCountEl.textContent = data.pagination?.totalReviews ?? 0;
    } catch (err) {
      if (reviewListEl) reviewListEl.innerHTML = `<p class="alert alert-danger">${escapeHtml(err.message)}</p>`;
      if (paginationContainer) paginationContainer.innerHTML = '';
    }
  }

  function renderReviewList(reviews) {
    if (!reviewListEl) return;
    if (!reviews.length) {
      reviewListEl.innerHTML = '<p>Chưa có đánh giá nào cho sản phẩm này.</p>';
      return;
    }
    reviewListEl.innerHTML = reviews
      .map((r) => {
        const author = escapeHtml(r.fullName || r.userId?.fullName || 'Người dùng');
        const badge = r.userId ? '(Đã mua)' : '(Khách)';
        const stars = r.rating ? `<span class="review-stars">${'★'.repeat(r.rating)}</span>` : '';
        const date = r.createdAt ? fmtDate(r.createdAt) : '';
        const comment = r.comment ? escapeHtml(r.comment) : '<i>Không có bình luận</i>';
        return `
          <div class="review-item">
            <div class="review-header">
              <span class="review-author">${author} ${badge}</span>
              ${stars}
              <span class="review-date">${date}</span>
            </div>
            <p class="review-comment">${comment}</p>
          </div>
        `;
      })
      .join('');
  }

  function renderReviewPagination(pagination) {
    if (!paginationContainer) return;
    const { page = 1, totalPages = 1 } = pagination || {};
    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }
    let html = '<ul class="pagination">';
    // Prev
    html += `
      <li class="page-item ${page <= 1 ? 'disabled' : ''}">
        <a href="#" class="page-link" data-page="${page - 1}">«</a>
      </li>`;
    // Numbers
    for (let i = 1; i <= totalPages; i++) {
      html += `
        <li class="page-item ${i === page ? 'active' : ''}">
          <a href="#" class="page-link" data-page="${i}">${i}</a>
        </li>`;
    }
    // Next
    html += `
      <li class="page-item ${page >= totalPages ? 'disabled' : ''}">
        <a href="#" class="page-link" data-page="${page + 1}">»</a>
      </li>`;
    html += '</ul>';
    paginationContainer.innerHTML = html;
  }

  // ---- Events ----
  if (paginationContainer) {
    paginationContainer.addEventListener('click', (e) => {
      const link = e.target.closest('.page-link');
      if (!link) return;
      e.preventDefault();
      const p = parseInt(link.dataset.page, 10);
      if (Number.isFinite(p)) fetchReviews(p);
    });
  }

  if (ratingForm && btnSubmitRating) {
    ratingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const rating = ratingForm.querySelector('input[name="rating"]:checked')?.value;
      const comment = ratingComment?.value || '';

      if (!rating) {
        showAlert(ratingAlert, 'danger', 'Vui lòng chọn số sao.');
        return;
      }

      try {
        btnSubmitRating.disabled = true;
        btnSubmitRating.textContent = 'Đang gửi...';

        const res = await fetch(`/api/reviews/${productId}/rate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: JSON.stringify({ rating, comment })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Gửi đánh giá thất bại');

        showAlert(ratingAlert, 'success', 'Gửi đánh giá thành công!');
        ratingForm.reset();

        // Cập nhật đếm tại chỗ + reload list
        bumpCounter();
        fetchReviews(1);
      } catch (err) {
        showAlert(ratingAlert, 'danger', err.message);
      } finally {
        btnSubmitRating.disabled = false;
        btnSubmitRating.textContent = 'Gửi đánh giá';
      }
    });
  }

  if (commentForm && btnSubmitComment) {
    commentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const fullName = commentName?.value?.trim();
      const comment = commentText?.value?.trim();

      if (!fullName || !comment) {
        showAlert(commentAlert, 'danger', 'Vui lòng nhập tên và bình luận.');
        return;
      }

      try {
        btnSubmitComment.disabled = true;
        btnSubmitComment.textContent = 'Đang gửi...';

        const res = await fetch(`/api/reviews/${productId}/comment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: JSON.stringify({ fullName, comment })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Gửi bình luận thất bại');

        showAlert(commentAlert, 'success', 'Gửi bình luận thành công!');
        commentForm.reset();

        // Cập nhật đếm tại chỗ + reload list
        bumpCounter();
        fetchReviews(1);
      } catch (err) {
        showAlert(commentAlert, 'danger', err.message);
      } finally {
        btnSubmitComment.disabled = false;
        btnSubmitComment.textContent = 'Gửi bình luận';
      }
    });
  }

  function showAlert(el, type, msg) {
    if (!el) return;
    el.className = `alert alert-${type}`;
    el.textContent = msg;
    el.style.display = 'block';
    // auto hide sau 3s
    setTimeout(() => {
      el.style.display = 'none';
    }, 3000);
  }

  function bumpCounter() {
    if (!totalCountEl) return;
    const n = parseInt(totalCountEl.textContent || '0', 10) + 1;
    totalCountEl.textContent = String(n);
    const tabLabel = document.querySelector('.tab-link[data-tab="reviews"]');
    if (tabLabel) tabLabel.innerHTML = `Đánh Giá (${n})`;
  }

  // ---- Optional: nếu có tabs thì gắn logic, nhưng KHÔNG chặn script khi không có tabs ----
  const tabsContainer = document.querySelector('.pd-tabs');
  const tabLinks = tabsContainer ? $$('.tab-link', tabsContainer) : [];
  const tabPanes = tabsContainer ? $$('.tab-pane', tabsContainer) : [];
  if (tabsContainer) {
    tabLinks.forEach((link) => {
      link.addEventListener('click', () => {
        const tabName = link.dataset.tab;
        tabLinks.forEach((l) => l.classList.remove('active'));
        tabPanes.forEach((p) => p.classList.remove('active'));
        link.classList.add('active');
        $('#tab-' + tabName)?.classList.add('active');
        if (tabName === 'reviews' && !reviewListEl?.hasChildNodes()) {
          fetchReviews(1);
        }
      });
    });
  }

  // ---- Load lần đầu ----
  fetchReviews(1);

  // ---- Optional: auto-refresh khi có socket.io (nếu layout đã nạp /socket.io/socket.io.js) ----
  if (window.io) {
  const socket = io({
    transports: ['websocket', 'polling'], // thử websocket trước
    // path: '/socket.io',                 // mặc định đã là /socket.io
  });
  // (khuyến nghị) join theo productId để chỉ nhận review của sản phẩm hiện tại
  socket.emit('join_room', productId);
  socket.on('new_review', (payload) => {
    if (payload?.productId === productId) fetchReviews(1);
  });
}
});
