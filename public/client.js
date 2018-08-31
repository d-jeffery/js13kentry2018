"use strict";window.requestAnimFrame=(function(e){return window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimaitonFrame||function(e){window.setTimeout(e,16.666666666666668)}})(),!function(){let e,t,n,r,o=[0,0],i,s,c;var a,u;function l(){for(let e=0;e<t.length;e++)t[e].setAttribute("disabled","disabled")}function g(){for(let e=0;e<t.length;e++)t[e].removeAttribute("disabled")}function f(e,t){n.innerHTML=`<h2 class='${t}'>${e}</h2>`}function d(e){r.innerHTML=["<h2>"+e+"</h2>","Blue: "+o[s]," -- ","Red: "+o[(s+1)%NUM_PLAYERS],"<br>"].join("")}function m(){e.on("start",(e,t)=>{a=e,s=t,console.log(a,s),g(),f("Game Start!"),c.start()});e.on("turn",(e,t,n)=>{a=e,u=n,o=t,console.log("turn",s,t,u),g(),f("Your turn!","zoom"),d("The score")});e.on("wait",(e,t)=>{a=e,u=[],o=t,console.log("wait",s,t),l(),f("Opponents turn!"),d("The score")});e.on("win",()=>{d("You win!")});e.on("lose",()=>{d("You lose!")});e.on("draw",()=>{d("Draw!")});e.on("end",()=>{l(),f("Waiting for opponent...")});e.on("connect",()=>{l(),f("Waiting for opponent...")});e.on("disconnect",()=>{l(),f("Connection lost!")});e.on("error",()=>{l(),f("Connection error!")})}function p(){e=io({upgrade:!1,transports:["websocket"]});t=document.getElementsByTagName("button");n=document.getElementById("message");r=document.getElementById("score");i=document.getElementById("game");c=w(480,540,i);a=void 0;l();m()}window.addEventListener("load",p,!1);function w(e,t,n){let r=new C(e,t,n),o=new I(e,t);r.setStage(o);r.setStageTransition(()=>{if(r.stage instanceof I){let n=new T(e,t);r.setStage(n)}});return r}class h{constructor(e,t){this.x=e;this.y=t}}function x(e,t){return Math.sqrt(Math.pow(t.x-e.x,2)+Math.pow(t.y-e.y,2))}function b(e,t){let n=e.getBoundingClientRect();return new h(t.clientX-n.left,t.clientY-n.top)}function y(e,t){let n=e.getBoundingClientRect();return new h(t.touches[0].clientX-n.left,t.touches[0].clientY-n.top)}class A{constructor(){if(A.instance){return A.instance}this.numOfImages=0;this.numComplete=0;this.images={};A.instance=this}loadImage(e,t){this.numOfImages++;let n=new Image;n.onload=()=>{A.instance.images[e]=n,A.instance.numComplete++};n.src=t}getImage(e){let t=this.images[e];if(t instanceof Image){return t}throw new Error(e+' is not a valid key')}getProgress(){return this.numComplete/this.numOfImages}loadingIsCompleted(){if(this.numOfImages===0){return!0}return this.getProgress()===1}}class C{constructor(e,t,n){this.w=e;this.h=t;this.canvas=n;this.canvas.width=this.w;this.canvas.height=this.h;this.ctx=this.canvas.getContext('2d');this.stage=void 0}setStage(e){this.stage=e;this.stage.ctx=this.ctx;this.stage.init()}setStageTransition(e){this.transitionFun=e}start(){this.running=!0;let e=this;function t(){let n=Date.now(),r=n-e.currentTime;e.currentTime=n;e.running&&e.update(r/1e3);e.render();window.requestAnimFrame(t)}window.requestAnimFrame(t)}stop(){this.running=!1}update(e){this.stage.finished&&this.transitionFun!==void 0&&this.transitionFun();this.stage!==void 0&&this.stage.update(e)}render(){this.ctx.save();this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);this.ctx.restore();this.stage!==void 0&&this.stage.render()}}class F{constructor(e,t){this.w=e;this.h=t;this.ctx=void 0;this.finished=!1;this.actors=[]}addActor(e){e.stage=this;e.init();this.actors.push(e)}init(){this.finished=!1}update(e){this.actors=this.actors.filter(e=>!e.remove);this.sortActorsByLayer();for(let t of this.actors)t.update(e)}render(){for(let e of this.actors)e.render()}sortActorsByLayer(){this.actors.sort((e,t)=>{return e.layer-t.layer})}}class I extends F{constructor(e,t){super(e,t);this.assetLoader=new A;this.progress=this.assetLoader.getProgress()}update(e){super.update(e);this.progress=this.assetLoader.getProgress();this.assetLoader.loadingIsCompleted()&&(this.finished=!0)}render(){super.render();this.ctx.save();this.drawProgress();this.ctx.restore()}drawProgress(){let e=20,t=this.w-e*2,n=50,r=t*this.progress;this.ctx.strokeRect(e,this.h/2-n/2,t,n);this.ctx.fillRect(e,this.h/2-n/2,r,n)}}class S{constructor(e,t){this.pos=e;this.layer=t.layer?t.layer:0;this.stage=t.stage?t.stage:void 0;this.debugColour=t.debugColour?t.debugColour:'#000000';this.remove=!1}init(){}update(e){}render(){this.debugDraw()}debugDraw(){}}class v extends S{constructor(e,t,n){super(e,n);this.r=t}debugDraw(){let e=this.stage.ctx;e.beginPath();e.fillStyle=this.debugColour;e.arc(this.pos.x,this.pos.y,this.r,0,2*Math.PI);e.fill()}}class T extends F{constructor(e,t){super(e,t);this.mesh=[];this.tileSize=25}init(){super.init();for(let e=0;e<a.r;e++){for(let t=0;t<a.c;t++){if(a.tiles[e][t]===null){continue}let n=a.tiles[e][t],r=n.c*65+60+this.tileSize*(e%2),o=n.r*65+30;this.addActor(new P(new h(r,o),this.tileSize,n))}}i.addEventListener("mousedown",t=>{let n=b(i,t),r=this.actors.filter(e=>e instanceof P).filter(e=>e.doesIntersect(n));if(r[0]!==void 0){let t=r[0].tile;e.emit("move",{r:t.r,c:t.c})}});i.addEventListener("touchstart",t=>{let n=y(i,t),r=this.actors.filter(e=>e instanceof P).filter(e=>e.doesIntersect(n));if(r[0]!==void 0){let t=r[0].tile;e.emit("move",{r:t.r,c:t.c})}});for(let e=0;e<a.r;e++){for(let t=0;t<a.c;t++){if(a.tiles[e][t]===null){continue}let n=a.tiles[e][t],r=new BoardTile(n.r,n.c);r.getSiblings().filter(e=>a.tiles[e.r]!==void 0).map(e=>a.tiles[e.r][e.c]).filter(e=>e).forEach(t=>{let r=n.c*65+60+this.tileSize*(e%2),o=n.r*65+30,i=t.c*65+60+this.tileSize*(t.r%2),s=t.r*65+30;this.mesh.push({from:new h(r,o),to:new h(i,s)})})}}}update(e){super.update(e)}render(){let e=this.ctx;for(let t of this.mesh){let n=t.from,r=t.to;e.strokeStyle="#000000";e.lineWidth=2;e.beginPath();e.moveTo(n.x,n.y);e.lineTo(r.x,r.y);e.stroke()}super.render()}}class P extends v{constructor(e,t,n){super(e,t,{layer:n.y});this.tile=n;this.accum=0}doesIntersect(e){return x(e,this.pos)<this.r}update(e){this.accum=(this.accum+e)%Math.PI}render(){this.tile=a.tiles[this.tile.r][this.tile.c];let e=this.stage.ctx;this.tile.owner===s?(this.debugColour="#0000FF"):this.tile.owner!==void 0?(this.debugColour="#FF0000"):(this.debugColour="#000000");super.render();this.tile.score>1&&(e.fillStyle="#FFFF00",e.font="20px Arial",e.globalAlpha=1-Math.sin(this.accum)/2,e.fillText("+"+this.tile.score,this.pos.x-10,this.pos.y+5),e.globalAlpha=1);u.filter(e=>e.r===this.tile.r&&e.c===this.tile.c).length>0&&(e.strokeStyle="#777777",e.lineWidth=5,e.globalAlpha=1-Math.sin(this.accum)/2,e.beginPath(),e.arc(this.pos.x,this.pos.y,this.r-3,0,2*Math.PI),e.stroke(),e.globalAlpha=1)}}}()