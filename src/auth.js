// Staged authentication module: not active until migration and security review.
// Never store passwords or session tokens in plaintext.
const enc = new TextEncoder();
const hex = a => [...new Uint8Array(a)].map(v=>v.toString(16).padStart(2,"0")).join("");
const random = n => { const x=new Uint8Array(n);crypto.getRandomValues(x);return hex(x) };
const sha = async v => hex(await crypto.subtle.digest("SHA-256",enc.encode(v)));
async function derive(password,salt,iterations=310000) {
  const base=await crypto.subtle.importKey("raw",enc.encode(password),"PBKDF2",false,["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:enc.encode(salt),iterations},base,256));
}
export async function hashPassword(password) {
  if(typeof password!=="string"||password.length<14||password.length>256)throw Error("Passwort muss 14–256 Zeichen umfassen");
  const salt=random(24);return {salt,hash:await derive(password,salt),algorithm:"pbkdf2-sha256",iterations:310000};
}
export async function verifyPassword(password,stored) {
  if(!stored||stored.algorithm!=="pbkdf2-sha256"||!Number.isInteger(stored.iterations)||stored.iterations<310000)return false;
  const computed=await derive(password,stored.salt,stored.iterations);
  // Constant-time comparison of the encoded fixed-length digest
  if(computed.length!==stored.hash.length)return false;
  let mismatch=0;for(let i=0;i<computed.length;i++)mismatch|=computed.charCodeAt(i)^stored.hash.charCodeAt(i);
  return mismatch===0;
}
export async function initAuthSchema(db){
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS aw_auth_credentials (email TEXT PRIMARY KEY, password_salt TEXT NOT NULL,password_hash TEXT NOT NULL,algorithm TEXT NOT NULL,iterations INTEGER NOT NULL,must_reset INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT (datetime('now')))"),
    db.prepare("CREATE TABLE IF NOT EXISTS aw_auth_sessions (token_hash TEXT PRIMARY KEY,email TEXT NOT NULL,expires_at INTEGER NOT NULL,created_at INTEGER NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS aw_auth_attempts (key TEXT PRIMARY KEY,attempts INTEGER NOT NULL,window_start INTEGER NOT NULL,locked_until INTEGER NOT NULL DEFAULT 0)")
  ]);
}
export async function setPassword(db,email,password) {
  const data=await hashPassword(password);
  await db.prepare("INSERT INTO aw_auth_credentials(email,password_salt,password_hash,algorithm,iterations) VALUES(?,?,?,?,?) ON CONFLICT(email) DO UPDATE SET password_salt=excluded.password_salt,password_hash=excluded.password_hash,algorithm=excluded.algorithm,iterations=excluded.iterations,must_reset=0").bind(email.toLowerCase(),data.salt,data.hash,data.algorithm,data.iterations).run();
  await db.prepare("DELETE FROM aw_auth_sessions WHERE email=?").bind(email.toLowerCase()).run();
}
export async function createSession(db,email) {
  const token=random(32),now=Math.floor(Date.now()/1000),expires=now+8*3600;
  await db.prepare("INSERT INTO aw_auth_sessions(token_hash,email,expires_at,created_at) VALUES(?,?,?,?)").bind(await sha(token),email.toLowerCase(),expires,now).run();
  return {token,cookie:"aw_session="+token+"; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800"};
}
export async function getSession(db,request) {
  const raw=request.headers.get("cookie")||"";
  const token=raw.split(";").map(x=>x.trim()).find(x=>x.startsWith("aw_session="))?.slice(11);
  if(!token||!/^[a-f0-9]{64}$/.test(token))return null;
  const row=await db.prepare("SELECT email FROM aw_auth_sessions WHERE token_hash=? AND expires_at>?").bind(await sha(token),Math.floor(Date.now()/1000)).first();
  return row?.email||null;
}
export async function revokeSession(db,request) {
  const token=(request.headers.get("cookie")||"").split(";").map(x=>x.trim()).find(x=>x.startsWith("aw_session="))?.slice(11);
  if(token&&/^[a-f0-9]{64}$/.test(token))await db.prepare("DELETE FROM aw_auth_sessions WHERE token_hash=?").bind(await sha(token)).run();
  return "aw_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0";
}
