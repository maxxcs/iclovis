const socket = io();
let timeout;
let historyUserMsg = [];
let actualMsg = 1;
let quoting = '';

//functions
const unquote = () => {
    quoting = '';
    $('#quoted-msg').toggleClass('open');
    $('#msgInput').focus();
    setTimeout(() => $('#quoted-msg').empty(), 500);
};

const quote = (msgNode) => {
    const alreadyQuoting = quoting;
    let inner = msgNode.parentNode.parentNode.parentNode.innerHTML;
    quoting = inner.replace('<i class="fas fa-check-circle" onclick="quote(this)">', '<i class="fas fa-times-circle" onclick="unquote()">');
    if (!alreadyQuoting)
        $('#quoted-msg').toggleClass('open');
    else
        $('#quoted-msg').empty();
    setTimeout(() => document.getElementById('pageBottom').scrollIntoView({ block: 'end', behavior: 'smooth' }), 500);
    $('#quoted-msg').append(quoting);
    $('#msgInput').focus();
};

const stopTyping = () => {
    typing = false;
    socket.emit('userTyping', { typing });
};

const appendMsg = (data) => {
    let sameUser = false;
    let markdown = new showdown.Converter().makeHtml(data.msg);

    let msg = $(`<li id="${data.id}">`);
    let title = $('<span class="row">');
    let user = $('<strong class="col-auto">');
    let hour = $('<span class="msg-hour col-auto ml-auto">');
    let text = $('<span>').append(markdown);

    // if(document.getElementById('messages').children.length)
    //     sameUser = $('#messages').children()[$('#messages').children().length-1].id == data.id;

    // if(!sameUser) {
    title.append(user);
    if (data.image)
        user.append(`<img src="${data.image}" class="user-img">`)
    // }
    user.append(data.username);

    if (data.style)
        title.css(data.style);

    hour.append(`${data.time}  `);
    hour.append($('<i class="fas fa-check-circle" onclick="quote(this)">'));
    title.append(hour);
    msg.append(title);
    msg.append(text);

    $('#messages').append(msg);
    hljs.initHighlighting.called = false;
    hljs.initHighlighting();
    document.getElementById('bottom').scrollIntoView();
};

const sendMsg = () => {
    if ($('#msgInput').val().trim() == '') return false;

    let msg = $('#msgInput').val().trim();
    msg = msg.substr(0, $('#msgInput').caret()).trim() + msg.substr($('#msgInput').caret()).trim();

    if (quoting) {
        quoting = quoting.replace('<i class="fas fa-times-circle" onclick="unquote()">', '<i class="fas fa-check-circle" onclick="quote(this)">');
        msg = `<blockquote class="blockquote">${quoting}</blockquote>${msg}`;
        unquote();
    }

    socket.emit('msg2Server', { id: $('#username').data('id'), username: $('#username').val(), msg });
    historyUserMsg.push(msg);
    $('#msgInput').val('');
    actualMsg = 0;
    return false;
};

const reset = () => {
    $('#messages').empty();
};

//sockets
socket.on('previousMsgs', data => {
    for (var i = 0; i < data.length; i++)
        appendMsg(data[i]);
});

socket.on('msg2Client', data => {
    if (/^@clear$/.test(data.msg)) {
        reset();
        appendMsg(data);
    } else
        appendMsg(data);
});

socket.on('file2Client', data => {
    appendMsg(data);
});

socket.on('userTyping', data => {
    if (data.typing) $('#typingMsg').html(`${data.username} está digitando...`);
    else $('#typingMsg').html('&nbsp;');
});

socket.on('userStyle', data => {
    console.log(data);
    let style = $('<style>').append(data);
    style.appendTo('body');
});

//jquery
(function ($, undefined) { // get caret position
    $.fn.caret = function () {
        var el = $(this).get(0);
        var pos = 0;
        if ('selectionStart' in el) {
            pos = el.selectionStart;
        } else if ('selection' in document) {
            el.focus();
            var Sel = document.selection.createRange();
            var SelLength = document.selection.createRange().text.length;
            Sel.moveStart('character', -el.value.length);
            pos = Sel.text.length - SelLength;
        }
        return pos;
    }
})(jQuery);

$(document).ready(function () {
    $('#msgInput').on('keydown', function (e) {
        var cleanText = $('#msgInput').val().trim();
        if (e.keyCode === 38 && actualMsg < historyUserMsg.length && (cleanText.indexOf('\n') >= $('#msgInput').caret() || !cleanText)) {
            actualMsg++;
            $('#msgInput').val(historyUserMsg[historyUserMsg.length - actualMsg]);
        } else if (e.keyCode === 40 && actualMsg > 0 && (cleanText.lastIndexOf('\n') <= $('#msgInput').caret() || !cleanText)) {
            actualMsg--;
            $('#msgInput').val(historyUserMsg[historyUserMsg.length - actualMsg]);
        }
    });

    $(document).delegate('#msgInput', 'keydown', function (e) {
        var keyCode = e.keyCode || e.which;
        if (keyCode == 9) {
            e.preventDefault();
            var start = this.selectionStart;
            var end = this.selectionEnd;
            $(this).val($(this).val().substring(0, start)
                + "\t"
                + $(this).val().substring(end));
            this.selectionStart =
                this.selectionEnd = start + 1;
        }
    });

    $('#msgInput').keypress(function (e) {
        typing = true;
        socket.emit('userTyping', { username: $('#username').val(), typing });
        clearTimeout(timeout);
        timeout = setTimeout(stopTyping, 1000);
        if (e.keyCode === 13) stopTyping();
    });

    $('#btnSend').click(sendMsg);

    $(document).keyup(function (e) {
        if (e.keyCode === 13 && !e.shiftKey) sendMsg();
    });

    $('#file').change(function (e) {
        var fileName = e.target.files[0].name;
        $('#filename').text(fileName);
    });
});
