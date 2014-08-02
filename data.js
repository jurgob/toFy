var zlib = require('zlib');
var redis = require('redis');
var url = require('url');
var redisURL = url.parse(process.env.REDISCLOUD_URL);
var client = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});
client.auth(redisURL.auth.split(":")[1]);
client.on("error", function (err) {
        console.log("Redis: "+err);
});

module.exports = {
	List : function (name, password, items) {
		this.name = name;
		this.password = password;
		if (items == undefined)
			this.items = [];
		else
			this.items = items;
		this.observers = [];
		this.devices = [];
	},
	Item : function (name, checkmark, last_author){
		this.name = name;
		this.last_author = last_author;
		this.checkmark = checkmark;
	},
}

module.exports.List.prototype = { 
	ToJsonString: function () {
		return JSON.stringify({"name":this.name,"items":this.items,"observers":this.observers});
	},
	ToCompressedRecord: function (callback) {
		zlib.deflate(JSON.stringify({"name":this.name,"items":this.items,"password":this.password}),function (err,buffer) {
			callback(buffer.toString('base64'));
		});
	},
	Upload : function(){
		var thisList = this;
		this.ToCompressedRecord(function (value) {
			client.set(thisList.name.toLowerCase(), value);
		});
	},
	Contains : function(item_name) {
		for (i in this.items){
			if (this.items[i].name === item_name)
				return true;
		}
		return false;
	}
}

module.exports.List.ParseCompressedRecord = function(record,callback){
	zlib.inflate(new Buffer(record, 'base64'),function (err,output){	
		obj = JSON.parse(output.toString('utf8'));	
		callback(new module.exports.List(obj.name,obj.password,obj.items));		
	});
}

module.exports.List.Download = function(name,callback){
	client.get(name.toLowerCase(), function (err,reply){
		if (reply != null)
			module.exports.List.ParseCompressedRecord(reply.toString(),callback);
		else callback(null);
	});
}

module.exports.List.Delete = function(name) {
	client.del(name.toLowerCase());
}

module.exports.Item.prototype = {
	ToJsonString: function () {
		return JSON.stringify(this);
	}
}

module.exports.Item.ParseJsonString = function (string) {
	obj = JSON.parse(output.toString('utf8'));
	return new Item(obj.name,obj.checkmark,obj.last_author);
}

