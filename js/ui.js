const ui = (() => {
    const modal = document.getElementById('recipe-modal');
    const modalBody = document.getElementById('modal-body');
    const modalCloseBtn = document.querySelector('.modal-close-btn');
    const deleteInventoryRecipesBtn = document.getElementById('delete-inventory-recipes-btn');

    const closeModal = () => modal.classList.add('hidden');

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
            : ''; // Or a placeholder like <span class="price-tag">Preis N/A</span>

        let tagsHtml = `<div class="tags">${priceTagHtml}`;
        if (recipe.tags && recipe.tags.includes('schnell')) tagsHtml += `<span><i class="fa-solid fa-bolt"></i> Schnell</span>`;

        // Derive isVegan/isVegetarian from tags
        const isVegan = recipe.tags && recipe.tags.includes('Vegan');
        const isVegetarian = recipe.tags && recipe.tags.includes('Vegetarisch');

        if (isVegan) tagsHtml += `<span>Vegan</span>`;
        else if (isVegetarian) tagsHtml += `<span>Vegetarisch</span>`;
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

        const cardContent = document.createElement('div');
        cardContent.className = 'recipe-card-content';
        cardContent.innerHTML = `<h4>${recipeName}</h4><p>${recipeDescription}</p>${tagsHtml}${matchInfoHtml}<button class="btn-info"><i class="fa-solid fa-book-open"></i> Rezept ansehen</button>`;

        card.appendChild(cardContent);

        cardContent.querySelector('.btn-info').addEventListener('click', (e) => { e.stopPropagation(); onInfoClick(recipe); });
        return card;
    };
    
    return {
        renderDashboard: (plan, onSelectRecipe, onInfoClick) => {
            const planDisplay = document.getElementById('plan-display');
            const noPlanDisplay = document.getElementById('no-plan-display');
            const weeklyPlanContainer = document.getElementById('weekly-plan-container');
            if (plan && plan.length > 0) {
                weeklyPlanContainer.innerHTML = ''; // Clear previous plan cards
                plan.forEach((dayObject, dayIndex) => {
                    const dayContainer = document.createElement('div');
                    dayContainer.className = 'day-container';
                    dayContainer.innerHTML = `<h3>${dayObject.day}</h3>`;
                    const optionsContainer = document.createElement('div');
                    optionsContainer.className = 'recipe-options';
                    dayObject.options.forEach(recipe => {
                        const card = createRecipeCardElement(recipe, onInfoClick);
                        card.dataset.dayIndex = dayIndex; card.dataset.recipeId = recipe.id;
                        if (dayObject.selected && dayObject.selected.id === recipe.id) card.classList.add('selected');
                        card.addEventListener('click', (e) => {
                            dayContainer.querySelectorAll('.recipe-card').forEach(c => c.classList.remove('selected'));
                            e.currentTarget.classList.add('selected');
                            onSelectRecipe(e.currentTarget.dataset.dayIndex, e.currentTarget.dataset.recipeId);
                        });
                        optionsContainer.appendChild(card);
                    });
                    dayContainer.appendChild(optionsContainer);
                    weeklyPlanContainer.appendChild(dayContainer);
                });
                // Show plan display, hide no-plan message
                if (planDisplay) {
                    planDisplay.classList.remove('hidden');
                    planDisplay.style.display = ''; // Reset explicit style if any
                }
                if (noPlanDisplay) {
                    noPlanDisplay.classList.add('hidden');
                    noPlanDisplay.style.display = 'none'; // Explicitly hide
                }
            } else {
                // No plan or plan is empty/deleted: Hide plan display, show no-plan message
                if (planDisplay) {
                    planDisplay.classList.add('hidden');
                    planDisplay.style.display = 'none'; // More explicit hiding
                }
                if (noPlanDisplay) {
                    noPlanDisplay.classList.remove('hidden');
                    noPlanDisplay.style.display = 'block'; // Or appropriate display type
                }
                if (weeklyPlanContainer) {
                    weeklyPlanContainer.innerHTML = ''; // Also clear out any old cards
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
        renderShoppingList: (categorizedList) => {
            const container = document.getElementById('shopping-list-container');
            const noList = document.getElementById('no-shopping-list');
            container.innerHTML = ''; // Clear previous content

            if (categorizedList && categorizedList.length > 0) {
                let htmlContent = '';
                categorizedList.forEach(category => {
                    if (category.items && category.items.length > 0) {
                        htmlContent += `<div class="shopping-list-category">`;
                        htmlContent += `<h3>${category.categoryName}</h3>`;
                        htmlContent += `<ul class="list-unstyled">`; // Use list-unstyled for Bootstrap if available, or style manually
                        category.items.forEach(item => {
                            const haveAtHomeClass = item.haveAtHome ? 'have-at-home' : '';
                            const atHomeStatus = item.haveAtHome ? '<span class="status"> (Zuhause)</span>' : '';
                            // Use item.originalString for display to keep details like "(Größe M)"
                            // item.name is the parsed name used for logic.
                            const combinedIcon = item.combined ? ' <i class="fa-solid fa-layer-group" title="Zusammengefasst aus mehreren Rezepten"></i>' : '';

                            // Round quantity to a reasonable number of decimal places if it's a float
                            const displayQuantity = Number.isInteger(item.quantity) ? item.quantity : parseFloat(item.quantity).toFixed(2);

                            htmlContent += `<li class="${haveAtHomeClass}">
                                                <span>${item.name}${combinedIcon}</span>
                                                <div>
                                                    <span class="unit">${displayQuantity} ${item.unit}</span>
                                                    ${atHomeStatus}
                                                </div>
                                            </li>`;
                        });
                        htmlContent += `</ul></div>`;
                    }
                });
                container.innerHTML = htmlContent;
                container.classList.remove('hidden');
                noList.classList.add('hidden');
            } else {
                container.classList.add('hidden');
                noList.classList.remove('hidden');
            }
        }
    };
})();