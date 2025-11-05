// public/javascripts/cart.js

// === Helper: Định dạng tiền tệ ===
const formatCurrency = (amount) => (amount || 0).toLocaleString('vi-VN') + 'đ';

// === Helper: Gửi request API (tránh lặp code) ===
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
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Lỗi không xác định');
        }
        return data;
    } catch (err) {
        console.error('Lỗi API giỏ hàng:', err);
        // Hiển thị toast lỗi (nếu có)
        const toastEl = document.getElementById('toastError');
        if(toastEl) {
            const toastBody = toastEl.querySelector('.toast-body');
            toastBody.textContent = err.message;
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
        miniCartFooterSpan.textContent = `${cart.length} sản phẩm`;
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
                        <a class="mini-cart__name" href="/products/${item.slug}">
                            ${item.name}
                        </a>
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
    if (!data) return;

    // Cập nhật tóm tắt đơn hàng
    document.getElementById('summary-subtotal').textContent = formatCurrency(data.subtotal);
    document.getElementById('summary-shipping').textContent = formatCurrency(data.shippingFee);
    document.getElementById('summary-tax').textContent = formatCurrency(data.tax);
    document.getElementById('summary-total').textContent = formatCurrency(data.total);
    
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
                <div class="empty-cart-icon">
                    <i class="fa-solid fa-cart-shopping" style="font-size: 5rem; color: #cbd5e1;"></i>
                </div>
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
    // Lắng nghe sự kiện 'cart:updated' từ product-detail.js
    document.addEventListener('cart:updated', (e) => {
        const { cart, totalItems } = e.detail;
        updateMiniCart(cart, totalItems);
    });


    // --- 2. LOGIC TRANG GIỎ HÀNG (Chỉ chạy nếu ở /cart) ---
    const cartBody = document.getElementById('cart-body-items');
    if (!cartBody) {
        return; // Không phải trang giỏ hàng, dừng ở đây
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
                row.remove(); // Xóa hàng khỏi DOM
                updateCartPageView(data); // Cập nhật tóm tắt
                updateMiniCart(data.cart, data.totalItems); // Cập nhật mini-cart
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
            return; // Không làm gì
        }
        
        // Gọi API cập nhật
        const data = await sendCartRequest(`/api/cart/update/${sku}`, 'PATCH', { quantity: newQuantity });
        
        if (data) {
            if (newQuantity <= 0) {
                row.remove();
            } else {
                const updatedItem = data.cart.find(item => item.sku === sku);
                if(updatedItem) {
                    qtyInput.value = updatedItem.quantity;
                    row.querySelector('.cart-total').textContent = formatCurrency(updatedItem.price * updatedItem.quantity);
                }
            }
            // Cập nhật lại toàn bộ
            updateCartPageView(data);
            updateMiniCart(data.cart, data.totalItems);
        } else {
            // Nếu lỗi, trả lại giá trị cũ (vì API đã báo lỗi)
            // (Hiện tại API đã tự giới hạn số lượng, nên chỉ cần update)
            const currentItem = (await sendCartRequest('/api/cart/items', 'GET'))?.cart.find(item => item.sku === sku);
            if(currentItem) qtyInput.value = currentItem.quantity;
        }
    });

    // 3. Xóa toàn bộ giỏ hàng
    const btnClearAll = document.getElementById('btn-clear-all');
    if (btnClearAll) {
        btnClearAll.addEventListener('click', async () => {
            if (!confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) {
                return;
            }
            const data = await sendCartRequest('/api/cart/clear', 'DELETE');
            if (data) {
                updateCartPageView(data); // Sẽ tự hiển thị giỏ hàng trống
                updateMiniCart(data.cart, data.totalItems);
            }
        });
    }

    // 4. (Tạm thời) Xử lý Mã giảm giá
    const btnApplyDiscount = document.getElementById('btn-apply-discount');
    if (btnApplyDiscount) {
        btnApplyDiscount.addEventListener('click', () => {
            const code = document.getElementById('discount-input').value;
            const msgEl = document.getElementById('discount-message');
            if (code === '') {
                msgEl.textContent = 'Vui lòng nhập mã.';
            } else {
                msgEl.textContent = `Mã "${code}" không hợp lệ.`;
            }
        });
    }
});