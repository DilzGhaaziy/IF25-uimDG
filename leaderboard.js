// --- ISI FILE: leaderboard.js ---

const LeaderboardSystem = {
    storageKey: 'ttt_highscore', // Kunci penyimpanan di memori HP
    playerName: 'Unknown Player',

    // 1. Inisialisasi: Deteksi Nama HP saat web dibuka
    init: function() {
        const ua = navigator.userAgent;
        if (/Android/i.test(ua)) this.playerName = "Android Player";
        else if (/iPhone|iPad|iPod/i.test(ua)) this.playerName = "iPhone Player";
        else if (/Windows/i.test(ua)) this.playerName = "PC Player";
        else if (/Mac/i.test(ua)) this.playerName = "Mac Player";
        else this.playerName = "Guest Player";
        
        console.log("Device Terdeteksi:", this.playerName);
    },

    // 2. Ambil High Score dari Memori
    getHighScore: function() {
        return parseInt(localStorage.getItem(this.storageKey)) || 0;
    },

    // 3. Simpan Score Baru (Hanya jika lebih tinggi)
    saveScore: function(currentStreak) {
        const best = this.getHighScore();
        if (currentStreak > best) {
            localStorage.setItem(this.storageKey, currentStreak);
            return true; // Mengembalikan true jika pecah rekor
        }
        return false;
    },

    // 4. Update Tampilan HTML Leaderboard
    render: function(titleId, contentId) {
        const titleEl = document.getElementById(titleId);
        const contentEl = document.getElementById(contentId);
        const bestScore = this.getHighScore();

        if (titleEl) titleEl.innerText = this.playerName;

        if (contentEl) {
            contentEl.innerHTML = `
                <div class="lb-item highlight">
                    <span>1. ${this.playerName} (Kamu)</span>
                    <span>${bestScore} Win Streak 🔥</span>
                </div>
                <div class="lb-item">
                    <span>2. Sepuh TicTacToe</span>
                    <span>99 Win Streak</span>
                </div>
                <div class="lb-item">
                    <span>3. Bot Gabut</span>
                    <span>10 Win Streak</span>
                </div>
            `;
        }
    }
};

// Jalankan deteksi otomatis
LeaderboardSystem.init();