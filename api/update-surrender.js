// File: api/update-surrender.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { repoOwner, repoName } = req.body;
  const token = process.env.GITHUB_TOKEN; 
  const path = 'stats.json'; // Database statistik

  if (!token) {
    return res.status(500).json({ message: 'Server Error: GITHUB_TOKEN is missing.' });
  }

  try {
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`;
    
    // 1. Ambil data stats.json saat ini
    const getResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!getResponse.ok) {
      throw new Error(`Gagal mengambil stats.json: ${getResponse.statusText}`);
    }

    const data = await getResponse.json();
    
    // 2. Decode dan Parse JSON
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    let statsData = JSON.parse(content);

    // 3. Tambah Counter +1
    // Jika belum ada angka, mulai dari 0
    let currentCount = statsData.stego_surrender_count || 0;
    statsData.stego_surrender_count = currentCount + 1;

    // 4. Encode kembali ke Base64
    const newContent = JSON.stringify(statsData, null, 2);

    // 5. Simpan (PUT) ke GitHub
    const putResponse = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Satu orang menyerah! Total: ${statsData.stego_surrender_count}`, 
        content: Buffer.from(newContent).toString('base64'),
        sha: data.sha, 
      }),
    });

    if (!putResponse.ok) {
      throw new Error('Gagal menyimpan update ke GitHub.');
    }

    // Kembalikan jumlah terbaru ke frontend agar bisa langsung diupdate di layar
    return res.status(200).json({ 
        message: 'Berhasil!', 
        newCount: statsData.stego_surrender_count 
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
}
