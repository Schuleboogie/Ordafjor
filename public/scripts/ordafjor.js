$(document).ready(function() {
	Ordafjor.start();
});
var Ordafjor = (function() {
	var socket;
	var newPlayerForm = $('form#new-player');
	var error = $('#error');
	var message = $('#message');
	var playerOnly = $('div#game');
	var playerList = $('#players');
	var startGameForm = $('form#start-game');
	var finishGameButton = $('button#finish-game');
	var theWord = $('#the-word');
	var descriptionForm = $('form#describe');
	var descriptionList = $('#descriptions');
	var sendDescriptionsButton = $('button#send-descriptions');
	var chosenDescriptions = $('#chosen-descriptions');
	var results = $('#results');

	function start() {
		socket = io();
		// Check player name
		if (sessionStorage.getItem('Your player name')) {
			socket.emit('Old player', sessionStorage.getItem('Your player name'));
		}
		newPlayerForm.submit(submitPlayer);
		// Display player info
		socket.on('Player info', function(player, players) {
			if (player && sessionStorage.getItem('Your player name') &&
					sessionStorage.getItem('Your player name') === player.name) {
				message.html('Velkomin/n aftur ' + player.name);
				newPlayerForm.remove();
				displayPlayers(players);
				// Update game state
				updateGameState();
			}
		});
		// Update list of players when a new player joins the game
		socket.on('New player', function(players) {
			displayPlayers(players);
		});
		// Listen for game start
		socket.on('Game started', function(started) {
			if (started) updateGameState();
		});
		// Enable game start
		startGameForm.submit(startGame);
	}
	// Submit player to server
	function submitPlayer(e) {
		e.preventDefault();
		var form = $(this);
		var playerName = form.find('#name').val();
		if (playerName.length === 0) {
			error.html('Vinsamlegast sláðu inn eitthvað nafn');
			return false;
		}
		// Broadcast new player name
		socket.emit('New player', playerName);
		socket.on('Player name checked', function(valid) {
			if (valid) {
				message.html('Velkomin/n ' + playerName);
				error.html('');
				// Store player name in session
				sessionStorage.setItem('Your player name', playerName);
				// Remove form
				form.remove();
			}
			else error.html('Þetta nafn er því miður frátekið');
		});
		return false;
	}
	// Display list of players
	function displayPlayers(players) {
		playerOnly.show();
		playerList.html('');
		for (var i = 0; i < players.length; i++) {
			var listItem = $('<li></li>');
			listItem.append(players[i].name);
			playerList.append(listItem);
		}
	}
	// Start game
	function startGame(e) {
		e.preventDefault();
		var form = $(this);
		socket.emit('Start game', sessionStorage.getItem('Your player name'), form.find('#word').val());
		socket.on('Game started', function(started) {
			if (started) {
				error.html('');
				updateGameState();
			}
			else error.html('Ekki tókst að hefja leik');
		});
	}
	// Update game state
	function updateGameState() {
		socket.emit('Game state');
		socket.on('Game state', function(state) {
			if (state.started) {
				message.html('Leikurinn er hafinn. ');
				startGameForm.remove();
				theWord.html('Orðið er ' + state.word);
				if (state.controller.name === sessionStorage.getItem('Your player name')) {
					// Player is the controller, update the view
					message.append(' Þú ert núna stjórnandi.');
					displayDescriptions(state.descriptions, state.allIn, state.sent);
					// Listen for new word descriptions
					socket.on('New description', function(descriptions, allIn, sent) {
						displayDescriptions(descriptions, allIn, sent);
					});
				}
				else {
					/* 	Player is not controller
							Check if player has submitted description
							If not enable description form
					*/
					var descriptionSubmitted = false;
					if (state.descriptions) {
						for (var i = 0; i < state.descriptions.length; i++) {
							if (state.descriptions[i].player === sessionStorage.getItem('Your player name'))
								descriptionSubmitted = true;
						}
					}
					if (!descriptionSubmitted) {
						descriptionForm.show();
						descriptionForm.submit(submitDescription);
					}
					if (state.sent)
						displayDescriptions(state.descriptions, false, false, true);
					else {
						// Listen for descriptions
						socket.on('Descriptions', function(descriptions) {
							displayDescriptions(descriptions, false, false, true);
						});
					}
					// Listen for chosen descriptions
					socket.on('Description chosen', function(playerName, description) {
						chosenDescriptions.append(playerName + ' valdi ' + description);
					});
				}
			}
		});
	}
	// Submit word description
	function submitDescription(e) {
		e.preventDefault();
		var description = $(this).find('#description').val();
		socket.emit('Word description', sessionStorage.getItem('Your player name'), description);
		descriptionForm.hide();
	}
	// Display word descriptions
	function displayDescriptions(descriptions, allIn, descriptionsSent, choose) {
		if (descriptions) descriptionList.show();
		else return;
		descriptionList.html('');
		for (var i = 0; i < descriptions.length; i++) {
			var listItem = $('<li></li>');
			listItem.append(descriptions[i].text + ' eftir ' + descriptions[i].player);
			if (choose) {
				var chooseLink = $('<a href="#" class="chooser">Velja</a>');
				chooseLink.attr('data-description', descriptions[i].text);
				chooseLink.attr('data-player', descriptions[i].player);
				chooseLink.click(chooseDescription);
				listItem.append(chooseLink);
			}
			descriptionList.append(listItem);
		}
		if (allIn && !descriptionsSent) {
			message.html('All messages are in');
			// Enable sending descriptions
			sendDescriptionsButton.show();
			sendDescriptionsButton.off('click');
			sendDescriptionsButton.click(function() {
				$(this).remove();
				sendDescriptions(descriptions);
			});
		}
		else if (allIn && descriptionsSent) {
			message.html('Þú ert búin/n að senda út útskýringar');
		}
	}
	// Send descriptions out to players
	function sendDescriptions(descriptions) {
		socket.emit('Descriptions', descriptions);
		// Listen for when all votes have been cast
		socket.on('All votes cast', function(resultData) {
			results.show();
			for (var player in resultData) {
				if (resultData.hasOwnProperty(player)) {
					results.append(player + ' fékk ' + resultData[player] + ' stig.');
				}
			}
			// Enable game finishing
			finishGameButton.show();
			finishGameButton.click(finishGame);
		});
	}
	// Choose description
	function chooseDescription(e) {
		e.preventDefault();
		var description = $(this).attr('data-description');
		var chosenPlayer = $(this).attr('data-player');
		// Disable choosing
		$('.chooser').remove();
		socket.emit('Description chosen', sessionStorage.getItem('Your player name'), chosenPlayer, description);
	}
	// Finish game
	function finishGame() {

	}
	return {
		start: start
	}
})();
