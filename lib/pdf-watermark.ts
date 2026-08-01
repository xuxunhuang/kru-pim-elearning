import {degrees,PDFDocument,rgb,StandardFonts}from"pdf-lib";
function seedFor(value:string){let seed=2166136261;for(let i=0;i<value.length;i++){seed^=value.charCodeAt(i);seed=Math.imul(seed,16777619)}return seed>>>0}
function random(seed:number){let value=seed>>>0;return()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296}}
/** Shared standard for every lesson and quiz PDF: six personal marks per page. */
export async function addPersonalPdfWatermark(source:ArrayBuffer,identity:string,documentKey:string){
 const pdf=await PDFDocument.load(source,{ignoreEncryption:false,updateMetadata:false}),font=await pdf.embedFont(StandardFonts.Helvetica),date=new Date().toISOString().slice(0,10),label=`KRU PIM  |  ${identity}  |  ${date}`,pages=pdf.getPages();
 pages.forEach((page,pageIndex)=>{const{width,height}=page.getSize(),size=Math.max(8.5,Math.min(10.5,width/58)),textWidth=font.widthOfTextAtSize(label,size),rand=random(seedFor(`${documentKey}:${pageIndex}`)),rows=[.22,.49,.76],left=24,right=Math.max(24,width-textWidth-24);
  rows.forEach((row,rowIndex)=>{const jitter=(rand()-.5)*height*.035;page.drawText(label,{x:left+rand()*width*.035,y:height*row+jitter,size,font,color:rgb(.36,.32,.40),opacity:.09,rotate:degrees(18)});page.drawText(label,{x:Math.max(left,right-rand()*width*.035),y:height*row-jitter+(rowIndex%2?8:-8),size,font,color:rgb(.36,.32,.40),opacity:.09,rotate:degrees(18)})});
  const footer=`Kru Pim - ${identity} - Page ${pageIndex+1}/${pages.length}`,footerSize=Math.max(6.8,Math.min(8,width/76)),footerWidth=font.widthOfTextAtSize(footer,footerSize);page.drawText(footer,{x:Math.max(20,width-footerWidth-22),y:11,size:footerSize,font,color:rgb(.38,.34,.42),opacity:.14})
 });pdf.setProducer("Kru Pim E-learning personalized document");pdf.setCreator("Kru Pim E-learning");return pdf.save({useObjectStreams:false})
}
