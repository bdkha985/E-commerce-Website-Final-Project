// public/javascripts/search.js
document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('headerSearchForm');
    const searchInput = document.getElementById('headerSearchInput');
    const resultsBox = document.getElementById('search-suggestions');

    if (!searchForm || !searchInput || !resultsBox) return;

    let debounceTimer;

    // Ngăn form submit (vì chúng ta muốn AJAX)
    searchForm.addEventListener('submit', (e) => {
        // Nếu người dùng nhấn Enter, chúng ta vẫn cho phép họ đến trang search đầy đủ
        // (Chúng ta sẽ dùng action="/search" của form)
        // Nếu không muốn, thêm e.preventDefault();
    });

    // Nghe sự kiện gõ phím
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        // Xóa timer cũ
        clearTimeout(debounceTimer);

        // Nếu query quá ngắn, ẩn box
        if (query.length < 2) {
            resultsBox.innerHTML = '';
            resultsBox.classList.remove('active');
            return;
        }

        // Đặt timer mới (debounce 300ms)
        debounceTimer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`);
                if (!res.ok) throw new Error('Lỗi mạng');
                
                const data = await res.json();
                
                if (data.ok && data.products.length > 0) {
                    renderSuggestions(data.products);
                } else {
                    showNoResults(query);
                }
            } catch (err) {
                console.error('Lỗi fetch search:', err);
                resultsBox.innerHTML = '';
                resultsBox.classList.remove('active');
            }
        }, 300); 
    });

    // Ẩn box khi click ra ngoài
    document.addEventListener('click', (e) => {
        if (!searchForm.contains(e.target)) {
            resultsBox.classList.remove('active');
        }
    });

    // Hiển thị lại khi focus (nếu đã có nội dung)
    searchInput.addEventListener('focus', () => {
        if (resultsBox.innerHTML !== '') {
            resultsBox.classList.add('active');
        }
    });

    // Hàm render HTML
    function renderSuggestions(products) {
        const html = products.map(p => `
            <a href="/products/${p.slug}" class="suggestion-item">
                <img src="${p.thumb}" alt="${p.name}" class="suggestion-thumb">
                <div class="suggestion-info">
                    <span class="suggestion-name">${p.name}</span>
                    <span class="suggestion-price">${(p.price || 0).toLocaleString('vi-VN')}đ</span>
                </div>
            </a>
        `).join('');
        
        resultsBox.innerHTML = `<div class="suggestion-list">${html}</div>`;
        resultsBox.classList.add('active');
    }

    // Hàm báo không có kết quả
    function showNoResults(query) {
        resultsBox.innerHTML = `<div class="suggestion-empty">Không tìm thấy kết quả cho "${query}"</div>`;
        resultsBox.classList.add('active');
    }
});