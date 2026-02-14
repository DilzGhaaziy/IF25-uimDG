// --- KONFIGURASI GITHUB ISSUE SEBAGAI DATABASE ---
const GH_TOKEN = "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"; // Ganti dengan Token GitHub (Classic)
const GH_OWNER = "DilzGhaaziy"; // Username GitHub pemilik repo
const GH_REPO = "database-chat"; // Nama Repository (misal: database-chat)
const ISSUE_NUMBER = 1; // Nomor Issue yang dibuat (misal: 1)

// --- USER CONFIG ---
let myAnonID = localStorage.getItem('anonID');
if (!myAnonID) {
    // Generate ID acak jika belum punya (misal: Ghost-82)
    myAnonID = "Ghost-" + Math.floor(Math.random() * 100);
    localStorage.setItem('anonID', myAnonID);
}

let lastCommentId = 0;
let chatInterval = null;

// --- FUNGSI UI ---
function openChatModal() {
    document.getElementById('chatModal').classList.add('active');
    loadMessages();
    // Auto refresh setiap 3 detik (Polling)
    chatInterval = setInterval(loadMessages, 3000); 
}

function closeChatModal() {
    document.getElementById('chatModal').classList.remove('active');
    clearInterval(chatInterval);
}

// --- FUNGSI API GITHUB ---

// 1. Ambil Pesan (GET Comments)
async function loadMessages() {
    const container = document.getElementById('chatContainer');
    
    try {
        const response = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/issues/${ISSUE_NUMBER}/comments?per_page=100`, {
            headers: {
                'Authorization': `token ${GH_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            },
            cache: "no-store"
        });

        if (!response.ok) throw new Error("Gagal koneksi ke GitHub");

        const comments = await response.json();

        // Cek apakah ada pesan baru (biar gak render ulang terus bikin berat)
        if (comments.length > 0) {
            const newestId = comments[comments.length - 1].id;
            if (newestId === lastCommentId) return; // Tidak ada update
            lastCommentId = newestId;
        }

        container.innerHTML = ""; // Reset tampilan

        comments.forEach(comment => {
            try {
                // Parsing body komentar karena kita simpan dalam format JSON string
                const data = JSON.parse(comment.body);
                
                // Validasi data (hanya tampilkan jika format benar)
                if(data.user && data.text) {
                    renderBubble(data.user, data.text, data.time);
                }
            } catch (e) {
                // Abaikan komentar yang bukan JSON (misal komentar manual di GitHub)
            }
        });
        
        // Auto scroll ke bawah
        container.scrollTop = container.scrollHeight;

    } catch (error) {
        console.error("Error chat:", error);
    }
}

// 2. Kirim Pesan (POST Comment)
async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const btn = document.getElementById('sendBtn');
    const text = input.value.trim();

    if (!text) return;

    // UI Loading
    input.disabled = true;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    const payload = {
        user: myAnonID,
        text: text,
        time: new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})
    };

    try {
        const response = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/issues/${ISSUE_NUMBER}/comments`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${GH_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ body: JSON.stringify(payload) }) // Double stringify agar body jadi JSON murni
        });

        if (response.ok) {
            input.value = "";
            loadMessages(); // Refresh langsung
        } else {
            alert("Gagal kirim. Rate limit GitHub mungkin habis.");
        }
    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        input.disabled = false;
        input.focus();
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i>';
    }
}

// 3. Render Bubble Chat
function renderBubble(user, text, time) {
    const container = document.getElementById('chatContainer');
    const isMe = user === myAnonID;
    
    const div = document.createElement('div');
    div.className = `chat-bubble ${isMe ? 'me' : 'other'}`;
    
    // Mencegah XSS sederhana
    const safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    div.innerHTML = `
        <span class="chat-meta">${isMe ? 'Kamu' : user}</span>
        ${safeText}
        <span class="chat-time">${time}</span>
    `;
    
    container.appendChild(div);
}

// Enter untuk kirim
document.getElementById('chatInput').addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        sendChatMessage();
    }
});