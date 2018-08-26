"use strict";let PLAYER_1=0,PLAYER_2=1,NUM_PLAYERS=2;class HexGameBoard{constructor(r){this.d=r;this.tiles=[];this.createBoard()}createBoard(){for(let r=0;r<this.d;r++){this.tiles[r]=[];for(let e=0;e<this.d;e++)this.tiles[r][e]=new BoardTile(e,r)}}getBoardTile(r,e){return this.tiles[e][r]}}class RectGameBoard{constructor(r,e,t){this.c=r;this.r=e;this.cut=t;this.tiles=[];this.createBoard()}createBoard(){for(let r=0;r<this.r;r++){this.tiles[r]=[];for(let e=0;e<this.c;e++)this.tiles[r][e]=new BoardTile(r,e)}this.cut&&(this.tiles[0][0]=null,this.tiles[this.r-1][this.c-1]=null);let r=Math.floor(this.r/2)-1,e=Math.floor(this.c/2)-1;this.tiles[r][e].owner=PLAYER_1;this.tiles[r][e+1].owner=PLAYER_2;this.tiles[r+1][e].owner=PLAYER_2;this.tiles[r+1][e+1].owner=PLAYER_1}doMove(r,e,t){if(this.getValidMoves(t).includes(this.tiles[r][e])){this.tiles[r][e].setOwner(t);return!0}return!1}getValidMoves(r){let e=[];for(let t=0;t<this.r;t++){for(let n=0;n<this.c;n++){let o=this.tiles[t][n];o!==null&&o.owner===(r+1)%NUM_PLAYERS&&(e=e.concat(o.getSiblings().filter(r=>this.tiles[r.r]!==void 0).map(r=>this.tiles[r.r][r.c]).filter(r=>r).filter(r=>r.owner===void 0)))}}return e}getBoardTile(r,e){return this.tiles[r][e]}}class BoardTile{constructor(r,e){this.r=r;this.c=e;this.owner=void 0}setOwner(r){this.owner=r}getDirection(r){let e=this.r,t=this.c,n=!(this.r%2);switch(r){case 0:return{r:e+0,c:t+1};case 1:if(n)return{r:e+1,c:t+0};else return{r:e+1,c:t+1};case 2:if(n)return{r:e+1,c:t-1};else return{r:e+1,c:t+0};case 3:return{r:e+0,c:t-1};case 4:if(n)return{r:e-1,c:t-1};else return{r:e-1,c:t+0};case 5:if(n)return{r:e-1,c:t+0};else return{r:e-1,c:t+1};default:return void 0}}getSiblings(){let r=[];for(let e=0;e<6;e++)r.push(this.getDirection(e));return r}}