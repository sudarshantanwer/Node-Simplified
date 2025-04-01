
const authMiddleware = (req, res, next)=>{

    console.log("I am auth middleware");
    next();

}

module.exports = authMiddleware;