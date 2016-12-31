$(document).ready(function() {
	Ordafjor.start();
});
var Ordafjor = (function() {
	var socket;
	var username; // Name of player
	var splash = $('#splash');
	var playButton = $('#play-button');
	var newPlayerForm = $('form#new-player');
	var error = $('#error');
	var masterMessage = $('#master-message');
	var identityArea = $('#identity');
	var yourUsername = $('#your-username');
	var startArea = $('#start');
	var masterArea = $('#master');
	var slaveArea = $('#slave');
	var slaveVoteList = $('ul#votes');
	var masterVoteList = $('ul#posted-votes');
	var playerList = $('#players');
	var startGameForm = $('form#start-game');
	var nextWordButton = $('button#finish-game');
	var word = $('.word');
	var descriptionForm = $('form#describe');
	var masterDescriptionList = $('#descriptions');
	var slaveDescriptionList = $('#posted-descriptions');
	var sendDescriptionsButton = $('button#send-descriptions');
	var chosenDescriptions = $('#chosen-descriptions');
	var results = $('#results');

	function start() {
		socket = io();
		// Play button
		playButton.click(function() { splash.slideUp(); });
		newPlayerForm.submit(submitPlayer);
		// Get list of players
		socket.emit('List players');
		socket.on('List players', function(players) {
			displayPlayers(players);
		});
		// Update list of players when a new player joins the game
		socket.on('New player', function(players) {
			displayPlayers(players);
		});
		// Listen for game start
		socket.on('Game started', function(started, theWord) {
			if (started && username) {
				// Remove start area
				startArea.slideUp();
				// Show slave area
				slaveArea.slideDown();
				// Show word
				word.html('Orðið er ' + theWord);
				// Enable description submission
				descriptionForm.show();
				descriptionForm.submit(submitDescription);
			}
		});
		// Listen for posted descriptions
		socket.on('Descriptions', function(descriptions) {
			$('#wait').hide();
			displayDescriptions(descriptions, true);
		});
		// Listen for new votes
		socket.on('New vote', function(playerName, description) {
			var listItem = $('<li></li>');
			listItem.append(playerName + ' valdi ');
			var descriptionText = $('<span class="description-text"></span>');
			descriptionText.append(description);
			listItem.append(descriptionText);
			masterVoteList.append(listItem);
			slaveVoteList.append(listItem.clone());
		});
		// Listen for next word
		socket.on('Next word', function() {
			// Init everything
			masterArea.hide();
			slaveArea.hide();
			masterDescriptionList.html('');
			slaveDescriptionList.html('');
			descriptionForm.off('submit');
			sendDescriptionsButton.off('click');
			nextWordButton.hide();
			nextWordButton.off('click');
			results.html('');
			masterVoteList.html('');
			slaveVoteList.html('');
			word.html('');
			startArea.show();
		});
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
		socket.on('Player name checked', function(valid, gameStarted) {
			if (valid && !gameStarted) {
				message.html('Velkomin/n ' + playerName);
				username = playerName;
				error.html('');
				// Remove form
				form.hide();
				// Display identity area
				identityArea.slideDown();
				yourUsername.html('Þitt nafn: ' + playerName);
				var userImage = $('<img class="user-image" alt="Mynd af þér"></img>');
				userImage.attr('src', 'http://i.pravatar.cc/45?u=' + playerName);
				identityArea.append(userImage);
				// Display starting area
				startArea.slideDown();
				// Enable game start
				startGameForm.submit(startGame);
			}
			else if (gameStarted) error.html('Því miður er leikurinn hafinn. Farðu bara út að leika þér.');
			else error.html('Þetta nafn er því miður frátekið');
		});
		return false;
	}
	// Display list of players
	function displayPlayers(players) {
		playerList.html('');
		for (var i = players.length-1; i >= 0; i--) {
			var listItem = $('<li></li>');
			var playerName = $('<span class="player-name"></span>');
			playerName.append(players[i].name);
			var playerPoints = $('<span class="player-points"></span>');
			playerPoints.append(' ' + players[i].points + ' stig');
			playerName.append(playerPoints);
			listItem.append(playerName);
			var userImage = $('<img class="user-image" alt="Mynd af notanda"></img>');
			userImage.attr('src', 'http://i.pravatar.cc/45?u=' + players[i].name);
			listItem.append(userImage);
			playerList.append(listItem);
		}
	}
	// Start game
	function startGame(e) {
		e.preventDefault();
		var form = $(this);
		if (form.find('#word').val().length === 0 || form.find('#word-description').val().length === 0) {
			error.html('Vinsamlegast sláðu inn eitthvað orð og útskýringu');
			return;
		}
		error.html('');
		socket.emit('Start game', username, form.find('#word').val(), form.find('#word-description').val());
		form.find('#word').val('');
		form.find('#word-description').val('');
		socket.on('Game control', function(control, theWord, firstDescriptions) {
			if (control) {
				error.html('');
				// Remove start area
				startArea.hide();
				// Show master area
				masterArea.slideDown();
				masterMessage.html('Nú senda allir inn sína útskýringu');
				// Show word
				word.html('Orðið er ' + theWord);
				// Display descriptions
				displayDescriptions(firstDescriptions, false);
				// Listen for descriptions
				socket.on('New description', function(descriptions, allIn) {
					displayDescriptions(descriptions, false);
					if (allIn) {
						masterMessage.html('Nú hafa allir sent inn útskýringu');
						// Enable sending descriptions
						sendDescriptionsButton.show();
						sendDescriptionsButton.off('click');
						sendDescriptionsButton.click(function() {
							$(this).remove();
							masterMessage.html('Nú bíðum við eftir atkvæðum')
							sendDescriptions(descriptions);
						});
					}
				});
			}
			else error.html('Ekki tókst að hefja leik');
		});
	}
	// Submit word description
	function submitDescription(e) {
		e.preventDefault();
		var description = $(this).find('#description').val();
		$(this).find('#description').val('');
		socket.emit('Word description', username, description);
		descriptionForm.hide();
		// Show waiting message
		$('#wait').show();
	}
	// Display word descriptions, choose is boolean whether description list
	// is for displaying for master or slaves
	function displayDescriptions(descriptions, choose) {
		var descriptionList;
		if (choose) descriptionList = slaveDescriptionList;
		else descriptionList = masterDescriptionList;

		if (descriptions) descriptionList.show();
		else return;
		descriptionList.html('');
		for (var i = 0; i < descriptions.length; i++) {
			var listItem = $('<li></li>');
			var descriptionText = $('<span class="description-text"></span>');
			descriptionText.append(descriptions[i].text);
			listItem.append(descriptionText);
			// Only show author when master list is shown
			if (!choose) {
				listItem.append(' eftir ');
				var playerName = $('<span class="description-player"></span>');
				playerName.append(descriptions[i].player);
				listItem.append(playerName);
			}
			if (choose) {
				var chooseLink = $('<a href="#" class="chooser">Velja</a>');
				chooseLink.attr('data-description', descriptions[i].text);
				chooseLink.attr('data-player', descriptions[i].player);
				chooseLink.click(chooseDescription);
				listItem.append(chooseLink);
			}
			descriptionList.append(listItem);
		}
	}
	// Send descriptions out to players
	function sendDescriptions(descriptions) {
		socket.emit('Descriptions', descriptions);
		// Listen for when all votes have been cast
		socket.on('All votes cast', function(resultData) {
			masterMessage.html('Allir hafa greitt atkvæði');
			results.show();
			for (var player in resultData) {
				if (resultData.hasOwnProperty(player)) {
					results.append(player + ' fékk ' + resultData[player] + ' stig. ');
				}
			}
			// Update player list
			socket.emit('List players');
			// Enable next word
			nextWordButton.show();
			nextWordButton.click(nextWord);
		});
	}
	// Choose description
	function chooseDescription(e) {
		e.preventDefault();
		var description = $(this).attr('data-description');
		var chosenPlayer = $(this).attr('data-player');
		// Disable choosing
		$('.chooser').remove();
		socket.emit('Description chosen', username, chosenPlayer, description);
	}
	// Next word
	function nextWord() {
		socket.emit('Next word');
	}
	return {
		start: start
	}
})();
