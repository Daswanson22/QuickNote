var express = require('express');
var router = express.Router();
var path = require("path");
const fs = require('fs');

/* GET home page. */
router.get('/', function(req, res, next) 
{
    res.render('index');
});

router.get('/notes', function(req, res, next)
{
    res.render('notes');
});

module.exports = router;