const fs = require('fs');
const jsreportrender = require('jsreport').render;
const uuidv4 = require('uuid/v4');
const path = require('path');

async function pdfPrinter(data) {
    let content = `
                <html>
                    <head>
                        <style>
                                table {
                                    font-family: arial, sans-serif;
                                    border-collapse: collapse;
                                    width: 90%;
                                    table-layout:fixed;
                                }
                                
                                td, th {
                                    border:none;
                                    text-align: left;
                                    padding: 3px;
                                    word-wrap:break-word;
                                }
                                
                                tr:nth-child(even) {
                                    background-color: #dddddd;
                                }
                        </style>
                    </head>

                    <body>
                        <h1 align="center">TTalk {{teamname}}</h1>
                        <hr>
                        <table align="center">
                                <tr>
                                    <th>Name</th>
                                    <th>Message</th>
                                    <th>Date</th>
                                </tr>
                                
                                {{#each messages}}
                                    <tr>
                                        <td>{{this.user_name}}</td>
                                        <td>
                                            {{#ifCond this.message_type this.message}}
                                            {{body}}
                                            {{/ifCond}}
                                        </td>
                                        <td>{{this.updated_at}}</td>
                                    </tr>
                                {{/each}}
                        </table>
                    </body>
                    </html>
                `;

    return jsreportrender({
        template: {
            content: content,
            engine: 'handlebars',
            helpers: `
                        Handlebars.registerHelper("inc", function (value, options) {
                            return parseInt(value) + 1;
                        });

                        Handlebars.registerHelper("ifCond",function(value,message,options){
                            if(parseInt(value)){
                                if(parseInt(value) === 1){
                                    return new Handlebars.SafeString('Image');
                                }
                                if(parseInt(value) === 2){
                                    return new Handlebars.SafeString('Audio File');
                                }
                                if(parseInt(value) === 3){
                                    return new Handlebars.SafeString('Video File');
                                }
                                if(parseInt(value) === 4){
                                    return new Handlebars.SafeString('Document');
                                }
                            } else {
                                return new Handlebars.SafeString(message);
                            }
                        })

                        Handlebars.registerHelper("ifForHeading",function(value,options){
                            let count = parseInt(value);
                            if((count%25) === 0){
                                return new Handlebars.SafeString('<tr><th>S.No</th><th>Name</th><th>Message</th><th>Date / Time</th></tr>');
                            }
                        })
                        `,
            recipe: 'phantom-pdf'
        }, data: data
    }).then((resp) => {
        let pathname = path.join(__dirname + "../../../uploads/reports/")
        let filename = pathname + uuidv4() + '.pdf';
        return new Promise(function (resolve, reject) {
            fs.writeFile(filename, resp.content, function (err) {
                if (err) reject(err);
                resolve({
                    message: 'Success',
                    filename: path.basename(filename)
                });
            })
        });
    })
}

module.exports = pdfPrinter;