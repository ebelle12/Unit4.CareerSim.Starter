// fetchUserInfo
// login
// logout
// createProduct // admin only
// updateProduct // admin only
// deleteProduct // admin only
// addToCart 
// removeFromCart
// checkout ---- which will delete

// Missing list a single product

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
    authenticate,
    findUserWithToken,
    createCart,
    updateCart,


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
app.get('/api/userByToken/:token', async (req, res, next) => {
    try {
        res.send(await findUserWithToken(req.params.token));
    }
    catch (ex) {
        next(ex);
    }
});

app.get('/api/products', async (req, res, next) => {
    try {
        res.send(await fetchProducts());
    }
    catch (ex) {
        next(ex);
    }
});

app.get('/api/products/:productId', async (req, res, next) => {
    try {

    }
    catch (ex) {
        next(ex);
    }
});



app.get('/api/user/cart/:token', async (req, res, next) => {
    try {
        const userId = await findUserWithToken(req.params.token)
        if (!userId) {
            res.send({ status: 400, message: "User Not Logged" });
            return;
        }
        res.send(await fetchCartProducts(userId.id));
    }
    catch (ex) {
        next(ex);
    }
});

app.get('/api/users/cart_products', async (req, res, next) => {
    try {

        res.send(await fetchCarts());
    }
    catch (ex) {
        next(ex);
    }
});

app.post('/api/auth/register', async (req, res, next) => {
    try {
        res.send(await createUser(req.body));
    }
    catch (ex) {
        next(ex);
    }
});

app.post('/api/auth/login', async (req, res, next) => {
    try {
        res.send(await authenticate(req.body));
    }
    catch (ex) {
        next(ex);
    }
});


app.post('/api/user', async (req, res, next) => {
    try {
        const user = { username: req.body.username, password: req.body.password, name: req.body.name, email: req.body.email };
        console.log("create user:", user);
        res.status(201).send(await createUser(user));
    }
    catch (ex) {
        next(ex);
    }
});
app.post('/api/user/auth', async (req, res, next) => {
    try {
        const user = { username: req.body.username, password: req.body.password };
        console.log("auth user:", user);
        res.status(201).send(await authenticate(user));
    }
    catch (ex) {
        next(ex);
    }
});
app.post('/api/users/cart_products', async (req, res, next) => {
    try {
        const userId = await findUserWithToken(req.body.token)
        if (!userId) {
            res.send({ status: 400, message: "User Not Logged" });
            return;
        }
        res.status(201).send(await createCart({ user_id: userId.id, product_id: req.body.product_id, amount: req.body.amount }));
    }
    catch (ex) {
        next(ex);
    }
});
app.put('/api/users/cart_products', async (req, res, next) => {
    try {
        const userId = await findUserWithToken(req.body.token)
        if (!userId) {
            res.send({ status: 400, message: "User Not Logged" });
            return;
        }
        res.status(201).send(await updateCart({ user_id: userId.id, product_id: req.body.product_id, amount: req.body.amount }));
    }
    catch (ex) {
        next(ex);
    }
});

app.delete('/api/users/cart/:product_id', isLoggedIN, async (req, res, next) => {
    try {
        const userId = await findUserWithToken(req.body.token)
        if (!userId) {
            res.send({ status: 400, message: "User Not Logged" });
            return;
        }
        await deleteCarts({ user_id: userId.id, product_id: req.params.product_id });
        res.send({ status: 200, message: "cart deleted", userId: userId.id, productId: req.params.product_id })

    }
    catch (ex) {
        next(ex);
    }
});

const init = async () => {
    await client.connect();
    console.log('connected to database');
    // createTables()

    console.log('tables created');
    // createUser({ username: "testerb", password: "Test1234" })
    // createProduct({ name: "Shoes", description: "Awesome shoes", photos: "shoe.jpg", price: 50, inventory: 100 });
    console.log('data seeded');
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`listening on port ${port}`));
};

init();


