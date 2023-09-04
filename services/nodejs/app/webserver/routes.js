module.exports = {

    // serve static content (from /public directory)
    '_static': require('./controllers/static'),

    '/healthcheck': require('./controllers/healthcheck'),

    '/api/csv': require('./controllers/api/csv'),

};
