const ui = (() => {
    const modal = document.getElementById('recipe-modal');
    const modalBody = document.getElementById('modal-body');
    const modalCloseBtn = document.querySelector('.modal-close-btn');
    const deleteInventoryRecipesBtn = document.getElementById('delete-inventory-recipes-btn');

    const closeModal = () => modal.classList.add('hidden');

    const openModalWithRecipe = (recipe) => {
        let ingredientsHtml = recipe.ingredients.map(ing => `<li><span>${ing.name}</span><span class="quantity">${ing.quantity} ${ing.unit}</span></li>`).join('');
        let instructionsHtml = recipe.instructions.map((step, index) => `<li><strong>Schritt ${index + 1}:</strong> ${step}</li>`).join('');
        modalBody.innerHTML = `<h2>${recipe.name}</h2><p>${recipe.description}</p><h3><i class="fa-solid fa-list-check"></i> Zutaten</h3><ul class="ingredient-list">${ingredientsHtml}</ul><h3><i class="fa-solid fa-person-chalkboard"></i> Anleitung</h3><ol class="instructions-list">${instructionsHtml}</ol>`;
        modal.classList.remove('hidden');
    };
    
    modalCloseBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === "Escape" && !modal.classList.contains('hidden')) closeModal(); });
    
    const createRecipeCardElement = (recipe, onInfoClick) => {
        const card = document.createElement('div');
        card.className = 'recipe-card';

        const priceTagHtml = (typeof recipe.estimatedCostPerServing === 'number' && !isNaN(recipe.estimatedCostPerServing))
            ? `<span class="price-tag">~${recipe.estimatedCostPerServing.toFixed(2)}€/P</span>`
            : '';

        let tagsHtml = `<div class="tags">${priceTagHtml}`;
        if (recipe.tags && recipe.tags.includes('schnell')) tagsHtml += `<span><i class="fa-solid fa-bolt"></i> Schnell</span>`;
        if (recipe.isVegan) tagsHtml += `<span>Vegan</span>`;
        else if (recipe.isVegetarian) tagsHtml += `<span>Vegetarisch</span>`;
        tagsHtml += `</div>`;
        let matchInfoHtml = '';
        if (recipe.matchPercentage !== undefined) {
            const percentage = Math.round(recipe.matchPercentage * 100);
            const missingText = recipe.missingIngredients.length > 0
                ? `<p class="missing-ingredients"><strong>Fehlt noch:</strong> ${recipe.missingIngredients.map(ing => ing.name).join(', ')}</p>`
                : `<p class="all-ingredients-present"><i class="fa-solid fa-check-double"></i> Alles da!</p>`;
            matchInfoHtml = `<div class="match-info"><div class="match-bar"><div class="match-bar-fill" style="width: ${percentage}%"></div></div><span class="match-text">${percentage}% Übereinstimmung</span>${missingText}</div>`;
        }
        // Card content container
        const cardContent = document.createElement('div');
        cardContent.className = 'recipe-card-content'; // You might want to add specific styling for this
        cardContent.innerHTML = `<h4>${recipe.name}</h4><p>${recipe.description}</p>${tagsHtml}${matchInfoHtml}<button class="btn-info"><i class="fa-solid fa-book-open"></i> Rezept ansehen</button>`;

        card.appendChild(cardContent); // Then append the rest of the content

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
        renderShoppingList: (list) => {
            const container = document.getElementById('shopping-list-container');
            const noList = document.getElementById('no-shopping-list');
            if (list.length > 0) {
                container.innerHTML = list.map(item => `<li class="${item.haveAtHome ? 'have-at-home' : ''}"><span>${item.name}</span><div><span class="unit">${item.quantity} ${item.unit}</span>${item.haveAtHome ? '<span class="status"> (Zuhause)</span>' : ''}</div></li>`).join('');
                container.classList.remove('hidden'); noList.classList.add('hidden');
            } else {
                container.classList.add('hidden'); noList.classList.remove('hidden');
            }
        }
    };
})();