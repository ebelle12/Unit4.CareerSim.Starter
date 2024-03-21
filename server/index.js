// fetchUserInfo
// login
// logout
// createProduct // admin only
// updateProduct // admin only
// deleteProduct // admin only
// addToCart 
// removeFromCart
// checkout ---- which will delete

const pg = require('pg')




const {
    client,
    createTables,
    createUser,
    createProduct,
    fetchUsers,
    fetchProducts,
    fetchCarts,
    fetchCartProducts,
    deleteCarts,

} = require('./db');
const express = require('express');
const app = express();
app.use(express.json());



app.get('/api/users', async (req, res, next) => {
    try {
        res.send(await fetchUsers());
    }
    catch (ex) {
        next(ex);
    }
});


app.get('/api/products', async (req, res, next) => {
    try {
        res.send(fetchProducts());
    }
    catch (ex) {
        next(ex);
    }
});



app.get('/api/users/:id/carts', async (req, res, next) => {
    try {
        res.send(await fetchCarts());
    }
    catch (ex) {
        next(ex);
    }
});

app.get('/api/users/:id/cart_products', async (req, res, next) => {
    try {
        res.send(await fetchCarts());
    }
    catch (ex) {
        next(ex);
    }
});


app.post('/api/users/:id/cart_products', async (req, res, next) => {
    try {
        res.status(201).send(await createFavorite({ user_id: req.params.id, product_id: req.body.product_id }));
    }
    catch (ex) {
        next(ex);
    }
});


app.delete('/api/users/:user_id/cart/:id', async (req, res, next) => {
    try {
        await destroyCart({ user_id: req.params.user_id, id: req.params.id });
        res.sendStatus(204);

    }
    catch (ex) {
        next(ex);
    }
});





const init = async () => {
    await client.connect();
    console.log('connected to database');
    createTables(
        
    )

    console.log('tables created');
    
    console.log('data seeded');
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`listening on port ${port}`));
};

init();


