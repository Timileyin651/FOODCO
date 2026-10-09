const mongoose = require('mongoose');
require('dotenv').config();

const PORT = process.env.PORT
const DB = process.env.MONGODB_URI

//CONNECT
function connectToMongoDB(){
    mongoose.connect(DB);
    mongoose.connection.on('connected', () => {
        console.log('Connected to MongoDb successfully')
    });
    mongoose.connection.on('error', (error)=> {
        console.log('Error connecting to MongoDB', error);
    })
}

module.exports = {connectToMongoDB};

