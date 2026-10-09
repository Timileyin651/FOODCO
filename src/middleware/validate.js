function validate(schema, property='body'){
    return(req,res,next)=>{
        const { error, value} = schema.validate(req[property], {
            abortEarly:false, //this helps collate all the validation errors and send all of them at once
            stripUnknown: true, //drop field the schema does not need
        });
        if(error){
            const message = error.details.map((d)=> d.message).join(', ');
            return res.status(422).json({success:false, message})
        }

        req[property] = value;
        next();
    }
}

module.exports = validate;