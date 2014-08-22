var apn = require('apn');

var options = {
	passphrase:process.env.PASS_PHRASE,
	cert:process.env.APN_CERT,
	key:process.env.APN_KEY,
	errorCallback: function(err,notifcation){
        	console.log(err + ' :: ' + notifcation);
    	}
};

var apnConnection = new apn.Connection(options);

function message(event,list_name,item_name,author) {
		obj = {"type":event,"list_name":list_name,"item_name":item_name,"author":author};
		return JSON.stringify(obj);
	}

function apnsMessage (event,list_name,item_name,author) {
	var note = new apn.Notification();
	note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
	if (event != module.exports.Events.item_changed) {
		note.badge = 1;
		note.sound = "ping.aiff";
		note.alert = eventDescription(event,list_name,item_name,author);
	}
	note.payload = {"type":event,"list_name":list_name,"item_name":item_name,"author":author};
	return note;
}

function eventDescription (event,list_name,item_name,author) {
	var rString = author + " ";

	switch (event) {
		case module.exports.Events.unregistered: 
			rString += "left " + list_name;
		break;
		case module.exports.Events.registered: 
			rString += "joined " + list_name;
		break;
		case module.exports.Events.item_added: 
			rString += "added " + item_name + " to " + list_name;
		break; 
		case module.exports.Events.item_deleted: 
			rString += "deleted " + item_name + " from " + list_name;
		break; 
		case module.exports.Events.list_deleted: 
			rString += "deleted " + list_name;
		break; 
		case module.exports.Events.password_changed: 
			rString += "changed password to " + list_name;
		break; 
	}

	return rString;
}

module.exports = {
	Events : {
		unregistered:"UNREGISTER",
		registered:"REGISTER",
		item_added:"ITEM_ADD",
		item_deleted:"ITEM_DELETE",
		item_changed:"ITEM_CHANGE",
		list_deleted:"LIST_DELETE",
		password_changed:"PW_CHANGE"
	},

	notify : function(observer,event,list_name,item_name,author){
		if (observer.IsDevice()){
			var iphone = new apn.Device(observer.deviceId);
			apnConnection.pushNotification(apnsMessage(event,list_name,item_name,author), iphone);
		} else {
			observer.connection.write('event:' + message(event,list_name,item_name,author) + '\n\n');	
		}
	}
}
