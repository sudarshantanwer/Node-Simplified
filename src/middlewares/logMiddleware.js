
const logMiddleware = (req, res, next)=>{

    console.log("I am log middleware");
    next();

}

module.exports = logMiddleware;