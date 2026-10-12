"use strict";
// Render the existing vector logo and encode the existing icon for Windows.
const {app,BrowserWindow,nativeImage}=require("electron"),fs=require("node:fs"),path=require("node:path"),os=require("node:os");
const root=path.resolve(__dirname,"..");
app.setPath("userData",fs.mkdtempSync(path.join(os.tmpdir(),"quadrymon-brand-")));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true}});
 try {
  const source=fs.readFileSync(path.join(root,"quadrymon-logo.svg"),"utf8");
  await win.loadURL("data:text/html;charset=utf-8,"+encodeURIComponent(source));
  const output=await win.webContents.executeJavaScript(`(async()=>{
   await document.fonts.ready; const svg=document.querySelector('svg'), b=svg.getBBox(), padding=8;
   const width=Math.ceil(b.width+padding*2),height=Math.ceil(b.height+padding*2);
   svg.setAttribute('viewBox',[b.x-padding,b.y-padding,width,height].join(' '));svg.setAttribute('width',width);svg.setAttribute('height',height);
   const source=new XMLSerializer().serializeToString(svg),image=new Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(source);await image.decode();
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;canvas.getContext('2d').drawImage(image,0,0);
   return {source,png:canvas.toDataURL('image/png').split(',')[1],width,height};
  })()`);
  fs.writeFileSync(path.join(root,"quadrymon-logo.svg"),output.source+"\n");
  fs.writeFileSync(path.join(root,"quadrymon-logo.png"),Buffer.from(output.png,"base64"));
  const original=nativeImage.createFromPath(path.join(root,"quadrymon-icon.png"));
  if(original.isEmpty())throw Error("Quadrymon icon is empty");
  const sizes=[16,24,32,48,64,128,256],images=sizes.map(size=>original.resize({width:size,height:size,quality:"best"}).toPNG());
  const header=Buffer.alloc(6+16*sizes.length);header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);let offset=header.length;
  sizes.forEach((size,i)=>{const at=6+i*16;header[at]=header[at+1]=size===256?0:size;header.writeUInt16LE(1,at+4);header.writeUInt16LE(32,at+6);header.writeUInt32LE(images[i].length,at+8);header.writeUInt32LE(offset,at+12);offset+=images[i].length;});
  fs.writeFileSync(path.join(root,"quadrymon-icon.ico"),Buffer.concat([header,...images]));
  console.log(`Logo centered: ${output.width}x${output.height}; Windows icon: ${sizes.join(', ')}px.`);app.exit(0);
 }catch(error){console.error(error);app.exit(1)}
});
