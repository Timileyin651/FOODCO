const productService = require('../services/product.service')

const create = async(req,res,next) => {
    try {
        const product = await productService.createProduct(req.body)
        res.status(201).json({success:true, data:product})
    } catch (error) {
        next(error)
    }
}

const list = async(req,res,next)=> {
    try {
        const result = await productService.listProducts(req.query);
        res.status(200).json({success:true, ...result})
    } catch (error) {
        next(error)
    }
}

const updateProduct = async(req,res,next) => {
    try {
        const product = await productService.updateProduct(req.params.id, req.body);
        res.status(200).json({success:true, data:product})
    } catch (error) {
        next(error)
        
    }
}

const deletePost = async(req,res,next) => {
    try {
        await productService.deleteProduct(req.parama.id)
        res.status(200).json({
            success: true,
            message: 'Use'
        })
    } catch (error) {
        
    }
}

module.exports = {create,list,updateProduct,deletePost}