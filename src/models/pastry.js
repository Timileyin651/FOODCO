const mongoose = require('mongoose');
const buildItemSchema = require('./moduleSchema');

const Pastry = mongoose.model('Pastry', buildItemSchema());

module.exports = Pastry;
