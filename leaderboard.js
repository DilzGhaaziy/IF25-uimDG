const LeaderboardSystem = {
    // GANTI USERNAME DAN REPO DI SINI
    jsonUrl: 'https://raw.githubusercontent.com/DilzGhaaziy/IF25-uimDG/main/leaderboard.json',
    
    playerName: 'Unknown Player',
    playerDevice: 'Unknown Device',
    currentData: [], 

    init: function() {
        // Deteksi Device
        const ua = navigator.userAgent;
        if (/Android/i.test(ua)) this.playerDevice = "Android";
        else if (/iPhone|iPad|iPod/i.test(ua)) this.playerDevice = "iPhone";
        else if (/Windows/i.test(ua)) this.playerDevice = "PC";
        else this.playerDevice = "Web Browser";

        // Deteksi Nama
        const storedName = localStorage.getItem('player_name_tic_tac_toe');
        if (storedName) {
            this.playerName = storedName;
        } else {
            const pName = document.getElementById('p-name');
            this.playerName = pName && pName.innerText !== 'Nama' ? pName.innerText : `Player ${Math.floor(Math.random() * 1000)}`;
        }
        
        this.fetchLeaderboard();
    },

    fetchLeaderboard: async function() {
        try {
            const response = await fetch(this.jsonUrl + '?t=' + new Date().getTime());
            if (!response.ok) throw new Error("Gagal load leaderboard");
            this.currentData = await response.json();
            this.render('device-name-display', 'lb-content');
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
            this.currentData = [];
        }
    },

    saveScore: async function(currentStreak) {
        if (currentStreak <= 0) return false;

        // Cek apakah skor layak disimpan (Masuk Top 20 atau User Lama pecah rekor)
        // Kita kirim saja ke server biar server yang memfilter logika "Update or Ignore"
        // Tapi kita filter minimal biar ga spam request: Skor harus > 0
        
        // Cek Local Data dulu biar hemat request
        const myPrevRecord = this.currentData.find(p => p.name === this.playerName);
        if (myPrevRecord && currentStreak <= myPrevRecord.score) {
            // Kalau skor sekarang TIDAK lebih tinggi dari rekor lama, ga usah kirim ke server
            console.log("Skor belum memecahkan rekor pribadi, tidak dikirim.");
            return false;
        }

        console.log("New Personal High Score! Sending...");
        if(typeof showNotification === 'function') showNotification("Menyimpan Rekor Baru...", "info");

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
                this.currentData = result.data;
                this.render('device-name-display', 'lb-content');
                return true; 
            }
        } catch (error) {
            console.error("Error saving score:", error);
        }
        return false;
    },

    render: function(titleId, contentId) {
        const titleEl = document.getElementById(titleId);
        const contentEl = document.getElementById(contentId);

        if (titleEl) {
            titleEl.innerHTML = `<i class="fas fa-mobile-alt"></i> ${this.playerDevice} (Kamu: ${this.playerName})`;
        }

        if (contentEl) {
            // --- PERBAIKAN SCROLL DI SINI ---
            // Kita paksa style container agar bisa discroll
            contentEl.style.maxHeight = "180px"; // Batas tinggi box
            contentEl.style.overflowY = "auto";  // Aktifkan scroll vertikal
            contentEl.style.paddingRight = "5px"; // Jarak scrollbar

            if (!this.currentData || this.currentData.length === 0) {
                contentEl.innerHTML = `<div class="lb-item" style="justify-content:center;">Belum ada data...</div>`;
                return;
            }

            let html = '';
            this.currentData.forEach((player, index) => {
                const isMe = player.name === this.playerName;
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
                
                // Style khusus buat kita sendiri
                const bgStyle = isMe ? 'background: rgba(46, 204, 113, 0.2); border: 1px solid #2ecc71;' : '';
                const textStyle = isMe ? 'color: #ffd700; font-weight:bold;' : '';

                html += `
                <div class="lb-item" style="${bgStyle} ${textStyle} padding: 8px; border-radius: 8px; margin-bottom: 5px;">
                    <div style="display:flex; gap:10px; align-items:center;">
                        <span style="font-weight:bold; min-width:25px;">${medal}</span>
                        <div style="display:flex; flex-direction:column;">
                            <span>${player.name} ${isMe ? '(Kamu)' : ''}</span>
                            <span style="font-size:9px; opacity:0.7;">${player.device}</span>
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

document.addEventListener('DOMContentLoaded', () => {
    LeaderboardSystem.init();
});
