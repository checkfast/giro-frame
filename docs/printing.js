// Prepare the actual JPEG before the click, preserving iOS user activation.
export function photoFile(jpeg, name) {
  const prefix='data:image/jpeg;base64,';
  if(!jpeg.startsWith(prefix))throw new Error('Formato foto non valido.');
  const bytes=Uint8Array.from(atob(jpeg.slice(prefix.length)),c=>c.charCodeAt(0));
  return new File([bytes],name,{type:'image/jpeg'});
}
export function printMode(file,nav=navigator){
  try{if(file&&typeof nav.share==='function'&&nav.canShare?.({files:[file]}))return 'share';}catch{}
  return /iPad|iPhone|iPod/.test(nav.userAgent)||(/Mac/.test(nav.platform)&&nav.maxTouchPoints>1)?'save':'browser';
}
export function createPrinter(nav,printPage){
  let busy=false;
  return async file=>{
    if(busy)return 'busy';
    busy=true;
    try{
      const mode=printMode(file,nav);
      if(mode==='share'){
        // No await before share: it must run within the original button gesture.
        await nav.share({files:[file]});
        return 'shared'; // The OS does not report whether a print occurred.
      }
      if(mode==='save')return 'save';
      printPage();return 'browser';
    }catch(error){if(error.name==='AbortError')return 'cancelled';throw error;}
    finally{busy=false;}
  };
}
