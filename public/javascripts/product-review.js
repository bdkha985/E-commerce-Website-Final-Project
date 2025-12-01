// public/javascripts/product-review.js

document.addEventListener('DOMContentLoaded', () => {
  // Helper select
  const $ = (sel) => document.querySelector(sel);
  
  // Lấy Product ID
  const productId = $('#reviews-meta')?.dataset.productId || 
                    $('#pd-variants')?.dataset.productId || 
                    $('#btnAddToCart')?.dataset.productId;

  if (!productId) return;

  const reviewListEl = document.getElementById('review-list');
  const totalCountEl = document.getElementById('review-total-count');
  const ratingForm = document.getElementById('rating-form');
  const commentForm = document.getElementById('comment-form');
  const sortSelect = document.getElementById('review-sort-select');
  const paginationContainer = document.getElementById('review-pagination-container');

  const btnSubmitRating = document.getElementById('btn-submit-rating');
  const btnSubmitComment = document.getElementById('btn-submit-comment');
  const ratingAlert = document.getElementById('rating-alert');
  const commentAlert = document.getElementById('comment-alert');

  // --- 1. HÀM TẠO HTML (Có data-id để check trùng) ---
  function createReviewHTML(r) {
    const name = (r.userId && r.userId.fullName) ? r.userId.fullName : (r.fullName || 'Người dùng');
    const badge = r.userId ? '(Đã mua)' : '(Khách)';
    const stars = r.rating ? `<span class="review-stars">${'★'.repeat(r.rating)}</span>` : '';
    const date = r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : 'Vừa xong';
    const comment = r.comment ? String(r.comment).replace(/[<>]/g, "") : ''; 

    // Badge Cảm xúc
    let sentimentBadge = '';
    if (r.sentiment === 'Positive') sentimentBadge = `<span class="sentiment-badge sentiment-positive">😊 Hài lòng</span>`;
    else if (r.sentiment === 'Negative') sentimentBadge = `<span class="sentiment-badge sentiment-negative">😞 Thất vọng</span>`;
    else if (r.sentiment === 'Neutral') sentimentBadge = `<span class="sentiment-badge sentiment-neutral">😐 Trung tính</span>`;

    // QUAN TRỌNG: Thêm data-id="${r._id}" để chống lặp
    return `
      <div class="review-item" data-id="${r._id}" style="animation: highlight 1s ease; background-color: #f0fdf4; margin-bottom: 15px; padding: 15px; border-radius: 8px; border: 1px solid #dcfce7;">
        <div class="review-header" style="margin-bottom: 5px;">
          <strong class="review-author">${name}</strong> <small class="text-muted">${badge}</small>
          ${sentimentBadge} 
          <span style="color: #fbbf24; margin-left: 5px;">${stars}</span>
          <span class="review-date" style="float: right; color: #999; font-size: 0.9em;">${date}</span>
        </div>
        <p class="review-comment" style="margin: 0;">${comment}</p>
      </div>
    `;
  }

  // --- 2. HÀM CHÈN REVIEW VÀO LIST ---
  function prependReview(review) {
    // === CHECK TRÙNG: Nếu ID này đã có trên màn hình thì bỏ qua ===
    if (review._id && document.querySelector(`.review-item[data-id="${review._id}"]`)) {
        return; 
    }

    // Xóa thông báo rỗng
    if (reviewListEl.innerHTML.includes('Chưa có đánh giá') || reviewListEl.innerHTML.includes('Đang tải')) {
        reviewListEl.innerHTML = '';
    }
    
    const html = createReviewHTML(review);
    reviewListEl.insertAdjacentHTML('afterbegin', html);

    // Cập nhật số lượng
    if (totalCountEl) {
        const current = parseInt(totalCountEl.textContent || 0);
        totalCountEl.textContent = current + 1;
    }
  }

  // --- 3. XỬ LÝ FORM SUBMIT (Optimistic UI) ---
  async function handleSubmit(form, url, payload, btn, alertEl) {
    const originalText = btn.textContent;
    btn.disabled = true; btn.textContent = 'Đang gửi...';

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message);

      if(alertEl) {
          alertEl.className = 'alert alert-success';
          alertEl.textContent = 'Gửi thành công!';
          alertEl.classList.remove('d-none');
          setTimeout(() => alertEl.classList.add('d-none'), 3000);
      } else {
          alert("Gửi thành công!"); 
      }
      
      form.reset();

      // === HIỂN THỊ NGAY ===
      if (data.review) {
          prependReview(data.review); 
      }

    } catch (err) {
      if(alertEl) {
          alertEl.className = 'alert alert-danger';
          alertEl.textContent = err.message;
          alertEl.classList.remove('d-none');
      } else {
          alert(err.message);
      }
    } finally {
      btn.disabled = false; btn.textContent = originalText;
    }
  }

  if (ratingForm) {
    ratingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const rating = document.querySelector('input[name="rating"]:checked')?.value;
      const comment = document.getElementById('rating-comment').value;
      if (!rating) return alert('Vui lòng chọn sao');
      
      handleSubmit(ratingForm, `/api/reviews/${productId}/rate`, { rating, comment }, btnSubmitRating, ratingAlert);
    });
  }

  if (commentForm) {
    commentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fullName = document.getElementById('comment-name').value;
      const comment = document.getElementById('comment-text').value;
      
      handleSubmit(commentForm, `/api/reviews/${productId}/comment`, { fullName, comment }, btnSubmitComment, commentAlert);
    });
  }

  // --- 4. SOCKET.IO (NHẬN REVIEW TỪ NGƯỜI KHÁC) ---
  if (window.io) {
    const socket = io({ transports: ['websocket', 'polling'] });
    
    socket.on('connect', () => {
        console.log("🔌 Socket connected! Joining room:", productId);
        socket.emit('join_room', productId);
    });

    socket.on('new_review', (review) => {
        // Ép kiểu về String để so sánh
        if (String(review.productId) === String(productId)) {
             console.log("🚀 Socket received:", review);
             prependReview(review); // Hàm này đã có check trùng lặp
        }
    });
  }

  // --- 5. FETCH DANH SÁCH CŨ & PHÂN TRANG ---
  async function fetchReviews(page = 1) {
    if (reviewListEl) reviewListEl.innerHTML = '<p class="text-muted">Đang tải...</p>';
    try {
      const sort = sortSelect ? sortSelect.value : 'newest';
      const res = await fetch(`/api/reviews/${productId}?page=${page}&sort=${sort}`);
      const data = await res.json();
      
      if (data.ok) {
          if (data.reviews.length > 0) {
            reviewListEl.innerHTML = data.reviews.map(createReviewHTML).join('');
          } else {
            reviewListEl.innerHTML = '<p class="text-muted">Chưa có đánh giá nào.</p>';
          }
          
          // Render Pagination
          if (paginationContainer && data.pagination.totalPages > 1) {
              let html = '<ul class="pagination">';
              for(let i=1; i<=data.pagination.totalPages; i++) {
                  html += `<li class="page-item ${i===page?'active':''}"><a href="#" class="page-link" data-page="${i}">${i}</a></li>`;
              }
              html += '</ul>';
              paginationContainer.innerHTML = html;
          } else if (paginationContainer) {
              paginationContainer.innerHTML = '';
          }

          if(totalCountEl) totalCountEl.textContent = data.pagination.totalReviews;
      }
    } catch(e) { console.error(e); }
  }

  if (paginationContainer) {
      paginationContainer.addEventListener('click', (e) => {
          e.preventDefault();
          const link = e.target.closest('.page-link');
          if(link) fetchReviews(parseInt(link.dataset.page));
      });
  }
  
  if (sortSelect) {
      sortSelect.addEventListener('change', () => fetchReviews(1));
  }

  // Load lần đầu
  fetchReviews(1);
});