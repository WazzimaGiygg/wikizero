// Substitua com as suas configurações do Firebase!
// Você pode encontrar isso nas configurações do seu projeto Firebase -> "Seus apps" -> "Configurações" (ícone de engrenagem)
// --- Configuração do Firebase ---
        const firebaseConfig = {
            apiKey: "AIzaSyB9GkSqTIZ0kbVsba_WOdQeVAETrF9qna0", // Use sua própria chave! /* cite: 79 */
            authDomain: "wzzm-ce3fc.firebaseapp.com", /* cite: 79 */
            projectId: "wzzm-ce3fc", /* cite: 79 */
            storageBucket: "wzzm-ce3fc.appspot.com", /* cite: 79 */
            messagingSenderId: "249427877153", /* cite: 79 */
            appId: "1:249427877153:web:0e4297294794a5aadeb260", /* cite: 79 */
            measurementId: "G-PLKNZNFCQ8" /* cite: 79 */
        };

// Inicializar o Firebase
firebase.initializeApp(firebaseConfig);

// Obter referências para os serviços do Firebase
const auth = firebase.auth();
const db = firebase.firestore();
const functions = firebase.functions(); // Para chamar Cloud Functions

// Obter referências para elementos HTML
const googleLoginBtn = document.getElementById('google-login-btn');
const feedbackMessage = document.getElementById('feedback-message');
const profileSetupSection = document.getElementById('profile-setup-section');
const profileForm = document.getElementById('profile-form');
const usernameInput = document.getElementById('username');
const bioTextarea = document.getElementById('bio');

// Função para exibir mensagens
function showMessage(message, type = 'info') {
    feedbackMessage.textContent = message;
    feedbackMessage.className = `message ${type}`; // Adiciona classes para estilização (success, error, info)
}

// Listener para o botão de Login com Google
googleLoginBtn.addEventListener('click', async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    showMessage('Redirecionando para o login do Google...', 'info');

    try {
        const result = await auth.signInWithPopup(provider); // Ou signInWithRedirect para mobile
        const user = result.user; // O objeto user do Firebase

        showMessage('Login bem-sucedido! Verificando seu cadastro...', 'info');
        console.log("Usuário logado:", user);

        // ------------------------------------------------------------------
        // PASSO CRÍTICO: Chamar a Cloud Function para verificar o cliente
        // e criar/carregar o perfil na rede social.
        // Isso DEVE ser feito via Cloud Function para segurança e lógica de negócio.
        // ------------------------------------------------------------------

        // Crie uma Cloud Function chamada 'checkAndRegisterUser'
        const checkAndRegisterUser = functions.httpsCallable('checkAndRegisterUser');

        const response = await checkAndRegisterUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
        });

        console.log("Resposta da Cloud Function:", response.data);

        if (response.data.success) {
            if (response.data.newUser) {
                showMessage('Bem-vindo à rede social! Seu perfil foi criado.', 'success');
                // Opcional: Redirecionar ou mostrar formulário para completar o perfil se necessário
                // Por exemplo, profileSetupSection.style.display = 'block';
                // Ou redirecionar para uma página de "Completar Perfil"
                window.location.href = 'dashboard.html'; // Exemplo: redirecionar para a página principal
            } else {
                showMessage('Bem-vindo de volta!', 'success');
                // Redirecionar para a página principal
                window.location.href = 'dashboard.html'; // Exemplo: redirecionar para a página principal
            }
        } else {
            showMessage(`Erro: ${response.data.message}`, 'error');
            // Opcional: Deslogar o usuário se ele não for autorizado
            await auth.signOut();
        }

    } catch (error) {
        console.error("Erro durante o login ou verificação:", error);
        if (error.code === 'auth/popup-closed-by-user') {
            showMessage('Login cancelado. Por favor, tente novamente.', 'info');
        } else if (error.code === 'auth/cancelled-popup-request') {
            showMessage('Login cancelado ou pop-up bloqueado. Por favor, tente novamente.', 'info');
        } else if (error.code === 'functions/unavailable') {
             showMessage('Serviço de verificação indisponível. Tente novamente mais tarde.', 'error');
        }
        else {
            showMessage(`Erro de autenticação: ${error.message}`, 'error');
        }
    }
});

// Lógica para completar o perfil (se for uma etapa separada)
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
        showMessage('Nenhum usuário logado para salvar o perfil.', 'error');
        return;
    }

    const username = usernameInput.value.trim();
    const bio = bioTextarea.value.trim();

    if (!username) {
        showMessage('Por favor, insira um nome de usuário.', 'error');
        return;
    }

    try {
        // Atualiza o documento do usuário no Firestore
        await db.collection('social').doc('users').collection(user.uid).set({
            username: username,
            bio: bio,
            email: user.email,
            avatarUrl: user.photoURL || '', // Usa a foto do Google ou vazia
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }); // Use merge para não sobrescrever campos existentes

        showMessage('Perfil atualizado com sucesso!', 'success');
        profileSetupSection.style.display = 'none'; // Esconde a seção
        window.location.href = 'dashboard.html'; // Redireciona para a página principal
    } catch (error) {
        console.error("Erro ao salvar perfil:", error);
        showMessage(`Erro ao salvar perfil: ${error.message}`, 'error');
    }
});

// Listener para verificar o estado da autenticação ao carregar a página
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Usuário já está logado
        showMessage('Você já está logado. Redirecionando...', 'info');
        console.log("Usuário já logado:", user);
        // Poderíamos chamar a Cloud Function aqui também para revalidar/atualizar
        // ou simplesmente redirecionar para a página principal da rede social.
        try {
            const checkAndRegisterUser = functions.httpsCallable('checkAndRegisterUser');
            const response = await checkAndRegisterUser({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL
            });

            if (response.data.success) {
                window.location.href = 'dashboard.html';
            } else {
                showMessage(`Erro ao verificar: ${response.data.message}. Por favor, faça login novamente.`, 'error');
                await auth.signOut(); // Desloga se a verificação falhar
            }
        } catch (error) {
             console.error("Erro ao verificar status de login:", error);
             showMessage(`Erro ao verificar status de login: ${error.message}`, 'error');
             await auth.signOut();
        }

    } else {
        // Usuário não logado, exibe o botão de login
        console.log("Nenhum usuário logado.");
        googleLoginBtn.style.display = 'block';
        profileSetupSection.style.display = 'none';
    }
});
