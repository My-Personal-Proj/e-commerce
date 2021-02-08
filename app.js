const path = require('path');
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');

// creating a mongodb store
const MongodDBStore = require('connect-mongodb-session')(session);

// models
const User = require('./models/user');

// routes and controllers
const errorController = require('./controllers/error');
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

// Link to mongodb 
const MONGODB_URI = 'mongodb+srv://shameel_admin:t0jlhZMTLkeQsnQq@cluster0.5kef0.mongodb.net/shop?w=majority';

// creating our store which we use to store sessions in
const store = new MongodDBStore({
  uri: MONGODB_URI,
  collection: 'sessions',
});

// csrf protection initialization, used to avoid hacking into database through other websites
const csrfProtection = csrf();


// configuring where the file should be stored and it's naming
const fileStorage = multer.diskStorage({
  destination: (req , file , cb) => {
    cb(null, 'images')
  },
  filename: (req , file , cb) => {
    cb(null, new Date().toISOString() + '-' +file.originalname);
  }
})

// filtering the types of file we are accepting
const fileFilter = (req , file , cb) => {
  if( file.mimetype === 'image/png' || 
      file.mimetype === 'image/jpg' || 
      file.mimetype === 'image/jpeg')
  {
    cb(null , true);
  }else
  {
    cb(null , false)
  }
}


const app = express();

// setting the view engine as well as where to find the views
app.set('view engine', 'ejs');
app.set('views', 'views');

// using the body parser which reads data from the req sent by the client
app.use(bodyParser.urlencoded({ extended: false }));
// using multer which handles data received in other forms other than text
app.use(multer({storage:fileStorage , fileFilter:fileFilter}).single('image'))
// statically serving the public folder so that html files sent to the client pull anything in public folder that they need from them
app.use(express.static(path.join(__dirname, 'public')));
// statically serving the images folder
app.use('/images', express.static(path.join(__dirname, 'images')));
// creating a session for every user logged in using the express-session install
app.use(
  session({
    secret:'my secret',
    resave:false,
    saveUninitialized:false,
    store:store
  })
);

// using the crfProtection we created up above
app.use(csrfProtection);

// We probably do no need this anymore but we use flash for errors
// We don't need it because we resort to the use of the express-validator which gives us the functionality
app.use(flash());

// Here we create a user from a mongoose object and add it into our request.
app.use((req, res, next) => {
  if(!req.session.user){
    return next();
  }

  User.findById(req.session.user._id)
    .then(user => {
      if(!user){
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => {
      next(new Error(err))
    });
});

// setting locals so that we don't have to set them in every controller
// every response will then have these objects/variables 
app.use((req , res , next) => {
  res.locals.isLoggedIn = req.session.isLoggedIn;;
  res.locals.csrfToken = req.csrfToken();
  next();
})

// making use of our routes
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
// handling errors
app.get('/500',errorController.get500);
app.use(errorController.get404);

// Connecting to our mongodb database and starting the server upon successful connection
mongoose.connect(MONGODB_URI,{useNewUrlParser: true, useUnifiedTopology: true})
.then(result =>{
  app.listen(3000);
})
.catch(err => {
  console.log(err);
})