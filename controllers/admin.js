const Product = require('../models/product');
const { validationResult } = require('express-validator');
const fileHelper = require('../util/file');

exports.getAddProduct = (req, res, next) => {

  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: []
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  console.log(image);

  // getting any errors from the req
  const errors = validationResult(req);

  if(!image){
    return res.status(422).render('admin/edit-product',{
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product:{
        title: title,
        price: price,
        description: description
      },
      errorMessage: 'Attached file isn\'t an image',
      validationErrors: []
    })
  }

  if(!errors.isEmpty){

    return  res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product:{
        title: title,
        price : price,
        description: description
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  const imageUrl = image.path;
  const product = new Product({
    title:title, 
    price:price, 
    description:description, 
    imageUrl:imageUrl,
    userId: req.user
  });
  product.save()
  .then(result => {
    console.log('Product successfully created!');
    res.redirect('/admin/products')
  }).catch( err => {
   
    const error = new Error (err);
    error.httpStatusCode = 500;
    return next(error);
  });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  
  if(!editMode){
   return res.redirect('/');
  }

  const prodId = req.params.productId;
  Product.findById(prodId)
  .then( product => {
    if(!product){
      return res.redirect('/');
    }

    res.render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: editMode,
      product : product,
      hasError: false,
      errorMessage: null,
      validationErrors: []
    });
  })
  .catch(err => {
    const error = new Error (err);
    error.httpStatusCode = 500;
    return next(error);
  })

  
};

exports.postEditProduct = (req , res , next) => {
  const prodId = req.body.productId;
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  const errors = validationResult(req);

  if(!errors.isEmpty){
    
    return  res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product:{
        title: title,
        price : price,
        description: description,
        _id:prodId
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  Product.findById(prodId)
  .then( product => {
    if (product.userId.toString() !== req.user._id.toString()){
      return res.redirect('/')
    }
    product.title =title;
    product.price = price;
    if(image){
      fileHelper.deleteFile(product.imageUrl);
      product.imageUrl = image.path;
    }

    product.description = description;
    return product.save()
    .then(result => {
      console.log('updated successfully');
      return res.redirect('/admin/products');
    });
  })
.catch(err => {
  const error = new Error (err);
  error.httpStatusCode = 500;
  return next(error);
});

}

exports.getProducts = (req, res, next) => {
  Product.find({userId:req.user._id})
  .then(products => {
    console.log(products);
    res.render('admin/products', {
      prods: products,
      pageTitle: 'Admin Products',
      path: '/admin/products',
      isLoggedIn: req.session.isLoggedIn
    });
  })
  .catch(err => {
    const error = new Error (err);
    error.httpStatusCode = 500;
    return next(error);
  });
};

exports.postDeleteProduct = (req , res, next) => {
  const prodId = req.body.productId;
  Product.deleteOne({_id: prodId , userId : req.user._id})
  .then((result) => {
    res.redirect('/admin/products');
  })
  .catch(err => {
    console.log(err , 'couldn\'t delete the product!');
  });
  

};
