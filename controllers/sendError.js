module.exports = (res, err, statusCode = 500) =>{
    res &&
    res.status(statusCode).json({"error":err?.message});
}