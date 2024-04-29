const express = require('express');
require('dotenv').config()
const app = express();

app.get('/', (req, res) => {
    res.send('Successful response.');
});

app.listen(process.env.SERVER_PORT || 3001, () => console.log("Server started."));