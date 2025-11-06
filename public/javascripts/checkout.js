// public/javascripts/checkout.js
document.addEventListener('DOMContentLoaded', () => {
    
    // === DOM Elements ===
    const addressSelector = document.getElementById('addressSelector');
    const loyaltyCheckbox = document.getElementById('use-loyalty');
    const checkoutForm = document.getElementById('checkout-form');
    const placeOrderBtn = document.querySelector('.btn-place-order');

    // === DOM Elements (Summary Box) ===
    const summaryBox = document.getElementById('checkout-summary-box');
    const loyaltyRow = document.getElementById('loyalty-row');
    const loyaltyValueEl = document.getElementById('summary-loyalty');
    const totalValueEl = document.getElementById('summary-total');

    // === State (Đọc từ EJS) ===
    let baseTotal = 0;
    let pointsAvailable = 0;
    
    if (summaryBox) {
        baseTotal = parseFloat(summaryBox.dataset.total) || 0;
        pointsAvailable = parseFloat(summaryBox.dataset.pointsAvailable) || 0;
    }

    // === Helper ===
    const formatCurrency = (amount) => (amount || 0).toLocaleString('vi-VN') + 'đ';

    // === 1. LOGIC DROPDOWN ĐỊA CHỈ ===
    if (addressSelector) {
        const streetInput = document.getElementById('street');
        const wardInput = document.getElementById('ward');
        const cityInput = document.getElementById('city');
        addressSelector.addEventListener('change', (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            if (selectedOption.value === "") { streetInput.value = ""; wardInput.value = ""; cityInput.value = ""; return; }
            streetInput.value = selectedOption.dataset.street;
            wardInput.value = selectedOption.dataset.ward;
            cityInput.value = selectedOption.dataset.city;
        });
    }

    // === 2. (MỚI) LOGIC CHECKBOX ĐIỂM THƯỞNG ===
    function handleLoyaltyCheck() {
        if (!loyaltyCheckbox || !summaryBox) return;

        const usePoints = loyaltyCheckbox.checked;
        let pointsToUse = 0;
        let finalTotal = baseTotal;

        if (usePoints) {
            // Tính số điểm/tiền sẽ dùng (không vượt quá tổng tiền)
            pointsToUse = Math.min(pointsAvailable, baseTotal);
            finalTotal = baseTotal - pointsToUse;
            
            // Hiển thị
            loyaltyValueEl.textContent = `-${formatCurrency(pointsToUse)}`;
            loyaltyRow.style.display = 'flex';
        } else {
            // Ẩn
            loyaltyRow.style.display = 'none';
        }

        // Cập nhật lại tổng tiền cuối cùng
        totalValueEl.textContent = formatCurrency(finalTotal);
    }

    if (loyaltyCheckbox) {
        loyaltyCheckbox.addEventListener('change', handleLoyaltyCheck);
    }
    
    // === 3. LOGIC SUBMIT FORM CHECKOUT ===
    if (checkoutForm && placeOrderBtn) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            placeOrderBtn.disabled = true;
            placeOrderBtn.textContent = 'ĐANG XỬ LÝ...';

            const formData = new FormData(checkoutForm);
            const payload = Object.fromEntries(formData.entries());
            
            const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
            payload.paymentMethod = paymentMethod ? paymentMethod.value : 'COD';

            // Đọc trạng thái checkbox (ĐÃ ĐÚNG)
            const cb = document.getElementById('use-loyalty');
            payload.useLoyalty = !!(cb && cb.checked);

            try {
                const response = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || 'Lỗi không xác định');
                }

                if (data.type === 'VNPAY' && data.paymentUrl) {
                    window.location.href = data.paymentUrl;
                
                } else if (data.type === 'COD') {
                    const event = new CustomEvent('cart:updated', {
                        detail: { cart: [], totalItems: 0 }
                    });
                    document.dispatchEvent(event);
                    window.location.href = `/order/result/${data.orderCode}`; 
                } else {
                    throw new Error("Phản hồi từ server không hợp lệ");
                }

            } catch (err) {
                console.error('Lỗi khi đặt hàng:', err);
                const toastEl = document.getElementById('toastError');
                if(toastEl) {
                    const toastBody = toastEl.querySelector('.toast-body');
                    toastBody.textContent = err.message;
                    new bootstrap.Toast(toastEl).show();
                } else {
                    alert(`Lỗi: ${err.message}`);
                }
                placeOrderBtn.disabled = false;
                placeOrderBtn.textContent = 'ĐẶT HÀNG';
            }
        });
    }
});