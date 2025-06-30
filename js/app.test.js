// Tests for js/app.js
const fs = require('fs');
const path = require('path');

// Helper function to load app.js script content and run it
const loadAppScript = () => {
    const appScriptPath = path.resolve(__dirname, 'app.js');
    const appScriptContent = fs.readFileSync(appScriptPath, 'utf8');
    const scriptEl = document.createElement('script');
    scriptEl.textContent = appScriptContent; // app.js should now attach initializeApp to window.testableInitializeApp
    document.head.appendChild(scriptEl);
};

describe('initializeApp', () => {
    const mockRecipesData = [{ id: 'r1', title: 'Test Recipe' }];
    const mockPantryData = { categories: [{ name: 'Test Category', items: [] }] };

    beforeEach(() => {
        // Set up a basic HTML structure that app.js expects
        document.body.innerHTML = `
            <div id="loading-screen"></div>
            <div id="app-content" class="content-hidden"></div>
            <nav>
                <a href="#" class="nav-item" data-view="dashboard"></a>
                <a href="#" class="nav-item" data-view="generator"></a>
                <a href="#" class="nav-item" data-view="inventory"></a>
                <a href="#" class="nav-item" data-view="shopping-list"></a>
            </nav>
            <button id="create-plan-btn"></button>
            <form id="generator-form">
                <input name="diet" value="all" type="radio" checked/>
                <input name="diet" value="vegetarian" type="radio"/>
                <input name="diet" value="vegan" type="radio"/>
                <input id="persons" value="1" />
                <input id="budget" />
                <input id="attr-quick" type="checkbox" />
                <input id="attr-guest-friendly" type="checkbox" />
                <input id="attr-leftovers" type="checkbox" />
                <select id="cuisine-style">
                    <option value="all"></option>
                    <option value="asian"></option>
                    <option value="mediterranean"></option>
                </select>
                <button type="submit">Generate</button>
            </form>
            <button id="delete-plan-btn"></button>
            <button id="confirm-plan-btn"></button>
            <input id="pantry-item-search" />
            <div id="pantry-item-suggestions"></div>
            <div id="pantry-item-details"></div>
            <input id="pantry-item-quantity" />
            <input id="pantry-item-unit" />
            <input id="pantry-item-expiration" />
            <button id="add-item-to-pantry-btn"></button>
            <button id="find-recipes-from-pantry-btn"></button>
            <div id="current-pantry-display"></div>
            <div id="empty-pantry-message"></div>
            <button id="delete-inventory-recipes-btn"></button>
            <div id="plan-display"></div>
            <div id="no-plan-display"></div>
            <div id="weekly-plan-container"></div>
            <div id="shopping-list-container"></div>
            <div id="no-shopping-list"></div>
            <div id="inventory-results-container"></div>
            <section id="dashboard-view" class="view"></section>
            <section id="generator-view" class="view hidden"></section>
            <section id="inventory-view" class="view hidden"></section>
            <section id="shopping-list-view" class="view hidden"></section>
        `;

        // Reset fetch mock for specific test responses
        global.fetch.mockImplementation((url) => {
            if (url.includes('recipes.json')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRecipesData) });
            }
            if (url.includes('pantry_item_categories.json')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPantryData) });
            }
            return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
        });

        // Clear localStorage mock before each test run
        localStorage.clear();
        jest.spyOn(localStorage, 'getItem');
        jest.spyOn(localStorage, 'setItem');
    });

    test('should fetch initial data, load from localStorage, and initialize UI', async () => {
        // Load and execute app.js. This will call initializeApp via DOMContentLoaded.
        // However, DOMContentLoaded might fire *before* app.js is fully parsed by eval.
        // A more robust way would be to export initializeApp and call it directly.
        // For now, let's assume eval + dispatching DOMContentLoaded works.

        // Manually call initializeApp if it's not exported and attached to DOMContentLoaded in a testable way
        // For this test, we assume app.js itself contains initializeApp() and it's called.
        // The original app.js has: document.addEventListener('DOMContentLoaded', () => { initializeApp(); });

        // To ensure initializeApp is callable for testing without relying on DOMContentLoaded timing with eval:
        // Option 1: Modify app.js to expose initializeApp (e.g., window.initializeApp = initializeApp)
        // Option 2: Capture initializeApp if it becomes global (it doesn't by default)
        // Option 3: Re-structure app.js to be more module-friendly (larger change)

        // For now, let's modify app.js slightly to put initializeApp on window for tests
        // This is an intrusive change for testing, but makes it directly callable.
        // (Will do this in the next step if just loading app.js doesn't work)

        // Load app.js script into the JSDOM environment
        loadAppScript(); // This will execute app.js, which should make testableInitializeApp available

        // Call the exposed function
        await window.testableInitializeApp();

        // Check fetch calls
        expect(global.fetch).toHaveBeenCalledWith('data/recipes.json');
        expect(global.fetch).toHaveBeenCalledWith('data/pantry_item_categories.json');

        // Check localStorage calls
        expect(localStorage.getItem).toHaveBeenCalledWith('weeklyPlan');
        expect(localStorage.getItem).toHaveBeenCalledWith('userPantry');
        expect(localStorage.getItem).toHaveBeenCalledWith('persons');

        // Check UI initialization calls (these are mocked)
        expect(global.ui.renderDashboard).toHaveBeenCalled();
        expect(global.ui.updateConfirmButtonState).toHaveBeenCalled();
        expect(global.ui.switchView).toHaveBeenCalledWith('dashboard-view'); // Default view
        expect(global.ui.showApp).toHaveBeenCalled();

        // Check that the active class is set on the dashboard nav link
        const dashboardLink = document.querySelector('.nav-item[data-view="dashboard"]');
        expect(dashboardLink.classList.contains('active')).toBe(true);
    });

    test('generator form submission should call generateWeeklyPlan with correct preferences', async () => {
        // Load app.js script into the JSDOM environment
        loadAppScript();
        await window.testableInitializeApp(); // Run initial setup

        // Set form values
        document.getElementById('persons').value = '2';
        document.getElementById('budget').value = '5';
        document.querySelector('input[name="diet"][value="vegetarian"]').checked = true;
        document.getElementById('attr-quick').checked = true;
        document.getElementById('cuisine-style').value = 'asian';

        global.generateWeeklyPlan.mockReturnValue([{ day: "Montag", options: [], selected: null }]); // Mock a minimal plan

        // Submit the form
        const generatorForm = document.getElementById('generator-form');
        generatorForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

        // Need to wait for setTimeout(..., 0) in the form handler
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(global.generateWeeklyPlan).toHaveBeenCalledWith(
            expect.any(Array), // ALL_RECIPES
            {
                persons: 2,
                budget: "5", // Note: budget is read as string from input
                isVegetarian: true,
                isVegan: false,
                isQuick: true,
                isGuestFriendly: false,
                isForLeftovers: false,
                cuisine: 'asian'
            }
        );
        expect(global.ui.renderDashboard).toHaveBeenCalledTimes(2); // Once on init, once after plan generation
        expect(localStorage.setItem).toHaveBeenCalledWith('weeklyPlan', JSON.stringify([{ day: "Montag", options: [], selected: null }]));
        // app.js store.setItem uses JSON.stringify, so 'persons' will be stored as string "2"
        expect(localStorage.setItem).toHaveBeenCalledWith('persons', "2"); // prefs.persons is 2, JSON.stringify(2) is "2"
    });

    // Add more tests if other parts of app.js can be reasonably isolated.
});
