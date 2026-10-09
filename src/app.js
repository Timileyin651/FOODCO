const express = require('express');
const path = require('path');
const userRoute = require('./routes/userRoute');
const productRoute = require('./routes/productRoute');
const authRoute = require('./routes/authRoute');
const errorHandler = require('./middleware/errorHandler');
// const cookieParser = require('cookie-parser');
const passport = require('passport');
const app = express();
const db = require('./config/db');
require('dotenv').config();

//authentication middleware
require('./middleware/auth')

//db connect
db.connectToMongoDB();

const PORT = process.env.PORT
const HOST = 'localhost';

app.use(express.static('public'));
// app.use(cookieParser());

// app.set('views','views')
// app.set('view engine', 'ejs')
// Configure EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));

// Serve CSS, JavaScript and logo files
app.use(express.static(path.join(__dirname, './public')));

app.use(express.json());
app.use(express.urlencoded({ extended:true}));

//routes
app.get('/dashboard',(req,res) => {
    res.render('admin/dashboard')
});
app.use('/auth', authRoute);
app.use('/user', userRoute);
app.use('/', productRoute)

//global error middleware
app.use(errorHandler)

app.listen(PORT,HOST,  ()=>
    console.log(`server listening on http://${HOST}:${PORT}`)
);


