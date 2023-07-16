require('dotenv').config();
const express = require("express");
const app = express();
const path = require('path');
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
const { logger } = require('./middleware/logEvents');
const errorHandler = require('./middleware/errorHandler');
const verifyJWT = require('./middleware/verifyJWT');
const cookieParser = require('cookie-parser');
const credentials = require('./middleware/credentials');
const mongoose = require('mongoose');
const connectDB = require('./config/dbConn');
const HTTP_PORT = process.env.PORT || 3500;

/* Connect to MongoDB */
connectDB();

app.use(logger);

/* Handle options credentials check - before CORS!
    and fetch cookies credentials requirement */
app.use(credentials);

/* Cross Origin Resource Sharing */
app.use(cors(corsOptions));

/* To handle encoded url such as http://www.mypage.com/?name=John%20Doe&message=Hello%2C... */
app.use(express.urlencoded({extended: false}));

/* To handle json payloads, such as req.body */
app.use(express.json());

//middleware for cookies
app.use(cookieParser());

/* To serve static files such as html, css, javascript */
app.use(express.static(path.join(__dirname, '/public'))); //default is '/', express.static ...


app.use('/', require('./routes/root'));
app.use('/register', require('./routes/register'));
app.use('/auth', require('./routes/auth'));
app.use('/refresh', require('./routes/refresh'));
app.use('/logout', require('./routes/logout'));

app.use(verifyJWT);
app.use('/api/employees', require('./routes/api/employees'));



app.all('*', (req, res) => {
    res.status(404);
    if (req.accepts('html')){
        res.sendFile(path.join(__dirname, 'views', '404.html'))
    } else if (req.accepts('json')) {
        res.json({ error: "404 Not Found"});
    } else {
        res.type('txt').send("404 Not Found (txt)");
    }
});

app.use(errorHandler);

mongoose.connection.once('open', () => {
    console.log('connected to MongoDB');
    app.listen(HTTP_PORT, () => {
        console.log(`Server Listening on port ${HTTP_PORT}`);
    })
});
