function createQtyStepper({ quantity, maxQuantity, ariaLabel, onChange, onSettled }) {
  const root = document.createElement('div');
  root.className = 'qty-stepper';

  const decBtn = document.createElement('button');
  decBtn.type = 'button';
  decBtn.className = 'qty-stepper__btn qty-stepper__btn--dec';
  decBtn.setAttribute('aria-label', `Decrease quantity of ${ariaLabel}`);

  const decIcon = document.createElement('i');
  decIcon.className = 'fa-solid fa-minus';
  decIcon.setAttribute('aria-hidden', 'true');
  decBtn.appendChild(decIcon);

  const valueEl = document.createElement('input');
  valueEl.type = 'number';
  valueEl.className = 'qty-stepper__value';
  valueEl.value = String(quantity);
  valueEl.min = '0';
  valueEl.step = '1';
  valueEl.inputMode = 'numeric';
  valueEl.setAttribute('aria-label', `Quantity of ${ariaLabel}`);

  const incBtn = document.createElement('button');
  incBtn.type = 'button';
  incBtn.className = 'qty-stepper__btn qty-stepper__btn--inc';
  incBtn.setAttribute('aria-label', `Increase quantity of ${ariaLabel}`);

  const incIcon = document.createElement('i');
  incIcon.className = 'fa-solid fa-plus';
  incIcon.setAttribute('aria-hidden', 'true');
  incBtn.appendChild(incIcon);

  let currentQuantity = Number(quantity) || 0;
  let committedQuantity = currentQuantity;
  let pendingDelta = 0;
  let busy = false;
  let editing = false;
  let maxQty = maxQuantity;
  if (maxQty != null) {
    valueEl.max = String(maxQty);
  }

  function clampQuantity(nextQuantity) {
    const min = 0;
    const max = maxQty == null ? Infinity : maxQty;
    return Math.min(max, Math.max(min, nextQuantity));
  }

  function updateButtonState() {
    decBtn.disabled = currentQuantity <= 0;
    incBtn.disabled = maxQty != null && currentQuantity >= maxQty;
    root.classList.toggle('qty-stepper--busy', busy);
    root.setAttribute('aria-busy', busy ? 'true' : 'false');
  }

  function renderQuantity(nextQuantity) {
    currentQuantity = clampQuantity(nextQuantity);
    valueEl.value = String(currentQuantity);
    updateButtonState();
  }

  async function flushPendingChanges() {
    if (busy) {
      return;
    }

    busy = true;
    updateButtonState();

    try {
      while (pendingDelta !== 0) {
        const delta = pendingDelta;
        pendingDelta = 0;
        const newQuantity = await onChange(delta);
        if (typeof newQuantity === 'number') {
          committedQuantity = clampQuantity(newQuantity);
          if (pendingDelta === 0) {
            renderQuantity(committedQuantity);
          } else {
            renderQuantity(committedQuantity + pendingDelta);
          }
        }
      }
    } catch (error) {
      pendingDelta = 0;
      renderQuantity(committedQuantity);
      console.error('Error updating quantity:', error);
    } finally {
      busy = false;
      updateButtonState();
      onSettled?.(committedQuantity);
    }
  }

  function apply(delta) {
    const nextQuantity = clampQuantity(currentQuantity + delta);
    const appliedDelta = nextQuantity - currentQuantity;
    if (appliedDelta === 0) {
      return;
    }

    pendingDelta += appliedDelta;
    renderQuantity(nextQuantity);
    void flushPendingChanges();
  }

  function commitInputQuantity() {
    editing = false;
    const rawQuantity = Number.parseInt(valueEl.value, 10);

    if (!Number.isFinite(rawQuantity)) {
      renderQuantity(currentQuantity);
      return;
    }

    const nextQuantity = clampQuantity(rawQuantity);
    const appliedDelta = nextQuantity - currentQuantity;
    if (appliedDelta === 0) {
      renderQuantity(nextQuantity);
      return;
    }

    pendingDelta += appliedDelta;
    renderQuantity(nextQuantity);
    void flushPendingChanges();
  }

  decBtn.addEventListener('click', () => {
    apply(-1);
  });
  incBtn.addEventListener('click', () => {
    apply(1);
  });
  valueEl.addEventListener('focus', () => {
    editing = true;
    valueEl.select();
  });
  valueEl.addEventListener('blur', commitInputQuantity);
  valueEl.addEventListener('keydown', (evt) => {
    if (evt.key === 'Enter') {
      evt.preventDefault();
      valueEl.blur();
    } else if (evt.key === 'Escape') {
      evt.preventDefault();
      editing = false;
      renderQuantity(currentQuantity);
      valueEl.blur();
    } else if (!evt.metaKey && !evt.ctrlKey && ['e', 'E', '+', '-', '.'].includes(evt.key)) {
      evt.preventDefault();
    }
  });
  valueEl.addEventListener('input', () => {
    const rawQuantity = Number.parseInt(valueEl.value, 10);
    if (Number.isFinite(rawQuantity) && maxQty != null && rawQuantity > maxQty) {
      valueEl.value = String(maxQty);
    }
  });

  root.setQuantity = (nextQuantity) => {
    if (busy || pendingDelta !== 0) {
      return;
    }
    if (editing) {
      return;
    }

    pendingDelta = 0;
    committedQuantity = clampQuantity(nextQuantity);
    renderQuantity(committedQuantity);
  };

  root.setMaxQuantity = (nextMax) => {
    maxQty = nextMax;
    if (maxQty == null) {
      valueEl.removeAttribute('max');
    } else {
      valueEl.max = String(maxQty);
    }
    committedQuantity = clampQuantity(committedQuantity);
    renderQuantity(currentQuantity);
  };

  root.isBusy = () => busy || pendingDelta !== 0 || editing;

  updateButtonState();
  root.append(decBtn, valueEl, incBtn);
  return root;
}

window.MewQtyStepper = {
  create: createQtyStepper,
};
