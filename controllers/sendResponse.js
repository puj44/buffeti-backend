module.exports = (res, status, data) =>{
    res &&
    res.status(status).json(
        {
            status:status,
            ...data
        }
    );
}