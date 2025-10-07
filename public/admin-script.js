// public/admin-script.js
document.addEventListener('DOMContentLoaded', () => {
    // === ELEMEN DOM ===
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const mainContent = document.getElementById('page-content');
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const logoutBtn = document.getElementById('logout-btn');

    const modal = document.getElementById('data-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalForm = document.getElementById('modal-form');
    const formFields = document.getElementById('form-fields');
    const closeBtn = document.querySelector('.close-btn');
    
    let currentConfig = {};

    // ==================
    // 1. OTENTIKASI
    // ==================
    const getToken = () => localStorage.getItem('token');
    
    const handleLogin = async (e) => {
        e.preventDefault();
        loginError.textContent = '';
        const username = e.target.username.value;
        const password = e.target.password.value;
        
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            localStorage.setItem('token', data.token);
            showDashboard();
        } catch (error) {
            loginError.textContent = error.message;
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        dashboardScreen.style.display = 'none';
        loginScreen.classList.add('active');
    };

    const showDashboard = () => {
        loginScreen.classList.remove('active');
        dashboardScreen.style.display = 'flex';
        showPage('dashboard');
    };

    // ========================
    // 2. FUNGSI API
    // ========================
    const apiCall = async (endpoint, method = 'GET', body = null) => {
        const options = { 
            method, 
            headers: { 'Authorization': `Bearer ${getToken()}` } 
        };

        if (body) {
            if (body instanceof FormData) {
                options.body = body; 
            } else {
                options.headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(body);
            }
        }
        
        const response = await fetch(endpoint, options);
        if (response.status === 401 || response.status === 403) handleLogout();
        
        const responseText = await response.text();
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            responseData = { message: responseText };
        }

        if (!response.ok) {
            throw new Error(responseData.message || 'API call failed');
        }

        return responseData;
    };


    // ===================================
    // 3. PENGELOLAAN HALAMAN & RENDERING
    // ===================================
    const pageConfigs = {
        dashboard: {
            title: 'Dashboard',
            render: () => { mainContent.innerHTML = `<div class="content-section"><h2>Dashboard Overview</h2><p>Selamat datang di panel admin Logic.In!</p></div>`; }
        },
        contacts: {
            title: 'Pesan Masuk', api: '/api/admin/contacts',
            render: (data) => {
                let tableRows = data.map(c => `<tr><td>${c.id}</td><td>${c.name}</td><td>${c.email}</td><td>${c.message.substring(0,50)}...</td><td>${new Date(c.submitted_at).toLocaleString('id-ID')}</td><td><button class="btn danger" onclick="deleteItem('contacts', ${c.id})">Hapus</button></td></tr>`).join('');
                mainContent.innerHTML = `<div class="content-section"><h2>Pesan Masuk</h2><table class="data-table"><thead><tr><th>ID</th><th>Nama</th><th>Email</th><th>Pesan</th><th>Tanggal</th><th>Aksi</th></tr></thead><tbody>${tableRows}</tbody></table></div>`;
            }
        },
        team: { 
            title: 'Anggota Tim', 
            api: '/api/admin/team',
            fields: [
                {label: 'Nama', name: 'name', type: 'text'},
                {label: 'Peran', name: 'role', type: 'text'},
                {label: 'Spesialisasi (pisahkan koma)', name: 'spec', type: 'text'},
                {label: 'Gambar Profil', name: 'image_url', type: 'file'},
                {label: 'Headline Singkat', name: 'headline', type: 'textarea'},
                {label: 'Tentang Saya (Bio)', name: 'about', type: 'richtext'},
                {label: 'Keahlian (pisahkan koma)', name: 'skills', type: 'textarea'},
                // --- PERUBAHAN DIMULAI DI SINI ---
                {label: 'URL Instagram', name: 'instagram_url', type: 'url'},
                {label: 'URL LinkedIn', name: 'linkedin_url', type: 'url'},
                {label: 'URL GitHub', name: 'github_url', type: 'url'},
                {label: 'URL Dribbble', name: 'dribbble_url', type: 'url'},
                // --- PERUBAHAN BERAKHIR DI SINI ---
                {label: 'Pengalaman Kerja', name: 'experience', type: 'experience_repeater'},
                {label: 'Testimoni', name: 'testimonials', type: 'testimonial_repeater'}
            ],
            render: (data) => {
                const tableRows = data.map(item => `
                    <tr>
                        <td><img src="${item.image_url || '/uploads/default-profile.png'}" class="table-img"></td>
                        <td>${item.name}</td>
                        <td>${item.role}</td>
                        <td>
                            <button class="btn edit" data-item='${JSON.stringify(item)}'>Edit</button>
                            <button class="btn danger" onclick="deleteItem('team', ${item.id})">Hapus</button>
                        </td>
                    </tr>`).join('');
                mainContent.innerHTML = `<div class="content-section"><h2>Kelola ${pageConfigs.team.title} <button id="add-btn" class="btn primary">Tambah</button></h2><table class="data-table"><thead><tr><th>Gambar</th><th>Nama</th><th>Peran</th><th>Aksi</th></tr></thead><tbody>${tableRows}</tbody></table></div>`;
            }
        },
        portfolio: { 
            title: 'Portofolio', api: '/api/admin/portfolio',
            fields: [{label: 'Nama Proyek', name: 'project_name', type: 'text'}, {label: 'Kategori', name: 'category', type: 'text'}, {label: 'Tanggal', name: 'project_date', type: 'date'}, {label: 'Gambar Utama', name: 'image_url', type: 'file'}, {label: 'Deskripsi', name: 'description', type: 'richtext'}],
            render: (data) => {
                const tableRows = data.map(item => `<tr><td>${item.id}</td><td>${item.project_name}</td><td>${item.category}</td><td><button class="btn edit" data-item='${JSON.stringify(item)}'>Edit</button><button class="btn danger" onclick="deleteItem('portfolio', ${item.id})">Hapus</button></td></tr>`).join('');
                mainContent.innerHTML = `<div class="content-section"><h2>Kelola ${pageConfigs.portfolio.title} <button id="add-btn" class="btn primary">Tambah</button></h2><table class="data-table"><thead><tr><th>ID</th><th>Nama Proyek</th><th>Kategori</th><th>Aksi</th></tr></thead><tbody>${tableRows}</tbody></table></div>`;
            }
        },
        services: {
            title: 'Layanan', api: '/api/admin/services',
            render: (data) => {
                const forms = data.map(service => `<form class="service-form" data-id="${service.id}"><h4>Edit: ${service.title}</h4><div class="form-group"><label>Judul</label><input type="text" name="title" value="${service.title}" required></div><div class="form-group"><label>Deskripsi</label><textarea name="description" required>${service.description}</textarea></div><div class="form-group"><label>Ikon</label><input type="text" name="icon" value="${service.icon}" required></div><button type="submit" class="btn primary">Update Layanan</button></form>`).join('');
                mainContent.innerHTML = `<div class="content-section"><h2>Kelola Layanan</h2>${forms}</div>`;
            }
        },
        faq: {
            title: 'FAQ', api: '/api/admin/faq',
            fields: [{label: 'Pertanyaan', name: 'question', type: 'text'}, {label: 'Jawaban', name: 'answer', type: 'richtext'}],
            render: (data) => {
                const tableRows = data.map(item => `<tr><td>${item.id}</td><td>${item.question}</td><td><button class="btn edit" data-item='${JSON.stringify(item)}'>Edit</button><button class="btn danger" onclick="deleteItem('faq', ${item.id})">Hapus</button></td></tr>`).join('');
                mainContent.innerHTML = `<div class="content-section"><h2>Kelola ${pageConfigs.faq.title} <button id="add-btn" class="btn primary">Tambah</button></h2><table class="data-table"><thead><tr><th>ID</th><th>Pertanyaan</th><th>Aksi</th></tr></thead><tbody>${tableRows}</tbody></table></div>`;
            }
        }
    };

    async function showPage(pageId) {
        currentConfig = pageConfigs[pageId];
        if (!currentConfig) return;
        mainContent.innerHTML = `<div class="content-section"><h2>Memuat...</h2></div>`;
        if (currentConfig.api) {
            try {
                const data = await apiCall(currentConfig.api);
                currentConfig.render(data);
            } catch (error) {
                mainContent.innerHTML = `<div class="content-section"><h2>Gagal memuat data: ${error.message}</h2></div>`;
            }
        } else {
            currentConfig.render();
        }
    };
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            e.currentTarget.classList.add('active');
            showPage(e.currentTarget.dataset.page);
        });
    });

    // ====================================
    // 4. MODAL & FORM
    // ====================================
    function createExperienceItemHTML(item = {}) {
        return `
            <div class="experience-item" style="border: 1px solid #e5e7eb; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <input type="text" name="exp_title" placeholder="Posisi / Jabatan" value="${item.title || ''}" required style="margin-bottom: 0.5rem; width: 100%; padding: 0.5rem;">
                <input type="text" name="exp_company" placeholder="Nama Perusahaan" value="${item.company || ''}" required style="margin-bottom: 0.5rem; width: 100%; padding: 0.5rem;">
                <input type="text" name="exp_year" placeholder="Durasi (Contoh: 2022 - Sekarang)" value="${item.year || ''}" required style="margin-bottom: 0.5rem; width: 100%; padding: 0.5rem;">
                <textarea name="exp_desc" placeholder="Deskripsi Singkat" rows="3" style="margin-bottom: 0.5rem; width: 100%; padding: 0.5rem;">${item.desc || ''}</textarea>
                <label>Logo Perusahaan (URL)</label>
                <input type="text" name="exp_logo_url" placeholder="https://example.com/logo.png" value="${item.logo || ''}" style="width: 100%; padding: 0.5rem;">
                <button type="button" class="btn danger remove-experience" style="margin-top: 0.5rem;">Hapus</button>
            </div>
        `;
    }

    function createTestimonialItemHTML(item = {}) {
        return `
            <div class="testimonial-item" style="border: 1px solid #e5e7eb; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <textarea name="testi_quote" placeholder="Komentar / Kutipan" rows="3" required style="margin-bottom: 0.5rem; width: 100%; padding: 0.5rem;">${item.quote || ''}</textarea>
                <input type="text" name="testi_author" placeholder="Nama Pemberi Testimoni" value="${item.author || ''}" required style="margin-bottom: 0.5rem; width: 100%; padding: 0.5rem;">
                <input type="text" name="testi_role" placeholder="Jabatan (Contoh: CEO, Tech Corp)" value="${item.role || ''}" required style="margin-bottom: 0.5rem; width: 100%; padding: 0.5rem;">
                <button type="button" class="btn danger remove-testimonial" style="margin-top: 0.5rem;">Hapus</button>
            </div>
        `;
    }

    function openModal(mode, item = {}) {
        modalTitle.textContent = `${mode === 'add' ? 'Tambah' : 'Edit'} ${currentConfig.title}`;
        formFields.innerHTML = '';
        
        currentConfig.fields.forEach(field => {
            const value = item[field.name] || '';
            let fieldHtml = `<div class="form-group"><label>${field.label}</label>`;
            
            if (field.type === 'experience_repeater') {
                let itemsHTML = '';
                let experiences = [];
                try {
                    if (value && typeof value === 'string') experiences = JSON.parse(value);
                    else if (Array.isArray(value)) experiences = value;
                } catch(e) { console.error("Data pengalaman bukan JSON:", value); }
                
                if (experiences.length > 0) experiences.forEach(exp => { itemsHTML += createExperienceItemHTML(exp); });
                else itemsHTML += createExperienceItemHTML();

                fieldHtml += `<div id="experience-container">${itemsHTML}</div><button type="button" id="add-experience" class="btn primary">Tambah Pengalaman</button>`;
            
            } else if (field.type === 'testimonial_repeater') {
                let itemsHTML = '';
                let testimonials = [];
                try {
                    if (value && typeof value === 'string') testimonials = JSON.parse(value);
                    else if (Array.isArray(value)) testimonials = value;
                } catch (e) { console.error("Data testimoni bukan JSON:", value); }

                if (testimonials.length > 0) testimonials.forEach(testi => { itemsHTML += createTestimonialItemHTML(testi); });
                else itemsHTML += createTestimonialItemHTML();

                fieldHtml += `<div id="testimonial-container">${itemsHTML}</div><button type="button" id="add-testimonial" class="btn primary">Tambah Testimoni</button>`;

            } else if(field.type === 'richtext') {
                fieldHtml += `<textarea id="richtext-editor" name="${field.name}">${value}</textarea>`;
            } else if (field.type === 'file') {
                fieldHtml += `<input type="file" name="${field.name}" accept="image/*">`;
                if(value) fieldHtml += `<img src="${value}" style="max-width: 100px; margin-top: 10px; display: block;">`;
            } else if (field.type === 'textarea') {
                fieldHtml += `<textarea name="${field.name}" rows="5">${value}</textarea>`;
            } else {
                const dateValue = (field.type === 'date' && value) ? new Date(value).toISOString().split('T')[0] : value;
                fieldHtml += `<input type="${field.type}" name="${field.name}" value="${dateValue}">`;
            }
            fieldHtml += `</div>`;
            formFields.innerHTML += fieldHtml;
        });

        document.getElementById('add-experience')?.addEventListener('click', () => {
            document.getElementById('experience-container').insertAdjacentHTML('beforeend', createExperienceItemHTML());
        });
        document.getElementById('add-testimonial')?.addEventListener('click', () => {
            document.getElementById('testimonial-container').insertAdjacentHTML('beforeend', createTestimonialItemHTML());
        });

        formFields.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-experience')) e.target.closest('.experience-item').remove();
            if (e.target.classList.contains('remove-testimonial')) e.target.closest('.testimonial-item').remove();
        });

        if (document.getElementById('richtext-editor')) {
            tinymce.remove();
            tinymce.init({ 
                selector: '#richtext-editor', plugins: 'lists link image code', 
                toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist outdent indent | code', 
                height: 300, promotion: false
            });
        }
        
        modalForm.dataset.id = item.id || '';
        modal.classList.add('active');
    }

    function closeModal() {
        modal.classList.remove('active');
        if (tinymce.get('richtext-editor')) tinymce.remove();
    }
    
    modalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (tinymce.get('richtext-editor')) tinymce.triggerSave();
        
        const id = e.target.dataset.id;
        const formData = new FormData(e.target);

        if (document.getElementById('experience-container')) {
            const experiences = Array.from(document.querySelectorAll('.experience-item')).map(item => ({
                title: item.querySelector('[name="exp_title"]').value,
                company: item.querySelector('[name="exp_company"]').value,
                year: item.querySelector('[name="exp_year"]').value,
                desc: item.querySelector('[name="exp_desc"]').value,
                logo: item.querySelector('[name="exp_logo_url"]').value,
            }));
            formData.set('experience', JSON.stringify(experiences));
            ['exp_title', 'exp_company', 'exp_year', 'exp_desc', 'exp_logo_url'].forEach(name => formData.delete(name));
        }

        if (document.getElementById('testimonial-container')) {
            const testimonials = Array.from(document.querySelectorAll('.testimonial-item')).map(item => ({
                quote: item.querySelector('[name="testi_quote"]').value,
                author: item.querySelector('[name="testi_author"]').value,
                role: item.querySelector('[name="testi_role"]').value,
            }));
            formData.set('testimonials', JSON.stringify(testimonials));
            ['testi_quote', 'testi_author', 'testi_role'].forEach(name => formData.delete(name));
        }
        
        const originalFormData = new FormData();
        for (const [key, value] of formData.entries()) {
            originalFormData.append(key, value);
        }

        const fileInputs = Array.from(modalForm.querySelectorAll('input[type="file"]'));
        for (const input of fileInputs) {
             const file = input.files[0];
             if (file && file.size > 0) {
                 const uploadFormData = new FormData();
                 uploadFormData.append('image', file);
                 try {
                     const uploadRes = await apiCall('/api/admin/upload', 'POST', uploadFormData);
                     originalFormData.set(input.name, uploadRes.imageUrl);
                 } catch (error) {
                     alert(`Gagal upload gambar untuk ${input.name}: ${error.message}`); return;
                 }
             } else {
                 originalFormData.delete(input.name);
             }
        }
        
        const data = Object.fromEntries(originalFormData.entries());
        const url = id ? `${currentConfig.api}/${id}` : currentConfig.api;
        const method = id ? 'PUT' : 'POST';
        
        try {
            await apiCall(url, method, data);
            closeModal();
            showPage(document.querySelector('.nav-item.active').dataset.page);
        } catch(error) {
            alert(`Gagal menyimpan data: ${error.message}`);
        }
    });

    mainContent.addEventListener('click', (e) => {
        if (e.target.id === 'add-btn') openModal('add');
        if (e.target.classList.contains('edit')) {
            try {
                openModal('edit', JSON.parse(e.target.dataset.item));
            } catch (err) {
                alert("Data item tidak valid.");
            }
        }
        
        const serviceForm = e.target.closest('.service-form');
        if (serviceForm) {
            serviceForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const id = serviceForm.dataset.id;
                const data = Object.fromEntries(new FormData(serviceForm).entries());
                try {
                    await apiCall(`/api/admin/services/${id}`, 'PUT', data);
                    alert('Layanan berhasil diperbarui!');
                } catch(error) {
                    alert(`Gagal memperbarui: ${error.message}`);
                }
            });
        }
    });

    window.deleteItem = async (pageId, id) => {
        if (!confirm('Apakah Anda yakin ingin menghapus item ini?')) return;
        const config = pageConfigs[pageId];
        try {
            await apiCall(`${config.api}/${id}`, 'DELETE');
            showPage(pageId);
        } catch (error) {
            alert(`Gagal menghapus: ${error.message}`);
        }
    };

    // ==================
    // 5. INISIALISASI
    // ==================
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    if (getToken()) showDashboard();
    else loginScreen.classList.add('active');
});