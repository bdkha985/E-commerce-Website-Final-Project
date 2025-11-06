// public/javascripts/cart.js

// === Helper: Định dạng tiền tệ ===
const formatCurrency = (amount) => (amount || 0).toLocaleString('vi-VN') + 'đ';

// === Helper: Gửi request API (BẢN SỬA LỖI CUỐI CÙNG) ===
async function sendCartRequest(url, method, body = null) {
    try {
        const options = {
            method: method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        const response = await fetch(url, options);

        // ĐỌC JSON
        const data = await response.json(); 

        // KIỂM TRA OK SAU KHI ĐỌC JSON
        if (!response.ok) {
            // Nếu server trả về lỗi (400, 404, 500), data sẽ là { ok: false, message: "..." }
            throw new Error(data.message || 'Lỗi không xác định');
        }
        
        // Nếu response.ok, data là { ok: true, ... }
        return data;

    } catch (err) {
        // Lỗi này xảy ra do 2 lý do:
        // 1. Lỗi mạng (offline).
        // 2. Lỗi `response.json()` (khi server trả về HTML thay vì JSON).
        console.error('Lỗi API giỏ hàng:', err);
        
        const toastEl = document.getElementById('toastError');
        if(toastEl) {
            const toastBody = toastEl.querySelector('.toast-body');
            // Hiển thị lỗi logic (nếu có) hoặc lỗi chung
            toastBody.textContent = (err.message.includes("JSON")) 
                ? "Lỗi máy chủ, không thể đọc phản hồi." 
                : err.message;
            new bootstrap.Toast(toastEl).show();
        } else {
            alert(`Lỗi: ${err.message}`);
        }
        return null; // Trả về null nếu lỗi
    }
}

// === HÀM CẬP NHẬT MINI-CART (HEADER) ===
function updateMiniCart(cart, totalItems) {
    const miniCartList = document.querySelector('.mini-cart__list');
    const miniCartFooterSpan = document.querySelector('.mini-cart__footer span');
    const cartBadge = document.querySelector('.cart-badge');

    // 1. Cập nhật Badge
    if (cartBadge) {
        cartBadge.textContent = totalItems || 0;
    }

    // 2. Cập nhật Footer Mini-cart
    if (miniCartFooterSpan) {
        miniCartFooterSpan.textContent = `${(cart || []).length} sản phẩm`;
    }

    // 3. Cập nhật danh sách Mini-cart
    if (miniCartList) {
        miniCartList.innerHTML = ''; // Xóa nội dung cũ
        if (!cart || cart.length === 0) {
            miniCartList.innerHTML = `
                <p style="padding: 15px; text-align: center; color: #6c757d;">
                    Giỏ hàng của bạn đang trống.
                </p>`;
        } else {
            cart.forEach(item => {
                const itemHtml = `
                <div class="mini-cart__item">
                    <img src="${item.image || 'https://placehold.co/80x80?text=No+Img'}" alt="${item.name}">
                    <div class="mini-cart__info">
                        <a class="mini-cart__name" href="/products/${item.slug}">${item.name}</a>
                        <div class="mini-cart__meta">
                            <span>x${item.quantity}</span>
                            <span class="price">${formatCurrency(item.price)}</span>
                        </div>
                    </div>
                </div>`;
                miniCartList.insertAdjacentHTML('beforeend', itemHtml);
            });
        }
    }
}

// === HÀM CẬP NHẬT TRANG GIỎ HÀNG (/cart) ===
function updateCartPageView(data) {
    // === CHỐT AN TOÀN QUAN TRỌNG (FIX LỖI) ===
    if (typeof data !== 'object' || data === null) {
        // console.error("updateCartPageView nhận được data rỗng hoặc sai định dạng:", data);
        return; 
    }
    // === KẾT THÚC CHỐT AN TOÀN ===

    // Cập nhật tóm tắt đơn hàng
    document.getElementById('summary-subtotal').textContent = formatCurrency(data.subtotal);
    document.getElementById('summary-shipping').textContent = formatCurrency(data.shippingFee);
    document.getElementById('summary-tax').textContent = formatCurrency(data.tax);
    document.getElementById('summary-total').textContent = formatCurrency(data.total);
    
    // Cập nhật hiển thị giảm giá
    const discountRow = document.getElementById('discount-row');
    // Kiểm tra data.appliedDiscountCode có tồn tại không
    if (data.discountApplied > 0 && data.appliedDiscountCode) {
        document.getElementById('summary-discount').textContent = `-${formatCurrency(data.discountApplied)}`;
        document.getElementById('discount-code-text').textContent = data.appliedDiscountCode;
        discountRow.style.display = 'flex'; // Hiện dòng giảm giá
    } else {
        discountRow.style.display = 'none'; // Ẩn đi
    }

    // Cập nhật số lượng item
    const countEl = document.getElementById('cart-item-count');
    if (countEl) {
         countEl.textContent = data.cart.length;
    }

    // Kiểm tra giỏ hàng trống
    if (data.cart.length === 0) {
        const cartBody = document.getElementById('cart-body-items');
        cartBody.innerHTML = `
            <div class="empty-cart" id="empty-cart-message">
                <div class="empty-cart-icon"><i class="fa-solid fa-cart-shopping" style="font-size: 5rem; color: #cbd5e1;"></i></div>
                <h2>Giỏ hàng của bạn đang trống</h2>
                <p>Hãy khám phá thêm sản phẩm của chúng tôi!</p>
                <a href="/products/all" class="btn" style="background: var(--primary-color); color: #fff;">Tiếp tục mua sắm</a>
            </div>`;
        
        // Ẩn nút "Xóa hết" và "Thanh toán"
        document.querySelector('.cart-actions')?.remove();
        document.querySelector('.btn-checkout')?.remove();
    }
}

// === KHỞI CHẠY CODE ===
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. LOGIC TOÀN CỤC (Lắng nghe sự kiện) ---
    document.addEventListener('cart:updated', (e) => {
        const { cart, totalItems } = e.detail;
        updateMiniCart(cart, totalItems);
    });

    // --- 2. LOGIC TRANG GIỎ HÀNG (Chỉ chạy nếu ở /cart) ---
    const cartBody = document.getElementById('cart-body-items');
    if (!cartBody) {
        return; // Không phải trang giỏ hàng
    }

    // Xử lý sự kiện (Event Delegation) cho trang cart
    cartBody.addEventListener('click', async (e) => {
        const target = e.target;
        const row = target.closest('.cart-row');
        if (!row) return;
        const sku = row.dataset.sku;

        // 1. Xóa sản phẩm
        if (target.closest('.cart-remove')) {
            const data = await sendCartRequest(`/api/cart/remove/${sku}`, 'DELETE');
            if (data) {
                row.remove(); 
                updateCartPageView(data); 
                updateMiniCart(data.cart, data.totalItems); 
            }
            return;
        }
        
        // 2. Cập nhật số lượng
        const qtyInput = row.querySelector('.qty-input');
        let newQuantity = parseInt(qtyInput.value, 10);
        if (target.closest('.btn-qty-up')) {
            newQuantity += 1;
        } else if (target.closest('.btn-qty-down')) {
            newQuantity -= 1;
        } else {
            return; 
        }
        
        const data = await sendCartRequest(`/api/cart/update/${sku}`, 'PATCH', { quantity: newQuantity });
        
        if (data) {
            // API thành công
            if (newQuantity <= 0) {
                row.remove();
            } else {
                const updatedItem = data.cart.find(item => item.sku === sku);
                if(updatedItem) {
                    qtyInput.value = updatedItem.quantity;
                    row.querySelector('.cart-total').textContent = formatCurrency(updatedItem.price * updatedItem.quantity);
                }
            }
            updateCartPageView(data);
            updateMiniCart(data.cart, data.totalItems);
        } else {
            // Nếu lỗi (ví dụ hết hàng), gọi API GET /items để lấy lại số lượng đúng
            const errorData = await sendCartRequest('/api/cart/items', 'GET'); 
            if (errorData) {
                const currentItem = errorData.cart.find(item => item.sku === sku);
                if (currentItem) {
                    qtyInput.value = currentItem.quantity;
                } else {
                    row.remove(); 
                }
                updateCartPageView(errorData);
                updateMiniCart(errorData.cart, errorData.totalItems);
            }
        }
    });

    // 3. Xóa toàn bộ giỏ hàng
    const btnClearAll = document.getElementById('btn-clear-all');
    if (btnClearAll) {
        btnClearAll.addEventListener('click', async () => {
            if (!confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) return;
            const data = await sendCartRequest('/api/cart/clear', 'DELETE');
            if (data) {
                updateCartPageView(data); 
                updateMiniCart(data.cart, data.totalItems);
            }
        });
    }

    // 4. Xử lý Mã giảm giá
    const btnApplyDiscount = document.getElementById('btn-apply-discount');
    const inputDiscount = document.getElementById('discount-input');
    const msgEl = document.getElementById('discount-message');

    if (btnApplyDiscount) {
        btnApplyDiscount.addEventListener('click', async () => {
            const code = inputDiscount.value;
            if (code === '') {
                msgEl.textContent = 'Vui lòng nhập mã.';
                return;
            }
            
            btnApplyDiscount.disabled = true;
            btnApplyDiscount.textContent = 'Đang...';
            msgEl.textContent = '';

            const data = await sendCartRequest('/api/cart/apply-discount', 'POST', { code });

            if (data) {
                updateCartPageView(data); 
                updateMiniCart(data.cart, data.totalItems); 
                msgEl.textContent = data.message;
                msgEl.style.color = '#16a34a';
                inputDiscount.value = data.appliedDiscountCode; 
            } else {
                msgEl.textContent = 'Mã không hợp lệ hoặc đã hết hạn.';
                msgEl.style.color = '#ef4444';
            }

            btnApplyDiscount.disabled = false;
            btnApplyDiscount.textContent = 'Áp dụng';
        });
    }
});