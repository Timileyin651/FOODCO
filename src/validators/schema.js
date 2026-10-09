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

// Dashboard CRUD form (Bakery, Pastries, Snacks)
const item = Joi.object({
    name: Joi.string().trim().min(1).max(80).required()
        .messages({'string.empty': 'Name is required'}),
    price: Joi.number().min(0).required()
        .messages({'number.min': 'Price cannot be negative', 'number.base': 'Price must be a number', 'any.required': 'Price is required'}),
    quantity: Joi.number().integer().min(0).required()
        .messages({'number.min': 'Quantity cannot be negative', 'number.integer': 'Quantity must be a whole number', 'any.required': 'Quantity is required'}),
    status: Joi.string().valid('in', 'out').required()
        .messages({'any.only': 'Status must be Available or Not available', 'any.required': 'Status is required'}),
    image: Joi.string().trim().allow('').max(200),
});

// Auth forms (login / forgot password / reset password)
const auth = {
    login: Joi.object({
        email: Joi.string().trim().lowercase().email().required()
            .messages({'string.email': 'Enter a valid email address', 'any.required': 'Email is required'}),
        password: Joi.string().required()
            .messages({'any.required': 'Password is required'}),
    }),
    forgot: Joi.object({
        email: Joi.string().trim().lowercase().email().required()
            .messages({'string.email': 'Enter a valid email address', 'any.required': 'Email is required'}),
    }),
    reset: Joi.object({
        password: Joi.string().min(8).required()
            .messages({'string.min': 'Password must be at least 8 characters', 'any.required': 'Password is required'}),
        confirm: Joi.string().valid(Joi.ref('password')).required()
            .messages({'any.only': 'Passwords do not match', 'any.required': 'Confirm your password'}),
    }),
};

module.exports = {user, product, idParam, item, auth};