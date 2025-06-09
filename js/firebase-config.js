// js/firebase-config.js
// Cole suas credenciais de configuração do Firebase aqui
    const firebaseConfig = {
            apiKey: "AIzaSyB9GkSqTIZ0kbVsba_WOdQeVAETrF9qna0",
            authDomain: "wzzm-ce3fc.firebaseapp.com",
            projectId: "wzzm-ce3fc",
            storageBucket: "wzzm-ce3fc.appspot.com",
            messagingSenderId: "249427877153",
            appId: "1:249427877153:web:0e4297294794a5aadeb260",
            measurementId: "G-PLKNZNFCQ8"
        };

// Inicialize o Firebase
firebase.initializeApp(firebaseConfig);

// Obtenha instâncias dos serviços que você usará
const auth = firebase.auth();
const db = firebase.firestore();
