const SUPPORTED_LANGUAGES = ['de', 'pl'];
const DEFAULT_LANGUAGE = 'de';
const STORAGE_KEY = 'urbik-language';

const state = {
    language: DEFAULT_LANGUAGE,
    translations: null,
    galleryEntries: [],
    lightboxIndex: 0,
    lastFocusedElement: null
};

document.addEventListener('DOMContentLoaded', () => {
    initializeSite().catch((error) => {
        console.error('Unable to initialize site translations:', error);
    });
});

async function initializeSite() {
    setupMobileMenu();
    setupLanguageSwitcher();
    setupLightbox();
    setupContactForm();
    pruneMissingStaticImages();

    const initialLanguage = getPreferredLanguage();
    await setLanguage(initialLanguage);
    updateCurrentYear();
}

function getPreferredLanguage() {
    const urlLanguage = new URLSearchParams(window.location.search).get('lang');
    const savedLanguage = window.localStorage.getItem(STORAGE_KEY);

    if (SUPPORTED_LANGUAGES.includes(urlLanguage)) {
        return urlLanguage;
    }

    if (SUPPORTED_LANGUAGES.includes(savedLanguage)) {
        return savedLanguage;
    }

    return DEFAULT_LANGUAGE;
}

async function setLanguage(language) {
    const safeLanguage = SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE;
    const translations = await loadTranslations(safeLanguage);

    state.language = safeLanguage;
    state.translations = translations;

    document.documentElement.lang = safeLanguage;
    window.localStorage.setItem(STORAGE_KEY, safeLanguage);

    applyTranslations();
    updateLanguageButtons();
    syncLanguageQuery();
}

async function loadTranslations(language) {
    const url = `i18n/${language}.json`;

    try {
        const response = await fetch(url, { cache: 'no-store' });

        if (!response.ok) {
            throw new Error(`Request failed for ${url}`);
        }

        return await response.json();
    } catch (error) {
        const fallback = window.__I18N_INLINE__?.[language];

        if (fallback) {
            return JSON.parse(JSON.stringify(fallback));
        }

        throw error;
    }
}

function applyTranslations() {
    if (!state.translations) {
        return;
    }

    translateTextNodes();
    translateAttributes();
    updateMetaTags();
    updateActiveNavigation();
    updateContactLinks();
    renderStats();
    renderHomeHighlights();
    renderHomeServicesPreview();
    renderHomeGalleryPreview();
    renderAboutValues();
    renderAboutProcess();
    renderServicesList();
    renderServicesProcess();
    renderGallery();
    populateServiceSelect();
}

function translateTextNodes() {
    document.querySelectorAll('[data-i18n]').forEach((element) => {
        const key = element.dataset.i18n;
        const value = getTranslationValue(key);

        if (typeof value === 'string' || typeof value === 'number') {
            element.textContent = value;
        }
    });
}

function translateAttributes() {
    document.querySelectorAll('[data-i18n-attr]').forEach((element) => {
        const mapping = element.dataset.i18nAttr.split(';').map((entry) => entry.trim()).filter(Boolean);

        mapping.forEach((entry) => {
            const [attributeName, key] = entry.split(':').map((item) => item.trim());
            const value = getTranslationValue(key);

            if (attributeName && typeof value === 'string') {
                element.setAttribute(attributeName, value);
            }
        });
    });
}

function getTranslationValue(path) {
    return path.split('.').reduce((current, segment) => current?.[segment], state.translations);
}

function updateMetaTags() {
    const page = document.body.dataset.page;
    const meta = state.translations?.seo?.[page];

    if (!meta) {
        return;
    }

    const baseUrl = state.translations.site.baseUrl || window.location.origin;
    const canonicalUrl = new URL(meta.canonicalPath, baseUrl).href;

    document.title = meta.title;
    updateMeta('meta[name="description"]', 'content', meta.description);
    updateMeta('link[rel="canonical"]', 'href', canonicalUrl);
    updateMeta('meta[property="og:title"]', 'content', meta.ogTitle);
    updateMeta('meta[property="og:description"]', 'content', meta.ogDescription);
    updateMeta('meta[property="og:url"]', 'content', canonicalUrl);
}

function updateMeta(selector, attribute, value) {
    const element = document.querySelector(selector);

    if (element && value) {
        element.setAttribute(attribute, value);
    }
}

function updateActiveNavigation() {
    const currentPage = document.body.dataset.page;

    document.querySelectorAll('[data-nav-link]').forEach((link) => {
        const isActive = link.dataset.navLink === currentPage;
        link.classList.toggle('is-active', isActive);
        link.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
}

function setupLanguageSwitcher() {
    document.querySelectorAll('[data-lang]').forEach((button) => {
        button.addEventListener('click', async () => {
            await setLanguage(button.dataset.lang);
        });
    });
}

function updateLanguageButtons() {
    document.querySelectorAll('[data-lang]').forEach((button) => {
        const isCurrent = button.dataset.lang === state.language;
        button.setAttribute('aria-pressed', String(isCurrent));
    });
}

function syncLanguageQuery() {
    const url = new URL(window.location.href);
    url.searchParams.set('lang', state.language);
    window.history.replaceState({}, '', url.toString());
}

function setupMobileMenu() {
    const toggleButton = document.querySelector('[data-menu-toggle]');
    const navigation = document.getElementById('site-nav');

    if (!toggleButton || !navigation) {
        return;
    }

    const closeMenu = () => {
        navigation.classList.add('hidden');
        toggleButton.setAttribute('aria-expanded', 'false');
    };

    const openMenu = () => {
        navigation.classList.remove('hidden');
        toggleButton.setAttribute('aria-expanded', 'true');
    };

    toggleButton.addEventListener('click', () => {
        const expanded = toggleButton.getAttribute('aria-expanded') === 'true';
        if (expanded) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    navigation.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 768) {
                closeMenu();
            }
        });
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            navigation.classList.remove('hidden');
            toggleButton.setAttribute('aria-expanded', 'false');
        } else {
            navigation.classList.add('hidden');
        }
    });

    if (window.innerWidth < 768) {
        navigation.classList.add('hidden');
    }
}

function updateContactLinks() {
    const contact = state.translations.contact;
    if (!contact) {
        return;
    }

    document.querySelectorAll('[data-contact-link]').forEach((element) => {
        const type = element.dataset.contactLink;
        let value = '';
        let href = '#';

        if (type === 'phonePrimary') {
            value = contact.phonePrimary;
            href = `tel:${sanitizePhone(contact.phonePrimary)}`;
        }

        if (type === 'phoneSecondary') {
            value = contact.phoneSecondary;
            href = `tel:${sanitizePhone(contact.phoneSecondary)}`;
        }

        if (type === 'email') {
            value = contact.email;
            href = `mailto:${contact.email}`;
        }

        element.textContent = value;
        element.setAttribute('href', href);
    });
}

function sanitizePhone(phoneNumber) {
    return phoneNumber.replace(/[^+\d]/g, '');
}

function renderStats() {
    const stats = state.translations?.home?.stats;
    if (!Array.isArray(stats)) {
        return;
    }

    document.querySelectorAll('[data-home-stats]').forEach((container) => {
        container.innerHTML = '';

        stats.forEach((item) => {
            const article = document.createElement('article');
            article.className = 'theme-panel px-5 py-4';
            article.innerHTML = `
                <p class="text-3xl font-black text-black">${item.value}</p>
                <p class="mt-2 text-sm leading-6 text-gray-600">${item.label}</p>
            `;
            container.appendChild(article);
        });
    });
}

function renderHomeHighlights() {
    const container = document.querySelector('[data-home-highlights]');
    const highlights = state.translations?.home?.highlights;

    if (!container || !Array.isArray(highlights)) {
        return;
    }

    container.innerHTML = '';
    highlights.forEach((item) => container.appendChild(createSimpleCard(item.title, item.description)));
}

function renderHomeServicesPreview() {
    const container = document.querySelector('[data-home-services-preview]');
    const services = state.translations?.services?.items;

    if (!container || !Array.isArray(services)) {
        return;
    }

    container.innerHTML = '';
    services.slice(0, 3).forEach((item) => {
        const card = createSimpleCard(item.title, item.description);
        card.classList.add('border-t-4', 'border-red-700/80');
        container.appendChild(card);
    });
}

function renderHomeGalleryPreview() {
    const container = document.querySelector('[data-home-gallery-preview]');
    const entries = getGalleryEntries().slice(0, 6);

    if (!container) {
        return;
    }

    container.innerHTML = '';

    entries.forEach(([filename, details]) => {
        const src = `photos/${filename}`;
        imageExists(src).then((exists) => {
            if (!exists) {
                return;
            }

            const figure = document.createElement('figure');
            figure.className = 'preview-card';
            figure.innerHTML = `
                <img src="${src}" alt="${details.title}" loading="lazy">
                <figcaption>
                    <p class="preview-card-title">${details.title}</p>
                    <p class="preview-card-description">${details.description}</p>
                </figcaption>
            `;
            container.appendChild(figure);
        });
    });
}

function renderAboutValues() {
    const container = document.querySelector('[data-about-values]');
    const values = state.translations?.about?.values;

    if (!container || !Array.isArray(values)) {
        return;
    }

    container.innerHTML = '';
    values.forEach((item) => container.appendChild(createSimpleCard(item.title, item.description)));
}

function renderAboutProcess() {
    const container = document.querySelector('[data-about-process]');
    const process = state.translations?.about?.process;

    if (!container || !Array.isArray(process)) {
        return;
    }

    container.innerHTML = '';
    process.forEach((item) => container.appendChild(createSimpleCard(item.title, item.description)));
}

function renderServicesList() {
    const container = document.querySelector('[data-services-list]');
    const services = state.translations?.services?.items;

    if (!container || !Array.isArray(services)) {
        return;
    }

    container.innerHTML = '';

    services.forEach((service) => {
        const article = document.createElement('article');
        article.className = 'card-item';

        const detailsList = Array.isArray(service.details)
            ? `<ul class="detail-list">${service.details.map((detail) => `<li><span>${detail}</span></li>`).join('')}</ul>`
            : '';

        article.innerHTML = `
            <h3>${service.title}</h3>
            <p class="text-gray-700 leading-7">${service.description}</p>
            ${detailsList}
        `;

        container.appendChild(article);
    });
}

function renderServicesProcess() {
    const container = document.querySelector('[data-services-process]');
    const process = state.translations?.services?.process;

    if (!container || !Array.isArray(process)) {
        return;
    }

    container.innerHTML = '';
    process.forEach((item) => container.appendChild(createSimpleCard(item.title, item.description)));
}

function populateServiceSelect() {
    const select = document.querySelector('[data-contact-service-select]');
    const services = state.translations?.services?.items;
    const placeholder = state.translations?.contact?.form?.servicePlaceholder;

    if (!select || !Array.isArray(services)) {
        return;
    }

    select.innerHTML = '';

    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    placeholderOption.textContent = placeholder;
    select.appendChild(placeholderOption);

    services.forEach((service) => {
        const option = document.createElement('option');
        option.value = service.title;
        option.textContent = service.title;
        select.appendChild(option);
    });
}

function setupContactForm() {
    const form = document.querySelector('[data-contact-form]');
    const status = document.querySelector('[data-form-status]');

    if (!form || !status) {
        return;
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        status.textContent = state.translations?.contact?.form?.notice || '';
    });
}

function getGalleryEntries() {
    return Object.entries(state.translations?.gallery || {});
}

function renderGallery() {
    const container = document.querySelector('[data-gallery-grid]');
    const entries = getGalleryEntries();

    state.galleryEntries = [];

    if (!container) {
        return;
    }

    container.innerHTML = '';

    entries.forEach(([filename, details]) => {
        const src = `photos/${filename}`;
        imageExists(src).then((exists) => {
            if (!exists) {
                return;
            }

            const index = state.galleryEntries.length;
            state.galleryEntries.push([filename, details]);

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'gallery-card';
            button.dataset.galleryIndex = String(index);
            button.innerHTML = `
                <figure>
                    <img src="${src}" alt="${details.title}" loading="lazy">
                    <figcaption>
                        <p class="gallery-card-title">${details.title}</p>
                        <p class="gallery-card-description">${details.description}</p>
                    </figcaption>
                </figure>
            `;
            button.addEventListener('click', () => openLightbox(index));
            container.appendChild(button);
        });
    });
}

function imageExists(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = src;
    });
}

function pruneMissingStaticImages() {
    const images = document.querySelectorAll('img[data-check-exists]');

    images.forEach((img) => {
        const src = img.getAttribute('src');
        if (!src) {
            return;
        }

        imageExists(src).then((exists) => {
            if (exists) {
                return;
            }

            const parent = img.parentElement;
            img.remove();

            if (parent && parent.children.length === 0) {
                const hero = parent.closest('.hero-visual');
                if (hero) {
                    hero.classList.add('hidden');
                }
            }
        });
    });
}

function setupLightbox() {
    const overlay = document.querySelector('[data-lightbox]');
    const closeButton = document.querySelector('[data-lightbox-close]');
    const prevButton = document.querySelector('[data-lightbox-prev]');
    const nextButton = document.querySelector('[data-lightbox-next]');

    if (!overlay || !closeButton || !prevButton || !nextButton) {
        return;
    }

    closeButton.addEventListener('click', closeLightbox);
    prevButton.addEventListener('click', () => navigateLightbox(-1));
    nextButton.addEventListener('click', () => navigateLightbox(1));

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            closeLightbox();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (overlay.hidden) {
            return;
        }

        if (event.key === 'Escape') {
            closeLightbox();
        }

        if (event.key === 'ArrowLeft') {
            navigateLightbox(-1);
        }

        if (event.key === 'ArrowRight') {
            navigateLightbox(1);
        }
    });
}

function openLightbox(index) {
    const overlay = document.querySelector('[data-lightbox]');
    const image = document.querySelector('[data-lightbox-image]');
    const title = document.getElementById('lightbox-title');
    const description = document.getElementById('lightbox-description');
    const closeButton = document.querySelector('[data-lightbox-close]');
    const entry = state.galleryEntries[index];

    if (!overlay || !image || !title || !description || !closeButton || !entry) {
        return;
    }

    const [filename, details] = entry;
    state.lightboxIndex = index;
    state.lastFocusedElement = document.activeElement;

    image.src = `photos/${filename}`;
    image.alt = details.title;
    title.textContent = details.title;
    description.textContent = details.description;
    overlay.hidden = false;
    closeButton.focus();
    document.body.classList.add('overflow-hidden');
}

function closeLightbox() {
    const overlay = document.querySelector('[data-lightbox]');
    const image = document.querySelector('[data-lightbox-image]');

    if (!overlay || overlay.hidden) {
        return;
    }

    overlay.hidden = true;
    document.body.classList.remove('overflow-hidden');

    if (image) {
        image.src = '';
        image.alt = '';
    }

    if (state.lastFocusedElement instanceof HTMLElement) {
        state.lastFocusedElement.focus();
    }
}

function navigateLightbox(direction) {
    if (!state.galleryEntries.length) {
        return;
    }

    const nextIndex = (state.lightboxIndex + direction + state.galleryEntries.length) % state.galleryEntries.length;
    openLightbox(nextIndex);
}

function createSimpleCard(title, description) {
    const article = document.createElement('article');
    article.className = 'card-item';
    article.innerHTML = `
        <h3>${title}</h3>
        <p class="text-gray-700 leading-7">${description}</p>
    `;
    return article;
}

function updateCurrentYear() {
    document.querySelectorAll('[data-current-year]').forEach((element) => {
        element.textContent = new Date().getFullYear();
    });
}
