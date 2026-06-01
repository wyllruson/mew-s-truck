document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('buyMysteryCard').addEventListener('click', async () => {
    const session = await MewApi.requireSession('Please log in to buy a mystery card.');
    if (!session) {
      return;
    }

    try {
      const supabase = await MewApi.getSupabase();
      const { data, error } = await supabase.rpc('buy_mystery_card');

      if (error) {
        alert(`Error: ${error.message}`);
        return;
      }

      alert(`Success! You bought ${data.order.card_name} for $${data.order.price}.`);
    } catch (error) {
      console.error('Error purchasing mystery card:', error);
      alert('An error occurred. Please try again.');
    }
  });
});
