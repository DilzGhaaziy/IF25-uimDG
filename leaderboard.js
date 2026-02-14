const LeaderboardSystem = {
    // URL File JSON mentah (Raw) agar bisa dibaca langsung
    // GANTI 'DilzGhaaziy' dan 'IF25-uimDG' dengan username & repo kamu jika berbeda
    jsonUrl: 'https://raw.githubusercontent.com/DilzGhaaziy/IF25-uimDG/main/leaderboard.json',
    
    playerName: 'Unknown Player',
    playerDevice: 'Unknown Device',
    currentData: [], // Menyimpan data leaderboard sementara

    // 1. Inisialisasi: Deteksi Device & Load Data
    init: function() {
        // Deteksi User Agent untuk nama Device
        const ua = navigator.userAgent;
        if (/Android/i.test(ua)) this.playerDevice = "Android";
        else if (/iPhone|iPad|iPod/i.test(ua)) this.playerDevice = "iPhone";
        else if (/Windows/i.test(ua)) this.playerDevice = "PC Windows";
        else if (/Mac/i.test(ua)) this.playerDevice = "Mac";
        else if (/Linux/i.test(ua)) this.playerDevice = "Linux";
        else this.playerDevice = "Web Browser";

        // Coba ambil nama dari localStorage jika user pernah main sebelumnya
        const storedName = localStorage.getItem('player_name_tic_tac_toe');
        if (storedName) {
            this.playerName = storedName;
        } else {
            // Jika belum ada nama, pakai default (nanti bisa dibuat input nama)
            // Di sini kita ambil nama dari profil jika ada (opsional), atau default
            const pName = document.getElementById('p-name');
            this.playerName = pName && pName.innerText !== 'Nama' ? pName.innerText : `Player ${Math.floor(Math.random() * 1000)}`;
        }

        console.log(`Leaderboard Init: ${this.playerName} on ${this.playerDevice}`);
        
        // Load data pertama kali
        this.fetchLeaderboard();
    },

    // 2. Ambil Data dari Server (GitHub Raw)
    fetchLeaderboard: async function() {
        try {
            // Tambah timestamp agar tidak dicache browser (?t=...)
            const response = await fetch(this.jsonUrl + '?t=' + new Date().getTime());
            if (!response.ok) throw new Error("Gagal load leaderboard");
            this.currentData = await response.json();
            
            // Render ulang tampilan jika modal sedang terbuka
            this.render('device-name-display', 'lb-content');
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
            // Jika gagal, pakai data kosong atau dummy
            this.currentData = [];
        }
    },

    // 3. Cek & Simpan Score Baru ke Server
    saveScore: async function(currentStreak) {
        if (currentStreak <= 0) return false;

        // Cek apakah skor masuk Top 10?
        // Jika data masih kosong (<10), pasti masuk.
        // Jika sudah penuh 10, skor harus lebih besar dari peringkat ke-10.
        let isWorthy = false;
        
        if (this.currentData.length < 10) {
            isWorthy = true;
        } else {
            const lowestScore = this.currentData[this.currentData.length - 1].score;
            if (currentStreak > lowestScore) {
                isWorthy = true;
            }
        }

        if (isWorthy) {
            console.log("New High Score! Sending to server...");
            
            // Tampilkan notifikasi loading (jika ada fungsi showNotification)
            if(typeof showNotification === 'function') {
                showNotification("Mencetak Rekor Global... Mohon Tunggu", "info");
            }

            try {
                const response = await fetch('/api/update-leaderboard', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: this.playerName,
                        score: currentStreak,
                        device: this.playerDevice,
                        repoOwner: "DilzGhaaziy", // GANTI SESUAI REPO KAMU
                        repoName: "IF25-uimDG"    // GANTI SESUAI REPO KAMU
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    // Update data lokal dengan data terbaru dari server
                    this.currentData = result.data;
                    this.render('device-name-display', 'lb-content');
                    return true; // Berhasil update
                } else {
                    console.error("Gagal update leaderboard:", result.message);
                    return false;
                }

            } catch (error) {
                console.error("Error saving score:", error);
                return false;
            }
        }
        return false; // Tidak masuk top score
    },

    // 4. Tampilkan Leaderboard ke HTML
    render: function(titleId, contentId) {
        const titleEl = document.getElementById(titleId);
        const contentEl = document.getElementById(contentId);

        if (titleEl) {
            titleEl.innerHTML = `<i class="fas fa-mobile-alt"></i> ${this.playerDevice}`;
        }

        if (contentEl) {
            if (this.currentData.length === 0) {
                contentEl.innerHTML = `<div class="lb-item" style="justify-content:center;">Belum ada data...</div>`;
                return;
            }

            let html = '';
            this.currentData.forEach((player, index) => {
                // Highlight jika itu adalah user saat ini (berdasarkan nama)
                const isMe = player.name === this.playerName;
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
                const highlightClass = isMe ? 'highlight' : '';
                const styleColor = isMe ? 'color: #ffd700;' : '';

                html += `
                <div class="lb-item ${highlightClass}" style="${styleColor}">
                    <div style="display:flex; gap:10px; align-items:center;">
                        <span style="font-weight:bold; min-width:25px;">${medal}</span>
                        <div style="display:flex; flex-direction:column;">
                            <span>${player.name}</span>
                            <span style="font-size:9px; opacity:0.6;">${player.device} &bull; ${player.date || '-'}</span>
                        </div>
                    </div>
                    <span style="font-weight:bold; font-size:14px;">${player.score} Win</span>
                </div>
                `;
            });
            contentEl.innerHTML = html;
        }
    }
};

// Jalankan inisialisasi
document.addEventListener('DOMContentLoaded', () => {
    LeaderboardSystem.init();
});
