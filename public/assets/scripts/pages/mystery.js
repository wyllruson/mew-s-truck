const MYSTERY_CLOSED_MESSAGE = 'the mystery shop is closed. come back next monday! 🔻';

document.addEventListener('DOMContentLoaded', () => {
  const buyButton = document.getElementById('buy-mystery-card');
  const popupBox = document.querySelector('.popup-box--hero');
  const mysteryCard = document.querySelector('.mystery-card');
  const confirmationModal = document.getElementById('mystery-confirmation');
  const confirmationPanel = confirmationModal?.querySelector('.mystery-confirmation__panel');
  const confirmationTitle = document.getElementById('mystery-confirmation-title');
  const confirmationMessage = document.getElementById('mystery-confirmation-message');
  const confirmationPrimary = document.getElementById('mystery-confirmation-primary');
  const confirmationSecondary = document.getElementById('mystery-confirmation-secondary');
  const closeConfirmationButtons = document.querySelectorAll('[data-close-mystery-confirmation]');

  const closeConfirmation = () => {
    if (confirmationModal) {
      confirmationModal.hidden = true;
      window.MewModal?.unlock(confirmationModal);
    }
  };

  const openConfirmation = ({
    title = 'Mystery Card Secured',
    message = 'Your mystery card was sent to cart and stays hidden until checkout. 🔻',
    primaryLabel = 'Go to Cart',
    primaryHref = '../cart/',
    secondaryLabel = 'Keep Browsing',
    isWarning = false,
  } = {}) => {
    if (confirmationTitle) {
      confirmationTitle.textContent = title;
    }
    if (confirmationMessage) {
      confirmationMessage.textContent = window.MewMessage
        ? MewMessage.format(message)
        : message;
    }
    if (confirmationPrimary) {
      confirmationPrimary.textContent = primaryLabel;
      confirmationPrimary.href = primaryHref;
    }
    if (confirmationSecondary) {
      confirmationSecondary.textContent = secondaryLabel;
    }
    if (confirmationPanel) {
      confirmationPanel.classList.toggle('is-warning', isWarning);
    }
    if (confirmationModal) {
      confirmationModal.hidden = false;
      window.MewModal?.lock(confirmationModal);
    }
  };

  closeConfirmationButtons.forEach((button) => {
    button.addEventListener('click', closeConfirmation);
  });

  const setShopClosedState = () => {
    if (popupBox) {
      popupBox.textContent = window.MewMessage
        ? MewMessage.format(MYSTERY_CLOSED_MESSAGE)
        : MYSTERY_CLOSED_MESSAGE;
    }
    if (mysteryCard) {
      mysteryCard.classList.add('is-closed');
    }
    if (buyButton) {
      buyButton.disabled = true;
      buyButton.textContent = 'Closed';
    }
  };

  const setShopOpenState = () => {
    if (popupBox) {
      const openMessage =
        'Welcome to the Mystery Shop! The shop resets every Monday. Buy a mystery card and test your luck!';
      popupBox.textContent = window.MewMessage ? MewMessage.format(openMessage) : `${openMessage} 🔻`;
    }
    if (mysteryCard) {
      mysteryCard.classList.remove('is-closed');
    }
    if (buyButton) {
      buyButton.disabled = false;
      buyButton.textContent = 'Purchase';
    }
  };

  const refreshMysteryShopState = async () => {
    try {
      const session = await MewApi.getSupabase().then((supabase) => supabase.auth.getSession());
      if (!session?.data?.session) {
        setShopOpenState();
        return;
      }

      const supabase = await MewApi.getSupabase();
      const { data: isOpen, error } = await supabase.rpc('is_mystery_shop_open');
      if (error) {
        throw error;
      }

      if (!isOpen) {
        setShopClosedState();
      } else {
        setShopOpenState();
      }
    } catch (error) {
      console.error('Error checking mystery shop state:', error);
      setShopOpenState();
    }
  };

  buyButton.addEventListener('click', async () => {
    const session = await MewApi.requireSession('Please log in to buy a mystery card.');
    if (!session) {
      return;
    }

    try {
      const supabase = await MewApi.getSupabase();
      const { error } = await supabase.rpc('buy_mystery_card');
      if (error) {
        if (String(error.message || '').includes('already have a mystery card waiting in cart')) {
          openConfirmation({
            title: 'Mystery Card Already Waiting',
            message: 'Your mystery card is already in cart. Check out first to reveal it in your recent purchases. 🔻',
            primaryLabel: 'View Cart',
            secondaryLabel: 'Back to Shop',
            isWarning: true,
          });
          return;
        }
        if (error.message && error.message.includes('closed')) {
          setShopClosedState();
        }
        throw error;
      }

      window.dispatchEvent(new CustomEvent('mew:cart-updated'));
      setShopOpenState();
      openConfirmation({});
    } catch (error) {
      console.error('Error purchasing mystery card:', error);
      await MewMessage.show(error?.message || 'An error occurred. Please try again.');
    }
  });

  refreshMysteryShopState();
});
