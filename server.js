require('dotenv').config();

const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();
const port = 3000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET tidak didefinisikan di dalam file .env");
    process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Konfigurasi Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, 'public', 'uploads')),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Koneksi Database
const dbConfig = { host: 'localhost', user: 'root', password: '', database: 'logicin_db' };
const db = mysql.createPool(dbConfig);

// Middleware Otentikasi
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) return res.status(403).json({ message: 'Token tidak valid.' });
            req.user = user;
            next();
        });
    } else { 
        res.status(401).json({ message: 'Akses ditolak, token tidak ada.' });
    }
};

// ================== API ROUTES ==================

// --- AUTH ---
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) return res.status(401).json({ message: 'Username tidak ditemukan' });
        
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Password salah' });

        const token = jwt.sign({ username: user.username, id: user.id }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ token });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- PUBLIC ROUTES ---
app.get('/api/public/:resource', async (req, res) => {
    try {
        const { resource } = req.params;
        const resourceMap = {
            team: 'team_members',
            portfolio: 'portfolio_projects',
            services: 'services',
            faq: 'faqs'
        };
        const tableName = resourceMap[resource];
        if (!tableName) return res.status(404).json({ message: 'Not Found' });
        const [rows] = await db.query(`SELECT * FROM ${tableName}`);
        res.json(rows);
    } catch (err) { res.status(500).json({ message: 'Gagal memuat data.' }); }
});

app.get('/api/public/team/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM team_members WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.json(null);
        }
        const teamMember = rows[0];

        const [projectRows] = await db.query(
            `SELECT p.* FROM portfolio_projects p
             JOIN project_assignments pa ON p.id = pa.project_id
             WHERE pa.team_member_id = ?`,
            [req.params.id]
        );

        teamMember.projects = projectRows;
        
        res.json(teamMember);
    } catch (err) { 
        console.error(err);
        res.status(500).json({ message: 'Gagal memuat detail tim.' }); 
    }
});

app.get('/api/public/portfolio/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM portfolio_projects WHERE id = ?', [req.params.id]);
        res.json(rows[0] || null);
    } catch (err) { res.status(500).json({ message: 'Gagal memuat detail proyek.' }); }
});

app.post('/api/public/contact', async (req, res) => {
    try {
        await db.query('INSERT INTO contacts SET ?', req.body);
        res.status(201).json({ message: 'Pesan berhasil dikirim!' });
    } catch (err) { res.status(500).json({ message: 'Gagal mengirim pesan.' }); }
});

// --- PROTECTED ROUTES (Admin) ---
const createCrudRoutes = (routeName, tableName) => {
    const router = express.Router();
    router.use(authenticateJWT);

    router.get('/', async (req, res) => {
        try {
            const [rows] = await db.query(`SELECT * FROM ${tableName}`);
            res.json(rows);
        } catch (err) { res.status(500).json({ message: err.message }); }
    });
    router.post('/', async (req, res) => {
        try {
            const [result] = await db.query(`INSERT INTO ${tableName} SET ?`, req.body);
            res.status(201).json(result);
        } catch (err) { res.status(500).json({ message: err.message }); }
    });
    router.put('/:id', async (req, res) => {
        try {
            const [result] = await db.query(`UPDATE ${tableName} SET ? WHERE id = ?`, [req.body, req.params.id]);
            res.json(result);
        } catch (err) { res.status(500).json({ message: err.message }); }
    });
    router.delete('/:id', async (req, res) => {
        try {
            const [result] = await db.query(`DELETE FROM ${tableName} WHERE id = ?`, [req.params.id]);
            res.json(result);
        } catch (err) { res.status(500).json({ message: err.message }); }
    });
    app.use(`/api/admin/${routeName}`, router);
};

const resourceMappings = {
    portfolio: 'portfolio_projects',
    services: 'services',
    faq: 'faqs',
    contacts: 'contacts'
};
for (const routeName in resourceMappings) {
    createCrudRoutes(routeName, resourceMappings[routeName]);
}

const adminTeamRouter = express.Router();
adminTeamRouter.use(authenticateJWT);

adminTeamRouter.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT * FROM team_members`);
        res.json(rows);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

adminTeamRouter.post('/', async (req, res) => {
    const { project_ids, ...teamData } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.query('INSERT INTO team_members SET ?', [teamData]);
        const teamMemberId = result.insertId;

        if (project_ids && Array.isArray(project_ids) && project_ids.length > 0) {
            const assignments = project_ids.map(projectId => [teamMemberId, projectId]);
            await connection.query('INSERT INTO project_assignments (team_member_id, project_id) VALUES ?', [assignments]);
        }
        await connection.commit();
        res.status(201).json({ id: teamMemberId, message: 'Anggota tim berhasil ditambahkan.' });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ message: err.message });
    } finally {
        connection.release();
    }
});

adminTeamRouter.put('/:id', async (req, res) => {
    const teamMemberId = req.params.id;
    const { project_ids, ...teamData } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('UPDATE team_members SET ? WHERE id = ?', [teamData, teamMemberId]);
        await connection.query('DELETE FROM project_assignments WHERE team_member_id = ?', [teamMemberId]);

        if (project_ids && Array.isArray(project_ids) && project_ids.length > 0) {
            const assignments = project_ids.map(projectId => [teamMemberId, projectId]);
            await connection.query('INSERT INTO project_assignments (team_member_id, project_id) VALUES ?', [assignments]);
        }
        await connection.commit();
        res.json({ message: 'Anggota tim berhasil diperbarui.' });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ message: err.message });
    } finally {
        connection.release();
    }
});

adminTeamRouter.delete('/:id', async (req, res) => {
    const teamMemberId = req.params.id;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('DELETE FROM project_assignments WHERE team_member_id = ?', [teamMemberId]);
        const [result] = await connection.query(`DELETE FROM team_members WHERE id = ?`, [teamMemberId]);
        await connection.commit();
        res.json(result);
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ message: err.message });
    } finally {
        connection.release();
    }
});
app.use('/api/admin/team', adminTeamRouter);

app.post('/api/admin/upload', authenticateJWT, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Tidak ada file yang diunggah.' });
    res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

// --- PAGE SERVING ---
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/team/:id', (req, res) => res.sendFile(path.join(__dirname, 'public', 'team-detail.html')));
app.get('/portfolio/:id', (req, res) => res.sendFile(path.join(__dirname, 'public', 'portfolio-detail.html')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});