document.addEventListener("DOMContentLoaded", function() {
    // Hamburger menu toggle
    const hamburger = document.getElementById("hamburger");
    const menu = document.getElementById("menu");

    if (hamburger && menu) {
        hamburger.addEventListener("click", function() {
            menu.classList.toggle("active");
        });

        // Optional: Close menu when clicking outside
        document.addEventListener("click", function(event) {
            if (!menu.contains(event.target) && !hamburger.contains(event.target)) {
                menu.classList.remove("active");
            }
        });
    }

    // Set active menu item based on the current page
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const menuItems = document.querySelectorAll(".menu a");

    menuItems.forEach(item => {
        const itemHref = item.getAttribute("href").split("/").pop();
        if (itemHref === currentPage) {
            item.classList.add("active-menu");
        } else {
            item.classList.remove("active-menu");
        }
    });

    // Contact form submission handling
    const contactForm = document.getElementById("contactForm");
    if (contactForm) {
        contactForm.addEventListener("submit", function(event) {
            event.preventDefault(); // Prevent default form submission

            // Get form data
            const name = document.getElementById("name").value.trim();
            const email = document.getElementById("email").value.trim();
            const message = document.getElementById("message").value.trim();

            // Simple validation
            if (!name || !email || !message) {
                alert("Please fill out all fields.");
                return;
            }

            // Simulate form submission (replace with actual AJAX call if needed)
            console.log("Form submitted:", { name, email, message });
            alert("Thank you for your message! We'll get back to you soon.");

            // Clear the form
            contactForm.reset();
        });
    }
});