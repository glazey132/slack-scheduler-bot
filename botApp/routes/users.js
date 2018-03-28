//express server routes for authenticated users. CURRENTLY UNUSED
//we must run our app with a special command
//since index.js and users.js are run through .bin/www

var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
