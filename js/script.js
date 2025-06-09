// js/script.js

document.addEventListener('DOMContentLoaded', () => {
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const googleSignOutBtn = document.getElementById('googleSignOutBtn');
    const userNameSpan = document.getElementById('userName');

    // Listener para o estado da autenticação
    auth.onAuthStateChanged(user => {
        if (user) {
            // Usuário logado
            userNameSpan.textContent = user.displayName || user.email;
            googleSignInBtn.style.display = 'none';
            googleSignOutBtn.style.display = 'inline-block';

            // Puxar cadastro pela UID no Firebase (exemplo de como faria)
            // No Firestore, você poderia ter uma coleção 'users' onde cada documento tem o UID como ID
            db.collection("users").doc(user.uid).get().then((doc) => {
                if (doc.exists) {
                    console.log("Dados do usuário no Firestore:", doc.data());
                    // Aqui você pode usar os dados do usuário puxados do Firestore
                } else {
                    console.log("Nenhum documento de usuário encontrado para este UID no Firestore!");
                    // Opcional: Criar um novo documento de usuário no Firestore se não existir
                    db.collection("users").doc(user.uid).set({
                        uid: user.uid,
                        displayName: user.displayName,
                        email: user.email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    }).then(() => {
                        console.log("Novo documento de usuário criado no Firestore.");
                    }).catch((error) => {
                        console.error("Erro ao criar documento de usuário:", error);
                    });
                }
            }).catch((error) => {
                console.error("Erro ao obter documento de usuário:", error);
            });

        } else {
            // Usuário deslogado
            userNameSpan.textContent = 'Visitante';
            googleSignInBtn.style.display = 'inline-block';
            googleSignOutBtn.style.display = 'none';
        }
    });

    // Função de Login com Google
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider)
                .then((result) => {
                    // O usuário logou com sucesso.
                    const user = result.user;
                    console.log("Usuário logado:", user);
                    // O onAuthStateChanged cuidará da atualização da UI
                })
                .catch((error) => {
                    // Lidar com erros de login
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    console.error("Erro de login com Google:", errorCode, errorMessage);
                });
        });
    }

    // Função de Logout
    if (googleSignOutBtn) {
        googleSignOutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                console.log("Usuário deslogado.");
                // O onAuthStateChanged cuidará da atualização da UI
            }).catch((error) => {
                console.error("Erro ao fazer logout:", error);
            });
        });
    }

    // Lógica para a "Página Aleatória" - Apenas se este script for carregado em random_page.html
    // Note: Em um cenário real, você teria que garantir que o script certo é carregado ou usar uma estrutura mais modular.
    // Para este exemplo, estou assumindo que este script será carregado no menu.html (que está no iframe),
    // e o redirecionamento será tratado pelo script dentro de random_page.html.
    // Se você quiser que o clique no link "Página Aleatória" no menu já redirecione, você precisaria
    // que o script em menu.html soubesse sobre suas páginas.
});
