const Product = require('../models/product');
const Order = require('../models/order');
const fs = require('fs');
const path = require('path');
const fileHelper = require('../util/file');


const pdfDocument = require('pdfkit')

exports.getProducts = (req, res, next) => {  
  Product.find()
  .then(products => {
    console.log(products);
    res.render('shop/product-list', {
      prods: products,
      pageTitle: 'Shop',
      path: '/products',
      isLoggedIn: req.session.isLoggedIn
    });
  })
  .catch( err => {
    console.log(err);
  });
};

exports.getProduct = (req , res , next) => {
  const prodId =  req.params.productId;
  Product.findById(prodId)
  .then(product=>{
    console.log(product);
    res.render('shop/product-detail',{
      product:product , 
      pageTitle:product.title,
      path:'/products',
      isLoggedIn: req.session.isLoggedIn
    })
  })
  .catch(err => console.log(err));

}

exports.getIndex = (req, res, next) => {
  Product.find()
  .then(products => {
    res.render('shop/index', {
      prods: products,
      pageTitle: 'Shop',
      path: '/'
    });
  })
  .catch( err => {
    console.log(err);
  });
};

exports.getCart = (req, res, next) => {
 req.user
  .populate('cart.items.productId')
  .execPopulate()
  .then(user =>{
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products,
        isLoggedIn: req.session.isLoggedIn
      });
      return products;
  })
  .catch(err => console.log(err));  
};

exports.postCart = (req , res , next) => { 
  const prodId = req.body.productId;
  Product.findById(prodId)
  .then(product => {
    return req.user.addToCart(product);
  })
  .then(result => {
    res.redirect('/cart');
  })
  .catch(err => {
    console.log(err);
  });
};

exports.postCartDeleteProduct = (req , res , next) => {
  const prodId = req.body.productId;
 req.user.deleteItemFromCart(prodId)
  .then(result => {
    console.log('deleted from cart');
    res.redirect('/cart');
  })
  .catch(err => console.log(err));
}

exports.postOrder = (req , res , next)=>{

 req.user
  .populate('cart.items.productId')
  .execPopulate()
  .then(user =>{
      const products = user.cart.items.map(item =>({
        product: {...item.productId._doc},
        quantity:item.quantity
      }));
      console.log(products);
      const order = new Order({
        user: {
          email:req.user.email,
          _id:req.user._id
        },
        items:products
      });
     return order.save();
  })
  .then(result => {
    return req.user.clearCart();
  })
  .then(result => {
    return res.redirect('orders');
  })
  .catch(err => console.log(err));
  ;


}

exports.getOrders = (req, res, next) => {
  Order.find({'user._id':req.session.user._id})
  .then( orders => {
    console.log(orders);
    res.render('shop/orders', {
      path: '/orders',
      pageTitle: 'Your Orders',
      orders: orders,
      isLoggedIn: req.session.isLoggedIn
    });
  })
  .catch();
  
};

exports.getInvoice = (req , res, next)=>{
  // Get order ID and  construct name and path of the invoice
  const orderId = req.params.orderId;

  Order.findById(orderId)
  .then(order => {
    if(!order){
      return next(new Error('No order Found'));
    }
    if(order.user._id.toString() !== req.user._id.toString()){
      return next(new Error('Unauthorized'));
    }

    const invoiceName = `invoice-${orderId}.pdf`;
    const invoicePath = path.join('data', 'invoices' , invoiceName);
    
    const pdfDoc = new pdfDocument();
    pdfDoc.pipe(fs.createWriteStream(invoicePath));
    pdfDoc.pipe(res);

    pdfDoc
    .fontSize(26)
    .text('Invoice',{underline: true})

    pdfDoc.text('-----------------------------------------------');;
    let totalPrice  = 0;
    order.items.forEach(item => {
      const prod = item.product;
      totalPrice += item.quantity*prod.price;
      pdfDoc.fontSize(14).text(`${prod.title}  -  R${prod.price} - Qty: ${item.quantity}`);
    });
    
    pdfDoc.text(`\n\nTotal Price: ${totalPrice}`)
    pdfDoc.end();

    // Here we are streaming the file to the client and not preloading it.
    res.setHeader('Content-Type','application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="invoice.pdf"`
    );

  });
}