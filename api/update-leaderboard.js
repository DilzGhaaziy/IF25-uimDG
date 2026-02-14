export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { name, score, device, repoOwner, repoName } = req.body;
  const token = process.env.GITHUB_TOKEN; 
  const path = 'leaderboard.json'; 

  if (!token) return res.status(500).json({ message: 'Server Error: GITHUB_TOKEN is missing.' });

  try {
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`;
    
    // 1. Ambil Data Lama
    const getResponse = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' }
    });

    if (!getResponse.ok) throw new Error('Gagal mengambil leaderboard.json');

    const data = await getResponse.json();
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    let leaderboard = JSON.parse(content);

    // --- LOGIKA BARU: CEK DUPLIKASI ---
    const existingPlayerIndex = leaderboard.findIndex(p => p.name === name);
    const newScore = parseInt(score);
    const todayDate = new Date().toISOString().split('T')[0];

    let dataChanged = false;

    if (existingPlayerIndex !== -1) {
        // KONDISI A: Pemain sudah ada
        if (newScore > leaderboard[existingPlayerIndex].score) {
            // Update HANYA jika skor baru lebih tinggi (High Score)
            leaderboard[existingPlayerIndex].score = newScore;
            leaderboard[existingPlayerIndex].device = device;
            leaderboard[existingPlayerIndex].date = todayDate;
            dataChanged = true;
        } 
        // Jika skor lebih rendah/sama, JANGAN lakukan apa-apa (biarkan skor lama tertulis)
    } else {
        // KONDISI B: Pemain belum ada -> Tambahkan baru
        leaderboard.push({
            name: name || "Anonymous",
            score: newScore,
            device: device || "Unknown Device",
            date: todayDate
        });
        dataChanged = true;
    }

    // 2. Sorting & Slicing
    leaderboard.sort((a, b) => b.score - a.score);
    
    // Kita ambil Top 50 dulu biar aman, nanti frontend yang tampilkan sedikit
    // atau tetap Top 10 sesuai preferensi
    const finalLeaderboard = leaderboard.slice(0, 20); 

    // 3. Simpan ke GitHub (Hanya jika ada perubahan data)
    if (dataChanged) {
        const newContent = JSON.stringify(finalLeaderboard, null, 2);
        
        await fetch(url, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Update Score: ${name}`, 
                content: Buffer.from(newContent).toString('base64'),
                sha: data.sha, 
            }),
        });
    }

    return res.status(200).json({ 
        message: 'Leaderboard Processed', 
        data: finalLeaderboard 
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
}
