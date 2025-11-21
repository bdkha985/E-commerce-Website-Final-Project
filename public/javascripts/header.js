// Hamburger Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.getElementById('navToggle');
    const pcNav = document.getElementById('pc-nav');
    const actions = document.querySelector('.actions');
    const dropdowns = document.querySelectorAll('.dropdown');

    // Toggle nav menu
    if (navToggle) {
        navToggle.addEventListener('click', function() {
            pcNav.classList.toggle('active');
            
            // Change hamburger icon animation
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

    // Handle dropdown menus in mobile
    dropdowns.forEach(dropdown => {
        const link = dropdown.querySelector('a');
        const menu = dropdown.querySelector('.dropdown-menu');

        link.addEventListener('click', function(e) {
            // Only prevent default on mobile/tablet
            if (window.innerWidth <= 1500) {
                e.preventDefault();
                menu.classList.toggle('show');
            }
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.navbar')) {
            pcNav.classList.remove('active');
            const spans = navToggle?.querySelectorAll('span');
            if (spans) {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        }
    });

    // Close mobile menu when a link is clicked
    const navLinks = document.querySelectorAll('#pc-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 1500) {
                pcNav.classList.remove('active');
                const spans = navToggle?.querySelectorAll('span');
                if (spans) {
                    spans[0].style.transform = 'none';
                    spans[1].style.opacity = '1';
                    spans[2].style.transform = 'none';
                }
            }
        });
    });

    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 1500) {
            pcNav.classList.remove('active');
            const spans = navToggle?.querySelectorAll('span');
            if (spans) {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
            // Reset dropdown menus
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });
});
