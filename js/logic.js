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

function generateShoppingList(plan, userPantry, persons = 1) {
    if (!plan || plan.length === 0) return [];
    const required = {};
    plan.forEach(day => {
        if (day.selected) {
            day.selected.ingredients.forEach(ing => {
                const totalQuantity = ing.quantity * persons;
                // Aggregate by ingredient name, assuming recipe ingredients are {name, quantity, unit}
                const key = ing.name.toLowerCase();
                if (required[key]) {
                    // Note: This simple addition might not be perfect if units differ.
                    // For now, we assume consistent units or accept this simplification.
                    required[key].quantity += totalQuantity;
                } else {
                    required[key] = { ...ing, quantity: totalQuantity };
                }
            });
        }
    });

    // Create a set of item names from userPantry for quick lookup
    // Uses item.name from userPantry for matching with recipe ingredient names.
    const pantryItemNamesLower = new Set(userPantry.map(item => item.name.toLowerCase().trim()));

    const shoppingList = Object.values(required).map(ing => ({
        ...ing,
        haveAtHome: pantryItemNamesLower.has(ing.name.toLowerCase())
    }));

    return shoppingList.sort((a, b) => {
        // Sort by haveAtHome (false first), then by name
        if (a.haveAtHome === b.haveAtHome) {
            return a.name.localeCompare(b.name);
        }
        return a.haveAtHome - b.haveAtHome; // false (0) comes before true (1)
    });
}

function findAlmostCompleteRecipes(allRecipes, userPantry, threshold = 0.55) {
    if (!userPantry || userPantry.length === 0) return [];

    // Uses item.name from userPantry for matching with recipe ingredient names.
    const pantryItemNamesSet = new Set(userPantry.map(item => item.name.toLowerCase().trim()));

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