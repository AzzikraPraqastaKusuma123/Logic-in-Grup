document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('portfolio-detail-container');
    const projectId = window.location.pathname.split('/').pop();

    if (!projectId) {
        container.innerHTML = '<h1>Proyek tidak ditemukan.</h1>';
        return;
    }

    try {
        const response = await fetch(`/api/public/portfolio/${projectId}`);
        if (!response.ok) throw new Error('Proyek tidak ditemukan.');
        
        const project = await response.json();

        document.title = `${project.project_name} | Logic.In`;

        container.innerHTML = `
            <header class="portfolio-detail-header">
                <div class="container">
                    <p>${project.category} / ${new Date(project.project_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}</p>
                    <h1>${project.project_name}</h1>
                </div>
            </header>

            <main class="portfolio-detail-content">
                <div class="container">
                    <img src="${project.image_url}" alt="${project.project_name}">
                    <div class="portfolio-detail-description">
                        ${project.description}
                    </div>
                    <a href="/#portfolio" class="btn primary back-link">Kembali ke Portofolio</a>
                </div>
            </main>
        `;

    } catch (error) {
        container.innerHTML = `<h1 style="text-align:center; padding: 5rem;">${error.message}</h1>`;
    }
});