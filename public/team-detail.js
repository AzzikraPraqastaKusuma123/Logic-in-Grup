document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('team-detail-container');
    const memberId = window.location.pathname.split('/').pop();

    if (!memberId) {
        container.innerHTML = '<h1>Anggota Tim tidak ditemukan.</h1>';
        return;
    }

    // Menyiapkan struktur HTML yang sudah diperbaiki
    container.innerHTML = `
        <div class="container page-wrapper">
            <section class="team-hero-layout">
                <div class="hero-details">
                    <h1 id="member-name">Memuat Nama...</h1>
                    <p id="member-role">Memuat Peran...</p>
                    <div class="socials" id="member-socials">
                         <a href="#"><i class="fab fa-linkedin"></i> LinkedIn</a>
                         <a href="#"><i class="fab fa-github"></i> GitHub</a>
                    </div>
                </div>
                
                <div class="hero-image-container">
                    <div class="profile-image-wrapper">
                        <img src="" alt="Foto Profil" id="member-image" class="profile-picture">
                    </div>
                </div>
                </section>
            
            <div class="main-content-flow">
                <section class="portfolio-section" id="about-and-skills-section">
                    <div class="about-container">
                        <h2>Tentang Saya</h2>
                        <div id="member-about"><p>Memuat...</p></div>
                    </div>
                    <div class="skills-container" id="skills-section" style="display: none;">
                        <h3>Keahlian</h3>
                        <div class="skills-grid-v2" id="member-skills"></div>
                    </div>
                </section>
                <section class="portfolio-section" id="experience-section" style="display: none;">
                    <h2>Pengalaman Kerja</h2>
                    <div class="experience-timeline" id="member-experience"></div>
                </section>
                <section class="portfolio-section" id="testimonials-section" style="display: none;">
                    <h2>Testimoni</h2>
                    <div id="member-testimonials"></div>
                </section>
                <div style="text-align: center; margin-top: 4rem;">
                    <a href="/#team" class="back-link">Kembali ke Tim</a>
                </div>
            </div>
        </div>
    `;

    try {
        const response = await fetch(`/api/public/team/${memberId}`);
        if (!response.ok) throw new Error('Anggota Tim tidak ditemukan.');
        
        const member = await response.json();
        if (!member) throw new Error('Anggota Tim tidak ditemukan.');

        document.title = `Portofolio ${member.name} | Logic.In`;

        document.getElementById('member-name').textContent = member.name;
        document.getElementById('member-role').textContent = `${member.spec ? member.spec.toUpperCase() + ' ・ ' : ''}${member.role}`;
        
        // Mengatur gambar profil
        const memberImage = document.getElementById('member-image');
        memberImage.src = member.image_url || '/public/uploads/default-profile.png';
        memberImage.alt = member.name;

        document.getElementById('member-about').innerHTML = member.about || `<p>Informasi detail tentang ${member.name} belum tersedia.</p>`;
        
        const skills = member.skills ? member.skills.split(',').map(s => s.trim()).filter(s => s) : [];
        if (skills.length > 0) {
            const skillsContainer = document.getElementById('member-skills');
            skillsContainer.innerHTML = skills.map(skill => `<span class="skill-item-v2">${skill}</span>`).join('');
            document.getElementById('skills-section').style.display = 'block';
        }

        let experience = [];
        try { 
            if (member.experience && typeof member.experience === 'string') {
                experience = JSON.parse(member.experience);
            }
        } catch (e) { console.error("Gagal parsing data pengalaman:", e); }

        if (experience.length > 0) {
            const experienceContainer = document.getElementById('member-experience');
            experienceContainer.innerHTML = experience.map(exp => `
                <div class="timeline-item">
                    <div class="timeline-icon">
                        ${exp.logo ? `<img src="${exp.logo}" alt="${exp.company} logo">` : `<span class="material-symbols-outlined">business_center</span>`}
                    </div>
                    <span class="timeline-date">${exp.year || ''}</span>
                    <h3>${exp.title || 'Posisi'}</h3>
                    <h4>${exp.company || 'Perusahaan'}</h4>
                    <p>${exp.desc || ''}</p>
                </div>
            `).join('');
            document.getElementById('experience-section').style.display = 'block';
        }

        let testimonials = [];
        try { 
            if (member.testimonials && typeof member.testimonials === 'string') {
                testimonials = JSON.parse(member.testimonials);
            }
        } catch (e) { console.error("Gagal parsing data testimoni:", e); }
        
        if (testimonials.length > 0) {
            const renderTestimonialCard = (testimonial) => `
                <div class="testimonial-card-v2">
                    <p class="quote">"${testimonial.quote}"</p>
                    <div class="client-info">
                        <span class="client-name">${testimonial.author}</span>
                        <span class="client-title">${testimonial.role}</span>
                    </div>
                </div>`;
            
            const testimonialsHTML = testimonials.length > 1
                ? `<div class="swiper testimonial-slider"><div class="swiper-wrapper">${testimonials.map(t => `<div class="swiper-slide">${renderTestimonialCard(t)}</div>`).join('')}</div><div class="swiper-pagination"></div><div class="swiper-button-prev"></div><div class="swiper-button-next"></div></div>`
                : `<div class="testimonials-grid-static">${testimonials.map(t => renderTestimonialCard(t)).join('')}</div>`;

            document.getElementById('member-testimonials').innerHTML = testimonialsHTML;
            document.getElementById('testimonials-section').style.display = 'block';

            if (testimonials.length > 1) {
                new Swiper('.testimonial-slider', {
                    loop: true,
                    pagination: { el: '.swiper-pagination', clickable: true },
                    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
                });
            }
        }

    } catch (error) {
        container.innerHTML = `<h1 style="text-align:center; padding: 5rem; color: var(--text-secondary);">${error.message}</h1>`;
    }
});