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
        // Placeholder image - replace with actual image URL or logic to get it
        // Using Pexels as an example for royalty-free images.
        // Ideally, you'd have specific images for each recipe or a more sophisticated way to search/select them.
        // For now, a generic food image or a category-based one could be used.
        // Example: Use recipe name to slightly vary the image for demo purposes if Pexels search was live
        // const searchTerm = recipe.name.split(" ")[0] || "food";
        // const imageUrl = `https://source.unsplash.com/400x300/?${encodeURIComponent(searchTerm)}`;
        // For simplicity, let's use a few rotating placeholder images for now.
        const placeholderImages = [
            "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400",
            "https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=400",
            "https://images.pexels.com/photos/70497/pexels-photo-70497.jpeg?auto=compress&cs=tinysrgb&w=400",
            "https://images.pexels.com/photos/1099680/pexels-photo-1099680.jpeg?auto=compress&cs=tinysrgb&w=400",
            "https://images.pexels.com/photos/2641886/pexels-photo-2641886.jpeg?auto=compress&cs=tinysrgb&w=400"
        ];
        // Simple rotation based on recipe ID or index if available, otherwise random
        let imageIndex;
        const parsedId = parseInt(recipe.id, 10);

        if (!isNaN(parsedId)) {
            imageIndex = parsedId % placeholderImages.length;
        } else {
            // Fallback if recipe.id is not a number or undefined/null
            imageIndex = Math.floor(Math.random() * placeholderImages.length);
        }
        // Ensure imageIndex is not negative if somehow parsedId was negative
        imageIndex = Math.abs(imageIndex);

        const imageUrl = placeholderImages[imageIndex];

        // Note: The following line for imageHtml is not used due to previous fix,
        // but kept here for context if someone reviews this part of the code.
        // let imageHtml = `<img src="${imageUrl}" alt="${recipe.name}" class="recipe-card-image">`;

        let tagsHtml = `<div class="tags"><span>~${recipe.estimatedCostPerServing.toFixed(2)}€/P</span>`;
        if (recipe.tags.includes('schnell')) tagsHtml += `<span><i class="fa-solid fa-bolt"></i> Schnell</span>`;
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
        // Create image element
        const imageElement = document.createElement('img');
        imageElement.src = imageUrl;
        imageElement.alt = recipe.name;
        imageElement.className = 'recipe-card-image';

        // Card content container
        const cardContent = document.createElement('div');
        cardContent.className = 'recipe-card-content'; // You might want to add specific styling for this
        cardContent.innerHTML = `<h4>${recipe.name}</h4><p>${recipe.description}</p>${tagsHtml}${matchInfoHtml}<button class="btn-info"><i class="fa-solid fa-book-open"></i> Rezept ansehen</button>`;

        card.appendChild(imageElement); // Append the created image element
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
                resultsDiv.innerHTML = '<p>Keine Rezepte gefunden, für die du mindestens 80% der Zutaten hast.</p>';
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
            if (!plan || plan.length < 7) { btn.disabled = true; return; }
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