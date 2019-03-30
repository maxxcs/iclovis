const express = require('express');
const validator = require('express-validator');
const session = require('express-session');
const path = require('path');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.set('io', io);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.urlencoded({ extended: true }));
app.use(validator());
app.use(session({ secret: '28e1ecbc8292ac29ad718991fa79392f', resave: false, saveUninitialized: false }));

require('./routes')(app);
require('./io')(app);

module.exports = server;
