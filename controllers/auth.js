const crypto = require('crypto');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator')

exports.getLogin = (req, res, next) => {
   // console.log(req.session.isLoggedIn);
    const message = req.flash('errors')[0];
    console.log(message);
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: message,
        oldInput: { 
          email: "",
          password: ""
        },
        validationErrors :[]
    })    
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    const errors = validationResult(req);
    if(!errors.isEmpty){
      return res.status(422).render('auth/login' , {
        path: 'login',
        pageTitle: 'Login',
        errorMessage: errors.array()[0].msg,
        oldInput: { 
          email: email,
          password: password
        },
        validationErrors: errors.array()
      })
    }

    User.findOne({email:email})
      .then(user => {
        console.log(user);
        if(!user){
          return res.status(422).render('auth/login' , {
            path: 'login',
            pageTitle: 'Login',
            errorMessage: errors.array()[0].msg,
            oldInput: { 
              email: email,
              password: password
            },
            validationErrors: []
          })
        }
        bcrypt.compare(password, user.password)
        .then(matched => {
          if(matched){
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              console.log(err);
              res.redirect('/');
            });
          }
          res.status(422).render('auth/login' , {
            path: 'login',
            pageTitle: 'Login',
            errorMessage: errors.array()[0].msg,
            oldInput: { 
              email: email,
              password: password
            },
            validationErrors: []
          })
        })
        .catch(err => {
          console.log(err);
        })
        
      })
      .catch(err => {
        const error = new Error (err);
        error.httpStatusCode = 500;
        return next(error);
      });
};

exports.getSignup = (req, res, next) =>{
  const message = req.flash('errors')[0];
  console.log(message);
  res.render('auth/signup' , {
    path:'/signup',
    pageTitle: 'Signup',
    errorMessage: message,
    oldInput: { 
      email: "",
      password: "",
      confirmPassword: ""
    }
  });
};

exports.postSignup = (req, res, next) =>{
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  

  if(!errors.isEmpty()){
    console.log(errors.array());
    return res.status(422).render('auth/signup',{
      path:'/signup',
      pageTitle: 'sign up',
      errorMessage: errors.array()[0].msg,
      oldInput: { 
        email: email,
        password: password,
        confirmPassword: req.body.confirmPassword
      },
      validationErrors: errors.array()
    });
  }

  return bcrypt.hash(password, 12)
  .then(hashedPass => {
    const user = new User({
      password: hashedPass,
      email:email,
      cart:{ items: []}
    })

    return user.save();
    
  })
  .then(result => {
    res.redirect('/login')
  })
 
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
      console.log(err);
      res.redirect('/');
  });
};

exports.getReset = (req , res , next) => {
  const message = req.flash('error')[0];
  
  res.render('auth/reset',{
    path: '/reset',
    pageTitle: 'reset',
    errorMessage: message
  })
};

exports.postReset = (req , res , next) => {
  crypto.randomBytes(32 ,(err , buffer) => {
    if(err){
      console.log(err);
      return res.redirect('/reset')
    }
    const token = buffer.toString('hex');
    User.findOne({email: req.body.email})
    .then(user => {
      if(!user){
        req.flash('error' , 'No account with that email found');
        return res.redirect('reset');
      }

      user.resetToken = token;
      user.resetTokenExpiration = Date.now() + 3600000;
      return user.save();
    })
    .then( result => {
      res.redirect(`/reset/${token}`)
    })
    .catch(err => console.log(err));
  });
};

exports.getNewPassword = (req , res, next) =>{
  const token = req.params.token;
  User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
  .then(user =>{
    if(!user){
      req.flash('error', 'User not found or Time has expired');
      return res.redirect('/reset');
    }

    const message = req.flash('error')[0];
    return res.render('auth/new-password',{
      path: '/new-password',
      pageTitle: 'New Password',
      errorMessage: message,
      userId: user._id.toString(),
      passwordToken: token
    });
  })
  .catch();

  
};

exports.postNewPassword = (req , res , next) =>{
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;


  User.findOne({
    resetToken: passwordToken, 
    resetTokenExpiration: {$gt: Date.now()},
    _id: userId
  })
  .then(user => {
    if(!user){
      req.flash('error', 'no user found');
      return res.redirect(`/reset/${passwordToken}`);
    }

    return bcrypt.hash(newPassword, 12)
    .then(hashedPass => {
      user.password = hashedPass;
      user.resetToken = undefined;
      user.resetTokenExpiration = undefined;
      return user.save();
    })
  })
  .then(result =>{
    res.redirect('/login')
  })
  .catch(err => console.log(err))
};
