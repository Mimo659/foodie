const ui = (() => {
    const modal = document.getElementById('recipe-modal');
    const modalBody = document.getElementById('modal-body');
    const modalCloseBtn = document.querySelector('.modal-close-btn');
    const deleteInventoryRecipesBtn = document.getElementById('delete-inventory-recipes-btn');
        const dynamicTagsCheckboxContainer = document.getElementById('dynamic-tags-checkboxes');

    const closeModal = () => modal.classList.add('hidden');

        const populateTagFilters = (tags) => {
            if (!dynamicTagsCheckboxContainer) return;
            dynamicTagsCheckboxContainer.innerHTML = ''; // Clear any existing
            tags.forEach(tag => {
                const checkboxDiv = document.createElement('div');
                checkboxDiv.className = 'checkbox-group';
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `tag-${tag.toLowerCase().replace(/\s+/g, '-')}`;
                checkbox.name = 'dynamic-tag';
                checkbox.value = tag;
                const label = document.createElement('label');
                label.htmlFor = checkbox.id;
                label.textContent = tag;
                checkboxDiv.appendChild(checkbox);
                checkboxDiv.appendChild(label);
                dynamicTagsCheckboxContainer.appendChild(checkboxDiv);
            });
        };

    const openModalWithRecipe = (recipe) => {
        // Ingredients are now an array of strings
        let ingredientsHtml = recipe.ingredients && Array.isArray(recipe.ingredients)
            ? recipe.ingredients.map(ingString => `<li>${ingString}</li>`).join('')
            : '<li>Zutaten nicht verfügbar</li>';

        let instructionsHtml = recipe.instructions && Array.isArray(recipe.instructions)
            ? recipe.instructions.map((step, index) => `<li><strong>Schritt ${index + 1}:</strong> ${step}</li>`).join('')
            : '<li>Anleitung nicht verfügbar</li>';

        // Use recipe.title, and recipe.difficulty for description if recipe.description is missing
        const recipeName = recipe.title || "Unbenanntes Rezept";
        const recipeDescription = recipe.description || (recipe.difficulty ? `Schwierigkeit: ${recipe.difficulty}` : "Keine Beschreibung verfügbar.");

        modalBody.innerHTML = `<h2>${recipeName}</h2><p>${recipeDescription}</p><h3><i class="fa-solid fa-list-check"></i> Zutaten</h3><ul class="ingredient-list">${ingredientsHtml}</ul><h3><i class="fa-solid fa-person-chalkboard"></i> Anleitung</h3><ol class="instructions-list">${instructionsHtml}</ol>`;
        modal.classList.remove('hidden');
    };
    
    modalCloseBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === "Escape" && !modal.classList.contains('hidden')) closeModal(); });
    
    const createRecipeCardElement = (recipe, onInfoClick) => {
        const card = document.createElement('div');
        card.className = 'recipe-card';

        // recipe.estimatedCostPerServing is not in data/recipes.json, hide price tag or show placeholder
        const priceTagHtml = (typeof recipe.estimatedCostPerServing === 'number' && !isNaN(recipe.estimatedCostPerServing))
            ? `<span class="price-tag">~${recipe.estimatedCostPerServing.toFixed(2)}€/P</span>`
            : '';

        let tagsHtml = `<div class="tags">${priceTagHtml}`;
        if (recipe.tags && Array.isArray(recipe.tags)) {
            recipe.tags.forEach(tag => {
                // Special handling for 'schnell' to include an icon, if desired
                if (tag.toLowerCase() === 'schnell') {
                    tagsHtml += `<span><i class="fa-solid fa-bolt"></i> ${tag}</span>`;
                } else {
                    tagsHtml += `<span>${tag}</span>`;
                }
            });
        }
        tagsHtml += `</div>`;

        let matchInfoHtml = '';
        if (recipe.matchPercentage !== undefined) {
            const percentage = Math.round(recipe.matchPercentage * 100);
            // recipe.missingIngredients is now an array of strings
            const missingText = recipe.missingIngredients && recipe.missingIngredients.length > 0
                ? `<p class="missing-ingredients"><strong>Fehlt noch:</strong> ${recipe.missingIngredients.join(', ')}</p>`
                : `<p class="all-ingredients-present"><i class="fa-solid fa-check-double"></i> Alles da!</p>`;
            matchInfoHtml = `<div class="match-info"><div class="match-bar"><div class="match-bar-fill" style="width: ${percentage}%"></div></div><span class="match-text">${percentage}% Übereinstimmung</span>${missingText}</div>`;
        }

        const recipeName = recipe.title || "Unbenanntes Rezept";
        const recipeDescription = recipe.description || (recipe.difficulty ? `Schwierigkeit: ${recipe.difficulty}` : "Keine Beschreibung verfügbar.");

        let nutritionHtml = '';
        if (recipe.nutritionalInfo) {
            nutritionHtml += '<div class="recipe-nutrition-info">';
            nutritionHtml += '<h5>Nährwerte (pro Portion)</h5><ul>'; // Corrected: pro Portion, not pro 100g unless specified
            for (const [key, value] of Object.entries(recipe.nutritionalInfo)) {
                nutritionHtml += `<li><strong>${key}:</strong> ${value}</li>`;
            }
            nutritionHtml += '</ul></div>';
        }

        const cardContent = document.createElement('div');
        cardContent.className = 'recipe-card-content';
        cardContent.innerHTML = `<h4>${recipeName}</h4><p>${recipeDescription}</p>${tagsHtml}${nutritionHtml}${matchInfoHtml}<button class="btn-info"><i class="fa-solid fa-book-open"></i> Rezept ansehen</button>`;

        card.appendChild(cardContent);

        cardContent.querySelector('.btn-info').addEventListener('click', (e) => { e.stopPropagation(); onInfoClick(recipe); });
        return card;
    };
    
    return {
        populateTagFilters, // Expose the new function
        renderDashboard: (plan, onSelectRecipe, onInfoClick) => {
            const planDisplay = document.getElementById('plan-display');
            const noPlanDisplay = document.getElementById('no-plan-display');
            const weeklyPlanContainer = document.getElementById('weekly-plan-container');
            if (plan && plan.length > 0) {
                weeklyPlanContainer.innerHTML = ''; // Clear previous plan cards
                weeklyPlanContainer.className = ''; // Reset class from weekly-plan-grid if it was set

                plan.forEach((dayObject, dayIndex) => {
                    const dayContainer = document.createElement('div');
                    dayContainer.className = 'day-container'; // Use the old class for rows

                    const dayTitle = document.createElement('h3'); // Use h3 as it was before
                    dayTitle.textContent = dayObject.day;
                    dayContainer.appendChild(dayTitle);

                    const optionsContainer = document.createElement('div');
                    optionsContainer.className = 'recipe-options'; // Use the old class for 2-column recipe layout

                    if (dayObject.options && dayObject.options.length > 0) {
                        dayObject.options.forEach(recipe => {
                            const card = createRecipeCardElement(recipe, onInfoClick);
                            card.dataset.dayIndex = dayIndex;
                            card.dataset.recipeId = recipe.id;
                            if (dayObject.selected && dayObject.selected.id === recipe.id) {
                                card.classList.add('selected');
                            }
                            card.addEventListener('click', (e) => {
                                // Remove 'selected' from sibling cards in the same day's optionsContainer
                                optionsContainer.querySelectorAll('.recipe-card').forEach(c => c.classList.remove('selected'));
                                // Add 'selected' to the clicked card
                                e.currentTarget.classList.add('selected');
                                onSelectRecipe(e.currentTarget.dataset.dayIndex, e.currentTarget.dataset.recipeId);
                            });
                            optionsContainer.appendChild(card);
                        });
                    } else {
                        optionsContainer.innerHTML = '<p class="no-options-text">Keine Optionen für diesen Tag.</p>';
                    }
                    dayContainer.appendChild(optionsContainer);
                    weeklyPlanContainer.appendChild(dayContainer);
                });

                if (planDisplay) {
                    planDisplay.classList.remove('hidden');
                    planDisplay.style.display = '';
                }
                if (noPlanDisplay) {
                    noPlanDisplay.classList.add('hidden');
                    noPlanDisplay.style.display = 'none';
                }
            } else {
                if (planDisplay) {
                    planDisplay.classList.add('hidden');
                    planDisplay.style.display = 'none';
                }
                if (noPlanDisplay) {
                    noPlanDisplay.classList.remove('hidden');
                    noPlanDisplay.style.display = 'block';
                }
                if (weeklyPlanContainer) {
                    weeklyPlanContainer.innerHTML = '';
                    weeklyPlanContainer.className = ''; // Reset class
                }
            }
        },
        renderInventoryResults: (recipes, onInfoClick) => {
            const container = document.getElementById('inventory-results-container');
            container.innerHTML = ''; // Clear previous results
            const resultsHeader = document.createElement('h3');
            resultsHeader.innerHTML = '<i class="fa-solid fa-lightbulb"></i> Deine besten Optionen';
            container.appendChild(resultsHeader);

            const resultsDiv = document.createElement('div');
            if (recipes.length === 0) {
                resultsDiv.innerHTML = '<p>Keine Rezepte gefunden, für die du mindestens 55% der Zutaten hast.</p>';
                if (deleteInventoryRecipesBtn) deleteInventoryRecipesBtn.classList.add('hidden');
            } else {
                recipes.forEach(recipe => resultsDiv.appendChild(createRecipeCardElement(recipe, onInfoClick)));
                if (deleteInventoryRecipesBtn) deleteInventoryRecipesBtn.classList.remove('hidden');
            }
            container.appendChild(resultsDiv);
        },
        clearInventoryResults: () => {
            const container = document.getElementById('inventory-results-container');
            container.innerHTML = ''; // Clear the recipe cards
            if (deleteInventoryRecipesBtn) deleteInventoryRecipesBtn.classList.add('hidden');
            // Add a placeholder message if desired
            const resultsHeader = document.createElement('h3');
            resultsHeader.innerHTML = '<i class="fa-solid fa-lightbulb"></i> Deine besten Optionen';
            container.appendChild(resultsHeader);
            const placeholder = document.createElement('p');
            placeholder.textContent = 'Gib Zutaten in deinen Vorrat ein, um Rezeptvorschläge zu sehen, oder lösche die aktuelle Ansicht.';
            container.appendChild(placeholder);
        },
        renderSuggestedRecipes: (recipes, onSelectSuggestedRecipe, onInfoClick) => {
            const container = document.getElementById('suggested-recipes-container');
            if (!container) return;
            container.innerHTML = ''; // Clear previous suggestions

            if (recipes && recipes.length > 0) {
                recipes.forEach(recipe => {
                    const card = createRecipeCardElement(recipe, onInfoClick); // Reuse existing card creator
                    card.dataset.recipeId = recipe.id; // Store recipe ID for selection
                    card.classList.add('suggested-recipe-card'); // Add a class for specific styling or selection logic

                    card.addEventListener('click', (e) => {
                        // Handle visual selection: remove 'selected' from other suggested cards
                        container.querySelectorAll('.suggested-recipe-card').forEach(c => c.classList.remove('selected'));
                        e.currentTarget.classList.add('selected');
                        onSelectSuggestedRecipe(recipe); // Pass the full recipe object to the callback
                    });
                    container.appendChild(card);
                });
            } else {
                container.innerHTML = '<p>Keine Rezeptvorschläge verfügbar.</p>';
            }
        },
        openRecipeModal: openModalWithRecipe,
        switchView: (viewId) => { document.querySelectorAll('.view').forEach(v => v.classList.add('hidden')); document.getElementById(viewId).classList.remove('hidden'); },
        updateConfirmButtonState: (plan) => {
            const btn = document.getElementById('confirm-plan-btn');
            if (!plan || plan.length === 0) { btn.disabled = true; return; }
            btn.disabled = !plan.every(day => day.selected !== null);
        },
        showApp: () => {
            const loadingScreen = document.getElementById('loading-screen');
            loadingScreen.style.opacity = '0';
            setTimeout(() => loadingScreen.style.display = 'none', 500);
            document.getElementById('app-content').classList.remove('content-hidden');
        },
        setButtonLoadingState: (button, isLoading) => {
            const originalHtml = `<i class="fa-solid fa-paper-plane"></i> Plan generieren`;
            if (isLoading) { button.disabled = true; button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generiere...`; } 
            else { button.disabled = false; button.innerHTML = originalHtml; }
        },
        renderShoppingList: (shoppingList) => {
            const container = document.getElementById('shopping-list-container');
            const noListMsg = document.getElementById('no-shopping-list');
            container.innerHTML = ''; // Clear previous content

            if (shoppingList && shoppingList.length > 0) {
                // Use the new grid container class
                container.className = 'shopping-list-items-grid';

                shoppingList.forEach(ingredientGroup => {
                    const haveAtHomeClass = ingredientGroup.haveAtHome ? 'have-at-home' : '';
                    const atHomeIconHtml = ingredientGroup.haveAtHome
                        ? '<i class="fa-solid fa-house-circle-check have-at-home-icon" title="Ganz oder teilweise vorhanden"></i>'
                        : '';
                    const combinedIconHtml = ingredientGroup.combined
                        ? ' <i class="fa-solid fa-layer-group combined-icon" title="Zusammengefasst aus mehreren Rezepten oder gleichen Zutaten"></i>'
                        : '';

                    let unitEntriesHtml = '';
                    ingredientGroup.unitEntries.forEach(unitEntry => {
                        const displayTotalQuantity = Number.isInteger(unitEntry.totalQuantity)
                            ? unitEntry.totalQuantity
                            : parseFloat(unitEntry.totalQuantity).toFixed(unitEntry.totalQuantity < 1 && unitEntry.totalQuantity > 0 ? 2 : (unitEntry.totalQuantity === 0 ? 0 : 1));

                        let sourcesHtml = '';
                        if (unitEntry.recipeSources && unitEntry.recipeSources.length > 0) {
                            sourcesHtml = '<ul class="source-list">';
                            unitEntry.recipeSources.forEach(rs => {
                                sourcesHtml += `<li><i class="fa-solid fa-utensils"></i> ${rs.recipeName}: ${rs.quantity} ${unitEntry.unit}</li>`;
                            });
                            sourcesHtml += '</ul>';
                        }

                        unitEntriesHtml += `
                            <div class="unit-entry">
                                <p class="total-quantity"><i class="fa-solid fa-boxes-stacked"></i> ${displayTotalQuantity} ${unitEntry.unit}</p>
                                ${sourcesHtml}
                            </div>`;
                    });

                    const cardHtml = `
                        <div class="shopping-list-item-card ${haveAtHomeClass}" data-ingredient-name="${ingredientGroup.displayName}">
                            <div class="item-card-header">
                                <input type="checkbox" class="shopping-list-item-checkbox" aria-label="Artikel gesammelt ${ingredientGroup.displayName}">
                                <h4>${ingredientGroup.displayName}${combinedIconHtml}</h4>
                                ${atHomeIconHtml}
                            </div>
                            <div class="item-card-body">
                                ${unitEntriesHtml}
                            </div>
                        </div>`;
                    container.innerHTML += cardHtml;
                });

                container.classList.remove('hidden');
                if (noListMsg) noListMsg.classList.add('hidden');
            } else {
                container.className = ''; // Reset class if empty
                container.classList.add('hidden');
                if (noListMsg) noListMsg.classList.remove('hidden');
            }
        }
    };
})();