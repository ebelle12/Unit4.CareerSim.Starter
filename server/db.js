const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/the_eva_store_db');
const uuid = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT = process.env.JWT || 'shhh';

const createTables = async () => {
  const SQL = `

DROP TABLE IF EXISTS cart_products;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

CREATE TABLE users(
    id SERIAL PRIMARY KEY, 
    name VARCHAR(50),
    username VARCHAR(50),
    email VARCHAR(50),
    password VARCHAR(255),
    admin BOOLEAN DEFAULT false
    );
  CREATE TABLE products(
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) UNIQUE NOT NULL,
    description VARCHAR(255) NOT NULL,
    photos VARCHAR(4000),
    price FLOAT NOT NULL,
    inventory NUMERIC
  );
  CREATE TABLE cart_products(
    id UUID DEFAULT gen_random_uuid(),
    product_id INT REFERENCES products(id),
    user_id INT REFERENCES users(id),
    amount NUMERIC,
    PRIMARY KEY (id)

);


`
  await client.query(SQL);
};

const createUser = async ({ username, password, name, email, admin }) => {
  const SQL = `
    INSERT INTO users(username, password,name,email,admin) VALUES($1, $2, $3, $4, $5) RETURNING *
  `;
  const response = await client.query(SQL, [username, await bcrypt.hash(password, 5), name, email, admin]);
  console.log(response);
  return response.rows[0];
};

const createProduct = async (name, description, photos, price, inventory) => {
  const SQL = `
    INSERT INTO products(name,description, photos, price,inventory) VALUES($1,$2,$3, $4,$5) RETURNING *
  `;
  const response = await client.query(SQL, [name, description, photos, price, inventory]);
  console.log(response);
  return response.rows[0];
};

const creatSingleProduct = async (name, description, photos, price,) => {
  const SQL = `
    INSERT INTO products(name,description, photos, price,) VALUES($1,$2,$3, $4) RETURNING *
  `;
  const response = await client.query(SQL, [name, description, photos, price,]);
  console.log(response);
  return response.rows[0];
};


const addToCart = async ({ user_id, product_id, amount }) => {
  const SQL = `
    INSERT INTO cart_products(id, user_id, product_id, amount) VALUES($1, $2, $3, $4) RETURNING *
  `;
  const response = await client.query(SQL, [uuid.v4(), user_id, product_id, amount]);
  return response.rows[0];
};
const updateCart = async ({ user_id, product_id, amount }) => {
  const SQL = `
    UPDATE cart_products SET amount=$1 WHERE product_id=$2 AND user_id=$3
  `;
  const response = await client.query(SQL, [amount, product_id, user_id]);
  return { status: 200, message: "cart updated" };
};
const createCartProducts = async ({ user_id, product_id }) => {
  const SQL = `
      INSERT INTO cart(id, user_id, product_id) VALUES($1, $2, $3) RETURNING *
    `;
  const response = await client.query(SQL, [uuid.v4(), user_id, product_id]);

  return response.rows[0];
};

const removeFromCart = async ({ user_id, product_id }) => {
  console.log("deleteCarts:", user_id, product_id)
  const SQL = `
    DELETE FROM cart_products WHERE user_id=$1 AND product_id=$2
  `;
  await client.query(SQL, [user_id, product_id]);
};

const authenticate = async ({ username, password }) => {
  const SQL = `
    SELECT id, password, username 
    FROM users 
    WHERE username=$1;
  `;
  console.log("AUTH:", username)
  const response = await client.query(SQL, [username]);
  console.log("RESP:", response);
  if ((!response.rows.length || await bcrypt.compare(password, response.rows[0].password)) === false) {
    const error = Error('not authorized');
    error.status = 401;
    throw error;
  }

  const token = await jwt.sign({ id: response.rows[0].id }, JWT);
  return { token: token };
};

const isLoggedIn = async (req, res, next) => {
  try {
    console.log(req.headers.authorization, "WITHIN ISLOGGEDIN")
    req.user = await findUserWithToken(req.headers.authorization);

    next();
  }
  catch (ex) {
    next(ex);
  }
};

const createProductAdmin = async ({ name, description, photos, price, inventory }) => {
  const SQL = `
    INSERT INTO products(name, description, photos, price, inventory) VALUES($1, $2, $3, $4) RETURNING *
  `;
  const response = await client.query(SQL, [name, description, photos, price, inventory]);
  return response.rows[0];
};
const updateProductAdmin = async ({ id, name, description, photos, price, inventory }) => {
  const SQL = `
    UPDATE products SET amount=$1 WHERE id=$2
  `;
  const response = await client.query(SQL, [id, name, description, photos, price, inventory]);
  return { status: 200, message: "cart updated" };
};

const deleteProductAdmin = async ({ id }) => {
  console.log("deleteProductAdmin:", id)
  const SQL = `
    DELETE FROM products WHERE id =$1
  `;
  await client.query(SQL, [id]);
};
/*
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzExNDk3ODY3fQ.nl9-6mrjlc3M-GCKo-q0wmX7BKbhBeaN1orr2V-bEP0
*/
const findUserWithToken = async (token) => {
  let id;
  console.log("insidefinduserwithtoken")
  console.log("passed token " + token)
  try {
    const payload = await jwt.verify(token, JWT);
    id = payload.id;
    const sql = `SELECT admin from users WHERE id = $1`
    const res = await client.query(sql, [payload.id])
    const { admin } = res.rows[0]
    console.log("admin", res.rows[0])
    console.log("ID:", id);
    return { id: id, admin: admin };
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
    SELECT id, username,name, email FROM users;
  `;
  const response = await client.query(SQL);
  return response.rows;
};

const fetchProducts = async () => {
  console.log("fetchProducts");
  const SQL = "SELECT * FROM products";


  const response = await client.query(SQL);
  console.log("RESP", response);
  return response.rows;
};
const fetchCarts = async () => {
  const SQL = `
      SELECT * FROM carts;
    `;
  const response = await client.query(SQL);
  return response.rows;
};

const fetchCartProducts = async (id) => {
  const SQL = `
    SELECT * FROM cart_products where id = $1
  `;
  const response = await client.query(SQL, [id]);
  return response.rows;
};

const fetchProductById = async (product_id) => {
  const SQL = `
    SELECT * FROM products where id = $1
  `;
  const response = await client.query(SQL, [product_id]);
  return response.rows[0];
};

module.exports = {
  client,
  createTables,
  createUser,
  createProduct,
  createCart,
  createCartProducts,
  createProductAdmin,
  updateProductAdmin,
  deleteProductAdmin,
  fetchUsers,
  fetchProducts,
  fetchProductById,
  fetchCarts,
  fetchCartProducts,
  deleteCarts,
  authenticate,
  findUserWithToken,
  updateCart,
  isLoggedIn,
  createSingleProduct

};