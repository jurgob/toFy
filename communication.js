module.exports = {
	Response : {
		GetOk : function (res,list) {
			res.json(200,list.ToJsonString());
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
			if (auth != undefined){
				b64 = (new Buffer(auth.split(" ")[1], 'base64')).toString();
			
				return b64.split(":")[1];
			}else 
				return "";
		},
		GetAuthor : function(req) {
			return req.get("Author");
		}
	}
}
