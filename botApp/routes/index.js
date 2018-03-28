//express server routes. we must run our app with a special command
//since index.js and users.js are run through .bin/www
var express = require('express');
var router = express.Router();
var passport = require('passport');
var google = require('../google');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/setup', function(req, res) {
  var url = google.generateAuthUrl();
  res.redirect(url);
})
router.get('/google/callback', function(req, res, next) {
  google.getToken(req.query.code)
    .then(function (tokens) {
      return google.createCalendarEvent(tokens, 'MY LAST TEST!! >:)', '2018-03-30')
    })
    .then(function() {
      res.send('CREATED YOUR EVENT!!! :)')
    })
    .catch(function (err) {
      console.log('ERROR receiving token', err);
      res.status(500).send('Sorry we were unable to receive the Google token')
    });
})


module.exports = router;
