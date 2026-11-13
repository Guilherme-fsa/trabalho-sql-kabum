document.addEventListener('DOMContentLoaded', () => {
    /* ======================================================================
       1. GERENCIAMENTO DE TEMA (LIGHT / DARK MODE)
       ====================================================================== */
    const htmlElement = document.documentElement;
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const themeLabel = document.getElementById('theme-label');

    const applyTheme = (theme) => {
        htmlElement.setAttribute('data-theme', theme);
        localStorage.setItem('kabum-dict-theme', theme);
        if (theme === 'dark') {
            themeIcon.className = 'fa-solid fa-sun';
            themeLabel.textContent = 'Modo Claro';
        } else {
            themeIcon.className = 'fa-solid fa-moon';
            themeLabel.textContent = 'Modo Escuro';
        }
    };

    const savedTheme = localStorage.getItem('kabum-dict-theme') || 'light';
    applyTheme(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        applyTheme(currentTheme === 'light' ? 'dark' : 'light');
    });

    /* ======================================================================
       2. SIDEBAR RESPONSIVA & SCROLL-SPY DE NAVEGACAO
       ====================================================================== */
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const navLinks = document.querySelectorAll('.nav-link');
    const dictSections = document.querySelectorAll('.dict-section');

    const closeMobileSidebar = () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
    };

    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        sidebarOverlay.classList.toggle('active');
    });

    sidebarOverlay.addEventListener('click', closeMobileSidebar);

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 860) {
                closeMobileSidebar();
            }
        });
    });

    const updateActiveNavOnScroll = () => {
        let currentSectionId = '';
        const scrollPosition = window.scrollY + 140;

        dictSections.forEach(section => {
            if (section.classList.contains('hidden')) return;
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        if (currentSectionId) {
            navLinks.forEach(link => {
                link.classList.toggle('active', link.getAttribute('data-target') === currentSectionId);
            });
        }
    };

    window.addEventListener('scroll', updateActiveNavOnScroll, { passive: true });

    /* ======================================================================
       3. BARRA DE PESQUISA EM TEMPO REAL (TABELAS E ATRIBUTOS)
       ====================================================================== */
    const searchInput = document.getElementById('dictionary-search');
    const clearSearchBtn = document.getElementById('btn-clear-search');
    const searchStats = document.getElementById('search-stats');
    const noResultsBox = document.getElementById('no-results-box');

    const normalizeText = (text) => {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    };

    const filterDictionary = () => {
        const rawQuery = searchInput.value.trim();
        const query = normalizeText(rawQuery);

        clearSearchBtn.classList.toggle('hidden', rawQuery.length === 0);

        let visibleTablesCount = 0;
        let visibleAttributesCount = 0;

        dictSections.forEach(section => {
            const tableName = normalizeText(section.getAttribute('data-table-name') || '');
            const sectionDesc = normalizeText(section.querySelector('.section-description')?.textContent || '');
            const tableMatchesDirectly = query.length > 0 && (tableName.includes(query) || sectionDesc.includes(query));

            const rows = section.querySelectorAll('tbody tr');
            let sectionVisibleRows = 0;

            rows.forEach(row => {
                const rowText = normalizeText(row.textContent || '');
                const isMatch = query.length === 0 || tableMatchesDirectly || rowText.includes(query);

                row.classList.toggle('hidden', !isMatch);
                if (isMatch) {
                    sectionVisibleRows++;
                    visibleAttributesCount++;
                }
            });

            const showSection = sectionVisibleRows > 0;
            section.classList.toggle('hidden', !showSection);

            if (showSection) {
                visibleTablesCount++;
            }

            // Sincroniza visibilidade do item correspondente na Sidebar
            const navItem = document.querySelector(`.nav-link[data-target="${section.id}"]`)?.parentElement;
            if (navItem) {
                navItem.classList.toggle('hidden', !showSection);
            }
        });

        noResultsBox.classList.toggle('hidden', visibleTablesCount > 0);
        searchStats.textContent = `Exibindo ${visibleTablesCount} ${visibleTablesCount === 1 ? 'tabela' : 'tabelas'} e ${visibleAttributesCount} ${visibleAttributesCount === 1 ? 'atributo' : 'atributos'}`;
    };

    searchInput.addEventListener('input', filterDictionary);

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        filterDictionary();
        searchInput.focus();
    });

    /* ======================================================================
       4. CONTROLE DE MODAIS (DER E DDL)
       ====================================================================== */
    const modalDer = document.getElementById('modal-der');
    const modalDdl = document.getElementById('modal-ddl');
    const btnOpenDer = document.getElementById('btn-open-der');
    const btnOpenDdl = document.getElementById('btn-open-ddl');
    const closeModalButtons = document.querySelectorAll('[data-close-modal]');

    const openModal = (modal) => {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    };

    const closeModal = (modal) => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    };

    btnOpenDer.addEventListener('click', () => {
        openModal(modalDer);
        if (panzoomInstance) {
            panzoomInstance.reset({ animate: false });
            updateZoomIndicator();
        }
    });

    btnOpenDdl.addEventListener('click', () => {
        openModal(modalDdl);
        if (window.Prism) {
            Prism.highlightAll();
        }
    });

    closeModalButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-close-modal');
            const targetModal = document.getElementById(targetId);
            if (targetModal) closeModal(targetModal);
        });
    });

    [modalDer, modalDdl].forEach(modal => {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal(modal);
            }
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (!modalDer.classList.contains('hidden')) closeModal(modalDer);
            if (!modalDdl.classList.contains('hidden')) closeModal(modalDdl);
        }
    });

    /* ======================================================================
       5. VISUALIZADOR DO DER COM PANZOOM.JS (ZOOM + PAN + RESET)
       ====================================================================== */
    const panzoomElem = document.getElementById('panzoom-container');
    const derViewport = document.getElementById('der-viewport');
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnZoomReset = document.getElementById('btn-zoom-reset');
    const zoomIndicator = document.getElementById('zoom-level-indicator');

    let panzoomInstance = null;

    const updateZoomIndicator = () => {
        if (!panzoomInstance) return;
        const scale = panzoomInstance.getScale();
        zoomIndicator.textContent = `${Math.round(scale * 100)}%`;
    };

    if (window.Panzoom && panzoomElem) {
        panzoomInstance = Panzoom(panzoomElem, {
            maxScale: 5,
            minScale: 0.4,
            step: 0.25,
            contain: 'outside'
        });

        // Zoom In e Zoom Out via scroll do mouse
        derViewport.addEventListener('wheel', (event) => {
            event.preventDefault();
            panzoomInstance.zoomWithWheel(event);
            updateZoomIndicator();
        }, { passive: false });

        panzoomElem.addEventListener('panzoomzoom', updateZoomIndicator);

        btnZoomIn.addEventListener('click', () => {
            panzoomInstance.zoomIn();
            updateZoomIndicator();
        });

        btnZoomOut.addEventListener('click', () => {
            panzoomInstance.zoomOut();
            updateZoomIndicator();
        });

        btnZoomReset.addEventListener('click', () => {
            panzoomInstance.reset();
            updateZoomIndicator();
        });
    }

    /* ======================================================================
       6. COPIAR SCRIPT DDL PARA AREA DE TRANSFERENCIA
       ====================================================================== */
    const btnCopyDdl = document.getElementById('btn-copy-ddl');
    const copyDdlText = document.getElementById('copy-ddl-text');
    const ddlCodeBlock = document.getElementById('ddl-code-block');

    btnCopyDdl.addEventListener('click', async () => {
        const sqlText = ddlCodeBlock.textContent;

        const showCopiedFeedback = () => {
            btnCopyDdl.classList.add('copied');
            copyDdlText.textContent = 'Copiado!';
            setTimeout(() => {
                btnCopyDdl.classList.remove('copied');
                copyDdlText.textContent = 'Copiar DDL';
            }, 2200);
        };

        try {
            await navigator.clipboard.writeText(sqlText);
            showCopiedFeedback();
        } catch (err) {
            // Fallback seguro para ambientes locais file://
            const tempTextArea = document.createElement('textarea');
            tempTextArea.value = sqlText;
            tempTextArea.style.position = 'fixed';
            tempTextArea.style.opacity = '0';
            document.body.appendChild(tempTextArea);
            tempTextArea.select();
            document.execCommand('copy');
            document.body.removeChild(tempTextArea);
            showCopiedFeedback();
        }
    });
});
