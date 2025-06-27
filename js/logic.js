function generateWeeklyPlan(allRecipes, prefs) {
    let filtered = [...allRecipes];

    if (prefs.isVegan) filtered = filtered.filter(r => r.isVegan);
    else if (prefs.isVegetarian) filtered = filtered.filter(r => r.isVegetarian);
    if (prefs.isSimple) filtered = filtered.filter(r => r.isSimple);
    if (prefs.budget && prefs.persons > 0) {
        const budgetPerServing = prefs.budget / (prefs.persons * 7);
        filtered = filtered.filter(r => r.estimatedCostPerServing <= budgetPerServing);
    }

    const shuffled = filtered.sort(() => 0.5 - Math.random());
    
    let plan = shuffled.slice(0, 7);
    while (plan.length < 7 && allRecipes.length > 0) {
        const randomRecipe = allRecipes[Math.floor(Math.random() * allRecipes.length)];
        if (!plan.find(r => r.id === randomRecipe.id)) {
            plan.push(randomRecipe);
        }
    }
    return plan;
}

function generateShoppingList(plan, inventory, persons = 1) {
    if (!plan || plan.length === 0) return [];

    const required = {};
    plan.forEach(recipe => {
        recipe.ingredients.forEach(ing => {
            const totalQuantity = ing.quantity * persons;
            if (required[ing.name]) {
                required[ing.name].quantity += totalQuantity;
            } else {
                required[ing.name] = { ...ing, quantity: totalQuantity };
            }
        });
    });

    const inventoryLower = inventory.map(item => item.toLowerCase().trim());
    const shoppingList = Object.values(required).map(ing => ({
        ...ing,
        haveAtHome: inventoryLower.includes(ing.name.toLowerCase())
    }));
    
    return shoppingList.sort((a, b) => a.haveAtHome - b.haveAtHome);
}

function findRecipesByIngredients(allRecipes, ingredients) {
    if (!ingredients || ingredients.length === 0) return [];
    const searchTerms = ingredients.map(i => i.toLowerCase().trim());
    return allRecipes.filter(recipe => 
        recipe.ingredients.some(recipeIng => searchTerms.includes(recipeIng.name.toLowerCase()))
    ).slice(0, 10);
}