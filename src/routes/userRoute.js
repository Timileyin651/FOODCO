const express = require('express')
const userController = require('../controllers/userController');
const validate = require('../middleware/validate');
const {user,product,idParam} = require('../validators/schema');
const passport = require('passport');

const userRouter = express.Router();

require("../middleware/auth");

userRouter.get('/', passport.authenticate('jwt', {session:false}), userController.list);
userRouter.put('/:id',passport.authenticate('jwt', {session:false}), validate(idParam, 'params'), userController.updateUser);
userRouter.delete('/:id',passport.authenticate('jwt', {session:false}), validate(idParam, 'params'), userController.deleteUser);

module.exports = userRouter;