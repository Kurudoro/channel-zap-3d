import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const PORT = Number(process.env.PORT || 3000);
const API_KEY = process.env.OPENAI_API_KEY || "";
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "https://channel-zap-3d.onrender.com";
const mime = {
  ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8", ".json":"application/json; charset=utf-8",
  ".png":"image/png", ".jpg":"image/jpeg", ".svg":"image/svg+xml",
  ".ico":"image/x-icon", ".webp":"image/webp"
};
const hits = new Map();
function send(res,status,data){res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"});res.end(JSON.stringify(data));}
function limited(ip){const now=Date.now(),old=hits.get(ip)||{start:now,count:0};if(now-old.start>60000){old.start=now;old.count=0;}old.count++;hits.set(ip,old);return old.count>12;}
const server=http.createServer(async(req,res)=>{
  const origin=req.headers.origin;
  if(origin===ALLOWED_ORIGIN){
    res.setHeader("Access-Control-Allow-Origin",ALLOWED_ORIGIN);
    res.setHeader("Access-Control-Allow-Methods","GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers","Content-Type");
    res.setHeader("Vary","Origin");
  }
  if(req.method==="OPTIONS"){res.writeHead(origin===ALLOWED_ORIGIN?204:403);return res.end();}
  const url=new URL(req.url,"http://localhost");
  if(req.method==="GET"&&url.pathname==="/api/health")return send(res,200,{ok:true,apiConfigured:Boolean(API_KEY),model:MODEL});
  if(req.method==="POST"&&url.pathname==="/api/dialogue"){
    const ip=req.headers["x-forwarded-for"]?.split(",")[0]?.trim()||req.socket.remoteAddress||"unknown";
    if(limited(ip))return send(res,429,{error:"잠시 쉬었다가 다시 시도해 주세요."});
    if(!API_KEY)return send(res,503,{error:"서버에 OPENAI_API_KEY가 설정되지 않았습니다."});
    let raw="";
    try{
      for await(const chunk of req){raw+=chunk;if(raw.length>12000)return send(res,413,{error:"요청이 너무 큽니다."});}
      const body=JSON.parse(raw||"{}");
      const safe=(v,n=180)=>String(v??"").slice(0,n);
      const actor=body.actor||{},partner=body.partner||{};
      const memory=Array.isArray(body.recentMemory)?body.recentMemory.slice(-5):[];
      const context=[
        "프로그램: "+safe(body.channel,80)+" ("+safe(body.program,80)+")",
        "현재 출연자: "+safe(actor.name,30)+", 역할/성격: "+safe(actor.role,100)+", 목표: "+safe(actor.goal,100),
        "현재 감정: "+safe(actor.mood,40)+", 에너지: "+safe(actor.energy,20),
        "대화 상대: "+safe(partner.name,30)+", 역할: "+safe(partner.role,100)+", 감정: "+safe(partner.mood,40),
        "이번 행동 의도: "+safe(body.action,40),
        "최근 기억: "+JSON.stringify(memory),
        "최근 방송 상황: "+JSON.stringify(Array.isArray(body.recentBroadcast)?body.recentBroadcast.slice(0,4):[])
      ].join("\n");
      const prompt="너는 3D 방송 시뮬레이션의 한 출연자다. 아래 상황을 바탕으로 지금 이 출연자가 실제로 말할 한국어 대사 한두 문장을 새로 만들어라. 방송 장르와 역할, 감정, 상대와의 관계, 최근 기억을 반영하고 앞선 대사와 똑같은 표현을 반복하지 마라. 대본 설명이나 이름표 없이 대사만 출력하라. 홈쇼핑이면 상품 진행에 맞게, 드라마면 장면의 감정에 맞게, 토크쇼면 자연스러운 대화로 말하라. 무작위로 뜬금없는 주제를 꺼내지 말고 현재 상황에 반응하라.\n\n"+context;
      const upstream=await fetch("https://api.openai.com/v1/responses",{
        method:"POST",
        headers:{"Authorization":"Bearer "+API_KEY,"Content-Type":"application/json"},
        body:JSON.stringify({model:MODEL,input:prompt,max_output_tokens:100,store:false})
      });
      const result=await upstream.json();
      if(!upstream.ok)return send(res,502,{error:"AI 응답을 받지 못했습니다.",detail:result.error?.message||"Upstream error"});
      const dialogue=(result.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==="output_text").map(x=>x.text).join("\n").trim();
      if(!dialogue)return send(res,502,{error:"AI가 대사를 반환하지 않았습니다."});
      return send(res,200,{dialogue:dialogue.slice(0,500)});
    }catch(e){return send(res,400,{error:"요청을 처리하지 못했습니다.",detail:String(e.message||e)});}
  }
  if(req.method!=="GET"&&req.method!=="HEAD"){res.writeHead(405);return res.end("Method Not Allowed");}
  let pathname=decodeURIComponent(url.pathname==="/" ? "/index.html" : url.pathname);
  const target=path.resolve(ROOT,"."+pathname);
  if(target!==ROOT&&!target.startsWith(ROOT+path.sep)){res.writeHead(403);return res.end("Forbidden");}
  try{
    const stat=await fs.stat(target);
    if(!stat.isFile())throw new Error("Not a file");
    res.writeHead(200,{"Content-Type":mime[path.extname(target)]||"application/octet-stream","X-Content-Type-Options":"nosniff"});
    if(req.method==="HEAD")return res.end();
    fs.createReadStream(target).pipe(res);
  }catch{res.writeHead(404,{"Content-Type":"text/plain; charset=utf-8"});res.end("Not Found");}
});
server.listen(PORT,"0.0.0.0",()=>console.log("CHANNEL ZAP server listening on "+PORT));
