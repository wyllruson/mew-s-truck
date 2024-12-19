const message = 'CSC-317 startup template\n'
    + 'This template uses nodeJS, express, and express.static\n';

const port = 3000;
const path = require('path');
const express = require('express');
const mysql = require('mysql2/promise'); // Use mysql2 for database connections
const bcrypt = require('bcrypt'); // For hashing passwords
const app = express();
const session = require('express-session');
const fs = require('fs');

app.use(session({
    secret: '34412f273da2010f417fdbcab7e2df0f64653a3859a4cc57d44f329c0299eda5a93ddc9b34a709ec1551d180d27496cc73a19204aaf06f4097e4f5a06300060c',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true for HTTPS
}));

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static file directory
const StaticDirectory = path.join(__dirname, 'public');
app.use(express.static(StaticDirectory));

// Database configuration
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};



app.post('/send-email', async (req, res) => {
    const { name, email, comments } = req.body;

    if (!name || !email || !comments) {
        return res.status(400).send('Missing required fields: name, email, or comments.');
    }

    // Define the file content
    const fileContent = `
        New FAQ Message:

        Name: ${name}
        Email: ${email}
        Message: ${comments}
    `;

    // Define the file path (you can customize the directory)
    const filePath = path.join(__dirname, 'messages', `${Date.now()}_message.txt`);

    try {
        // Ensure the 'messages' directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Write the content to the file
        fs.writeFileSync(filePath, fileContent, 'utf8');

        // Respond with success
        res.status(200).json({ message: 'Message saved to file!', filePath });
    } catch (error) {
        console.error('Error writing to file:', error);
        res.status(500).json({ error: 'Failed to save the message to a file. Please try again later.' });
    }
});


// API route to fetch card data
app.get('/api/boundaries_crossed', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);

        // Fetch card data from the database
        const [rows] = await connection.execute(`
            SELECT name, image_path, price 
            FROM boundaries_crossed
        `);

        res.json(rows); // Send data as JSON
        await connection.end(); // Close connection
    } catch (error) {
        console.error('Error fetching card data:', error);
        res.status(500).json({ error: 'An error occurred while fetching card data.' });
    }
});

app.get('/get-username', (req, res) => {
    if (req.session && req.session.userId) {
        // Replace this with a query to fetch the username from the database if needed
        res.json({ username: req.session.username || 'Guest' });
    } else {
        res.json({ username: 'Guest' });
    }
});


// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const connection = await mysql.createConnection(dbConfig);

        // Check if the username exists
        const [rows] = await connection.execute(
            `SELECT id, username, hashed_password FROM users WHERE username = ?`,
            [username]
        );        

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const user = rows[0];

        // Compare hashed passwords
        const isPasswordMatch = await bcrypt.compare(password, user.hashed_password);
        if (!isPasswordMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Store user ID in the session
        req.session.userId = user.id;
        req.session.username = user.username; // Set the username in the session


        res.status(200).json({ message: 'Login successful!' });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'An error occurred during login' });
    }
});


// Signup route
app.post('/signup', async (req, res) => {
    const { username, email, password, confirm_password } = req.body;

    // Password confirmation check
    if (password !== confirm_password) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);

        // Check if the username or email already exists
        const [existingUser] = await connection.execute(
            `SELECT * FROM users WHERE username = ? OR email = ?`,
            [username, email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user into the database
        await connection.execute(
            `INSERT INTO users (username, email, hashed_password, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())`,
            [username, email, hashedPassword]
        );

        await connection.end();

        // Redirect to login page on successful signup
        res.redirect('/account/login.html'); // Adjust the path based on your file structure
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ error: 'An error occurred during signup' });
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error during logout:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.clearCookie('connect.sid'); // Clear session cookie
        res.status(200).json({ message: 'Logged out successfully' });
    });
});


app.get('/is-logged-in', (req, res) => {
    if (req.session && req.session.userId) {
        res.json({ loggedIn: true, username: req.session.username });
    } else {
        res.json({ loggedIn: false });
    }
});

app.get('/account', (req, res) => {
    if (req.session && req.session.userId) {
        res.sendFile(path.join(__dirname, '/public/account/account.html'));
    } else {
        res.redirect('/account/login.html');
    }
});

app.get('/account-info', async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.json({ loggedIn: false });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);

        // Step 1: Fetch user details
        const [userRows] = await connection.execute(
            'SELECT username, email FROM users WHERE id = ?',
            [req.session.userId]
        );

        // Step 2: Fetch recent orders with total and date
        const [orderRows] = await connection.execute(
            'SELECT id, total_price AS total, order_date AS date FROM orders WHERE user_id = ? ORDER BY order_date DESC',
            [req.session.userId]
        );

        // Step 3: Fetch cart items for each order
        const recentOrders = [];
        for (const order of orderRows) {
            const [items] = await connection.execute(
                `SELECT 
                    order_items.product_id, 
                    order_items.quantity, 
                    order_items.price AS item_price, 
                    boundaries_crossed.image_path, 
                    boundaries_crossed.name AS product_name 
                 FROM 
                    order_items 
                 JOIN 
                    boundaries_crossed 
                 ON 
                    order_items.product_id = boundaries_crossed.id 
                 WHERE 
                    order_items.order_id = ?`,
                [order.id]
            );

            // Build the order object
            recentOrders.push({
                id: order.id,
                date: order.date,
                total: order.total,
                items: items.map(item => ({
                    product_id: item.product_id,
                    product_name: item.product_name,
                    image_path: item.image_path,
                    quantity: item.quantity,
                    price: item.item_price
                }))
            });
        }

        // Step 4: Send response with user details and orders
        res.json({
            loggedIn: true,
            username: userRows[0].username,
            email: userRows[0].email,
            recentOrders
        });

        await connection.end();
    } catch (error) {
        console.error('Error fetching account info:', error);
        res.status(500).json({ loggedIn: false });
    }
});


// add to cart
app.post('/cart/add', async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'You must be logged in to add items to the cart.' });
    }

    const { productId, quantity } = req.body;

    try {
        const connection = await mysql.createConnection(dbConfig);
        const userId = req.session.userId;

        // Check if the item already exists in the user's cart
        const [existingItem] = await connection.execute(
            `SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ?`,
            [userId, productId]
        );

        if (existingItem.length > 0) {
            // Update the quantity if the item exists
            await connection.execute(
                `UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?`,
                [quantity, userId, productId]
            );
        } else {
            // Insert a new item if it doesn't exist
            await connection.execute(
                `INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)`,
                [userId, productId, quantity || 1] // Default quantity to 1 if not provided
            );
        }

        await connection.end();
        res.status(200).json({ message: 'Item added to cart' });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ error: 'An error occurred while adding to the cart.' });
    }
});


// API endpoint to fetch cart items
app.get('/cart/items', async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'You must be logged in to view the cart.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        const userId = req.session.userId;

        // Query to get cart items along with product details
        const [cartItems] = await connection.execute(
            `SELECT 
                ci.id AS cart_item_id,
                bc.name AS product_name,
                bc.image_path AS product_image,
                bc.price AS product_price,
                ci.quantity 
             FROM cart_items ci
             JOIN boundaries_crossed bc ON ci.product_id = bc.id
             WHERE ci.user_id = ?`,
            [userId]
        );

        res.json(cartItems);
        await connection.end();
    } catch (error) {
        console.error('Error fetching cart items:', error);
        res.status(500).json({ error: 'An error occurred while fetching cart items.' });
    }
});


app.post('/cart/remove', async (req, res) => {
    const { cartItemId } = req.body;

    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'You must be logged in to modify the cart.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        const userId = req.session.userId;

        // Remove the item from the cart
        const [result] = await connection.execute(
            `DELETE FROM cart_items WHERE id = ? AND user_id = ?`,
            [cartItemId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cart item not found or does not belong to the user.' });
        }

        await connection.end();
        res.status(200).json({ message: 'Item removed from cart' });
    } catch (error) {
        console.error('Error removing cart item:', error);
        res.status(500).json({ error: 'An error occurred while removing the cart item.' });
    }
});


// Update Cart Item Quantity
app.patch('/cart/update', async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'You must be logged in to update your cart.' });
    }

    const { cartItemId, quantity } = req.body;

    try {
        const connection = await mysql.createConnection(dbConfig);

        const query = 'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?';
        await connection.execute(query, [quantity, cartItemId, req.session.userId]);

        await connection.end();
        res.status(200).json({ message: 'Cart item updated' });
    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({ error: 'An error occurred while updating the cart item' });
    }
});

app.post('/cart/checkout', async (req, res) => {
    const userId = req.session.userId; // Assuming user session is available

    if (!userId) {
        return res.status(401).json({ error: 'User not logged in.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);

        // Step 1: Get cart items for the user
        const [cartItems] = await connection.execute(
            'SELECT product_id, quantity FROM cart_items WHERE user_id = ?',
            [userId]
        );

        if (cartItems.length === 0) {
            return res.status(400).json({ error: 'Your cart is empty.' });
        }

        // Step 2: Calculate total price and prepare order_items data
        let totalPrice = 0;
        const orderItems = [];

        for (const item of cartItems) {
            const [product] = await connection.execute(
                'SELECT price FROM boundaries_crossed WHERE id = ?',
                [item.product_id]
            );

            if (product.length > 0) {
                const productPrice = product[0].price;
                totalPrice += productPrice * item.quantity;

                // Prepare data for the order_items table
                orderItems.push({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: productPrice, // Store price at the time of purchase
                });
            }
        }

        // Step 3: Create a new order
        const [orderResult] = await connection.execute(
            'INSERT INTO orders (user_id, total_price) VALUES (?, ?)',
            [userId, totalPrice]
        );

        const orderId = orderResult.insertId;

        // Step 4: Insert items into the order_items table
        const insertOrderItems = orderItems.map(item => [
            orderId,
            item.product_id,
            item.quantity,
            item.price,
        ]);

        await connection.query(
            `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?`,
            [insertOrderItems]
        );

        // Step 5: Clear the cart
        await connection.execute('DELETE FROM cart_items WHERE user_id = ?', [userId]);

        // Step 6: Send success response
        await connection.end();
        res.status(200).json({ message: 'Order placed successfully!', orderId });
    } catch (error) {
        console.error('Error during checkout:', error);
        res.status(500).json({ error: 'An error occurred during checkout.' });
    }
});


// API to Buy a Random Mystery Card and Place an Order
app.post('/api/buy-mystery-card', async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'You must be logged in to purchase a mystery card.' });
    }

    const userId = req.session.userId; // Logged-in user ID
    const fixedPrice = 5.00; // Fixed price for the mystery card

    try {
        const connection = await mysql.createConnection(dbConfig);

        // Step 1: Select a random card
        const [randomCard] = await connection.execute(
            'SELECT id, name, image_path FROM boundaries_crossed ORDER BY RAND() LIMIT 1'
        );

        if (randomCard.length === 0) {
            await connection.end();
            return res.status(404).json({ error: 'No cards available for purchase.' });
        }

        const card = randomCard[0]; // The selected random card

        // Step 2: Create a new order for the user
        const [orderResult] = await connection.execute(
            'INSERT INTO orders (user_id, total_price) VALUES (?, ?)',
            [userId, fixedPrice]
        );

        const orderId = orderResult.insertId; // Get the generated order ID

        // Step 3: Add the card to the order_items table
        await connection.execute(
            'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
            [orderId, card.id, 1, fixedPrice]
        );

        await connection.end();

        // Step 4: Send success response
        res.status(200).json({
            message: 'Mystery card purchased successfully and order placed!',
            order: {
                order_id: orderId,
                card_name: card.name,
                image_path: card.image_path,
                price: fixedPrice
            }
        });
    } catch (error) {
        console.error('Error placing mystery card order:', error);
        res.status(500).json({ error: 'An error occurred while placing the order.' });
    }
});








// Start the server
app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}/`);
});

console.log(message);
