document.addEventListener('DOMContentLoaded', function() {
    var header = document.querySelector('header');
    var logo = document.querySelector('.logo-header');
    
    // Check if the logo element exists on the current page
    if (logo) {
        // Get the height of the header and the logo
        var headerHeight = header.clientHeight;
        var logoHeight = logo.clientHeight;
    
        // When scrolling, add background color to the header and show the logo
        window.addEventListener('scroll', function() {
        if (window.pageYOffset > headerHeight) {
            header.classList.add('scrolled');
            logo.style.visibility = 'visible';
            logo.style.width = "auto";
        } else {
            header.classList.remove('scrolled');
            logo.style.visibility = 'hidden';
            logo.style.width = "0";
        }
        });
    } else {
        // If the logo is not present, only add the background color on scroll
        window.addEventListener('scroll', function() {
        if (window.pageYOffset > header.clientHeight) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        });
    }
});