/**
 * Inline banners and field errors for login/signup forms.
 */
(function initAuthFormFeedback() {
  function formatMessage(message) {
    if (window.MewMessage) {
      return MewMessage.format(message);
    }
    return String(message ?? '').trim();
  }

  function getBanner(form) {
    let el = form.querySelector('.auth-feedback');
    if (!el) {
      el = document.createElement('div');
      el.className = 'auth-feedback site-notice popup-box';
      el.setAttribute('role', 'alert');
      el.setAttribute('aria-live', 'polite');
      el.hidden = true;
      form.prepend(el);
    }
    return el;
  }

  function getSubmitButton(form) {
    return form.querySelector('.form-buttons button[type="submit"]');
  }

  function findFormGroup(form, fieldId) {
    const input = form.querySelector(`#${CSS.escape(fieldId)}`);
    return input?.closest('.form-group') || null;
  }

  function clearFieldError(form, fieldId) {
    const group = findFormGroup(form, fieldId);
    if (!group) {
      return;
    }
    group.classList.remove('is-invalid');
    const input = group.querySelector('input, select, textarea');
    if (input) {
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
    }
    group.querySelector('.field-error')?.remove();
  }

  function clearAllFieldErrors(form) {
    form.querySelectorAll('.form-group.is-invalid').forEach((group) => {
      group.classList.remove('is-invalid');
      const input = group.querySelector('input, select, textarea');
      if (input) {
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');
      }
      group.querySelector('.field-error')?.remove();
    });
  }

  window.AuthFormFeedback = {
    clear(form) {
      const banner = form.querySelector('.auth-feedback');
      if (banner) {
        banner.hidden = true;
        banner.textContent = '';
        banner.className = 'auth-feedback site-notice popup-box';
      }
      clearAllFieldErrors(form);
    },

    showBanner(form, type, message) {
      const banner = getBanner(form);
      banner.className = `auth-feedback site-notice popup-box site-notice--${type}`;
      banner.textContent = formatMessage(message);
      banner.hidden = false;
    },

    showFieldError(form, fieldId, message) {
      const group = findFormGroup(form, fieldId);
      if (!group) {
        return;
      }
      clearFieldError(form, fieldId);

      const input = group.querySelector('input, select, textarea');
      if (!input) {
        return;
      }

      const errorId = `${fieldId}-error`;
      const errorEl = document.createElement('p');
      errorEl.id = errorId;
      errorEl.className = 'field-error site-notice site-notice--error popup-box';
      errorEl.setAttribute('role', 'alert');
      errorEl.textContent = formatMessage(message);

      group.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', errorId);
      group.appendChild(errorEl);
      if (!form.querySelector('.auth-feedback:not([hidden])')) {
        input.focus();
      }
    },

    setLoading(form, isLoading, loadingLabel) {
      const button = getSubmitButton(form);
      if (!button) {
        return;
      }
      if (isLoading) {
        if (!button.dataset.defaultLabel) {
          button.dataset.defaultLabel = button.textContent.trim();
        }
        button.disabled = true;
        button.textContent = loadingLabel || 'Please wait…';
        button.setAttribute('aria-busy', 'true');
      } else {
        button.disabled = false;
        button.textContent = button.dataset.defaultLabel || button.textContent;
        button.removeAttribute('aria-busy');
      }
    },

    bindClearOnInput(form) {
      if (form.dataset.authFeedbackBound) {
        return;
      }
      form.dataset.authFeedbackBound = 'true';
      form.addEventListener('input', (e) => {
        const input = e.target;
        if (!(input instanceof HTMLInputElement) && !(input instanceof HTMLTextAreaElement)) {
          return;
        }
        if (input.id) {
          clearFieldError(form, input.id);
        }
        const banner = form.querySelector('.auth-feedback:not([hidden])');
        if (banner && !banner.classList.contains('site-notice--success')) {
          banner.hidden = true;
          banner.textContent = '';
          banner.className = 'auth-feedback site-notice popup-box';
        }
      });
    },
  };
})();
