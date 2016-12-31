// List of players
var players = [];
// Current game controller
var controller;
// State of game
var started = false;
// Current word in use
var currentWord;
// Description for current word
var currentDescription;
// Descriptions for current word
var descriptions;
// Number of voting submission
var votes;
// Game results
var results;

// Return the list of players
function getPlayers() {
	return players;
}
// Add player to the game
function addPlayer(player) {
	players.push(player);
}
// Get player info, return false if player does not exist
function getPlayer(playerName) {
	for (var i = 0; i < players.length; i++) {
		if (players[i].name === playerName)
			return players[i];
	}
	return false;
}
/* 	Start game, player is player that started the game
		returns the player that starts as the controller
		returns false if game could not be started
*/
function startGame(playerName, word, wordDescription) {
	if (!started) started = true;
	// Check if player exists
	for (var i = 0; i < players.length; i++) {
		if (players[i].name === playerName) {
			controller = players[i];
			currentWord = word;
			currentDescription = wordDescription;
			descriptions = [];
			var firstDescription = {
				player: players[i].name,
				text: currentDescription
			};
			descriptions.push(firstDescription);
			votes = 0;
			results = {};
			// Init results
			for (var j = 0; j < players.length; j++) {
				results[players[j].name] = 0;
			}
			return controller;
		}
	}
	return false;
}
// Check if game is started
function isStarted() {
	return started;
}
// Add description
function addDescription(playerName, description) {
	var description = {
		player: playerName,
		text: description
	};
	descriptions.push(description);
	// Check if all descriptions have been submitted
	var playerList = players.slice(0);
	for (var i = 0; i < descriptions.length; i++) {
		// Remove corresponding player for each description
		for (var j = 0; j < playerList.length; j++) {
			if (playerList[j].name === descriptions[i].player) {
				playerList.splice(j, 1);
				break;
			}
		}
	}
	// If no players are left all descriptions have been submitted
	if (playerList.length === 0)
		return true;
	else return false;
}
// Get all descriptions
function getDescriptions() {
	return descriptions;
}
// Shuffle descriptions, Fisher Yates shuffle
function shuffleDescriptions(array) {
	var currentIndex = array.length, temporaryValue, randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {
		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
}
// Player chooses description
// Returns true if everybody has voted, else false
function chooseDescription(playerName, chosenPlayer, description) {
	// Award player
	for (var p = 0; p < players.length; p++) {
		if (players[p].name === playerName) {
			// Check if player has chosen correct description
			if (description === currentDescription) {
				players[p].points = players[p].points + 1;
				results[playerName] = results[playerName] + 1;
			}
		}
	}
	// Award chosen player
	for (var i = 0; i < players.length; i++) {
		if (players[i].name === chosenPlayer) {
			// Don't give points for choosing yourself
			if (playerName !== chosenPlayer) {
				players[i].points = players[i].points + 1;
				results[players[i].name] = results[players[i].name] + 1;
			}
			break;
		}
	}
	votes++;
	if (votes === players.length - 1) {
		/* 	Check if no one has guessed correct description
				 In this case the controller has no points
				If so the controller gets two points
		*/
		if (results[controller.name] === 0) {
			results[controller.name] = results[controller.name] + 2;
			// Award controller
			for (var j = 0; j < players.length; j++) {
				if (players[j].name === controller.name) {
					players[j].points = players[j].points + 2;
				}
			}
		}
		else {
			// Clear controller points
			for (var k = 0; k < players.length; k++) {
				if (players[k].name === controller.name) {
					players[k].points = players[k].points - results[controller.name];
				}
			}
			results[controller.name] = 0;
		}
		// Game is over
		return true;
	}
	else return false;
}
// Get game results
function getResults() {
	return results;
}

exports.players = players;
exports.addPlayer = addPlayer;
exports.getPlayers = getPlayers;
exports.getPlayer = getPlayer;
exports.startGame = startGame;
exports.isStarted = isStarted;
exports.addDescription = addDescription;
exports.getDescriptions = getDescriptions;
exports.shuffleDescriptions = shuffleDescriptions;
exports.chooseDescription = chooseDescription;
exports.getResults = getResults;
