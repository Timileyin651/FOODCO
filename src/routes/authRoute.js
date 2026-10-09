const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
require('dotenv').config()

const authRouter = express.Router();

authRouter.post('/signup', (req,res,next) => {
    passport.authenticate('signup', {session:false}, (error,user,info) =>{
        if(error){
            return next(error)
        }
        if(!user){
            return res.status(409).json({
                success:false,
                message: info?.message || 'Signup failed'
            });

        }
        return res.redirect('/login');
        // return res.status(201).json({
        //     message: 'Signup Successful',
        //     user:user
        // });
    })(req,res,next)
})

authRouter.post('/login', async(req,res,next)=>{
    passport.authenticate('login', async(error,user,info)=>{
        try {
            if(error){
                return next(error)
            }
            if(!user){
                const error = new AppError('email or password is incorrect', 404);
                return next(error)
            }
            req.login(user, {session:false},
                async(error) => {
                    if(error) return next(error);

                    const body = {_id: user._id, email: user.email};
                    const token = jwt.sign({user:body}, process.env.JWT_SECRET);
                    // return res.json({ token});

                    res.cookie('token', token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax'
                    });

                    return res.redirect('/dashboard')
                }
            )
        } catch (error) {
            return next(error)
        }
    })(req,res,next)
})

module.exports = authRouter