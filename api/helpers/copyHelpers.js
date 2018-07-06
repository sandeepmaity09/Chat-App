const fs = require('fs');

async function copyFile(source, target) {
    var rd = fs.createReadStream(source);
    var wr = fs.createWriteStream(target);
    try {
        return await new Promise(function (resolve, reject) {
            rd.on('error', reject);
            wr.on('error', reject);
            rd.pipe(wr);
            wr.on('finish', resolve({ status: 200 }));
        });
    } catch (error) {
        rd.destroy();
        wr.end();
        throw error;
    }
}

module.exports = copyFile;