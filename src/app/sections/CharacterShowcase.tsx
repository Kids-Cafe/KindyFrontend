import { useState, useEffect } from "react";
import { X } from "lucide-react";
import crystalBg from "@/imports/image_5b6ed8e7.png";
import mushroomBg from "@/imports/image_22d709cf.png";
import { MiniStar, KioSVG, KinaSVG } from "@/app/components/decorative";
import { CHAR_DATA, FOREST_PARTICLES } from "@/app/data/characterData";

/**
 * 내비게이션에서 열리는 전체 화면 "캐릭터 소개" 모달입니다. 각 캐릭터는 고유한
 * 테마 배경 세계(키오: 수정 동굴 빛 효과, 키나: 버섯 마을 반딧불/줄 조명)를
 * 가집니다. 하나의 고정 일러스트 대신 절대 위치의 빛 덩어리와 입자 필드로
 * 구성해 새 에셋 없이도 선택 상태에 맞춰 장면이 반응할 수 있습니다.
 */
export function CharacterShowcase({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<"kio" | "kina">("kio");
  const [animKey, setAnimKey] = useState(0);
  const [cloudPhase, setCloudPhase] = useState<"idle" | "in" | "out">("idle");

  const char = CHAR_DATA[selected];

  // Escape 키로 닫습니다.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const switchTo = (c: "kio" | "kina") => {
    if (c === selected || cloudPhase !== "idle") return;
    // 1. 구름이 오른쪽에서 들어옵니다.
    setCloudPhase("in");
    setTimeout(() => {
      // 2. 구름이 덮은 동안 캐릭터를 교체합니다.
      setSelected(c);
      setAnimKey(k => k + 1);
      // 3. 구름이 왼쪽으로 빠져나갑니다.
      setCloudPhase("out");
      setTimeout(() => setCloudPhase("idle"), 850);
    }, 650);
  };

  return (
    <div className="fixed inset-0 z-[8000] flex flex-col overflow-hidden">

      {/* ══ 세계 배경 ══ */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">

        {/* 전체 화면 세계 이미지 */}
        <img
          src={selected === "kio" ? crystalBg : mushroomBg}
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{ objectFit:"cover", objectPosition:"center center" }}
        />

        {/* 아주 약한 상하단 페이드만 적용해 이미지는 밝게 유지하고 헤더/푸터 공간에 여유를 줍니다. */}
        <div className="absolute top-0 left-0 right-0" style={{height:"12%", background:"linear-gradient(180deg, rgba(0,0,0,0.22) 0%, transparent 100%)"}} />
        <div className="absolute bottom-0 left-0 right-0" style={{height:"10%", background:"linear-gradient(0deg, rgba(0,0,0,0.18) 0%, transparent 100%)"}} />

        {/* ── 키오: 수정 동굴 빛 효과 ── */}
        {selected === "kio" && <>
          {/* 중앙 후면 빛: 동굴 깊은 곳의 큰 흰색 광원 */}
          <div className="absolute" style={{
            top:"18%", left:"50%", transform:"translateX(-50%)",
            width:480, height:380,
            background:"radial-gradient(ellipse, rgba(255,255,240,0.55) 0%, rgba(200,180,255,0.30) 30%, rgba(150,120,255,0.12) 58%, transparent 75%)",
            filter:"blur(28px)",
            animation:"crystalPulse 3.2s ease-in-out infinite",
          }} />
          {/* 왼쪽 수정 군집: 보라/라벤더 */}
          <div className="absolute" style={{
            top:"30%", left:"14%",
            width:220, height:280,
            background:"radial-gradient(ellipse at 50% 70%, rgba(180,130,255,0.6) 0%, rgba(140,90,240,0.30) 45%, transparent 72%)",
            filter:"blur(18px)",
            animation:"crystalPulse 2.8s ease-in-out infinite",
            animationDelay:"0.4s",
          }} />
          {/* 오른쪽 수정 군집: 틸/시안 */}
          <div className="absolute" style={{
            top:"28%", right:"12%",
            width:210, height:260,
            background:"radial-gradient(ellipse at 50% 70%, rgba(100,230,220,0.58) 0%, rgba(60,200,200,0.28) 45%, transparent 72%)",
            filter:"blur(18px)",
            animation:"crystalPulse 3.0s ease-in-out infinite",
            animationDelay:"0.8s",
          }} />
          {/* 앞쪽 왼쪽 수정: 핑크/로즈 */}
          <div className="absolute" style={{
            top:"52%", left:"4%",
            width:160, height:220,
            background:"radial-gradient(ellipse at 50% 60%, rgba(240,130,210,0.55) 0%, rgba(200,80,180,0.25) 50%, transparent 74%)",
            filter:"blur(14px)",
            animation:"crystalPulse 2.5s ease-in-out infinite",
            animationDelay:"1.2s",
          }} />
          {/* 앞쪽 오른쪽 수정: 골드/앰버 */}
          <div className="absolute" style={{
            top:"50%", right:"5%",
            width:150, height:200,
            background:"radial-gradient(ellipse at 50% 60%, rgba(255,220,100,0.52) 0%, rgba(255,180,60,0.22) 50%, transparent 74%)",
            filter:"blur(14px)",
            animation:"crystalPulse 2.9s ease-in-out infinite",
            animationDelay:"0.6s",
          }} />
          {/* 중앙 왼쪽 중간 수정: 파란색 */}
          <div className="absolute" style={{
            top:"40%", left:"30%",
            width:120, height:180,
            background:"radial-gradient(ellipse at 50% 65%, rgba(120,180,255,0.48) 0%, rgba(80,140,240,0.20) 52%, transparent 74%)",
            filter:"blur(12px)",
            animation:"crystalPulse 3.4s ease-in-out infinite",
            animationDelay:"1.6s",
          }} />
          {/* 중앙 오른쪽 중간 수정: 초록색 */}
          <div className="absolute" style={{
            top:"42%", right:"28%",
            width:110, height:160,
            background:"radial-gradient(ellipse at 50% 65%, rgba(120,240,180,0.45) 0%, rgba(80,210,140,0.18) 52%, transparent 74%)",
            filter:"blur(12px)",
            animation:"crystalPulse 2.7s ease-in-out infinite",
            animationDelay:"2.0s",
          }} />

          {/* 떠 있는 보석 입자: 수정 색상에 맞춤 */}
          {[
            {x:"50%",y:"22%",c:"rgba(255,255,200,0.95)",s:6,d:2.2,dl:0},{x:"28%",y:"38%",c:"rgba(200,160,255,0.90)",s:5,d:2.8,dl:0.4},
            {x:"70%",y:"36%",c:"rgba(100,230,220,0.90)",s:5,d:2.5,dl:0.8},{x:"18%",y:"55%",c:"rgba(240,140,210,0.88)",s:4,d:3.0,dl:0.2},
            {x:"80%",y:"52%",c:"rgba(255,210,80,0.88)",s:4,d:2.6,dl:1.0},{x:"42%",y:"44%",c:"rgba(140,190,255,0.85)",s:3,d:2.9,dl:1.4},
            {x:"60%",y:"46%",c:"rgba(140,240,180,0.85)",s:3,d:2.4,dl:0.6},{x:"35%",y:"28%",c:"rgba(255,200,140,0.80)",s:4,d:3.2,dl:1.8},
            {x:"62%",y:"26%",c:"rgba(180,140,255,0.80)",s:4,d:2.7,dl:1.2},{x:"48%",y:"60%",c:"rgba(100,220,255,0.78)",s:3,d:3.1,dl:0.3},
            {x:"22%",y:"44%",c:"rgba(255,150,200,0.78)",s:3,d:2.3,dl:1.6},{x:"76%",y:"44%",c:"rgba(255,240,100,0.75)",s:3,d:2.8,dl:2.0},
          ].map((g, i) => (
            <div key={i} style={{
              position:"absolute", left:g.x, top:g.y,
              width:g.s*2, height:g.s*2,
              background:`radial-gradient(circle, white 0%, ${g.c} 40%, transparent 70%)`,
              borderRadius:"50%",
              boxShadow:`0 0 ${g.s*5}px ${g.c}, 0 0 ${g.s*10}px ${g.c.replace("0.","0.0")}`,
              animation:`twinkle ${g.d}s ease-in-out infinite`,
              animationDelay:`${g.dl}s`,
              transform:"translate(-50%,-50%)",
            }} />
          ))}

          {/* 중앙 빛에서 뻗는 광선 기둥 */}
          {[15,45,75,105,135,165,195,225,255,285,315,345].map((deg, i) => (
            <div key={i} style={{
              position:"absolute", top:"26%", left:"50%",
              width:2, height:180,
              background:`linear-gradient(180deg, rgba(255,255,220,${0.18-i%3*0.04}) 0%, transparent 100%)`,
              transformOrigin:"top center",
              transform:`rotate(${deg}deg)`,
              animation:`rayPulse ${2.4+i*0.15}s ease-in-out infinite`,
              animationDelay:`${i*0.18}s`,
            }} />
          ))}
        </>}

        {/* ── 키나: 버섯 마을 빛 효과 ── */}
        {selected === "kina" && <>
          {/* 따뜻한 금빛 하늘 광채: 상단 주변 광원 */}
          <div className="absolute" style={{
            top:"-5%", left:"50%", transform:"translateX(-50%)",
            width:600, height:400,
            background:"radial-gradient(ellipse, rgba(255,220,120,0.32) 0%, rgba(255,180,80,0.14) 45%, transparent 70%)",
            filter:"blur(30px)",
            animation:"warmPulse 4.0s ease-in-out infinite",
          }} />

          {/* 줄 조명 반짝임: 이미지의 가랜드 영역을 따라 배치 */}
          {[
            {x:"28%",y:"22%"},{x:"34%",y:"19%"},{x:"40%",y:"18%"},{x:"46%",y:"17%"},
            {x:"52%",y:"17%"},{x:"58%",y:"18%"},{x:"64%",y:"19%"},{x:"70%",y:"22%"},
            {x:"31%",y:"25%"},{x:"43%",y:"22%"},{x:"55%",y:"21%"},{x:"67%",y:"24%"},
          ].map((sl, i) => (
            <div key={i} style={{
              position:"absolute", left:sl.x, top:sl.y,
              width:8, height:8,
              background:"radial-gradient(circle, rgba(255,255,180,1) 0%, rgba(255,220,80,0.7) 50%, transparent 80%)",
              borderRadius:"50%",
              boxShadow:"0 0 12px rgba(255,220,80,0.9), 0 0 24px rgba(255,200,60,0.5)",
              animation:`twinkle ${1.4+i*0.18}s ease-in-out infinite`,
              animationDelay:`${i*0.22}s`,
              transform:"translate(-50%,-50%)",
            }} />
          ))}

          {/* 반딧불 구체: 전체에 떠 있는 따뜻한 앰버/골드 빛 */}
          {[
            {x:"12%",y:"45%",s:10,d:2.6,dl:0.0},{x:"22%",y:"35%",s:8,d:2.2,dl:0.5},
            {x:"38%",y:"40%",s:9,d:3.0,dl:1.0},{x:"48%",y:"30%",s:7,d:2.8,dl:0.3},
            {x:"60%",y:"42%",s:9,d:2.4,dl:0.7},{x:"72%",y:"36%",s:8,d:2.9,dl:1.2},
            {x:"85%",y:"44%",s:10,d:2.5,dl:0.4},{x:"18%",y:"58%",s:7,d:3.2,dl:1.5},
            {x:"32%",y:"55%",s:6,d:2.7,dl:0.8},{x:"55%",y:"52%",s:7,d:2.3,dl:1.8},
            {x:"68%",y:"56%",s:6,d:3.0,dl:0.2},{x:"80%",y:"50%",s:8,d:2.6,dl:1.0},
            {x:"44%",y:"62%",s:6,d:2.8,dl:2.0},{x:"8%", y:"30%",s:7,d:3.3,dl:0.6},
            {x:"92%",y:"38%",s:7,d:2.4,dl:1.4},{x:"50%",y:"20%",s:5,d:2.9,dl:0.9},
          ].map((ff, i) => (
            <div key={i} style={{
              position:"absolute", left:ff.x, top:ff.y,
              width:ff.s, height:ff.s,
              background:"radial-gradient(circle, rgba(255,255,200,1) 0%, rgba(255,210,80,0.85) 40%, rgba(255,170,40,0.4) 70%, transparent 90%)",
              borderRadius:"50%",
              boxShadow:`0 0 ${ff.s*2.5}px rgba(255,200,80,0.9), 0 0 ${ff.s*5}px rgba(255,180,60,0.5)`,
              animation:`fireflyFloat ${ff.d}s ease-in-out infinite`,
              animationDelay:`${ff.dl}s`,
              transform:"translate(-50%,-50%)",
            }} />
          ))}

          {/* 지면 높이의 부드러운 꽃빛 */}
          {[
            {x:"10%",c:"rgba(255,160,200,0.5)"},{x:"24%",c:"rgba(255,220,100,0.5)"},
            {x:"40%",c:"rgba(200,240,180,0.45)"},{x:"58%",c:"rgba(255,160,200,0.45)"},
            {x:"74%",c:"rgba(255,220,100,0.5)"},{x:"88%",c:"rgba(160,220,255,0.45)"},
          ].map((fw, i) => (
            <div key={i} style={{
              position:"absolute", bottom:"8%", left:fw.x,
              width:60, height:60,
              background:`radial-gradient(circle, ${fw.c} 0%, transparent 70%)`,
              filter:"blur(8px)",
              animation:`warmPulse ${2.8+i*0.3}s ease-in-out infinite`,
              animationDelay:`${i*0.4}s`,
              transform:"translate(-50%,0)",
            }} />
          ))}

          {/* 마법 먼지 반짝임 */}
          {FOREST_PARTICLES.slice(0, 18).map((p, i) => (
            <div key={i} style={{
              position:"absolute", left:`${p.x}%`, top:`${p.y}%`,
              width:p.s, height:p.s, background:"rgba(255,240,180,0.9)", borderRadius:"50%",
              opacity: p.o * 0.75,
              boxShadow:`0 0 ${p.s*4}px rgba(255,220,100,0.8), 0 0 ${p.s*8}px rgba(255,200,60,0.35)`,
              animation:`twinkle ${p.d}s ease-in-out infinite`, animationDelay:`${p.dl}s`,
            }} />
          ))}
        </>}
      </div>

      {/* ══ 헤더 ══ */}
      <div className="relative z-10 flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
            style={{background:"linear-gradient(135deg,#E879A0,#C084FC)"}}>
            <MiniStar size={18} color="white" />
          </div>
          <div>
            <div className="text-white text-sm font-bold" style={{fontFamily:"'Fredoka',sans-serif",letterSpacing:"0.12em",textShadow:"0 1px 8px rgba(0,0,0,0.6)"}}>
              KINDY
            </div>
            <div className="text-xs" style={{color:"rgba(255,255,255,0.85)",textShadow:"0 1px 6px rgba(0,0,0,0.5)"}}>AI 파트너 소개</div>
          </div>
        </div>
        <button onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.18)",color:"white"}}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ══ 메인 콘텐츠 ══ */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center gap-6 px-4 md:px-10 pb-2 overflow-y-auto">

        {/* 캐릭터 표시 */}
        <div key={`char-${animKey}`} className="flex flex-col items-center flex-shrink-0"
          style={{animation:"csCharEnter 0.42s cubic-bezier(0.34,1.56,0.64,1) both"}}>
          {/* 빛나는 받침대 */}
          <div style={{
            width:220, height:20, marginBottom:-14,
            background:`radial-gradient(ellipse, ${char.glow} 0%, transparent 70%)`,
            filter:"blur(10px)",
          }} />
          {/* 캐릭터 이미지: drop-shadow로 밝은 배경과 분리합니다. */}
          <div style={{
            filter:`drop-shadow(0 0 32px ${char.glow}) drop-shadow(0 0 64px ${char.glow.replace("0.5","0.25")}) drop-shadow(0 8px 24px rgba(0,0,0,0.45))`,
            animation:"float 3.6s ease-in-out infinite",
          }}>
            {selected === "kio"
              ? <KioSVG className="h-60 md:h-72 w-auto" />
              : <KinaSVG className="h-60 md:h-72 w-auto" />
            }
          </div>
          {/* 하단 캐릭터 이름표 */}
          <div className="mt-4 flex items-center gap-2 px-5 py-2 rounded-full"
            style={{
              background:`${char.color}28`,
              border:`1px solid ${char.color}60`,
              boxShadow:`0 0 24px ${char.glow}, 0 4px 16px rgba(0,0,0,0.30)`,
              backdropFilter:"blur(8px)",
            }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{background:char.color}} />
            <span className="font-bold text-sm tracking-widest" style={{color:char.color, fontFamily:"'Fredoka',sans-serif", letterSpacing:"0.2em"}}>
              {char.nameTag}
            </span>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{background:char.color}} />
          </div>
        </div>

        {/* 게임 정보 패널 */}
        <div key={`info-${animKey}`} className="w-full max-w-sm"
          style={{animation:"csInfoEnter 0.38s ease-out both", animationDelay:"0.06s"}}>
          <div className="rounded-3xl p-5 md:p-6" style={{
            background: char.panelBg.replace("0.85","0.92"),
            backdropFilter:"blur(32px)",
            WebkitBackdropFilter:"blur(32px)",
            border:`1px solid ${char.borderGlow}`,
            boxShadow:`0 0 0 1px ${char.borderGlow}, 0 0 80px ${char.glow}25, 0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)`,
          }}>

            {/* 이름과 역할 */}
            <div className="mb-5">
              <div className="text-4xl font-bold leading-none mb-2"
                style={{fontFamily:"'Fredoka',sans-serif", color:"white",
                  textShadow:`0 0 40px ${char.glow}, 0 2px 8px rgba(0,0,0,0.5)`}}>
                {char.name}
              </div>
              <div className="text-sm font-semibold" style={{color:`${char.color}dd`}}>
                {char.role}
              </div>
            </div>

            {/* 인사 말풍선 */}
            <div className="rounded-2xl p-4 mb-4" style={{
              background:`${char.color}14`,
              border:`1px solid ${char.color}30`,
            }}>
              <p className="text-sm leading-relaxed" style={{color:"rgba(255,255,255,0.88)"}}>
                "{char.greeting}"
              </p>
            </div>

            {/* 이야기 */}
            <p className="text-sm leading-relaxed mb-5" style={{color:"rgba(255,255,255,0.68)"}}>
              {char.story}
            </p>

            {/* 성격 태그 */}
            <div className="flex flex-wrap gap-2 mb-5">
              {char.tags.map(({Icon, label}) => (
                <span key={label} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{background:`${char.color}18`, color:"rgba(255,255,255,0.85)", border:`1px solid ${char.color}30`}}>
                  <Icon style={{width:11,height:11,color:char.color}} strokeWidth={2} />
                  {label}
                </span>
              ))}
            </div>

            {/* 함께 하는 일 */}
            <div className="space-y-2.5">
              {char.moments.map(({Icon, text}) => (
                <div key={text} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{background:`${char.color}20`}}>
                    <Icon style={{width:13,height:13,color:char.color}} strokeWidth={2} />
                  </div>
                  <p className="text-sm leading-snug" style={{color:"rgba(255,255,255,0.72)"}}>
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ 캐릭터 선택 탭 ══ */}
      <div className="relative z-10 flex justify-center gap-3 py-4">
        {(["kio","kina"] as const).map((c) => {
          const d = CHAR_DATA[c];
          const active = selected === c;
          return (
            <button key={c} onClick={() => switchTo(c)}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-full transition-all duration-300"
              style={{
                background: active ? `${d.color}22` : "rgba(255,255,255,0.07)",
                border:`1.5px solid ${active ? d.color : "rgba(255,255,255,0.14)"}`,
                color: active ? d.color : "rgba(255,255,255,0.45)",
                boxShadow: active ? `0 0 28px ${d.glow}, 0 0 8px ${d.glow}` : "none",
                transform: active ? "scale(1.06)" : "scale(1)",
              }}>
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-end justify-center flex-shrink-0"
                style={{background:`${d.color}18`, border:`1px solid ${d.color}40`}}>
                {c === "kio" ? <KioSVG className="w-7 h-auto" /> : <KinaSVG className="w-7 h-auto" />}
              </div>
              <span className="font-bold text-sm">{d.name}</span>
              {active && (
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{background:d.color, boxShadow:`0 0 8px ${d.color}`}} />
              )}
            </button>
          );
        })}
      </div>

      {/* ══ 구름 와이프 전환 ══ */}
      {cloudPhase !== "idle" && (
        <div className="absolute inset-0 z-[50] pointer-events-none overflow-hidden">
          {[0,1,2,3,4,5,6,7].map(i => {
            const topPct = -14 + i * 17;
            const delay = i * 0.055;
            return (
              <div key={i} style={{
                position:"absolute",
                top:`${topPct}%`,
                left:"-10%",
                width:"120%",
                height:"26%",
                background: "radial-gradient(ellipse 70% 80% at 50% 50%, rgba(255,252,255,0.98) 0%, rgba(248,240,255,0.96) 40%, rgba(235,225,255,0.90) 75%, rgba(220,210,250,0.78) 100%)",
                borderRadius:"50%",
                animation: cloudPhase === "in"
                  ? `cloudIn 0.65s ${delay}s cubic-bezier(0.22,0.8,0.36,1) both`
                  : `cloudOut 0.80s ${delay}s cubic-bezier(0.64,0,0.78,0.2) both`,
              }} />
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes csCharEnter {
          from { opacity:0; transform:translateX(-24px) scale(0.92); }
          to   { opacity:1; transform:translateX(0)    scale(1); }
        }
        @keyframes csInfoEnter {
          from { opacity:0; transform:translateX(20px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes twinkle {
          0%,100% { opacity:0.35; transform:scale(1); }
          50%     { opacity:1;    transform:scale(1.4); }
        }
        @keyframes float {
          0%,100% { transform:translateY(0); }
          50%     { transform:translateY(-12px); }
        }
        @keyframes cloudIn {
          from { transform:translateX(115%); }
          to   { transform:translateX(-5%); }
        }
        @keyframes cloudOut {
          from { transform:translateX(-5%); }
          to   { transform:translateX(-120%); }
        }
        @keyframes crystalPulse {
          0%,100% { opacity:0.75; transform:translateX(-50%) scale(1); }
          50%      { opacity:1;    transform:translateX(-50%) scale(1.08); }
        }
        @keyframes rayPulse {
          0%,100% { opacity:0; }
          50%     { opacity:1; }
        }
        @keyframes warmPulse {
          0%,100% { opacity:0.7; transform:translateX(-50%) scale(1); }
          50%      { opacity:1;   transform:translateX(-50%) scale(1.06); }
        }
        @keyframes fireflyFloat {
          0%   { opacity:0.3; transform:translate(-50%,-50%) translateY(0px); }
          30%  { opacity:1;   transform:translate(-50%,-50%) translateY(-8px); }
          60%  { opacity:0.7; transform:translate(-50%,-50%) translateY(-4px); }
          100% { opacity:0.3; transform:translate(-50%,-50%) translateY(0px); }
        }
      `}</style>
    </div>
  );
}
