const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { type } = require('node:os');

const userSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: [true, 'First name is required'],
        trim:true,
    },
    last_name: {
        type: String,
        required: [true, 'Last name is required'],
        trim:true,
    },
    username: {
        type: String,
        required: [true, 'username is required'],
        trim:true,
    },
    email:{
        type: String,
        required: [true, 'Email is required'],
        unique:true,
        trim:true,
        lowercase:true
    },
    password:{
        type: String,
        required: [true, 'Password is required'],
        trim:true,
    }
},{timestamps: true})

userSchema.pre('save', async function () {
    if(!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.isValidPassword = async function (password){
    const user = this;
    const compare = await bcrypt.compare(password, this.password)

    return compare
}

module.exports = mongoose.model('User', userSchema);