module.exports = {

    execute: async function(req, res) {

        /* VERIFY INPUT */

        if (!req.query.source) {
            return res.endJSON(400, {error: 'missed required parameter: url'});
        }

        if ( /^https?:\/\/[a-zA-Z0-9\-\/\.\?=_]+$/.test( req.query.source ) === false ) {
            return res.endJSON(400, {error: 'invalid url: '+req.query.source});
        }

        /* DOWNLOAD CSV */
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
        }
        const axios = require('axios');
        axios.get( req.query.source, {
            headers,
        } ).then(response => {
            console.log(response.data);
            const ical = res.parseCSVtoIcal( response.data, req.query.headerRow, req.query.repeat, req.query.allDayTime );

            // Set the response status and headers
            res.writeHead(200, { 'Content-Type': 'text/calendar' });

            // Return the content fetched from the secret URL
            res.end(ical);
        })
        .catch(error => {
            console.error("There was an error!", error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Server Error');
        });;
    },

};