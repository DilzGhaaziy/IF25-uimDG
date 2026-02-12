// File: api/update-dob.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { nim, newDOB, repoOwner, repoName } = req.body;
  
  const token = process.env.GITHUB_TOKEN; 
  const path = 'students.json'; // TARGET DIUBAH KE JSON (BUKAN HTML LAGI)

  if (!token) {
    return res.status(500).json({ message: 'Server Error: GITHUB_TOKEN is missing.' });
  }

  try {
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`;
    
    // 1. Ambil file students.json dari GitHub
    const getResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!getResponse.ok) {
      throw new Error(`Gagal mengambil data dari GitHub: ${getResponse.statusText}`);
    }

    const data = await getResponse.json();
    
    // 2. Decode Base64 ke UTF-8 dan ubah string jadi Object JSON
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    let studentsData = JSON.parse(content);

    // 3. Cari dan update Tanggal Lahir (dob) berdasarkan NIM
    let studentFound = false;
    const classes = ['IF1', 'IF2']; // Cek di kedua kelas
    
    for (const className of classes) {
      if (studentsData[className]) {
        const studentIndex = studentsData[className].findIndex(s => s.nim === nim);
        if (studentIndex !== -1) {
          // UPDATE DATA DOB DI SINI
          studentsData[className][studentIndex].dob = newDOB;
          studentFound = true;
          break;
        }
      }
    }

    if (!studentFound) {
      return res.status(404).json({ message: 'NIM tidak ditemukan dalam data students.json' });
    }

    // 4. Ubah kembali Object JSON menjadi String yang rapi
    const newContent = JSON.stringify(studentsData, null, 2);

    // 5. Simpan (PUT) kembali ke GitHub
    const putResponse = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Update DOB for NIM ${nim} via Web`, 
        content: Buffer.from(newContent).toString('base64'),
        sha: data.sha, 
      }),
    });

    if (!putResponse.ok) {
      const errData = await putResponse.json();
      throw new Error(`Gagal menyimpan ke GitHub: ${errData.message}`);
    }

    return res.status(200).json({ message: 'Tanggal Lahir Berhasil diupdate!', newDOB });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
}
