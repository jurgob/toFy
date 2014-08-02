var apn = require('apn');

module.exports = {
	Events : {
		unregistered:"UNREGISTER",
		registered:"REGISTER",
		item_added:"ITEM_ADD",
		item_deleted:"ITEM_DEL",
		item_changed:"ITEM_CHANGE",
		list_deleted:"LIST_DELETE",
		password_changed:"PW_CHANGE"
	},
	message : function(event,list_name,item_name,author) {
		obj = {"event":event,"list_name":list_name,"item_name":item_name,"author":author};
		return JSON.Stringify(obj);
	}
}
