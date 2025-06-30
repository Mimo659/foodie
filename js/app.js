document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    const store = {
        getItem: (key) => JSON.parse(localStorage.getItem(key)),
        setItem: (key, value) => localStorage.setItem(key, JSON.stringify(value))
    };

    // Fetch both recipes and pantry categories
    Promise.all([
        fetch('data/recipes.json').then(res => { if (!res.ok) throw new Error(`HTTP error! status: ${res.status} for recipes.json`); return res.json(); }),
        fetch('data/pantry_item_categories.json').then(res => { if (!res.ok) throw new Error(`HTTP error! status: ${res.status} for pantry_item_categories.json`); return res.json(); })
    ])
    .then(([recipes, pantryData]) => {
            const ALL_RECIPES = recipes;
            const PANTRY_CATEGORIES = pantryData.categories;
            let allPantryItems = PANTRY_CATEGORIES.flatMap(category => category.items.map(item => ({ ...item, categoryName: category.name })));

            let weeklyPlan = store.getItem('weeklyPlan') || null;
            // Use new key for structured pantry inventory
            let userPantry = store.getItem('userPantry') || [];
            let persons = store.getItem('persons') || 1;

            const navLinks = document.querySelectorAll('.nav-item');
            const createPlanBtn = document.getElementById('create-plan-btn');
            const generatorForm = document.getElementById('generator-form');
            const deletePlanBtn = document.getElementById('delete-plan-btn');
            const confirmPlanBtn = document.getElementById('confirm-plan-btn');

            // New inventory elements
            const pantryItemSearchInput = document.getElementById('pantry-item-search');
            const pantryItemSuggestionsContainer = document.getElementById('pantry-item-suggestions');
            const pantryItemDetailsDiv = document.getElementById('pantry-item-details');
            const pantryItemQuantityInput = document.getElementById('pantry-item-quantity');
            const pantryItemUnitInput = document.getElementById('pantry-item-unit');
            const pantryItemExpirationInput = document.getElementById('pantry-item-expiration');
            const addItemToPantryBtn = document.getElementById('add-item-to-pantry-btn');
            const findRecipesFromPantryBtn = document.getElementById('find-recipes-from-pantry-btn');
            const currentPantryDisplay = document.getElementById('current-pantry-display');
            const emptyPantryMessage = document.getElementById('empty-pantry-message');

            const deleteInventoryRecipesBtn = document.getElementById('delete-inventory-recipes-btn');

            let matchingRecipes = []; // To store inventory based recipe suggestions
            let selectedPantryItemForAdding = null; // To store the item selected from suggestions

            const handleRecipeSelect = (dayIndex, recipeId) => {
                if (!weeklyPlan) return;
                const day = weeklyPlan[dayIndex];
                day.selected = day.options.find(r => r.id === recipeId);
                store.setItem('weeklyPlan', weeklyPlan);
                ui.updateConfirmButtonState(weeklyPlan);
            };
            const handleInfoClick = (recipe) => ui.openRecipeModal(recipe);

            generatorForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const submitButton = e.target.querySelector('button[type="submit"]');
                ui.setButtonLoadingState(submitButton, true);
                setTimeout(() => {
                    const dietPreference = document.querySelector('input[name="diet"]:checked').value;
                    const prefs = {
                        persons: parseInt(document.getElementById('persons').value, 10),
                        budget: document.getElementById('budget').value,
                        isVegetarian: dietPreference === 'vegetarian',
                        isVegan: dietPreference === 'vegan',
                        isQuick: document.getElementById('attr-quick').checked,
                        isGuestFriendly: document.getElementById('attr-guest-friendly').checked,
                        isForLeftovers: document.getElementById('attr-leftovers').checked,
                        cuisine: document.getElementById('cuisine-style').value
                    };
                    weeklyPlan = generateWeeklyPlan(ALL_RECIPES, prefs);
                    if (weeklyPlan.length === 0) {
                        alert("Entschuldigung, mit diesen Filtern konnten wir keinen Plan erstellen. Bitte versuche es mit anderen Kriterien.");
                        ui.setButtonLoadingState(submitButton, false);
                        return;
                    }
                    if (weeklyPlan.length < 7) {
                        alert(`Hinweis: Wir haben nur genug einzigartige Rezepte für einen Plan von ${weeklyPlan.length} Tagen gefunden. Für mehr Vielfalt kannst du deine Filter anpassen.`);
                    }
                    store.setItem('weeklyPlan', weeklyPlan); store.setItem('persons', prefs.persons);
                    ui.renderDashboard(weeklyPlan, handleRecipeSelect, handleInfoClick);
                    ui.updateConfirmButtonState(weeklyPlan);
                    ui.switchView('dashboard-view');
                    navLinks.forEach(n => n.classList.remove('active'));
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
                // Ensure generateShoppingList is updated to use userPantry
                const list = generateShoppingList(weeklyPlan, userPantry, persons, PANTRY_CATEGORIES);
                ui.renderShoppingList(list);
                ui.switchView('shopping-list-view');
                navLinks.forEach(n => n.classList.remove('active'));
                document.querySelector('.nav-item[data-view="shopping-list"]').classList.add('active');
            });

            // --- New Inventory Logic ---
            function renderPantrySuggestions(searchTerm) {
                pantryItemSuggestionsContainer.innerHTML = '';
                if (!searchTerm) {
                    pantryItemSuggestionsContainer.classList.add('hidden');
                    return;
                }

                const filteredItems = allPantryItems.filter(item =>
                    item.name.toLowerCase().includes(searchTerm.toLowerCase())
                );

                if (filteredItems.length > 0) {
                    const ul = document.createElement('ul');
                    filteredItems.slice(0, 7).forEach(item => { // Show top 7 suggestions
                        const li = document.createElement('li');
                        li.textContent = `${item.name} (${item.categoryName})`;
                        li.addEventListener('click', () => {
                            selectedPantryItemForAdding = item;
                            pantryItemSearchInput.value = item.name;
                            pantryItemSuggestionsContainer.innerHTML = '';
                            pantryItemSuggestionsContainer.classList.add('hidden');
                            pantryItemDetailsDiv.classList.remove('hidden');
                            addItemToPantryBtn.classList.remove('hidden');
                            pantryItemQuantityInput.focus();
                        });
                        ul.appendChild(li);
                    });
                    pantryItemSuggestionsContainer.appendChild(ul);
                    pantryItemSuggestionsContainer.classList.remove('hidden');
                } else {
                    pantryItemSuggestionsContainer.classList.add('hidden');
                }
            }

            pantryItemSearchInput.addEventListener('input', (e) => {
                renderPantrySuggestions(e.target.value);
                // If input is cleared, hide details
                if (!e.target.value) {
                    selectedPantryItemForAdding = null;
                    pantryItemDetailsDiv.classList.add('hidden');
                    addItemToPantryBtn.classList.add('hidden');
                }
            });

            // Hide suggestions if clicked outside
            document.addEventListener('click', function(event) {
                if (!pantryItemSearchInput.contains(event.target) && !pantryItemSuggestionsContainer.contains(event.target)) {
                    pantryItemSuggestionsContainer.classList.add('hidden');
                }
            });

            addItemToPantryBtn.addEventListener('click', () => {
                if (!selectedPantryItemForAdding) {
                    alert("Bitte wähle zuerst ein Lebensmittel aus der Liste aus.");
                    return;
                }
                const quantity = parseFloat(pantryItemQuantityInput.value);
                const unit = pantryItemUnitInput.value.trim();
                const expiration = pantryItemExpirationInput.value;

                if (isNaN(quantity) || quantity <= 0) {
                    alert("Bitte gib eine gültige Menge ein.");
                    return;
                }
                if (!unit) {
                    alert("Bitte gib eine Einheit ein (z.B. Stk, g, L).");
                    return;
                }

                const newItem = {
                    itemId: selectedPantryItemForAdding.id,
                    name: selectedPantryItemForAdding.name,
                    quantity: quantity,
                    unit: unit,
                    expiration: expiration || null
                };

                // Check if item already exists, if so, ask to update or add as new?
                // For now, just add as new. Future: offer to increment quantity.
                userPantry.push(newItem);
                store.setItem('userPantry', userPantry);
                renderCurrentPantry();

                // Reset input fields
                pantryItemSearchInput.value = '';
                selectedPantryItemForAdding = null;
                pantryItemDetailsDiv.classList.add('hidden');
                addItemToPantryBtn.classList.add('hidden');
                pantryItemQuantityInput.value = '1';
                pantryItemUnitInput.value = '';
                pantryItemExpirationInput.value = '';
                pantryItemSearchInput.focus();
            });

            function renderCurrentPantry() {
                currentPantryDisplay.innerHTML = '';
                if (userPantry.length === 0) {
                    emptyPantryMessage.classList.remove('hidden');
                    currentPantryDisplay.classList.add('hidden');
                } else {
                    emptyPantryMessage.classList.add('hidden');
                    currentPantryDisplay.classList.remove('hidden');
                    const ul = document.createElement('ul');
                    ul.className = 'current-pantry-list';
                    userPantry.forEach((item, index) => {
                        const li = document.createElement('li');
                        li.className = 'pantry-list-item';
                        let expText = item.expiration ? ` - Haltbar bis: ${new Date(item.expiration).toLocaleDateString('de-DE')}` : '';
                        // Basic display, will be improved in ui.js later
                        li.innerHTML = `<span>${item.name} (${item.quantity} ${item.unit})${expText}</span>
                                        <button class="btn-remove-pantry-item" data-index="${index}"><i class="fa-solid fa-trash-can"></i></button>`;
                        ul.appendChild(li);
                    });
                    currentPantryDisplay.appendChild(ul);

                    // Add event listeners for remove buttons
                    document.querySelectorAll('.btn-remove-pantry-item').forEach(button => {
                        button.addEventListener('click', (e) => {
                            const itemIndex = parseInt(e.currentTarget.dataset.index, 10);
                            userPantry.splice(itemIndex, 1);
                            store.setItem('userPantry', userPantry);
                            renderCurrentPantry();
                        });
                    });
                }
            }

            findRecipesFromPantryBtn.addEventListener('click', () => {
                // Ensure findAlmostCompleteRecipes is updated to use userPantry
                matchingRecipes = findAlmostCompleteRecipes(ALL_RECIPES, userPantry);
                ui.renderInventoryResults(matchingRecipes, handleInfoClick);
            });
            // --- End New Inventory Logic ---

            deleteInventoryRecipesBtn.addEventListener('click', () => {
                matchingRecipes = []; // Clear the stored recipes
                ui.clearInventoryResults();
            });
            
            navLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const viewId = e.currentTarget.getAttribute('data-view') + '-view';
                    navLinks.forEach(navLink => navLink.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                    if (viewId === 'inventory-view') {
                        // When navigating to inventory view, re-render based on current matchingRecipes
                        // This ensures that if recipes were cleared, they stay cleared,
                        // or if they were previously loaded, they are shown again.
                        ui.renderInventoryResults(matchingRecipes, handleInfoClick);
                        renderCurrentPantry(); // Also render the pantry list when switching to this view
                    } else if (viewId === 'shopping-list-view') {
                         const list = generateShoppingList(weeklyPlan, userPantry, persons, PANTRY_CATEGORIES); // Use userPantry and pass PANTRY_CATEGORIES
                        ui.renderShoppingList(list);
                    }
                    ui.switchView(viewId);
                });
            });

            createPlanBtn.addEventListener('click', () => {
                ui.switchView('generator-view');
                navLinks.forEach(n => n.classList.remove('active'));
                document.querySelector('.nav-item[data-view="generator"]').classList.add('active');
            });

            function initUI() {
                document.getElementById('persons').value = persons;
                // inventoryInput.value = inventory.join(', '); // Old inventory input, remove
                renderCurrentPantry(); // Initialize pantry display
                ui.renderDashboard(weeklyPlan, handleRecipeSelect, handleInfoClick);
                ui.updateConfirmButtonState(weeklyPlan);
                ui.switchView('dashboard-view'); // Default view
                document.querySelector('.nav-item[data-view="dashboard"]').classList.add('active');
                ui.showApp();
            }
            initUI();
        })
        .catch(error => {
            console.error('Fehler beim Laden der Daten:', error);
            document.getElementById('loading-screen').innerHTML = `<p style="color:red;">Fehler: Daten konnten nicht geladen werden (${error.message}). Bitte die Seite neu laden.</p>`;
        });
}