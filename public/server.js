"use strict";let users=new Set;function startGame(e,o){let n=Math.floor(Math.random()*2)==0;n?new Game(e,o).start():new Game(o,e).start()}function findOpponent(e){for(let o of users)e!==o&&o.opponent===null&&startGame(e,o)}function startGameWithBasicAI(e){startGame(e,new BasicAI)}function startGameWithBetterAI(e){startGame(e,new BetterAI)}function removeUser(e){users.delete(e)}class Game{constructor(e,o){this.user1=e;this.user2=o;this.user1.playerNo=PLAYER_1;this.user2.playerNo=PLAYER_2;this.turn=Math.floor(Math.random()*2);this.gameboard=new RectGameBoard(8,6,!1);this.gameboard.createBoard()}start(){this.user1.start(this,this.user2);this.user2.start(this,this.user1)}ended(){return this.gameboard.isBoardFilled()||this.user1.passed&&this.user2.passed}doTurn(){this.turn=(this.turn+1)%NUM_PLAYERS}score(){let e=this.gameboard.getScores();e[this.user1.playerNo]>e[this.user2.playerNo]?(this.user1.win(),this.user2.lose()):e[this.user1.playerNo]<e[this.user2.playerNo]?(this.user2.win(),this.user1.lose()):(this.user1.draw(),this.user2.draw())}}class User{constructor(e){this.socket=e;this.playerNo=null;this.game=null;this.opponent=null;this.passed=!1}start(e,o){this.game=e;this.opponent=o;this.socket.emit("start",this.game.gameboard,this.playerNo)}end(){this.game=null;this.opponent=null;this.socket.emit("end")}wait(){this.socket.emit("wait",this.game.gameboard,this.game.gameboard.getScores())}turn(){this.socket.emit("turn",this.game.gameboard,this.game.gameboard.getScores(),this.game.gameboard.getValidMoves(this.playerNo))}win(){this.socket.emit("win",this.opponent.guess)}lose(){this.socket.emit("lose",this.opponent.guess)}draw(){this.socket.emit("draw",this.opponent.guess)}}class BasicAI extends User{constructor(){super(null);this.playerNo=null;this.game=null;this.opponent=null;this.passed=!1}start(e,o){this.game=e;this.opponent=o}end(){this.game=null;this.opponent=null}wait(){}turn(){let e=this;if(e.game.ended()){e.game.score();return}setTimeout(function(){let o=e.game.gameboard.getValidMoves(e.playerNo);if(o.length>0){let n=void 0,a=-Number.MAX_SAFE_INTEGER;o.forEach((o,t)=>{let r=e.game.gameboard.copy();r.doMove(o.r,o.c,e.playerNo);let s=alphabeta(r,0,-Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER,!1,e.playerNo);s>a&&(a=s,n=t)});e.game.gameboard.doMove(o[n].r,o[n].c,e.playerNo);e.passed=!1}else e.passed=!0;e.opponent.turn();e.wait();e.game.doTurn();e.game.ended()&&e.game.score()},1e3)}win(){}lose(){}draw(){}}class BetterAI extends User{constructor(){super(null);this.playerNo=null;this.game=null;this.opponent=null;this.passed=!1}start(e,o){this.game=e;this.opponent=o}end(){this.game=null;this.opponent=null}wait(){}turn(){let e=this;if(e.game.ended()){e.game.score();return}setTimeout(function(){let o=e.game.gameboard.getValidMoves(e.playerNo);if(o.length>0){let n=void 0,a=-Number.MAX_SAFE_INTEGER;o.forEach((o,t)=>{let r=e.game.gameboard.copy();r.doMove(o.r,o.c,e.playerNo);let s=alphabeta(r,4,-Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER,!1,e.playerNo);s>a&&(a=s,n=t)});e.game.gameboard.doMove(o[n].r,o[n].c,e.playerNo);e.passed=!1}else e.passed=!0;e.opponent.turn();e.wait();e.game.doTurn();e.game.ended()&&e.game.score()},1e3)}win(){}lose(){}draw(){}}function alphabeta(e,o,n,a,t,r){if(o===0||e.isBoardFilled()){let o=e.getScores();return o[r]-o[(r+1)%NUM_PLAYERS]}let s=n,u=a;if(t){let n=e.getValidMoves(r);if(n.length>0){let a=-Number.MAX_SAFE_INTEGER;for(let t of n){let n=e.copy();n.doMove(t.r,t.c,r);a=Math.max(a,alphabeta(n,o-1,s,u,!1,r));s=Math.max(s,a);if(s>=u)break}return a}else{return alphabeta(e,o-1,s,u,!1,r)}}else{let n=(r+1)%NUM_PLAYERS,a=e.getValidMoves(n);if(a.length>0){let t=Number.MAX_SAFE_INTEGER;for(let p of a){let a=e.copy();a.doMove(p.r,p.c,n);t=Math.min(t,alphabeta(a,o-1,s,u,!0,r));u=Math.min(u,t);if(s>=u)break}return t}else{return alphabeta(e,o-1,s,u,!0,r)}}}module.exports={io:e=>{let o=new User(e);e.on("find-human",()=>{console.log("Find Human: "+e.id),users.add(o),findOpponent(o),o.opponent&&(o.game.turn===o.playerNo?(o.opponent.wait(),o.turn()):(o.opponent.turn(),o.wait()))});e.on("start-basic-ai",()=>{console.log("Start basic AI: "+e.id),removeUser(o),startGameWithBasicAI(o),o.opponent&&(o.game.turn===o.playerNo?(o.opponent.wait(),o.turn()):(o.opponent.turn(),o.wait()))});e.on("start-better-ai",()=>{console.log("Start Better AI: "+e.id),removeUser(o),startGameWithBetterAI(o),o.opponent&&(o.game.turn===o.playerNo?(o.opponent.wait(),o.turn()):(o.opponent.turn(),o.wait()))});e.on("disconnect",()=>{console.log("Disconnected: "+e.id),removeUser(o),o.opponent&&o.opponent.end()});e.on("move",n=>{console.log("Move: "+e.id),o.game.turn===o.playerNo&&(o.game.gameboard.doMove(n.r,n.c,o.playerNo)&&(o.passed=!1,o.wait(),o.opponent.turn(),o.game.doTurn()),o.game.ended()&&o.game.score())});e.on("pass",()=>{console.log("Pass: "+e.id),o.game.turn===o.playerNo&&(o.passed=!0,o.wait(),o.opponent.turn(),o.game.doTurn(),o.game.ended()&&o.game.score())});console.log("Connected: "+e.id)},stat:(e,o)=>{storage.get('games',0).then(e=>{o.send(`<h1>Games played: ${e}</h1>`)})}}