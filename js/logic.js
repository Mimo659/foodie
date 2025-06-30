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
    const ingredientSources = {}; // Keep track of which recipes use each ingredient

    plan.forEach(day => {
        if (day.selected) {
            day.selected.ingredients.forEach(ing => {
                const totalQuantity = ing.quantity * persons;
                // Aggregate by ingredient name, assuming recipe ingredients are {name, quantity, unit}
                const key = ing.name.toLowerCase(); // Use lowercase key
                if (required[key]) {
                    required[key].quantity += totalQuantity;
                    // Add recipe to the list of sources for this ingredient, if not already present
                    if (ingredientSources[key] && !ingredientSources[key].includes(day.selected.name)) {
                        ingredientSources[key].push(day.selected.name);
                    }
                } else {
                    // Store the ingredient with its original name for display, but use lowercase key
                    required[key] = { ...ing, name: ing.name, quantity: totalQuantity };
                    ingredientSources[key] = [day.selected.name]; // Initialize sources list
                }
            });
        }
    });

    // Create a set of item names from userPantry for quick lookup
    const pantryItemNamesLower = new Set(userPantry.map(item => item.name.toLowerCase().trim()));

    const shoppingList = Object.values(required).map(ing => ({
        ...ing,
        haveAtHome: pantryItemNamesLower.has(ing.name.toLowerCase()),
        // Mark if ingredient is used in more than one recipe
        // Check using the lowercase name to match the key in ingredientSources
        usedInMultipleRecipes: ingredientSources[ing.name.toLowerCase()] ? ingredientSources[ing.name.toLowerCase()].length > 1 : false
    }));

    return shoppingList.sort((a, b) => {
        // Sort by haveAtHome (false first)
        if (a.haveAtHome !== b.haveAtHome) {
            return a.haveAtHome - b.haveAtHome; // false (0) comes before true (1)
        }
        // Then by usedInMultipleRecipes (true first - more important)
        if (a.usedInMultipleRecipes !== b.usedInMultipleRecipes) {
            return (b.usedInMultipleRecipes ? 1 : 0) - (a.usedInMultipleRecipes ? 1 : 0); // true (1) comes before false (0)
        }
        // Then by name
        return a.name.localeCompare(b.name);
    });
}

function findAlmostCompleteRecipes(allRecipes, inventory, threshold = 0.55) {
    if (!inventory || inventory.length === 0) return [];
    const inventorySet = new Set(inventory.map(i => i.toLowerCase().trim()));
    const matchedRecipes = allRecipes.map(recipe => {
        if (!recipe.ingredients || recipe.ingredients.length === 0) return { ...recipe, matchPercentage: 0, missingIngredients: [] };
        let ownedCount = 0;
        const missing = [];
        recipe.ingredients.forEach(ing => {
            // Use pantryItemNamesSet from main's logic
            if (pantryItemNamesSet.has(ing.name.toLowerCase())) ownedCount++;
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