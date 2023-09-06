const http = require('http');
const fs = require('fs');
const path = require("path");

http.ServerResponse.prototype.endJSON = function (statusCode, jsonStr) {
    if (typeof jsonStr != 'string') {
        jsonStr = JSON.stringify(jsonStr);
    }

    this.endFile(statusCode, {
        content: jsonStr,
        contentType: 'application/json; charset=utf-8',
    });
};

http.ServerResponse.prototype.endLocalFile = async function(filePath) {
    let stat = await fs.promises.stat(filePath);
    this.sendDate = false;
    this.writeHead(200, {
        'Content-Type': getContentType(filePath),
        'Content-Length': stat.size,
    });
    fs.createReadStream(filePath).pipe(this);
};

http.ServerResponse.prototype.endFile = function(statusCode, fileInfo) {
    this.sendDate = false;
    this.statusCode = statusCode;
    this.setHeader('Content-Type', fileInfo.contentType || 'application/octet-stream');
    this.setHeader('Content-Length', Buffer.byteLength(fileInfo.content, 'utf8'));
    if (fileInfo.fileName) {
        this.setHeader('Content-Disposition', 'attachment; filename="'+fileInfo.fileName+'"');
    }
    this.write(fileInfo.content);
    this.end();
};

http.ServerResponse.prototype.redirect = function (statusCode, Location) {
    this.writeHead(statusCode, {Location});
    this.end();
};

http.IncomingMessage.prototype.readBody = function () {
    let msg = this;

    return new Promise((resolve, reject) => {
        let buffers = [];

        msg.on('data', function (buffer) {
            buffers.push(buffer);
        });

        msg.on('end', function () {
            resolve(Buffer.concat(buffers).toString());
        });
    });
};

http.IncomingMessage.prototype.readJSON = async function () {
    return JSON.parse(await this.readBody());
};

http.ServerResponse.prototype.nestQueryParams = function(query) {
    const result = {};

    for (const key in query) {
        const keys = key.split('.');
        let nestedObj = result;

        for (let i = 0; i < keys.length - 1; i++) {
            const nestedKey = keys[i];

            if (!nestedObj.hasOwnProperty(nestedKey)) {
                nestedObj[nestedKey] = {};
            }

            nestedObj = nestedObj[nestedKey];
        }

        nestedObj[keys[keys.length - 1]] = query[key];
    }

    return result;
}

http.ServerResponse.prototype.parseCSVtoIcal = function( csv, headerRow, repeat, allDayTime ) {
    csv = csv.replace(/"(.*?)"/g, (str) => str.replaceAll(',', '###COMMA###'));
    const rows = csv.trim().split('\n');
    if( headerRow >= 1 ) {
        rows.shift();
        if( headerRow === 2 ) rows.shift();
    }
    let dateColumn = null;
    rows.forEach( (row, rowIndex) => {
        if( ! dateColumn ) {
            row.split(',').forEach((cell, columnIndex) => {
                if (/^\d{4}-\d{2}-\d{2}$/.test(cell)) {
                    dateColumn = columnIndex;
                }
            });
        }
    });

    // No date column found
    if( dateColumn === null ) {
        console.log('Error: No date field found in CSV');
        return false;
    }

    let ical = 'BEGIN:VCALENDAR\r\n' +
        'VERSION:2.0\r\n' +
        'NAME:My csv Calendar\r\n' +
        'X-WR-CALNAME:My csv Calendar\r\n' +
        'PRODID:-//https://github.com/VictorLereniusMarketzoo/csv-to-ical//Victor//EN\r\n' +
        'CALSCALE:GREGORIAN\r\n' +
        'METHOD:PUBLISH\r\n';

    rows.forEach( (row, index) => {
        let cells = row.split(',');
        let date = cells[dateColumn];

        // Skip empty rows
        if( ! date ) return;

        // Skip invalid dates
        if ( /^\d{4}-\d{2}-\d{2}$/.test( date ) === false ) return;

        date = date.toString().replace( /[^\d]/g, '' );

        // Remove date column
        cells.splice(dateColumn, 1);

        ical = ical + 'BEGIN:VEVENT\r\n';

        if( repeat === 'yearly' ) ical = ical + 'RRULE:FREQ=YEARLY;INTERVAL=1;WKST=SU\r\n';

        ical = ical + 'UID:' + date + '@' + cells[0].toString().replaceAll(/[^A-Za-z0-9]+/g,'-') + '\r\n' +
            'DTSTAMP:' + date + 'T130000Z\r\n';
        if( allDayTime ) {
            ical = ical + 'DTSTART:' + date + 'T' + allDayTime.replaceAll(/[^0-9]+/g,'').substring(0,4) + '00Z\r\n';
            ical = ical + 'DTEND:' + date + 'T' + ( Math.round(allDayTime.replaceAll(/[^0-9]+/g,'').substring(0,4)) + 100 ).toString().padStart(4, '0') + '00Z\r\n';
        } else {
            ical = ical + 'DTSTART;VALUE=DATE:' + date + '\r\n' +
                'DTEND;VALUE=DATE:' + date + '\r\n';
        }
        ical = ical + 'SUMMARY:' + cells[0].toString().replaceAll('###COMMA###', ',') + '\r\n' +
            'DESCRIPTION:' + cells.join(', ').replaceAll('###COMMA###', ',').replaceAll(/, , /g,', ') + '\r\n' +
            'END:VEVENT\r\n';
    });

    ical = ical + 'END:VCALENDAR';

    return ical;
}

function getContentType(filePath) {
    let mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.ico': 'image/x-icon',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp3': 'audio/mp4',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
    };

    let extname = String(path.extname(filePath)).toLowerCase();
    return mimeTypes[extname] || 'application/octet-stream';
}