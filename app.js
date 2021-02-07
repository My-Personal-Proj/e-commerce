const path = require('path');
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const csrf = require('csurf');
const flash = require('connect-flash');

const MongodDBStore = require('connect-mongodb-session')(session);

// models
const User = require('./models/user');

// routes and controllers
const errorController = require('./controllers/error');
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');


const MONGODB_URI = 'mongodb+srv://shameel_admin:t0jlhZMTLkeQsnQq@cluster0.5kef0.mongodb.net/shop?w=majority';

const store = new MongodDBStore({
  uri: MONGODB_URI,
  collection: 'sessions',
 
});

const csrfProtection = csrf();



const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');


app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret:'my secret',
    resave:false,
    saveUninitialized:false,
    store:store
  })
);

app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  if(!req.session.user){
    return next();
  }

  User.findById(req.session.user._id)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => console.log(err));
});

app.use((req , res , next) => {
  res.locals.isLoggedIn = req.session.isLoggedIn;;
  res.locals.csrfToken = req.csrfToken();
  next();
})

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);


mongoose.connect(MONGODB_URI,{useNewUrlParser: true, useUnifiedTopology: true})
.then(result =>{
  app.listen(3000);
})
.catch(err => {
  console.log(err);
})