var zlib = require('zlib');
var redis = require('redis');
var url = require('url');

//var localMemory = [];
var localMemory = null;
var observers = {};

if (localMemory === null) {
	var redisURL = url.parse(process.env.REDISCLOUD_URL);
	var client = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});
	client.auth(redisURL.auth.split(":")[1]);
	client.on("error", function (err) {
        	console.log("Redis: "+err);
	});
}

module.exports = {
	List : function (name, password, items) {
		this.name = name;
		this.password = password;
		if (items == undefined)
			this.items = [];
		else
			this.items = items;
	},
	Item : function (name, checked, last_author){
		this.name = name;
		this.last_author = last_author;
		this.checked = checked;
	},
	Observer: function (name, connection, deviceId){
		this.name = name;
		
		if (deviceId != undefined)
			this.deviceId = deviceId;
		else
			this.connection = connection;
	}
}

module.exports.Observer.prototype = {
	IsDevice : function () {
		return this.deviceId != undefined;
	},
	IsBrowser : function () {
		return this.connection != undefined;
	}
}

module.exports.List.prototype = { 
	ToJsonString: function () {
		obs_names = [];
		//this.GetObservers().foreach(function(observer){ obs_names.push(observer.name);});
		for (idx in this.GetObservers())
			obs_names.push(this.GetObservers()[idx].name);
		
		return JSON.stringify({'name':this.name,'items':this.items,'observers':obs_names});
	},
	ToCompressedRecord: function (callback) {
		zlib.deflate(JSON.stringify(this),function (err,buffer) {
			callback(buffer.toString('base64'));
		});
	},
	Upload : function(){
		if (localMemory === null) {
			var thisList = this;
			this.ToCompressedRecord(function (value) {
				client.set(thisList.name.toLowerCase(), value);
			});
		} else {
			localMemory[this.name] = this;
		}
	},
	Contains : function(item_name) {
		for (i in this.items){
			if (this.items[i].name.toLowerCase() === item_name.toLowerCase())
				return true;
		}
		return false;
	},
	CheckPassword : function(password) {
		if (this.password == null || this.password == undefined || this.password == "")
			return true;
		else
			return this.password === password;
	},
	GetIndexFromName : function (name) {
		for (i in this.items){
			if (this.items[i].name === name)
				return i;
		}
		return -1;
	},
	GetObservers : function() {
		if (observers[this.name] === undefined)
			observers[this.name] = [];

		return observers[this.name];
	}
}

module.exports.List.ParseCompressedRecord = function(record,callback){
	zlib.inflate(new Buffer(record, 'base64'),function (err,output){	
		obj = JSON.parse(output.toString('utf8'));
		if (obj.items != undefined && obj.items != null)
			for (i in obj.items){
				obj.items[i].__proto__ = module.exports.Item.prototype;
			}
		obj.__proto__ = module.exports.List.prototype;	
		callback(obj);		
	});
}

module.exports.List.Download = function(name,callback){
	if (localMemory === null) {
		client.get(name.toLowerCase(), function (err,reply){
			if (reply != null)
				module.exports.List.ParseCompressedRecord(reply.toString(),callback);
			else callback(null);
		});
	} else {
		if (localMemory[name.toLowerCase()] != undefined)
			callback(localMemory[name.toLowerCase()]);
		else
			callback(null);
	}
}

module.exports.List.Delete = function(name) {
	if (localMemory === null)
		client.del(name.toLowerCase());
	else {
		delete(localMemory[name.toLowerCase()]);
	}	
}

module.exports.Item.prototype = {
	ToJsonString: function () {
		return JSON.stringify(this);
	}
}

module.exports.Item.ParseJsonString = function (string) {
	obj = JSON.parse(output.toString('utf8'));
	return new Item(obj.name,obj.checked,obj.last_author);
}
