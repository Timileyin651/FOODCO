const mongoose = require('mongoose');
const buildItemSchema = require('./moduleSchema');

const Snack = mongoose.model('Snack', buildItemSchema());

module.exports = Snack;
