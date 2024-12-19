let allProducts = []; // Global variable to store the parsed products

// Show/Hide Checkbox Dropdown
function toggleCheckboxArea() {
    const options = document.getElementById('mySelectOptions');
    const selectBox = document.querySelector('.selectBox');
    const isOpen = options.style.display === 'block';

    // Toggle display and 'open' class for animation
    options.style.display = isOpen ? 'none' : 'block';
    selectBox.classList.toggle('open', !isOpen);
}

// Close dropdown when clicking outside
document.addEventListener('click', function (e) {
    const multiselect = document.getElementById('myMultiselect');
    const options = document.getElementById('mySelectOptions');
    const selectBox = document.querySelector('.selectBox');
    
    if (!multiselect.contains(e.target)) {
        options.style.display = 'none';
        selectBox.classList.remove('open');
    }
});

// Apply Filters Logic
function applyFilters() {
    const checkboxes = document.querySelectorAll('#mySelectOptions input[type="checkbox"]');
    let activeSortFilter = null;
    let activeLabel = "Nothing is selected";

    // Find the selected checkbox in the 'sort' group
    checkboxes.forEach((checkbox) => {
        if (checkbox.checked && checkbox.getAttribute("data-group") === "sort") {
            activeSortFilter = checkbox.value;
            activeLabel = checkbox.parentElement.textContent.trim(); // Get the label text
        }
    });

    // Update the visible dropdown text with the active filter
    const labelElement = document.querySelector('.selectBox');
    labelElement.textContent = activeLabel;

    // Sort and Display products using the global allProducts array
    let sortedProducts = [...allProducts]; // Create a copy so we don't mutate allProducts directly

    // Apply sorting logic based on selected filter
    if (activeSortFilter === 'name-asc') {
        sortedProducts.sort((a, b) => a['Name'].localeCompare(b['Name']));
    } else if (activeSortFilter === 'name-desc') {
        sortedProducts.sort((a, b) => b['Name'].localeCompare(a['Name']));
    } else if (activeSortFilter === 'price-asc') {
        sortedProducts.sort((a, b) => parseFloat(a['USD Price']) - parseFloat(b['USD Price']));
    } else if (activeSortFilter === 'price-desc') {
        sortedProducts.sort((a, b) => parseFloat(b['USD Price']) - parseFloat(a['USD Price']));
    }

    displayProducts(sortedProducts);
}

function displayProducts(products) {
    const gallery = document.getElementById('product-gallery');
    // Clear previous content before displaying new products
    gallery.innerHTML = '';

    products.forEach(product => {
        // Check if product data is valid
        if (product['Name'] && product['Number'] && product['USD Price']) {
            // Create a container for each product
            const productDiv = document.createElement('div');
            productDiv.classList.add('product-item');

            // Create an image element
            const img = document.createElement('img');
            img.src = `../media/sets/Boundaries_Crossed/${product['Number']}`;
            img.alt = product['Name'];
            img.onerror = function() {
                this.src = '../media/placeholder.jpg'; // Optional placeholder
            };

            // Create a name element
            const name = document.createElement('h3');
            name.textContent = product['Name'];

            // Create a price element
            const price = document.createElement('p');
            price.textContent = `$${product['USD Price']}`;

            // Create an "Add to Cart" button
            const addToCartBtn = document.createElement('button');
            addToCartBtn.textContent = 'Add to Cart';
            addToCartBtn.classList.add('add-to-cart-btn');
            addToCartBtn.dataset.productId = parseInt(product['Number'], 10);

            // Event listener for adding to cart
            addToCartBtn.addEventListener('click', async () => {
                const productId = addToCartBtn.dataset.productId; // Retrieve product ID
                try {
                    const response = await fetch('/cart/add', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ productId, quantity: 1 }) // Default quantity set to 1
                    });

                    if (response.ok) {
                        addToCartBtn.textContent = 'Added!';
                        addToCartBtn.disabled = true;
                        addToCartBtn.classList.add('added');
                    } else {
                        console.error('Error adding to cart:', await response.json());
                    }
                } catch (error) {
                    console.error('Network error while adding to cart:', error);
                }
            });

            // Append elements
            productDiv.appendChild(img);
            productDiv.appendChild(name);
            productDiv.appendChild(price);
            productDiv.appendChild(addToCartBtn);

            gallery.appendChild(productDiv);    
            // Update item count
            document.getElementById('item-count').textContent = `${products.length} items`;
        }
    });
}

// Initialize filters and setup events
document.addEventListener("DOMContentLoaded", () => {
    const checkboxes = document.querySelectorAll('#mySelectOptions input[type="checkbox"]');

    checkboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", () => {
            if (checkbox.checked) {
                // Ensure only one sorting filter is active in the 'sort' group
                const group = checkbox.getAttribute("data-group");
                if (group === "sort") {
                    checkboxes.forEach((otherCheckbox) => {
                        if (otherCheckbox !== checkbox && otherCheckbox.getAttribute("data-group") === group) {
                            otherCheckbox.checked = false;
                        }
                    });
                }
            }
            applyFilters(); // Apply filters after selection
        });
    });

    // Initially, we won't call fetchProducts(); we rely on Papa.parse
    // Papa.parse will load allProducts and then we call displayProducts()
});

// Parse CSV and load products initially
document.addEventListener('DOMContentLoaded', function() {
    Papa.parse('../media/sets/Boundaries_Crossed/bcr.csv', {
        download: true,
        header: true,
        complete: function(results) {
            allProducts = results.data;
            displayProducts(allProducts); // Display initially without sorting
        }
    });
});

window.onload = (event) => {
    initMultiselect();
};

function initMultiselect() {
    checkboxStatusChange();

    document.addEventListener("click", function(evt) {
        var flyoutElement = document.getElementById('myMultiselect'),
        targetElement = evt.target; // clicked element

        do {
            if (targetElement == flyoutElement) {
                return; // Click inside
            }
            targetElement = targetElement.parentNode;
        } while (targetElement);

        // Click outside
        toggleCheckboxArea(true);
    });
}

function checkboxStatusChange() {
    var multiselect = document.getElementById("mySelectLabel");
    var multiselectOption = multiselect.getElementsByTagName('option')[0];

    var values = [];
    var checkboxes = document.getElementById("mySelectOptions");
    var checkedCheckboxes = checkboxes.querySelectorAll('input[type=checkbox]:checked');

    for (const item of checkedCheckboxes) {
        var checkboxValue = item.getAttribute('value');
        values.push(checkboxValue);
    }

    var dropdownValue = "Nothing is selected";
    if (values.length > 0) {
        dropdownValue = values.join(', ');
    }

    multiselectOption.innerText = dropdownValue;
}

function toggleCheckboxArea(onlyHide = false) {
    var checkboxes = document.getElementById("mySelectOptions");
    var displayValue = checkboxes.style.display;

    if (displayValue != "block") {
        if (onlyHide == false) {
            checkboxes.style.display = "block";
        }
    } else {
        checkboxes.style.display = "none";
    }
}

// Check for specific conditions to disable checkboxes
function checkboxStatusUpdate() {
    var checkboxOne = document.getElementById('one');
    var checkboxTwo = document.getElementById('two');
    var checkboxThree = document.getElementById('three');
    var checkboxFour = document.getElementById('four');

    var checkboxes = [checkboxOne, checkboxTwo, checkboxThree, checkboxFour];

    // Reset disabled state first
    checkboxes.forEach(checkbox => {
        checkbox.disabled = false;
    });

    // Disable others if one is selected
    if (checkboxOne.checked) {
        disableOthers(checkboxOne, [checkboxTwo, checkboxThree, checkboxFour]);
    }
    if (checkboxTwo.checked) {
        disableOthers(checkboxTwo, [checkboxOne, checkboxThree, checkboxFour]);
    }
    if (checkboxThree.checked) {
        disableOthers(checkboxThree, [checkboxOne, checkboxTwo, checkboxFour]);
    }
    if (checkboxFour.checked) {
        disableOthers(checkboxFour, [checkboxOne, checkboxTwo, checkboxThree]);
    }
}

function disableOthers(selectedCheckbox, others) {
    others.forEach(checkbox => {
        checkbox.disabled = true;
    });
}
