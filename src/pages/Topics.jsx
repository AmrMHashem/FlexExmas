// pages/Topics.jsx — v4.3 APK-grade responsive (full mobile fix)
import React, { useState, useEffect, useMemo, useRef } from "react";
import { getTopics } from "../services/firestore";
import { Spinner, Empty } from "../components/UI";

const getDifficultyColor = (d) => {
  if (!d) return "var(--text3)";
  if (d === "Easy") return "var(--green)";
  if (d === "Hard") return "var(--red)";
  return "var(--gold)";
};

function TopicCard({ topic, topExams, examCount, avgPass, onViewAll, onExamClick, animIdx }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setVisible(true);
        obs.disconnect();
      }
    }, { threshold: 0.05 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // تحديد الأحجام والتباعد حسب الشاشة
  const isMobile = window.innerWidth <= 768;
  const iconSize = isMobile ? 48 : 58;
  const imageSize = isMobile ? 64 : 80;
  const cardPadding = isMobile ? "16px 18px 0" : "24px 26px 0";
  const titleFont = isMobile ? 16 : 18;

  return (
    <div
      ref={ref}
      style={{
        background: "var(--bg2)",
        border: `1.5px solid ${topic.color}28`,
        borderRadius: 20,
        overflow: "hidden",
        transition: visible
          ? `opacity 0.4s ease ${Math.min(animIdx, 5) * 60}ms, transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s, border-color 0.3s`
          : "none",
        boxShadow: "var(--card-shadow)",
        position: "relative",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = `0 20px 56px ${topic.color}22`;
        e.currentTarget.style.borderColor = `${topic.color}55`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "var(--card-shadow)";
        e.currentTarget.style.borderColor = `${topic.color}28`;
      }}
    >
      <div style={{ height: 4, background: `linear-gradient(90deg, ${topic.color}, ${topic.color}88)` }} />
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${topic.color}10, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      <div style={{ padding: cardPadding, position: "relative" }}>
        {/* الرأس مع الصورة والعنوان */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {topic.image ? (
              <img
                src={topic.image}
                alt={topic.name}
                loading="lazy"
                style={{
                  width: imageSize,
                  height: imageSize * 0.8,
                  borderRadius: 15,
                  background: `${topic.color}15`,
                  border: `1.5px solid ${topic.color}30`,
                  objectFit: "cover",
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <div
                style={{
                  width: iconSize,
                  height: iconSize,
                  borderRadius: 15,
                  background: `${topic.color}15`,
                  border: `1.5px solid ${topic.color}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: iconSize * 0.55,
                  flexShrink: 0,
                }}
              >
                {topic.icon}
              </div>
            )}
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: topic.color,
                  background: `${topic.color}15`,
                  border: `1px solid ${topic.color}30`,
                  padding: "2px 9px",
                  borderRadius: 99,
                  display: "inline-block",
                  marginBottom: 5,
                }}
              >
                {topic.tag || "Topic"}
              </div>
              <h3
                style={{
                  fontSize: titleFont,
                  fontWeight: 900,
                  color: "var(--text)",
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                {topic.name}
              </h3>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={onViewAll}
              style={{
                padding: isMobile ? "6px 12px" : "8px 14px",
                borderRadius: 10,
                border: `1.5px solid ${topic.color}40`,
                background: `${topic.color}12`,
                color: topic.color,
                fontSize: 11,
                fontWeight: 800,
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontFamily: "inherit",
                transition: "all 0.2s",
                flexShrink: 0,
                minHeight: 36,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = `${topic.color}25`)}
              onMouseLeave={(e) => (e.currentTarget.style.background = `${topic.color}12`)}
            >
              Explore →
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                background: `${topic.color}12`,
                border: `1.5px solid ${topic.color}40`,
                borderRadius: 10,
                width: 34,
                height: 34,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                color: topic.color,
                fontSize: 16,
                fontWeight: "bold",
                minWidth: 34,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = `${topic.color}25`)}
              onMouseLeave={(e) => (e.currentTarget.style.background = `${topic.color}12`)}
            >
              {isExpanded ? "▲" : "▼"}
            </button>
          </div>
        </div>

        {/* المحتوى الموسع */}
        {isExpanded && (
          <>
            {topic.description && (
              <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7, marginBottom: 16 }}>
                {topic.description}
              </p>
            )}
            {topic.suggestion && (
              <div
                style={{
                  background: `${topic.color}0d`,
                  border: `1px solid ${topic.color}25`,
                  borderRadius: 10,
                  padding: "8px 12px",
                  marginBottom: 18,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 14 }}>🧠</span>
                <span style={{ fontSize: 12, color: topic.color, fontWeight: 600 }}>{topic.suggestion}</span>
              </div>
            )}
            {topic.stats && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3,1fr)",
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                {[
                  { icon: "💼", label: "Job Openings", value: topic.stats.jobs },
                  { icon: "📈", label: "Demand Growth", value: topic.stats.growth },
                  { icon: "💰", label: "Avg. Salary", value: topic.stats.avgSalary },
                ].map((s, si) => (
                  <div
                    key={si}
                    style={{
                      background: "var(--bg3)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      padding: "10px 8px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: topic.color }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "var(--bg3)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "7px 12px",
                }}
              >
                <span style={{ fontSize: 14 }}>📋</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>
                  {examCount} Exams Available
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "var(--bg3)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "7px 12px",
                }}
              >
                <span style={{ fontSize: 14 }}>🎯</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>
                  Avg. Pass Rate {avgPass}%
                </span>
              </div>
            </div>
          </>
        )}

        {/* قائمة أفضل الامتحانات */}
        {topExams.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "var(--text3)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 10,
              }}
            >
              Top Exams
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {topExams.map((exam) => (
                <div
                  key={exam.id}
                  onClick={() => onExamClick(exam)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "9px 12px",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    gap: 10,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${topic.color}50`;
                    e.currentTarget.style.background = `${topic.color}08`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.background = "var(--bg)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{exam.logo || "📋"}</span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {exam.title}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: getDifficultyColor(exam.difficulty),
                        background: `${getDifficultyColor(exam.difficulty)}15`,
                        padding: "2px 7px",
                        borderRadius: 99,
                      }}
                    >
                      {exam.difficulty || "Medium"}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text3)" }}>→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {examCount === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "20px 0",
              fontSize: 13,
              color: "var(--text3)",
              marginBottom: 20,
            }}
          >
            📭 No exams available in this field yet
          </div>
        )}

        {/* زر عرض جميع الامتحانات */}
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={onViewAll}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 12,
              border: `1.5px solid ${topic.color}40`,
              background: `linear-gradient(135deg, ${topic.color}18, ${topic.color}08)`,
              color: topic.color,
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              minHeight: 44,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = `linear-gradient(135deg, ${topic.color}30, ${topic.color}18)`)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = `linear-gradient(135deg, ${topic.color}18, ${topic.color}08)`)
            }
          >
            View All Exams ({examCount}) <span style={{ fontSize: 16 }}>→</span>
          </button>
        </div>
      </div>
      {isExpanded && (
        <div
          style={{
            padding: "16px 26px",
            borderTop: `1px solid ${topic.color}18`,
            background: `${topic.color}06`,
          }}
        />
      )}
    </div>
  );
}

export default function Topics({ setPage, setActiveExam, exams: propExams = [] }) {
  const exams = useMemo(() => propExams.filter((e) => e.isActive !== false), [propExams]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getTopics()
      .then((data) => {
        if (!cancelled) {
          setTopics(data || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleExamClick = (exam) => {
    setActiveExam(exam);
    setPage("exam-detail");
  };

  const topicGroups = useMemo(() => {
    return topics.map((topic) => {
      const topicExams = exams.filter((e) =>
        (e.topic || "").toLowerCase().includes(topic.name.toLowerCase())
      );
      const passRates = topicExams.filter((e) => e.passScore).map((e) => e.passScore);
      const avgPass = passRates.length
        ? Math.round(passRates.reduce((a, b) => a + b, 0) / passRates.length)
        : 70;
      return { ...topic, exams: topicExams, avgPass };
    });
  }, [exams, topics]);

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px clamp(20px,4vw,36px) 80px", overflowX: "hidden" }}>
      <div className="fade-up" style={{ marginBottom: 52 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--accent)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 10,
          }}
        >
          Browse by Topic
        </div>
        <h1
          style={{
            fontSize: "clamp(30px,4vw,48px)",
            fontWeight: 900,
            marginBottom: 14,
            color: "var(--text)",
            letterSpacing: "-1.5px",
          }}
        >
          Choose Your Domain of Expertise
        </h1>
        <p style={{ fontSize: 15, color: "var(--text2)", maxWidth: 620, lineHeight: 1.7 }}>
          Every career path starts with choosing the right field. Explore specializations, see market numbers, and
          begin your professional journey.
        </p>
        <div style={{ display: "flex", gap: 16, marginTop: 28, flexWrap: "wrap" }}>
          {[
            { icon: "📋", label: "Available Exams", value: exams.length || "—" },
            { icon: "🎯", label: "Specializations", value: topics.length || "—" },
            { icon: "🏆", label: "Global Certifications", value: "100+" },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "var(--bg2)",
                border: "1.5px solid var(--border)",
                borderRadius: 12,
                padding: "10px 18px",
                minWidth: 120,
              }}
            >
              <span style={{ fontSize: 20 }}>{stat.icon}</span>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "var(--text)" }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600 }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(560px,1fr))", gap: 28 }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                background: "var(--bg2)",
                border: "1.5px solid var(--border)",
                borderRadius: 20,
                height: 200,
                animation: "shimmerLoad 1.4s ease-in-out infinite",
              }}
            />
          ))}
        </div>
      ) : topics.length === 0 ? (
        <Empty
          icon="📚"
          title="No topics found"
          subtitle="Topics will appear here once added in the admin panel"
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 28,
          }}
        >
          {topicGroups.map((topic, idx) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              topExams={topic.exams.slice(0, 5)}
              examCount={topic.exams.length}
              avgPass={topic.avgPass}
              onViewAll={() => setPage("exams", { topicFilter: topic.name })}
              onExamClick={handleExamClick}
              animIdx={idx}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes shimmerLoad {
          0%,100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @media (max-width: 768px) {
          .topics-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .topic-card {
            margin: 0 8px;
          }
        }
        @media (max-width: 480px) {
          .topic-card button {
            min-height: 44px;
          }
        }
        button {
          min-height: 44px;
        }
      `}</style>
    </div>
  );
}