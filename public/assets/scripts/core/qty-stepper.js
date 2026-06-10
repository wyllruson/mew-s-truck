function createQtyStepper({ quantity, maxQuantity, ariaLabel, onChange }) {
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

  const valueEl = document.createElement('span');
  valueEl.className = 'qty-stepper__value';
  valueEl.textContent = String(quantity);
  valueEl.setAttribute('aria-live', 'polite');

  const incBtn = document.createElement('button');
  incBtn.type = 'button';
  incBtn.className = 'qty-stepper__btn qty-stepper__btn--inc';
  incBtn.setAttribute('aria-label', `Increase quantity of ${ariaLabel}`);

  const incIcon = document.createElement('i');
  incIcon.className = 'fa-solid fa-plus';
  incIcon.setAttribute('aria-hidden', 'true');
  incBtn.appendChild(incIcon);

  let busy = false;
  let maxQty = maxQuantity;

  function updateButtonState(currentQuantity) {
    decBtn.disabled = busy || currentQuantity <= 0;
    incBtn.disabled = busy || (maxQty != null && currentQuantity >= maxQty);
    root.classList.toggle('qty-stepper--busy', busy);
    root.setAttribute('aria-busy', busy ? 'true' : 'false');
  }

  async function apply(delta) {
    if (busy) {
      return null;
    }

    busy = true;
    updateButtonState(Number(valueEl.textContent) || 0);

    try {
      const newQuantity = await onChange(delta);
      if (typeof newQuantity === 'number') {
        valueEl.textContent = String(newQuantity);
        updateButtonState(newQuantity);
      }
      return newQuantity;
    } finally {
      busy = false;
      updateButtonState(Number(valueEl.textContent) || 0);
    }
  }

  decBtn.addEventListener('click', () => {
    apply(-1);
  });
  incBtn.addEventListener('click', () => {
    apply(1);
  });

  root.setQuantity = (nextQuantity) => {
    valueEl.textContent = String(nextQuantity);
    updateButtonState(nextQuantity);
  };

  root.setMaxQuantity = (nextMax) => {
    maxQty = nextMax;
    updateButtonState(Number(valueEl.textContent) || 0);
  };

  updateButtonState(quantity);
  root.append(decBtn, valueEl, incBtn);
  return root;
}

window.MewQtyStepper = {
  create: createQtyStepper,
};
