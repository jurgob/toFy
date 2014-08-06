var express = require('express');
var https = require('https');
var http = require('http');
var fs = require('fs');
var app = express();
var bodyParser  = require('body-parser');
var util = require('util');
var control = require('./control.js');
app.use(bodyParser.json());

app.all('*', function(req, res, next){
	//Allow cross domain access
	res.header('Access-Control-Allow-Origin', '*');
    	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    	res.header('Access-Control-Allow-Headers', 'X-Requested-With,password,Content-Type');
	next();	
});

app.route('/api/v1/lists')
.post(function(req, res){
	control.isValidListPost(req,res,function(req,res) {
		control.listNotExists(req,res,req.body.name, function(req,res) {	
			control.performListPost(req,res);
		});
	});
})


app.route('/api/v1/lists/:listname')
.get(function(req, res){
	control.listExists(req,res, req.params.listname, function(req,res,list) {
		control.isAuthorized(req,res,list, function(req,res,list) {
			control.performListGet(req,res,list);
		});
	});
})
.delete(function(req, res){
	control.listExists(req,res, req.params.listname, function(req,res,list) {
		control.isAuthorized(req,res,list, function(req,res,list) {
			control.performListDel(req,res,list);
		});
	});
})

app.route('/api/v1/lists/:listname/password')
.put(function(req,res){
	control.listExists(req,res, req.params.listname, function(req,res,list) {
		control.isAuthorized(req,res,list, function(req,res,list) {
			control.performPasswordChange(req,res,list);
		});
	});	
});

app.route('/api/v1/lists/:listname/items')
.post(function(req,res){
	control.listExists(req,res, req.params.listname, function(req,res,list) {
		control.isAuthorized(req,res,list, function(req,res,list) {
			control.isValidItemPost(req,res,list,function(req,res,list) {
				control.itemNotExists(req,res,req.body.name,list,function(req,res,list){
					control.performItemAdd(req,res,list);
				});
			});
		});
	});
});

app.route('/api/v1/lists/:listname/items/:itemname')
.get(function(req,res){
	control.listExists(req,res, req.params.listname, function(req,res,list) {
		control.isAuthorized(req,res,list, function(req,res,list) {
			control.itemExists(req,res,req.params.itemname,list,function(req,res,list){
				control.performItemGet(req,res,list);
			});
		});
	});
	
})
.delete(function(req,res){
	control.listExists(req,res, req.params.listname, function(req,res,list) {
		control.isAuthorized(req,res,list, function(req,res,list) {
			control.itemExists(req,res,req.params.itemname,list,function(req,res,list){
				control.performItemDel(req,res,list);
			});
		});
	});
})
.patch(function(req,res){
	control.listExists(req,res, req.params.listname, function(req,res,list) {
		control.isAuthorized(req,res,list, function(req,res,list) {
			control.itemExists(req,res,req.params.itemname,list,function(req,res,list){
				control.performItemChange(req,res,list);
			});
		});
	});
});


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
