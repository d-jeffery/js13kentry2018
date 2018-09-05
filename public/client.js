"use strict";window.requestAnimFrame=(function(e){return window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimaitonFrame||function(e){window.setTimeout(e,16.666666666666668)}})(),!function(){let e,t,n,r,o,i,a,s,c=[0,0],l,u,d;var g,p;function f(e){i.innerHTML=`<h2>${e}</h2>`}function m(e,t){a.innerHTML=`<h2 class='${t}'>${e}</h2>`}function w(){s.innerHTML=["<h2>The score</h2>","Blue: "+c[u]," -- ","Red: "+c[(u+1)%NUM_PLAYERS],"<br>"].join("")}function h(){t.style.display="block"}function y(){t.style.display="none"}function F(){n.style.display="block"}function x(){n.style.display="none"}function A(){e.on("start",(e,t)=>{g=e,u=t,F(),y(),m("Game Start!"),d.start()});e.on("turn",(t,n,r)=>{g=t,p=r,c=n,p.length>0?m("Your turn!","zoom"):(m("You passed!"),e.emit("pass")),w()});e.on("wait",(e,t)=>{g=e,p=[],c=t,m("Opponents turn!"),w()});e.on("win",()=>{m("You win!","zoom"),w()});e.on("lose",()=>{m("You lose!"),w()});e.on("draw",()=>{m("Draw!"),w()});e.on("end",()=>{x(),h(),f("Waiting for opponent...")});e.on("connect",()=>{x(),h(),f("Connected to server.")});e.on("disconnect",()=>{x(),h(),f("Connection lost!")});e.on("error",()=>{x(),h(),f("Connection error!")});r.addEventListener("click",function(t){f("Waiting for opponent...");e.emit("find-human")},!1);o.addEventListener("click",function(t){e.emit("start-basic-ai")},!1)}function I(){e=io({upgrade:!1,transports:["websocket"]});t=document.getElementById("intro-wrapper");n=document.getElementById("game-wrapper");r=document.getElementById("find-human");o=document.getElementById("start-basic-ai");i=document.getElementById("status");a=document.getElementById("message");s=document.getElementById("score");l=document.getElementById("game");d=b(320,400,l);g=void 0;A()}window.addEventListener("load",I,!1);function b(e,t,n){let r=new L(e,t,n),o=new R(e,t);r.setStage(o);r.setStageTransition(()=>{if(r.stage instanceof R){let n=new q(e,t);r.setStage(n)}});return r}function S(e,t,n){let r=parseInt(e.replace(/#/g,''),16),o=r>>16,i=r>>8&255,a=r&255,s=parseInt(t.replace(/#/g,''),16),c=s>>16,l=s>>8&255,u=s&255,d=o+n*(c-o),g=i+n*(l-i),p=a+n*(u-a);return'#'+(16777216+(d<<16)+(g<<8)+p|0).toString(16).slice(1)}class v{constructor(e,t){this.x=e;this.y=t}}function C(e,t){return Math.sqrt(Math.pow(t.x-e.x,2)+Math.pow(t.y-e.y,2))}function B(e,t){let n=e.getBoundingClientRect();return new v(t.clientX-n.left,t.clientY-n.top)}function k(e,t){let n=e.getBoundingClientRect();return new v(t.touches[0].clientX-n.left,t.touches[0].clientY-n.top)}class E{constructor(){if(E.instance){return E.instance}this.numOfImages=0;this.numComplete=0;this.images={};E.instance=this}loadImage(e,t){this.numOfImages++;let n=new Image;n.onload=()=>{E.instance.images[e]=n,E.instance.numComplete++};n.src=t}getImage(e){let t=this.images[e];if(t instanceof Image){return t}throw new Error(e+' is not a valid key')}getProgress(){return this.numComplete/this.numOfImages}loadingIsCompleted(){if(this.numOfImages===0){return!0}return this.getProgress()===1}}class L{constructor(e,t,n){this.w=e;this.h=t;this.canvas=n;this.canvas.width=this.w;this.canvas.height=this.h;this.ctx=this.canvas.getContext('2d');this.stage=void 0}setStage(e){this.stage=e;this.stage.ctx=this.ctx;this.stage.init()}setStageTransition(e){this.transitionFun=e}start(){this.running=!0;let e=this;function t(){let n=Date.now(),r=n-e.currentTime;e.currentTime=n;e.running&&e.update(r/1e3);e.render();window.requestAnimFrame(t)}window.requestAnimFrame(t)}stop(){this.running=!1}update(e){this.stage.finished&&this.transitionFun!==void 0&&this.transitionFun();this.stage!==void 0&&this.stage.update(e)}render(){this.ctx.save();this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);this.ctx.restore();this.stage!==void 0&&this.stage.render()}}class P{constructor(e,t){this.w=e;this.h=t;this.ctx=void 0;this.finished=!1;this.actors=[]}addActor(e){e.stage=this;e.init();this.actors.push(e)}init(){this.finished=!1}update(e){this.actors=this.actors.filter(e=>!e.remove);this.sortActorsByLayer();for(let t of this.actors)t.update(e)}render(){for(let e of this.actors)e.render()}sortActorsByLayer(){this.actors.sort((e,t)=>{return e.layer-t.layer})}}class R extends P{constructor(e,t){super(e,t);this.assetLoader=new E;this.progress=this.assetLoader.getProgress()}update(e){super.update(e);this.progress=this.assetLoader.getProgress();this.assetLoader.loadingIsCompleted()&&(this.finished=!0)}render(){super.render();this.ctx.save();this.drawProgress();this.ctx.restore()}drawProgress(){let e=20,t=this.w-e*2,n=50,r=t*this.progress;this.ctx.strokeRect(e,this.h/2-n/2,t,n);this.ctx.fillRect(e,this.h/2-n/2,r,n)}}class T{constructor(e,t){this.pos=e;this.layer=t.layer?t.layer:0;this.stage=t.stage?t.stage:void 0;this.debugColour=t.debugColour?t.debugColour:'#000000';this.remove=!1}init(){}update(e){}render(){this.debugDraw()}debugDraw(){}}class Y extends T{constructor(e,t,n){super(e,n);this.r=t}debugDraw(){let e=this.stage.ctx;e.beginPath();e.fillStyle=this.debugColour;e.arc(this.pos.x,this.pos.y,this.r,0,2*Math.PI);e.fill()}}class q extends P{constructor(e,t){super(e,t);this.mesh=[];this.tileSize=20;this.gap=50;this.paddingX=this.tileSize+2;this.paddingY=this.tileSize+8}init(){super.init();for(let e=0;e<g.r;e++){for(let t=0;t<g.c;t++){if(g.tiles[e][t]===null){continue}let n=g.tiles[e][t],r=n.c*this.gap+this.paddingX+this.gap/2*(e%2),o=n.r*this.gap+this.paddingY;this.addActor(new X(new v(r,o),this.tileSize,n))}}l.addEventListener("mousedown",t=>{let n=B(l,t),r=this.actors.filter(e=>e instanceof X).filter(e=>e.doesIntersect(n));if(r[0]!==void 0){let t=r[0].tile;e.emit("move",{r:t.r,c:t.c})}});l.addEventListener("touchstart",t=>{let n=k(l,t),r=this.actors.filter(e=>e instanceof X).filter(e=>e.doesIntersect(n));if(r[0]!==void 0){let t=r[0].tile;e.emit("move",{r:t.r,c:t.c})}});for(let e=0;e<g.r;e++){for(let t=0;t<g.c;t++){if(g.tiles[e][t]===null){continue}let n=g.tiles[e][t],r=new BoardTile(n.r,n.c);r.getSiblings().filter(e=>g.tiles[e.r]!==void 0).map(e=>g.tiles[e.r][e.c]).filter(e=>e).forEach(t=>{let r=n.c*this.gap+this.paddingX+this.gap/2*(e%2),o=n.r*this.gap+this.paddingY,i=t.c*this.gap+this.paddingX+this.gap/2*(t.r%2),a=t.r*this.gap+this.paddingY;this.mesh.push({from:new v(r,o),to:new v(i,a)})})}}}update(e){super.update(e)}render(){let e=this.ctx;for(let t of this.mesh){let n=t.from,r=t.to;e.strokeStyle="#000000";e.lineWidth=2;e.beginPath();e.moveTo(n.x,n.y);e.lineTo(r.x,r.y);e.stroke()}super.render()}}class X extends Y{constructor(e,t,n){super(e,t,{layer:n.y});this.tile=n;this.alphaAccum=0;this.lerpAccum=1}doesIntersect(e){return C(e,this.pos)<this.r}update(e){let t=this.tile.owner;this.tile=g.tiles[this.tile.r][this.tile.c];t!==void 0&&t!==this.tile.owner&&(this.lerpAccum=0);this.lerpAccum+=e*2;this.lerpAccum>1&&(this.lerpAccum=1);this.alphaAccum=(this.alphaAccum+e)%Math.PI}render(){let e=this.stage.ctx,t;this.tile.owner===u?(t=e.createRadialGradient(this.pos.x-10,this.pos.y-10,0,this.pos.x,this.pos.y,100),t.addColorStop(.2,S("#FF0000","#0000FF",this.lerpAccum)),t.addColorStop(0,"#FFFFFF")):this.tile.owner!==void 0?(t=e.createRadialGradient(this.pos.x-10,this.pos.y-10,0,this.pos.x,this.pos.y,100),t.addColorStop(.2,S("#0000FF","#FF0000",this.lerpAccum)),t.addColorStop(0,"#FFFFFF")):(t="#000000");e.save();e.beginPath();e.fillStyle=t;e.strokeStyle="#000000";e.lineWidth=3;e.arc(this.pos.x,this.pos.y,this.r,0,2*Math.PI);e.fill();e.stroke();e.restore();this.tile.score>1&&(e.fillStyle="#FFFF00",e.font="bold 20px Arial",e.globalAlpha=1-Math.sin(this.alphaAccum)/2,e.fillText("+"+this.tile.score,this.pos.x-10,this.pos.y+5),e.globalAlpha=1);p.filter(e=>e.r===this.tile.r&&e.c===this.tile.c).length>0&&(e.strokeStyle="#cccccc",e.lineWidth=5,e.globalAlpha=1-Math.sin(this.alphaAccum)/2,e.beginPath(),e.arc(this.pos.x,this.pos.y,this.r-3,0,2*Math.PI),e.stroke(),e.globalAlpha=1)}}}()