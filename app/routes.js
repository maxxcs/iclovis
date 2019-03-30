const upload = require('./multer');
const users = require('../models/users.json');
const moment = require('moment');
const path = require('path');

module.exports = (app) => {
    app.get('/', (req, res) => {
        if (req.session.auth) res.redirect('./chat');
        else res.render('./index', { errors: {} });
    });

    app.get('/chat', (req, res) => {
        if (req.session.auth) res.render('./chat', { data: req.session.peer });
        else res.redirect('/');
    });

    app.post('/chat', (req, res) => {
        const peer = {
            username: req.body.username.replace(/</g, "&lt;").replace(/>/g, "&gt;"),
            id: `ID${Math.round(Math.random() * 1000000000)}`
        };

        if (users[peer.username]) {
            peer.id = peer.username;
            peer.style = users[peer.username].style;
            peer.image = users[peer.username].image;
        }

        console.log(peer);
        req.assert('username', 'O campo usuário é obrigatório').notEmpty();

        const errors = req.validationErrors();
        if (errors) {
            res.render('./index', { errors });
            return;
        }

        req.session.auth = true;
        req.session.peer = peer;

        const time = moment().format('HH:mm');

        app.get('io').emit('msg2Client', {
            id: peer.id,
            username: peer.username,
            msg: 'Conectou-se',
            style: peer.style,
            image: peer.image,
            time
        });
        app.get('msgsHistory').push({
            id: peer.id,
            username: peer.username,
            msg: 'Conectou-se',
            style: peer.style,
            image: peer.image,
            time
        });
        res.render('./chat', { data: peer });
    });

    app.post('/upload', upload.single('file'), (req, res) => {
        if (req.file == null) {
            res.redirect('/chat');
            return;
        }

        const time = moment().format('H:MM:SS');

        const file = {
            username: req.session.peer.username,
            filename: req.file.originalname,
            msg: `<a href="/download/${req.file.filename}">${req.file.originalname}</a>`,
            time
        };

        app.get('io').emit('file2Client', file);
        app.get('msgsHistory').push(file);
        res.redirect('/chat');
    });

    app.get('/download/:file', (req, res) => {
        const id = req.params.file;
        const filePath = path.join(__dirname, '../uploads/', id);

        res.download(filePath, (err) => {
            if (err) console.log(err);
            app.get('io').emit('reloadPageClient');
        });
    });

    app.get('/logout', (req, res) => {
        if (req.session.auth)
            req.session.destroy((err) => {
                if (err) console.log(err);
                res.redirect('/');
            });
        else res.redirect('/');
    });

};
