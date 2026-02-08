// File: api/update-dob.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { nim, newDOB, repoOwner, repoName } = req.body;
  const token = process.env.GITHUB_TOKEN; 
  const path = 'index.html'; 

  if (!token) {
    return res.status(500).json({ message: 'Server Error: GITHUB_TOKEN is missing.' });
  }

  try {
    // 1. Ambil konten file index.html dari GitHub
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`;
    
    const getResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!getResponse.ok) {
      throw new Error(`Gagal mengambil file: ${getResponse.statusText}`);
    }

    const data = await getResponse.json();
    const content = Buffer.from(data.content, 'base64').toString('utf-8');

    // 2. Regex untuk update dob berdasarkan NIM
    // Mencari baris yang mengandung nim tertentu dan mengganti nilai dob setelahnya
    const regex = new RegExp(`(nim:\\s*["']${nim}["'][\\s\\S]*?dob:\\s*["'])([^"']*)(["'])`);
    
    if (!regex.test(content)) {
      return res.status(404).json({ message: 'NIM tidak ditemukan di database script.' });
    }

    const newContent = content.replace(regex, `$1${newDOB}$3`);

    // 3. Kirim kembali ke GitHub (Commit)
    const putResponse = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `User Update DOB for NIM ${nim}`,
        content: Buffer.from(newContent).toString('base64'),
        sha: data.sha, 
      }),
    });

    if (!putResponse.ok) {
      const errData = await putResponse.json();
      throw new Error(`GitHub Error: ${errData.message}`);
    }

    return res.status(200).json({ message: 'Sukses', newDOB });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
