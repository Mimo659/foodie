// Element selectors, kept at the top for easy access if needed by multiple functions
const modal = document.getElementById('recipe-modal');
const modalBody = document.getElementById('modal-body');
const modalCloseBtn = modal ? modal.querySelector('.modal-close-btn') : null; // Guard against modal not found
const deleteInventoryRecipesBtn = document.getElementById('delete-inventory-recipes-btn');
const dynamicTagsCheckboxContainer = document.getElementById('dynamic-tags-checkboxes');

// Private helper function for closing the modal
const closeModal = () => {
    if (modal) modal.classList.add('hidden');
};

// Event listeners for modal, setup once
if (modal && modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === "Escape" && !modal.classList.contains('hidden')) closeModal(); });
} else {
    console.warn("Modal elements not found for ui.js event listeners.");
}

export const populateTagFilters = (tags) => {
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

export const openRecipeModal = (recipe) => {
    if (!modal || !modalBody) {
        console.error("Modal or modal body not found for openRecipeModal.");
        return;
    }
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

// This function is used by many render functions, so it's good to keep it in this module.
// If it were only used by one, it could be a private function within that render function.
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

    const btnInfo = cardContent.querySelector('.btn-info');
    if (btnInfo) {
        btnInfo.addEventListener('click', (e) => { e.stopPropagation(); onInfoClick(recipe); });
    }
    return card;
};

export const renderDashboard = (plan, onInfoClick) => { // onSelectRecipe callback removed
    const planDisplay = document.getElementById('plan-display');
    const noPlanDisplay = document.getElementById('no-plan-display');
    const weeklyPlanContainer = document.getElementById('weekly-plan-container');
    const planInstructions = planDisplay ? planDisplay.querySelector('.plan-instructions') : null;

    if (!planDisplay || !noPlanDisplay || !weeklyPlanContainer || !planInstructions) {
        console.error("Dashboard elements not found for rendering.");
        return;
    }

    if (plan && plan.length > 0 && plan.some(day => day.selected)) {
        weeklyPlanContainer.innerHTML = '';
        // Using 'recipe-options' class for a grid of selected recipe cards, similar to original intent
        weeklyPlanContainer.className = 'recipe-options dashboard-plan-grid';

        let hasRenderedSelectedDay = false;
        plan.forEach((dayObject) => {
            if (dayObject.selected) {
                hasRenderedSelectedDay = true;
                const dayContainer = document.createElement('div');
                dayContainer.className = 'dashboard-recipe-wrapper'; // Wrapper for title + card

                const titleElement = document.createElement('h4');
                titleElement.textContent = dayObject.day;
                titleElement.style.marginBottom = '0.5rem';
                titleElement.style.textAlign = 'center';

                const recipeCard = createRecipeCardElement(dayObject.selected, onInfoClick);
                recipeCard.classList.add('confirmed-selection'); // Ensure it looks confirmed

                dayContainer.appendChild(titleElement);
                dayContainer.appendChild(recipeCard);
                weeklyPlanContainer.appendChild(dayContainer);
            }
            // If dayObject.selected is null, we simply don't render anything for that day on the dashboard.
            // The dashboard is for viewing the *confirmed* plan.
        });

        if (hasRenderedSelectedDay) {
            planDisplay.classList.remove('hidden');
            planDisplay.style.display = '';
            noPlanDisplay.classList.add('hidden');
            noPlanDisplay.style.display = 'none';

            // Check if ALL days in the original plan structure have a selection.
            // This is important for plans that might be shorter than 7 days.
            const allDaysInPlanSelected = plan.every(day => day.selected);
            if (allDaysInPlanSelected) {
                planInstructions.textContent = "Dein Plan ist fertig! Bestätige ihn, um die Einkaufsliste zu erstellen.";
            } else {
                // This state should ideally not be reached if coming from the new generator flow,
                // as that requires all selections before confirming to dashboard.
                // However, could be relevant for partially selected plans from older storage.
                planInstructions.textContent = "Dein Plan ist teilweise ausgewählt. Gehe zu 'Plan erstellen' um ihn zu vervollständigen oder anzupassen.";
            }
        } else {
             // This means a plan structure exists, but nothing is selected (e.g. old plan from storage)
            planDisplay.classList.add('hidden');
            planDisplay.style.display = 'none';
            noPlanDisplay.classList.remove('hidden');
            noPlanDisplay.style.display = 'block';
        }
    } else { // No plan, or plan exists but no recipes selected at all
        planDisplay.classList.add('hidden');
        planDisplay.style.display = 'none';
        noPlanDisplay.classList.remove('hidden');
        noPlanDisplay.style.display = 'block';
        weeklyPlanContainer.innerHTML = '';
        weeklyPlanContainer.className = '';
        planInstructions.textContent = "Erstelle zuerst einen Plan."; // Default message
    }
};

export const renderInventoryResults = (recipes, onInfoClick) => {
    const container = document.getElementById('inventory-results-container');
    if (!container) {
        console.error("Inventory results container not found.");
        return;
    }
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
};

export const clearInventoryResults = () => {
    const container = document.getElementById('inventory-results-container');
     if (!container) {
        console.error("Inventory results container not found for clearing.");
        return;
    }
    container.innerHTML = ''; // Clear the recipe cards
    if (deleteInventoryRecipesBtn) deleteInventoryRecipesBtn.classList.add('hidden');
    // Add a placeholder message if desired
    const resultsHeader = document.createElement('h3');
    resultsHeader.innerHTML = '<i class="fa-solid fa-lightbulb"></i> Deine besten Optionen';
    container.appendChild(resultsHeader);
    const placeholder = document.createElement('p');
    placeholder.textContent = 'Gib Zutaten in deinen Vorrat ein, um Rezeptvorschläge zu sehen, oder lösche die aktuelle Ansicht.';
    container.appendChild(placeholder);
};

export const renderSuggestedRecipes = (recipes, onSelectSuggestedRecipe, onInfoClick) => {
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
                const allSuggestedCards = container.querySelectorAll('.suggested-recipe-card');
                if (allSuggestedCards) {
                    allSuggestedCards.forEach(c => c.classList.remove('selected'));
                }
                e.currentTarget.classList.add('selected');
                onSelectSuggestedRecipe(recipe); // Pass the full recipe object to the callback
            });
            container.appendChild(card);
        });
    } else {
        container.innerHTML = '<p>Keine Rezeptvorschläge verfügbar.</p>';
    }
};

export const switchView = (viewId) => {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.remove('hidden');
    } else {
        console.error(`View with ID ${viewId} not found.`);
    }
};

export const updateConfirmButtonState = (plan) => {
    const btn = document.getElementById('confirm-plan-btn');
    if (!btn) return;
    if (!plan || plan.length === 0) { btn.disabled = true; return; }
    btn.disabled = !plan.every(day => day.selected !== null);
};

export const showApp = () => {
    const loadingScreen = document.getElementById('loading-screen');
    const appContent = document.getElementById('app-content');
    if (loadingScreen && appContent) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => loadingScreen.style.display = 'none', 500);
        appContent.classList.remove('content-hidden');
    } else {
        console.error("Loading screen or app content not found for showApp.");
    }
};

export const setButtonLoadingState = (button, isLoading) => {
    if (!button) return;
    const originalHtml = `<i class="ti ti-rocket"></i> Plan generieren`; // Changed icon and ensured text is "Plan generieren"
    if (isLoading) { button.disabled = true; button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generiere...`; }
    else { button.disabled = false; button.innerHTML = originalHtml; }
};

export const renderShoppingList = (shoppingList) => {
    const container = document.getElementById('shopping-list-container');
    const noListMsg = document.getElementById('no-shopping-list');

    if (!container || !noListMsg) {
        console.error("Shopping list container or no-list message not found.");
        return;
    }
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
        noListMsg.classList.add('hidden');
    } else {
        container.className = ''; // Reset class if empty
        container.classList.add('hidden');
        noListMsg.classList.remove('hidden');
    }
};

export const renderDailyOptionsInGeneratorView = (plan, onInfoClick, onSelectRecipe) => {
    const container = document.getElementById('daily-options-display-container');
    if (!container) return;
    container.innerHTML = ''; // Clear previous options

    if (plan && plan.length > 0) {
        container.className = 'daily-selection-container'; // Use same styling as dashboard had for options

        plan.forEach((dayObject, dayIndex) => {
            const dayCard = document.createElement('div');
            dayCard.className = 'day-selection-card';
            dayCard.dataset.dayIndex = dayIndex;

            const dayTitle = document.createElement('h3');
            dayTitle.textContent = dayObject.day;
            dayCard.appendChild(dayTitle);

            if (dayObject.options && dayObject.options.length > 0) {
                const optionsContainer = document.createElement('div');
                optionsContainer.className = 'recipe-options-for-day'; // This class should define a stable grid or flex layout

                dayObject.options.forEach((recipeOption, optionIndex) => {
                    const optionWrapper = document.createElement('div');
                    optionWrapper.className = 'recipe-option-wrapper'; // Wrapper for radio and card

                    const recipeCardInstance = createRecipeCardElement(recipeOption, onInfoClick);
                    const radioButton = document.createElement('input');
                    radioButton.type = 'radio';
                    radioButton.name = `gen-day-${dayIndex}-selection`; // Unique name for radio group per day
                    radioButton.value = recipeOption.id;
                    radioButton.dataset.recipeIndex = optionIndex; // Store option index for logic if needed
                    radioButton.className = 'recipe-select-radio-generator visually-hidden-radio'; // Hide actual radio

                    // Check if this option is the currently selected one for the day
                    if (dayObject.selected && dayObject.selected.id === recipeOption.id) {
                        radioButton.checked = true;
                        recipeCardInstance.classList.add('selected-by-radio'); // Visual cue for selected card
                    }

                    // Event listener on the card itself to act as the radio button label
                    recipeCardInstance.addEventListener('click', (e) => {
                        // If the click is on the info button, let its own handler work and don't select
                        if (e.target.closest('.btn-info')) {
                            return;
                        }
                        e.stopPropagation(); // Prevent other click listeners if any

                        // Visually unselect all other cards in this day's options
                        const allCardsInGroup = optionsContainer.querySelectorAll('.recipe-card');
                        allCardsInGroup.forEach(card => card.classList.remove('selected-by-radio'));

                        // Visually select the clicked card
                        recipeCardInstance.classList.add('selected-by-radio');

                        // Programmatically check the hidden radio button
                        radioButton.checked = true;

                        // Manually trigger a 'change' event on the radio button
                        // This is crucial for the event listener in generatorView.js to pick up the change
                        const changeEvent = new Event('change', { bubbles: true });
                        radioButton.dispatchEvent(changeEvent);
                    });

                    optionWrapper.appendChild(radioButton); // Radio first (though hidden)
                    optionWrapper.appendChild(recipeCardInstance); // Then the card
                    optionsContainer.appendChild(optionWrapper);
                });
                dayCard.appendChild(optionsContainer);

                // Add a message if a recipe is selected
                if (dayObject.selected) {
                    const selectedInfoText = document.createElement('p');
                    selectedInfoText.className = 'selected-option-info'; // For styling
                    selectedInfoText.innerHTML = `Ausgewählt: <strong>${dayObject.selected.title}</strong>. Wähle eine andere Option, um zu wechseln.`;
                    selectedInfoText.style.fontSize = '0.9em';
                    selectedInfoText.style.textAlign = 'center';
                    selectedInfoText.style.marginTop = '0.5rem'; // Add some space
                    dayCard.appendChild(selectedInfoText);
                }

            } else {
                const noOptionsMsg = document.createElement('p');
                noOptionsMsg.textContent = "Keine Rezeptoptionen für diesen Tag verfügbar.";
                dayCard.appendChild(noOptionsMsg);
            }
            container.appendChild(dayCard);
        });
    } else {
        container.innerHTML = '<p>Kein Plan zum Anzeigen der Optionen vorhanden.</p>';
    }
};

export const updateGeneratorConfirmButtonState = (plan) => {
    const btn = document.getElementById('confirm-generated-plan-btn');
    if (!btn) return;
    if (!plan || plan.length === 0) {
        btn.disabled = true;
        return;
    }
    btn.disabled = !plan.every(day => day.selected !== null && day.selected !== undefined);
};