document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const contactForm = document.getElementById('contact-form');

  searchInput.addEventListener('input', function onSearch() {
    const query = this.value.toLowerCase();
    const faqItems = document.querySelectorAll('#faq-list dt');

    faqItems.forEach((item) => {
      const answer = item.nextElementSibling;
      const text = `${item.textContent}${answer.textContent}`.toLowerCase();

      const display = text.includes(query) ? '' : 'none';
      item.style.display = display;
      answer.style.display = display;
    });
  });

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      comments: document.getElementById('comments').value,
    };

    try {
      const supabase = await MewApi.getSupabase();
      const { error } = await supabase.from('contact_messages').insert(formData);

      if (error) {
        alert('Failed to send the message.');
        return;
      }

      alert('Message sent successfully!');
      contactForm.reset();
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    }
  });
});
