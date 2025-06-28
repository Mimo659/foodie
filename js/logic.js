function generateWeeklyPlan(allRecipes, prefs) {
    let filtered = [...allRecipes];
    if (prefs.isVegan) filtered = filtered.filter(r => r.isVegan);
    else if (prefs.isVegetarian) filtered = filtered.filter(r => r.isVegetarian);
    if (prefs.budget) filtered = filtered.filter(r => r.estimatedCostPerServing <= parseFloat(prefs.budget));
    if (prefs.isQuick) filtered = filtered.filter(r => r.tags.includes('schnell'));
    if (prefs.isGuestFriendly) filtered = filtered.filter(r => r.tags.includes('für gäste'));
    if (prefs.isForLeftovers) filtered = filtered.filter(r => r.tags.includes('resteverwertung'));
    if (prefs.cuisine && prefs.cuisine !== 'all') filtered = filtered.filter(r => r.tags.includes(prefs.cuisine));

    if (filtered.length < 2) {
        console.error("Konnte keinen Plan erstellen: weniger als 2 passende Rezepte gefunden.");
        return [];
    }

    const shuffledRecipes = [...filtered].sort(() => 0.5 - Math.random());
    const recipeOptions = shuffledRecipes.slice(0, 14);

    const finalPlan = [];
    const days = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
    const numberOfDays = Math.floor(recipeOptions.length / 2);

    for (let i = 0; i < numberOfDays; i++) {
        finalPlan.push({
            day: days[i],
            options: [recipeOptions[i * 2], recipeOptions[i * 2 + 1]],
            selected: null
        });
    }
    return finalPlan;
}

function generateShoppingList(plan, inventory, persons = 1) {
    if (!plan || plan.length === 0) return [];
    const required = {};
    plan.forEach(day => {
        if (day.selected) {
            day.selected.ingredients.forEach(ing => {
                const totalQuantity = ing.quantity * persons;
                if (required[ing.name]) {
                    required[ing.name].quantity += totalQuantity;
                } else {
                    required[ing.name] = { ...ing, quantity: totalQuantity };
                }
            });
        }
    });
    const inventoryLower = inventory.map(item => item.toLowerCase().trim());
    const shoppingList = Object.values(required).map(ing => ({...ing, haveAtHome: inventoryLower.includes(ing.name.toLowerCase()) }));
    return shoppingList.sort((a, b) => a.haveAtHome - b.haveAtHome);
}

function findAlmostCompleteRecipes(allRecipes, inventory, threshold = 0.55) {
    if (!inventory || inventory.length === 0) return [];
    const inventorySet = new Set(inventory.map(i => i.toLowerCase().trim()));
    const matchedRecipes = allRecipes.map(recipe => {
        if (!recipe.ingredients || recipe.ingredients.length === 0) return { ...recipe, matchPercentage: 0, missingIngredients: [] };
        let ownedCount = 0;
        const missing = [];
        recipe.ingredients.forEach(ing => {
            if (inventorySet.has(ing.name.toLowerCase())) ownedCount++;
            else missing.push(ing);
        });
        return { ...recipe, matchPercentage: ownedCount / recipe.ingredients.length, missingIngredients: missing };
    }).filter(recipe => recipe.matchPercentage >= threshold);

    matchedRecipes.sort((a, b) => {
        if (b.matchPercentage !== a.matchPercentage) return b.matchPercentage - a.matchPercentage;
        return a.missingIngredients.length - b.missingIngredients.length;
    });
    return matchedRecipes.slice(0, 10);
}