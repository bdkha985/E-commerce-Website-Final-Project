(() => {
    const loader = () => document.getElementById("app-loader");
    const show = () => loader() && loader().classList.add("active");
    const hide = () => loader() && loader().classList.remove("active");

    window.addEventListener("DOMContentLoaded", hide);
    window.addEventListener("load", hide);

    document.addEventListener(
        "click",
        (e) => {
            const a = e.target.closest("a");
            if (!a) return;

            const href = a.getAttribute("href");
            const target = a.getAttribute("target");

            if (!href || href.startsWith("#") || href.startsWith("javascript:"))
                return;
            if (target === "_blank" || a.hasAttribute("download")) return;

            try {
                const url = new URL(href, location.href);
                if (url.origin === location.origin) {
                    show();
                }
            } catch {}
        },
        true
    );

    // document.addEventListener('submit', (e) => {
    //   show();
    // }, true);

    document.addEventListener(
        "submit",
        (e) => {
            const form = e.target;
            // Form AJAX sẽ gắn data-ajax => KHÔNG bật loader
            if (form && form.hasAttribute("data-ajax")) return;
            show();
        },
        true
    );

    window.addEventListener("pageshow", (e) => {
        if (e.persisted) hide();
    });

    window.addEventListener("beforeunload", show);
})();

document.addEventListener("DOMContentLoaded", () => {
    const cartHover = document.querySelector(".cart-hover");
    const miniCart = document.querySelector(".mini-cart");
    let hideTimer;

    if (cartHover && miniCart) {
        cartHover.addEventListener("mouseenter", () => {
            clearTimeout(hideTimer);
            miniCart.style.display = "block";
        });

        cartHover.addEventListener("mouseleave", () => {
            hideTimer = setTimeout(() => {
                miniCart.style.display = "none";
            }, 300);
        });

        miniCart.addEventListener("mouseenter", () => {
            clearTimeout(hideTimer);
        });

        miniCart.addEventListener("mouseleave", () => {
            hideTimer = setTimeout(() => {
                miniCart.style.display = "none";
            }, 300);
        });
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const s = document.getElementById("toastSuccess");
    const e = document.getElementById("toastError");
    if (s) new bootstrap.Toast(s, { delay: 3000 }).show();
    if (e) new bootstrap.Toast(e, { delay: 4000 }).show();
});

window.addEventListener("scroll", () => {
    const header = document.querySelector(".fixed-header");
    if (window.scrollY > 50) {
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }
});
