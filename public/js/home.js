let allProducts = [];

function toggleCheckboxArea(onlyHide = false) {
  const options = document.getElementById('mySelectOptions');
  const selectBox = document.querySelector('.selectBox');
  const isOpen = options.style.display === 'block';

  if (onlyHide && !isOpen) {
    return;
  }

  options.style.display = isOpen ? 'none' : 'block';
  selectBox.classList.toggle('open', !isOpen);
}

function applyFilters() {
  const checkboxes = document.querySelectorAll('#mySelectOptions input[type="checkbox"]');
  let activeSortFilter = null;
  let activeLabel = 'Nothing is selected';

  checkboxes.forEach((checkbox) => {
    if (checkbox.checked && checkbox.getAttribute('data-group') === 'sort') {
      activeSortFilter = checkbox.value;
      activeLabel = checkbox.parentElement.textContent.trim();
    }
  });

  document.getElementById('selectedFilterText').textContent = activeLabel;

  let sortedProducts = [...allProducts];

  if (activeSortFilter === 'name-asc') {
    sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
  } else if (activeSortFilter === 'name-desc') {
    sortedProducts.sort((a, b) => b.name.localeCompare(a.name));
  } else if (activeSortFilter === 'price-asc') {
    sortedProducts.sort((a, b) => a.price - b.price);
  } else if (activeSortFilter === 'price-desc') {
    sortedProducts.sort((a, b) => b.price - a.price);
  }

  displayProducts(sortedProducts);
}

function displayProducts(products) {
  const gallery = document.getElementById('product-gallery');
  gallery.innerHTML = '';

  products.forEach((product) => {
    const productDiv = document.createElement('div');
    productDiv.classList.add('product-item');

    const img = document.createElement('img');
    img.src = MewApi.normalizeImagePath(product.image_path);
    img.alt = product.name;
    img.onerror = function onImageError() {
      this.src = mewPath('/media/placeholder.jpg');
    };

    const name = document.createElement('h3');
    name.textContent = product.name;

    const price = document.createElement('p');
    price.textContent = `$${Number(product.price).toFixed(2)}`;

    const addToCartBtn = document.createElement('button');
    addToCartBtn.textContent = 'Add to Cart';
    addToCartBtn.classList.add('add-to-cart-btn');
    addToCartBtn.dataset.productId = product.id;

    addToCartBtn.addEventListener('click', async () => {
      const productId = Number(addToCartBtn.dataset.productId);

      try {
        const session = await MewApi.requireSession('Please log in to add items to your cart.');
        if (!session) {
          return;
        }

        const supabase = await MewApi.getSupabase();
        const { data: existing, error: fetchError } = await supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('product_id', productId)
          .maybeSingle();

        if (fetchError) {
          throw fetchError;
        }

        if (existing) {
          const { error: updateError } = await supabase
            .from('cart_items')
            .update({ quantity: existing.quantity + 1 })
            .eq('id', existing.id);
          if (updateError) {
            throw updateError;
          }
        } else {
          const { error: insertError } = await supabase.from('cart_items').insert({
            user_id: session.user.id,
            product_id: productId,
            quantity: 1,
          });
          if (insertError) {
            throw insertError;
          }
        }

        addToCartBtn.textContent = 'Added!';
        addToCartBtn.disabled = true;
        addToCartBtn.classList.add('added');
      } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Failed to add item to cart.');
      }
    });

    productDiv.appendChild(img);
    productDiv.appendChild(name);
    productDiv.appendChild(price);
    productDiv.appendChild(addToCartBtn);
    gallery.appendChild(productDiv);
  });

  document.getElementById('item-count').textContent = `${products.length} items`;
}

function initMultiselect() {
  const checkboxes = document.querySelectorAll('#mySelectOptions input[type="checkbox"]');

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      if (checkbox.checked && checkbox.getAttribute('data-group') === 'sort') {
        checkboxes.forEach((otherCheckbox) => {
          if (otherCheckbox !== checkbox && otherCheckbox.getAttribute('data-group') === 'sort') {
            otherCheckbox.checked = false;
          }
        });
      }
      applyFilters();
    });
  });

  document.addEventListener('click', (evt) => {
    const flyoutElement = document.getElementById('myMultiselect');
    let targetElement = evt.target;

    do {
      if (targetElement === flyoutElement) {
        return;
      }
      targetElement = targetElement.parentNode;
    } while (targetElement);

    toggleCheckboxArea(true);
  });
}

async function loadProducts() {
  const supabase = await MewApi.getSupabase();
  const { data, error } = await supabase
    .from('boundaries_crossed')
    .select('id, name, image_path, price')
    .order('id');

  if (error) {
    throw error;
  }

  allProducts = data || [];
  displayProducts(allProducts);
}

document.addEventListener('DOMContentLoaded', async () => {
  initMultiselect();

  try {
    await loadProducts();
  } catch (error) {
    console.error('Error loading products:', error);
    document.getElementById('product-gallery').innerHTML =
      '<p>Unable to load products. Check Supabase configuration.</p>';
  }
});
