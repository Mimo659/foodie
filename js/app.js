import * as store from './store.js';
import * as ui from './ui.js';
import { extractUniqueTags } from './logic.js'; // generateShoppingList is not directly used by app.js
import { initDashboard, onShowDashboardView } from './views/dashboardView.js';
import { initGeneratorView, onShowGeneratorView } from './views/generatorView.js';
import { initInventoryView, onShowInventoryView } from './views/inventoryView.js';
import { initShoppingListView, onShowShoppingListView } from './views/shoppingListView.js';

// Global state (data fetched once)
let ALL_RECIPES_DATA = [];
let PANTRY_CATEGORIES_DATA = [];

// DOM Elements for global interactions
const navLinks = document.querySelectorAll('.nav-item');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const themeIconMoon = document.getElementById('theme-icon-moon');
const themeIconSun = document.getElementById('theme-icon-sun');
const pantrySearchInput = document.getElementById('pantry-item-search'); // Renamed for clarity
const pantrySuggestionsContainer = document.getElementById('pantry-item-suggestions'); // Renamed for clarity
const dashboardConfirmPlanBtn = document.getElementById('confirm-plan-btn'); // Confirm button on Dashboard


// --- Theme Management ---
function applyTheme(selectedTheme) {
    document.body.classList.toggle('dark-mode', selectedTheme === 'dark');
    if (themeIconMoon) themeIconMoon.classList.toggle('hidden', selectedTheme === 'dark');
    if (themeIconSun) themeIconSun.classList.toggle('hidden', selectedTheme !== 'dark');
}

function handleThemeToggle() {
    const newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
    applyTheme(newTheme);
    store.setTheme(newTheme);
}

// --- Navigation ---
function updateActiveNavLink(viewName) {
    navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-view') === viewName);
    });
}

function switchAppView(viewName) { // viewName is 'dashboard', 'generator', etc.
    const viewId = `${viewName}-view`;
    ui.switchView(viewId); // ui.js handles showing/hiding the correct section
    updateActiveNavLink(viewName);

    // Call the onShow handler for the newly activated view
    switch (viewName) {
        case 'dashboard': onShowDashboardView(); break;
        case 'generator':
            onShowGeneratorView({
                onPlanConfirmed: () => switchAppView('dashboard'),
                onSingleRecipePlanCreated: () => switchAppView('dashboard'),
                onViewChangeRequired: (targetView) => switchAppView(targetView),
                onExistingPlanCleared: () => {
                    if (!document.getElementById('dashboard-view').classList.contains('hidden')) {
                        onShowDashboardView();
                    }
                }
            });
            break;
        case 'inventory': onShowInventoryView(); break;
        case 'shopping-list': onShowShoppingListView(); break;
    }
    // ensureNavItemsVisibility(); // If needed for dynamic nav items
}

function navigateToGeneratorView() {
    switchAppView('generator');
}

// --- Global Event Listeners ---
function setupGlobalEventListeners() {
    if (darkModeToggle) darkModeToggle.addEventListener('click', handleThemeToggle);

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = e.currentTarget.getAttribute('data-view');
            switchAppView(targetView);
        });
    });

    // Listener for dashboard's "confirm plan" button to switch to shopping list
    if (dashboardConfirmPlanBtn) {
        dashboardConfirmPlanBtn.addEventListener('click', () => {
            const currentPlan = store.getWeeklyPlan();
            if (currentPlan && currentPlan.every(day => day.selected)) {
                switchAppView('shopping-list');
            } else {
                alert("Bitte vervollständige deinen Plan, bevor du die Einkaufsliste erstellst.");
            }
        });
    }

    // Hide pantry suggestions if clicked outside
    if (pantrySearchInput && pantrySuggestionsContainer) {
        document.addEventListener('click', (event) => {
            if (!pantrySearchInput.contains(event.target) && !pantrySuggestionsContainer.contains(event.target)) {
                pantrySuggestionsContainer.classList.add('hidden');
            }
        });
    }
}

// --- Main Initialization ---
async function initializeApp() {
    applyTheme(store.getTheme() || 'light'); // Set initial theme

    try {
        const portionsForFetch = store.getPersons(); // Defaults to '2'
        const recipesFile = `data/recipes_${portionsForFetch}.json`;

        const [recipesResp, pantryResp, tagsArray] = await Promise.all([
            fetch(recipesFile),
            fetch('data/pantry_item_categories.json'),
            extractUniqueTags()
        ]);

        if (!recipesResp.ok) throw new Error(`Recipe data fetch failed: ${recipesResp.status}`);
        if (!pantryResp.ok) throw new Error(`Pantry categories fetch failed: ${pantryResp.status}`);

        ALL_RECIPES_DATA = await recipesResp.json();
        const pantryJson = await pantryResp.json();
        PANTRY_CATEGORIES_DATA = pantryJson.categories;

        ui.populateTagFilters(tagsArray || []);

        // Initialize all view modules
        initDashboard(navigateToGeneratorView, store.getWeeklyPlan(), store.getUserPantry(), ALL_RECIPES_DATA, PANTRY_CATEGORIES_DATA);
        initGeneratorView(ALL_RECIPES_DATA, { /* callbacks defined in switchAppView */ });
        initInventoryView(ALL_RECIPES_DATA, PANTRY_CATEGORIES_DATA);
        initShoppingListView(PANTRY_CATEGORIES_DATA);

        setupGlobalEventListeners();

        switchAppView('dashboard'); // Set initial view
        ui.showApp(); // Make app visible

    } catch (error) {
        console.error('App initialization error:', error);
        const loadingEl = document.getElementById('loading-screen');
        if (loadingEl) loadingEl.innerHTML = `<p style="color:red;">Fehler beim Laden der App: ${error.message}.</p>`;
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);