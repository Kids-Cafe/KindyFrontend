import { useState } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell,
} from "recharts";
import { UtensilsCrossed, Dumbbell, Users, Brain, BookOpen, ChevronRight, Smile, Palette } from "lucide-react";
import { Sparkle, MiniStar } from "@/app/components/decorative";
import { emotionData, nutritionData, personalityData } from "@/app/data/dashboardData";

/**
 * "분석 대시보드": 다섯 가지 분석 카테고리 목록 옆에 감정/영양/성격 탭이 있는
 * 분석 미리보기 모의 카드를 배치합니다.
 */
export function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState<"감정" | "영양" | "성격">("감정");

  return (
    <section id="analytics" className="py-28 bg-background relative overflow-hidden">
      <Sparkle size={24} color="#A78BFA" style={{ position: "absolute", top: 60, left: 40, opacity: 0.25 }} />
      <Sparkle size={18} color="#F9D56E" style={{ position: "absolute", bottom: 80, right: 50, opacity: 0.3 }} />

      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold mb-5"
              style={{ background: "linear-gradient(135deg, #FCE7F3, #EDE9FE)", color: "#C0397A" }}>
              <MiniStar size={14} color="#F9D56E" /> 분석 대시보드
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: "#3B1355" }}>
              아이의 모든 것을<br />한눈에 확인해요
            </h2>
            <p className="text-lg leading-relaxed mb-8" style={{ color: "#A06080" }}>
              일주일, 한 달, 1년 단위로 아이의 성장 추이를 확인하고
              전문적인 인사이트를 받아보세요.
            </p>
            <div className="space-y-3">
              {[
                { Icon: UtensilsCrossed, color: "#86EFAC", label: "음식 섭취 분석", desc: "매일 먹은 음식의 영양 균형을 체크해요" },
                { Icon: Dumbbell,        color: "#F472B6", label: "건강 상태 추적", desc: "몸이 아팠던 날, 컨디션 변화를 기록해요" },
                { Icon: Users,          color: "#C084FC", label: "교우관계 맵",    desc: "친구들과의 관계와 사회성 발달을 파악해요" },
                { Icon: Brain,          color: "#F9D56E", label: "성격 성향 분석", desc: "아이만의 성격 특성과 MBTI 성향을 알아요" },
                { Icon: BookOpen,       color: "#7ECECA", label: "학습 발달 현황", desc: "배운 내용과 학습 흥미도를 추적해요" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-card rounded-2xl border hover:shadow-md transition-all duration-200 group cursor-default"
                  style={{ borderColor: "rgba(232,121,160,0.15)" }}>
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${item.color}22` }}>
                    <item.Icon style={{ width: 17, height: 17, color: item.color }} strokeWidth={2} />
                  </span>
                  <div>
                    <div className="font-bold text-sm group-hover:text-primary transition-colors" style={{ color: "#3B1355" }}>{item.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#A06080" }}>{item.desc}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto mt-0.5 flex-shrink-0 group-hover:text-primary transition-colors" style={{ color: "#C0C0D0" }} />
                </div>
              ))}
            </div>
          </div>

          {/* 대시보드 카드 */}
          <div className="bg-card rounded-3xl border overflow-hidden" style={{ borderColor: "rgba(232,121,160,0.15)", boxShadow: "0 20px 60px rgba(232,121,160,0.12)" }}>
            {/* 헤더 */}
            <div className="p-5" style={{ background: "linear-gradient(135deg, #E879A0 0%, #C084FC 100%)" }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-white/65 text-xs font-medium">학생 프로필</div>
                  <div className="text-white font-bold text-base" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                    김민준 · 7세 · 해바라기반
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white/65 text-xs">이번 주</div>
                  <div className="text-white font-bold text-sm">07.21 — 07.25</div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                {(["감정", "영양", "성격"] as const).map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className="text-xs px-4 py-1.5 rounded-full font-bold transition-all"
                    style={activeTab === tab
                      ? { background: "white", color: "#E879A0" }
                      : { background: "rgba(255,255,255,0.18)", color: "white" }}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5">
              {activeTab === "감정" && (
                <>
                  <div className="text-sm font-bold mb-4" style={{ color: "#3B1355" }}>이번 주 감정 기록</div>
                  <ResponsiveContainer width="100%" height={190}>
                    <BarChart data={emotionData} barGap={3} barCategoryGap="30%">
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#A06080" }} />
                      <YAxis hide domain={[0, 6]} />
                      <Tooltip contentStyle={{ borderRadius: "14px", border: "1px solid rgba(232,121,160,0.2)", boxShadow: "0 8px 24px rgba(0,0,0,0.08)", fontSize: "12px" }} cursor={{ fill: "rgba(232,121,160,0.06)" }} />
                      <Bar dataKey="기쁨" fill="#F472B6" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="슬픔" fill="#C4B5E8" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="흥분" fill="#F9D56E" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex gap-5 mt-2">
                    {[["#F472B6", "기쁨"], ["#C4B5E8", "슬픔"], ["#F9D56E", "흥분"]].map(([color, label]) => (
                      <span key={label} className="flex items-center gap-1.5 text-xs" style={{ color: "#A06080" }}>
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />{label}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {activeTab === "영양" && (
                <>
                  <div className="text-sm font-bold mb-3" style={{ color: "#3B1355" }}>영양소 섭취 현황</div>
                  <div className="flex items-center gap-2">
                    <ResponsiveContainer width={155} height={155}>
                      <PieChart>
                        <Pie data={nutritionData} dataKey="value" innerRadius={48} outerRadius={72} paddingAngle={3} startAngle={90} endAngle={-270}>
                          {nutritionData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2.5 flex-1">
                      {nutritionData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                            <span style={{ color: "#6B3580" }}>{item.name}</span>
                          </div>
                          <span className="font-bold" style={{ color: "#3B1355" }}>{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTab === "성격" && (
                <>
                  <div className="text-sm font-bold mb-2" style={{ color: "#3B1355" }}>성격 성향 분석</div>
                  <ResponsiveContainer width="100%" height={195}>
                    <RadarChart data={personalityData}>
                      <PolarGrid stroke="rgba(232,121,160,0.18)" />
                      <PolarAngleAxis dataKey="trait" tick={{ fontSize: 11, fill: "#A06080" }} />
                      <PolarRadiusAxis domain={[0, 100]} hide />
                      <Radar dataKey="value" stroke="#E879A0" fill="#E879A0" fillOpacity={0.22} strokeWidth={2} dot={{ fill: "#E879A0", r: 4 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </>
              )}

              {/* 일기 요약 */}
              <div className="mt-4 p-4 rounded-2xl" style={{ background: "linear-gradient(135deg, #FCE7F3, #EDE9FE)" }}>
                <div className="flex items-center gap-1.5 text-xs font-bold mb-2" style={{ color: "#E879A0" }}>
                  <BookOpen style={{ width: 12, height: 12 }} strokeWidth={2.5} /> 오늘의 일기 요약
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "#6B3580" }}>
                  "오늘은 블록 놀이를 하다가 친구 수호와 잠깐 다투었지만, 선생님 도움으로 화해했어요.
                  점심에 김치볶음밥을 맛있게 먹었고, 낮잠 후 그림 그리기에서 집중력이 돋보였어요."
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: "#FCE7F3", color: "#BE185D" }}>
                    <Smile style={{ width: 11, height: 11 }} strokeWidth={2.5} /> 전반적으로 긍정
                  </span>
                  <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium" style={{ background: "#DCFCE7", color: "#166534" }}>
                    <Palette style={{ width: 11, height: 11 }} strokeWidth={2.5} /> 창의성 발현
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
