// --- ADMINISTRATION UOMtv ---
// Gestion de la connexion et des vidéos via Firebase

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.24.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.24.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/9.24.0/firebase-firestore.js";

// ✅ Configuration Firebase correcte (la tienne)
const firebaseConfig = {
  apiKey: "AIzaSyCivY0fYB9hMWW5JMxj2AZzlUX_0jo5ka8",
  authDomain: "uomtv-f4184.firebaseapp.com",
  projectId: "uomtv-f4184",
  storageBucket: "uomtv-f4184.firebasestorage.app",
  messagingSenderId: "920854342029",
  appId: "1:920854342029:web:98af6c5109391de1b4b5c4",
};

// --- Initialisation ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Références DOM ---
const loginSection = document.getElementById("login-section");
const adminSection = document.getElementById("admin-section");
const loginBtn = document.getElementById("loginBtn");
const signoutBtn = document.getElementById("signoutBtn");
const loginError = document.getElementById("loginError");

const saveBtn = document.getElementById("saveBtn");
const titleInput = document.getElementById("title");
const ytInput = document.getElementById("ytlink");
const successMsg = document.getElementById("success");
const videoList = document.getElementById("video-list");

// --- Connexion administrateur ---
loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  loginError.textContent = "";

  if (!email || !password) {
    loginError.textContent = "⚠ Email et mot de passe requis.";
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginError.textContent = "";
  } catch (err) {
    loginError.textContent = "Erreur : " + err.message;
  }
});

// --- Déconnexion ---
signoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

// --- Gestion de l’état de connexion ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginSection.style.display = "none";
    adminSection.style.display = "block";
    loadVideos();
  } else {
    loginSection.style.display = "block";
    adminSection.style.display = "none";
    videoList.innerHTML = "";
  }
});

// --- Ajouter une vidéo ---
saveBtn.addEventListener("click", async () => {
  const title = titleInput.value.trim();
  const url = ytInput.value.trim();
  successMsg.textContent = "";

  if (!title || !url) {
    successMsg.textContent = "⚠ Titre et lien requis.";
    return;
  }

  try {
    await addDoc(collection(db, "videos"), {
      title,
      url,
      createdAt: new Date().toISOString(),
    });
    successMsg.textContent = "✅ Vidéo publiée avec succès !";
    titleInput.value = "";
    ytInput.value = "";
    loadVideos();
  } catch (err) {
    successMsg.textContent = "Erreur : " + err.message;
  }
});

// --- Charger les vidéos depuis Firestore ---
async function loadVideos() {
  videoList.innerHTML = "<p>Chargement...</p>";

  try {
    const snap = await getDocs(collection(db, "videos"));
    videoList.innerHTML = "";

    if (snap.empty) {
      videoList.innerHTML = "<p>Aucune vidéo publiée.</p>";
      return;
    }

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;

      const div = document.createElement("div");
      div.className = "video-item";

      const iframe = document.createElement("iframe");
      iframe.src = data.url
        .replace("watch?v=", "embed/")
        .replace("youtu.be/", "www.youtube.com/embed/");
      iframe.width = "320";
      iframe.height = "180";
      iframe.allowFullscreen = true;

      const title = document.createElement("h3");
      title.textContent = data.title;

      const delBtn = document.createElement("button");
      delBtn.textContent = "Supprimer";
      delBtn.className = "btn danger";
      delBtn.addEventListener("click", async () => {
        if (!confirm("Supprimer cette vidéo ?")) return;
        await deleteDoc(doc(db, "videos", id));
        loadVideos();
      });

      div.appendChild(title);
      div.appendChild(iframe);
      div.appendChild(delBtn);
      videoList.appendChild(div);
    });
  } catch (err) {
    videoList.innerHTML =
      "<p style='color:red'>Erreur : " + err.message + "</p>";
  }
}