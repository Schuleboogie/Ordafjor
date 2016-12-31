var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Game = require('./game');

app.use(express.static('public'))
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
	console.log('a user connected');
	socket.on('disconnect', function() {
		console.log('user disconnected');
	});
	// New player joins the game
	socket.on('New player', function(playerName) {
		// Check if game is started
		if (Game.isStarted()) {
			io.to(this.id).emit('Player name checked', false, true);
			return;
		}
		// Check if player name is taken
		if (!Game.getPlayer(playerName)) {
			var newPlayer = {
				name: playerName,
				points: 0
			};
			Game.addPlayer(newPlayer);
			io.to(this.id).emit('Player name checked', true, false);
			// Broadcast updated player list
			io.emit('New player', Game.getPlayers());;
		}
		else io.to(this.id).emit('Player name checked', false, false);
	});
	// Get list of players
	socket.on('List players', function() {
		io.emit('List players', Game.getPlayers());
	});
	// Game is started
	socket.on('Start game', function(playerName, word, wordDescription) {
		Game.startGame(playerName, word, wordDescription);
		// Delegate control of game to controller
		io.to(this.id).emit('Game control', true, word, Game.getDescriptions());
		// Broadcast game start to all players but controller
		socket.broadcast.emit('Game started', true, word);
	});
	// Receive word description
	socket.on('Word description', function(playerName, description) {
		var allIn = Game.addDescription(playerName, description);
		// Broadcast updated description list
		// broadcasts to all, only controller listens to it
		io.emit('New description', Game.getDescriptions(), allIn);
	});
	// Broadcast descriptions for all but controller
	socket.on('Descriptions', function(descriptions) {
		// Shuffle descriptions, so it's not obvious which is the controller's
		descriptions = Game.shuffleDescriptions(descriptions);
		socket.broadcast.emit('Descriptions', descriptions);
	});
	// Broadcast chosen description
	socket.on('Description chosen', function(playerName, chosenPlayer, description) {
		var done = Game.chooseDescription(playerName, chosenPlayer, description);
		if (done) {
			io.emit('All votes cast', Game.getResults());
		}
		io.emit('New vote', playerName, description);
	});
	// Broadcast new word
	socket.on('Next word', function() {
		io.emit('Next word');
	});
});

http.listen(3000, function() {
	console.log('listening on *:3000');
});
