module.exports = {

    execute: async function(req, res) {

        /* VERIFY INPUT */

        if (!req.query.source) {
            return res.endJSON(400, {error: 'missed required parameter: url'});
        }

        if ( /^https?\:\/\/[a-zA-Z0-9\-\/\.\?\=]+$/.test( req.query.source ) === false ) {
            return res.endJSON(400, {error: 'invalid url'});
        }

        /* DOWNLOAD CSV */
        try {
            const axios = require('axios').default;
            const secretResponse = await axios.get( req.query.source );

            const ical = res.parseCSVtoIcal( secretResponse.data, req.query.headerRow, req.query.repeat )

            // Set the response status and headers
            res.writeHead(200, { 'Content-Type': 'text/plain' });

            // Return the content fetched from the secret URL
            res.end(ical);
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Server Error');
        }
    },

};