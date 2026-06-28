import { useMemo, useState } from "react";
import { AtSign, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, User } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { AuthLayout } from "./Login";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernamePattern = /^[A-Za-z0-9_]{3,50}$/;

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [form,setForm]=useState({name:"",username:"",email:"",password:"",confirm:""});
  const [touched,setTouched]=useState({});
  const [show,setShow]=useState(false);
  const [submitting,setSubmitting]=useState(false);
  const errors=useMemo(()=>({
    name:!form.name.trim()?"Full name is required":"",
    username:!usernamePattern.test(form.username)?"Use 3-50 letters, numbers, or underscores":"",
    email:!emailPattern.test(form.email)?"Enter a valid email address":"",
    password:form.password.length<8?"Password must be at least 8 characters":"",
    confirm:form.confirm!==form.password?"Passwords do not match":"",
  }),[form]);
  if(isAuthenticated)return <Navigate to="/dashboard" replace/>;
  const field=(key,value)=>setForm({...form,[key]:value});
  const submit=async e=>{e.preventDefault();setTouched({name:true,username:true,email:true,password:true,confirm:true});if(Object.values(errors).some(Boolean)){notify("Please correct the validation errors","error");return}setSubmitting(true);try{const result=await register({full_name:form.name.trim(),username:form.username.trim(),email:form.email.trim(),password:form.password});notify(result.message);navigate("/login",{replace:true})}catch(err){notify(err.message||"Registration failed","error")}finally{setSubmitting(false)}};
  const input=(key,label,Icon,type="text",autoComplete)=> <label>{label}<div className="input-wrap"><Icon/><input type={type} autoComplete={autoComplete} value={form[key]} onBlur={()=>setTouched({...touched,[key]:true})} onChange={e=>field(key,e.target.value)} aria-invalid={Boolean(touched[key]&&errors[key])}/>{key==="password"&&<button type="button" aria-label="Toggle password visibility" onClick={()=>setShow(!show)}>{show?<EyeOff/>:<Eye/>}</button>}</div>{touched[key]&&errors[key]&&<small className="field-error">{errors[key]}</small>}</label>;
  return <AuthLayout title="Create your account" subtitle="Set up secure access to TumorNet in a minute."><form className="auth-form register-form" onSubmit={submit} noValidate>
    {input("name","Full Name",User,"text","name")}{input("username","Username",AtSign,"text","username")}{input("email","Email",Mail,"email","email")}{input("password","Password",LockKeyhole,show?"text":"password","new-password")}
    <label>Confirm Password<div className="input-wrap"><LockKeyhole/><input type={show?"text":"password"} autoComplete="new-password" value={form.confirm} onBlur={()=>setTouched({...touched,confirm:true})} onChange={e=>field("confirm",e.target.value)} aria-invalid={Boolean(touched.confirm&&errors.confirm)}/></div>{touched.confirm&&errors.confirm&&<small className="field-error">{errors.confirm}</small>}</label>
    <button className="btn primary auth-submit" disabled={submitting}>{submitting?<><LoaderCircle className="spinner"/>Creating account...</>:"Create Account"}</button>
    <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
  </form></AuthLayout>;
}
