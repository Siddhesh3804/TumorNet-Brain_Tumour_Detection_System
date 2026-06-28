import { createElement, useEffect, useRef, useState } from "react";
import { motion as Motion, useInView, useReducedMotion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Activity, ArrowRight, BrainCircuit, Check,
  Clock3, Download,
  Menu, ScanLine, ShieldCheck, Upload, X, Zap,
} from "lucide-react";

const nav = [["Home","home"],["How It Works","workflow"],["FAQ","faq"]];
const steps = [
  [Upload,"Upload MRI","Add a clear brain MRI image."],
  [ScanLine,"Preprocessing","The scan is resized and normalized."],
  [BrainCircuit,"AI Analysis","VGG16 examines visual patterns."],
  [Activity,"Prediction","The most likely class is identified."],
  [Download,"Report","Save a readable result summary."],
];
const categories = [
  ["Glioma","/images/glioma.jpg","Gliomas begin in glial cells, the support cells that help nerve cells function. They include astrocytoma, oligodendroglioma, and glioblastoma, and can range from slow-growing to highly aggressive depending on grade."],
  ["Meningioma","/images/meningioma.jpg","Meningiomas form in the meninges, the protective membranes covering the brain and spinal cord. Many are slow-growing, but their effect depends on size, location, and pressure on nearby brain tissue."],
  ["Pituitary","/images/pituitary.jpg","Pituitary tumours arise near the pituitary gland, a small hormone-controlling gland at the base of the brain. They may affect hormone balance or press on nearby structures such as the optic nerves."],
  ["No Tumour","/images/notumor.jpg","This class represents MRI scans where the model does not detect one of the supported tumour patterns. It should not be treated as medical clearance; image quality and clinical review still matter."],
];

function Fade({children,className="",delay=0}) {
  const reduce=useReducedMotion();
  return <Motion.div className={className} initial={reduce?false:{opacity:0,y:24}} whileInView={{opacity:1,y:0}}
    viewport={{once:true,margin:"-60px"}} transition={{duration:.6,delay,ease:[.22,1,.36,1]}}>{children}</Motion.div>;
}
function Counter({to,suffix=""}) {
  const ref=useRef(null), seen=useInView(ref,{once:true}), [value,setValue]=useState(0);
  useEffect(()=>{if(!seen)return;let frame,start=performance.now();const tick=now=>{const p=Math.min((now-start)/1100,1);setValue(Math.round(to*(1-Math.pow(1-p,3))));if(p<1)frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)},[seen,to]);
  return <span ref={ref}>{value}{suffix}</span>;
}
function Logo({light=false}) {
  return <a href="#home" className={`logo ${light?"light":""}`}><span className="logo-mark"><BrainCircuit/></span><b>Tumor<span>Net</span></b></a>;
}
function SectionHead({kicker,title,accent,children}) {
  return <Fade className="section-head"><small>{kicker}</small><h2>{title} {accent&&<span>{accent}</span>}</h2><p>{children}</p></Fade>;
}

export default function Landing() {
  const [scrolled,setScrolled]=useState(false),[open,setOpen]=useState(false);
  const { isAuthenticated, currentUser, logout } = useAuth();
  const navigate = useNavigate();
  useEffect(()=>{const fn=()=>setScrolled(scrollY>20);fn();addEventListener("scroll",fn,{passive:true});return()=>removeEventListener("scroll",fn)},[]);
  const upload=()=>navigate(isAuthenticated ? "/upload" : "/login");
  return <div className="site">
    <header className={`navbar ${scrolled?"scrolled":""}`}>
      <div className="container nav-inner"><Logo/><nav className="desktop-nav">{nav.map(([a,b])=><a key={b} href={`#${b}`}>{a}</a>)}</nav>
        <div className="nav-actions">{isAuthenticated ? <><button className="avatar" aria-label={`${currentUser?.full_name} profile`} onClick={()=>navigate("/profile")}>{currentUser?.full_name?.split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase()}</button><button className="login" onClick={async()=>{await logout();navigate("/")}}>Logout</button></> : <><Link className="login" to="/login">Log in</Link><Link className="btn secondary small" to="/register">Register</Link></>}</div>
        <button className="menu" aria-label="Toggle menu" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button>
      </div>
      {open&&<Motion.nav className="mobile-nav" initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}>{nav.map(([a,b])=><a key={b} href={`#${b}`} onClick={()=>setOpen(false)}>{a}</a>)}{!isAuthenticated&&<><Link to="/login">Log in</Link><Link to="/register">Register</Link></>}<button className="btn primary" onClick={upload}>Upload MRI</button></Motion.nav>}
    </header>

    <main>
      <section className="hero" id="home"><div className="container hero-grid">
        <Fade className="hero-copy">
          <h1>Detect Brain Tumours with <span>Deep Learning</span></h1>
          <p>TumorNet analyzes brain MRI scans and classifies them as Glioma, Meningioma, Pituitary tumour, or No Tumour - turning complex imaging into a clear result.</p>
          <div className="hero-buttons"><button className="btn primary large" onClick={upload}><Upload/>Upload MRI<ArrowRight/></button></div>
          <div className="trust">{["AI Powered","Secure Upload","Fast Prediction"].map(x=><span key={x}><Check/>{x}</span>)}</div>
        </Fade>
        <Fade className="hero-visual" delay={.12}><div className="scan-card">
          <div className="scan-top"><span><i/>LIVE AI ANALYSIS</span><span>VGG16</span></div>
          <div className="scan-stage"><img src="/images/hero-mri.jpg" alt="Brain MRI scan being analyzed"/><div className="grid"/><div className="cross x"/><div className="cross y"/><div className="ring one"/><div className="ring two"/><div className="beam"/></div>
          <div className="scan-bottom"><div><small>PROCESSING STATUS</small><b><Check/>Analysis complete</b></div><strong>95.8%<small>Confidence</small></strong></div>
        </div>
        <Motion.div className="float-chip chip-a" animate={{y:[-5,5,-5]}} transition={{repeat:Infinity,duration:4}}><ShieldCheck/><span><b>Secure</b><small>Encrypted scan</small></span></Motion.div>
        <Motion.div className="float-chip chip-b" animate={{y:[5,-5,5]}} transition={{repeat:Infinity,duration:4.5}}><Zap/><span><b>1.8 sec</b><small>Analysis time</small></span></Motion.div>
        </Fade>
      </div></section>

      <section className="stats"><div className="container stats-grid">
        {[[Activity,<Counter to={95} suffix="%+"/>,"Model Accuracy"],[ScanLine,<Counter to={4}/>,"Tumour Classes"],[BrainCircuit,"Deep","Learning Model"],[Clock3,"<2 sec","Prediction Time"]].map(([Icon,val,label],i)=><Fade className="stat" delay={i*.05} key={label}><span>{createElement(Icon)}</span><div><b>{val}</b><small>{label}</small></div></Fade>)}
      </div></section>

      <section className="section" id="workflow"><div className="container">
        <SectionHead kicker="HOW IT WORKS" title="From scan to insight in" accent="five simple steps">A focused AI pipeline transforms your MRI image into a clear classification report.</SectionHead>
        <div className="workflow"><div className="work-line"/>{steps.map(([Icon,title,text],i)=><Fade className="step" delay={i*.07} key={title}><em>0{i+1}</em><span>{createElement(Icon)}</span><h3>{title}</h3><p>{text}</p></Fade>)}</div>
      </div></section>

      <section className="section muted"><div className="container">
        <SectionHead kicker="CLASSIFICATION" title="Supported brain tumour types">The model distinguishes three common tumour categories and scans without a detected tumour.</SectionHead>
        <div className="category-grid">{categories.map(([title,img,text],i)=><Fade className="category" delay={i*.05} key={title}><div><img src={img} alt={`${title} MRI example`}/><span>0{i+1}</span></div><section><h3>{title}</h3><p>{text}</p></section></Fade>)}</div>
      </div></section>

      <section className="section faq" id="faq"><div className="container compact">
        <SectionHead kicker="FAQ" title="Good to know before you begin"/>
        <div className="faq-grid"><Fade><h3>Is TumorNet a medical diagnosis?</h3><p>No. It is an AI-assisted classification tool for educational and decision-support use. Always consult a qualified medical professional.</p></Fade><Fade delay={.08}><h3>What scans can I upload?</h3><p>Use a clear brain MRI image in JPG, JPEG, or PNG format. Image quality directly affects model output.</p></Fade></div>
      </div></section>

      <section className="cta-wrap" id="cta"><div className="container"><Fade className="cta"><div><small>READY WHEN YOU ARE</small><h2>Start your AI-powered brain MRI analysis</h2><p>Upload a scan and receive a clear classification result in seconds.</p><section><button className="btn white large"><Upload/>Upload MRI<ArrowRight/></button></section></div><aside><BrainCircuit/><i/><i/></aside></Fade></div></section>
    </main>

  </div>;
}


