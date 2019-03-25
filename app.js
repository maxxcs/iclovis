const server = require('./app/server');
const os = require('os');
const port = process.env.PORT || 3000;

server.listen(port, () => {
    console.log(`Servidor ativo na porta [${port}]...`);
    console.log(os.networkInterfaces());
}); 