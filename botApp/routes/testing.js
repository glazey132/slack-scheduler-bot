var apiai = require('apiai');

var app = apiai("1d36f054b49a4cc482a67a02dcea08d1");

var request = app.textRequest('scheudule this now', {
    sessionId: 'bob'
});

request.on('response', function(response) {
    console.log(response);
});

request.on('error', function(error) {
    console.log(error);
});

request.end();
