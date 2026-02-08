// File: api/update-dob.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { nim, newDOB, repoOwner, repoName } = req.body;
  
  // Pastikan Anda sudah setting GITHUB_TOKEN di Environment Variables Vercel
  const token = process.env.GITHUB_TOKEN; 
  const path = 'index.html'; // Nama file utama Anda

  if (!token) {
    return res.status(500).json({ message: 'Server Error: GITHUB_TOKEN is missing.' });
  }

  try {
    // 1. GET file content dari GitHub
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`;
    
    const getResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!getResponse.ok) {
      throw new Error(`Gagal mengambil file dari GitHub: ${getResponse.statusText}`);
    }

    const data = await getResponse.json();
    
    // Decode konten dari Base64 ke UTF-8
    const content = Buffer.from(data.content, 'base64').toString('utf-8');

    // 2. Regex untuk mencari dan mengganti Tanggal Lahir berdasarkan NIM
    // Pola ini mencari: nim: "X", ... dob: "Y" (mengabaikan spasi/baris baru diantaranya)
    // Penjelasan Regex:
    // (nim:\s*["']${nim}["'][\s\S]*?dob:\s*["']) -> Group 1: Cari NIM sampai ketemu awal 'dob:'
    // ([^"']*) -> Group 2: Isi Tanggal Lahir lama (yang akan diganti)
    // (["'])   -> Group 3: Tanda kutip penutup
    
    const regex = new RegExp(`(nim:\\s*["']${nim}["'][\\s\\S]*?dob:\\s*["'])([^"']*)(["'])`);
    
    if (!regex.test(content)) {
      return res.status(404).json({ message: 'NIM tidak ditemukan dalam data script.' });
    }

    const newContent = content.replace(regex, `$1${newDOB}$3`);

    // 3. PUT (Update) file kembali ke GitHub
    const putResponse = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Update DOB for NIM ${nim} via Web`, // Pesan commit otomatis
        content: Buffer.from(newContent).toString('base64'), // Encode kembali ke Base64
        sha: data.sha, // SHA wajib disertakan untuk update file
      }),
    });

    if (!putResponse.ok) {
      const errData = await putResponse.json();
      throw new Error(`Gagal menyimpan ke GitHub: ${errData.message}`);
    }

    return res.status(200).json({ message: 'Berhasil diupdate!', newDOB });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
}
