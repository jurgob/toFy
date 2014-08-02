var express = require('express');
var app = express();
var util = require('util');
var data = require('./data.js');
var sse = require('./sse.js');



a = new data.List("leList","lePassword",[new data.Item("leItem",false,"leAuthor")]);
a.observers.push("cacca");
a.Upload();

data.List.Download("leList",function (value) {	
		console.log(value);
});

console.log(a.Contains("le Item"));

app.all('*', function(req, res, next){
	//Allow cross domain access
	res.header('Access-Control-Allow-Origin', '*');
    	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    	res.header('Access-Control-Allow-Headers', 'X-Requested-With,password,Content-Type');
	next();	
});

app.route('/api/v1/list/:name')
.get(function(req, res){
	data.List.Download(req.params.name, function(list) {
		if (list != null){
			console.log(list);
			res.json(200,list.ToJsonString());
		} else res.send(404);
  	}); 
})

var port = Number(process.env.PORT || 3000);
app.listen(port, function() {
  console.log("Listening on " + port);
});
