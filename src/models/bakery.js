const mongoose = require('mongoose');
const buildItemSchema = require('./moduleSchema');

const Bakery = mongoose.model('Bakery', buildItemSchema());

module.exports = Bakery;
