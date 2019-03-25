const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, 'uploads');
    },
    filename: function(req, file, callback){
        const nameRegex = /(.+?)(\.[^.]*$|$)/;
        const fileName = nameRegex.exec(file.originalname)[1];
        callback(null, `${fileName}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({storage});

module.exports = upload;