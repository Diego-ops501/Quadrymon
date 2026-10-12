"use strict";
const {app,BrowserWindow,session}=require("electron"),fs=require("fs"),path=require("path"),os=require("os");
app.setPath("userData",fs.mkdtempSync(path.join(os.tmpdir(),"quadrymon-preferences-")));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1000,height:700,webPreferences:{contextIsolation:true,sandbox:true}});
 try{
  await session.defaultSession.protocol.handle('https',()=>new Response('<html><head></head><body><div class="game-root"><div class="chat-box"><input placeholder="Falar em Mundo…"></div><nav class="game-dock"><button>Menu</button></nav><div class="ah-panel"><button>Auto-Helper</button></div><div class="cap-panel">Captura</div><div class="game-hud-tl">Trainer</div><canvas width="1600" height="832"></canvas></div></body></html>',{headers:{'content-type':'text/html'}}));
  await win.loadURL('https://poke.idleworld.online/play');
  win.webContents.focus();
  await win.webContents.insertCSS('*{transition:none!important}',{cssOrigin:'user'});
  await win.webContents.executeJavaScript(fs.readFileSync(path.join(__dirname,'../src/game/preferences.js'),'utf8'));
  await win.webContents.executeJavaScript(`(async()=>{
   const check=(ok,label)=>{if(!ok)throw Error(label)},style=selector=>getComputedStyle(document.querySelector(selector)),pause=()=>new Promise(r=>setTimeout(r,250));
   document.body.tabIndex=-1;document.body.focus();
   PokeMuxGamePreferences.configure({chat:false,dock:false,clean:true,fps:0});await pause();
   check(style('.chat-box').display==='none','hide the actual chat-box');
   check(style('.game-dock').display==='none','hide dock completely');
   check(style('.cap-panel').display==='none','hide capture popup');
   check(Number(style('.ah-panel').opacity)===0&&Number(style('.game-hud-tl').opacity)===0,'clean the real HUD selectors');
   document.querySelector('.ah-panel button').focus();await pause();check(Number(style('.ah-panel').opacity)===1,'Auto-Helper remains accessible on focus: '+JSON.stringify({focus:document.hasFocus(),active:document.activeElement.className,match:document.querySelector('.ah-panel').matches(':focus-within'),opacity:style('.ah-panel').opacity}));
   const replacement=document.createElement('div');replacement.className='chat-box';replacement.textContent='new chat';document.querySelector('.chat-box').replaceWith(replacement);check(style('.chat-box').display==='none','hidden chat survives React replacement');
   dispatchEvent(new KeyboardEvent('keydown',{key:'F2',bubbles:true,cancelable:true}));check(style('.game-dock').display!=='none','F2 shows this account dock');
   PokeMuxGamePreferences.configure({chat:false,dock:false,clean:false,fps:0});check(style('.game-dock').display!=='none','account shortcut survives performance updates');
   dispatchEvent(new KeyboardEvent('keydown',{key:'F2',bubbles:true,cancelable:true}));check(style('.game-dock').display==='none','F2 hides the dock again');
   PokeMuxGamePreferences.configure({chat:true,dock:true,clean:false,summary:true,fps:0});check(style('.chat-box').display!=='none'&&style('.game-dock').display!=='none','settings restore chat and dock');
   check(style('canvas').visibility==='hidden','summary avoids drawing the game');
   PokeMuxGamePreferences.configure({chat:true,dock:true,clean:false,summary:false,fps:0});await pause();check(style('canvas').visibility==='visible'&&style('.cap-panel').display!=='none','returning to grid restores HUD and canvas');
  })()`);
  console.log('Game preferences: actual chat/HUD selectors, component replacement, restoration, F2 and summary drawing passed.');app.exit(0);
 }catch(e){console.error(e.stack);app.exit(1)}
});setTimeout(()=>app.exit(1),30000);
