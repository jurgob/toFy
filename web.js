var express = require('express');
var app = express();

app.get('/list/:name', function(req, res){
  res.send('list: ' + req.params.name);
});

app.delete('/list/:name', function(req, res){
  res.send('deleted list: ' + req.params.name);
});

app.put('/list/:name/item/:itemname', function(req, res){
  res.send('added item '+ req.params.itemname+' to list: ' + req.params.name);
});

var port = Number(5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});
