module.exports = (res, status, data) =>{
    res &&
    res.status(status).json(
        {
            statusCode:status,
            ...data
        }
    );
}