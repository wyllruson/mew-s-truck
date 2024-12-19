document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch the login status and username
        const response = await fetch('/is-logged-in');
        const data = await response.json();

        const accountLink = document.getElementById('login-link');
        const icon = accountLink.querySelector('i'); // Preserve the icon
        const span = accountLink.querySelector('span') || document.createElement('span'); // Select or create span for text content

        if (data.loggedIn) {
            // Update link for logged-in users
            accountLink.href = '/account'; // Redirect to account page
            span.textContent = `${data.username}`; // Show username
        } else {
            // Update link for guests
            accountLink.href = '/account/login.html'; // Redirect to login page
            span.textContent = 'Login';
        }

        // Ensure the span is part of the link
        if (!accountLink.contains(span)) {
            accountLink.appendChild(span);
        }

        // Preserve the icon by appending it at the start if it's missing
        if (icon && !accountLink.contains(icon)) {
            accountLink.insertBefore(icon, span);
        }
    } catch (error) {
        console.error('Error checking login status:', error);
    }
});
