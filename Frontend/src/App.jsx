import { useState, useRef } from "react";

const C = {
  dark:"#0f2318", nav:"#122b1c", primary:"#1a4a2e", accent:"#2d7a4f",
  light:"#f0f7ee", text:"#1a2e1f", muted:"#5a7a60",
  warn:"#c87700", danger:"#b83232", good:"#1e7a45",
  cardGreen:"#d4edda", cardYellow:"#fff8e1", cardPurple:"#ede9ff", cardOrange:"#fff0e0",
};

export default function App() {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [page,     setPage]     = useState("home");
  const [camOn,    setCamOn]    = useState(false);
  const [captured, setCaptured] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [flags,    setFlags]    = useState([]);
  const [err,      setErr]      = useState(null);
  const [rawDebug, setRawDebug] = useState(null);
  const [bmi,      setBmi]      = useState({ w:"", h:"", val:null, cat:"", col:"" });
  const [log,      setLog]      = useState([]);

  const num        = v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
  const confColor  = c => num(c) >= 80 ? C.good : num(c) >= 55 ? C.warn : C.danger;
  const scoreColor = s => num(s) >= 7  ? C.good : num(s) >= 4  ? C.warn : C.danger;

  /* ── camera ── */
  const startCam = async () => {
    setPage("camera"); setErr(null); setResult(null);
    setCaptured(null); setFlags([]); setRawDebug(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 } }
      });
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play(); }
      setCamOn(true);
    } catch {
      setErr("Camera access denied — please allow permissions.");
    }
  };

  const stopCam = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null; setCamOn(false);
  };

  const shoot = () => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    const img = c.toDataURL("image/jpeg", 0.85);
    stopCam(); setCaptured(img); analyse(img);
  };

  const onUpload = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => { setCaptured(ev.target.result); analyse(ev.target.result); };
    r.readAsDataURL(f);
  };

  /* ── analyse ── */
  const analyse = async (dataUrl) => {
    setLoading(true); setResult(null); setErr(null);
    setFlags([]); setRawDebug(null); setPage("result");

    // Strip the data:image/jpeg;base64, prefix — send only raw base64
    const b64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;

    try {
      const res = await fetch("http://localhost:8080/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: b64 }),
      });

      const responseText = await res.text();
      console.log("Raw server response:", responseText);   // always visible in browser devtools

      if (!res.ok) {
        throw new Error(`Server ${res.status}: ${responseText}`);
      }

      // Parse JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error("Server returned non-JSON: " + responseText.substring(0, 300));
      }

      // ── KEY FIX: handle both flat and nested responses ──
      // Old GET endpoint returns { analysis: {...}, image: "..." }
      // New POST endpoint returns flat { detectedFood: ..., calories: ... }
      if (data.analysis) {
        data = data.analysis;   // unwrap nested format
      }

      console.log("Parsed data:", data);

      // Show rawResponse in debug panel if there's a parse problem
      const looksLikeError =
          !data.detectedFood ||
          data.detectedFood.toLowerCase().includes("error") ||
          data.detectedFood.toLowerCase().includes("could not") ||
          data.detectedFood.toLowerCase().includes("parse") ||
          num(data.confidence) === 0;

      if (looksLikeError && data.rawResponse) {
        setRawDebug(data.rawResponse);
      }

      // Parse warningFlags (Java sends as JSON string e.g. '["High Sugar"]')
      let parsedFlags = [];
      try {
        if (data.warningFlags) {
          const wf = typeof data.warningFlags === "string"
              ? JSON.parse(data.warningFlags)
              : data.warningFlags;
          parsedFlags = Array.isArray(wf) ? wf : [];
        }
      } catch { parsedFlags = []; }

      setResult(data);
      setFlags(parsedFlags);

      if (!looksLikeError) {
        setLog(prev => [{
          name:        data.detectedFood || "Unknown",
          calories:    num(data.calories),
          sugar:       num(data.sugar),
          protein:     num(data.protein),
          healthScore: num(data.healthScore),
          time:        new Date().toLocaleTimeString(),
        }, ...prev]);
      }

    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── bmi ── */
  const calcBmi = () => {
    const w = parseFloat(bmi.w), h = parseFloat(bmi.h) / 100;
    if (!w || !h) return;
    const v = (w / (h * h)).toFixed(1);
    const [cat, col] = v < 18.5 ? ["Underweight", C.warn]
        : v < 25 ? ["Healthy Weight", C.good]
            : v < 30 ? ["Overweight", C.warn]
                : ["Obese", C.danger];
    setBmi(p => ({ ...p, val: v, cat, col }));
  };

  const totals = log.reduce((a, f) => ({
    cal: a.cal + f.calories, sugar: a.sugar + f.sugar, pro: a.pro + f.protein
  }), { cal: 0, sugar: 0, pro: 0 });

  const RECIPES = [
    { name:"Egg & Veggie Stir-Fry",  cal:310, pro:18, price:"$1.80", tag:"High Protein" },
    { name:"Oatmeal with Banana",     cal:280, pro:8,  price:"$0.60", tag:"Low Sugar"    },
    { name:"Lentil Soup",             cal:250, pro:16, price:"$1.20", tag:"Budget Pick"  },
    { name:"Greek Yogurt + Berries",  cal:190, pro:14, price:"$1.50", tag:"High Protein" },
    { name:"PB Banana Toast",         cal:340, pro:12, price:"$0.80", tag:"Budget Pick"  },
    { name:"Chicken Rice Bowl",       cal:450, pro:35, price:"$2.50", tag:"High Protein" },
  ];

  /* ═══════════════════════════ RENDER ═══════════════════════════ */
  return (
      <div style={{ fontFamily:"'DM Sans','Segoe UI',sans-serif", background:C.light, minHeight:"100vh" }}>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(45,122,79,.45)}60%{box-shadow:0 0 0 14px rgba(45,122,79,0)}}
        .fade{animation:fadeUp .4s ease both}
        .btn-p{background:#1a4a2e;color:#fff;border:none;border-radius:12px;padding:.9rem 2rem;font-size:1rem;font-weight:700;cursor:pointer;transition:background .2s,transform .15s;font-family:inherit}
        .btn-p:hover{background:#2d7a4f;transform:translateY(-2px)}
        .btn-o{background:transparent;border:2px solid currentColor;border-radius:12px;padding:.75rem 1.6rem;font-size:.95rem;font-weight:600;cursor:pointer;font-family:inherit;transition:opacity .2s}
        .btn-o:hover{opacity:.75}
        .card{background:#fff;border-radius:16px;padding:1.25rem 1.5rem;box-shadow:0 2px 16px rgba(0,0,0,.07)}
        .nl{background:transparent;color:#8fbb9a;border:none;border-radius:8px;padding:.45rem 1rem;font-size:.85rem;font-weight:600;cursor:pointer;transition:all .2s;font-family:inherit}
        .nl:hover{background:rgba(255,255,255,.1);color:#fff}
        .nl.on{background:#2d7a4f;color:#fff}
        input[type=number]{width:100%;padding:.75rem 1rem;border-radius:10px;border:2px solid #c8e6c9;font-size:1rem;color:#1a2e1f;background:#fff;font-family:inherit;outline:none}
        .wb{display:inline-block;background:#fff8e1;color:#7d5800;border:1.5px solid #ffc107;border-radius:8px;padding:.2rem .75rem;font-size:.8rem;font-weight:700;margin:.15rem}
      `}</style>

        {/* NAV */}
        <nav style={{ background:C.nav, height:64, padding:"0 2rem", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:200, boxShadow:"0 2px 20px rgba(0,0,0,.4)" }}>
        <span onClick={() => setPage("home")} style={{ color:"#7dcf99", fontFamily:"'Montserrat',sans-serif", fontWeight:900, fontSize:"1.45rem", cursor:"pointer" }}>
          🌿 Nutrico
        </span>
          <div style={{ display:"flex", gap:".2rem" }}>
            <button className={`nl${page==="bmi"?" on":""}`}     onClick={() => setPage("bmi")}>BMI Calculator</button>
            <button className={`nl${page==="camera"?" on":""}`}   onClick={startCam}>Test Food</button>
            <button className={`nl${page==="recipes"?" on":""}`}  onClick={() => setPage("recipes")}>Budget Food Recipes</button>
            {log.length > 0 && <button className={`nl${page==="log"?" on":""}`} onClick={() => setPage("log")}>Daily Log ({log.length})</button>}
          </div>
        </nav>

        {/* ═══ HOME ═══ */}
        {page === "home" && (
            <section className="fade" style={{ minHeight:"calc(100vh - 64px)", background:`linear-gradient(135deg, ${C.primary} 0%, ${C.dark} 100%)`, display:"flex", alignItems:"center", justifyContent:"center", padding:"3rem 2rem" }}>
              <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"center", gap:"4rem", maxWidth:1100, width:"100%" }}>
                <div style={{ flex:1, minWidth:280, maxWidth:520 }}>
                  <div style={{ display:"inline-block", background:"rgba(125,207,153,.15)", color:"#7dcf99", borderRadius:20, padding:".35rem 1rem", fontSize:".78rem", fontWeight:700, letterSpacing:".09em", marginBottom:"1.25rem" }}>POWERED BY GEMINI AI</div>
                  <h1 style={{ fontFamily:"'Montserrat',sans-serif", fontSize:"clamp(2.2rem,5vw,3.2rem)", fontWeight:900, color:"#fff", lineHeight:1.15, marginBottom:"1.25rem" }}>
                    LISTEN TO YOUR<br /><span style={{ color:"#7dcf99" }}>NUTRITION HEALTH</span>
                  </h1>
                  <p style={{ color:"#a8cdb2", fontSize:"1.05rem", lineHeight:1.7, marginBottom:"2rem", maxWidth:440 }}>
                    Powered by Gemini AI and informed by elite health experts, we provide tailored nutritional guidance to ensure your wellness journey is truly personal.
                  </p>
                  <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap" }}>
                    <button className="btn-p" onClick={startCam} style={{ animation:"pulse 2.5s infinite", fontSize:"1.05rem", padding:"1rem 2.25rem" }}>📷 Get Started</button>
                    <label className="btn-o" style={{ cursor:"pointer", padding:"1rem 2rem", color:"#7dcf99", display:"flex", alignItems:"center", gap:".5rem" }}>
                      📁 Upload Photo
                      <input type="file" accept="image/*" style={{ display:"none" }} onChange={e => { setPage("result"); onUpload(e); }} />
                    </label>
                  </div>
                  <div style={{ marginTop:"1.75rem", display:"flex", gap:"2rem", flexWrap:"wrap" }}>
                    {[["🎯","AI Detection"],["📊","Full Nutrition"],["💰","Budget Tips"],["📋","Daily Log"]].map(([e,l]) => (
                        <div key={l} style={{ color:"#6fa880", fontSize:".8rem", fontWeight:600 }}>{e} {l}</div>
                    ))}
                  </div>
                </div>
                <div style={{ flex:1, minWidth:280, maxWidth:460 }}>
                  <div style={{ borderRadius:24, overflow:"hidden", boxShadow:"0 20px 60px rgba(0,0,0,.55)", background:C.dark, aspectRatio:"4/3", display:"flex", alignItems:"center", justifyContent:"center", border:"3px solid rgba(125,207,153,.25)" }}>
                    <video ref={videoRef} style={{ width:"100%", height:"100%", objectFit:"cover", display:camOn?"block":"none" }} autoPlay playsInline muted />
                    {!camOn && (
                        <div style={{ textAlign:"center", color:"#4a6a50" }}>
                          <div style={{ fontSize:"4rem", marginBottom:".5rem" }}>📷</div>
                          <div style={{ fontWeight:600, color:"#6a8a70" }}>Camera Preview</div>
                          <div style={{ fontSize:".8rem", marginTop:".25rem", color:"#4a6050" }}>Click "Get Started" to activate</div>
                        </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
        )}

        {/* ═══ CAMERA ═══ */}
        {page === "camera" && (
            <div style={{ minHeight:"calc(100vh - 64px)", background:C.dark, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2rem", gap:"2rem" }}>
              <canvas ref={canvasRef} style={{ display:"none" }} />
              {err ? (
                  <div style={{ textAlign:"center", color:"#ff9999" }}>
                    <div style={{ fontSize:"3rem" }}>⚠️</div>
                    <p style={{ fontWeight:600, marginTop:".75rem" }}>{err}</p>
                    <button className="btn-p" style={{ marginTop:"1.5rem" }} onClick={() => setPage("home")}>← Go Back</button>
                  </div>
              ) : (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted style={{ width:"100%", maxWidth:700, borderRadius:20, boxShadow:"0 8px 40px rgba(0,0,0,.6)" }} />
                    <div style={{ display:"flex", gap:"1.5rem", alignItems:"center" }}>
                      <button className="btn-o" style={{ color:"#8fbb9a" }} onClick={() => { stopCam(); setPage("home"); }}>← Back</button>
                      <button onClick={shoot}
                              style={{ width:76, height:76, borderRadius:"50%", background:"#fff", border:"5px solid #2d7a4f", cursor:"pointer", fontSize:"2rem", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 24px rgba(0,0,0,.4)", transition:"transform .15s" }}
                              onMouseEnter={e => e.currentTarget.style.transform="scale(1.1)"}
                              onMouseLeave={e => e.currentTarget.style.transform="scale(1)"}>📷
                      </button>
                      <label className="btn-o" style={{ color:"#8fbb9a", cursor:"pointer" }}>
                        📁 Upload<input type="file" accept="image/*" style={{ display:"none" }} onChange={onUpload} />
                      </label>
                    </div>
                    <p style={{ color:"#4a6a50", fontSize:".85rem" }}>Point camera at food, then press the shutter</p>
                  </>
              )}
            </div>
        )}

        {/* ═══ RESULT ═══ */}
        {page === "result" && (
            <div style={{ maxWidth:860, margin:"0 auto", padding:"2rem 1rem" }} className="fade">

              {loading && (
                  <div style={{ textAlign:"center", padding:"5rem 2rem" }}>
                    <div style={{ width:64, height:64, border:"6px solid #d4edda", borderTop:"6px solid #2d7a4f", borderRadius:"50%", animation:"spin .9s linear infinite", margin:"0 auto 2rem" }} />
                    <h2 style={{ fontFamily:"'Montserrat',sans-serif", color:C.text }}>🤖 AI Analysing Your Food…</h2>
                    <p style={{ color:C.muted, marginTop:".75rem" }}>Identifying · Estimating nutrition · Preparing smart suggestions</p>
                  </div>
              )}

              {err && !loading && (
                  <div style={{ background:"#fdecea", border:"1.5px solid #f5c6cb", borderRadius:16, padding:"2rem", textAlign:"center" }}>
                    <div style={{ fontSize:"2.5rem" }}>⚠️</div>
                    <p style={{ color:C.danger, fontWeight:700, marginTop:".75rem" }}>{err}</p>
                    <button className="btn-p" style={{ marginTop:"1.5rem" }} onClick={startCam}>Try Again</button>
                  </div>
              )}

              {result && !loading && (
                  <>
                    {/* DEBUG PANEL — only shows when Gemini returns unexpected text */}
                    {rawDebug && (
                        <div style={{ background:"#1a1a2e", border:"2px solid #ff6b6b", borderRadius:12, padding:"1rem", marginBottom:"1.5rem" }}>
                          <div style={{ color:"#ff6b6b", fontWeight:700, marginBottom:".5rem", fontSize:".85rem" }}>
                            🐛 DEBUG — Gemini raw response (copy this to fix the prompt):
                          </div>
                          <pre style={{ color:"#aaffaa", fontSize:".75rem", whiteSpace:"pre-wrap", wordBreak:"break-all", maxHeight:200, overflow:"auto" }}>
                    {rawDebug}
                  </pre>
                        </div>
                    )}

                    {captured && <img src={captured} alt="food" style={{ width:"100%", maxHeight:300, objectFit:"cover", borderRadius:20, marginBottom:"1.75rem", boxShadow:"0 4px 24px rgba(0,0,0,.15)" }} />}

                    {/* food name + badges */}
                    <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"space-between", alignItems:"flex-start", gap:"1rem", marginBottom:"1.25rem" }}>
                      <div>
                        <div style={{ fontSize:".72rem", fontWeight:700, color:C.muted, letterSpacing:".09em", textTransform:"uppercase", marginBottom:".3rem" }}>Detected Food</div>
                        <h2 style={{ fontFamily:"'Montserrat',sans-serif", fontSize:"clamp(1.4rem,3vw,2rem)", fontWeight:800, color:C.text }}>
                          {result.detectedFood || "Unknown Food"}
                        </h2>
                      </div>
                      <div style={{ display:"flex", gap:".5rem", flexWrap:"wrap" }}>
                  <span style={{ background:confColor(result.confidence), color:"#fff", borderRadius:20, padding:".3rem .9rem", fontSize:".8rem", fontWeight:700 }}>
                    {result.confidence || "0"}% Confidence
                  </span>
                        <span style={{ background:scoreColor(result.healthScore), color:"#fff", borderRadius:20, padding:".3rem .9rem", fontSize:".8rem", fontWeight:700 }}>
                    Health {result.healthScore || "0"}/10
                  </span>
                        {flags.map((w,i) => (
                            <span key={i} style={{ background:C.warn, color:"#fff", borderRadius:20, padding:".3rem .9rem", fontSize:".8rem", fontWeight:700 }}>{w}</span>
                        ))}
                      </div>
                    </div>

                    {/* confidence reason */}
                    {result.confidenceReason && (
                        <div style={{ background:"#f4faf5", border:"1.5px solid #c8e6c9", borderRadius:12, padding:".75rem 1.1rem", marginBottom:"1.25rem", fontSize:".85rem", color:C.muted }}>
                          🔍 <strong style={{ color:C.text }}>Why this confidence?</strong> {result.confidenceReason}
                        </div>
                    )}

                    {/* 4 macro cards */}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))", gap:"1rem", marginBottom:"1.25rem" }}>
                      {[
                        { label:"🔥 Calories", val:result.calories||"0",        sub:result.assumptions||"",                       bg:C.cardYellow },
                        { label:"🍬 Sugar",    val:`${result.sugar||0}g`,       sub:num(result.sugar)>20?"⚠ High":"✓ OK",         bg:C.cardOrange },
                        { label:"💪 Protein",  val:`${result.protein||0}g`,     sub:num(result.protein)>=10?"✓ Good":"Low",       bg:C.cardGreen  },
                        { label:"🌾 Carbs",    val:`${result.carbs||0}g`,       sub:`${result.fat||0}g fat`,                      bg:C.cardPurple },
                      ].map(c => (
                          <div key={c.label} style={{ background:c.bg, borderRadius:14, padding:"1.1rem", textAlign:"center" }}>
                            <div style={{ fontSize:".7rem", fontWeight:700, color:C.muted, letterSpacing:".07em", textTransform:"uppercase", marginBottom:".35rem" }}>{c.label}</div>
                            <div style={{ fontSize:"1.5rem", fontWeight:800, color:C.text }}>{c.val}</div>
                            <div style={{ fontSize:".75rem", color:C.muted, marginTop:".2rem" }}>{c.sub}</div>
                          </div>
                      ))}
                    </div>

                    {/* health score bar */}
                    <div className="card" style={{ marginBottom:"1rem" }}>
                      <div style={{ fontWeight:700, color:C.primary, marginBottom:".5rem" }}>Health Score</div>
                      <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
                        <div style={{ flex:1, height:12, borderRadius:6, background:"#e8f5e9", overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${num(result.healthScore)*10}%`, background:scoreColor(result.healthScore), borderRadius:6, transition:"width .6s ease" }} />
                        </div>
                        <span style={{ fontWeight:800, fontSize:"1.2rem", color:scoreColor(result.healthScore), minWidth:48 }}>
                    {result.healthScore||0}/10
                  </span>
                      </div>
                    </div>

                    {/* health suggestion */}
                    {result.healthSuggestion && (
                        <div style={{ background:C.primary, borderRadius:16, padding:"1.25rem 1.5rem", marginBottom:"1rem" }}>
                          <div style={{ color:"#7dcf99", fontWeight:700, marginBottom:".5rem" }}>💡 Health Suggestion</div>
                          <div style={{ color:"#ddf0e4", lineHeight:1.65 }}>{result.healthSuggestion}</div>
                        </div>
                    )}

                    {/* budget alternative */}
                    {result.cheaperHealthierAlternative && (
                        <div style={{ background:"#fffde7", border:"1.5px solid #ffe082", borderRadius:16, padding:"1.25rem 1.5rem", marginBottom:"1rem" }}>
                          <div style={{ color:"#7d5800", fontWeight:700, marginBottom:".5rem" }}>💰 Cheaper & Healthier Alternative</div>
                          <div style={{ color:C.text, lineHeight:1.65 }}>{result.cheaperHealthierAlternative}</div>
                        </div>
                    )}

                    {/* next meal */}
                    {result.nextMealSuggestion && (
                        <div style={{ background:"#f0fff4", border:"1.5px solid #c8e6c9", borderRadius:16, padding:"1.25rem 1.5rem", marginBottom:"1rem" }}>
                          <div style={{ color:C.good, fontWeight:700, marginBottom:".5rem" }}>🍽️ Next Meal Suggestion</div>
                          <div style={{ color:C.text, lineHeight:1.65 }}>{result.nextMealSuggestion}</div>
                        </div>
                    )}

                    {/* warning flags */}
                    {flags.length > 0 && (
                        <div className="card" style={{ marginBottom:"1rem" }}>
                          <div style={{ fontWeight:700, color:C.warn, marginBottom:".5rem" }}>⚠️ Nutritional Flags</div>
                          {flags.map((f,i) => <span key={i} className="wb">{f}</span>)}
                        </div>
                    )}

                    <div style={{ display:"flex", gap:"1rem", justifyContent:"center", marginTop:"2rem", flexWrap:"wrap" }}>
                      <button className="btn-p" onClick={() => { setCaptured(null); setResult(null); startCam(); }}>📷 Analyse Another Meal</button>
                      {log.length > 0 && <button className="btn-o" style={{ color:C.primary }} onClick={() => setPage("log")}>📋 View Daily Log ({log.length})</button>}
                    </div>
                  </>
              )}
            </div>
        )}

        {/* ═══ BMI ═══ */}
        {page === "bmi" && (
            <div style={{ maxWidth:520, margin:"3rem auto", padding:"0 1rem" }} className="fade">
              <h2 style={{ fontFamily:"'Montserrat',sans-serif", fontWeight:800, color:C.text, marginBottom:"1.75rem", fontSize:"1.9rem" }}>BMI Calculator</h2>
              <div className="card">
                <div style={{ marginBottom:"1rem" }}>
                  <label style={{ display:"block", fontWeight:600, color:C.muted, fontSize:".82rem", letterSpacing:".07em", textTransform:"uppercase", marginBottom:".4rem" }}>Weight (kg)</label>
                  <input type="number" placeholder="e.g. 70" value={bmi.w} onChange={e => setBmi(p => ({ ...p, w:e.target.value }))} />
                </div>
                <div style={{ marginBottom:"1.5rem" }}>
                  <label style={{ display:"block", fontWeight:600, color:C.muted, fontSize:".82rem", letterSpacing:".07em", textTransform:"uppercase", marginBottom:".4rem" }}>Height (cm)</label>
                  <input type="number" placeholder="e.g. 175" value={bmi.h} onChange={e => setBmi(p => ({ ...p, h:e.target.value }))} />
                </div>
                <button className="btn-p" style={{ width:"100%" }} onClick={calcBmi}>Calculate BMI</button>
              </div>
              {bmi.val && (
                  <div className="card fade" style={{ marginTop:"1.5rem", textAlign:"center" }}>
                    <div style={{ fontSize:"4rem", fontWeight:900, color:bmi.col, fontFamily:"'Montserrat',sans-serif" }}>{bmi.val}</div>
                    <div style={{ fontSize:"1.2rem", fontWeight:700, color:bmi.col, marginTop:".25rem" }}>{bmi.cat}</div>
                    <p style={{ color:C.muted, marginTop:".75rem", fontSize:".9rem", lineHeight:1.6 }}>
                      {bmi.val < 18.5 ? "Consider adding more calorie-dense whole foods like nuts, avocado, and lean proteins."
                          : bmi.val < 25 ? "You're in the healthy range. Keep maintaining balanced meals and regular activity!"
                              : "Focus on reducing processed foods and increasing vegetable intake and daily movement."}
                    </p>
                  </div>
              )}
            </div>
        )}

        {/* ═══ RECIPES ═══ */}
        {page === "recipes" && (
            <div style={{ maxWidth:900, margin:"3rem auto", padding:"0 1rem" }} className="fade">
              <h2 style={{ fontFamily:"'Montserrat',sans-serif", fontWeight:800, color:C.text, marginBottom:".5rem", fontSize:"1.9rem" }}>💸 Budget-Friendly Healthy Recipes</h2>
              <p style={{ color:C.muted, marginBottom:"2rem" }}>Nutritious meals that won't break the bank</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))", gap:"1rem" }}>
                {RECIPES.map((r,i) => (
                    <div key={i} className="card" style={{ borderTop:`4px solid ${C.accent}` }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:".75rem" }}>
                        <div style={{ fontWeight:700, color:C.text }}>{r.name}</div>
                        <span style={{ background:C.cardGreen, color:C.good, borderRadius:8, padding:".2rem .65rem", fontSize:".72rem", fontWeight:700, marginLeft:".5rem", whiteSpace:"nowrap" }}>{r.tag}</span>
                      </div>
                      <div style={{ display:"flex", gap:"1.25rem", fontSize:".88rem", color:C.muted }}>
                        <span>🔥 {r.cal} kcal</span><span>💪 {r.pro}g</span>
                        <span style={{ color:C.good, fontWeight:700 }}>💰 {r.price}</span>
                      </div>
                    </div>
                ))}
              </div>
            </div>
        )}

        {/* ═══ LOG ═══ */}
        {page === "log" && (
            <div style={{ maxWidth:860, margin:"3rem auto", padding:"0 1rem" }} className="fade">
              <h2 style={{ fontFamily:"'Montserrat',sans-serif", fontWeight:800, color:C.text, marginBottom:"1.5rem", fontSize:"1.9rem" }}>📋 Today's Food Log</h2>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem", marginBottom:"1.75rem" }}>
                {[["🔥 Total Calories",totals.cal,"kcal"],["🍬 Total Sugar",totals.sugar,"g"],["💪 Total Protein",totals.pro,"g"]].map(([l,v,u]) => (
                    <div key={l} className="card" style={{ textAlign:"center" }}>
                      <div style={{ fontSize:"1.8rem", fontWeight:800, color:C.text }}>{v}{u}</div>
                      <div style={{ color:C.muted, fontSize:".82rem", marginTop:".25rem" }}>{l}</div>
                    </div>
                ))}
              </div>
              {log.map((item,i) => (
                  <div key={i} className="card" style={{ marginBottom:".75rem", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:".75rem" }}>
                    <div>
                      <div style={{ fontWeight:700, color:C.text }}>{item.name}</div>
                      <div style={{ color:C.muted, fontSize:".8rem" }}>{item.time}</div>
                    </div>
                    <div style={{ display:"flex", gap:"1.25rem", fontSize:".88rem", color:C.muted }}>
                      <span>🔥 {item.calories}</span>
                      <span>🍬 {item.sugar}g</span>
                      <span>💪 {item.protein}g</span>
                      <span style={{ color:scoreColor(item.healthScore), fontWeight:700 }}>★ {item.healthScore}/10</span>
                    </div>
                  </div>
              ))}
            </div>
        )}

        <canvas ref={canvasRef} style={{ display:"none" }} />
      </div>
  );
}