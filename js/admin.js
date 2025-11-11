// admin.js — panneau d'administration UOMtv
// Utilise Firebase v9 modulaire via CDN

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.24.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.24.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.24.0/firebase-firestore.js";

// ---------- CONFIGURATION FIREBASE (REMPLACE LES VALEURS) ----------
const firebaseConfig = {
  apiKey: "AIzaSyCivY0fYB9hMWW5JMxj2AZzlUX_0jo5ka8",
  authDomain: "uomtv-f4184.firebaseapp.com",
  projectId: "uomtv-f4184",
  storageBucket: "uomtv-f4184.appspot.com",
  messagingSenderId: "920854342029", 
  appId: "1:920854342029:web:98af6c5109391de1b4b5c4" 
};
// -------------------------------------------------------------------

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// éléments DOM
const loginSection = document.getElementById('login-section');
const adminSection = document.getElementById('admin-section');
const loginBtn = document.getElementById('loginBtn');
const signoutBtn = document.getElementById('signoutBtn');
const loginError = document.getElementById('loginError');

const saveBtn = document.getElementById('saveBtn');
const titleInput = document.getElementById('title');
const ytInput = document.getElementById('ytlink');
const successMsg = document.getElementById('success');
const videoList = document.getElementById('video-list');
const yearSpan = document.getElementById('year');

yearSpan.textContent = new Date().getFullYear();

// Connexion
loginBtn.addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  loginError.textContent = '';
  if(!email || !password){ loginError.textContent = 'Email et mot de passe requis'; return; }
  try{
    await signInWithEmailAndPassword(auth, email, password);
    loginError.textContent = '';
  }catch(err){
    loginError.textContent = 'Erreur: ' + (err.message || err.code);
  }
});

// Déconnexion
signoutBtn.addEventListener('click', async () => {
  await signOut(auth);
});

// État d'auth
onAuthStateChanged(auth, (user) => {
  if(user){
    loginSection.style.display = 'none';
    adminSection.style.display = 'block';
    loadVideos();
  } else {
    loginSection.style.display = 'block';
    adminSection.style.display = 'none';
    videoList.innerHTML = '';
  }
});

// Publier vidéo
saveBtn.addEventListener('click', async () => {
  const title = titleInput.value.trim();
  const link = ytInput.value.trim();
  successMsg.textContent = '';
  if(!title || !link){ successMsg.textContent = 'Titre et lien requis'; return; }
  try{
    await addDoc(collection(db, 'videos'), { title, url: link, createdAt: new Date().toISOString() });
    successMsg.textContent = '✅ Vidéo enregistrée';
    titleInput.value = ''; ytInput.value = '';
    loadVideos();
  }catch(err){
    successMsg.textContent = 'Erreur: ' + (err.message || err.code);
  }
});

// Charger vidéos
async function loadVideos(){
  videoList.innerHTML = 'Chargement…';
  try{
    const snap = await getDocs(collection(db, 'videos'));
    videoList.innerHTML = '';
    if(snap.empty){
      videoList.innerHTML = '<p class="muted">Aucune vidéo publiée pour l’instant.</p>';
      return;
    }
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const id = docSnap.id;
      const item = document.createElement('div');
      item.className = 'video-item';
      // iframe
      const iframe = document.createElement('iframe');
      // convert YouTube short link to embed if needed
      let src = data.url || '';
      src = src.replace('youtu.be/','www.youtube.com/embed/');
      src = src.replace('watch?v=','embed/');
      iframe.src = src;
      iframe.setAttribute('loading','lazy');
      // meta
      const meta = document.createElement('div');
      meta.className = 'video-meta';
      const h = document.createElement('h3'); h.textContent = data.title || 'Sans titre';
      const p = document.createElement('p'); p.textContent = 'Publié le ' + (data.createdAt ? new Date(data.createdAt).toLocaleString() : '—');
      meta.appendChild(h); meta.appendChild(p);
      // actions
      const actions = document.createElement('div');
      actions.className = 'video-actions';
      const delBtn = document.createElement('button');
      delBtn.className = 'btn danger';
      delBtn.textContent = 'Supprimer';
      delBtn.addEventListener('click', async () => {
        if(!confirm('Supprimer cette vidéo ?')) return;
        try{
          await deleteDoc(doc(db, 'videos', id));
          loadVideos();
        }catch(e){
          alert('Erreur suppression: ' + (e.message || e.code));
        }
      });
      actions.appendChild(delBtn);

      item.appendChild(iframe);
      item.appendChild(meta);
      item.appendChild(actions);
      videoList.appendChild(item);
    });
  }catch(err){
    videoList.innerHTML = '<p class="error-text">Erreur chargement: ' + (err.message || err.code) + '</p>';
  }
}