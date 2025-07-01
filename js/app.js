function initializeApp() {
    const store = {
        getItem: (key) => JSON.parse(localStorage.getItem(key)),
        setItem: (key, value) => localStorage.setItem(key, JSON.stringify(value))
    };

    // Fetch recipes, pantry categories, and unique tags
    let storedPortionsForFetch = store.getItem('persons') || '2';
    if (storedPortionsForFetch !== '2' && storedPortionsForFetch !== '4') {
        storedPortionsForFetch = '2';
    }
    const recipeFileName = `data/recipes_${storedPortionsForFetch}.json`;

    // extractUniqueTags is an async function, so it needs to be handled correctly in Promise.all
    return Promise.all([
        fetch(recipeFileName).then(res => { if (!res.ok) throw new Error(`HTTP error! status: ${res.status} for ${recipeFileName}`); return res.json(); }),
        fetch('data/pantry_item_categories.json').then(res => { if (!res.ok) throw new Error(`HTTP error! status: ${res.status} for pantry_item_categories.json`); return res.json(); }),
        extractUniqueTags() // This will resolve to the array of unique tags
    ])
    .then(([recipes, pantryData, uniqueTags]) => {
            const ALL_RECIPES = recipes;
            const PANTRY_CATEGORIES = pantryData.categories;
            const UNIQUE_TAGS = uniqueTags; // Store the fetched unique tags

            ui.populateTagFilters(UNIQUE_TAGS); // Populate the filters in the UI

            let allPantryItems = PANTRY_CATEGORIES.flatMap(category => category.items.map(item => ({ ...item, categoryName: category.name })));
            let weeklyPlan = store.getItem('weeklyPlan') || null;
            // Use new key for structured pantry inventory
            let userPantry = store.getItem('userPantry') || [];
            // Default to 2 portions if nothing is stored, or if stored value is not 2 or 4
            // This 'persons' variable is now primarily for UI and shopping list scaling,
            // the recipe data itself is pre-selected for 2 or 4.
            let storedPortions = store.getItem('persons');
            let persons = (storedPortions === '2' || storedPortions === '4') ? parseInt(storedPortions, 10) : 2;
            // No need to store.setItem('persons', persons.toString()); here again as it's done before fetch or during initUI

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
            const exportShoppingListBtn = document.getElementById('export-shopping-list-btn'); // New button

            const deleteInventoryRecipesBtn = document.getElementById('delete-inventory-recipes-btn');
            const darkModeToggle = document.getElementById('dark-mode-toggle');
            const themeIconMoon = document.getElementById('theme-icon-moon');
            const themeIconSun = document.getElementById('theme-icon-sun');
            const shoppingListContainer = document.getElementById('shopping-list-container'); // For event delegation
            const createSingleRecipePlanBtn = document.getElementById('create-single-recipe-plan-btn');

            // Confirmation Modal Elements
            const confirmNewPlanModal = document.getElementById('confirm-new-plan-modal');
            const confirmNewPlanYesBtn = document.getElementById('confirm-new-plan-yes');
            const confirmNewPlanNoBtn = document.getElementById('confirm-new-plan-no');

            let matchingRecipes = []; // To store inventory based recipe suggestions
            let selectedPantryItemForAdding = null; // To store the item selected from suggestions
            let collectedShoppingListItems = new Set(); // To store names of collected items
            let currentlySelectedSingleRecipe = null; // To store the recipe selected from suggestions

            // Dark Mode Logic
            const applyTheme = (theme) => {
                if (theme === 'dark') {
                    document.body.classList.add('dark-mode');
                    themeIconMoon.classList.add('hidden');
                    themeIconSun.classList.remove('hidden');
                } else {
                    document.body.classList.remove('dark-mode');
                    themeIconMoon.classList.remove('hidden');
                    themeIconSun.classList.add('hidden');
                }
            };

            const toggleTheme = () => {
                const currentTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
                applyTheme(currentTheme);
                store.setItem('theme', currentTheme);
            };

            darkModeToggle.addEventListener('click', toggleTheme);

            // Load saved theme
            const savedTheme = store.getItem('theme');
            if (savedTheme) {
                applyTheme(savedTheme);
            } else { // Default to light theme if no preference saved
                applyTheme('light');
            }


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
                    try {
                        const dietPreferenceElement = document.querySelector('input[name="diet"]:checked');
                        const dietPreference = dietPreferenceElement ? dietPreferenceElement.value : 'all'; // Default if no diet selected

                        const selectedPortionsElement = document.querySelector('input[name="portions"]:checked');
                        // Default to 2 portions if somehow nothing is selected, though HTML defaults to 2.
                        const selectedPortions = selectedPortionsElement ? selectedPortionsElement.value : '2';


                        // Get selected tags
                        const selectedTagNodes = document.querySelectorAll('#dynamic-tags-checkboxes input[type="checkbox"]:checked');
                        const selectedTags = Array.from(selectedTagNodes).map(node => node.value);

                        const prefs = {
                            persons: parseInt(selectedPortions, 10),
                            isVegetarian: dietPreference === 'vegetarian',
                            isVegan: dietPreference === 'vegan',
                            selectedTags: selectedTags
                            // Consider adding other filters like isQuick, cuisine if they are still in HTML and intended to be used.
                        };

                        weeklyPlan = generateWeeklyPlan(ALL_RECIPES, prefs);

                        if (!weeklyPlan || weeklyPlan.length === 0) {
                            alert("Entschuldigung, mit diesen Filtern konnten wir keinen Plan erstellen. Bitte versuche es mit anderen Kriterien oder weniger Filtern.");
                            // ui.setButtonLoadingState is handled in finally
                            return;
                        }
                        if (weeklyPlan.length < 7) {
                            alert(`Hinweis: Wir haben nur genug einzigartige Rezepte für einen Plan von ${weeklyPlan.length} Tagen gefunden. Für mehr Vielfalt kannst du deine Filter anpassen oder die Filter löschen.`);
                        }

                        store.setItem('weeklyPlan', weeklyPlan);
                        store.setItem('persons', prefs.persons.toString()); // Ensure 'persons' is stored as string

                        ui.renderDashboard(weeklyPlan, handleRecipeSelect, handleInfoClick);
                        ui.updateConfirmButtonState(weeklyPlan);
                        ui.switchView('dashboard-view');
                        navLinks.forEach(n => n.classList.remove('active'));
                        const dashboardNav = document.querySelector('.nav-item[data-view="dashboard"]');
                        if (dashboardNav) dashboardNav.classList.add('active');

                    } catch (error) {
                        console.error("Fehler bei der Plangenerierung:", error);
                        alert("Ein unerwarteter Fehler ist bei der Plangenerierung aufgetreten. Bitte versuche es erneut.");
                        // ui.setButtonLoadingState is handled in finally
                    } finally {
                        ui.setButtonLoadingState(submitButton, false);
                    }
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
                pantryItemUnitInput.value = 'Stk.'; // Reset dropdown to default "Stk."
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
                    } else if (viewId === 'generator-view') {
                        if (store.getItem('weeklyPlan') && store.getItem('weeklyPlan').length > 0) {
                            showConfirmNewPlanModal();
                            // Don't switch view here, modal will handle next step or close.
                        } else {
                            navigateToGeneratorView(); // This function handles the view switch.
                        }
                    } else {
                        ui.switchView(viewId); // For other views, switch immediately.
                    }
                });
            });

            createPlanBtn.addEventListener('click', () => { // This is the button on the empty dashboard
                // No need to check for existing plan here, as this button only shows if no plan.
                navigateToGeneratorView();
            });

            const handleSuggestedRecipeSelect = (recipe) => {
                currentlySelectedSingleRecipe = recipe;
                if (createSingleRecipePlanBtn) createSingleRecipePlanBtn.disabled = false;
            };

            // --- Confirmation Modal Logic ---
            const showConfirmNewPlanModal = () => {
                if (confirmNewPlanModal) confirmNewPlanModal.classList.remove('hidden');
            };
            const hideConfirmNewPlanModal = () => {
                if (confirmNewPlanModal) confirmNewPlanModal.classList.add('hidden');
            };

            if (confirmNewPlanYesBtn) {
                confirmNewPlanYesBtn.addEventListener('click', () => {
                    weeklyPlan = null; // Clear in-memory plan
                    store.setItem('weeklyPlan', null); // Clear stored plan
                    store.setItem('persons', null); // Clear stored persons related to the plan

                    // Potentially also clear dashboard and confirm button state
                    ui.renderDashboard(null, handleRecipeSelect, handleInfoClick);
                    ui.updateConfirmButtonState(null);

                    hideConfirmNewPlanModal();
                    navigateToGeneratorView(); // Proceed to generator view
                });
            }

            if (confirmNewPlanNoBtn) {
                confirmNewPlanNoBtn.addEventListener('click', () => {
                    hideConfirmNewPlanModal();
                    // Optionally, navigate to dashboard if user is not already there
                    // For now, just closes modal, user stays on current view.
                });
            }
             // Close modal if clicked outside of content
            if (confirmNewPlanModal) {
                confirmNewPlanModal.addEventListener('click', (e) => {
                    if (e.target === confirmNewPlanModal) {
                        hideConfirmNewPlanModal();
                    }
                });
            }


            // --- End Confirmation Modal Logic ---

            const navigateToGeneratorView = () => {
                ui.switchView('generator-view');
                navLinks.forEach(n => n.classList.remove('active'));
                const generatorNav = document.querySelector('.nav-item[data-view="generator"]');
                if(generatorNav) generatorNav.classList.add('active');

                const suggested = ALL_RECIPES.slice(0, 3);
                ui.renderSuggestedRecipes(suggested, handleSuggestedRecipeSelect, handleInfoClick);
                if (createSingleRecipePlanBtn) createSingleRecipePlanBtn.disabled = true;
                currentlySelectedSingleRecipe = null;
            };


            if (createSingleRecipePlanBtn) {
                createSingleRecipePlanBtn.addEventListener('click', () => {
                    if (!currentlySelectedSingleRecipe) {
                        alert("Bitte wähle zuerst ein Rezept aus den Vorschlägen aus.");
                        return;
                    }

                    const singleDayPlan = [{
                        day: "Montag", // Defaulting to Monday for now
                        options: [currentlySelectedSingleRecipe],
                        selected: currentlySelectedSingleRecipe
                    }];

                    // Determine current portions setting (e.g., from the radio buttons in the full generator form)
                    const selectedPortionsElement = document.querySelector('input[name="portions"]:checked');
                    const portions = selectedPortionsElement ? selectedPortionsElement.value : '2';

                    store.setItem('weeklyPlan', singleDayPlan);
                    store.setItem('persons', portions); // Store portions setting

                    ui.renderDashboard(singleDayPlan, handleRecipeSelect, handleInfoClick);
                    ui.updateConfirmButtonState(singleDayPlan); // This might disable confirm if only one day
                    ui.switchView('dashboard-view');
                    navLinks.forEach(n => n.classList.remove('active'));
                    const dashboardNav = document.querySelector('.nav-item[data-view="dashboard"]');
                    if (dashboardNav) dashboardNav.classList.add('active');

                    // Reset for next time
                    currentlySelectedSingleRecipe = null;
                    if (createSingleRecipePlanBtn) createSingleRecipePlanBtn.disabled = true;
                });
            }

            function initUI() {
                // Set the correct radio button based on the 'persons' value from localStorage
                const currentPortions = store.getItem('persons') || '2'; // Default to '2' if not set
                if (document.getElementById('portions-' + currentPortions)) {
                    document.getElementById('portions-' + currentPortions).checked = true;
                } else { // Fallback if stored value is invalid, default to 2
                    document.getElementById('portions-2').checked = true;
                }

                // inventoryInput.value = inventory.join(', '); // Old inventory input, remove
                renderCurrentPantry(); // Initialize pantry display
                ui.renderDashboard(weeklyPlan, handleRecipeSelect, handleInfoClick);
                ui.updateConfirmButtonState(weeklyPlan);
                ui.switchView('dashboard-view'); // Default view
                document.querySelector('.nav-item[data-view="dashboard"]').classList.add('active');
                ui.showApp();
            }

            // Event listener for the export button
            if (exportShoppingListBtn) {
                exportShoppingListBtn.addEventListener('click', () => {
                    const currentShoppingList = generateShoppingList(weeklyPlan, userPantry, persons, PANTRY_CATEGORIES);
                    if (!currentShoppingList || currentShoppingList.length === 0) {
                        alert("Die Einkaufsliste ist leer. Es gibt nichts zu kopieren.");
                        return;
                    }

                    let listAsText = "Meine Einkaufsliste:\n";
                    currentShoppingList.forEach(item => {
                        // Only include items not marked as 'haveAtHome' or handle as per user preference for export
                        // For now, exporting all items from the generated list, indicating which are at home.
                        // The request was "For the export I just need the ingredient and the total quantity values"
                        // So, we'll iterate through unitEntries for each item.
                        item.unitEntries.forEach(unitEntry => {
                            const displayTotalQuantity = Number.isInteger(unitEntry.totalQuantity)
                            ? unitEntry.totalQuantity
                            : parseFloat(unitEntry.totalQuantity).toFixed(unitEntry.totalQuantity < 1 && unitEntry.totalQuantity > 0 ? 2 : (unitEntry.totalQuantity === 0 ? 0 : 1));

                            listAsText += `- ${item.displayName}: ${displayTotalQuantity} ${unitEntry.unit}\n`;
                        });
                    });

                    navigator.clipboard.writeText(listAsText)
                        .then(() => {
                            const originalButtonText = exportShoppingListBtn.innerHTML;
                            exportShoppingListBtn.innerHTML = '<i class="ti ti-check"></i> Kopiert!';
                            exportShoppingListBtn.disabled = true;
                            setTimeout(() => {
                                exportShoppingListBtn.innerHTML = originalButtonText;
                                exportShoppingListBtn.disabled = false;
                            }, 2000);
                        })
                        .catch(err => {
                            console.error('Fehler beim Kopieren in die Zwischenablage:', err);
                            alert('Kopieren fehlgeschlagen. Bitte versuche es manuell oder prüfe die Browser-Berechtigungen.');
                        });
                });
            }

            // Event delegation for shopping list item checkboxes
            if (shoppingListContainer) {
                shoppingListContainer.addEventListener('change', (e) => {
                    if (e.target.classList.contains('shopping-list-item-checkbox')) {
                        const card = e.target.closest('.shopping-list-item-card');
                        const itemName = card.dataset.ingredientName;
                        if (e.target.checked) {
                            card.classList.add('collected');
                            collectedShoppingListItems.add(itemName);
                        } else {
                            card.classList.remove('collected');
                            collectedShoppingListItems.delete(itemName);
                        }
                        // Note: This state is currently not persisted in localStorage,
                        // so it will reset on page reload.
                        // To persist, update localStorage here and read from it when rendering.
                    }
                });
            }

            // Modify the part where shopping list is rendered to check against collectedShoppingListItems
            // This is typically when switching to the shopping-list-view or confirming a plan.
            // The actual rendering logic is in ui.js, so we need to pass the `collectedShoppingListItems` set to it.
            // Or, more simply, iterate over checkboxes after ui.renderShoppingList completes.

            const originalRenderShoppingList = ui.renderShoppingList;
            ui.renderShoppingList = (list) => {
                originalRenderShoppingList(list); // Call original render
                // After rendering, iterate through displayed items and set their checked state
                if (list && list.length > 0) {
                    document.querySelectorAll('#shopping-list-container .shopping-list-item-card').forEach(card => {
                        const itemName = card.dataset.ingredientName;
                        const checkbox = card.querySelector('.shopping-list-item-checkbox');
                        if (checkbox && collectedShoppingListItems.has(itemName)) {
                            checkbox.checked = true;
                            card.classList.add('collected');
                        } else if (checkbox) {
                            checkbox.checked = false;
                            card.classList.remove('collected');
                        }
                    });
                }
            };


            initUI();
        })
        .catch(error => {
            console.error('Fehler beim Laden der Daten:', error);
            document.getElementById('loading-screen').innerHTML = `<p style="color:red;">Fehler: Daten konnten nicht geladen werden (${error.message}). Bitte die Seite neu laden.</p>`;
        });
}

// Expose initializeApp for testing purposes
if (typeof window !== 'undefined') {
    window.testableInitializeApp = initializeApp;
}

document.addEventListener('DOMContentLoaded', () => {
    initializeApp(); // Standard execution path
});