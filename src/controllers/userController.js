const userService = require('../services/user.service');

const list = async (req,res,next) => {
    try {
        const result = await userService.listUsers(req.query);
        res.status(200).json({success:true, ...result})
    } catch (error) {
        next(error)
    }
}

const updateUser = async (req,res,next) => {
    try {
        const user = await userService.updateUser(req.params.id,req.body);
        res.status(200).json({ success:true, data:user})
    } catch (error) {
        next(error)  
    }
}

const deleteUser = async(req,res,next)=> {
    try {
        await userService.deleteUser(req.params.id)
        res.status(200).json({success:true, message: 'User successfully deleted'})
    } catch (error) {
        next(error)
        
    }
}

module.exports = {list,updateUser,deleteUser}