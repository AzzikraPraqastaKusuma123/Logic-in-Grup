document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('team-detail-container');
    const memberId = window.location.pathname.split('/').pop();

    if (!memberId) {
        container.innerHTML = '<h1>Anggota Tim tidak ditemukan.</h1>';
        return;
    }

    try {
        const response = await fetch(`/api/public/team/${memberId}`);
        if (!response.ok) throw new Error('Anggota Tim tidak ditemukan.');
        
        const member = await response.json();
        if (!member) throw new Error('Anggota Tim tidak ditemukan.');

        const skills = member.skills ? member.skills.split(',').map(s => s.trim()).filter(s => s) : [];
        let experience = [];
        try { if (member.experience && typeof member.experience === 'string') experience = JSON.parse(member.experience); } 
        catch (e) { console.error("Gagal parsing data pengalaman:", e); }

        let testimonials = [];
        try { if (member.testimonials && typeof member.testimonials === 'string') testimonials = JSON.parse(member.testimonials); } 
        catch (e) { console.error("Gagal parsing data testimoni:", e); }

        document.title = `Portofolio ${member.name} | Logic.In`;

        const renderTestimonialCard = (testimonial) => `
            <div class="testimonial-card-v2">
                <div><p class="quote">"${testimonial.quote}"</p></div>
                <div class="client-info">
                    <span class="client-name">${testimonial.author}</span>
                    <span class="client-title">${testimonial.role}</span>
                </div>
            </div>`;

        const testimonialsHTML = testimonials.length > 1 // Tampilkan slider jika lebih dari 1
            ? `<div class="swiper testimonial-slider"><div class="swiper-wrapper">${testimonials.map(t => `<div class="swiper-slide">${renderTestimonialCard(t)}</div>`).join('')}</div><div class="swiper-pagination"></div><div class="swiper-button-prev"></div><div class="swiper-button-next"></div></div>`
            : `<div class="testimonials-grid-static">${testimonials.map(t => renderTestimonialCard(t)).join('')}</div>`;

        container.innerHTML = `
          <div class="page-wrapper">
            <main>
                <section class="portfolio-hero fade-in-section">
                    <div class="container">
                         <img src="${member.image_url || '/uploads/default-profile.png'}" alt="${member.name}" class="portfolio-hero-img">
                         <h1 class="portfolio-hero-name">${member.name}</h1>
                         <p class="portfolio-hero-role">${member.spec ? member.spec.toUpperCase() + ' ・ ' : ''}${member.role}</p>
                         <p class="portfolio-hero-headline">${member.headline || `Seorang ${member.role} yang bersemangat dalam menciptakan solusi digital.`}</p>
                         <div class="portfolio-hero-socials">
                            <a href="#"><i class="fab fa-linkedin"></i> LinkedIn</a>
                            <a href="#"><i class="fab fa-github"></i> GitHub</a>
                        </div>
                    </div>
                </section>

                <div class="container">
                    <div class="team-detail-layout">
                        <div class="main-content">
                            <div class="portfolio-section fade-in-section">
                                <h2>Tentang Saya</h2>
                                <div>${member.about || `<p>Informasi detail tentang ${member.name} belum tersedia.</p>`}</div>
                            </div>

                            ${experience.length > 0 ? `
                            <div class="portfolio-section fade-in-section">
                                <h2>Pengalaman Kerja</h2>
                                <div class="experience-timeline">
                                    ${experience.map(exp => `
                                        <div class="timeline-item">
                                            <div class="timeline-icon">
                                                ${exp.logo ? `<img src="${exp.logo}" alt="${exp.company} logo">` : `<span class="material-symbols-outlined" style="font-size: 1.5rem;">business_center</span>`}
                                            </div>
                                            <div class="timeline-item-content">
                                                <span class="timeline-date">${exp.year || ''}</span>
                                                <h3>${exp.title || 'Posisi'}</h3>
                                                <h4>${exp.company || 'Perusahaan'}</h4>
                                                <p>${exp.desc || ''}</p>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            ` : ''}

                            ${testimonials.length > 0 ? `
                            <div class="portfolio-section fade-in-section">
                                <h2>Testimoni</h2>
                                ${testimonialsHTML}
                            </div>
                            ` : ''}
                        </div>

                        <aside class="sidebar-content">
                            ${skills.length > 0 ? `
                            <div class="sidebar-card fade-in-section">
                                <h3>Keahlian</h3>
                                <div class="skills-grid-v2">
                                    ${skills.map(skill => `<div class="skill-item-v2">${skill}</div>`).join('')}
                                </div>
                            </div>
                            ` : ''}
                        </aside>
                    </div>
                </div>
                <div class="container fade-in-section" style="text-align: center;">
                     <a href="/#team" class="back-link">Kembali ke Tim</a>
                </div>
            </main>
          </div>
        `;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => { entry.target.classList.add('is-visible'); }, index * 100);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.fade-in-section').forEach(section => {
            observer.observe(section);
        });
        
        if (testimonials.length > 1) { // Sesuaikan dengan logika HTML
            new Swiper('.testimonial-slider', {
                slidesPerView: 1, spaceBetween: 30, loop: testimonials.length > 1, // Loop hanya jika item lebih dari 1
                pagination: { el: '.swiper-pagination', clickable: true },
                navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
            });
        }

    } catch (error) {
        container.innerHTML = `<h1 style="text-align:center; padding: 5rem; color: var(--text-secondary);">${error.message}</h1>`;
    }
});