document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('header');
    const brandingPlaceholder = document.getElementById('branding-placeholder');
    const logoImg = document.getElementById('my-logo');
    const headerPlaceholder = document.getElementById('header-placeholder');

    const logoOffsetTop = logoImg.clientHeight;
    let lastScrollY = 0;

    let CopiedLogo = logoImg.cloneNode(true);

    window.addEventListener('scroll', function() {
        const scrollY = window.scrollY;

        if (scrollY > logoOffsetTop) {
            header.classList.add('scrolled');

            // Move the logo dynamically into the header-placeholder div when scrolling down
            if (!headerPlaceholder.contains(CopiedLogo)) {
                headerPlaceholder.appendChild(CopiedLogo);
            }
            const logoVariable = CopiedLogo.getElementById('logo-variable');
            CopiedLogo.style.position = 'static';
            CopiedLogo.classList.add('logo-header');
            CopiedLogo.classList.remove('logo');
            logoVariable.setAttribute('fill', '#2980b9');
            
            headerPlaceholder.style.height = `${CopiedLogo.offsetHeight}px`;
        } else {
            header.classList.remove('scrolled');

            // Move the logo back to its original position when scrolling up
            CopiedLogo.remove(true);
        }

        lastScrollY = scrollY;
    });
});