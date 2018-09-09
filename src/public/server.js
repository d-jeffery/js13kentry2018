"use strict";

/**
 * User sessions
 * @param {Set} users
 */
const users = new Set();

function startGame(u1, u2) {
    const coinFlip = (Math.floor(Math.random() * 2) == 0);
    if (coinFlip) {
        new Game(u1, u2).start();
    } else {
        new Game(u2, u1).start();
    }
}

/**
 * Find opponent for a user
 * @param {User} user
 */
function findOpponent(user) {
	for (let opponent of users) {
	    if (user !== opponent &&
            opponent.opponent === null) {
            startGame(user, opponent);
        }
    }
}

/**
 * Start game with BasicAI.
 * @param user
 */
function startGameWithAI(user) {
    startGame(user, new BasicAI());
}


/**
 * Remove user session
 * @param {User} user
 */
function removeUser(user) {
	users.delete(user);
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

		this.turn = Math.floor(Math.random() * 2);
		//this.gameboard = new HexGameBoard(5);
        this.gameboard = new RectGameBoard(6, 8, false);
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
	    return this.gameboard.isBoardFilled() ||
            (this.user1.passed && this.user2.passed)
	}

	/**
	 * Final score
	 */
	score() {
		const score = this.gameboard.getScores();
        if (score[this.user1.playerNo] > score[this.user2.playerNo]) {
            this.user1.win();
            this.user2.lose();
        } else if (score[this.user1.playerNo] < score[this.user2.playerNo]) {
            this.user2.win();
            this.user1.lose();
        } else {
            this.user1.draw();
            this.user2.draw();
        }
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
		this.passed = false;
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
        this.socket.emit("wait",
            this.game.gameboard,
            this.game.gameboard.getScores());
    }

    /**
	 * Emit turn event.
     */
	turn() {
        this.socket.emit("turn",
            this.game.gameboard,
            this.game.gameboard.getScores(),
            this.game.gameboard.getValidMoves(this.playerNo));
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
 * Basic AI player.
 */
class BasicAI extends User {

    constructor() {
        super(null);
        this.playerNo = null;
        this.game = null;
        this.opponent = null;
        this.passed = false;
    }

    /**
     * Start new game
     * @param {Game} game
     * @param {User} opponent
     */
    start(game, opponent) {
        this.game = game;
        this.opponent = opponent;
    }

    /**
     * Terminate game
     */
    end() {
        this.game = null;
        this.opponent = null;
    }

    /**
     * Emit wait event.
     */
    wait() {

    }

    /**
     * Emit turn event.
     */
    turn() {
        const user = this;
        if (user.game.ended()) {
            user.game.score();
            return;
        }
        setTimeout(function () {
            const moves = user.game.gameboard.getValidMoves(user.playerNo);
            if (moves.length > 0) {
                let bestMove = undefined;
                let bestScore = -1;

                moves.forEach((m, index) => {
                    const score = user.game.gameboard.score(m.r, m.c, user.playerNo);
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = index;
                    }
                });
                user.game.gameboard.doMove(moves[bestMove].r, moves[bestMove].c, user.playerNo);
                user.passed = false;
            } else {
                user.passed = true;
            }
            user.opponent.turn();
            user.wait();
            user.game.turn = (user.game.turn + 1) % NUM_PLAYERS;

            if (user.game.ended()) {
                user.game.score();
            }
        }, 1000);
    }

    /**
     * Trigger win event
     */
    win() {

    }

    /**
     * Trigger lose event
     */
    lose() {

    }

    /**
     * Trigger draw event
     */
    draw() {

    }
}

/**
 * Socket.IO on connect event
 * @param {Socket} socket
 */
module.exports = {

	io: (socket) => {
		const user = new User(socket);

		socket.on("find-human", () => {
            console.log("Find Human: " + socket.id);

            users.add(user);
            findOpponent(user);

            if (user.opponent) {
                if (user.game.turn === user.playerNo) {
                    user.opponent.wait();
                    user.turn();
                } else {
                    user.opponent.turn();
                    user.wait();
                }
            }
        });

        socket.on("start-basic-ai", () => {
            console.log("Start basic AI: " + socket.id);

            removeUser(user);
            startGameWithAI(user);

            if (user.opponent) {
                if (user.game.turn === user.playerNo) {
                    user.opponent.wait();
                    user.turn();
                } else {
                    user.opponent.turn();
                    user.wait();
                }
            }
        });

		socket.on("disconnect", () => {
			console.log("Disconnected: " + socket.id);
			removeUser(user);
			if (user.opponent) {
				user.opponent.end();
			}
		});

		socket.on("move", (move) => {
            console.log("Move: " + socket.id);
            if (user.game.turn === user.playerNo) {
                // Execute move
                if (user.game.gameboard.doMove(move.r, move.c, user.playerNo)) {
                    user.passed = false;
                    user.wait();
                    user.opponent.turn();
                    user.game.turn = (user.game.turn + 1) % NUM_PLAYERS;
                }

                if (user.game.ended()) {
                    user.game.score();
                }
            }
		});

		socket.on("pass", () => {
            console.log("Pass: " + socket.id);
            if (user.game.turn === user.playerNo) {
                // Execute pass
                user.passed = true;
                user.wait();
                user.opponent.turn();
                user.game.turn = (user.game.turn + 1) % NUM_PLAYERS;

                if (user.game.ended()) {
                    user.game.score();
                }
            }
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