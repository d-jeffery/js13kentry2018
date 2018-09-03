"use strict";let users=new Set;function findOpponent(e){for(let n of users)e!==n&&n.opponent===null&&new Game(e,n).start()}function removeUser(e){users.delete(e)}function startGameWithAI(e){new Game(e,new BasicAI).start()}class Game{constructor(e,n){this.user1=e;this.user2=n;this.user1.playerNo=PLAYER_1;this.user2.playerNo=PLAYER_2;this.turn=PLAYER_1;this.gameboard=new RectGameBoard(6,8,!1)}start(){this.user1.start(this,this.user2);this.user2.start(this,this.user1)}ended(){return this.gameboard.isBoardFilled()||this.user1.passed&&this.user2.passed}score(){let e=this.gameboard.getScores();e[this.user1.playerNo]>e[this.user2.playerNo]?(this.user1.win(),this.user2.lose()):e[this.user1.playerNo]<e[this.user2.playerNo]?(this.user2.win(),this.user1.lose()):(this.user1.draw(),this.user2.draw())}}class User{constructor(e){this.socket=e;this.playerNo=null;this.game=null;this.opponent=null;this.passed=!1}start(e,n){this.game=e;this.opponent=n;this.socket.emit("start",this.game.gameboard,this.playerNo)}end(){this.game=null;this.opponent=null;this.socket.emit("end")}wait(){this.socket.emit("wait",this.game.gameboard,this.game.gameboard.getScores())}turn(){this.socket.emit("turn",this.game.gameboard,this.game.gameboard.getScores(),this.game.gameboard.getValidMoves(this.playerNo))}win(){this.socket.emit("win",this.opponent.guess)}lose(){this.socket.emit("lose",this.opponent.guess)}draw(){this.socket.emit("draw",this.opponent.guess)}}class BasicAI extends User{constructor(){super(null);this.playerNo=null;this.game=null;this.opponent=null;this.passed=!1}start(e,n){this.game=e;this.opponent=n}end(){this.game=null;this.opponent=null}wait(){}turn(){let e=this;if(e.game.ended()){e.game.score();return}setTimeout(function(){let n=e.game.gameboard.getValidMoves(e.playerNo);if(n.length>0){let o=void 0,a=-1;n.forEach((n,t)=>{let r=e.game.gameboard.score(n.r,n.c,e.playerNo);r>a&&(a=r,o=t)});e.game.gameboard.doMove(n[o].r,n[o].c,e.playerNo);e.passed=!1}else e.passed=!0;e.opponent.turn();e.wait();e.game.turn=(e.game.turn+1)%NUM_PLAYERS;e.game.ended()&&e.game.score()},1e3)}win(){}lose(){}draw(){}}module.exports={io:e=>{let n=new User(e);e.on("find-human",()=>{console.log("Find Human: "+e.id),users.add(n),findOpponent(n),n.opponent&&(n.opponent.wait(),n.turn())});e.on("start-basic-ai",()=>{console.log("Start basic AI: "+e.id),startGameWithAI(n),n.opponent&&(n.opponent.wait(),n.turn())});e.on("disconnect",()=>{console.log("Disconnected: "+e.id),removeUser(n),n.opponent&&(n.opponent.end(),findOpponent(n.opponent))});e.on("move",o=>{console.log("Move: "+e.id),n.game.turn===n.playerNo&&(n.game.gameboard.doMove(o.r,o.c,n.playerNo)&&(n.passed=!1,n.wait(),n.opponent.turn(),n.game.turn=(n.game.turn+1)%NUM_PLAYERS),n.game.ended()&&n.game.score())});e.on("pass",()=>{console.log("Pass: "+e.id),n.game.turn===n.playerNo&&(n.passed=!0,n.wait(),n.opponent.turn(),n.game.turn=(n.game.turn+1)%NUM_PLAYERS,n.game.ended()&&n.game.score())});console.log("Connected: "+e.id)},stat:(e,n)=>{storage.get('games',0).then(e=>{n.send(`<h1>Games played: ${e}</h1>`)})}}