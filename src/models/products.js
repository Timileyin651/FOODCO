const mongoose = require('mongoose');
const { type } = require('node:os');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: [
            "BAKERY",
            "PASTRIES",
            "SNACKS",
        ],
    },
    image: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: [
            "READY",
            "IN_PREPARATION",
            "SOLD_OUT",
            "UNAVAILABLE",
        ],
        default: "IN_PREPARATION",
    }
},{timestamps:true})

module.exports = mongoose.model('Product', productSchema);