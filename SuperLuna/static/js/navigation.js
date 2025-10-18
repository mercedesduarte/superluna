// navigation.js - Navegación entre secciones
class Navigation {
    constructor() {
        this.currentSection = 'inicio';
        this.initEventListeners();
    }

    initEventListeners() {
        // Navegación principal
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.getAttribute('data-section');
                this.showSection(section);
            });
        });

        // Navegación móvil
        document.querySelectorAll('.mobile-menu-item').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.getAttribute('data-section');
                this.showSection(section);
            });
        });

        // Menú hamburguesa
        document.getElementById('menu-toggle').addEventListener('click', () => {
            this.toggleMobileMenu();
        });

        // Enlaces de categorías
        document.querySelectorAll('.category-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.getAttribute('data-section');
                this.showSection(section);
            });
        });
    }

    showSection(sectionName) {
        // Ocultar sección actual
        document.querySelector('.content-section.active').classList.remove('active');
        document.querySelector(`.nav-link.active`).classList.remove('active');
        document.querySelector(`.mobile-menu-item.active`).classList.remove('active');

        // Mostrar nueva sección
        document.getElementById(sectionName).classList.add('active');
        document.querySelector(`.nav-link[data-section="${sectionName}"]`).classList.add('active');
        document.querySelector(`.mobile-menu-item[data-section="${sectionName}"]`).classList.add('active');

        this.currentSection = sectionName;

        // Cerrar menú móvil si está abierto
        this.closeMobileMenu();

        // Scroll suave al inicio de la sección
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    toggleMobileMenu() {
        document.getElementById('main-nav').classList.toggle('active');
    }

    closeMobileMenu() {
        document.getElementById('main-nav').classList.remove('active');
    }
}

// Inicializar navegación
const navigation = new Navigation();