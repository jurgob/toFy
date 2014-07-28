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
	ok: 200,
	bad: 400,
	unauthorized: 401,
	notFound: 404,
	conflict: 409,
	preconditionFailed: 412,
	locked: 423
}

var events = {
	unregistered:"UNREG",
	registered:"REG",
	item_added:"ITEM_ADD",
	item_deleted:"ITEM_DEL",
	item_checked:"ITEM_CHK",
	item_unchecked:"ITEM_UNC",
	list_deleted:"LIST_DEL",
	password_changed:"PW_CHANGE"
}

var openConnections = {};

//Clean all the keys
//client.keys("*", function(err, key) {
//  client.del(key, function(err) {
//  });
//});

function logRequest(req) {
	console.log(new Date().toString()+", "+req.ip+", "+req.method+", "+req.path);
}

function logResponse(statusCode) {
	console.log(statusCode);
}


function r(statusCode,list){
	var data = {};
	logResponse(statusCode);
	if (list != undefined)
		return {"status":statusCode,"data":{"list_name":list.name,"list_items":list.items}};
	else return {"status":statusCode};
}

function getList(listName,callback){
	client.get(listName.toLowerCase(), function (err,reply){
		if (reply != null){
			zlib.inflate(new Buffer(reply.toString(), 'base64'),function (err,output){	callback(JSON.parse(output.toString('utf8')));	});
		} else
			callback(null);
	});
}

function setList(listName,password,items){
	list = {"name":listName,"password":password,"items":items};
	zlib.deflate(JSON.stringify(list),function (err,buffer) {
		client.set(listName.toLowerCase(),buffer.toString('base64'));
	});
	//console.log(list);
	return list;
}

function deleteList(listName) {
	client.del(listName);
}


function itemExists(list,itemName) {
	for (i in list.items){
		if (list.items[i].name === itemName)
			return true;
	}
	return false;
}

function itemIndex(list,itemName) {
	for (i in list.items){
		if (list.items[i].name === itemName)
			return i;
		i++;
	}
	return -1;
}

function getPassword(req) {
	b64password = req.get('password');
	if (b64password != undefined)
		return (new Buffer(b64password, 'base64')).toString();
	else 
		return "";
}

function getNewPassword(req) {
	b64password = req.get('newpassword');
	if (b64password != undefined)
		return (new Buffer(b64password, 'base64')).toString();
	else 
		return "";
}

function checkPassword(list,req){
	password = getPassword(req);
	if (list.password === undefined || list.password === null || list.password === "")
		return true;
	else
		return list.password === password;
}

function registerClient(req,res) {
	if (openConnections[req.params.name] === undefined)
		openConnections[req.params.name] = [];
	
	openConnections[req.params.name].push(res);
	console.log("Registered: "+req.ip+" on "+req.params.name+" ["+openConnections[req.params.name].length+"]");
	notifyClients(res,req.params.name,events.registered);
}

function unregisterClient(req,res){
	var toRemove;
	var queue = openConnections[req.params.name];
        if (queue != undefined) {
		for (var j =0 ; j < queue.length ; j++) {
            		if (queue[j] == res) {
                		toRemove =j;
               			break;
            		}
        	}
        
		openConnections[req.params.name].splice(j,1);
		if (openConnections[req.params.name].length === 0)
			delete(openConnections[req.params.name]);
	
		notifyClients(res,req.params.name,events.unregistered);
	
		console.log("Unregistered : "+req.ip+" on "+req.params.name)
	}
}

function notifyClients(source,listName,message,data){
    var queue = openConnections[listName];

    if (data === undefined)
	data = {};

    data["list_name"] = listName;

    if (queue != undefined && queue != null){
	var d = new Date();
	queue.forEach(function(resp) {
        	if (source != resp) {
			resp.write('id: ' + d.getMilliseconds() + '\n');
			//resp.write('list: ' + listName + '\n');
			resp.write('event: '+ message + '\n');
			resp.write('data:' + JSON.stringify(data) +   '\n\n'); // Note the extra newline
		}
    	});
   }
}

app.all('*', function(req, res, next){
	logRequest(req);
	
	//Allow cross domain access
	res.header('Access-Control-Allow-Origin', '*');
    	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    	res.header('Access-Control-Allow-Headers', 'X-Requested-With,password,Content-Type');

	next();	
});


app.put('/api/v1/list/:name/password', function(req, res){
  getList(req.params.name, function(list) {
  	if (list != null){
		if (checkPassword(list,req)){
			list.password =  getNewPassword(req);
			setList(req.params.name,list);
			notifyClients(res,req.params.name,events.password_changed);
			res.json(r(status.ok));
		} 
		else res.json(r(status.unauthorized));
  	} 
  	else res.json(r(status.preconditionFailed));

  });
});

app.get('/api/v1/list/:name/updates', function(req, res){
	getList(req.params.name, function(list) {
		if (list != null){
			if (checkPassword(list,req)){
				req.socket.setTimeout(Infinity);
				res.writeHead(200, {
        				'Content-Type': 'text/event-stream',
        				'Cache-Control': 'no-cache',
        				'Connection': 'keep-alive'
    				});
    				res.write('\n');
				
				registerClient(req,res);

				req.on("close", function() {
    					unregisterClient(req,res);
				});
			}
			else res.json(r(status.unauthorized));
  		} 
		else res.json(r(status.notFound));
  	}); 
})


app.route('/api/v1/list/:name')
.get(function(req, res){
	getList(req.params.name, function(list) {
		if (list != null){
			if (checkPassword(list,req))
				res.json(r(status.ok,list));
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
				notifyClients(res,req.params.name,events.list_deleted);
				delete(openConnections[req.params.name]);	
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
			list = setList(req.params.name,getPassword(req),[]); 
			res.json(r(status.ok,list));
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
					list.items.push({"name":req.params.itemname,"checked":false});		
					setList(req.params.name,list.password,list.items);
					notifyClients(res,req.params.name,events.item_added,{"item":req.params.itemname});
					res.json(r(status.ok,list));
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
  					var idx = itemIndex(list,req.params.itemname);
					list.items.splice(idx,1);
					setList(list.name,list.password,list.items);
					notifyClients(res,req.params.name,events.item_deleted,{"item":req.params.itemname});
					res.json(r(status.ok,list));
	  			} 
				else res.json(r(status.notFound));
			} 
			else res.json(r(status.unauthorized));
  		} 
		else res.json(r(status.preconditionFailed));
	});
});

app.route('/api/v1/list/:name/item/:itemname/checkmark') 
.put(function(req, res){
	getList(req.params.name, function(list) {
		if (list != null){
			if (checkPassword(list,req)){
	  			if (itemExists(list,req.params.itemname)){
					var idx = itemIndex(list,req.params.itemname);
					list.items[idx].checked = true;
					setList(req.params.name,list.password,list.items);
					notifyClients(res,req.params.name,events.item_checked,{"item":req.params.itemname});
					res.json(r(status.ok,list));
  	  			} 
				else res.json(r(status.notFound));
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
  					var idx = itemIndex(list,req.params.itemname);
					list.items[idx].checked = false;
					setList(list.name,list.password,list.items);
					notifyClients(res,req.params.name,events.item_unchecked,{"item":req.params.itemname});
					res.json(r(status.ok,list));
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
