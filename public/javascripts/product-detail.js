// public/javascripts/product-detail.js
document.addEventListener('DOMContentLoaded', () => {
    // === DOM Elements (Đưa ra phạm vi chung) ===
    const gallery = document.querySelector('.pd-gallery');
    if (!gallery) return; // Thoát nếu không phải trang product-detail

    const mainImg = document.getElementById('pdMainImg');
    const thumbItems = Array.from(gallery.querySelectorAll('.pd-thumb-item')); 
    const btnSlidePrev = document.getElementById('pdSlidePrev');
    const btnSlideNext = document.getElementById('pdSlideNext');

    const priceEl = document.getElementById('pdPrice');
    const skuEl = document.getElementById('pdSku');
    const btnAddToCart = document.getElementById('btnAddToCart');
    
    const variantsEl = document.querySelector('.pd-variants');
    const colorGroup = document.getElementById('group-color');
    const sizeGroup = document.getElementById('group-size');
    const colorChips = colorGroup ? Array.from(colorGroup.querySelectorAll('.variant-chip')) : [];
    const sizeChips = sizeGroup ? Array.from(sizeGroup.querySelectorAll('.variant-chip')) : [];
    const colorText = document.getElementById('selectedColorText');
    const sizeText = document.getElementById('selectedSizeText');

    // Dữ liệu
    const variants = variantsEl ? JSON.parse(variantsEl.dataset.variants) : [];
    const productId = variantsEl ? variantsEl.dataset.productId : null;

    // === State (Đưa ra phạm vi chung) ===
    let currentImageIndex = 0;
    const allImages = thumbItems.map(img => img.src); 

    let selectedColor = colorChips.length === 1 ? colorChips[0].dataset.value : null;
    let selectedSize = sizeChips.length === 1 ? sizeChips[0].dataset.value : null;
    let selectedVariant = null;
    let isLoading = false;

    // === Functions (Đưa ra phạm vi chung) ===

    // 1. Hiển thị Ảnh theo Index
    function showImageByIndex(index) {
        if (allImages.length === 0) return;
        if (index < 0) index = allImages.length - 1;
        else if (index >= allImages.length) index = 0;

        currentImageIndex = index;
        if (mainImg) mainImg.src = allImages[currentImageIndex];
        thumbItems.forEach((t, i) => t.classList.toggle('active', i === currentImageIndex));
    }

    // 2. Chọn Variant (Color/Size)
    function selectVariant(el) {
        const type = el.dataset.variantType;
        const value = el.dataset.value;
        let isDeselecting = el.classList.contains('active');
        let chips, textEl;

        if (type === 'color') {
            chips = colorChips; textEl = colorText;
            selectedColor = isDeselecting ? null : value;
        } else {
            chips = sizeChips; textEl = sizeText;
            selectedSize = isDeselecting ? null : value;
        }

        chips.forEach(c => c.classList.remove('active'));
        if (!isDeselecting) el.classList.add('active');
        if (textEl) textEl.textContent = isDeselecting ? '' : value;
        
        updateAvailability();
        findMatchingVariant();
    }

    // 3. Cập nhật các lựa chọn khả dụng
    function updateAvailability() {
        if (!variantsEl) return;
        if (colorGroup && sizeGroup) {
            const availableSizes = new Set(variants.filter(v => (selectedColor ? v.color === selectedColor : true) && v.stock > 0).map(v => v.size));
            const availableColors = new Set(variants.filter(v => (selectedSize ? v.size === selectedSize : true) && v.stock > 0).map(v => v.color));
            sizeChips.forEach(c => c.classList.toggle('disabled', !availableSizes.has(c.dataset.value)));
            colorChips.forEach(c => c.classList.toggle('disabled', !availableColors.has(c.dataset.value)));
        } else if (colorGroup) {
            colorChips.forEach(chip => {
                const v = variants.find(v => v.color === chip.dataset.value);
                chip.classList.toggle('disabled', !v || v.stock === 0);
            });
        } else if (sizeGroup) {
            sizeChips.forEach(chip => {
                const v = variants.find(v => v.size === chip.dataset.value);
                chip.classList.toggle('disabled', !v || v.stock === 0);
            });
        }
    }

    // 4. Tìm variant khớp
    function findMatchingVariant() {
        if (!variantsEl) {
            if (btnAddToCart) btnAddToCart.disabled = false;
            return;
        }
        const allOptionsSelected = (!colorGroup || selectedColor) && (!sizeGroup || selectedSize);
        if (!allOptionsSelected) {
            selectedVariant = null;
            if(btnAddToCart) {
                btnAddToCart.disabled = true;
                btnAddToCart.innerHTML = '<i class="fa-solid fa-cart-plus"></i> Chọn biến thể';
            }
            return;
        }
        selectedVariant = variants.find(v => {
            const colorMatch = !colorGroup || v.color === selectedColor;
            const sizeMatch = !sizeGroup || v.size === selectedSize;
            return colorMatch && sizeMatch;
        });
        if (selectedVariant) {
            if (priceEl) priceEl.textContent = (selectedVariant.price || 0).toLocaleString('vi-VN') + 'đ';
            if (skuEl) skuEl.textContent = selectedVariant.sku || 'N/A';
            if (mainImg && selectedVariant.images && selectedVariant.images.length > 0) {
                const variantImgIndex = allImages.indexOf(selectedVariant.images[0]);
                if (variantImgIndex > -1) showImageByIndex(variantImgIndex);
                else mainImg.src = selectedVariant.images[0];
            }
            if (btnAddToCart) {
                if (selectedVariant.stock > 0) {
                    btnAddToCart.disabled = false;
                    btnAddToCart.innerHTML = '<i class="fa-solid fa-cart-plus"></i> Thêm vào giỏ hàng';
                } else {
                    btnAddToCart.disabled = true;
                    btnAddToCart.innerHTML = 'Hết hàng';
                }
            }
        } else {
            if (btnAddToCart) {
                btnAddToCart.disabled = true;
                btnAddToCart.innerHTML = 'Không khả dụng';
            }
        }
    }

    // 5. Xử lý "Thêm vào giỏ hàng"
    async function handleAddToCart() {
        if (isLoading || !btnAddToCart || btnAddToCart.disabled) return;
        if (variantsEl && !selectedVariant) {
            alert("Vui lòng chọn đầy đủ phân loại sản phẩm.");
            return;
        }

        isLoading = true;
        btnAddToCart.disabled = true;
        btnAddToCart.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang thêm...';

        try {
            const payload = {
                productId: productId,
                sku: selectedVariant ? selectedVariant.sku : (variants[0]?.sku || 'default'),
                quantity: 1 
            };
            
            if (!payload.productId) throw new Error("Không tìm thấy Product ID");

            const response = await fetch('/api/cart/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Lỗi không xác định');

            // === GỬI SỰ KIỆN CHO cart.js ===
            const event = new CustomEvent('cart:updated', {
                detail: {
                    cart: data.cart,
                    totalItems: data.totalItems
                }
            });
            document.dispatchEvent(event);
            // === KẾT THÚC GỬI SỰ KIỆN ===

            // Hiển thị toast (nếu dùng Bootstrap)
            const liveToast = document.getElementById('liveToast');
            const toastMsg = document.getElementById('liveToastMsg');
            
            if (liveToast && toastMsg && window.bootstrap) {
                // Cập nhật nội dung và màu sắc (Xanh cho thành công)
                liveToast.className = 'toast align-items-center text-bg-success border-0';
                toastMsg.textContent = data.message || "Thêm vào giỏ thành công!";
                
                // Hiển thị
                const toast = new bootstrap.Toast(liveToast);
                toast.show();
            }

        } catch (err) {
            console.error('Lỗi khi thêm vào giỏ:', err);
            
            const liveToast = document.getElementById('liveToast');
            const toastMsg = document.getElementById('liveToastMsg');
            
            if (liveToast && toastMsg && window.bootstrap) {
                // Đổi màu đỏ cho lỗi
                liveToast.className = 'toast align-items-center text-bg-danger border-0';
                toastMsg.textContent = err.message;
                new bootstrap.Toast(liveToast).show();
            } else {
                alert(`Lỗi: ${err.message}`);
            }
        } finally {
            isLoading = false;
            findMatchingVariant(); 
        }
    }

    // === Gán Event Listeners ===
    thumbItems.forEach((item, index) => item.addEventListener('click', () => showImageByIndex(index)));
    if (btnSlidePrev) btnSlidePrev.addEventListener('click', () => showImageByIndex(currentImageIndex - 1));
    if (btnSlideNext) btnSlideNext.addEventListener('click', () => showImageByIndex(currentImageIndex + 1));
    colorChips.forEach(chip => chip.addEventListener('click', () => selectVariant(chip)));
    sizeChips.forEach(chip => chip.addEventListener('click', () => selectVariant(chip)));
    if (btnAddToCart) btnAddToCart.addEventListener('click', handleAddToCart);
    
    // === Khởi chạy ===
    if (colorChips.length === 1) selectVariant(colorChips[0]);
    if (sizeChips.length === 1) selectVariant(sizeChips[0]);
    updateAvailability();
    findMatchingVariant();
});