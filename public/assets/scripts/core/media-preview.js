(function initMediaPreview() {
  function setPreviewMedia({
    img,
    mysteryFace,
    hiddenClass,
    isMystery,
    imageSrc,
    label,
  }) {
    if (!img) {
      return false;
    }

    if (isMystery && mysteryFace) {
      img.classList.add(hiddenClass);
      mysteryFace.classList.remove(hiddenClass);
      mysteryFace.setAttribute('aria-label', label);
      return true;
    }

    if (mysteryFace) {
      mysteryFace.classList.add(hiddenClass);
    }
    img.classList.remove(hiddenClass);
    img.src = imageSrc;
    img.alt = label;
    return true;
  }

  function createMediaPreview({
    modalId,
    imageId,
    mysteryId = null,
    closeId,
    dismissSelector,
    hiddenClass = 'is-preview-hidden',
    lockOptions,
    onOpen,
    onClose,
  }) {
    let returnFocus = null;
    let bound = false;

    function getParts() {
      const modal = document.getElementById(modalId);
      return {
        modal,
        closeBtn: closeId ? document.getElementById(closeId) : null,
        backdrop: modal?.querySelector(dismissSelector) || null,
        img: document.getElementById(imageId),
        mysteryFace: mysteryId ? document.getElementById(mysteryId) : null,
      };
    }

    function close() {
      const { modal } = getParts();
      if (!modal || modal.hidden) {
        return;
      }

      modal.hidden = true;
      window.MewModal?.unlock(modal);
      onClose?.();

      if (returnFocus) {
        returnFocus.focus({ preventScroll: true });
        returnFocus = null;
      }
    }

    function open({
      imageSrc,
      label,
      triggerEl,
      isMystery = false,
    }) {
      const { modal, img, mysteryFace, closeBtn } = getParts();
      if (!modal || !setPreviewMedia({
        img,
        mysteryFace,
        hiddenClass,
        isMystery,
        imageSrc,
        label,
      })) {
        return;
      }

      returnFocus = triggerEl || null;
      modal.hidden = false;
      window.MewModal?.lock(modal, lockOptions);
      closeBtn?.focus();
      onOpen?.();
    }

    function bind() {
      if (bound) {
        return;
      }

      const { modal, closeBtn, backdrop, img } = getParts();
      if (!modal || !closeBtn || !backdrop || !img) {
        return;
      }

      bound = true;
      closeBtn.addEventListener('click', close);
      backdrop.addEventListener('click', close);

      modal.addEventListener('click', (evt) => {
        evt.stopPropagation();
      });

      img.addEventListener('error', function onPreviewImageError() {
        this.src = mewPath(MEW_PATHS.placeholder);
      });

      document.addEventListener('keydown', (evt) => {
        if (evt.key !== 'Escape' || modal.hidden) {
          return;
        }
        close();
      });
    }

    return {
      bind,
      open,
      close,
    };
  }

  window.MewMediaPreview = {
    create: createMediaPreview,
  };
})();
