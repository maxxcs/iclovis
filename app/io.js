module.exports = (app) => {

    const fs = require('fs');
    const io = app.get('io');
    const moment = app.get('moment');
    const users = require('../models/users.json');

    let msgsHistory = [];

    app.set('msgsHistory', msgsHistory);
    app.set('users', users);

    const setUser = (name, password, data, id) => {
        let willEdit = true;
        if(users[name])
            willEdit = users[name].password == password;
        if(willEdit) {
            data.password = password;
            users[name] = data;
            fs.writeFileSync('./models/users.json', JSON.stringify(users, null, 4));
        }
    }

    io.on('connection', (socket) => {
        socket.emit('previousMsgs', msgsHistory);

        socket.on('msg2Server', (data) => {
            console.log(data);
            if (data.msg == '') return;

            if (/^@clear$/.test(data.msg)) {
                msgsHistory = [];
                app.set('msgsHistory', msgsHistory);
            } else if (data.msg.startsWith('@setUser')) {
                try {
                    eval(`(${data.msg.substr(1)})`);
                } catch(err)
                {
                    return;
                }
                return;
            }
            
            data.time = moment().format('HH:mm');
            if(users[data.username]) {
                data.style = users[data.username].style;
                data.image = users[data.username].image;    
            }
            
            msgsHistory.push(data);
            socket.emit('msg2Client', data);
            socket.broadcast.emit('msg2Client', data);
        });
        
        socket.on('userTyping', (data) => {
            socket.broadcast.emit('userTyping', data);
        });

        socket.on('disconnect', (data) => {

        });
    });
};