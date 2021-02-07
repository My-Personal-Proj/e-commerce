const Product = require('../models/product');
const Order = require('../models/order');

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

