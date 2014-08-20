var data = require('./data.js');
var communication = require('./communication.js');
var sse = require('./sse.js');
var bodyParser  = require('body-parser');

function notifyObservers(req,res,list,event,item_name) {
		list.GetObservers().forEach(function(observer) {
			if ((observer.IsDevice() && communication.Request.GetDeviceId(req) != observer.deviceId) || (observer.IsBrowser() && res != observer.connection)){
				sse.notify(observer,event,list.name,item_name,communication.Request.GetAuthor(req));	
			}
		});
	}


module.exports = {
	listExists: function (req,res,listName,callback) {
		data.List.Download(listName, function(list) {
			if (list != null){
				callback(req,res,list)
			} else communication.Response.NotFound(res);
		});
	},
	listNotExists: function (req,res,listName,callback) {
		data.List.Download(listName, function(list) {
			if (list == null){
				callback(req,res)
			} else communication.Response.Conflict(res);
		});
	},
	isAuthorized: function (req,res,list,callback) {
		if (list.CheckPassword(communication.Request.GetPassword(req))){
			callback(req,res,list);
		} else {
			communication.Response.WrongPassword(res);
		}
	},
	itemExists:function (req,res,itemName,list,callback) {
		if (list.Contains(itemName)){
			callback(req,res,list);
		} else {
			communication.Response.NotFound(res);
		}
	},
	itemNotExists: function (req,res,itemName,list,callback) {
		if (!list.Contains(itemName)){
			callback(req,res,list);
		} else {
			communication.Response.Conflict(res);
		}
	},
	deviceExists: function(req,res,deviceId,list,callback) {
		for (index in list.GetObservers()) {
			if (list.GetObservers()[index].deviceId === deviceId){
				callback(req,res,deviceId,list);
				return;
			}
		}
		communication.Response.NotFound(res);
	},
	deviceNotExists: function(req,res,deviceId,list,callback) {
		for (index in list.GetObservers()) {
			if (list.GetObservers()[index].deviceId === deviceId){
				communication.Response.Created(res);
				return;
			}
		}
		callback(req,res,deviceId,list);
	},
	connectionNotExists: function(req,res,list,callback) {
		for (index in list.GetObservers()) {
			if (list.GetObservers()[index].connection === res){
				communication.Response.GetOk(res);
				return;
			}
		}
		callback(req,res,list);
	},


	
	isValidListPost: function (req,res,callback) {
		if (req.body.name != undefined){
			if (req.body.items == undefined)
				req.body.items = [];

			callback(req,res);
		} else {
			communication.Response.WrongObject(res);
		}
	},
	isValidItemPost: function (req,res,list,callback) {
		if (req.body.name != undefined){
			if (req.body.checked == undefined)
				req.body.checked = false;

			callback(req,res,list);
		} else {
			console.log(req.body);
			communication.Response.WrongObject(res);
		}
	},
	isValidItemChange: function (req,res,list,callback) {
		if (req.body.name != undefined && list.GetIndexFromName(req.body.name) != -1 ||
		    (req.body.index != undefined && (req.body.index < 0 || req.body.index >= list.length)) ||
		    (req.body.checked != undefined && req.body.cecked != true && req.body.checked != false))
			communication.Response.WrongObject(res);
		else
			callback(req,res,list);
	},


	performListGet: function (req,res,list) {
		communication.Response.GetOk(res,list);
	},
	performListPost: function (req,res) {
		var list = new data.List(req.body.name,req.body.password,req.body.items);
		list.Upload();
		communication.Response.Created(res);
	},
	performListDel: function (req,res,list) {
		data.List.Delete(list.name);
		communication.Response.DelOk(res);
		notifyObservers(req,res,list,sse.Events.list_deleted,list.name)
	},
	performPasswordChange: function (req,res,list) {
		list.password = req.body.password;
		list.Upload();
		communication.Response.Created(res);
		notifyObservers(req,res,list,sse.Events.password_changed)
	},
	performItemAdd: function (req,res,list) {
		var itm = new data.Item(req.body.name,req.body.checked,communication.Request.GetAuthor(req));
		list.items.push(itm);
		list.Upload();
		communication.Response.Created(res);
		notifyObservers(req,res,list,sse.Events.item_added,itm.name)
	},
	performItemGet: function (req,res,list) {
		var idx = list.GetIndexFromName(req.params.itemname);
		var itm = list.items[idx];
		communication.Response.GetOk(res,itm);
	},
	performItemDel: function (req,res,list) {
		var idx = list.GetIndexFromName(req.params.itemname);
		var itm = list.items[idx];
		list.items.splice(idx,1);
		list.Upload();
		communication.Response.DelOk(res);
		notifyObservers(req,res,list,sse.Events.item_deleted,itm.name)
	},
	performItemChange: function (req,res,list) {
		var idx = list.GetIndexFromName(req.params.itemname);
		var itm = list.items[idx];
		
		if(req.body.name != undefined)
			itm.name = req.body.name;

		if (req.body.index != undefined) {
			list.items.splice(idx,1);
			list.items.splice(req.body.index,0,itm);
		}

		if (req.body.checked != undefined){
			itm.checked = req.body.checked;
		}

		if (communication.Request.GetAuthor(req) != undefined)
			itm.last_author = req.headers["Author"];

		list.Upload();
		communication.Response.Created(res);
		notifyObservers(req,res,list,sse.Events.item_changed,itm.name);
	},

	registerForServerSentEvents: function(req,res,list) {
		var obs = new data.Observer(communication.Request.GetAuthor(req),res);
		list.GetObservers().push(obs);
		req.socket.setTimeout(Infinity);
			
		res.writeHead(200, {'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache','Connection': 'keep-alive'});
    		res.write('\n');
				
		req.on("close", function() {
			module.exports.unregisterForServerSentEvents(req,res,list,obs);    			
		});

		notifyObservers(req,res,list,sse.Events.registered);
	},
	unregisterForServerSentEvents: function(req,res,list,observer) {
		idx = list.GetObservers().indexOf(observer);
		list.GetObservers().splice(idx,1);
		notifyObservers(req,res,list,sse.Events.unregistered);
	},
	registerForApplePushNotifications: function(req,res,deviceid,list) {
		var obs = new data.Observer(communication.Request.GetAuthor(req),undefined,deviceid);
		list.GetObservers().push(obs);
		communication.Response.Created(res);
		notifyObservers(req,res,list,sse.Events.registered);
	},
	unregisterFromApplePushNotifications: function(req,res,deviceId,list) {
		for (index in list.GetObservers()) {
			if (list.GetObservers()[index].deviceId === deviceId){
				list.GetObservers().splice(index,1);
				communication.Response.DelOk(res);
				notifyObservers(req,res,list,sse.Events.unregistered);
				break;
			}
		}
	},
}
