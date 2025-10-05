-- Cek jika database belum ada, lalu buat
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'logicin_db')
BEGIN
    CREATE DATABASE logicin_db;
END;
GO

-- Gunakan database tersebut
USE logicin_db;
GO

-- Hapus tabel jika sudah ada (sintaks MSSQL)
IF OBJECT_ID('dbo.team_members', 'U') IS NOT NULL
    DROP TABLE dbo.team_members;
GO

-- Buat tabel untuk menyimpan anggota tim
CREATE TABLE team_members (
    id INT IDENTITY(1,1) PRIMARY KEY, -- MSSQL menggunakan IDENTITY, bukan AUTO_INCREMENT
    name VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    spec VARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT GETDATE() -- MSSQL menggunakan GETDATE() untuk timestamp
);
GO

-- Masukkan data awal yang sama
INSERT INTO team_members (name, role, spec) VALUES
('Budi Santoso', 'Senior Developer', 'web'),
('Sari Dewi', 'Mobile Specialist', 'mobile'),
('Rina Lestari', 'Lead Designer', 'ui/ux');
GO