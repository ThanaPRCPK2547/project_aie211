// ─── Toast Notification ───────────────────────────────────────────────────────
function showToast(title, msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fa-solid ${icons[type] || icons.info} toast-icon"></i>
        <div class="toast-body"><div class="toast-title">${title}</div><div class="toast-msg">${msg}</div></div>
        <button class="toast-close"><i class="fa-solid fa-xmark"></i></button>
    `;
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => removeToast(toast));
    setTimeout(() => removeToast(toast), 4000);
}

function removeToast(toast) {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
}

// ─── Search Overlay ────────────────────────────────────────────────────────────
function initSearchOverlay() {
    const overlay = document.getElementById('searchOverlay');
    const input = document.getElementById('searchOverlayInput');
    const toggle = document.getElementById('searchToggle');
    const closeBtn = document.getElementById('searchOverlayClose');
    if (!overlay) return;

    function openSearch() {
        overlay.classList.add('active');
        setTimeout(() => input && input.focus(), 50);
    }

    function closeSearch() {
        overlay.classList.remove('active');
        if (input) input.value = '';
        filterAllCards('');
    }

    if (toggle) toggle.addEventListener('click', openSearch);
    if (closeBtn) closeBtn.addEventListener('click', closeSearch);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSearch(); });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeSearch();
        if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); openSearch(); }
    });

    if (input) {
        input.addEventListener('input', () => filterAllCards(input.value.trim().toLowerCase()));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { closeSearch(); }
        });
    }
}

// ─── Filter + Empty State ──────────────────────────────────────────────────────
function filterAllCards(query) {
    const grids = document.querySelectorAll('.grid-3');
    grids.forEach(grid => {
        const cards = grid.querySelectorAll('.card');
        let visible = 0;
        cards.forEach(card => {
            const text = card.textContent.toLowerCase();
            const show = !query || text.includes(query);
            card.style.display = show ? 'flex' : 'none';
            if (show) { card.style.animation = 'fadeIn 0.3s ease forwards'; visible++; }
        });
        const emptyState = grid.querySelector('.empty-state');
        if (emptyState) emptyState.classList.toggle('visible', visible === 0);
    });
}

// ─── Mobile Nav ────────────────────────────────────────────────────────────────
function initMobileNav() {
    const hamburger = document.getElementById('navHamburger');
    const mobileNav = document.getElementById('mobileNav');
    if (!hamburger || !mobileNav) return;
    hamburger.addEventListener('click', () => {
        mobileNav.classList.toggle('open');
        const icon = hamburger.querySelector('i');
        icon.className = mobileNav.classList.contains('open') ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initSearchOverlay();
    initMobileNav();
    const PRODUCT_STORAGE_KEY = 'aiContentBase_products';
    const LEGACY_STORAGE_KEY = 'aiContentBase_items';
    const USD_TO_THB_RATE = 36;
    const MIN_COURSE_PRICE_THB = 301;
    const MAX_COURSE_PRICE_THB = 1500;
    const COURSE_CATEGORIES = new Set(['course', 'machine learning', 'prompt engineering', 'ai art']);
    const TOOL_CATEGORIES = new Set(['ai tool', 'template', 'chatbot', 'coding', 'image gen']);
    const NEWS_CATEGORIES = new Set(['e-book', 'article', 'model updates', 'industry', 'tutorials']);

    function parseStoredArray(key) {
        try {
            const raw = localStorage.getItem(key);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (_error) {
            return [];
        }
    }

    function bindFilterButtons() {
        const filterButtons = document.querySelectorAll('.filters .filter-btn');
        if (filterButtons.length === 0) return;

        filterButtons.forEach(btn => {
            if (btn.dataset.bound === 'true') return;
            btn.dataset.bound = 'true';

            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filterValue = (btn.dataset.filter || btn.textContent || '').trim().toLowerCase();
                const showAll = ['all', 'latest', 'ทั้งหมด'].includes(filterValue);

                // Find the closest grid to these filter buttons
                const filtersEl = btn.closest('.filters');
                const grid = filtersEl ? filtersEl.nextElementSibling : document.querySelector('.grid-3');
                if (!grid) return;

                const cards = grid.querySelectorAll('.card');
                let visible = 0;

                cards.forEach(card => {
                    const category = (card.dataset.category || card.textContent || '').toLowerCase();
                    const matches = showAll || category.includes(filterValue);
                    card.style.display = matches ? 'flex' : 'none';
                    if (matches) { card.style.animation = 'fadeIn 0.4s ease forwards'; visible++; }
                });

                const emptyState = grid.querySelector('.empty-state');
                if (emptyState) emptyState.classList.toggle('visible', visible === 0);
            });
        });
    }

    function bindEnrollButtons() {
        const enrollBtns = document.querySelectorAll('.enroll-btn');
        if (enrollBtns.length === 0) return;

        enrollBtns.forEach(btn => {
            if (btn.dataset.bound === 'true') return;
            btn.dataset.bound = 'true';

            btn.addEventListener('click', (e) => {
                e.preventDefault();

                const courseCard = e.target.closest('.card');
                let courseTitle = 'this course';
                if (courseCard) {
                    const titleEl = courseCard.querySelector('.tool-title, .card-title');
                    if (titleEl) courseTitle = titleEl.textContent;
                }

                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
                btn.style.pointerEvents = 'none';

                setTimeout(() => {
                    btn.innerHTML = '<i class="fa-solid fa-check"></i> Enrolled!';
                    btn.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
                    btn.style.color = '#86efac';
                    showToast('Enrolled!', `You have successfully enrolled in: ${courseTitle}`, 'success');
                }, 1000);
            });
        });
    }

    function initCardInteractivity() {
        bindFilterButtons();
        bindEnrollButtons();
    }

    function convertUsdToThbText(text) {
        return text.replace(/\$([0-9]+(?:\.[0-9]+)?)/g, (_match, amount) => {
            const usd = Number(amount);
            if (Number.isNaN(usd)) return _match;
            const thb = usd * USD_TO_THB_RATE;
            return `฿${thb.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        });
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function normalizeCategoryKey(category) {
        return typeof category === 'string' ? category.trim().toLowerCase() : '';
    }

    function getContentTypeByCategory(category) {
        const categoryKey = normalizeCategoryKey(category);
        if (COURSE_CATEGORIES.has(categoryKey)) return 'course';
        if (TOOL_CATEGORIES.has(categoryKey)) return 'tool';
        if (NEWS_CATEGORIES.has(categoryKey)) return 'news';
        return 'other';
    }

    function updateCurrencyDisplay(lang) {
        const priceElements = document.querySelectorAll('.tool-price, .new-item-price');
        priceElements.forEach(el => {
            if (el.dataset.priceThb) {
                const thbValue = Number(el.dataset.priceThb);
                if (Number.isNaN(thbValue)) return;

                const usdText = el.dataset.usdText || `$${(thbValue / USD_TO_THB_RATE).toFixed(2)}`;
                const thbText = el.dataset.thbText || `฿${thbValue.toLocaleString('th-TH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}`;
                el.textContent = lang === 'th' ? thbText : usdText;
                return;
            }

            if (!el.dataset.usdText) {
                el.dataset.usdText = el.textContent.trim();
            }

            const usdText = el.dataset.usdText;
            if (!usdText.includes('$')) return;

            if (lang === 'th') {
                el.textContent = convertUsdToThbText(usdText);
            } else {
                el.textContent = usdText;
            }
        });
    }

    initCardInteractivity();
    window.addEventListener('dynamicContentLoaded', initCardInteractivity);

    const translations = {
        en: {
            nav_home: 'Home',
            nav_tools: 'Tools',
            nav_courses: 'Courses',
            nav_news: 'News',
            nav_login: 'Login',
            nav_get_started: 'Get Started',
            hero_pill: '<i class="fa-solid fa-bolt"></i> The #1 AI Content Platform',
            hero_desc: 'Discover thousands of AI tools, articles, online courses, stunning AI art, and the latest news — all in one powerful hub.',
            hero_btn_browse: 'Browse Content &nbsp;<i class="fa-solid fa-arrow-right"></i>',
            hero_btn_buy: '<i class="fa-solid fa-book-open"></i>&nbsp; Buy a Course',
            feat_title: 'Featured <span class="text-gradient-alt">Content</span>',
            feat_desc: 'Hand-picked articles, tools, and guides from across the AI landscape.',
            footer_rights: '© 2026 AI ContentBase. All rights reserved.',
            footer_built: 'Built with ❤️ for the AI community',
            courses_title: 'AI <span class="text-gradient">Online Courses</span>',
            courses_desc: 'Level up your AI skills with top-tier courses from industry experts.',
            cat_all: 'All',
            cat_chatbot: 'Chatbot',
            cat_image: 'Image Gen',
            cat_coding: 'Coding',
            cat_prompt_engineering: 'Prompt Engineering',
            cat_machine_learning: 'Machine Learning',
            cat_ai_art: 'AI Art',
            course_1_title: 'Prompt Engineering Masterclass',
            course_1_desc: 'From beginner to expert — learn how to craft perfect prompts for any AI model including ChatGPT and Claude.',
            course_2_title: 'Deep Learning Specialization',
            course_2_desc: 'Master the foundations of deep learning, understand how to build neural networks, and lead successful machine learning projects.',
            course_3_title: 'AI Art Generation with Midjourney',
            course_3_desc: 'Learn to create stunning, professional-grade artwork and concepts using Midjourney v6.',
            course_4_title: 'Python for AI & Data Science',
            course_4_desc: 'The ultimate Python bootcamp focused entirely on libraries needed for AI, including Pandas, NumPy, and PyTorch.',
            course_5_title: 'LLM App Development',
            course_5_desc: 'Learn how to build production-ready applications powered by Large Language Models and vector databases.',
            course_6_title: 'AI Agents & Automation',
            course_6_desc: 'Create autonomous AI agents capable of reasoning, using external tools, and automating complex workflows.',
            tag_beginner_friendly: 'Beginner Friendly',
            tag_certificate: 'Certificate',
            tag_advanced: 'Advanced',
            tag_python: 'Python',
            tag_design: 'Design',
            tag_creative: 'Creative',
            tag_beginner: 'Beginner',
            tag_backend: 'Backend',
            tag_intermediate: 'Intermediate',
            tag_automation: 'Automation',
            tag_coding: 'Coding',
            btn_visit: 'Visit <i class="fa-solid fa-arrow-up-right-from-square"></i>',
            btn_enroll: 'Enroll <i class="fa-solid fa-arrow-right"></i>',
            reg_title: 'Create an Account',
            reg_desc: 'Join AI ContentBase to unlock premium tools and courses',
            reg_fname: 'First Name',
            reg_lname: 'Last Name',
            reg_email: 'Email Address',
            reg_password: 'Password',
            reg_btn_submit: 'Sign Up',
            reg_or: 'Or register with',
            reg_already: 'Already have an account?',
            reg_login_link: 'Sign in',
            nav_logout: 'Logout'
        },
        th: {
            nav_home: 'หน้าแรก',
            nav_tools: 'เครื่องมือ',
            nav_courses: 'คอร์สเรียน',
            nav_news: 'ข่าวสาร',
            nav_login: 'เข้าสู่ระบบ',
            nav_get_started: 'เริ่มต้นใช้งาน',
            hero_pill: '<i class="fa-solid fa-bolt"></i> แพลตฟอร์มคอนเทนต์ AI อันดับ 1',
            hero_desc: 'ค้นพบเครื่องมือ AI บทความ คอร์สเรียนออนไลน์ งานศิลปะ AI ที่น่าทึ่ง และข่าวสารล่าสุด — ทั้งหมดในที่เดียว',
            hero_btn_browse: 'เลือกดูเนื้อหา &nbsp;<i class="fa-solid fa-arrow-right"></i>',
            hero_btn_buy: '<i class="fa-solid fa-book-open"></i>&nbsp; ซื้อคอร์สเรียน',
            feat_title: 'เนื้อหา<span class="text-gradient-alt">แนะนำ</span>',
            feat_desc: 'บทความ เครื่องมือ และคู่มือที่คัดสรรมาเป็นอย่างดีจากวงการ AI',
            footer_rights: '© 2026 AI ContentBase สงวนลิขสิทธิ์',
            footer_built: 'สร้างด้วย ❤️ เพื่อชุมชน AI',
            courses_title: 'คอร์สเรียน <span class="text-gradient">AI ออนไลน์</span>',
            courses_desc: 'อัปสกิลด้าน AI ของคุณด้วยคอร์สคุณภาพจากผู้เชี่ยวชาญในอุตสาหกรรม',
            cat_all: 'ทั้งหมด',
            cat_chatbot: 'แชทบอท',
            cat_image: 'สร้างรูปภาพ',
            cat_coding: 'เขียนโค้ด',
            cat_prompt_engineering: 'วิศวกรรมพรอมป์',
            cat_machine_learning: 'แมชชีนเลิร์นนิง',
            cat_ai_art: 'ศิลปะด้วย AI',
            course_1_title: 'คอร์ส Prompt Engineering ระดับมาสเตอร์',
            course_1_desc: 'เรียนตั้งแต่พื้นฐานจนเชี่ยวชาญ เพื่อเขียนพรอมป์ให้ได้ผลลัพธ์ดีที่สุดกับโมเดล AI อย่าง ChatGPT และ Claude',
            course_2_title: 'หลักสูตรเชิงลึก Deep Learning',
            course_2_desc: 'เข้าใจพื้นฐานของดีปเลิร์นนิง เรียนรู้การสร้างโครงข่ายประสาทเทียม และการนำโปรเจกต์แมชชีนเลิร์นนิงไปใช้จริง',
            course_3_title: 'สร้างงานศิลปะ AI ด้วย Midjourney',
            course_3_desc: 'เรียนรู้การสร้างภาพและคอนเซปต์ระดับมืออาชีพด้วย Midjourney v6',
            course_4_title: 'Python สำหรับ AI และ Data Science',
            course_4_desc: 'บูตแคมป์ Python แบบเข้มข้นที่เน้นไลบรารีสำคัญด้าน AI เช่น Pandas, NumPy และ PyTorch',
            course_5_title: 'พัฒนาแอปด้วย LLM',
            course_5_desc: 'เรียนการสร้างแอปพร้อมใช้งานจริงที่ขับเคลื่อนด้วย Large Language Models และเวกเตอร์ดาต้าเบส',
            course_6_title: 'AI Agents และระบบอัตโนมัติ',
            course_6_desc: 'สร้าง AI Agent ที่คิดวิเคราะห์ ใช้เครื่องมือภายนอก และทำงานอัตโนมัติในเวิร์กโฟลว์ที่ซับซ้อนได้',
            tag_beginner_friendly: 'เหมาะสำหรับผู้เริ่มต้น',
            tag_certificate: 'มีใบประกาศนียบัตร',
            tag_advanced: 'ระดับสูง',
            tag_python: 'Python',
            tag_design: 'ออกแบบ',
            tag_creative: 'สร้างสรรค์',
            tag_beginner: 'ระดับเริ่มต้น',
            tag_backend: 'แบ็กเอนด์',
            tag_intermediate: 'ระดับกลาง',
            tag_automation: 'อัตโนมัติ',
            tag_coding: 'เขียนโค้ด',
            btn_visit: 'เข้าชม <i class="fa-solid fa-arrow-up-right-from-square"></i>',
            btn_enroll: 'ลงทะเบียน <i class="fa-solid fa-arrow-right"></i>',
            reg_title: 'สร้างบัญชีผู้ใช้',
            reg_desc: 'เข้าร่วม AI ContentBase เพื่อปลดล็อคเครื่องมือและคอร์สพรีเมียม',
            reg_fname: 'ชื่อ',
            reg_lname: 'นามสกุล',
            reg_email: 'อีเมล',
            reg_password: 'รหัสผ่าน',
            reg_btn_submit: 'สมัครสมาชิก',
            reg_or: 'หรือสมัครด้วย',
            reg_already: 'มีบัญชีอยู่แล้วใช่มั้ย?',
            reg_login_link: 'เข้าสู่ระบบ',
            nav_logout: 'ออกจากระบบ'
        }
    };

    function setLanguage(lang) {
        if (!translations[lang]) return;
        localStorage.setItem('lang', lang);
        document.documentElement.lang = lang;

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang][key]) {
                el.innerHTML = translations[lang][key];
            }
        });

        const langSwitchers = document.querySelectorAll('.lang-switch');
        langSwitchers.forEach(s => {
            if (s.value !== lang) s.value = lang;
        });

        updateCurrencyDisplay(lang);
    }

    const savedLang = localStorage.getItem('lang') || 'en';
    setLanguage(savedLang);

    document.querySelectorAll('.lang-switch').forEach(switcher => {
        switcher.addEventListener('change', (e) => {
            setLanguage(e.target.value);
        });
    });

    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
        const pathname = window.location.pathname.toLowerCase();
        const isAppPage = !pathname.includes('admin.html') &&
            !pathname.includes('data_analyst.html') &&
            !pathname.includes('login.html') &&
            !pathname.includes('register.html');

        if (isAppPage) {
            const navRight = document.querySelector('.nav-right');
            if (navRight) {
                const loginBtn = navRight.querySelector('a[href="login.html"]');
                const getStartedBtn = navRight.querySelector('button.btn-primary');
                if (loginBtn) loginBtn.remove();
                if (getStartedBtn) getStartedBtn.remove();

                const userProfile = document.createElement('div');
                userProfile.style.display = 'flex';
                userProfile.style.alignItems = 'center';
                userProfile.style.gap = '16px';

                const initials = userEmail.charAt(0).toUpperCase();
                const displayName = userEmail.split('@')[0];
                let profileLink = '#';
                if (userEmail.toLowerCase().includes('admin')) profileLink = 'admin.html';
                if (userEmail.toLowerCase().includes('data')) profileLink = 'data_analyst.html';

                userProfile.innerHTML = `
                    <a href="${profileLink}" style="display: flex; align-items: center; gap: 8px; text-decoration: none; cursor: ${profileLink === '#' ? 'default' : 'pointer'};">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--surface-light); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-weight: 700; color: white;">
                            ${initials}
                        </div>
                        <span style="font-size: 0.9rem; font-weight: 500; color: white;">${displayName}</span>
                    </a>
                    <a href="#" id="logoutBtn" style="font-size: 0.9rem; font-weight: 500; color: #ef4444; transition: color 0.2s;" data-i18n="nav_logout">${translations[savedLang].nav_logout || 'Logout'}</a>
                `;

                navRight.appendChild(userProfile);

                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        localStorage.removeItem('userEmail');
                        window.location.reload();
                    });
                }
            }
        }
    }

    function getCurrentPageType(pathname) {
        if (pathname.includes('tools.html')) return 'tools';
        if (pathname.includes('courses.html')) return 'courses';
        if (pathname.includes('news.html')) return 'news';
        if (pathname.includes('index.html') || pathname === '/' || pathname.endsWith('/')) return 'home';
        return 'other';
    }

    function shouldRenderCategoryOnPage(category, pageType) {
        const contentType = getContentTypeByCategory(category);
        if (pageType === 'home') return true;
        if (pageType === 'tools') return contentType === 'tool';
        if (pageType === 'courses') return contentType === 'course';
        if (pageType === 'news') return contentType === 'news';
        return false;
    }

    function getCategoryLink(category) {
        const contentType = getContentTypeByCategory(category);
        if (contentType === 'course') return 'courses.html';
        if (contentType === 'tool') return 'tools.html';
        if (contentType === 'news') return 'news.html';
        return '#';
    }

    function getVisualByCategory(category) {
        const categoryKey = normalizeCategoryKey(category);
        const contentType = getContentTypeByCategory(category);

        if (categoryKey === 'chatbot') {
            return {
                iconClass: 'fa-robot',
                iconBg: '#10b981',
                description: 'Conversational AI assistant designed for customer support and everyday productivity.',
                tags: ['Chatbot', 'Automation'],
                rating: '4.8'
            };
        }
        if (categoryKey === 'coding') {
            return {
                iconClass: 'fa-code',
                iconBg: '#3b82f6',
                description: 'AI coding assistant that helps you write, refactor, and debug code much faster.',
                tags: ['Coding', 'Developer'],
                rating: '4.8'
            };
        }
        if (categoryKey === 'ai tool') {
            return {
                iconClass: 'fa-wrench',
                iconBg: '#10b981',
                description: 'A practical AI tool to speed up your workflow and boost daily productivity.',
                tags: ['Productivity', 'Automation'],
                rating: '4.9'
            };
        }
        if (categoryKey === 'machine learning') {
            return {
                iconClass: 'fa-brain',
                iconBg: '#3b82f6',
                description: 'Master the foundations of deep learning, neural networks, and production ML workflows.',
                tags: ['Advanced', 'Python'],
                rating: '4.8'
            };
        }
        if (categoryKey === 'prompt engineering') {
            return {
                iconClass: 'fa-message',
                iconBg: '#f59e0b',
                description: 'Learn advanced prompting techniques for reliable outputs across leading AI models.',
                tags: ['Beginner Friendly', 'Certificate'],
                rating: '4.9'
            };
        }
        if (categoryKey === 'ai art') {
            return {
                iconClass: 'fa-image',
                iconBg: '#ec4899',
                description: 'Create professional visual content with modern AI image generation techniques.',
                tags: ['Design', 'Creative'],
                rating: '4.7'
            };
        }
        if (contentType === 'course') {
            return {
                iconClass: 'fa-graduation-cap',
                iconBg: '#f59e0b',
                description: 'From beginner to expert — learn how to craft perfect prompts for any AI model including ChatGPT and Claude.',
                tags: ['Beginner Friendly', 'Certificate'],
                rating: '4.9'
            };
        }
        if (categoryKey === 'template') {
            return {
                iconClass: 'fa-layer-group',
                iconBg: '#14b8a6',
                description: 'Reusable template set designed to help you launch faster with minimal setup.',
                tags: ['Ready to Use', 'Editable'],
                rating: '4.8'
            };
        }
        if (categoryKey === 'e-book') {
            return {
                iconClass: 'fa-book',
                iconBg: '#ec4899',
                description: 'A concise guide packed with practical examples and actionable strategies.',
                tags: ['PDF', 'Self-paced'],
                rating: '4.8'
            };
        }
        return {
            iconClass: 'fa-box-open',
            iconBg: '#3b82f6',
            description: 'New product added by administrator.',
            tags: ['Featured', 'New'],
            rating: '4.7'
        };
    }

    const pathname = window.location.pathname.toLowerCase();
    const currentPageType = getCurrentPageType(pathname);
    const savedProducts = parseStoredArray(PRODUCT_STORAGE_KEY);
    const legacyProducts = parseStoredArray(LEGACY_STORAGE_KEY);
    const dynamicItems = savedProducts.length > 0 ? savedProducts : legacyProducts;

    if (dynamicItems.length > 0 && currentPageType !== 'other') {
        const targetGrid = document.querySelector('.grid-3');
        if (targetGrid) {
            targetGrid.querySelectorAll('.new-dynamic-card').forEach(card => card.remove());
            const fragment = document.createDocumentFragment();
            const orderedItems = [...dynamicItems].sort((a, b) => {
                const dateA = new Date(a?.dateAdded || 0).getTime();
                const dateB = new Date(b?.dateAdded || 0).getTime();
                return dateB - dateA;
            });

            let insertedCount = 0;
            orderedItems.forEach(item => {
                const title = typeof item.title === 'string' ? item.title.trim() : '';
                const category = typeof item.category === 'string' ? item.category.trim() : 'Product';
                if (!title || !shouldRenderCategoryOnPage(category, currentPageType)) return;

                const { iconClass, iconBg, description, tags, rating } = getVisualByCategory(category);
                const card = document.createElement('a');
                card.href = getCategoryLink(category);
                card.className = 'card tool-card new-dynamic-card';
                card.style.animation = 'fadeIn 0.5s ease forwards';

                const priceNumber = Number(item.price);
                let normalizedPrice = priceNumber;
                let normalizedCurrency = item.currency === 'THB' ? 'THB' : 'USD';
                const contentType = getContentTypeByCategory(category);

                // For courses shown on home/public pages, keep the displayed price in 301-1500 THB range.
                if (contentType === 'course' && !Number.isNaN(priceNumber) && priceNumber > 0) {
                    const thbFromSource = item.currency === 'THB'
                        ? priceNumber
                        : priceNumber * USD_TO_THB_RATE;
                    normalizedPrice = clamp(thbFromSource, MIN_COURSE_PRICE_THB, MAX_COURSE_PRICE_THB);
                    normalizedCurrency = 'THB';
                }

                const isThbItem = normalizedCurrency === 'THB';
                let priceText = 'Free';
                if (!Number.isNaN(normalizedPrice) && normalizedPrice > 0) {
                    if (isThbItem) {
                        const thbText = `฿${normalizedPrice.toLocaleString('th-TH', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}`;
                        const usdText = `$${(normalizedPrice / USD_TO_THB_RATE).toFixed(2)}`;
                        priceText = savedLang === 'th' ? thbText : usdText;
                    } else {
                        priceText = `$${normalizedPrice.toFixed(2)}`;
                    }
                }
                const isCourse = contentType === 'course';
                const actionKey = isCourse ? 'btn_enroll' : 'btn_visit';
                const actionText = translations[savedLang][actionKey] || (isCourse ? 'Enroll <i class="fa-solid fa-arrow-right"></i>' : 'Visit <i class="fa-solid fa-arrow-up-right-from-square"></i>');
                const tagsHtml = tags.map(tag => `<span class="tool-tag">${tag}</span>`).join('');

                card.innerHTML = `
                    <div class="card-header">
                        <div class="card-icon" style="background:${iconBg};"><i class="fa-solid ${iconClass}"></i></div>
                        <div class="tool-title-wrap">
                            <div class="tool-title new-item-title"></div>
                            <div class="tool-cat new-item-category"></div>
                        </div>
                        <div class="tool-rating"><i class="fa-solid fa-star"></i> ${rating}</div>
                    </div>
                    <p class="tool-desc new-item-desc"></p>
                    <div class="tool-tags">
                        ${tagsHtml}
                    </div>
                    <div class="tool-footer">
                        <div class="tool-price new-item-price"></div>
                        <div class="${isCourse ? 'tool-visit enroll-btn' : 'tool-visit'}" data-i18n="${actionKey}">${actionText}</div>
                    </div>
                `;

                const descEl = card.querySelector('.new-item-desc');
                const categoryEl = card.querySelector('.new-item-category');
                const priceEl = card.querySelector('.new-item-price');
                const titleEl = card.querySelector('.new-item-title');

                if (descEl) descEl.textContent = description;
                if (categoryEl) categoryEl.textContent = category;
                if (priceEl) {
                    if (isThbItem && !Number.isNaN(normalizedPrice) && normalizedPrice > 0) {
                        priceEl.dataset.priceThb = String(normalizedPrice);
                        priceEl.dataset.usdText = `$${(normalizedPrice / USD_TO_THB_RATE).toFixed(2)}`;
                        priceEl.dataset.thbText = `฿${normalizedPrice.toLocaleString('th-TH', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}`;
                    } else {
                        delete priceEl.dataset.priceThb;
                        delete priceEl.dataset.thbText;
                        priceEl.dataset.usdText = priceText;
                    }
                    priceEl.textContent = priceText;
                }
                if (titleEl) titleEl.textContent = title;

                fragment.appendChild(card);
                insertedCount += 1;
            });

            if (insertedCount > 0) {
                targetGrid.prepend(fragment);
                window.dispatchEvent(new Event('dynamicContentLoaded'));
            }
        }
    }

    updateCurrencyDisplay(savedLang);
});
