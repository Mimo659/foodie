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
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(recipes => {
            const ALL_RECIPES = recipes;
            
            let weeklyPlan = store.getItem('weeklyPlan') || null;
            let inventory = store.getItem('inventory') || [];
            let persons = store.getItem('persons') || 1;

            const navLinks = document.querySelectorAll('.nav-item');
            const createPlanBtn = document.getElementById('create-plan-btn');
            const generatorForm = document.getElementById('generator-form');
            const deletePlanBtn = document.getElementById('delete-plan-btn');
            const confirmPlanBtn = document.getElementById('confirm-plan-btn');
            const inventoryInput = document.getElementById('inventory-input');
            const saveInventoryBtn = document.getElementById('save-inventory-btn');
            const veganCheckbox = document.getElementById('pref-vegan');
            const vegetarianCheckbox = document.getElementById('pref-vegetarian');

            veganCheckbox.addEventListener('change', () => {
                if (veganCheckbox.checked) {
                    vegetarianCheckbox.checked = true;
                    vegetarianCheckbox.disabled = true;
                } else {
                    vegetarianCheckbox.disabled = false;
                }
            });

            const handleRecipeSelect = (dayIndex, recipeId) => {
                if (!weeklyPlan) return;
                const day = weeklyPlan[dayIndex];
                day.selected = day.options.find(r => r.id === recipeId);
                store.setItem('weeklyPlan', weeklyPlan);
                ui.updateConfirmButtonState(weeklyPlan);
            };

            const handleInfoClick = (recipe) => {
                ui.openRecipeModal(recipe);
            };

            generatorForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const submitButton = e.target.querySelector('button[type="submit"]');
                ui.setButtonLoadingState(submitButton, true);
                
                setTimeout(() => {
                    persons = parseInt(document.getElementById('persons').value, 10);
                    const prefs = {
                        persons,
                        budget: document.getElementById('budget').value,
                        isSimple: document.getElementById('isSimple').checked,
                        isVegetarian: vegetarianCheckbox.checked,
                        isVegan: veganCheckbox.checked
                    };
                    weeklyPlan = generateWeeklyPlan(ALL_RECIPES, prefs);
                    store.setItem('weeklyPlan', weeklyPlan);
                    store.setItem('persons', persons);
                    ui.renderDashboard(weeklyPlan, handleRecipeSelect, handleInfoClick);
                    ui.updateConfirmButtonState(weeklyPlan);
                    ui.switchView('dashboard-view');
                    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                    document.querySelector('.nav-item[data-view="dashboard"]').classList.add('active');
                    ui.setButtonLoadingState(submitButton, false);
                }, 0);
            });

            deletePlanBtn.addEventListener('click', () => {
                if (confirm("Bist du sicher, dass du den aktuellen Wochenplan löschen möchtest?")) {
                    weeklyPlan = null;
                    store.setItem('weeklyPlan', null);
                    ui.renderDashboard(null, handleRecipeSelect, handleInfoClick);
                    ui.updateConfirmButtonState(null);
                }
            });

            confirmPlanBtn.addEventListener('click', () => {
                const list = generateShoppingList(weeklyPlan, inventory, persons);
                ui.renderShoppingList(list);
                ui.switchView('shopping-list-view');
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                document.querySelector('.nav-item[data-view="shopping-list"]').classList.add('active');
            });

            saveInventoryBtn.addEventListener('click', () => {
                inventory = inventoryInput.value.split(',').map(item => item.trim()).filter(Boolean);
                store.setItem('inventory', inventory);
                const matchingRecipes = findAlmostCompleteRecipes(ALL_RECIPES, inventory);
                ui.renderInventoryResults(matchingRecipes, handleInfoClick);
            });
            
            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const viewId = e.currentTarget.getAttribute('data-view') + '-view';
                    navLinks.forEach(navLink => navLink.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                    if (viewId === 'inventory-view') {
                        const matchingRecipes = findAlmostCompleteRecipes(ALL_RECIPES, inventory);
                        ui.renderInventoryResults(matchingRecipes, handleInfoClick);
                    }
                    if (viewId === 'shopping-list-view') {
                        const list = generateShoppingList(weeklyPlan, inventory, persons);
                        ui.renderShoppingList(list);
                    }
                    ui.switchView(viewId);
                });
            });

            createPlanBtn.addEventListener('click', () => {
                ui.switchView('generator-view');
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                document.querySelector('.nav-item[data-view="generator"]').classList.add('active');
            });

            function initUI() {
                document.getElementById('persons').value = persons;
                inventoryInput.value = inventory.join(', ');
                ui.renderDashboard(weeklyPlan, handleRecipeSelect, handleInfoClick);
                ui.updateConfirmButtonState(weeklyPlan);
                ui.switchView('dashboard-view');
                document.querySelector('.nav-item[data-view="dashboard"]').classList.add('active');
                ui.showApp();
            }

            initUI();
        })
        .catch(error => {
            console.error('Fehler beim Laden der Rezepte:', error);
            document.getElementById('loading-screen').innerHTML = '<p style="color:red;">Fehler: Rezepte konnten nicht geladen werden. Bitte die Seite neu laden.</p>';
        });
}