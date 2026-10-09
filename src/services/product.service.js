const Product = require('../models/products');
const AppError = require('../utils/AppError');
const { product } = require('../validators/schema');

async function createProduct(data){
    const product = await Product.create(data);
    return product;
}

async function listProducts({page = 1, limit = 20}){
    const skip = (page-1) * limit;
    const[products,total] = await Promise.all([
        Product.find().skip(skip).limit(limit).sort({ createdAt: -1}),
        Product.countDocuments()
    ]);
    return {products, total, page:Number(page), limit:Number(limit)};
}

async function updateProduct(id,data){
    product = await Product.findByIdAndUpdate(id,data, {
        new:true,
        runValidators:true
    });
    if(!product) throw new AppError('Product not found');
    return product;
}

async function deleteProduct(id){
    const product = await Product.findByIdAndDelete(id);
    if(!user) throw new AppError("Product not found",404);
    return product;
}

module.exports = {
    createProduct,listProducts,updateProduct,deleteProduct
}