module.exports = (res, err, statusCode = 500) =>{
    res &&
    res.status(statusCode).json({"statusCode":statusCode,"error": statusCode === 500 ? "Internal Server Error":err?.message});
}