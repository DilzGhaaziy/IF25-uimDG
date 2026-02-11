// File: api/update-ipk.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { nim, semester, newIpk, repoOwner, repoName } = req.body;
  const token = process.env.GITHUB_TOKEN; 
  const path = 'students.json'; 

  if (!token) return res.status(500).json({ message: 'Server Error: GITHUB_TOKEN missing.' });

  try {
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`;
    const getResponse = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' },
    });

    if (!getResponse.ok) throw new Error('Gagal mengambil students.json dari GitHub');

    const data = await getResponse.json();
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    let studentsData = JSON.parse(content);

    let studentFound = false;
    const classes = ['IF1', 'IF2']; 
    
    for (const className of classes) {
      if (studentsData[className]) {
        const studentIndex = studentsData[className].findIndex(s => s.nim === nim);
        if (studentIndex !== -1) {
          // Menyimpan IPK dengan format ipk1, ipk2, dst
          studentsData[className][studentIndex][`ipk${semester}`] = newIpk;
          studentFound = true;
          break;
        }
      }
    }

    if (!studentFound) return res.status(404).json({ message: 'NIM tidak ditemukan.' });

    const newContent = JSON.stringify(studentsData, null, 2);

    const putResponse = await fetch(url, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Update IPK Sem ${semester} for NIM ${nim}`, 
        content: Buffer.from(newContent).toString('base64'),
        sha: data.sha, 
      }),
    });

    if (!putResponse.ok) throw new Error('Gagal menyimpan ke GitHub');

    return res.status(200).json({ message: 'IPK Berhasil diupdate!', semester, newIpk });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
