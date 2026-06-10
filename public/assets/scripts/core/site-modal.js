/**
 * Blocks page interaction while any modal is open: inert siblings, scroll lock,
 * focus trap, and pointer blocking outside the active modal.
 */
(function initSiteModal() {
  /** @type {{ modal: HTMLElement, scrollContainer: string | null }[]} */
  const stack = [];
  let savedScrollY = 0;
  /** @type {((evt: KeyboardEvent) => void) | null} */
  let focusTrapHandler = null;
  /** @type {((evt: Event) => void) | null} */
  let scrollBlockHandler = null;
  /** @type {((evt: Event) => void) | null} */
  let pointerBlockHandler = null;

  function scrollToInstant(y) {
    const top = Math.max(0, Math.round(y));
    window.scrollTo({ top, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = top;
    document.body.scrollTop = top;
  }

  function getFocusableElements(container) {
    return [...container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )].filter((element) => element.offsetParent !== null || element === document.activeElement);
  }

  function releaseFocusTrap() {
    if (focusTrapHandler) {
      document.removeEventListener('keydown', focusTrapHandler);
      focusTrapHandler = null;
    }
  }

  function trapFocus(modal) {
    releaseFocusTrap();

    focusTrapHandler = (evt) => {
      if (evt.key !== 'Tab' || modal.hidden) {
        return;
      }

      const focusable = getFocusableElements(modal);
      if (focusable.length === 0) {
        evt.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (evt.shiftKey && document.activeElement === first) {
        evt.preventDefault();
        last.focus();
      } else if (!evt.shiftKey && document.activeElement === last) {
        evt.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', focusTrapHandler);
  }

  function releaseScrollBlock() {
    if (scrollBlockHandler) {
      document.removeEventListener('wheel', scrollBlockHandler);
      document.removeEventListener('touchmove', scrollBlockHandler);
      scrollBlockHandler = null;
    }
  }

  function blockScrollOutsideModal(modal, scrollContainerSelector) {
    releaseScrollBlock();

    scrollBlockHandler = (evt) => {
      if (modal.hidden) {
        return;
      }

      const scrollable = scrollContainerSelector
        ? modal.querySelector(scrollContainerSelector)
        : null;
      if (scrollable?.contains(evt.target)) {
        return;
      }

      evt.preventDefault();
    };

    document.addEventListener('wheel', scrollBlockHandler, { passive: false });
    document.addEventListener('touchmove', scrollBlockHandler, { passive: false });
  }

  function releasePointerBlock() {
    if (pointerBlockHandler) {
      document.removeEventListener('click', pointerBlockHandler, true);
      document.removeEventListener('mousedown', pointerBlockHandler, true);
      document.removeEventListener('touchstart', pointerBlockHandler, true);
      pointerBlockHandler = null;
    }
  }

  function blockPointerOutsideModal(modal) {
    releasePointerBlock();

    pointerBlockHandler = (evt) => {
      if (modal.hidden || modal.contains(evt.target)) {
        return;
      }

      evt.preventDefault();
      evt.stopPropagation();
    };

    document.addEventListener('click', pointerBlockHandler, true);
    document.addEventListener('mousedown', pointerBlockHandler, true);
    document.addEventListener('touchstart', pointerBlockHandler, { capture: true, passive: false });
  }

  function applyInert() {
    const openModals = new Set(stack.map((entry) => entry.modal));

    Array.from(document.body.children).forEach((child) => {
      if (!(child instanceof HTMLElement)) {
        return;
      }

      if (openModals.has(child)) {
        child.removeAttribute('inert');
      } else if (stack.length > 0) {
        child.setAttribute('inert', '');
      } else {
        child.removeAttribute('inert');
      }
    });
  }

  function applyLockState() {
    if (stack.length === 0) {
      document.documentElement.classList.remove('site-modal-open');
      document.body.classList.remove('site-modal-open');
      applyInert();
      releaseFocusTrap();
      releaseScrollBlock();
      releasePointerBlock();
      scrollToInstant(savedScrollY);
      return;
    }

    document.documentElement.classList.add('site-modal-open');
    document.body.classList.add('site-modal-open');
    applyInert();

    const { modal, scrollContainer } = stack[stack.length - 1];
    trapFocus(modal);
    blockScrollOutsideModal(modal, scrollContainer);
    blockPointerOutsideModal(modal);
  }

  /**
   * @param {HTMLElement} modal
   * @param {{ scrollContainer?: string }} [options]
   */
  function lock(modal, options = {}) {
    if (!modal || stack.some((entry) => entry.modal === modal)) {
      return;
    }

    if (stack.length === 0) {
      savedScrollY = window.scrollY;
    }

    stack.push({
      modal,
      scrollContainer: options.scrollContainer ?? null,
    });

    applyLockState();
  }

  /** @param {HTMLElement} modal */
  function unlock(modal) {
    const index = stack.findIndex((entry) => entry.modal === modal);
    if (index === -1) {
      return;
    }

    stack.splice(index, 1);
    applyLockState();
  }

  /** @param {HTMLElement} modal */
  function isOpen(modal) {
    return stack.some((entry) => entry.modal === modal);
  }

  window.MewModal = {
    lock,
    unlock,
    isOpen,
  };
})();
