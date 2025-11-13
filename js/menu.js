// Side Menu Toggle Functionality
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menuToggle');
    const sideMenu = document.getElementById('sideMenu');
    const contentWrapper = document.getElementById('contentWrapper');
    const overlay = document.getElementById('overlay');
    const dropdowns = document.querySelectorAll('.side-menu .has-dropdown');
    
    // Toggle menu
    menuToggle.addEventListener('click', function() {
        sideMenu.classList.toggle('active');
        contentWrapper.classList.toggle('shifted');
        overlay.classList.toggle('active');
        
        // Change toggle icon
        const icon = menuToggle.querySelector('i');
        if (sideMenu.classList.contains('active')) {
            icon.classList.remove('bi-list');
            icon.classList.add('bi-x');
        } else {
            icon.classList.remove('bi-x');
            icon.classList.add('bi-list');
        }
    });
    
    // Close menu when overlay is clicked
    overlay.addEventListener('click', function() {
        sideMenu.classList.remove('active');
        contentWrapper.classList.remove('shifted');
        overlay.classList.remove('active');
        const icon = menuToggle.querySelector('i');
        icon.classList.remove('bi-x');
        icon.classList.add('bi-list');
    });
    
    // Toggle dropdowns in side menu
    dropdowns.forEach(function(dropdown) {
        const link = dropdown.querySelector('a');
        link.addEventListener('click', function(e) {
            e.preventDefault();
            dropdown.classList.toggle('active');
            const subMenu = dropdown.querySelector('.sub-menu');
            if (subMenu.style.display === 'block') {
                subMenu.style.display = 'none';
            } else {
                subMenu.style.display = 'block';
            }
        });
    });
    
    // Close menu on window resize if in mobile view
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 768 && sideMenu.classList.contains('active')) {
            contentWrapper.classList.remove('shifted');
        } else if (window.innerWidth > 768 && sideMenu.classList.contains('active')) {
            contentWrapper.classList.add('shifted');
        }
    });
});
