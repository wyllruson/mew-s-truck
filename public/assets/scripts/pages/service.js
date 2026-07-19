document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const faqList = document.getElementById('faq-list');
  const faqEmpty = document.getElementById('faq-empty');
  const contactForm = document.getElementById('contact-form');
  const faqItems = faqList.querySelectorAll('.faq-item');

  faqItems.forEach((item) => {
    const button = item.querySelector('.faq-item__question');
    const answer = item.querySelector('.faq-item__answer');

    button.addEventListener('click', () => {
      const isOpen = button.getAttribute('aria-expanded') === 'true';

      if (isOpen) {
        button.setAttribute('aria-expanded', 'false');
        answer.hidden = true;
        item.classList.remove('is-open');
        return;
      }

      faqItems.forEach((other) => {
        if (other === item) {
          return;
        }
        const otherButton = other.querySelector('.faq-item__question');
        const otherAnswer = other.querySelector('.faq-item__answer');
        otherButton.setAttribute('aria-expanded', 'false');
        otherAnswer.hidden = true;
        other.classList.remove('is-open');
      });

      button.setAttribute('aria-expanded', 'true');
      answer.hidden = false;
      item.classList.add('is-open');
      item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  });

  searchInput.addEventListener('input', function onSearch() {
    const query = this.value.trim().toLowerCase();
    let visibleCount = 0;

    faqItems.forEach((item) => {
      const question = item.querySelector('.faq-item__question');
      const answer = item.querySelector('.faq-item__answer');
      const text = `${question.textContent}${answer.textContent}`.toLowerCase();
      const matches = !query || text.includes(query);

      item.hidden = !matches;
      if (matches) {
        visibleCount += 1;
      }
    });

    faqEmpty.hidden = visibleCount > 0;
  });

  AuthFormFeedback.bindClearOnInput(contactForm);

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    AuthFormFeedback.clear(contactForm);

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const comments = document.getElementById('comments').value.trim();

    if (!name) {
      AuthFormFeedback.showFieldError(contactForm, 'name', 'Please enter your name.');
      return;
    }

    if (!email) {
      AuthFormFeedback.showFieldError(contactForm, 'email', 'Please enter your email address.');
      return;
    }

    if (!comments) {
      AuthFormFeedback.showFieldError(contactForm, 'comments', 'Please enter a message.');
      return;
    }

    AuthFormFeedback.setLoading(contactForm, true, 'Sending…');

    try {
      const supabase = await MewApi.getSupabase();
      const { error } = await supabase.from('contact_messages').insert({
        name,
        email,
        comments,
      });

      if (error) {
        AuthFormFeedback.showBanner(contactForm, 'error', 'Failed to send the message. Please try again.');
        return;
      }

      contactForm.reset();
      AuthFormFeedback.showBanner(contactForm, 'success', 'Message sent! We\'ll get back to you soon.');
    } catch (error) {
      console.error('Error:', error);
      AuthFormFeedback.showBanner(contactForm, 'error', 'An error occurred. Please try again.');
    } finally {
      AuthFormFeedback.setLoading(contactForm, false);
    }
  });

  function captureServiceState() {
    const openIndex = [...faqItems].findIndex((item) => item.classList.contains('is-open'));
    return {
      search: searchInput.value,
      openFaqIndex: openIndex >= 0 ? openIndex : null,
      contact: AuthFormFeedback.capture(contactForm),
    };
  }

  function restoreServiceState(state) {
    if (!state) {
      return;
    }
    searchInput.value = typeof state.search === 'string' ? state.search : '';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    faqItems.forEach((item, index) => {
      const isOpen = index === state.openFaqIndex && !item.hidden;
      item.classList.toggle('is-open', isOpen);
      const button = item.querySelector('.faq-item__question');
      const answer = item.querySelector('.faq-item__answer');
      button.setAttribute('aria-expanded', String(isOpen));
      answer.hidden = !isOpen;
    });
    AuthFormFeedback.restore(contactForm, state.contact);
  }

  window.MewNavigationState?.registerPage({
    key: 'service',
    capture: captureServiceState,
    restore: restoreServiceState,
    refresh: restoreServiceState,
  });
  void window.MewNavigationState?.restorePage?.();
});
