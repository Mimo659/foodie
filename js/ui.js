// Element selectors - modal related ones are now fetched on demand or in an init function
const deleteInventoryRecipesBtn = document.getElementById('delete-inventory-recipes-btn');
const dynamicTagsCheckboxContainer = document.getElementById('dynamic-tags-checkboxes');

// Private helper function for closing the modal
const closeModal = () => {
    const modal = document.getElementById('recipe-modal');
    if (modal) modal.classList.add('hidden');
};

// Setup modal event listeners - can be called after DOM is ready, e.g., from app.js or an initUI function
function setupModalEventListeners() {
    const modal = document.getElementById('recipe-modal');
    const modalCloseBtn = modal ? modal.querySelector('.modal-close-btn') : null;

    if (modal && modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
        document.addEventListener('keydown', (e) => {
            // Check if modal is not null and not hidden before attempting to close
            if (modal && !modal.classList.contains('hidden') && e.key === "Escape") {
                closeModal();
            }
        });
    } else {
        console.warn("Modal elements not found for setting up ui.js event listeners.");
    }
}
// Call it if app.js doesn't have an explicit UI init phase after DOMContentLoaded
// For now, let's assume app.js structure handles calling this or similar.
// Or, more simply, it can be called at the end of this file if this module is deferred.
// Best practice: app.js calls an initUI() function exported from here after DOMContentLoaded.
// For this fix, I'll assume it's called. If not, this would need to be exported and called.
// Let's make it self-calling for now if not part of a larger init pattern in app.js
// if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', setupModalEventListeners);
// } else {
//     setupModalEventListeners();
// }
// Simpler: app.js calls this. So, export it or make it part of a general ui.init()

export function initModal() { // Export a function to be called by app.js
    setupModalEventListeners();
    setupCookingStepsModalEventListeners(); // Add setup for the new modal
}

// --- Cooking Steps Modal Logic ---
const closeCookingStepsModal = () => {
    const cookingModal = document.getElementById('cooking-steps-modal');
    if (cookingModal) cookingModal.classList.add('hidden');
};

function updateStepStates(stepsList, currentStepIndex) {
    const steps = stepsList.querySelectorAll('.cooking-step');
    steps.forEach((step, index) => {
        step.classList.remove('step-active', 'step-completed', 'step-pending');
        const doneBtn = step.querySelector('.step-done-btn');

        if (index < currentStepIndex) {
            step.classList.add('step-completed');
            if (doneBtn) {
                doneBtn.innerHTML = '<i class="ti ti-check"></i> Erledigt';
                doneBtn.disabled = true;
            }
        } else if (index === currentStepIndex) {
            step.classList.add('step-active');
            if (doneBtn) {
                doneBtn.innerHTML = '<i class="ti ti-player-play"></i> Als erledigt markieren';
                doneBtn.disabled = false;
            }
        } else {
            step.classList.add('step-pending');
            if (doneBtn) {
                doneBtn.innerHTML = '<i class="ti ti-player-play"></i> Als erledigt markieren';
                doneBtn.disabled = true;
            }
        }
    });

    const cookingStepsFinishedMessage = document.getElementById('cooking-steps-modal').querySelector('.cooking-steps-finished');
    if (currentStepIndex >= steps.length) {
        if (cookingStepsFinishedMessage) cookingStepsFinishedMessage.classList.remove('hidden');
    } else {
        if (cookingStepsFinishedMessage) cookingStepsFinishedMessage.classList.add('hidden');
    }
}

export const openCookingStepsModal = (recipe) => {
    const cookingModal = document.getElementById('cooking-steps-modal');
    const stepsList = document.getElementById('cooking-steps-list');
    const cookingStepsFinishedMessage = cookingModal.querySelector('.cooking-steps-finished');

    if (!cookingModal || !stepsList || !cookingStepsFinishedMessage) {
        console.error("Cooking steps modal elements not found.");
        return;
    }

    stepsList.innerHTML = ''; // Clear previous steps
    if (!recipe.instructions || recipe.instructions.length === 0) {
        stepsList.innerHTML = '<li>Keine Kochanleitung verfügbar.</li>';
        cookingModal.classList.remove('hidden');
        return;
    }

    recipe.instructions.forEach((instruction, index) => {
        const stepLi = document.createElement('li');
        stepLi.className = 'cooking-step'; // Initial state will be set by updateStepStates
        stepLi.dataset.stepIndex = index;

        const stepTextDiv = document.createElement('div');
        stepTextDiv.className = 'step-text';
        stepTextDiv.textContent = instruction;

        const stepDoneButton = document.createElement('button');
        stepDoneButton.className = 'btn btn-sm step-done-btn';
        // Icon and text will be set by updateStepStates

        stepLi.appendChild(stepTextDiv);
        stepLi.appendChild(stepDoneButton);
        stepsList.appendChild(stepLi);
    });

    updateStepStates(stepsList, 0); // Initialize with the first step active
    cookingModal.classList.remove('hidden');
};

function setupCookingStepsModalEventListeners() {
    const cookingModal = document.getElementById('cooking-steps-modal');
    const stepsList = document.getElementById('cooking-steps-list');
    const closeBtnMain = cookingModal ? cookingModal.querySelector('.modal-close-btn') : null;
    const closeBtnFinished = cookingModal ? cookingModal.querySelector('.close-cooking-modal-btn') : null;

    if (closeBtnMain) {
        closeBtnMain.addEventListener('click', closeCookingStepsModal);
    }
    if (closeBtnFinished) {
        closeBtnFinished.addEventListener('click', closeCookingStepsModal);
    }
    if (cookingModal) {
        cookingModal.addEventListener('click', (e) => {
            if (e.target === cookingModal) {
                closeCookingStepsModal();
            }
        });
    }
    // Event listener for Esc key to close cooking steps modal
    document.addEventListener('keydown', (e) => {
        if (cookingModal && !cookingModal.classList.contains('hidden') && e.key === "Escape") {
            closeCookingStepsModal();
        }
    });

    if (stepsList) {
        stepsList.addEventListener('click', (e) => {
            const doneBtn = e.target.closest('.step-done-btn');
            if (doneBtn) {
                const stepLi = doneBtn.closest('.cooking-step');
                if (stepLi && stepLi.classList.contains('step-active')) {
                    const currentStepIndex = parseInt(stepLi.dataset.stepIndex, 10);
                    updateStepStates(stepsList, currentStepIndex + 1);
                }
            }
        });
    }
}


export const populateTagFilters = (tags) => {
    // Ensure dynamicTagsCheckboxContainer is selected when needed, not at top level
    const container = document.getElementById('dynamic-tags-checkboxes');
    if (!container) return;
    container.innerHTML = ''; // Clear any existing
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
        container.appendChild(checkboxDiv); // Use the locally scoped container
    });
};

export const openRecipeModal = (recipe) => {
    const modal = document.getElementById('recipe-modal');
    const modalBody = document.getElementById('modal-body');
    if (!modal || !modalBody) {
        console.error("Modal or modal body not found for openRecipeModal.");
        return;
    }

    const recipeName = recipe.title || "Unbenanntes Rezept";
    const recipeDescriptionText = recipe.description || (recipe.difficulty ? `Schwierigkeit: ${recipe.difficulty}` : "Keine Beschreibung verfügbar.");
    const imageUrl = recipe.image || 'static/images/placeholder_large.png'; // Assume a placeholder
    const servings = recipe.servings || 'N/A';
    const prepTime = recipe.prepTime || 'N/A';
    const cookTime = recipe.cookTime || 'N/A';
    // Placeholder values for calories & ingredients count, as they are not directly in recipe object
    const calories = recipe.nutritionalInfo ? (recipe.nutritionalInfo.calories || 'N/A') : 'N/A';
    const ingredientCount = recipe.ingredients ? recipe.ingredients.length : 'N/A';


    let ingredientsHtml = recipe.ingredients && Array.isArray(recipe.ingredients)
        ? recipe.ingredients.map(ingString => `<li>${ingString}</li>`).join('')
        : '<li>Zutaten nicht verfügbar</li>';

    let instructionsHtml = recipe.instructions && Array.isArray(recipe.instructions)
        ? recipe.instructions.map((step, index) => `<li><p><strong>Schritt ${index + 1}:</strong></p><p>${step}</p></li>`).join('')
        : '<li>Anleitung nicht verfügbar</li>';

    let tagsHtml = '';
    if (recipe.tags && Array.isArray(recipe.tags) && recipe.tags.length > 0) {
        tagsHtml = recipe.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
    }

    modalBody.innerHTML = `
        <div class="recipe-detail-content">
            <div class="recipe-detail-image-placeholder" style="background-image: url('${imageUrl}');">
                </div>

            <h2 class="recipe-detail-title">${recipeName}</h2>

            <div class="recipe-detail-description">
                <p>${recipeDescriptionText}</p>
            </div>

            <div class="recipe-info-section">
                <div class="recipe-info-item">
                    <span class="icon"><i class="ti ti-clock"></i></span>
                    <span class="value">${prepTime}</span>
                    <span class="label">Vorbereitung</span>
                </div>
                <div class="recipe-info-item">
                    <span class="icon"><i class="ti ti-tools-kitchen-2"></i></span>
                    <span class="value">${ingredientCount}</span>
                    <span class="label">Zutaten</span>
                </div>
                <div class="recipe-info-item">
                    <span class="icon"><i class="ti ti-flame"></i></span>
                    <span class="value">${calories}</span>
                    <span class="label">Kalorien</span>
                </div>
                 <div class="recipe-info-item">
                    <span class="icon"><i class="ti ti-users"></i></span>
                    <span class="value">${servings}</span>
                    <span class="label">Portionen</span>
                </div>
            </div>

            <div class="recipe-detail-section ingredients-section">
                <h3 class="recipe-detail-section-title"><i class="fa-solid fa-list-check"></i> Zutaten</h3>
                <ul class="ingredient-list styled-list">${ingredientsHtml}</ul>
            </div>

            <div class="recipe-detail-section instructions-section">
                <h3 class="recipe-detail-section-title"><i class="fa-solid fa-person-chalkboard"></i> Anleitung</h3>
                <ol class="instructions-list styled-list">${instructionsHtml}</ol>
            </div>

            ${tagsHtml ? `
            <div class="recipe-detail-section recipe-tags-section">
                <h3 class="recipe-detail-section-title"><i class="fa-solid fa-tags"></i> Tags</h3>
                <div class="recipe-tags-list">${tagsHtml}</div>
            </div>` : ''}

            <div class="recipe-detail-actions">
                <button class="btn btn-primary btn-lg cook-recipe-btn"><i class="ti ti-chef-hat"></i> Rezept kochen!</button>
            </div>
        </div>`;

    // Attach event listener for the "Rezept kochen!" button
    const cookRecipeBtn = modalBody.querySelector('.cook-recipe-btn');
    if (cookRecipeBtn) {
        // Remove old listener if any to prevent multiple attachments
        cookRecipeBtn.replaceWith(cookRecipeBtn.cloneNode(true));
        modalBody.querySelector('.cook-recipe-btn').addEventListener('click', () => {
            openCookingStepsModal(recipe);
            // Optionally close the main recipe modal:
            // closeModal();
        });
    }

    modal.classList.remove('hidden');
};

const createRecipeCardElement = (recipe, onInfoClick) => {
    const card = document.createElement('div');
    card.className = 'recipe-card';

    const imageUrl = recipe.image || 'static/images/placeholder_card.png'; // Define a placeholder for card images

    // Category: Use first tag or a default. The design has small category text.
    const category = recipe.tags && recipe.tags.length > 0 ? recipe.tags[0] : 'Allgemein';
    // Small icon for category (example: using Tabler Icons)
    const categoryIcon = '<i class="ti ti-tag"></i>'; // Generic tag icon, can be more specific

    const recipeName = recipe.title || "Unbenanntes Rezept";
    // Shorten description for card if it's too long
    let recipeDescription = recipe.description || (recipe.difficulty ? `Schwierigkeit: ${recipe.difficulty}` : "Mehr Details im Rezept.");
    if (recipeDescription.length > 100) {
        recipeDescription = recipeDescription.substring(0, 97) + "...";
    }

    // Prepare tags for display - using the new .tag class
    let tagsHtml = '';
    if (recipe.tags && Array.isArray(recipe.tags)) {
        // Show a limited number of tags on the card, e.g., first 2-3
        tagsHtml = recipe.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('');
    }

    // Match info (if applicable from inventory search)
    let matchInfoHtml = '';
    if (recipe.matchPercentage !== undefined) {
        const percentage = Math.round(recipe.matchPercentage * 100);
        const missingText = recipe.missingIngredients && recipe.missingIngredients.length > 0
            ? `<p class="missing-ingredients" style="font-size:0.8em;">Fehlt: ${recipe.missingIngredients.join(', ')}</p>`
            : `<p class="all-ingredients-present" style="font-size:0.8em; color:var(--accent-green);"><i class="ti ti-check"></i> Alles da!</p>`;
        matchInfoHtml = `
            <div class="match-info mt-1">
                <small>Passend zu deinem Vorrat: ${percentage}%</small>
                <div class="progress-bar small-progress" style="height: 8px; background-color: #e0e0e0; border-radius: 4px; margin-top: 4px;">
                    <div class="progress-bar-fill" style="width: ${percentage}%; height: 100%; background-color: var(--accent-green); border-radius: 4px;"></div>
                </div>
                ${missingText}
            </div>`;
    }

    card.innerHTML = `
        <div class="recipe-card-image-placeholder" style="background-image: url('${imageUrl}');">
            </div>
        <div class="recipe-card-category">
            ${categoryIcon} <span>${category}</span>
        </div>
        <h3 class="recipe-card-title">${recipeName}</h3>
        <p class="recipe-card-description">${recipeDescription}</p>
        ${tagsHtml ? `<div class="recipe-card-tags mt-1">${tagsHtml}</div>` : ''}
        ${matchInfoHtml}
        <div class="recipe-card-actions mt-auto">
            <button class="btn btn-sm btn-primary btn-block view-recipe-btn"><i class="ti ti-eye"></i> Rezept ansehen</button>
        </div>
    `;
    // mt-auto on actions pushes it to the bottom if card content is shorter

    const btnInfo = card.querySelector('.view-recipe-btn');
    if (btnInfo) {
        btnInfo.addEventListener('click', (e) => {
            e.stopPropagation();
            onInfoClick(recipe);
        });
    }
    return card;
};


export const renderDashboard = (plan, onInfoClick) => { // onSelectRecipe callback removed
    const planDisplay = document.getElementById('plan-display');
    const noPlanDisplay = document.getElementById('no-plan-display');
    const weeklyPlanContainer = document.getElementById('weekly-plan-container');
    // const planInstructions = planDisplay ? planDisplay.querySelector('.plan-instructions') : null; // Removed as element is gone

    if (!planDisplay || !noPlanDisplay || !weeklyPlanContainer) { // Removed planInstructions from check
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

            // The text "Dein Plan ist fertig! Bestätige ihn, um die Einkaufsliste zu erstellen."
            // is now static in the HTML within .plan-confirmation-controls.
            // The conditional logic that changed planInstructions.textContent is no longer needed here
            // for the "plan is ready" state.
            // If a message for "partially selected plan" is still required,
            // it would need a new UI element or a different way to be displayed.
            // For this task, we are focusing on the "plan is ready" layout.
            // const allDaysInPlanSelected = plan.every(day => day.selected);
            // if (allDaysInPlanSelected) {
            //     // planInstructions.textContent = "Dein Plan ist fertig! Bestätige ihn, um die Einkaufsliste zu erstellen."; // Removed
            // } else {
            //     // planInstructions.textContent = "Dein Plan ist teilweise ausgewählt. Gehe zu 'Plan erstellen' um ihn zu vervollständigen oder anzupassen."; // Removed
            // }
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
        // if (planInstructions) planInstructions.textContent = "Erstelle zuerst einen Plan."; // Default message - Removed
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
        container.className = 'styled-list shopping-list-custom'; // New class for UL styling

        shoppingList.forEach(ingredientGroup => {
            const listItem = document.createElement('li');
            listItem.className = 'shopping-list-item';
            if (ingredientGroup.haveAtHome) {
                listItem.classList.add('have-at-home');
            }

            // Using Tabler Icons
            const atHomeIconHtml = ingredientGroup.haveAtHome
                ? '<i class="ti ti-home-check have-at-home-icon" title="Ganz oder teilweise vorhanden"></i> '
                : '';
            const combinedIconHtml = ingredientGroup.combined
                ? ' <i class="ti ti-package combined-icon" title="Zusammengefasst aus mehreren Quellen"></i>' // ti-package is a placeholder, could be ti-layers-intersect or similar
                : '';

            let unitEntriesDisplay = '';
            ingredientGroup.unitEntries.forEach(unitEntry => {
                const displayTotalQuantity = Number.isInteger(unitEntry.totalQuantity)
                    ? unitEntry.totalQuantity
                    : parseFloat(unitEntry.totalQuantity).toFixed(unitEntry.totalQuantity < 1 && unitEntry.totalQuantity > 0 ? 2 : (unitEntry.totalQuantity === 0 ? 0 : 1));

                unitEntriesDisplay += `<span class="quantity-unit">${displayTotalQuantity} ${unitEntry.unit}</span>`;

                if (unitEntry.recipeSources && unitEntry.recipeSources.length > 0) {
                    let sourcesTooltip = unitEntry.recipeSources.map(rs => `${rs.recipeName}: ${rs.quantity} ${unitEntry.unit}`).join('; ');
                    unitEntriesDisplay += ` <i class="ti ti-info-circle source-info-icon" title="${sourcesTooltip}"></i>`;
                }
                unitEntriesDisplay += '; ';
            });
            if (unitEntriesDisplay.endsWith('; ')) {
                unitEntriesDisplay = unitEntriesDisplay.slice(0, -2);
            }

            const uniqueId = `sl-item-${ingredientGroup.displayName.replace(/\s+/g, '-')}-${Math.random().toString(36).substr(2, 9)}`;

            listItem.innerHTML = `
                <div class="item-main-info">
                    <input type="checkbox" class="shopping-list-item-checkbox styled-checkbox" id="${uniqueId}" aria-label="Artikel ${ingredientGroup.displayName} gesammelt">
                    <label for="${uniqueId}" class="item-name">${atHomeIconHtml}${ingredientGroup.displayName}${combinedIconHtml}</label>
                </div>
                <div class="item-quantity-details">
                    ${unitEntriesDisplay}
                </div>
            `;
            container.appendChild(listItem);
        });

        container.classList.remove('hidden');
        noListMsg.classList.add('hidden');
    } else {
        container.className = 'styled-list shopping-list-custom';
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