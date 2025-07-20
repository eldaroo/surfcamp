"use strict";(()=>{var e={};e.id=332,e.ids=[332],e.modules={517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},9491:e=>{e.exports=require("assert")},6113:e=>{e.exports=require("crypto")},2361:e=>{e.exports=require("events")},7147:e=>{e.exports=require("fs")},3685:e=>{e.exports=require("http")},5687:e=>{e.exports=require("https")},2037:e=>{e.exports=require("os")},1017:e=>{e.exports=require("path")},2781:e=>{e.exports=require("stream")},6224:e=>{e.exports=require("tty")},7310:e=>{e.exports=require("url")},3837:e=>{e.exports=require("util")},9796:e=>{e.exports=require("zlib")},6779:(e,a,r)=>{r.r(a),r.d(a,{headerHooks:()=>h,originalPathname:()=>E,requestAsyncStorage:()=>l,routeModule:()=>m,serverHooks:()=>f,staticGenerationAsyncStorage:()=>x,staticGenerationBailout:()=>g});var t={};r.r(t),r.d(t,{GET:()=>GET,POST:()=>POST});var s=r(884),o=r(6132),n=r(5798),i=r(7117);let p=process.env.GREEN_API_URL||"https://api.green-api.com",u=process.env.GREEN_API_INSTANCE,c=process.env.GREEN_API_TOKEN,formatPhoneNumber=e=>{let a=e.replace(/[\s\-\(\)]/g,"");return a.startsWith("+")||(a.startsWith("0")&&(a=a.substring(1)),a="+54"+a),a.replace("+","")+"@c.us"},d={booking_confirmation:e=>`🏄‍♂️ *CONFIRMACI\xd3N DE RESERVA*
*Surfcamp Santa Teresa*

✅ \xa1Tu reserva ha sido confirmada!

📅 *Fechas:* ${e.checkIn} - ${e.checkOut}
🏠 *Alojamiento:* ${e.roomType}
👥 *Hu\xe9spedes:* ${e.guests}
📞 *Referencia:* ${e.bookingReference}

💰 *Total:* $${e.total}

📍 *Ubicaci\xf3n:* Santa Teresa, Costa Rica
🏄‍♂️ \xa1Te esperamos para una experiencia incre\xedble!

_Cualquier consulta responde a este mensaje_
*Surfcamp Santa Teresa*
Powered by zeneidas`,booking_reminder:e=>`🏄‍♂️ *RECORDATORIO DE RESERVA*
*Surfcamp Santa Teresa*

\xa1Hola ${e.guestName}!

⏰ Tu check-in es ma\xf1ana: ${e.checkIn}
🏠 ${e.roomType}
📞 Referencia: ${e.bookingReference}

📋 *Qu\xe9 traer:*
• Documentos de identidad
• Traje de ba\xf1o
• Protector solar
• Ganas de surfear! 🏄‍♂️

📍 *Direcci\xf3n:* Santa Teresa, Costa Rica
🕒 *Check-in:* 14:00 hrs

\xa1Nos vemos pronto!
*Surfcamp Santa Teresa*`,welcome_message:e=>`🏄‍♂️ *\xa1BIENVENIDO A SURFCAMP SANTA TERESA!*

\xa1Hola ${e.guestName}!

✅ Check-in completado
🏠 ${e.roomType}
📞 Referencia: ${e.bookingReference}

🌊 *Informaci\xf3n importante:*
• WiFi: SurfcampST / Password: 123456
• Clases de surf: 8:00 AM y 2:00 PM
• Desayuno: 7:00 - 10:00 AM
• Check-out: 11:00 AM

📱 *Contacto de emergencia:* +506 XXXX-XXXX
🏄‍♂️ \xa1Disfruta tu estad\xeda!

*Surfcamp Santa Teresa*
Powered by zeneidas`};async function POST(e){try{if(!u||!c)return n.Z.json({error:"Green API no est\xe1 configurada. Verifica GREEN_API_INSTANCE y GREEN_API_TOKEN"},{status:500});let{phone:a,template:r,data:t}=await e.json();if(!a||!r||!t)return n.Z.json({error:"Faltan par\xe1metros: phone, template, data"},{status:400});if(!d[r])return n.Z.json({error:`Plantilla '${r}' no encontrada`},{status:400});let s=formatPhoneNumber(a),o=d[r](t),m=await i.Z.post(`${p}/waInstance${u}/sendMessage/${c}`,{chatId:s,message:o},{headers:{"Content-Type":"application/json"},timeout:1e4});return console.log("\uD83D\uDCF1 WhatsApp enviado exitosamente:",{phone:s,template:r,messageId:m.data.idMessage,response:m.data}),n.Z.json({success:!0,messageId:m.data.idMessage,phone:s,template:r,message:"Mensaje enviado exitosamente"})}catch(e){return console.error("❌ Error enviando WhatsApp:",e),n.Z.json({error:"Error enviando mensaje de WhatsApp",details:e.response?.data||e.message},{status:500})}}async function GET(e){try{if(!u||!c)return n.Z.json({error:"Green API no est\xe1 configurada"},{status:500});let e=await i.Z.get(`${p}/waInstance${u}/getStateInstance/${c}`);return n.Z.json({instance:u,state:e.data.stateInstance,configured:!0})}catch(e){return n.Z.json({error:"Error obteniendo estado de instancia",details:e.response?.data||e.message},{status:500})}}let m=new s.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/whatsapp/route",pathname:"/api/whatsapp",filename:"route",bundlePath:"app/api/whatsapp/route"},resolvedPagePath:"C:\\Users\\loko_\\OneDrive\\Desktop\\Escritorio\\surfcamp\\app\\api\\whatsapp\\route.ts",nextConfigOutput:"",userland:t}),{requestAsyncStorage:l,staticGenerationAsyncStorage:x,serverHooks:f,headerHooks:h,staticGenerationBailout:g}=m,E="/api/whatsapp/route"}};var a=require("../../../webpack-runtime.js");a.C(e);var __webpack_exec__=e=>a(a.s=e),r=a.X(0,[997,806,117],()=>__webpack_exec__(6779));module.exports=r})();