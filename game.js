// --- ISI FILE: game.js ---

let gameBoard = ["", "", "", "", "", "", "", "", ""];
let gameActive = false;
let currentPlayer = "X"; 
let playerScore = 0;
let aiScore = 0;
let currentStreak = 0;

const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

function openGameModal() {
    document.getElementById('tictactoeModal').classList.add('active');
    // Memanggil fungsi dari file leaderboard.js
    if (typeof LeaderboardSystem !== 'undefined') {
        LeaderboardSystem.render('device-name-display', 'lb-content');
    }
    resetGame(true); 
}

function closeGameModal() {
    document.getElementById('tictactoeModal').classList.remove('active');
}

function resetGame(fullReset = false) {
    gameBoard = ["", "", "", "", "", "", "", "", ""];
    gameActive = true;
    currentPlayer = "X";
    const overlay = document.getElementById('resultOverlay');
    if(overlay) overlay.classList.remove('show');
    
    if (fullReset) {
        playerScore = 0;
        aiScore = 0;
        currentStreak = 0;
        updateScoreDisplay();
    }
    renderBoard();
}

function updateScoreDisplay() {
    document.getElementById('score-player').innerText = playerScore;
    document.getElementById('score-ai').innerText = aiScore;
}

function renderBoard() {
    const cells = document.querySelectorAll('#gameBoard .cell');
    cells.forEach((cell, index) => {
        cell.innerText = gameBoard[index];
        cell.className = "cell " + (gameBoard[index] === "X" ? "x" : gameBoard[index] === "O" ? "o" : "");
    });
}

function handleCellClick(index) {
    if (gameBoard[index] !== "" || !gameActive || currentPlayer !== "X") return;

    gameBoard[index] = "X";
    renderBoard();
    
    if (!checkResult()) {
        currentPlayer = "O";
        setTimeout(makeAiMove, Math.random() * 500 + 500); 
    }
}

function makeAiMove() {
    if (!gameActive) return;

    let available = [];
    gameBoard.forEach((val, idx) => { if (val === "") available.push(idx); });

    if (available.length > 0) {
        const randomMove = available[Math.floor(Math.random() * available.length)];
        gameBoard[randomMove] = "O";
        renderBoard();
        if (!checkResult()) {
            currentPlayer = "X";
        }
    }
}

function checkResult() {
    let roundWon = false;
    let winner = "";

    for (let i = 0; i <= 7; i++) {
        const winCondition = winningConditions[i];
        let a = gameBoard[winCondition[0]];
        let b = gameBoard[winCondition[1]];
        let c = gameBoard[winCondition[2]];
        if (a === '' || b === '' || c === '') continue;
        if (a === b && b === c) {
            roundWon = true;
            winner = a;
            break;
        }
    }

    if (roundWon) {
        gameActive = false;
        showResultPopup(winner);
        return true;
    }

    if (!gameBoard.includes("")) {
        gameActive = false;
        showResultPopup("draw");
        return true;
    }

    return false;
}

function showResultPopup(winner) {
    const overlay = document.getElementById('resultOverlay');
    const msg = document.getElementById('resultMessage');

    if (winner === "X") {
        msg.innerHTML = "Yey Kamu Menang! 🎉";
        msg.style.color = "#2ecc71";
        playerScore++;
        currentStreak++;
        
        // Memanggil fungsi simpan skor dari file leaderboard.js
        if (typeof LeaderboardSystem !== 'undefined') {
            const isNewRecord = LeaderboardSystem.saveScore(currentStreak);
            if (isNewRecord) {
                // Pastikan fungsi showNotification ada di script utama kamu
                if(typeof showNotification === 'function') {
                    showNotification(`Rekor Baru! ${currentStreak}x Menang Beruntun!`, "party");
                }
            }
            LeaderboardSystem.render('device-name-display', 'lb-content'); 
        }

    } else if (winner === "O") {
        msg.innerHTML = "Yah Kamu Kalah... 🤖";
        msg.style.color = "#e74c3c";
        aiScore++;
        currentStreak = 0; 
    } else {
        msg.innerHTML = "Seri Nih! 😐";
        msg.style.color = "#f1c40f";
    }

    updateScoreDisplay();
    if(overlay) overlay.classList.add('show');
}