document.addEventListener('DOMContentLoaded', function() {
    let allPortfolioItems = [];
    let allTeamMembers = [];

    // --- FUNGSI-FUNGSI UNTUK MEMUAT KONTEN DINAMIS ---
    async function loadContent(apiEndpoint, renderer) {
        try {
            const response = await fetch(apiEndpoint);
            if (!response.ok) throw new Error(`Gagal memuat konten dari ${apiEndpoint}`);
            const data = await response.json();
            if (!Array.isArray(data)) throw new Error(`Format data tidak valid.`);
            renderer(data);
        } catch (error) {
            console.error(error);
        }
    }

    // --- FUNGSI-FUNGSI RENDER ---
    function renderServices(data) {
        const container = document.getElementById('services-grid-container');
        if (!container) return;
        container.innerHTML = '';
        data.forEach(service => {
            container.innerHTML += `<div class="service-card"><span class="material-symbols-outlined icon-large">${service.icon}</span><h4>${service.title}</h4><p>${service.description}</p></div>`;
        });
    }

    function renderPortfolio(items) {
        allPortfolioItems = items;
        const container = document.getElementById('portfolio-grid-container');
        if (!container) return;
        container.innerHTML = '';
        items.forEach(item => {
            container.innerHTML += `<a href="/portfolio/${item.id}" class="portfolio-item"><img src="${item.image_url}" alt="${item.project_name}"><div class="overlay"><h4>${item.project_name}</h4><p>${item.category}</p></div></a>`;
        });
    }
    
    function renderTeam(data) {
        allTeamMembers = data;
        const container = document.getElementById('team-grid-container');
        if (!container) return;
        container.innerHTML = '';
        data.forEach(member => {
            const specPills = member.spec.split(',')
                                 .map(s => `<span class="spec-pill">${s.trim().toUpperCase()}</span>`)
                                 .join('');
            container.innerHTML += `
                <a href="/team/${member.id}" class="member-card">
                    <img src="${member.image_url}" alt="${member.name}" class="profile-img">
                    <div class="member-info">
                        <h4>${member.name}</h4>
                        <p class="role">${member.role}</p>
                        <div class="spec-pills">
                            ${specPills}
                        </div>
                    </div>
                </a>`;
        });
        initTeamSlider();
    }

    function renderFaq(data) {
        const container = document.getElementById('faq-accordion-container');
        if (!container) return;
        container.innerHTML = '';
        data.forEach(item => {
            container.innerHTML += `<div class="accordion-item"><button class="accordion-header">${item.question}</button><div class="accordion-content"><p>${item.answer}</p></div></div>`;
        });
        attachAccordionListeners();
    }
    
    // --- Memuat semua konten dinamis saat halaman dibuka ---
    loadContent('/api/public/services', renderServices);
    loadContent('/api/public/portfolio', renderPortfolio);
    loadContent('/api/public/team', renderTeam);
    loadContent('/api/public/faq', renderFaq);

    // --- LOGIKA FILTER PORTOFOLIO ---
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const filterValue = button.dataset.filter;
            const filteredItems = (filterValue === '*') ? allPortfolioItems : allPortfolioItems.filter(item => item.category === filterValue);
            renderPortfolio(filteredItems);
        });
    });

    // --- LOGIKA SLIDER TIM ---
    function initTeamSlider() {
        const slider = document.getElementById('team-grid-container');
        const prevBtn = document.getElementById('prev-team');
        const nextBtn = document.getElementById('next-team');
        if (!slider || !prevBtn || !nextBtn) return;
        const scrollAmount = 300;
        nextBtn.addEventListener('click', () => slider.scrollBy({ left: scrollAmount, behavior: 'smooth' }));
        prevBtn.addEventListener('click', () => slider.scrollBy({ left: -scrollAmount, behavior: 'smooth' }));
    }

    // --- FITUR INTERAKTIF LAINNYA (DARI KODE LAMA) ---
    const nav = document.getElementById('main-nav');
    const menuToggle = document.querySelector('.menu-toggle');
    menuToggle.addEventListener('click', () => nav.classList.toggle('active'));

    const contactForm = document.getElementById('contact-form');
    if(contactForm){
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formMessage = document.getElementById('form-message');
            const formData = { name: e.target.name.value, email: e.target.email.value, message: e.target.message.value };

            try {
                const response = await fetch('/api/public/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);
                
                formMessage.textContent = result.message;
                formMessage.style.color = 'green';
                contactForm.reset();
            } catch (error) {
                formMessage.textContent = `Error: ${error.message}`;
                formMessage.style.color = 'red';
            } finally {
                formMessage.style.display = 'block';
                setTimeout(() => { formMessage.style.display = 'none'; }, 5000);
            }
        });
    }

    const sliderContainer = document.querySelector('.slider-container');
    const slides = document.querySelectorAll('.testimonial-slide');
    const dots = document.querySelectorAll('.nav-dot');
    let currentIndex = 0;
    function updateSlider() {
        if (slides.length > 0) {
            sliderContainer.style.transform = `translateX(${-currentIndex * slides[0].clientWidth}px)`;
            dots.forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
        }
    }
    dots.forEach(dot => dot.addEventListener('click', e => {
        currentIndex = parseInt(e.target.dataset.slide);
        updateSlider();
    }));
    setInterval(() => {
        if (slides.length > 0) {
            currentIndex = (currentIndex + 1) % slides.length;
            updateSlider();
        }
    }, 5000);
    window.addEventListener('resize', updateSlider);
    updateSlider();

    function attachAccordionListeners() {
        document.querySelectorAll('#faq-accordion-container .accordion-header').forEach(header => {
            if(header.dataset.listener) return;
            header.dataset.listener = true;
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                header.classList.toggle('active');
                content.style.maxHeight = content.style.maxHeight ? null : content.scrollHeight + "px";
            });
        });
    }

    const scrollTopBtn = document.getElementById('scrollTopBtn');
    window.addEventListener('scroll', () => {
        if(scrollTopBtn) {
            scrollTopBtn.style.display = window.scrollY > 300 ? 'flex' : 'none';
        }
    });
    if(scrollTopBtn) {
        scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }
});