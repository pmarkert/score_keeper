var alexa = require("alexa_router");
var router = new alexa.Router();
var aws = require("aws-sdk");
var dynamo = new aws.DynamoDB({ params : { TableName: "score_keeper" } });
var async = require("async");

router.add(function(params, session, callback) {
	callback("Score keeper here. Ask me to add points to any player by name, or ask me who is winning.");
});

router.add("ResetGame", function(params, session, callback) {
	var query = getQuery(session);
	dynamo.query(query, function(err, results) {
		if(err) { 
			console.log("Error retrieving scores - " + err);
			return callback("Error retrieving scores - " + err);
		}
		async.each(results.Items, 
			function(item, cb) { 
				dynamo.deleteItem( { Key : getPlayerKey(item.player.S, session) }, cb); 
			}, function(err) {
				if(err) { 
					console.log("Error resetting the game - " + err); 
					return callback("Error resetting the game - " + err);
				};
				callback("Reset the game.");
			}
		);
	});
});

router.add("ScoreCheck", function(params, session, callback) {
	var query = getQuery(session);
	dynamo.query(query, function(err, results) {
		if(err) { 
			console.log("Error retrieving scores - " + err);
			return callback("Error retrieving scores - " + err);
		}
		var response = "The score is: ";
		for(var i=0;i<results.Items.length;i++) {
			response += results.Items[i].player.S + " has " + results.Items[i].points.N + " points, "
		}
		callback(response);
	});
});

router.add("SinglePoint", function(params, session, callback) {
	if(!params.player) { return callback("Did not catch the name of the player."); }
	var query = { 
		Key : getPlayerKey(params.player, session),
		AttributeUpdates : addPoints(1)
	};
	dynamo.updateItem(query, function(err) {
		if(err) { 
			console.log("Error doing update - " + err);
			return callback("Error adding point to player " + params.player + " - " + err);
		}
		callback("Added " + params.points + " to player " + params.player);
	});
});

router.add("AddPoints", function(params, session, callback) {
	if(!params.player) { return callback("Did not catch the name of the player."); }
	if(!params.points) { return callback("Did not catch the number of points."); }
	var query = { 
		Key : getPlayerKey(params.player, session),
		AttributeUpdates : addPoints(params.points)
	};
	dynamo.updateItem(query, function(err) {
		if(err) { 
			console.log("Error doing update - " + err);
			return callback("Error adding " + params.points + " to player " + params.player + " - " + err);
		}
		callback("Added " + params.points + " to player " + params.player);
	});
});

function getQuery(session) {
	return { "KeyConditionExpression" : "user_id = :user_id" , ExpressionAttributeValues : { ":user_id" : { S : session.user.userId } } };
}

function getPlayerKey(player, session) {
	return { 
		user_id : { 
			S : session.user.userId 
		}, 
		player : { 
			S : player 
		} 
	};
}

function addPoints(points) {
	return { 
		points: { 
			Action: 'ADD', 
			Value : { 
				N : points 
			} 
		}
	};
}

module.exports = router;
