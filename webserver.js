
var express = require('express');
var app = express();

app.use(express.static('public'));
app.use('/dist', express.static('dist'));

var path = require('path');
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});
app.listen(80);