var express = require('express');
var app = express();
var util = require('util');
var zlib = require('zlib');

var redis = require('redis');
var url = require('url');
var redisURL = url.parse(process.env.REDISCLOUD_URL);
var client = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});
client.auth(redisURL.auth.split(":")[1]);
client.on("error", function (err) {
        console.log("Redis: "+err);
});

var status = {
	"ok":200,
	"bad":400,
	"unauthorized":401,
	"notFound":404,
	"conflict":409,
	"preconditionFailed":412
}


function logRequest(req) {
	console.log(new Date().toString()+", "+req.ip+", "+req.method+", "+req.path);
}

function logResponse(statusCode) {
	console.log(statusCode);
}


function r(statusCode,data){
	if (typeof data === "undefined")
		data = {}

	logResponse(statusCode);
	return {"status":statusCode,"data":data};
}

function getList(listName,callback){
	client.get(listName, function (err,reply){
		if (reply != null){
			zlib.inflate(new Buffer(reply.toString(), 'base64'),function (err,output){	callback(JSON.parse(output.toString('utf8')));	});
		} else
			callback(null);
	});
}

function setList(listName,list){
	zlib.deflate(JSON.stringify(list),function (err,buffer) {
		client.set(listName,buffer.toString('base64'));
	});
}

function deleteList(listName) {
	client.del(listName);
}


function itemExists(list,itemName) {
	return list.items.lastIndexOf(itemName) != -1;
}

function getPassword(req) {
	b64password = req.get('password');
	if (typeof b64password != "undefined")
		return (new Buffer(b64password, 'base64')).toString();
	else 
		return "";
}

function getNewPassword(req) {
	b64password = req.get('newpassword');
	if (typeof b64password != "undefined")
		return (new Buffer(b64password, 'base64')).toString();
	else 
		return "";
}

function checkPassword(list,req){
	password = getPassword(req);
	if (typeof list.password === "undefined" || list.password === null || list.password === "")
		return true;
	else
		return list.password === password;
}

app.all('*', function(req, res, next){
	logRequest(req);
	next();	
});


app.put('/api/v1/list/:name/password', function(req, res){
  getList(req.params.name, function(list) {

  	if (list != null){
		if (checkPassword(list,req)){
			list.password =  getNewPassword(req);
			setList(req.params.name,list);
			res.json(r(status.ok));
		} 
		else res.json(r(status.unauthorized));
  	} 
  	else res.json(r(status.preconditionFailed));

  });
});

app.route('/api/v1/list/:name')
.get(function(req, res){
	getList(req.params.name, function(list) {
		if (list != null){
			if (checkPassword(list,req))
				res.json(r(status.ok,{"items":list.items}));
			else res.json(r(status.unauthorized));
  		} 
		else res.json(r(status.notFound));
  	}); 
})
.delete(function(req, res){
	getList(req.params.name, function(list) {
 		if (list != null){
			if (checkPassword(list,req)){
				deleteList(req.params.name);		
				res.json(r(status.ok));
			} 
			else res.json(r(status.unauthorized));
  		} 
		else res.json(r(status.notFound));
	});
})
.put(function(req, res){
	getList(req.params.name, function(list) {
		if (list === null){
			setList(req.params.name,{"items":[],"password":getPassword(req)}); 
			res.json(r(status.ok));
  		} 
		else res.json(r(status.conflict));
  	}); 
});

app.route('/api/v1/list/:name/item/:itemname') 
.put(function(req, res){
	getList(req.params.name, function(list) {
		if (list != null){
			if (checkPassword(list,req)){
	  			if (!itemExists(list,req.params.itemname)){
					list.items.push(req.params.itemname);		
					setList(req.params.name,list);
					res.json(r(status.ok,{"items":list.items}));
  	  			} 
				else res.json(r(status.conflict));
			} 
			else res.json(r(status.unauthorized));
  		} 
		else res.json(r(status.preconditionFailed));
	});
})
.delete(function(req, res){
	getList(req.params.name, function(list) {
		if (list != null){
			if (checkPassword(list,req)){
	  			if (itemExists(list,req.params.itemname)){
  					var idx = list.items.lastIndexOf(req.params.itemname);
					list.items.splice(idx,1);
					setList(req.params.name,list);
					res.json(r(status.ok,{"items":list.items}));
	  			} 
				else res.json(r(status.notFound));
			} 
			else res.json(r(status.unauthorized));
  		} 
		else res.json(r(status.preconditionFailed));
	});
});

app.get('/', function(req, res){
  res.sendfile(__dirname + '/index.html');
});

app.all('*', function(req, res){
	res.json(r(status.bad));
});


var port = Number(process.env.PORT || 3000);
app.listen(port, function() {
  console.log("Listening on " + port);
});
