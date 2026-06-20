(function initSiteUtils() {
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
  }

  function formatMoney(amount) {
    return `$${Number(amount || 0).toFixed(2)}`;
  }

  function itemCountLabel(count, emptyLabel = 'No items yet') {
    if (count === 0) {
      return emptyLabel;
    }
    if (count === 1) {
      return '1 item';
    }
    return `${count} items`;
  }

  window.MewUtils = {
    escapeHtml,
    formatMoney,
    itemCountLabel,
  };
})();
