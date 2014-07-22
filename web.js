var express = require('express');
var app = express();

var lists = {"cestil":{"items":["cane","gato"]}};

app.get('/list/:name', function(req, res){
  if (typeof(lists[req.params.name]) == "object"){
	res.json({status:200,data:{items:lists[req.params.name]}});
  } else {
  	res.json({status:404});
  } 
});

app.delete('/list/:name', function(req, res){
  if (typeof(lists[req.params.name]) == "object"){
	delete(lists[req.params.name]);
	res.json({status:200,data:{}});
  } else {
  	res.json({status:404});
  } 
});

app.put('/list/:name', function(req, res){
  if (typeof(lists[req.params.name]) == "object"){
  	res.json({status:409});
  } else {
	lists[req.params.name] = {items:[]};
	res.json({status:200,data:{}});
  } 
});

app.put('/list/:name/item/:itemname', function(req, res){
  if (typeof(lists[req.params.name]) == "object"){
	  if (typeof(lists[req.params.name]) == "object"){
  		res.json({status:409});
  	  } else {
		lists[req.params.name] = {items:[]};
		res.json({status:200,data:{}});
	  }   
  } else {
  	res.json({status:412});
  } 
});

app.delete('/list/:name/item/:itemname', function(req, res){
  if (typeof(lists[req.params.name]) == "object"){
	res.json({status:200,data:{items:lists[req.params.name]}});
  } else {
  	res.json({status:412});
  } 
});

app.get('/', function(req, res){
  res.sendfile(__dirname + '/index.html');
});


var port = Number(process.env.PORT || 3000);
app.listen(port, function() {
  console.log("Listening on " + port);
});
