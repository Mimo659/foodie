const ui = (() => {
    const weeklyPlanContainer = document.getElementById('weekly-plan-container');
    const inventoryResultsContainer = document.getElementById('inventory-results');
    const shoppingListContainer = document.getElementById('shopping-list-container');
    const noShoppingList = document.getElementById('no-shopping-list');
    
    const days = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

    const createRecipeCard = (recipe) => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        let tagsHtml = `<div class="tags"><span>~${recipe.estimatedCostPerServing.toFixed(2)}€/Portion</span>`;
        if (recipe.isSimple) tagsHtml += `<span>Einfach</span>`;
        if (recipe.isVegan) tagsHtml += `<span>Vegan</span>`;
        else if (recipe.isVegetarian) tagsHtml += `<span>Vegetarisch</span>`;
        tagsHtml += `</div>`;
        card.innerHTML = `
            <h4>${recipe.name}</h4>
            <p>${recipe.description}</p>
            ${tagsHtml}
        `;
        return card;
    };
    
    const lazyLoadCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const placeholder = entry.target;
                const recipe = JSON.parse(placeholder.dataset.recipe);
                const recipeCard = createRecipeCard(recipe);
                placeholder.parentNode.replaceChild(recipeCard, placeholder);
                observer.unobserve(placeholder);
            }
        });
    };
    
    const observer = new IntersectionObserver(lazyLoadCallback, {
        rootMargin: '0px 0px 200px 0px'
    });

    return {
        switchView: (viewId) => {
            document.querySelectorAll('.view').forEach(view => view.classList.add('hidden'));
            document.getElementById(viewId).classList.remove('hidden');
        },

        renderDashboard: (plan) => {
            const planDisplay = document.getElementById('plan-display');
            const noPlanDisplay = document.getElementById('no-plan-display');
            if (plan && plan.length > 0) {
                weeklyPlanContainer.innerHTML = '';
                plan.forEach((recipe, index) => {
                    const dayHeader = document.createElement('h3');
                    dayHeader.textContent = days[index];
                    weeklyPlanContainer.appendChild(dayHeader);
                    const placeholder = document.createElement('div');
                    placeholder.className = 'recipe-placeholder';
                    placeholder.dataset.recipe = JSON.stringify(recipe);
                    weeklyPlanContainer.appendChild(placeholder);
                    observer.observe(placeholder);
                });
                planDisplay.classList.remove('hidden');
                noPlanDisplay.classList.add('hidden');
            } else {
                planDisplay.classList.add('hidden');
                noPlanDisplay.classList.remove('hidden');
            }
        },

        renderInventoryResults: (recipes) => {
            inventoryResultsContainer.innerHTML = '';
            if (recipes.length === 0) {
                inventoryResultsContainer.innerHTML = '<p>Keine passenden Rezepte für deine Zutaten gefunden.</p>';
            } else {
                recipes.forEach(recipe => {
                    inventoryResultsContainer.appendChild(createRecipeCard(recipe));
                });
            }
        },

        renderShoppingList: (list) => {
            if (list.length > 0) {
                shoppingListContainer.innerHTML = '';
                list.forEach(item => {
                    const li = document.createElement('li');
                    if (item.haveAtHome) li.classList.add('have-at-home');
                    li.innerHTML = `
                        <span>${item.name}</span>
                        <div>
                            <span class="unit">${item.quantity} ${item.unit}</span>
                            ${item.haveAtHome ? '<span class="status"> (Zuhause)</span>' : ''}
                        </div>
                    `;
                    shoppingListContainer.appendChild(li);
                });
                shoppingListContainer.classList.remove('hidden');
                noShoppingList.classList.add('hidden');
            } else {
                shoppingListContainer.classList.add('hidden');
                noShoppingList.classList.remove('hidden');
            }
        },
        
        showApp: () => {
            const loadingScreen = document.getElementById('loading-screen');
            const appContent = document.getElementById('app-content');
            loadingScreen.style.opacity = '0';
            setTimeout(() => loadingScreen.style.display = 'none', 500);
            appContent.classList.remove('content-hidden');
        }
    };
})();