const ui = (() => {
    // --- Private Variablen und Funktionen ---
    const modal = document.getElementById('recipe-modal');
    const modalBody = document.getElementById('modal-body');
    const modalCloseBtn = document.querySelector('.modal-close-btn');

    const closeModal = () => modal.classList.add('hidden');

    const openModalWithRecipe = (recipe) => {
        let ingredientsHtml = recipe.ingredients.map(ing => `
            <li>
                <span>${ing.name}</span>
                <span class="quantity">${ing.quantity} ${ing.unit}</span>
            </li>
        `).join('');
        let instructionsHtml = recipe.instructions.map((step, index) => `<li><strong>Schritt ${index + 1}:</strong> ${step}</li>`).join('');

        modalBody.innerHTML = `
            <h2>${recipe.name}</h2>
            <p>${recipe.description}</p>
            <h3><i class="fa-solid fa-list-check"></i> Zutaten</h3>
            <ul class="ingredient-list">${ingredientsHtml}</ul>
            <h3><i class="fa-solid fa-person-chalkboard"></i> Anleitung</h3>
            <ol class="instructions-list">${instructionsHtml}</ol>
        `;
        modal.classList.remove('hidden');
    };
    
    modalCloseBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === "Escape" && !modal.classList.contains('hidden')) closeModal(); });
    
    const createRecipeCardElement = (recipe, onInfoClick) => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        let tagsHtml = `<div class="tags"><span>~${recipe.estimatedCostPerServing.toFixed(2)}€/Portion</span>`;
        if (recipe.isSimple) tagsHtml += `<span>Einfach</span>`;
        if (recipe.isVegan) tagsHtml += `<span>Vegan</span>`;
        else if (recipe.isVegetarian) tagsHtml += `<span>Vegetarisch</span>`;
        tagsHtml += `</div>`;

        let matchInfoHtml = '';
        if (recipe.matchPercentage !== undefined) {
            const percentage = Math.round(recipe.matchPercentage * 100);
            const missingText = recipe.missingIngredients.length > 0
                ? `<p class="missing-ingredients"><strong>Fehlt noch:</strong> ${recipe.missingIngredients.map(ing => ing.name).join(', ')}</p>`
                : `<p class="all-ingredients-present"><i class="fa-solid fa-check-double"></i> Alle Zutaten vorhanden!</p>`;
            matchInfoHtml = `
                <div class="match-info">
                    <div class="match-bar"><div class="match-bar-fill" style="width: ${percentage}%"></div></div>
                    <span class="match-text">${percentage}% deiner Zutaten vorhanden</span>
                    ${missingText}
                </div>`;
        }

        card.innerHTML = `
            <h4>${recipe.name}</h4>
            <p>${recipe.description}</p>
            ${tagsHtml}
            ${matchInfoHtml}
            <button class="btn-info"><i class="fa-solid fa-book-open"></i> Rezept ansehen</button>
        `;
        card.querySelector('.btn-info').addEventListener('click', (e) => {
            e.stopPropagation();
            onInfoClick(recipe);
        });
        return card;
    };
    
    // --- Öffentliches UI-Objekt ---
    return {
        renderDashboard: (plan, onSelectRecipe, onInfoClick) => {
            const planDisplay = document.getElementById('plan-display');
            const noPlanDisplay = document.getElementById('no-plan-display');
            const weeklyPlanContainer = document.getElementById('weekly-plan-container');

            if (plan && plan.length > 0) {
                weeklyPlanContainer.innerHTML = '';
                plan.forEach((dayObject, dayIndex) => {
                    const dayContainer = document.createElement('div');
                    dayContainer.className = 'day-container';
                    dayContainer.innerHTML = `<h3>${dayObject.day}</h3>`;
                    const optionsContainer = document.createElement('div');
                    optionsContainer.className = 'recipe-options';

                    dayObject.options.forEach(recipe => {
                        const card = createRecipeCardElement(recipe, onInfoClick);
                        card.dataset.dayIndex = dayIndex;
                        card.dataset.recipeId = recipe.id;
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
                planDisplay.classList.remove('hidden');
                noPlanDisplay.classList.add('hidden');
            } else {
                planDisplay.classList.add('hidden');
                noPlanDisplay.classList.remove('hidden');
            }
        },

        renderInventoryResults: (recipes, onInfoClick) => {
            const inventoryResultsContainer = document.getElementById('inventory-results-container');
            inventoryResultsContainer.innerHTML = '<h3><i class="fa-solid fa-lightbulb"></i> Deine besten Optionen</h3>';
            const resultsDiv = document.createElement('div');
            if (recipes.length === 0) {
                resultsDiv.innerHTML = '<p>Keine Rezepte gefunden, für die du mindestens 80% der Zutaten hast. Füge mehr Zutaten zu deinem Vorrat hinzu!</p>';
            } else {
                recipes.forEach(recipe => resultsDiv.appendChild(createRecipeCardElement(recipe, onInfoClick)));
            }
            inventoryResultsContainer.appendChild(resultsDiv);
        },
        
        openRecipeModal: openModalWithRecipe,

        switchView: (viewId) => { document.querySelectorAll('.view').forEach(v => v.classList.add('hidden')); document.getElementById(viewId).classList.remove('hidden'); },
        
        updateConfirmButtonState: (plan) => {
            const confirmBtn = document.getElementById('confirm-plan-btn');
            if (!plan || plan.length < 7) { confirmBtn.disabled = true; return; }
            const allDaysSelected = plan.every(day => day.selected !== null);
            confirmBtn.disabled = !allDaysSelected;
        },
        
        showApp: () => {
            const loadingScreen = document.getElementById('loading-screen');
            const appContent = document.getElementById('app-content');
            loadingScreen.style.opacity = '0';
            setTimeout(() => loadingScreen.style.display = 'none', 500);
            appContent.classList.remove('content-hidden');
        },
        
        setButtonLoadingState: (button, isLoading) => {
            const originalHtml = `<i class="fa-solid fa-paper-plane"></i> Plan generieren`;
            if (isLoading) {
                button.disabled = true;
                button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generiere...`;
            } else {
                button.disabled = false;
                button.innerHTML = originalHtml;
            }
        },
        
        renderShoppingList: (list) => {
            const listContainer = document.getElementById('shopping-list-container');
            const noList = document.getElementById('no-shopping-list');
            if (list.length > 0) {
                listContainer.innerHTML = list.map(item => `
                    <li class="${item.haveAtHome ? 'have-at-home' : ''}">
                        <span>${item.name}</span>
                        <div>
                            <span class="unit">${item.quantity} ${item.unit}</span>
                            ${item.haveAtHome ? '<span class="status"> (Zuhause)</span>' : ''}
                        </div>
                    </li>
                `).join('');
                listContainer.classList.remove('hidden');
                noList.classList.add('hidden');
            } else {
                listContainer.classList.add('hidden');
                noList.classList.remove('hidden');
            }
        }
    };
})();