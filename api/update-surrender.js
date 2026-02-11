// File: api/update-surrender.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { repoOwner, repoName } = req.body;
  const token = process.env.GITHUB_TOKEN; 
  const path = 'stats.json'; 

  if (!token) return res.status(500).json({ message: 'Server Error: GITHUB_TOKEN missing.' });

  try {
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`;
    
    const getResponse = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
    });

    if (!getResponse.ok) throw new Error('Gagal mengambil stats.json dari GitHub');

    const data = await getResponse.json();
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    let statsData = JSON.parse(content);

    // Tambah jumlah surrender +1
    statsData.stego_surrender_count = (statsData.stego_surrender_count || 0) + 1;

    const newContent = JSON.stringify(statsData, null, 2);

    const putResponse = await fetch(url, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Satu orang menyerah di game Stego! Total: ${statsData.stego_surrender_count}`, 
        content: Buffer.from(newContent).toString('base64'),
        sha: data.sha, 
      }),
    });

    if (!putResponse.ok) throw new Error('Gagal menyimpan ke GitHub');

    return res.status(200).json({ 
        message: 'Surrender count berhasil diupdate!', 
        newCount: statsData.stego_surrender_count 
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
