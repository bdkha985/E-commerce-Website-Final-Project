document.addEventListener("DOMContentLoaded", () => {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll(".admin-nav .nav-link");

    let linkFound = false;

    navLinks.forEach((link) => {
        const href = link.getAttribute("href");

        // Xử lý trường hợp đặc biệt (Dashboard)
        if (href === "/admin" && currentPath === "/admin") {
            link.classList.add("active");
            linkFound = true;
        }
        // Xử lý các trang con (ví dụ: /admin/orders)
        // Đảm bảo href !== '/admin' để nó không khớp với mọi trang con
        else if (href !== "/admin" && currentPath.startsWith(href)) {
            link.classList.add("active");
            linkFound = true;
        }
    });
});
