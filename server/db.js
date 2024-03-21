const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/the_eva_store_db');
const uuid = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT = process.env.JWT || 'shhh';

const createTables = async () => {
    const SQL = `

DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS cart_products;

CREATE TABLE users(
    id SERIAL PRIMARY KEY, 
    name VARCHAR(50),
    username VARCHAR(50);
    email VARCHAR(50),
    password VARCHAR(50),
    admin BOOLEAN DEFAULT false
  

);


`
    await client.query(SQL);
};

const createUser = async ({ username, password }) => {
    const SQL = `
    INSERT INTO users(id, username, password) VALUES($1, $2, $3) RETURNING *
  `;
    const response = await client.query(SQL, [uuid.v4(), username, await bcrypt.hash(password, 5)]);
    return response.rows[0];
};

const createProduct = async ({ name }) => {
    const SQL = `
    INSERT INTO products(id, name) VALUES($1, $2) RETURNING *
  `;
    const response = await client.query(SQL, [uuid.v4(), name]);
    return response.rows[0];
};

const createCart = async ({ user_id, product_id }) => {
    const SQL = `
    INSERT INTO cart(id, user_id, product_id) VALUES($1, $2, $3) RETURNING *
  `;
    const response = await client.query(SQL, [uuid.v4(), user_id, product_id]);
    return response.rows[0];
};
const createCartProducts = async ({ user_id, product_id }) => {
    const SQL = `
      INSERT INTO cart(id, user_id, product_id) VALUES($1, $2, $3) RETURNING *
    `;
    const response = await client.query(SQL, [uuid.v4(), user_id, product_id]);
    return response.rows[0];
};

const deleteCarts = async ({ user_id, id }) => {
    const SQL = `
    DELETE FROM carts WHERE user_id=$1 AND id=$2
  `;
    await client.query(SQL, [user_id, id]);
};

const authenticate = async ({ username, password }) => {
    const SQL = `
    SELECT id, password, username 
    FROM users 
    WHERE username=$1;
  `;
    const response = await client.query(SQL, [username]);
    if ((!response.rows.length || await bcrypt.compare(password, response.rows[0].password)) === false) {
        const error = Error('not authorized');
        error.status = 401;
        throw error;
    }
    const token = await jwt.sign({ id: response.rows[0].id }, JWT);
    return { token: token };
};

const findUserWithToken = async (token) => {
    let id;
    console.log("insidefinduserwithtoken")
    console.log("passed token " + token)
    try {
        const payload = await jwt.verify(token, JWT);
        id = payload.id;
    } catch (ex) {
        const error = Error('not authorized');
        error.status = 401;
        throw error;

    }
    const SQL = `
    SELECT id, username FROM users WHERE id=$1;
  `;
    const response = await client.query(SQL, [id]);
    if (!response.rows.length) {
        const error = Error('not authorized');
        error.status = 401;
        throw error;
    }
    return response.rows[0];
};

const fetchUsers = async () => {
    const SQL = `
    SELECT id, username FROM users;
  `;
    const response = await client.query(SQL);
    return response.rows;
};

const fetchProducts = async () => {
    const SQL = `
    SELECT * FROM products;
  `;
    const response = await client.query(SQL);
    return response.rows;
};
const fetchCarts = async () => {
    const SQL = `
      SELECT * FROM carts;
    `;
    const response = await client.query(SQL);
    return response.rows;
};

const fetchCartProducts = async (user_id) => {
    const SQL = `
    SELECT * FROM cart_products where user_id = $1
  `;
    const response = await client.query(SQL, [user_id]);
    return response.rows;
};

module.exports = {
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
    findUserWithToken
};