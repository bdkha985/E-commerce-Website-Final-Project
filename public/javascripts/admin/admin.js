document.addEventListener("DOMContentLoaded", () => {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll(".admin-nav .nav-link");

    let linkFound = false;

    navLinks.forEach((link) => {
        const href = link.getAttribute("href");

        if (href === "/admin" && currentPath === "/admin") {
            link.classList.add("active");
            linkFound = true;
        } else if (href !== "/admin" && currentPath.startsWith(href)) {
            link.classList.add("active");
            linkFound = true;
        }
    });
});
