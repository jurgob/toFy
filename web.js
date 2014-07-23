var express = require('express');
var app = express();

var lists = {"cestil":{"items":["cane","gatto","pollo"]}};

app.get('/api/v1/list/:name', function(req, res){
  if (typeof(lists[req.params.name]) == "object"){
	res.json({status:200,data:{items:lists[req.params.name]}});
  } else {
  	res.json({status:404});
  } 
});

app.delete('/api/v1/list/:name', function(req, res){
  if (typeof(lists[req.params.name]) == "object"){
	delete(lists[req.params.name]);
	res.json({status:200,data:{}});
  } else {
  	res.json({status:404});
  } 
});

app.put('/api/v1/list/:name', function(req, res){
  if (typeof(lists[req.params.name]) == "object"){
  	res.json({status:409});
  } else {
	lists[req.params.name] = {items:[]};
	res.json({status:200,data:{}});
  } 
});

app.put('/api/v1/list/:name/item/:itemname', function(req, res){
  if (typeof(lists[req.params.name]) == "object"){
	  if (lists[req.params.name].items.lastIndexOf(req.params.itemname) == -1){
		lists[req.params.name].items.push(req.params.itemname);		
		res.json({status:200,data:{}});
  	  } else {
  		res.json({status:409});
	  } 
  } else {
  	res.json({status:412});
  } 
});

app.delete('/api/v1/list/:name/item/:itemname', function(req, res){
  if (typeof(lists[req.params.name]) == "object"){
	  if (lists[req.params.name].items.lastIndexOf(req.params.itemname) == -1){
		res.json({status:404});
	  } else {
  		var idx = lists[req.params.name].items.lastIndexOf(req.params.itemname);
		lists[req.params.name].items.splice(idx,1);
		res.json({status:200,data:{}});
	  } 
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
