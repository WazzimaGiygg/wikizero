// js/firebase-config.js
// Cole suas credenciais de configuração do Firebase aqui
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Inicialize o Firebase
firebase.initializeApp(firebaseConfig);

// Obtenha instâncias dos serviços que você usará
const auth = firebase.auth();
const db = firebase.firestore();
