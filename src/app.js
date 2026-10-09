// Load .env from the project root, then fall back to src/.env (dotenv never
// overwrites vars that are already set).
require('dotenv').config();

const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const userRoute = require('./routes/userRoute');
const productRoute = require('./routes/productRoute');
const authRoute = require('./routes/authRoute');
const webRoute = require('./routes/webRoute');
const dashboardRoute = require('./routes/dashboardRoute');
const productController = require('./controllers/productController');
const homeController = require('./controllers/homeController');
const errorHandler = require('./middleware/errorHandler');
const session = require('./middleware/session');
const flash = require('./middleware/flash');
const csrf = require('./middleware/csrf');
const locals = require('./middleware/locals');
const AppError = require('./utils/AppError');
const passport = require('passport');
const app = express();
const db = require('./config/db');

//authentication middleware
require('./middleware/auth')

//db connect
db.connectToMongoDB();

const PORT = process.env.PORT
const HOST = '0.0.0.0';

// Configure EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));

// 1. body parser
app.use(express.json());
app.use(express.urlencoded({ extended:true}));

// 2. session (MongoDB-backed store, see middleware/session.js)
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
  ttlMs: 1000 * 60 * 60 * 24 * 7, // 7 days
}));

// 3. flash messages
app.use(flash());

// 4. CSRF token (every view gets res.locals.csrfToken)
app.use(csrf.token);

// 5. locals for the views (user, currentPath, query, imgSrc)
app.use(locals);

// Serve CSS, JavaScript and logo files
app.use(express.static(path.join(__dirname, './public')));

//routes
app.use('/', webRoute);            // /login, /logout, /forgot-password, /reset-password/:token
app.use('/dashboard', dashboardRoute);
app.use('/auth', authRoute);
app.use('/user', userRoute);

// Storefront homepage: browsers get views/index.ejs (shelves built from the
// admin collections), while API clients that ask for JSON keep the existing
// product list at GET /
app.get('/', (req, res, next) => {
    if ((req.get('accept') || '').includes('text/html')) {
        return homeController.index(req, res, next);
    }
    return productController.list(req, res, next);
});

app.use('/', productRoute)

//404
app.use((req, res, next) => {
    next(new AppError('Page not found', 404));
});

//global error middleware
app.use(errorHandler)

app.listen(PORT,HOST,  ()=> {
    console.log(`server listening on http://${HOST}:${PORT}`)
}
);



module.exports = app;
