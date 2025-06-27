/**
 * Erstellt einen Wochenplan mit ZWEI Optionen pro Tag.
 */
function generateWeeklyPlan(allRecipes, prefs) {
    let filtered = [...allRecipes];
    if (prefs.isVegan) {
        filtered = filtered.filter(r => r.isVegan);
    } else if (prefs.isVegetarian) {
        filtered = filtered.filter(r => r.isVegetarian);
    }
    if (prefs.isSimple) {
        filtered = filtered.filter(r => r.isSimple);
    }
    if (prefs.budget && prefs.persons > 0) {
        const budgetPerDay = (prefs.budget / 7) / prefs.persons;
        filtered = filtered.filter(r => r.estimatedCostPerServing <= budgetPerDay);
    }

    const recipeOptions = [];
    const usedIndices = new Set();
    const numRecipesToPick = Math.min(14, filtered.length);

    if (numRecipesToPick < 14) {
        console.warn("Nicht genug passende Rezepte gefunden, um 2 Optionen für jeden Tag zu bieten.");
    }

    while (recipeOptions.length < numRecipesToPick) {
        const randomIndex = Math.floor(Math.random() * filtered.length);
        if (!usedIndices.has(randomIndex)) {
            recipeOptions.push(filtered[randomIndex]);
            usedIndices.add(randomIndex);
        }
    }

    const finalPlan = [];
    const days = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
    for (let i = 0; i < 7; i++) {
        const option1 = recipeOptions[i * 2];
        const option2 = recipeOptions[i * 2 + 1];
        
        if (option1 && option2) {
            finalPlan.push({
                day: days[i],
                options: [option1, option2],
                selected: null
            });
        }
    }
    return finalPlan;
}

/**
 * Erstellt eine Einkaufsliste aus einem BESTÄTIGTEN Wochenplan.
 */
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
    const shoppingList = Object.values(required).map(ing => ({
        ...ing,
        haveAtHome: inventoryLower.includes(ing.name.toLowerCase())
    }));
    return shoppingList.sort((a, b) => a.haveAtHome - b.haveAtHome);
}

/**
 * Findet Rezepte, bei denen der Nutzer einen bestimmten Prozentsatz der Zutaten besitzt.
 */
function findAlmostCompleteRecipes(allRecipes, inventory, threshold = 0.8) {
    if (!inventory || inventory.length === 0) return [];

    const inventorySet = new Set(inventory.map(i => i.toLowerCase().trim()));
    const matchedRecipes = allRecipes
        .map(recipe => {
            if (!recipe.ingredients || recipe.ingredients.length === 0) {
                return { ...recipe, matchPercentage: 0, missingIngredients: [] };
            }
            let ownedCount = 0;
            const missing = [];
            recipe.ingredients.forEach(ing => {
                if (inventorySet.has(ing.name.toLowerCase())) {
                    ownedCount++;
                } else {
                    missing.push(ing);
                }
            });
            const matchRatio = ownedCount / recipe.ingredients.length;
            return { ...recipe, matchPercentage: matchRatio, missingIngredients: missing };
        })
        .filter(recipe => recipe.matchPercentage >= threshold);

    matchedRecipes.sort((a, b) => {
        if (b.matchPercentage !== a.matchPercentage) {
            return b.matchPercentage - a.matchPercentage;
        }
        return a.missingIngredients.length - b.missingIngredients.length;
    });

    return matchedRecipes.slice(0, 10);
}