const express = require('express')
const productController = require('../controllers/productController');
const passport = require('passport');
const validate = require('../middleware/validate');
const {product, idParam} = require('../validators/schema');
const productRouter = express.Router();

require('../middleware/auth');

productRouter.post('/', passport.authenticate('jwt', {session:false}), validate(product.create));
productRouter.get('/', productController.list);
productRouter.put('/:id', passport.authenticate('jwt', {session:false}),validate(idParam, 'params'), validate(product.update));
productRouter.delete('/:id',passport.authenticate('jwt', {session: false}),validate(idParam, 'params'), productController.deletePost);

module.exports = productRouter;