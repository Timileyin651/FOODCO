const mongoose = require('mongoose');
const User = require('../models/users');
const AppError = require('../utils/AppError');

async function createUser(data){
    try {
        const user = await User.create(data);
        return user;
    } catch (error) {
        if(error.code === 11000){
            throw new AppError("User already exists", 409);
        }
        throw new AppError("Oops something went wrong", 404); 
    }
}

async function listUsers({page = 1, limit = 20}) {
    const skip = (page -1) * limit;
    const [users, total] = await Promise.all([
        User.find().skip(skip).limit(limit).sort({ createdAt: -1}),
        User.countDocuments(),
    ]);
    return {users, total, page:Number(page), limit: Number(limit)};
}

async function updateUser(id, data){
    const user = await User.findByIdAndUpdate(id, data,{
        new:true,
        runValidators: true
    });
    if(!user) throw new AppError("User not found", 404);
    return user;
}

async function deleteUser(id) {
    const user = await User.findByIdAndDelete(id);
    if(!user) throw new AppError("User not found", 404);
    return user;
}

module.exports = {
    createUser,listUsers,updateUser,deleteUser
};