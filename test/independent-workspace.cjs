"use strict";
const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os");
const directory = path.resolve(__dirname, "..");
app.setPath(
  "userData",
  path.join(os.tmpdir(), "pokemux-independent-test-" + process.pid),
);
const runtime = [
  "src/domain/pokemon-state.js",
  "src/game/session.js",
  "src/domain/iv-math.js",
  "src/game/iv-reader.js",
]
  .map((file) => fs.readFileSync(path.join(directory, file), "utf8"))
  .join("\n");
const fixtures = {
  "creds:load": () => [
    { name: "one", email: "", senha: "fixture-recovered" },
    { name: "Boreal", email: "two", senha: "" },
    { name: "Citrino", email: "three", senha: "" },
    { name: "Dourado", email: "four", senha: "" },
  ],
  "game-runtime:read": () => runtime,
  "game-catalog:load": () => ({
    version: 1,
    at: Date.now(),
    entries: [{ kind: "pokemon", name: "Dratini", speciesId: 147 }],
  }),
  "autostart:get": () => ({ on: false, suportado: true }),
  "notify": (_title, text) => { notificationTexts.push(text); return true; },
};
const notificationTexts = [];
let savedAccounts;
ipcMain.handle("creds:save", (_event, value) => {
  savedAccounts = value;
  return true;
});
for (const channel of [
  "creds:load",
  "game-runtime:read",
  "game-catalog:load",
  "game:performance",
  "awake:set",
  "mintray:set",
  "autostart:get",
  "log:write",
  "errlog:write",
  "notify",
  "overlay:state",
])
  ipcMain.handle(channel, (_event, ...args) => fixtures[channel]?.(...args) ?? false);
ipcMain.on("app:version", (event) => {
  event.returnValue = "independent-test";
});
app.on("web-contents-created", (_event, contents) => {
  contents.session.webRequest.onBeforeRequest(
    { urls: ["https://*/*", "http://*/*"] },
    (_details, callback) => callback({ cancel: true }),
  );
  contents.on("will-attach-webview", (_event, _preferences, parameters) => {
    parameters.src = "about:blank";
  });
});
app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    width: 1440,
    height: 950,
    useContentSize: true,
    webPreferences: {
      preload: path.join(directory, "preload.js"),
      contextIsolation: true,
      sandbox: true,
      webviewTag: true,
      backgroundThrottling: false,
    },
  });
  try {
    await win.loadFile(path.join(directory, "index.html"));
    const output = await win.webContents.executeJavaScript(`(async()=>{
      const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms)),check=(condition,label)=>{if(!condition)throw Error(label);};
      for(let i=0;i<100&&!window.PokeMuxRuntime;i++)await pause(50);
      check(window.PokeMuxRuntime,'new runtime boots');await pause(100);
      for(let i=0;i<100&&!document.querySelector('#workspaceAccounts').textContent.includes('Boreal');i++)await pause(50);
      check(document.querySelectorAll('webview').length===4,'four game partitions');
      check(document.querySelector('#workspaceAccounts').textContent.includes('Boreal'),'saved names remain visible');
      const original=[...document.querySelectorAll('webview')];
      check(document.body.classList.contains('native-ratio'),'original game ratio is enabled by default');
      check(document.querySelector('#hideGameNotices').getAttribute('aria-pressed')==='true','game notice hiding starts enabled');
      document.querySelector('#hideGameNotices').click();check(localStorage.getItem('hideGameNotices')==='0'&&document.querySelector('#hideGameNotices').getAttribute('aria-pressed')==='false','game notices can be restored and preference persists');
      document.querySelector('#hideGameNotices').click();check(localStorage.getItem('hideGameNotices')==='1','notice hiding can be enabled again');
      document.querySelector('#layout').click();await pause(100);
      check(document.querySelector('#grid').dataset.layout==='col'&&localStorage.getItem('layout')==='col','column layout persists');
      document.querySelector('#layout').click();await pause(100);
      check(document.querySelector('#grid').dataset.layout==='row','row layout is restored');
      document.querySelector('#layout').click();await pause(100);
      check(original.every((view,index)=>document.querySelectorAll('webview')[index]===view),'layout changes preserve all game sessions');
      document.querySelector('#propNat').click();check(localStorage.getItem('propNat')==='0'&&!document.body.classList.contains('native-ratio'),'aspect ratio toggle persists');
      document.querySelector('#propNat').click();
      const shownChat=document.querySelector('#chat').getAttribute('aria-pressed');document.querySelector('#chat').click();
      check(document.querySelector('#chat').getAttribute('aria-pressed')!==shownChat&&localStorage.getItem('chat')===(shownChat==='true'?'0':'1'),'chat settings state and storage agree');
      document.querySelector('#chat').click();
      document.querySelector('#statsBtn').click();
      const initialWidth=parseInt(document.querySelector('#stats').style.width);
      document.querySelector('#analysisResize').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));
      check(Number(localStorage.getItem('statsW'))===initialWidth+20,'analysis pane width remains adjustable and persistent');
      document.querySelector('#analysisResize').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
      document.querySelector('#statsBtn').click();
      document.querySelector('#workspaceAccounts [data-account="1"]').click();await pause(50);
      check(document.body.dataset.workspaceMode==='focus','focus switches');
      check(document.body.classList.contains('stats-open')&&document.querySelector('#stats .st-tab.active').dataset.account==='1','entering focus opens analysis for the focused account');
      const focusGrid=document.querySelector('#grid').getBoundingClientRect(),focusRail=document.querySelector('#focusAccounts').getBoundingClientRect();
      check(focusRail.top>=focusGrid.bottom-1&&focusRail.height<100,'focus accounts form a compact strip below the game');
      document.querySelector('#stats [data-panel-action="account"][data-account="-1"]').click();
      document.querySelector('#workspaceAccounts [data-account="2"]').click();await pause(50);
      check(document.body.classList.contains('stats-open')&&document.querySelector('#stats .st-tab.active').dataset.account==='2','switching focus replaces a manually selected aggregate analysis immediately');
      const railWithAnalysis=document.querySelector('#focusAccounts').getBoundingClientRect(),analysisRect=document.querySelector('#stats').getBoundingClientRect();
      check(railWithAnalysis.right<=analysisRect.left+1,'bottom accounts stay inside game width when analysis opens');
      document.querySelector('#statsBtn').click();
      check(!document.body.classList.contains('stats-open'),'analysis can still be closed manually in focus');
      document.querySelector('[data-mode="grid"]').click();
      document.querySelector('[data-mode="focus"]').click();await pause(50);
      check(document.body.classList.contains('stats-open')&&document.querySelector('#stats .st-tab.active').dataset.account==='2','re-entering focus reopens analysis for the current account');
      document.querySelector('[data-mode="summary"]').click();await pause(50);
      check(document.querySelectorAll('#cards .runtime-card').length===4,'summary contains four cards');
      document.querySelector('#cards [data-panel-action="summary-config"]').click();
      document.querySelector('#cards [data-summary-section="table"]').click();
      check(!document.querySelector('#cards [data-s="table"]')&&JSON.parse(localStorage.getItem('cardsCfg')).hide.table===true,'actual runtime accepts native checkbox clicks to hide summary sections');
      document.querySelector('#cards [data-summary-section="table"]').click();
      check(document.querySelectorAll('#cards .runtime-card').length===4&&JSON.parse(localStorage.getItem('cardsCfg')).hide.table===false,'actual runtime accepts native checkbox clicks to restore summary sections');
      const beforeIvRule=document.querySelector('#cards [data-important-rule="ivEnabled"]').checked;
      document.querySelector('#cards [data-important-rule="ivEnabled"]').click();
      check(JSON.parse(localStorage.getItem('importantCaptures')).ivEnabled===!beforeIvRule,'actual runtime toggles the IV capture criterion');
      document.querySelector('#cards [data-important-rule="ivEnabled"]').click();
      check(original.every((view,index)=>document.querySelectorAll('webview')[index]===view),'mode changes preserve live sessions');
      document.querySelector('[data-mode="grid"]').click();await pause(50);
      const count=document.querySelector('#panelCount');count.value='2';count.dispatchEvent(new Event('change'));await pause(50);
      check(document.querySelectorAll('webview').length===2,'panel count decreases');
      check(original[0]===document.querySelectorAll('webview')[0]&&original[1]===document.querySelectorAll('webview')[1],'remaining sessions survive a count change');
      count.value='4';count.dispatchEvent(new Event('change'));await pause(50);
      count.value='3';count.dispatchEvent(new Event('change'));await pause(50);
      check(getComputedStyle(document.querySelector('#grid')).gridTemplateColumns.split(' ').length===2,'three accounts use the original two-column grid');
      count.value='4';count.dispatchEvent(new Event('change'));await pause(50);
      const untouched=document.querySelectorAll('webview')[1],power=document.querySelector('#grid .panel-header button:last-child');power.click();await pause(30);power.click();await pause(30);
      check(untouched===document.querySelectorAll('webview')[1],'turning one account back on preserves the other accounts');
      document.querySelector('#menuBtn').click();check(document.querySelector('#menu').open,'settings dialog opens');
      document.querySelector('#menu .settings-nav [data-section="analysis"]').click();
      check(document.querySelectorAll('#analysisSettings input[type="checkbox"]').length===9,'analysis sections are configurable in settings');
      document.querySelector('#menu .settings-search').value='Eco';document.querySelector('#menu .settings-search').dispatchEvent(new Event('input'));
      check(!document.querySelector('[data-section="performance"].settings-section').hidden,'settings search works');
      document.querySelector('#menu header button').click();check(!document.querySelector('#menu').open,'settings dialog closes');
      document.querySelector('#accounts').click();
      check(document.querySelector('[name="name0"]').readOnly,'game name cannot be mistaken for an editable login');
      check(document.querySelector('[name="email0"]').value==='one','legacy login in name field is recovered');
      document.querySelector('[name="email0"]').value='azuosd2';
      document.querySelector('[name="email1"]').value='fixture@example.invalid';
      const accountForm=document.querySelector('#accountForm');
      check(accountForm.checkValidity(),'account form accepts both username and email');
      accountForm.requestSubmit();for(let i=0;i<50&&document.querySelector('#accountEditor').open;i++)await pause(20);
      check(!document.querySelector('#accountEditor').open,'native form submission saves usernames');
      document.querySelector('#accounts').click();
      check(document.querySelector('[name="email0"]').value==='azuosd2','username is retained');
      check(document.querySelector('[name="email1"]').value==='fixture@example.invalid','email is retained');
      const namedView=document.querySelectorAll('webview')[0];
      namedView.getURL=()=> 'https://poke.idleworld.online/play';
      namedView.executeJavaScript=async()=>({ok:true,name:'OfficialTrainer',cid:'fixture-character',team:[],captures:[],shinies:[]});
      await PokeMuxRuntime.readState(0);
      check(document.querySelector('[name="name0"]').value==='OfficialTrainer','game snapshot fills the display name automatically');
      const spoken=[];Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{pending:false,speak:s=>spoken.push(s.text)}});
      if(document.querySelector('#voiceAlerts').getAttribute('aria-pressed')!=='true')document.querySelector('#voiceAlerts').click();
      const capturedAt=Date.now();
      namedView.executeJavaScript=async()=>({ok:true,name:'OfficialTrainer',cid:'fixture-character',team:[],captures:[{id:'voice-capture',n:'Girafarig',iv:116,q:1.8,t:capturedAt}],shinies:[]});
      await PokeMuxRuntime.readState(0);await pause(50);
      check(spoken.length===1&&spoken[0]==='OfficialTrainer: Girafarig, IVÊ 116, qualidade Lendária','capture speech pronounces IVÊ and names the actual rarity');
      namedView.getURL=()=> 'about:blank';
      document.querySelector('#accountEditor').close();
      document.querySelector('#inventoryBtn').click();await pause(100);check(document.querySelector('#inventoryDialog')?.open,'inventory opens');document.querySelector('#inventoryDialog').close();
      document.querySelector('#marketBtn').click();await pause(120);check(document.querySelector('#pmMarket').classList.contains('show'),'market opens without connected accounts');
      return {mode:document.body.dataset.workspaceMode,accounts:window.PokeMuxRuntime.state().accounts.length};
    })()`);
    console.log(
      "Independent Electron workspace passed: " + JSON.stringify(output),
    );
    if(!notificationTexts.includes('OfficialTrainer: Girafarig, IV 116, qualidade Lendária'))throw Error('Written capture alert must retain IV and include quality');
    await win.webContents.executeJavaScript(
      'document.querySelector("#mkClose")?.click()',
    );
    for (const width of [1440, 1100, 800]) {
      win.setContentSize(width, 950);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const layout = await win.webContents.executeJavaScript(
        '({width:innerWidth,scroll:document.documentElement.scrollWidth,panels:document.querySelectorAll("#grid>.panel").length})',
      );
      if (layout.scroll > layout.width + 1)
        throw Error("Horizontal overflow at " + width);
      console.log("Layout " + width + " passed");
    }
    if (savedAccounts?.[0]?.email !== 'azuosd2' || savedAccounts?.[1]?.email !== 'fixture@example.invalid')
      throw Error('Both login formats must reach credential storage unchanged');
    await win.webContents.executeJavaScript(`(async()=>{
      const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
      document.querySelector('#accounts').click();
      for(let i=0;i<4;i++)document.querySelector('[name="senha'+i+'"]').value='fixture-login-'+i;
      document.querySelector('#accountForm').requestSubmit();await pause(100);
      const calls=[];
      let waitingForChallenge=true;
      await pause(10000); // Let staggered real webview navigation settle before mocking login readiness.
      const views=[...document.querySelectorAll('webview')];
      views.forEach((view,index)=>{
        view.getURL=()=> 'https://poke.idleworld.online/login';
        view.executeJavaScript=async source=>{
          if(source.includes('async function loginInPage'))calls.push({index,submit:source.endsWith(',true)'),source});
          if(index===0&&waitingForChallenge&&source.endsWith(',true)'))return 'challenge';
          return source.endsWith(',true)')?'submitted':'filled';
        };
        view.dispatchEvent(new Event('dom-ready'));
      });
      await pause(100);
      if(calls.filter(x=>x.submit).length!==4)throw Error('Automatic login must fill and submit all four loaded accounts');
      waitingForChallenge=false;await pause(2200);
      if(calls.filter(x=>x.submit&&x.index===0).length!==2)throw Error('Automatic login must retry after a pending challenge becomes ready');
      if(calls.filter(x=>x.submit&&x.index!==0).length!==3)throw Error('Already submitted accounts must not be retried');
      calls.length=0;
      document.querySelector('#loginAll').click();await pause(100);
      const submits=calls.filter(x=>x.submit);
      if(submits.length!==4||new Set(submits.map(x=>x.index)).size!==4)throw Error('Account button must submit all four accounts');
      for(let i=0;i<4;i++)if(!submits[i].source.includes('fixture-login-'+i))throw Error('Login credentials crossed account boundaries');
    })()`);
    win.setContentSize(1440, 950);
    await new Promise((resolve) => setTimeout(resolve, 100));
    fs.writeFileSync(
      path.join(os.tmpdir(), "pokemux-independent-preview.png"),
      (await win.webContents.capturePage()).toPNG(),
    );
    app.exit(0);
  } catch (error) {
    console.error(error.stack);
    app.exit(1);
  }
});
setTimeout(() => {
  console.error("Independent UI test timed out");
  app.exit(1);
}, 30000);
