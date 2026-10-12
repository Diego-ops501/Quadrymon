"use strict";
const { app, BrowserWindow } = require("electron"), fs = require("node:fs"), path = require("node:path"), assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 900, height: 700, useContentSize: true, webPreferences: { sandbox: true, contextIsolation: true } });
  try {
    await win.loadURL('data:text/html;charset=utf-8,<div class="mkt2-details" style="width:240px"><div>Detalhes</div><div class="mkt2-details-name">Exeggcute</div><div>Nível 1</div><div>IV total 175/192</div><div>Qualidade Incomum ×1.32</div><div>Poder 12</div><div class="mkt2-stats"><div class="mkt2-statcell">HP <b>2</b></div><div class="mkt2-statcell">ATK <b>1</b></div><div class="mkt2-statcell">DEF <b>2</b></div><div class="mkt2-statcell">SPA <b>2</b></div><div class="mkt2-statcell">SPD <b>1</b></div><div class="mkt2-statcell">VEL <b>1</b></div></div></div><div class="mkt2-trow sel" style="position:absolute;left:350px;top:10px">Selected listing</div><div class="mkt2-trow" style="position:absolute;left:350px;top:80px">Other listing</div>');
    await win.webContents.executeJavaScript(`window.__poke={api:{'/game/creatures.json':{creatures:[{pokeId:102,name:'Exeggcute',baseHp:60,baseAtk:40,baseDef:80,baseSpAtk:60,baseSpDef:45,baseSpeed:40,type1:'GRASS',type2:'PSYCHIC',attacks:[]}]}}};window.packets=[];console.log=text=>{if(text.startsWith('__PGIV'))packets.push(text)};void 0;`);
    for (const file of ["src/domain/iv-math.js", "src/game/iv-reader.js"]) await win.webContents.executeJavaScript(fs.readFileSync(path.join(root, file), "utf8"));
    const output = await win.webContents.executeJavaScript(`(async()=>{
      const wait=()=>new Promise(r=>setTimeout(r,150)),hover=(x,y)=>document.dispatchEvent(new MouseEvent('mousemove',{clientX:x,clientY:y,bubbles:true}));
      hover(30,30);await wait();const result=JSON.parse(packets.find(x=>x.startsWith('__PGIV__')).slice(8));
      packets.length=0;hover(360,15);await wait();const selected=packets.some(x=>x.startsWith('__PGIVH__')&&JSON.parse(x.slice(9)).ativo);
      packets.length=0;hover(360,85);await wait();const other=packets.some(x=>x.startsWith('__PGIVH__')&&!JSON.parse(x.slice(9)).ativo);
      return {result,selected,other};
    })()`);
    assert.equal(output.result.nome, "Exeggcute"); assert.equal(output.result.ivTotal, 175); assert.equal(output.result.qualidade, 1.32); assert.equal(output.result.atuais.hp, 2); assert(output.selected); assert(output.other, "an unrelated listing must not inherit the selected Pokémon's IVs");
    await win.loadURL('data:text/html;charset=utf-8,<html lang="pt-BR"><body><div id="ivCard" style="left:10px;top:10px"></div></body></html>');
    for (const file of ["src/renderer/runtime.css", "src/renderer/rich-panels.css"]) await win.webContents.insertCSS(fs.readFileSync(path.join(root, file), "utf8"));
    for (const file of ["src/domain/iv-math.js", "src/domain/pokemon-aptitude.js", "src/renderer/rich-panels.js"]) await win.webContents.executeJavaScript(fs.readFileSync(path.join(root, file), "utf8"));
    for (const [width,height] of [[900,600],[600,480],[1200,800]]) {
      win.setContentSize(width,height); await new Promise(r=>setTimeout(r,50));
      const metrics = await win.webContents.executeJavaScript(`(()=>{
        const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;},append=(n,...kids)=>{n.append(...kids);return n;},button=(text,fn)=>{const b=node('button',text);b.onclick=fn;return b;};
        const d=${JSON.stringify(output.result)};d.golpes=Array.from({length:64},(_,i)=>({nome:'Move '+i,tipo:'PSYCHIC',categoria:'SPECIAL',nivel:i*10,poder:80}));
        const card=document.querySelector('#ivCard');card.replaceChildren(QuadrymonRichPanels.iv({data:d,node,append,button,L:pt=>pt,format:String,account:'Fixture',close:()=>{}}));
        const before=card.querySelector('.iv-move-grid').textContent;card.querySelector('.iv-moves-head button:last-child').click();const next=card.querySelector('.iv-move-grid').textContent;
        card.querySelector('.iv-controls button').click();const rect=card.getBoundingClientRect();return {height:rect.height,width:rect.width,scroll:card.scrollHeight,client:card.clientHeight,scrollWidth:card.scrollWidth,clientWidth:card.clientWidth,bottom:rect.bottom,next:next!==before,stats:card.querySelectorAll('.iv-st').length};
      })()`);
      assert.equal(metrics.stats,6);assert(metrics.next);assert(metrics.scroll<=metrics.client+1,JSON.stringify({width,height,...metrics}));assert(metrics.scrollWidth<=metrics.clientWidth+1);assert(metrics.bottom<=height,JSON.stringify(metrics));
    }
    console.log("Native market IV: current details/stats selectors, listing isolation, compact no-scroll panel and all 64 paged moves passed.");app.exit(0);
  } catch(error) { console.error(error.stack);app.exit(1); }
});
setTimeout(()=>app.exit(1),30000);
