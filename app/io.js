const fs = require('fs');
const moment = require('moment');
const users = require('../models/users.json');
const mutedUsers = []

module.exports = (app) => {
    const io = app.get('io');
    let msgsHistory = [];

    app.set('msgsHistory', msgsHistory);
    app.set('users', users);

    const setUser = (name, password, data, id) => {
        let willEdit = true;
        if (users[name])
            willEdit = users[name].password == password;
        if (willEdit) {
            data.password = password;
            users[name] = data;
            fs.writeFileSync('./models/users.json', JSON.stringify(users, null, 4));
        }
    }

    io.on('connection', (socket) => {
        socket.emit('previousMsgs', msgsHistory);

        socket.on('msg2Server', (data) => {
            console.log(data);
            if (data.msg == '' || mutedUsers.includes(data.username)) return;

            if (/^@clear$/.test(data.msg)) {
                msgsHistory = [];
                app.set('msgsHistory', msgsHistory);
            } else if (/^\\mute .*$/.test(data.msg)) {
                const user = data.msg.split('\\mute ')[1]
                if (!mutedUsers.includes(user))
                    mutedUsers.push(user)
            } else if (/^\\unmute .*$/.test(data.msg)) {
                const user = data.msg.split('\\unmute ')[1]
                if (data.username !== user) {
                    const index = mutedUsers.indexOf(user)
                    if (index !== -1)
                        mutedUsers.splice(index, 1)
                }
            } else if (data.msg.startsWith('@setUser')) {
                try {
                    eval(`(${data.msg.substr(1)})`);
                } catch (err) {
                    console.error(err);
                    return;
                }
                return;
            }

            data.time = moment().format('HH:mm');
            if (users[data.username]) {
                data.style = users[data.username].style;
                data.image = users[data.username].image;
            }

            msgsHistory.push(data);
            socket.emit('msg2Client', data);
            socket.broadcast.emit('msg2Client', data);
        });

        socket.on('userTyping', (data) => {
            if (mutedUsers.includes(data.username)) return;
            socket.broadcast.emit('userTyping', data);
        });
    });
};
