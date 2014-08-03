var express = require('express');
var https = require('https');
var http = require('http');
var fs = require('fs');
var app = express();
var bodyParser  = require('body-parser');
var util = require('util');
var data = require('./data.js');
var sse = require('./sse.js');
var communication = require('./communication.js');

app.use(bodyParser.json());

app.all('*', function(req, res, next){
	//Allow cross domain access
	res.header('Access-Control-Allow-Origin', '*');
    	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    	res.header('Access-Control-Allow-Headers', 'X-Requested-With,password,Content-Type');
	next();	
});


function listExists(req,res,callback) {
	data.List.Download(req.params.listname, function(list) {
		if (list != null){
			callback(req,res,list)
		} else communication.Response.NotFound(res);
	});
}

function listNotExists(req,res,callback) {
	data.List.Download(req.params.listname, function(list) {
		if (list == null){
			callback(req,res,list)
		} else communication.Response.Conflict(res);
	});
}


function isAuthorized(req,res,list,callback) {
	if (list.CheckPassword(communication.Request.GetPassword(req))){
		callback(req,res,list);
	} else {
		communication.Response.WrongPassword(res);
	}
}

function itemExists(req,res,list,callback) {
	if (list.Contains(req.params.itemname)){
		callback(req,res,list);
	} else {
		communication.Response.NotFound(res);
	}
}

function itemNotExists(req,res,list,callback) {
	if (!list.Contains(req.params.itemname)){
		callback(req,res,list);
	} else {
		communication.Response.Conflict(res);
	}
}


app.route('/api/v1/list/:listname')
.get(function(req, res){
	listExists(req,res, function(req,res,list) {
		isAuthorized(req,res,list, function(req,res,list) {
			communication.Response.GetOk(res,list);
		});
	});
})
.put(function(req, res){
	listNotExists(req,res, function(req,res,list) {
		var its = [];
		if (req.body.items != undefined)
			its = req.body.items;

		l = new data.List(req.params.listname,req.body.password,its);
		l.Upload();
		communication.Response.PutOk(res);
	});
})
.delete(function(req, res){
	listExists(req,res, function(req,res,list) {
		isAuthorized(req,res,list, function(req,res,list) {
			data.List.Delete(list.name);
			communication.Response.DelOk(res);
		});
	});
})

var port = Number(process.env.PORT || 3000);
var httpServer = http.createServer(app);

var portssl = Number(process.env.PORT || 3333);
var credentials = {key: process.env.SSL_KEY, cert: process.env.SSL_CERT};
var httpsServer = https.createServer(credentials, app);


httpsServer.listen(portssl, function(){
  console.log("HTTPS server listening on port " + portssl);
});

httpServer.listen(port, function() {
  console.log("HTTP server istening on port " + port);
});
