document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    const store = {
        getItem: (key) => JSON.parse(localStorage.getItem(key)),
        setItem: (key, value) => localStorage.setItem(key, JSON.stringify(value))
    };

    fetch('data/recipes.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(recipes => {
            const ALL_RECIPES = recipes;
            
            let weeklyPlan = store.getItem('weeklyPlan') || null;
            let inventory = store.getItem('inventory') || [];
            let persons = store.getItem('persons') || 1;

            const navLinks = document.querySelectorAll('nav a');
            const createPlanBtn = document.getElementById('create-plan-btn');
            const generatorForm = document.getElementById('generator-form');
            const inventoryInput = document.getElementById('inventory-input');
            const saveInventoryBtn = document.getElementById('save-inventory-btn');

            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const viewId = e.target.getAttribute('data-view') + '-view';
                    if (viewId === 'shopping-list-view') {
                        const list = generateShoppingList(weeklyPlan, inventory, persons);
                        ui.renderShoppingList(list);
                    }
                    if (viewId === 'inventory-view') {
                        const matchingRecipes = findRecipesByIngredients(ALL_RECIPES, inventory);
                        ui.renderInventoryResults(matchingRecipes);
                    }
                    ui.switchView(viewId);
                });
            });

            createPlanBtn.addEventListener('click', () => ui.switchView('generator-view'));

            generatorForm.addEventListener('submit', (e) => {
                e.preventDefault();
                persons = parseInt(document.getElementById('persons').value, 10);
                const prefs = {
                    persons: persons, budget: document.getElementById('budget').value,
                    isSimple: document.getElementById('isSimple').checked,
                    isVegetarian: document.getElementById('isVegetarian').checked,
                    isVegan: document.getElementById('isVegan').checked,
                };
                weeklyPlan = generateWeeklyPlan(ALL_RECIPES, prefs);
                store.setItem('weeklyPlan', weeklyPlan);
                store.setItem('persons', persons);
                ui.renderDashboard(weeklyPlan);
                ui.switchView('dashboard-view');
            });
            
            saveInventoryBtn.addEventListener('click', () => {
                inventory = inventoryInput.value.split(',').map(item => item.trim()).filter(Boolean);
                store.setItem('inventory', inventory);
                const matchingRecipes = findRecipesByIngredients(ALL_RECIPES, inventory);
                ui.renderInventoryResults(matchingRecipes);
                alert('Vorrat gespeichert!');
            });

            function initUI() {
                document.getElementById('persons').value = persons;
                inventoryInput.value = inventory.join(', ');
                ui.renderDashboard(weeklyPlan);
                ui.switchView('dashboard-view');
                ui.showApp();
            }

            initUI();
        })
        .catch(error => {
            console.error('Fehler beim Laden der Rezepte:', error);
            document.getElementById('loading-screen').innerHTML = '<p style="color:red;">Fehler: Rezepte konnten nicht geladen werden. Bitte die Seite neu laden.</p>';
        });
}