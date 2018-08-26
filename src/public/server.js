"use strict";

/**
 * User sessions
 * @param {Array} users
 */
const users = [];

/**
 * Find opponent for a user
 * @param {User} user
 */
function findOpponent(user) {
	for (let i = 0; i < users.length; i++) {
		if (
			user !== users[i] &&
			users[i].opponent === null
		) {
			new Game(user, users[i]).start();
		}
	}
}

/**
 * Remove user session
 * @param {User} user
 */
function removeUser(user) {
	users.splice(users.indexOf(user), 1);
}

/**
 * Game class
 */
class Game {

	/**
	 * @param {User} user1 
	 * @param {User} user2 
	 */
	constructor(user1, user2) {
		this.user1 = user1;
		this.user2 = user2;

		this.user1.playerNo = PLAYER_1;
		this.user2.playerNo = PLAYER_2;
		//this.gameboard = new HexGameBoard(5);
        this.gameboard = new RectGameBoard(10, 6, true);
	}

	/**
	 * Start new game
	 */
	start() {
		this.user1.start(this, this.user2);
		this.user2.start(this, this.user1);
	}

	/**
	 * Is game ended
	 * @return {boolean}
	 */
	ended() {
	}

	/**
	 * Final score
	 */
	score() {

	}

}

/**
 * User session class
 */
class User {

	/**
	 * @param {Socket} socket
	 */
	constructor(socket) {
		this.socket = socket;
		this.playerNo = null;
		this.game = null;
		this.opponent = null;
	}

	/**
	 * Start new game
	 * @param {Game} game
	 * @param {User} opponent
	 */
	start(game, opponent) {
		this.game = game;
		this.opponent = opponent;
		this.socket.emit("start", this.game.gameboard, this.playerNo);
	}

	/**
	 * Terminate game
	 */
	end() {
		this.game = null;
		this.opponent = null;
		this.socket.emit("end");
	}

    /**
     * Emit wait event.
     */
    wait() {
        this.socket.emit("wait", this.game.gameboard);
    }

    /**
	 * Emit turn event.
     */
	turn() {
        this.socket.emit("turn", this.game.gameboard);
    }

	/**
	 * Trigger win event
	 */
	win() {
		this.socket.emit("win", this.opponent.guess);
	}

	/**
	 * Trigger lose event
	 */
	lose() {
		this.socket.emit("lose", this.opponent.guess);
	}

	/**
	 * Trigger draw event
	 */
	draw() {
		this.socket.emit("draw", this.opponent.guess);
	}

}

/**
 * Socket.IO on connect event
 * @param {Socket} socket
 */
module.exports = {

	io: (socket) => {
		const user = new User(socket);
		users.push(user);
		findOpponent(user);

		if (user.opponent) {
		    user.opponent.wait()
        }

		socket.on("disconnect", () => {
			console.log("Disconnected: " + socket.id);
			removeUser(user);
			if (user.opponent) {
				user.opponent.end();
				findOpponent(user.opponent);
			}
		});

		socket.on("move", (move) => {
            console.log("Move: " + socket.id);

            // Execute move
            user.game.gameboard.doMove(move.r, move.c, user.playerNo);

            user.opponent.turn();
            user.wait();
		});

		/*socket.on("guess", (guess) => {
			console.log("Guess: " + socket.id);
			if (user.setGuess(guess) && user.game.ended()) {
				user.game.score();
				user.game.start();
				storage.get('games', 0).then(games => {
					storage.set('games', games + 1);
				});
			}
		});*/

		console.log("Connected: " + socket.id);
	},

	stat: (req, res) => {
		storage.get('games', 0).then(games => {
			res.send(`<h1>Games played: ${games}</h1>`);
		});
	}

};