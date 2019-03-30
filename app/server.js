const express = require('express');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const expressSession = require('express-session');
const moment = require('moment');
const path = require('path');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.set('io', io);
app.set('moment', moment);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(express.static(path.join(__dirname, '../public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(expressSession({ secret: '28e1ecbc8292ac29ad718991fa79392f', resave: false, saveUninitialized: false }));

require('./routes')(app);
require('./io')(app);

module.exports = server;
