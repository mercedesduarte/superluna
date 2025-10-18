// navigation.js - Navegación entre secciones
class Navigation {
    constructor() {
        this.currentSection = 'inicio';
        this.initEventListeners();
        this.showSection('inicio'); // Mostrar sección inicial al cargar
    }

    initEventListeners() {
        // Navegación principal
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('.nav-link');
            if (navLink) {
                e.preventDefault();
                const section = navLink.getAttribute('data-section');
                this.showSection(section);
                return;
            }

            // Navegación móvil
            const mobileMenuItem = e.target.closest('.mobile-menu-item');
            if (mobileMenuItem) {
                e.preventDefault();
                const section = mobileMenuItem.getAttribute('data-section');
                this.showSection(section);
                return;
            }

            // Enlaces de categorías
            const categoryLink = e.target.closest('.category-link');
            if (categoryLink) {
                e.preventDefault();
                const section = categoryLink.getAttribute('data-section');
                this.showSection(section);
                return;
            }
        });

        // Menú hamburguesa
        const menuToggle = document.getElementById('menu-toggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }

        // Cerrar menú al hacer clic fuera de él
        document.addEventListener('click', (e) => {
            const mainNav = document.getElementById('main-nav');
            const menuToggle = document.getElementById('menu-toggle');
            
            if (mainNav && mainNav.classList.contains('active') && 
                !mainNav.contains(e.target) && 
                (!menuToggle || !menuToggle.contains(e.target))) {
                this.closeMobileMenu();
            }
        });

        // Cerrar menú con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMobileMenu();
            }
        });
    }

    showSection(sectionName) {
        console.log(`Cambiando a sección: ${sectionName}`);
        
        // Validar que la sección existe
        const targetSection = document.getElementById(sectionName);
        if (!targetSection) {
            console.error(`Sección no encontrada: ${sectionName}`);
            return;
        }

        // Ocultar sección actual
        const currentActiveSection = document.querySelector('.content-section.active');
        if (currentActiveSection) {
            currentActiveSection.classList.remove('active');
        }

        // Remover clase active de todos los enlaces
        document.querySelectorAll('.nav-link.active, .mobile-menu-item.active').forEach(link => {
            link.classList.remove('active');
        });

        // Mostrar nueva sección
        targetSection.classList.add('active');

        // Activar enlaces correspondientes
        const desktopLink = document.querySelector(`.nav-link[data-section="${sectionName}"]`);
        const mobileLink = document.querySelector(`.mobile-menu-item[data-section="${sectionName}"]`);
        
        if (desktopLink) desktopLink.classList.add('active');
        if (mobileLink) mobileLink.classList.add('active');

        this.currentSection = sectionName;

        // Cerrar menú móvil si está abierto
        this.closeMobileMenu();

        // Scroll suave al inicio de la sección
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        // Disparar evento personalizado para que otros componentes reaccionen
        this.dispatchSectionChange(sectionName);
    }

    toggleMobileMenu() {
        const mainNav = document.getElementById('main-nav');
        if (mainNav) {
            mainNav.classList.toggle('active');
            
            // Prevenir scroll del body cuando el menú está abierto
            document.body.style.overflow = mainNav.classList.contains('active') ? 'hidden' : '';
        }
    }

    closeMobileMenu() {
        const mainNav = document.getElementById('main-nav');
        if (mainNav) {
            mainNav.classList.remove('active');
            document.body.style.overflow = ''; // Restaurar scroll
        }
    }

    dispatchSectionChange(sectionName) {
        const event = new CustomEvent('sectionChanged', {
            detail: { section: sectionName }
        });
        document.dispatchEvent(event);
    }

    // Método para obtener la sección actual
    getCurrentSection() {
        return this.currentSection;
    }

    // Método para navegar a una sección específica (útil para otros componentes)
    navigateTo(sectionName) {
        this.showSection(sectionName);
    }
}

// Inicializar navegación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    const navigation = new Navigation();
    window.navigation = navigation; // Hacer global para acceso desde otros archivos
    
    console.log('Sistema de navegación inicializado');
});

// También exportar para módulos (si estás usando ES6 modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Navigation;
}