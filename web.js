var express = require('express');
var app = express();
var jf = require('jsonfile');
var util = require('util');
var fs = require('fs');

var status = {
	"ok":200,
	"bad":400,
	"unauthorized":401,
	"notFound":404,
	"conflict":409,
	"preconditionFailed":412
}

var lists = {};
var listsDB = 'data/lists.json';

function saveDB(){
	jf.writeFile(listsDB, lists, function(err) {
		if (err != null)
			console.log(err);
	})
}

function loadDB(){
	jf.readFile(listsDB, function(err, obj) { lists = obj; });
}

function logRequest(req) {
	fs.appendFile('data/log.csv',new Date().toString()+", "+req.ip+", "+req.method+", "+req.path,function (err){});
}

function logResponse(statusCode) {
	fs.appendFile('data/log.csv',", "+statusCode+"\n",function (err){});
}


function r(statusCode,data){
	if (typeof data === "undefined")
		data = {}

	logResponse(statusCode);
	return {"status":statusCode,"data":data};
}

function listExists(listName) {
	return typeof lists[listName] === "object";
}

function itemExists(listName,itemName) {
	return lists[listName].items.lastIndexOf(itemName) != -1;
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

function checkPassword(listName,req){
	password = getPassword(req);
	if (typeof lists[listName].password === "undefined" || lists[listName].password === null || lists[listName].password === "")
		return true;
	else
		return lists[listName].password === password;
}

app.all('*', function(req, res, next){
	logRequest(req);
	next();	
});


app.put('/api/v1/list/:name/password', function(req, res){
  if (listExists(req.params.name)){
	if (checkPassword(req.params.name,req)){
		lists[req.params.name]["password"] =  getNewPassword(req);
		saveDB();
		res.json(r(status.ok));
	} 
	else res.json(r(status.unauthorized));
  } 
  else res.json(r(status.preconditionFailed));
});

app.route('/api/v1/list/:name')
.get(function(req, res){
  if (listExists(req.params.name)){
	if (checkPassword(req.params.name,req))
		res.json(r(status.ok,{items:lists[req.params.name].items}));
	else
		res.json(r(status.unauthorized));
  } else {
  	res.json(r(status.notFound));
  } 
})
.delete(function(req, res){
  if (listExists(eq.params.name)){
	if (checkPassword(req.params.name,req)){
		delete(lists[req.params.name]);
		saveDB();
		res.json(r(status.ok));
	} else
		res.json(r(status.unauthorized));

  } else {
  	res.json(r(status.notFound));
  } 
})
.put(function(req, res){
  if (!listExists(req.params.name)){
	lists[req.params.name] = {"items":[],"password":getPassword(req)}; 
	saveDB();
	res.json(r(status.ok));
  } else {
  	res.json(r(status.conflict));
  } 
});

app.route('/api/v1/list/:name/item/:itemname') 
.put(function(req, res){
  if (listExists(req.params.name)){
	if (checkPassword(req.params.name,req)){
	  if (!itemExists(req.params.name,req.params.itemname)){
		lists[req.params.name].items.push(req.params.itemname);		
		saveDB();
		res.json(r(status.ok,{"items":lists[req.params.name].items}));
  	  } else {
  		res.json(r(status.conflict));
	  } 
	} else
		res.json(r(status.unauthorized));
  } else {
  	res.json(r(status.preconditionFailed));
  } 
})
.delete(function(req, res){
	if (listExists(req.params.name)){
		if (checkPassword(req.params.name,req)){
	  		if (itemExists(req.params.name,req.params.itemname)){
  				var idx = lists[req.params.name].items.lastIndexOf(req.params.itemname);
				lists[req.params.name].items.splice(idx,1);
				saveDB();
				res.json(r(status.ok,{"items":lists[req.params.name].items}));
	  		} 
			else res.json(r(status.notFound));
		} 
		else res.json(r(status.unauthorized));
  	} 
	else res.json(r(status.preconditionFailed));
});

app.get('/', function(req, res){
  res.sendfile(__dirname + '/index.html');
});

app.all('*', function(req, res){
	res.json(r(status.bad));
});


loadDB();
var port = Number(process.env.PORT || 3000);
app.listen(port, function() {
  console.log("Listening on " + port);
});
