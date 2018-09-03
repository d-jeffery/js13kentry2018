"use strict";


/**
 * Player enum
 */
const PLAYER_1 = 0;
const PLAYER_2 = 1;
const NUM_PLAYERS = 2;

/**
 * The rect game board.
 */
class RectGameBoard {
    /**
     * Constructor.
     * @param {number} cols
     * @param {number} rows
     * @param {boolean} cut - trim the corners
     */
    constructor(cols, rows, cut) {
        this.c = cols;
        this.r = rows;

        this.cut = cut;

        this.tiles = [];
        this.createBoard();

    }

    /**
     * Create the board.
     */
    createBoard() {
        for(let i = 0; i < this.r; i++) {
            this.tiles[i] = [];
            for(let j = 0; j < this.c; j++) {
                this.tiles[i][j] = new BoardTile(i, j);
            }
        }
        if (this.cut) {
            this.tiles[0][0] = null;
            this.tiles[this.r - 1][this.c - 1] = null;
        }

        const halfR = Math.floor(this.r / 2) - 1;
        const halfC = Math.floor(this.c / 2) - 1;

        this.tiles[halfR][halfC].owner = PLAYER_1;
        this.tiles[halfR][halfC + 1].owner = PLAYER_2;
        this.tiles[halfR + 1][halfC].owner = PLAYER_2;
        this.tiles[halfR + 1][halfC + 1].owner = PLAYER_1;

        this.tiles[1][1].score = 5;
        this.tiles[1][this.c - 2].score = 5;

        this.tiles[this.r - 2][1].score = 5;
        this.tiles[this.r - 2][this.c - 2].score = 5
    }

    /**
     * Do move.
     * @param {number} row
     * @param {number} col
     * @param {number} player
     */
    doMove(row, col, player) {
        if (this.getValidMoves(player).includes(this.tiles[row][col])) {
            this.claim(row, col, player);
            return true;
        }
        return false;
    }

    /**
     * Claim piece.
     * @param {number} row
     * @param {number} col
     * @param {number} player
     */
    claim(row, col, player) {
        const tile = this.tiles[row][col];
        for(let i = 0; i < 6; i++) {
            let stack = [];
            let nextTile = tile;
            do {
                let b = nextTile.getDirection(i);

                if (this.tiles[b.r] !== undefined &&
                    this.tiles[b.r][b.c]
                ) {
                    if (this.tiles[b.r][b.c].owner === undefined) {
                        stack = [];
                        break;
                    } else if (this.tiles[b.r][b.c].owner === player) {
                        break;
                    } else {
                        nextTile = this.tiles[b.r][b.c];
                        stack.push(nextTile);
                    }
                } else {
                    stack =[];
                    break;
                }
            } while (true);
            stack.forEach(t => t.setOwner(player))
        }

        tile.setOwner(player);
    }

    /**
     * Score the move.
     * @param {number} row
     * @param {number} col
     * @param {number} player
     */
    score(row, col, player) {
        const tile = this.tiles[row][col];
        let score = 0;
        for(let i = 0; i < 6; i++) {
            let stack = [];
            let nextTile = tile;
            do {
                let b = nextTile.getDirection(i);

                if (this.tiles[b.r] !== undefined &&
                    this.tiles[b.r][b.c]
                ) {
                    if (this.tiles[b.r][b.c].owner === undefined) {
                        stack = [];
                        break;
                    } else if (this.tiles[b.r][b.c].owner === player) {
                        break;
                    } else {
                        nextTile = this.tiles[b.r][b.c];
                        stack.push(nextTile);
                    }
                } else {
                    stack =[];
                    break;
                }
            } while (true);
            stack.forEach(t => score += t.score)
        }

        score += tile.score;
        return score;
    }

    /**
     * Return array of valid moves.
     * @param player
     * @return {Set}
     */
    getValidMoves(player) {
        let claimable = [];

        for(let i = 0; i < this.r; i++) {
            for(let j = 0; j < this.c; j++) {
                const tile = this.tiles[i][j];

                if (tile !== null && tile.owner === (player + 1) % NUM_PLAYERS ) {
                    claimable = claimable.concat(
                        tile.getSiblings()
                            .filter(b => this.tiles[b.r] !== undefined)
                            .map(b => this.tiles[b.r][b.c])
                            .filter(b => b)
                            .filter(b => b.owner === undefined)
                    );
                }
            }
        }
        return claimable;
    }

    /**
     * Is the board filled.
     * @return {boolean}
     */
    isBoardFilled() {
        for(let i = 0; i < this.r; i++) {
            for(let j = 0; j < this.c; j++) {
                if (this.tiles[i][j] !== null &&
                    this.tiles[i][j].owner === undefined) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Get the current score.
     * @returns {Array}
     */
    getScores() {
        const score = [];
        for(let i = 0; i < this.r; i++) {
            for(let j = 0; j < this.c; j++) {
                if (this.tiles[i][j] !== null &&
                    this.tiles[i][j].owner !== undefined) {
                    if (score[this.tiles[i][j].owner] === undefined) {
                        score[this.tiles[i][j].owner] = this.tiles[i][j].score;
                    } else {
                        score[this.tiles[i][j].owner] += this.tiles[i][j].score;
                    }
                }
            }
        }
        return score;
    }

    /**
     * Get board tile.
     * @param {number} row
     * @param {number} col
     * @returns {BoardTile}
     */
    getBoardTile(row, col) {
        return this.tiles[row][col];
    }
}

/**
 * A tile on the board.
 */
class BoardTile {
    constructor(row, col) {
        this.r = row;
        this.c = col;
        this.owner = undefined;
        this.score = 1;
    }

    /**
     * Set the owner.
     * @param {number} p
     */
    setOwner(p) {
        this.owner = p;
    }

    /**
     * Get tile in direction.
     * @param {number} d
     */
    getDirection(d) {
        const r = this.r;
        const c = this.c;
        const offset = !(this.r % 2);
        switch (d) {
            case 0:
                return {r: r + 0, c: c + 1};
            case 1:
                if (offset)
                    return {r: r + 1, c: c + 0};
                else
                    return {r: r + 1, c: c + 1};
            case 2:
                if (offset)
                    return {r: r + 1, c: c - 1};
                else
                    return {r: r + 1, c: c + 0};
            case 3:
                return {r: r + 0, c: c - 1};
            case 4:
                if (offset)
                    return {r: r - 1, c: c - 1};
                else
                    return {r: r - 1, c: c + 0};
            case 5:
                if (offset)
                    return {r: r - 1, c: c + 0};
                else
                    return {r: r - 1, c: c + 1};
            default:
                return undefined;
        }
    }

    /**
     * Get the siblings for a given tile.
     * @returns {Array}
     */
    getSiblings() {
        const a = [];
        for(let i = 0; i < 6; i++) {
            a.push(this.getDirection(i));
        }
        return a;
    }
}