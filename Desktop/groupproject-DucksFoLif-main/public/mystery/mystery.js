document.getElementById("buyMysteryCard").addEventListener("click", async () => {
    try {
        const response = await fetch('/api/buy-mystery-card', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (response.ok) {
            alert(`Success! You bought ${result.order.card_name} for $${result.order.price}.`);
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error purchasing mystery card:', error);
        alert('An error occurred. Please try again.');
    }
    });
