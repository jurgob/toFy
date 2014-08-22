module.exports = {
	Response : {
		GetOk : function (res,content) {
			if (content != undefined){
				res.type('json');
				res.send(200,content.ToJsonString());
			}else
				res.send(200);
		},
		Created : function (res,list) {
			res.send(201);
		},
		DelOk : function (res,list) {
			res.send(204);
		},
		BadRequest : function (res){
			res.send(400);
		},
		NotFound : function (res){
			res.send(404);
		},
		WrongPassword : function (res){
			res.set("WWW-Authenticate","Basic");
			res.send(401);
		},
		Conflict : function (res){
			res.send(409);
		},
		WrongObject : function (res) {
			res.send(422);
		}

	},
	Request :{
		GetPassword : function (req) {
			auth = req.get('Authorization');
			console.log(auth);
			if (auth != undefined){
				b64 = (new Buffer(auth, 'base64')).toString();
			
				return b64.split(":")[1];
			}else 
				return "";
		},
		GetAuthor : function(req) {
			var author = req.get("Author");
			if (author === undefined)
				author = "Someone";
			return author; 
		},
		GetDeviceId : function(req) {
			return req.get("Device-Id");
		}
	}
}
