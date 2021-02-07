const express = require('express');
const { check , body } = require('express-validator');
const User = require('../models/user');

const authController = require('../controllers/auth')

const router = express.Router();

router.get('/login', authController.getLogin);

router.post('/login', authController.postLogin);

router.post('/logout', authController.postLogout);

router.get('/signup', authController.getSignup);

router.post('/signup' ,
[   check('email')
        .isEmail()
        .withMessage('Please enter valid email')
        .normalizeEmail()
        .custom((value , {req}) =>{
            return User.findOne({email: value})
            .then(userDoc => {
                if(userDoc){
                    return Promise.reject('Email already exists, chose another one')
                }  
            })
        }),
    body('password', 'Enter a min 5 digit alphanumeric password')
        .isLength({min: 5})
        .isAlphanumeric()
        .trim(),
    body('confirmPassword')
        .trim()
        .custom((value , {req}) => {
        if(value !== req.body.password){
            throw new Error('Passwords have to match');
        }
        return true
    })
], 
authController.postSignup
);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token' , authController.getNewPassword);

router.post('/new-password' , authController.postNewPassword);

module.exports = router;