const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const user = {
    create: Joi.object({
        first_name: Joi.string().trim().min(1).max(50).required(),
        last_name: Joi.string().trim().min(1).max(50).required(),
        username: Joi.string().trim().lowercase().alphanum().min(3).max(30).required(),
        email: Joi.string().trim().lowercase().email().required(),
        password: Joi.string().min(8).required(),
    }),
    update: Joi.object({
    first_name: Joi.string().trim().min(1).max(50),
    last_name: Joi.string().trim().min(1).max(50),
    username: Joi.string().trim().lowercase().alphanum().min(3).max(30),
    email: Joi.string().trim().lowercase().email(),
  }).min(1), // at least one field must be present on an update

}

const product = {
    create: Joi.object({
        name: Joi.string().trim().min(1).max(50).required(),
        category: Joi.string().trim().min(1).max(50).required(),
        image: Joi.string().required(),
        status: Joi.string().required()
    }),
    update: Joi.object({
        name: Joi.string().trim().min(1).max(50).required(),
        category: Joi.string().trim().min(1).max(50).required(),
        image: Joi.string().required(),
        status: Joi.string().required()
    }).min(1)
};

const idParam = Joi.object({
    id: objectId.required(),
})

module.exports = {user, product, idParam};