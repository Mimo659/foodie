function generateWeeklyPlan(allRecipes, prefs) {
    let filtered = [...allRecipes];

    // Adapt to tags for dietary preferences
    if (prefs.isVegan) filtered = filtered.filter(r => r.tags && r.tags.includes('Vegan'));
    else if (prefs.isVegetarian) filtered = filtered.filter(r => r.tags && r.tags.includes('Vegetarisch'));

    // Budget filtering: recipes.json does not have estimatedCostPerServing.
    // This filter will likely not work as intended without data changes.
    // For now, ensure it doesn't crash if r.estimatedCostPerServing is undefined.
    if (prefs.budget) {
        filtered = filtered.filter(r => r.estimatedCostPerServing !== undefined && r.estimatedCostPerServing <= parseFloat(prefs.budget));
        if (filtered.every(r => r.estimatedCostPerServing === undefined)) {
            console.warn("Budget filtering is enabled, but recipes in data/recipes.json do not have 'estimatedCostPerServing'. This filter may not work correctly.");
        }
    }

    if (prefs.isQuick) filtered = filtered.filter(r => r.tags && r.tags.includes('schnell')); // Assuming 'schnell' is a possible tag
    if (prefs.isGuestFriendly) filtered = filtered.filter(r => r.tags && r.tags.includes('für gäste')); // Assuming 'für gäste' is a possible tag
    if (prefs.isForLeftovers) filtered = filtered.filter(r => r.tags && r.tags.includes('resteverwertung')); // Assuming 'resteverwertung' is a possible tag
    if (prefs.cuisine && prefs.cuisine !== 'all') filtered = filtered.filter(r => r.tags && r.tags.includes(prefs.cuisine));

    if (filtered.length < 2) {
        console.warn("Konnte keinen Plan erstellen: weniger als 2 passende Rezepte nach Filterung gefunden. Überprüfen Sie die Filtereinstellungen und die Rezeptdaten.");
        return [];
    }

    const shuffledRecipes = [...filtered].sort(() => 0.5 - Math.random());
    const recipeOptions = shuffledRecipes.slice(0, 14);

    const finalPlan = [];
    const days = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
    const numberOfDays = Math.min(days.length, Math.floor(recipeOptions.length / 2)); // Ensure we don't exceed available days or recipe pairs

    for (let i = 0; i < numberOfDays; i++) {
        if (recipeOptions[i * 2] && recipeOptions[i * 2 + 1]) { // Check if both recipes for the day exist
            finalPlan.push({
                day: days[i],
                options: [recipeOptions[i * 2], recipeOptions[i * 2 + 1]],
                selected: null
            });
        }
    }
    return finalPlan;
}

function generateShoppingList(plan, userPantry, persons = 1) {
    if (!plan || plan.length === 0) return [];
    console.warn("generateShoppingList: Ingredients in data/recipes.json are strings. Quantity and unit parsing is not performed, so shopping list quantities will be inaccurate (defaulting to 1 'item' per ingredient string).");
    const required = {};
    plan.forEach(day => {
        if (day.selected && day.selected.ingredients) { // Ensure selected recipe and its ingredients exist
            day.selected.ingredients.forEach(ingString => { // ingString is a full string like "500 g Naturreis"
                const totalQuantity = 1 * persons; // Cannot parse quantity from string reliably, default to 1
                const key = ingString.toLowerCase().trim(); // Use the full string as key

                if (required[key]) {
                    required[key].quantity += totalQuantity;
                } else {
                    // Since ingString is just a string, we create a basic structure
                    required[key] = {
                        name: ingString, // The full ingredient string
                        quantity: totalQuantity,
                        unit: 'Stk', // Default unit as it cannot be parsed
                        originalString: ingString // Keep original for display if needed
                    };
                }
            });
        }
    });

    const pantryItemNamesLower = new Set(userPantry.map(item => item.name.toLowerCase().trim()));

    const shoppingList = Object.values(required).map(ing => ({
        name: ing.originalString, // Display the original ingredient string
        quantity: ing.quantity,
        unit: ing.unit,
        // For 'haveAtHome', we attempt to match the full ingredient string with pantry item names.
        // This is a very basic match and might not be accurate.
        // A more robust solution would require structured ingredient data.
        haveAtHome: pantryItemNamesLower.has(ing.originalString.toLowerCase().trim())
    }));

    return shoppingList.sort((a, b) => {
        if (a.haveAtHome === b.haveAtHome) {
            return a.name.localeCompare(b.name);
        }
        return a.haveAtHome - b.haveAtHome;
    });
}

function findAlmostCompleteRecipes(allRecipes, userPantry, threshold = 0.55) {
    if (!userPantry || userPantry.length === 0) return [];
    console.warn("findAlmostCompleteRecipes: Matching based on full ingredient strings from data/recipes.json. This may be less accurate than matching parsed ingredient names.");

    const pantryItemNamesSet = new Set(userPantry.map(item => item.name.toLowerCase().trim()));

    const matchedRecipes = allRecipes.map(recipe => {
        if (!recipe.ingredients || recipe.ingredients.length === 0) return { ...recipe, matchPercentage: 0, missingIngredients: [] };

        let ownedCount = 0;
        const missing = [];

        // recipe.ingredients is an array of strings, e.g., ["500 g Mehl", "1 Prise Salz"]
        recipe.ingredients.forEach(ingString => {
            // Basic matching: check if any part of the ingredient string is in the pantry.
            // This is a simplification. A more robust approach would parse the ingredient name.
            // For now, we'll check if the pantryItemNameSet contains the lowercase ingredient string.
            // A better approach would be to try and extract the core noun from `ingString`.
            const ingStringLower = ingString.toLowerCase();
            let foundInPantry = false;
            for (const pantryItem of pantryItemNamesSet) {
                if (ingStringLower.includes(pantryItem)) { // Check if pantry item is a substring of recipe ingredient
                    foundInPantry = true;
                    break;
                }
            }

            if (foundInPantry) {
                ownedCount++;
            } else {
                missing.push(ingString); // Push the original string
            }
        });

        const matchPercentage = (recipe.ingredients.length > 0) ? (ownedCount / recipe.ingredients.length) : 0;
        return { ...recipe, matchPercentage: matchPercentage, missingIngredients: missing };
    }).filter(recipe => recipe.matchPercentage >= threshold);

    matchedRecipes.sort((a, b) => {
        if (b.matchPercentage !== a.matchPercentage) return b.matchPercentage - a.matchPercentage;
        return a.missingIngredients.length - b.missingIngredients.length;
    });
    return matchedRecipes.slice(0, 10);
}