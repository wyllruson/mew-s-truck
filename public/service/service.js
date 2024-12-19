
document.getElementById('search-input').addEventListener('input', function () {
    const query = this.value.toLowerCase();
    const faqItems = document.querySelectorAll('#faq-list dt'); // Only target <dt> elements (questions)

    faqItems.forEach(item => {
        const answer = item.nextElementSibling; // Get the corresponding <dd> (answer)
        const text = item.textContent.toLowerCase() + answer.textContent.toLowerCase(); // Combine question and answer text

        if (text.includes(query)) {
            item.style.display = ''; // Show question
            answer.style.display = ''; // Show answer
        } else {
            item.style.display = 'none'; // Hide question
            answer.style.display = 'none'; // Hide answer
        }
    });
});


document.getElementById('contact-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        comments: document.getElementById('comments').value
    };

    try {
        const response = await fetch('/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            alert('Message sent successfully!');
            document.getElementById('contact-form').reset();
        } else {
            alert('Failed to send the message.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
});



    document.getElementById('contact-form').addEventListener('submit', async (e) => {
        e.preventDefault();
    
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            comments: document.getElementById('comments').value
        };
    
        try {
            const response = await fetch('/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
    
            if (response.ok) {
                alert('Message sent successfully!');
                document.getElementById('contact-form').reset();
            } else {
                alert('Failed to send the message.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        }
    });
