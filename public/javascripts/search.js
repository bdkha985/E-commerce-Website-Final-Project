// public/javascripts/search.js

document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('headerSearchForm');
    const searchInput = document.getElementById('headerSearchInput');
    const resultsBox = document.getElementById('search-suggestions');
    const fileInput = document.getElementById('headerSearchFile'); // Input ảnh

    if (!searchForm || !searchInput || !resultsBox) return;

    let debounceTimer;

    // ==========================================
    // 1. LOGIC LIVE SEARCH (TÌM BẰNG CHỮ)
    // ==========================================

    // Lắng nghe sự kiện gõ phím
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        // Reset timer cũ
        clearTimeout(debounceTimer);

        // Ẩn nếu quá ngắn
        if (query.length < 2) {
            resultsBox.innerHTML = '';
            resultsBox.style.display = 'none';
            return;
        }

        // Debounce 300ms để tránh gọi API quá nhiều
        debounceTimer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                
                if (data.ok && data.products.length > 0) {
                    renderSuggestions(data.products);
                } else {
                    resultsBox.innerHTML = '';
                    resultsBox.style.display = 'none';
                }
            } catch (err) {
                console.error('Lỗi Live Search:', err);
            }
        }, 300); 
    });

    // Hàm vẽ HTML danh sách gợi ý
    function renderSuggestions(products) {
        const html = products.map(p => `
            <a href="/products/${p.slug}" class="suggestion-item">
                <img src="${p.thumb || 'https://placehold.co/50x50'}" alt="${p.name}" class="suggestion-thumb">
                <div class="suggestion-info">
                    <span class="suggestion-name">${p.name}</span>
                    <span class="suggestion-price">${(p.price || 0).toLocaleString('vi-VN')}đ</span>
                </div>
            </a>
        `).join('');
        
        resultsBox.innerHTML = `<div class="suggestion-list">${html}</div>`;
        resultsBox.style.display = 'block';
    }

    // Ẩn box khi click ra ngoài
    document.addEventListener('click', (e) => {
        if (!searchForm.contains(e.target)) {
            resultsBox.style.display = 'none';
        }
    });

    // Hiện lại khi focus vào ô input
    searchInput.addEventListener('focus', () => {
        if (resultsBox.innerHTML.trim() !== '') {
            resultsBox.style.display = 'block';
        }
    });

    // ==========================================
    // 2. LOGIC IMAGE SEARCH (TÌM BẰNG ẢNH AI)
    // ==========================================
    
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // UI: Hiển thị trạng thái đang xử lý
            const originalPlaceholder = searchInput.placeholder;
            searchInput.value = '';
            searchInput.placeholder = "AI đang phân tích ảnh...";
            searchInput.disabled = true;
            resultsBox.style.display = 'none';

            try {
                const formData = new FormData();
                formData.append('image', file);

                const res = await fetch('/api/search/image', {
                    method: 'POST',
                    body: formData
                });

                const data = await res.json();
                
                if (data.ok && data.keywords) {
                    // Thành công: Chuyển hướng sang trang tìm kiếm với từ khóa AI gợi ý
                    // Ví dụ: AI trả về "giày sneaker trắng" -> Chuyển sang /products/all?q=giày sneaker trắng
                    window.location.href = `/search?q=${encodeURIComponent(data.keywords)}`;
                } else {
                    alert("AI không nhận diện được sản phẩm trong ảnh này. Vui lòng thử ảnh khác.");
                    resetSearchInput(originalPlaceholder);
                }

            } catch (err) {
                console.error("Lỗi Image Search:", err);
                alert("Lỗi kết nối đến máy chủ AI.");
                resetSearchInput(originalPlaceholder);
            }
        });
    }

    function resetSearchInput(placeholder) {
        searchInput.disabled = false;
        searchInput.placeholder = placeholder;
        searchInput.focus();
        if (fileInput) fileInput.value = ''; // Reset input file để chọn lại được ảnh cũ nếu muốn
    }
});