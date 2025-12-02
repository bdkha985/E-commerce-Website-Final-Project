// public/javascripts/search.js

document.addEventListener("DOMContentLoaded", () => {
    const searchForm = document.getElementById("headerSearchForm");
    const searchInput = document.getElementById("headerSearchInput");
    const resultsBox = document.getElementById("search-suggestions");
    const fileInput = document.getElementById("headerSearchFile");

    if (!searchForm || !searchInput || !resultsBox) return;

    let debounceTimer;

    // ==========================================
    // 1. LOGIC LIVE SEARCH (TÌM BẰNG CHỮ)
    // ==========================================

    const toggleResults = (show) => {
        if (show) {
            resultsBox.classList.add("active");
            resultsBox.style.display = "block";
        } else {
            resultsBox.classList.remove("active");
            setTimeout(() => {
                if (!resultsBox.classList.contains("active")) {
                    resultsBox.style.display = "none";
                }
            }, 300);
        }
    };

    // Lắng nghe sự kiện gõ phím
    searchInput.addEventListener("input", (e) => {
        const query = e.target.value.trim();

        clearTimeout(debounceTimer);

        if (query.length < 2) {
            resultsBox.innerHTML = "";
            toggleResults(false);
            return;
        }

        debounceTimer = setTimeout(async () => {
            try {
                const res = await fetch(
                    `/api/search/suggest?q=${encodeURIComponent(query)}`
                );
                const data = await res.json();

                if (data.ok && data.products.length > 0) {
                    renderSuggestions(data.products);
                } else {
                    toggleResults(false);
                }
            } catch (err) {
                console.error("Lỗi Live Search:", err);
            }
        }, 300);
    });

    function renderSuggestions(products) {
        const html = products
            .map(
                (p) => `
            <a href="/products/${p.slug}" class="suggestion-item">
                <img src="${p.thumb || "https://placehold.co/50x50"}" alt="${
                    p.name
                }" class="suggestion-thumb">
                <div class="suggestion-info">
                    <span class="suggestion-name">${p.name}</span>
                    <span class="suggestion-price">${(
                        p.price || 0
                    ).toLocaleString("vi-VN")}đ</span>
                </div>
            </a>
        `
            )
            .join("");

        resultsBox.innerHTML = `<div class="suggestion-list">${html}</div>`;
        toggleResults(true);
    }

    document.addEventListener("click", (e) => {
        if (!searchForm.contains(e.target)) {
            toggleResults(false);
        }
    });

    searchInput.addEventListener("focus", () => {
        if (resultsBox.innerHTML.trim() !== "") {
            toggleResults(true);
        }
    });

    // ==========================================
    // 2. LOGIC IMAGE SEARCH (TÌM BẰNG ẢNH AI)
    // ==========================================

    if (fileInput) {
        fileInput.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const originalPlaceholder = searchInput.placeholder;
            searchInput.value = "";
            searchInput.placeholder = "AI đang phân tích ảnh...";
            searchInput.disabled = true;
            resultsBox.style.display = "none";

            try {
                const formData = new FormData();
                formData.append("image", file);

                const res = await fetch("/api/search/image", {
                    method: "POST",
                    body: formData,
                });

                const data = await res.json();

                if (data.ok && data.keywords) {
                    window.location.href = `/search?q=${encodeURIComponent(
                        data.keywords
                    )}`;
                } else {
                    alert(
                        "AI không nhận diện được sản phẩm trong ảnh này. Vui lòng thử ảnh khác."
                    );
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
        if (fileInput) fileInput.value = "";
    }
});
