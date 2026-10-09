const mongoose = require('mongoose');

/**
 * One schema, three collections. Bakery, Pastry and Snack all share the same
 * shape: { name, price, quantity, status, image, createdAt, updatedAt }.
 * Keeping the builder in one place avoids triplicating the schema while still
 * giving each module its own model/collection.
 */
function buildItemSchema() {
  return new mongoose.Schema(
    {
      name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: 80,
      },
      price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative'],
        default: 0,
      },
      quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [0, 'Quantity cannot be negative'],
        validate: {
          validator: Number.isInteger,
          message: 'Quantity must be a whole number',
        },
        default: 0,
      },
      status: {
        type: String,
        enum: {
          values: ['in', 'out'],
          message: 'Status must be "in" (available) or "out" (not available)',
        },
        default: 'in',
      },
      image: {
        type: String,
        trim: true,
        default: '',
      },
    },
    { timestamps: true },
  );
}

module.exports = buildItemSchema;
