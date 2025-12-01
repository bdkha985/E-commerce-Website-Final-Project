// public/javascripts/header.js
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.getElementById('navToggle');
    const pcNav = document.getElementById('pc-nav');
    const dropdowns = document.querySelectorAll('.dropdown');

    // 1. Toggle Menu Hamburger
    if (navToggle) {
        navToggle.addEventListener('click', function() {
            pcNav.classList.toggle('active');
            
            // Animation cho icon hamburger
            const spans = navToggle.querySelectorAll('span');
            if (pcNav.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translateY(14px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translateY(-14px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }

    // 2. Xử lý Dropdown trên Mobile (< 1500px)
    dropdowns.forEach(dropdown => {
        // Tìm thẻ <a> chính của dropdown (ví dụ: "Categories")
        // Sử dụng :scope > a để chỉ lấy con trực tiếp, tránh lấy nhầm link con
        const link = dropdown.querySelector(':scope > a'); 
        const menu = dropdown.querySelector('.dropdown-menu');

        if (link && menu) {
            link.addEventListener('click', function(e) {
                // Chỉ can thiệp ở chế độ mobile
                if (window.innerWidth <= 1500) {
                    e.preventDefault(); // Ngăn chuyển trang (quan trọng!)
                    e.stopPropagation(); // Ngăn sự kiện nổi bọt lên cha (tránh bị đóng menu)
                    
                    // Toggle class show để hiện/ẩn dropdown
                    menu.classList.toggle('show');
                    
                    // (Tùy chọn) Thêm class active cho link cha để đổi màu nếu muốn
                    link.classList.toggle('active-parent');
                }
            });
        }
    });

    // 3. Đóng menu khi nhấn vào các Link CHUYỂN TRANG
    // Chọn tất cả link trong nav
    const allLinks = document.querySelectorAll('#pc-nav a');
    
    allLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (window.innerWidth <= 1500) {
                // Kiểm tra: Nếu link này là nút mở Dropdown -> KHÔNG đóng menu
                // (Ta kiểm tra xem cha của nó có phải là .dropdown không, và nó có phải là link trực tiếp không)
                const parentDropdown = link.parentElement.classList.contains('dropdown');
                const hasSubmenu = link.nextElementSibling && link.nextElementSibling.classList.contains('dropdown-menu');

                if (parentDropdown && hasSubmenu) {
                    // Đây là nút mở dropdown (Categories) -> Không làm gì cả (logic mở đã xử lý ở bước 2)
                    return; 
                }

                // Nếu không phải nút dropdown (tức là link Home, Blog, hoặc link con trong dropdown) -> ĐÓNG MENU
                pcNav.classList.remove('active');
                
                // Reset icon hamburger về trạng thái đóng
                const spans = navToggle?.querySelectorAll('span');
                if (spans) {
                    spans[0].style.transform = 'none';
                    spans[1].style.opacity = '1';
                    spans[2].style.transform = 'none';
                }
            }
        });
    });

    // 4. Đóng menu khi click ra ngoài
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 1500) {
            // Nếu click không nằm trong navbar và không phải nút toggle
            if (!e.target.closest('.navbar') && !e.target.closest('.navbar__toggle')) {
                pcNav.classList.remove('active');
                
                // Reset icon
                const spans = navToggle?.querySelectorAll('span');
                if (spans) {
                    spans[0].style.transform = 'none';
                    spans[1].style.opacity = '1';
                    spans[2].style.transform = 'none';
                }
            }
        }
    });

    // 5. Reset khi resize màn hình (về Desktop)
    window.addEventListener('resize', function() {
        if (window.innerWidth > 1500) {
            pcNav.classList.remove('active');
            
            // Reset icon
            const spans = navToggle?.querySelectorAll('span');
            if (spans) {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
            
            // Ẩn tất cả dropdown đang mở
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });
});