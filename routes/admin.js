const path = require('path');
const {check , body} = require('express-validator');

const express = require('express');

const adminController = require('../controllers/admin');

const isAuth = require('../middleware/is-auth');

const router = express.Router();

let EditArray = [
    body('title', 'Your product name must have atleast 3 characters')
        .isString()
        .isLength({min:3})
        .trim(),
    body('price','your price must be a numric value')
        .isFloat(),
    body('description','Your description needs to have 5 characters at min and 400 at max')
        .isLength({min:5 , max:400})
        .trim()
];

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get('/products', isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product',EditArray, isAuth, adminController.postAddProduct);

// /admin/add-product => GET 
router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product',EditArray, isAuth, adminController.postEditProduct);

router.post('/delete-product', isAuth, adminController.postDeleteProduct);

module.exports = router;
