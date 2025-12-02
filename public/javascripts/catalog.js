// public/javascripts/catalog.js

(function () {
    const f = document.getElementById("catFilter");
    if (!f) return;
})();

window.quickAddToCart = async function (event, btn, productId, sku) {
    if (event && typeof event.preventDefault === "function") {
        event.preventDefault();
        event.stopPropagation();
    }

    if (!btn && event && event.currentTarget) btn = event.currentTarget;

    const originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';

    try {
        const response = await fetch("/api/cart/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
            },
            body: JSON.stringify({
                productId: productId,
                sku: sku,
                quantity: 1,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            const ev = new CustomEvent("cart:updated", {
                detail: {
                    cart: data.cart,
                    totalItems: data.totalItems,
                },
            });
            document.dispatchEvent(ev);

            btn.innerHTML =
                '<i class="fa-solid fa-check" style="color: #4ade80"></i>';

            const liveToast = document.getElementById("liveToast");
            const toastMsg = document.getElementById("liveToastMsg");
            if (liveToast && toastMsg && window.bootstrap) {
                liveToast.className =
                    "toast align-items-center text-bg-success border-0";
                toastMsg.textContent = "Đã thêm vào giỏ hàng!";
                new bootstrap.Toast(liveToast).show();
            }

            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }, 2000);
        } else {
            const liveToast = document.getElementById("liveToast");
            const toastMsg = document.getElementById("liveToastMsg");
            if (liveToast && toastMsg && window.bootstrap) {
                liveToast.className =
                    "toast align-items-center text-bg-danger border-0";
                toastMsg.textContent = data.message || "Có lỗi xảy ra";
                new bootstrap.Toast(liveToast).show();
            } else {
                alert(data.message || "Có lỗi xảy ra");
            }

            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }
    } catch (err) {
        console.error("quickAddToCart error:", err);
        alert("Lỗi kết nối. Vui lòng thử lại.");
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
};
