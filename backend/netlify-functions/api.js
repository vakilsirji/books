const serverless = require('serverless-http');
const app = require('../app');

module.exports.handler = serverless(app, {
    request(req, event) {
        req.netlifyEvent = event;
        req.rawBody = event.isBase64Encoded
            ? Buffer.from(event.body || '', 'base64').toString('utf8')
            : event.body;
    }
});
