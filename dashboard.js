document.addEventListener('DOMContentLoaded', () => {

    // --- SHARED FUNCTIONALITY ---

    // 1. Sidebar Navigation Logic
    const navItems = document.querySelectorAll('.sidebar .nav-item');
    const contentSections = document.querySelectorAll('.content-section'); // Assumes we add this class to different views

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Prevent default if it's an anchor link without a real destination
            if (item.getAttribute('href') === '#') {
                e.preventDefault();

                // Remove active class from all
                navItems.forEach(nav => nav.classList.remove('active'));

                // Add active to clicked item
                item.classList.add('active');

                // If we explicitly set data-target on items, we can switch views
                const targetId = item.getAttribute('data-target');
                if (targetId && contentSections.length > 0) {
                    contentSections.forEach(section => {
                        section.style.display = 'none';
                    });
                    const targetSection = document.getElementById(targetId);
                    if (targetSection) {
                        targetSection.style.display = 'block';
                        // Add a small fade-in animation
                        targetSection.style.animation = 'fadeIn 0.3s ease forwards';
                    }
                }
            }
        });
    });

    // 2. Logout Functionality
    const logoutBtns = document.querySelectorAll('a[href="index.html"]');
    logoutBtns.forEach(btn => {
        if (btn.textContent.includes('Sign Out')) {
            btn.addEventListener('click', () => {
                localStorage.removeItem('userEmail');
            });
        }
    });

    // 3. User Profile Simulation
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
        // Try to update the sidebar profile if it exists
        const emailElement = document.querySelector('.sidebar [style*="color: var(--text-muted)"]'); // simplistic selector
        if (emailElement && emailElement.textContent.includes('@')) {
            emailElement.textContent = userEmail;
            const displayName = userEmail.split('@')[0];

            // Update name and initial based on email
            const nameElement = emailElement.previousElementSibling;
            if (nameElement) {
                nameElement.textContent = displayName;
            }

            const initialElement = emailElement.parentElement.previousElementSibling;
            if (initialElement) {
                initialElement.textContent = displayName.charAt(0).toUpperCase();
            }
        }
    }

    // --- ADMIN DASHBOARD SPECIFIC ---

    // Add Product Modal Logic
    const PRODUCT_STORAGE_KEY = 'aiContentBase_products';
    const MIN_PRICE_THB = 300;
    const MAX_PRICE_THB = 1500;
    function parseStoredArray(key) {
        try {
            const raw = localStorage.getItem(key);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (_error) {
            return [];
        }
    }
    const addContentBtn = document.getElementById('addContentBtn');
    const addContentModal = document.getElementById('addContentModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const addContentForm = document.getElementById('addContentForm');

    function openModal() {
        if (addContentModal) addContentModal.classList.add('active');
    }

    function closeModal() {
        if (addContentModal) addContentModal.classList.remove('active');
        if (addContentForm) addContentForm.reset();
    }

    if (addContentBtn) {
        addContentBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    }

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);

    // Close modal when clicking outside
    if (addContentModal) {
        addContentModal.addEventListener('click', (e) => {
            if (e.target === addContentModal) {
                closeModal();
            }
        });
    }

    if (addContentForm) {
        addContentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const titleEl = document.getElementById('contentTitle');
            const categoryEl = document.getElementById('contentCategory');
            const priceEl = document.getElementById('contentPrice');

            const title = titleEl ? titleEl.value.trim() : '';
            const category = categoryEl ? categoryEl.value.trim() : '';
            const numericPrice = priceEl ? Number(priceEl.value) : NaN;

            const isPriceInvalid = Number.isNaN(numericPrice) || numericPrice <= MIN_PRICE_THB || numericPrice > MAX_PRICE_THB;
            if (!title || !category || isPriceInvalid) {
                alert('Please set price more than 300 THB and less than or equal to 1500 THB.');
                return;
            }

            // SAVE TO LOCAL STORAGE FOR CROSS-PAGE RENDERING
            const newItem = {
                title: title,
                category: category,
                price: Number(numericPrice.toFixed(2)),
                currency: 'THB',
                id: Date.now().toString(),
                dateAdded: new Date().toISOString()
            };

            const existingItems = parseStoredArray(PRODUCT_STORAGE_KEY);
            existingItems.unshift(newItem);
            localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(existingItems));

            // Keep legacy key for older pages that may still read this data.
            localStorage.setItem('aiContentBase_items', JSON.stringify(existingItems));

            // Insert the new product as a fresh row.
            const tbody = document.querySelector('.table-container tbody');
            if (tbody) {
                const tr = document.createElement('tr');

                const initial = title ? title.charAt(0).toUpperCase() : 'C';
                const priceText = `฿${newItem.price.toLocaleString('th-TH', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}`;

                tr.innerHTML = `
                    <td style="display: flex; align-items: center; gap: 12px; font-weight: 500;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: #3b82f6; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700;">
                            ${initial}
                        </div>
                        ${title}
                    </td>
                    <td style="color: var(--text-muted);">${category}</td>
                    <td>${priceText}</td>
                    <td style="color: var(--text-muted);">Just now</td>
                    <td><span class="status-badge status-active">Active</span></td>
                `;
                tr.style.animation = 'fadeIn 0.5s ease forwards';
                tbody.insertBefore(tr, tbody.firstChild);
            }

            closeModal();
            alert(`Product "${title}" added successfully!`);
        });
    }


    // --- DATA ANALYST DASHBOARD SPECIFIC ---

    // Export Data Button
    const exportBtn = document.querySelector('.main-content .btn-primary');
    if (exportBtn && exportBtn.textContent.includes('Export Data')) {
        exportBtn.addEventListener('click', () => {
            alert('Generating CSV file for download... (Simulation)');
            // Simulation of download delay
            const originalText = exportBtn.innerHTML;
            exportBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Exporting...';
            exportBtn.style.pointerEvents = 'none';

            setTimeout(() => {
                exportBtn.innerHTML = '<i class="fa-solid fa-check"></i> Export Complete';
                exportBtn.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
                exportBtn.style.color = '#86efac';

                setTimeout(() => {
                    exportBtn.innerHTML = originalText;
                    exportBtn.style.backgroundColor = '';
                    exportBtn.style.color = '';
                    exportBtn.style.pointerEvents = 'auto';
                }, 2000);
            }, 1000);
        });
    }

    // Date Range Filter Simulation logic handles changing ChartJS instances
    const filterSelect = document.getElementById('analyticsRangeFilter');
    if (filterSelect && window.Chart) {
        filterSelect.addEventListener('change', (e) => {
            const selectedRange = e.target.value;

            // This is a simplified way to just trigger a re-render of existing charts with slightly altered data
            // to show that the filter "works". A real implementation would fetch new data based on the dates.
            for (let id in Chart.instances) {
                const chart = Chart.instances[id];

                if (chart.config.type === 'line' || chart.config.type === 'bar') {
                    // Randomize data slightly for visual effect
                    chart.data.datasets.forEach(dataset => {
                        dataset.data = dataset.data.map(val => {
                            // fluctuate by +/- 20%
                            const fluctuation = val * 0.2;
                            const modifier = (Math.random() * fluctuation * 2) - fluctuation;
                            return Math.max(0, Math.round(val + modifier));
                        });
                    });
                    chart.update();
                }
            }

            // Update metric cards randomly too
            const metricValues = document.querySelectorAll('.metric-value');
            metricValues.forEach(el => {
                if (el.textContent.includes('%')) {
                    const currentPercent = parseFloat(el.textContent);
                    const newPercent = (currentPercent + (Math.random() * 10 - 5)).toFixed(1);
                    el.textContent = `${newPercent}%`;
                } else if (el.textContent.includes('$')) {
                    // Handle currency if any
                }
            });

            // Quick flash effect to show data updated
            const chartCards = document.querySelectorAll('.chart-card, .metric');
            chartCards.forEach(card => {
                card.style.opacity = '0.5';
                setTimeout(() => {
                    card.style.opacity = '1';
                }, 300);
            });
        });
    }

});
