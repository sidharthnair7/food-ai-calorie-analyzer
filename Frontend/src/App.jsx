import { useState } from "react";

const BASE_URL = "http://localhost:8080";

async function analyzeFood() {
  const response = await fetch(`${BASE_URL}/api/analyze`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server error ${response.status}`);
  }
  return response.json();
}

const NAV_LINKS = ["BMI Calculator", "Test Food", "Budget Food Recipes"];

export default function App() {
  const [result, setResult] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setCapturedImage(null);
    try {
      const data = await analyzeFood();
      setResult(data.analysis);
      setCapturedImage(data.image);
      setTimeout(() => {
        document.getElementById("result-section")?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    } catch (e) {
      if (e.message.includes("Failed to fetch") || e.message.includes("NetworkError")) {
        setError("Cannot reach server. Make sure Spring Boot is running on port 8080.");
      } else if (e.message.includes("429")) {
        setError("Gemini quota exceeded. Wait a minute and try again.");
      } else {
        setError(e.message || "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
      <div style={{ fontFamily: "'Inter', sans-serif", overflowX: "hidden" }}>

        {/* NAVBAR */}
        <nav style={{
          background: "#013220", color: "white", position: "fixed",
          top: 0, width: "100%", zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 2rem", height: "64px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.4)"
        }}>
        <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "1.4rem", fontWeight: 800 }}>
          Nutrico
        </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {NAV_LINKS.map(l => (
                <button key={l} style={{
                  background: "none", border: "none", color: "white",
                  cursor: "pointer", fontSize: "0.88rem", padding: "0.4rem 0.8rem",
                  borderRadius: "6px", transition: "background 0.2s"
                }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}
                >{l}</button>
            ))}
          </div>
          <img
              src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
              alt="avatar"
              style={{ width: 36, height: 36, borderRadius: "50%", cursor: "pointer" }}
          />
        </nav>

        {/* HERO */}
        <section style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg,#013220 0%,#14452f 55%,#1a5c3a 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          paddingTop: "64px"
        }}>
          <div style={{
            display: "flex", flexWrap: "wrap", alignItems: "center",
            gap: "3rem", maxWidth: "1100px", width: "90%"
          }}>
            <img
                src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80"
                alt="nutrition"
                style={{ width: 340, height: 340, borderRadius: "50%", objectFit: "cover", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
            />
            <div style={{ flex: 1, minWidth: 280 }}>
              <h1 style={{
                fontFamily: "'Montserrat',sans-serif",
                fontSize: "clamp(2rem,4vw,3.2rem)", fontWeight: 800,
                color: "white", lineHeight: 1.15, marginBottom: "1.5rem"
              }}>LISTEN TO YOUR<br />NUTRITION HEALTH</h1>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "1.05rem", lineHeight: 1.75, marginBottom: "2rem" }}>
                Powered by Gemini AI and informed by elite health experts, we provide tailored
                nutritional guidance to ensure your wellness journey is truly personal.
              </p>
              <button
                  onClick={() => document.getElementById("camera-section")?.scrollIntoView({ behavior: "smooth" })}
                  style={{
                    background: "white", color: "#14452F", border: "none",
                    padding: "0.85rem 2.2rem", borderRadius: "8px",
                    fontWeight: 700, fontSize: "1rem", cursor: "pointer",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.25)", transition: "transform 0.2s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "none"}
              >Get Started</button>
            </div>
          </div>
        </section>

        {/* CAMERA / ANALYZE SECTION */}
        <section id="camera-section" style={{
          minHeight: "100vh", background: "#cae9be",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "5rem 0"
        }}>
          <div style={{
            display: "flex", flexWrap: "wrap", alignItems: "center",
            gap: "4rem", maxWidth: "1100px", width: "90%"
          }}>
            {/* Text + button side */}
            <div style={{ flex: 1, minWidth: 280 }}>
              <h1 style={{
                fontFamily: "'Montserrat',sans-serif",
                fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)", fontWeight: 800,
                color: "#22311d", marginBottom: "1.2rem",textAlign: "left",
                lineHeight: 1.3
              }}>Intelligent Nutrition Tracking</h1>
              <p style={{ color: "#22311d", fontSize: "1.05rem", lineHeight: 1.75, marginBottom: "2rem" }}>
                Simply snap a photo of your meal to unlock instant nutritional insights.
                Our Gemini AI analyzes your food values while our health experts ensure
                every suggestion is tailored to your unique wellness goals.
              </p>

              <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  style={{
                    background: loading ? "#6b8f71" : "#013220",
                    color: "white", border: "none",
                    padding: "0.95rem 2.5rem", borderRadius: "10px",
                    fontWeight: 700, fontSize: "1.05rem",
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 20px rgba(1,50,32,0.35)",
                    display: "flex", alignItems: "center", gap: "0.6rem",
                    transition: "transform 0.2s, background 0.2s"
                  }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => e.currentTarget.style.transform = "none"}
              >
                {loading ? (
                    <>
                  <span style={{
                    width: 18, height: 18, border: "2.5px solid white",
                    borderTopColor: "transparent", borderRadius: "50%",
                    display: "inline-block", animation: "spin 0.7s linear infinite"
                  }} />
                      Capturing & Analyzing...
                    </>
                ) : "📸 Capture & Analyze"}
              </button>

              {/* Status dot */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1rem" }}>
              <span style={{
                width: 9, height: 9, borderRadius: "50%", display: "inline-block",
                background: error ? "#ef4444" : loading ? "#f59e0b" : "#22c55e"
              }} />
                <span style={{ fontSize: "0.82rem", color: "#3a5a3a" }}>
                {error ? "Connection error" : loading ? "Connecting to Spring Boot..." : "Ready — server on :8080"}
              </span>
              </div>

              {error && (
                  <div style={{
                    marginTop: "1rem", padding: "1rem 1.2rem",
                    background: "#fee2e2", border: "1px solid #fca5a5",
                    borderRadius: "10px", color: "#991b1b", fontSize: "0.93rem"
                  }}>
                    ⚠️ {error}
                  </div>
              )}
            </div>

            {/* Image circle — shows captured frame or placeholder */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{
                width: 380, height: 380, borderRadius: "50%",
                overflow: "hidden", border: "5px solid #013220",
                boxShadow: "0 20px 60px rgba(1,50,32,0.25)",
                background: "#d4edda",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                {capturedImage ? (
                    <img
                        src={capturedImage}
                        alt="Captured food"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                ) : (
                    <div style={{ textAlign: "center", color: "#22311d", opacity: 0.5 }}>
                      <div style={{ fontSize: "3.5rem", marginBottom: "0.5rem" }}>📷</div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>Camera preview<br />appears here</div>
                    </div>
                )}
              </div>
              {loading && (
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    background: "rgba(1,50,32,0.55)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                <span style={{
                  width: 48, height: 48, border: "4px solid white",
                  borderTopColor: "transparent", borderRadius: "50%",
                  display: "inline-block", animation: "spin 0.7s linear infinite"
                }} />
                  </div>
              )}
            </div>
          </div>
        </section>

        {/* RESULTS SECTION */}
        {result && (
            <section id="result-section" style={{
              background: "linear-gradient(180deg,#f0faf0 0%,#e8f5e9 100%)",
              padding: "6rem 0",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <div style={{ maxWidth: "860px", width: "90%" }}>
                <h2 style={{
                  fontFamily: "'Montserrat',sans-serif", fontSize: "2.2rem",
                  fontWeight: 800, color: "#013220",
                  marginBottom: "2.5rem", textAlign: "center"
                }}>🍽️ Nutrition Analysis</h2>

                {/* 4 stat cards */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(185px,1fr))",
                  gap: "1.2rem", marginBottom: "2rem"
                }}>
                  {[
                    { label: "Detected Food", value: result.detectedFood, icon: "🥗", bg: "#d1fae5", border: "#6ee7b7" },
                    { label: "Calories",      value: result.calories,     icon: "🔥", bg: "#fef3c7", border: "#fcd34d" },
                    { label: "Confidence",    value: result.confidence,   icon: "📊", bg: "#dbeafe", border: "#93c5fd" },
                    { label: "Assumptions",   value: result.assumptions,  icon: "💡", bg: "#ede9fe", border: "#c4b5fd" },
                  ].map(card => (
                      <div key={card.label} style={{
                        background: card.bg,
                        border: `1.5px solid ${card.border}`,
                        borderRadius: "14px", padding: "1.5rem",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
                        transition: "transform 0.2s"
                      }}
                           onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
                           onMouseLeave={e => e.currentTarget.style.transform = "none"}
                      >
                        <div style={{ fontSize: "2rem", marginBottom: "0.6rem" }}>{card.icon}</div>
                        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          {card.label}
                        </div>
                        <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1a1a1a", marginTop: "0.4rem", lineHeight: 1.3 }}>
                          {card.value || "Not provided"}
                        </div>
                      </div>
                  ))}
                </div>

                {/* Suggestions card */}
                <div style={{
                  background: "#013220", color: "white",
                  borderRadius: "16px", padding: "2.2rem",
                  boxShadow: "0 8px 30px rgba(1,50,32,0.3)"
                }}>
                  <h3 style={{
                    fontFamily: "'Montserrat',sans-serif",
                    fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem",
                    display: "flex", alignItems: "center", gap: "0.5rem"
                  }}>
                    💚 Health Suggestions
                  </h3>
                  <p style={{ lineHeight: 1.8, color: "rgba(255,255,255,0.9)", fontSize: "1rem" }}>
                    {result.rawResponse?.split("\n").find(l => l.trim().startsWith("Suggestions:"))
                        ?.replace("Suggestions:", "").trim() || "Eat balanced meals with plenty of vegetables and stay hydrated."}
                  </p>
                </div>

                <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
                  <button
                      onClick={handleAnalyze}
                      style={{
                        background: "#14452f", color: "white", border: "none",
                        padding: "0.85rem 2.5rem", borderRadius: "10px",
                        fontWeight: 700, cursor: "pointer", fontSize: "1rem",
                        boxShadow: "0 4px 15px rgba(1,50,32,0.3)", transition: "transform 0.2s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "none"}
                  >
                    📸 Analyze Another Meal
                  </button>
                </div>
              </div>
            </section>
        )}

        {/* LOGIN */}
        <section style={{
          minHeight: "100vh", background: "#013220", color: "white",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem 0"
        }}>
          <div style={{
            display: "flex", flexWrap: "wrap", gap: "3rem",
            maxWidth: "1000px", width: "90%", alignItems: "center", justifyContent: "center"
          }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <h1 style={{ fontFamily: "'Montserrat',sans-serif", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, marginBottom: "1rem" }}>
                Login now!
              </h1>
              <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.75 }}>
                Log in to access your personalized nutritional insights and connect with
                your Gemini AI health coaches. Every meal tracked is a step closer to your wellness goals.
              </p>
            </div>
            <div style={{
              background: "white", borderRadius: "16px", padding: "2.5rem",
              width: "100%", maxWidth: "380px", boxShadow: "0 20px 60px rgba(0,0,0,0.35)"
            }}>
              {["Email", "Password"].map(field => (
                  <div key={field} style={{ marginBottom: "1.2rem" }}>
                    <label style={{ display: "block", color: "#333", fontWeight: 600, marginBottom: "0.4rem", fontSize: "0.95rem" }}>
                      {field}
                    </label>
                    <input
                        type={field === "Password" ? "password" : "email"}
                        placeholder={field}
                        style={{
                          width: "100%", padding: "0.8rem 1rem",
                          border: "1.5px solid #e2e8f0", borderRadius: "8px",
                          fontSize: "1rem", boxSizing: "border-box", outline: "none",
                          transition: "border 0.2s"
                        }}
                        onFocus={e => e.target.style.border = "1.5px solid #013220"}
                        onBlur={e => e.target.style.border = "1.5px solid #e2e8f0"}
                    />
                  </div>
              ))}
              <a href="#" style={{ color: "#013220", fontSize: "0.88rem" }}>Forgot password?</a>
              <button style={{
                width: "100%", background: "#013220", color: "white", border: "none",
                padding: "0.9rem", borderRadius: "8px", fontWeight: 700,
                fontSize: "1rem", cursor: "pointer", marginTop: "1.2rem",
                transition: "background 0.2s"
              }}
                      onMouseEnter={e => e.currentTarget.style.background = "#014d30"}
                      onMouseLeave={e => e.currentTarget.style.background = "#013220"}
              >Login</button>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ background: "#cae9be", textAlign: "center", padding: "3rem 1rem" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginBottom: "1rem" }}>
            {["About us", "Contact"].map(l => (
                <a key={l} href="#" style={{ color: "#22311d", textDecoration: "none", fontWeight: 600 }}>{l}</a>
            ))}
          </div>
          <p style={{ color: "#22311d", fontSize: "0.88rem" }}>Copyright © All rights reserved by Neutrico Industries Ltd</p>
        </footer>

        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Montserrat:wght@700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      </div>
  );
}