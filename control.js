var data = require('./data.js');
var communication = require('./communication.js');
var bodyParser  = require('body-parser');

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
			if (req.body.checkmark == undefined)
				req.body.checkmark = false;

			callback(req,res,list);
		} else {
			communication.Response.WrongObject(res);
		}
	},
	isValidItemChange: function (req,res,list,callback) {
		if (req.body.name != undefined && list.GetIndexFromName(req.body.name) != -1 ||
		    (req.body.index != undefined && (req.body.index < 0 || req.body.index >= list.length)) ||
		    (req.body.checkmark != undefined && req.body.ceckmark != true && req.body.checkmark != false))
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
	},
	performPasswordChange: function (req,res,list) {
		list.password = req.body.password;
		list.Upload();
		communication.Response.Created(res);
	},
	performItemAdd: function (req,res,list) {
		list.items.push(new data.Item(req.body.name,req.body.checkmark,communication.Request.GetAuthor(req)));
		list.Upload();
		communication.Response.Created(res);
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

		if (req.body.checkmark != undefined){
			itm.checkmark = req.body.checkmark;
		}

		if (communication.Request.GetAuthor(req) != undefined)
			itm.last_author = req.headers["Author"];

		list.Upload();
		communication.Response.Created(res);
	}

}