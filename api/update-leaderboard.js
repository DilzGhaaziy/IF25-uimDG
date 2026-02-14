export default async function handler(req, res) {
  // Hanya izinkan method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { name, score, device, repoOwner, repoName } = req.body;
  const token = process.env.GITHUB_TOKEN; 
  const path = 'leaderboard.json'; 

  if (!token) {
    return res.status(500).json({ message: 'Server Error: GITHUB_TOKEN is missing.' });
  }

  try {
    // 1. Ambil data leaderboard saat ini dari GitHub
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`;
    const getResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!getResponse.ok) {
      throw new Error('Gagal mengambil leaderboard.json');
    }

    const data = await getResponse.json();
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    let leaderboard = JSON.parse(content);

    // 2. Tambahkan Skor Baru ke Array
    const newEntry = {
      name: name || "Anonymous",
      score: parseInt(score),
      device: device || "Unknown Device",
      date: new Date().toISOString().split('T')[0] // Format YYYY-MM-DD
    };

    leaderboard.push(newEntry);

    // 3. Sorting (Urutkan dari Skor Tertinggi ke Terendah)
    leaderboard.sort((a, b) => b.score - a.score);

    // 4. Batasi hanya Top 10 Juara (Supaya file tidak berat)
    const top10 = leaderboard.slice(0, 10);

    // 5. Simpan kembali ke GitHub
    const newContent = JSON.stringify(top10, null, 2);
    
    const putResponse = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `New High Score: ${newEntry.name} (${newEntry.score})`, 
        content: Buffer.from(newContent).toString('base64'),
        sha: data.sha, 
      }),
    });

    if (!putResponse.ok) {
      throw new Error('Gagal menyimpan update ke GitHub.');
    }

    // Kembalikan data terbaru ke frontend agar langsung update tanpa refresh
    return res.status(200).json({ 
        message: 'Leaderboard Updated!', 
        data: top10 
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
}