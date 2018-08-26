"use strict";


/**
 * Player enum
 */
const PLAYER_1 = 0;
const PLAYER_2 = 1;
const NUM_PLAYERS = 2;

/**
 * TODO hexagonal board
 */
class HexGameBoard {
    /**
     * Constructor.
     * @param {number} d
     */
    constructor(d) {
        this.d = d;

        this.tiles = [];
        this.createBoard();

    }

    /**
     * Create the board.
     */
    createBoard() {
        for(let i = 0; i < this.d; i++) {
            this.tiles[i] = [];
            for(let j = 0; j < this.d; j++) {
                this.tiles[i][j] = new BoardTile(j, i);
            }
        }
    }

    /**
     * Get board tile.
     * @param {number} x
     * @param {number} y
     * @returns {BoardTile}
     */
    getBoardTile(x, y) {
        return this.tiles[y][x];
    }
}

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
    }

    /**
     * Do move.
     * @param {number} row
     * @param {number} col
     * @param {number} player
     */
    doMove(row, col, player) {
        if (this.getValidMoves(player).includes(this.tiles[row][col])) {
            this.tiles[row][col].setOwner(player);
            return true;
        }
        return false;
    }

    /**
     * Return array of valid moves.
     * @param player
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
        switch (d) {
            case 0:
                return {r: r + 0, c: c + 1};
            case 1:
                return {r: r + 1, c: c + 1};
            case 2:
                return {r: r + 1, c: c + 0};
            case 3:
                return {r: r + 0, c: c - 1};
            case 4:
                return {r: r - 1, c: c + 0};
            case 5:
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