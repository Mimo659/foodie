function generateWeeklyPlan(allRecipes, prefs) {
    let filtered = [...allRecipes];

    // Adapt to tags for dietary preferences
    if (prefs.isVegan) {
        filtered = filtered.filter(r => r.tags && r.tags.includes('Vegan'));
    } else if (prefs.isVegetarian) {
        filtered = filtered.filter(r => r.tags && (r.tags.includes('Vegetarisch') || r.tags.includes('Vegan')));
    }

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
    // Remove isGuestFriendly and isForLeftovers as they are replaced by dynamic tags
    // if (prefs.isGuestFriendly) filtered = filtered.filter(r => r.tags && r.tags.includes('für gäste'));
    // if (prefs.isForLeftovers) filtered = filtered.filter(r => r.tags && r.tags.includes('resteverwertung'));
    // Remove cuisine filter as it's replaced by dynamic tags
    // if (prefs.isForLeftovers) filtered = filtered.filter(r => r.tags && r.tags.includes('resteverwertung'));
    // Remove cuisine filter as it's replaced by dynamic tags
    // if (prefs.cuisine && prefs.cuisine !== 'all') filtered = filtered.filter(r => r.tags && r.tags.includes(prefs.cuisine));

    // New dynamic tag filtering
    if (prefs.selectedTags && prefs.selectedTags.length > 0) {
        filtered = filtered.filter(r => {
            if (!r.tags || r.tags.length === 0) return false;
            return prefs.selectedTags.every(selectedTag => r.tags.includes(selectedTag));
        });
    }
    // Ensure prefs.isQuick is not used if it was removed from app.js
    // if (prefs.isQuick) filtered = filtered.filter(r => r.tags && r.tags.includes('schnell'));

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

// Helper function to parse ingredient strings
function parseIngredientString(ingString) {
    const originalInputString = ingString;

    if (typeof ingString !== 'string') {
        return {
            originalString: "Fehlerhafter Eintrag",
            quantity: 0,
            unit: "",
            name: "Unbekannt",
            normalizedName: "unbekannt",
            standardizedUnit: ""
        };
    }

    let tempIngString = ingString.trim();
    let quantity = 1; // Default quantity
    let unit = '';    // Default unit (will be standardized)
    let name = tempIngString; // Default name

    const qtyUnitNamePattern = /^(?:(\d+(?:[\.,]\d+)?)\s*)?(?:([\wßöäüÖÄÜ\.\(\)]+)\s+)?(.*)$/;
    const match = tempIngString.match(qtyUnitNamePattern);

    let parsedUnit = '';
    let parsedNamePart = tempIngString;
    let numPart; // Keep numPart in wider scope

    if (match) {
        numPart = match[1]; // e.g., "500"
        const potentialUnitWord = match[2]; // e.g., "g", "EL", "Stück"
        const namePartAfterUnit = match[3]; // e.g., "Mehl", "Zucker"

        if (numPart) {
            quantity = parseFloat(numPart.replace(',', '.'));
        }

        if (potentialUnitWord) {
            const standardizedPotentialUnit = normalizeUnit(potentialUnitWord);
            if (UNIT_STANDARDIZATION[potentialUnitWord.toLowerCase().replace(/[()]/g, '')] || standardizedPotentialUnit !== potentialUnitWord) {
                parsedUnit = standardizedPotentialUnit;
                parsedNamePart = namePartAfterUnit.trim();
            } else {
                parsedUnit = '';
                parsedNamePart = (potentialUnitWord + " " + namePartAfterUnit).trim();
            }
        } else {
            parsedNamePart = namePartAfterUnit.trim();
        }
        name = parsedNamePart;
    }

    if (name === "" && match && match[1] && match[2]) {
        name = match[2];
    }

    let standardizedUnit = normalizeUnit(parsedUnit);
    let normalizedName = normalizeIngredientName(name);

    // Primary unit determination block
    if (standardizedUnit === '' || standardizedUnit === name) { // If no unit was parsed, or unit was part of name
        if (normalizedName.toLowerCase() === 'salz' || normalizedName.toLowerCase() === 'pfeffer') {
            standardizedUnit = 'Prise';
        } else if (UNIT_STANDARDIZATION[normalizedName.toLowerCase()]) { // If the name itself is a unit e.g. "gramm"
            standardizedUnit = UNIT_STANDARDIZATION[normalizedName.toLowerCase()];
        } else if (name !== "" && numPart !== undefined) {
            // If there's a name AND a number, it's likely "Stk." if no other unit found
            // e.g., "2 Bananen"
            standardizedUnit = 'Stk.';
        }
        // If name is "" but numPart exists (e.g. "123"), this block does not assign Stk. yet.
        // If name exists but numPart is undefined (e.g. "Zucker"), this block does not assign Stk.
    }

    // Secondary block: Catch cases like "123" or ensure salt/pepper if missed, or handle items like "Zucker".
    if (standardizedUnit === '') { // If unit is STILL empty after primary block
        if (numPart !== undefined) { // If there was a number parsed (e.g., "123" OR "2 Zwiebel" if Zwiebel isn't a unit)
            standardizedUnit = 'Stk.';
        } else if (name !== '') { // No number parsed, but there is a name (e.g. "Salz", "Pfeffer", or "Zucker" alone)
            if (normalizedName.toLowerCase() === 'salz' || normalizedName.toLowerCase() === 'pfeffer') {
                standardizedUnit = 'Prise';
                // quantity is already 1 by default, and numPart is undefined here, so the later quantity adjustment will handle it.
            }
            // If it's "Zucker" or any other named item without a number, standardizedUnit remains "", which is correct.
        }
        // If both numPart is undefined AND name is empty (e.g. empty input string), standardizedUnit remains "".
    }

    if (name==="" && quantity > 0 && standardizedUnit !== "" && standardizedUnit !== "Stk.") {
        // This condition seems less relevant now or might need review.
        // It was intended for cases like "500g" where name becomes empty.
        // If numPart="500", potentialUnitWord="g", namePartAfterUnit="", then name could be "".
        // In this case, parsedUnit="g", standardizedUnit="g". So this block is skipped. Seems fine.
    }
    // The original second 'if (standardizedUnit === '' && name !== '')' block is now covered by the new 'if (standardizedUnit === '')' block.
    // If no quantity was given (e.g. "Salz"), and unit became 'Prise', quantity should be 1.
    if (numPart === undefined && (standardizedUnit === 'Prise' || (standardizedUnit === 'Stk.' && name !== ''))) {
        quantity = 1;
    }


    return {
        originalString: originalInputString,
        quantity: quantity,
        unit: parsedUnit || standardizedUnit,
        name: name,
        normalizedName: normalizedName,
        standardizedUnit: standardizedUnit
    };
}


function generateShoppingList(plan, userPantry, persons_unused = 1, pantryCategories) {
    if (!plan || plan.length === 0) return [];

    const allIngredientsFromPlan = [];

    plan.forEach(day => {
        if (day.selected && day.selected.ingredients) {
            const recipeName = day.selected.title || "Unbekanntes Rezept";
            day.selected.ingredients.forEach(ingString => {
                const parsedIng = parseIngredientString(ingString);

                // Quantity is already scaled in the recipe JSON (recipes_2.json or recipes_4.json)
                // No further scaling by `persons` or `recipePortions` is needed.
                allIngredientsFromPlan.push({
                    recipeName: recipeName,
                    displayName: parsedIng.name, // Use for display
                    quantity: parsedIng.quantity, // Already scaled quantity
                    unit: parsedIng.standardizedUnit, // Use standardized unit for aggregation
                    normalizedForMatch: parsedIng.normalizedName, // Use for aggregation and pantry matching
                    originalString: parsedIng.originalString
                });
            });
        }
    });

    // New aggregation logic: Group by name, then by unit.
    const aggregatedIngredientsByName = {};
    allIngredientsFromPlan.forEach(ing => {
        const nameKey = ing.normalizedForMatch.toLowerCase();
        if (!aggregatedIngredientsByName[nameKey]) {
            aggregatedIngredientsByName[nameKey] = {
                displayName: ing.displayName, // Use first display name encountered for the group
                normalizedForMatch: ing.normalizedForMatch,
                units: {}, // Stores unit-specific aggregations
                haveAtHome: false, // Will be set later
                sources: [] // Keep track of all recipe sources for this ingredient name
            };
        }

        // Add to sources for the main ingredient name
        aggregatedIngredientsByName[nameKey].sources.push({
             recipeName: ing.recipeName,
             originalString: ing.originalString // Good for traceability if needed
        });


        const unitKey = ing.unit.toLowerCase();
        if (!aggregatedIngredientsByName[nameKey].units[unitKey]) {
            aggregatedIngredientsByName[nameKey].units[unitKey] = {
                unit: ing.unit, // Store the original unit string for display
                totalQuantity: 0,
                recipeSources: [] // Store which recipes contributed to this specific unit
            };
        }
        aggregatedIngredientsByName[nameKey].units[unitKey].totalQuantity += ing.quantity;
        aggregatedIngredientsByName[nameKey].units[unitKey].recipeSources.push({
            recipeName: ing.recipeName,
            quantity: ing.quantity
        });
    });

    const pantryItemNamesLower = new Set(userPantry.map(item => normalizeIngredientName(item.name).toLowerCase().trim()));
    const finalShoppingList = [];

    Object.values(aggregatedIngredientsByName).forEach(ingGroup => {
        // Determine if this ingredient group is considered "at home"
        // An ingredient group is "at home" if its normalized name matches any item in the pantry.
        ingGroup.haveAtHome = pantryItemNamesLower.has(ingGroup.normalizedForMatch.toLowerCase().trim());

        const unitEntries = Object.values(ingGroup.units);
        // Sort unit entries alphabetically by unit name
        unitEntries.sort((a, b) => a.unit.localeCompare(b.unit));

        finalShoppingList.push({
            displayName: ingGroup.displayName,
            normalizedForMatch: ingGroup.normalizedForMatch,
            haveAtHome: ingGroup.haveAtHome,
            unitEntries: unitEntries, // This is an array of {unit, totalQuantity, recipeSources}
            // We can determine if it's 'combined' based on the recipeSources within unitEntries or total sources for the name
            combined: ingGroup.sources.length > 1 // Simple check: if sources from more than one processed ingredient line
        });
    });

    // Sort the final list alphabetically by ingredient display name
    finalShoppingList.sort((a, b) => a.displayName.localeCompare(b.displayName));

    // The `pantryCategories` argument is no longer used for categorization here.
    // It might still be useful if we wanted to assign a primary category to an ingredient group,
    // but the current request focuses on alphabetical sorting without categories.

    return finalShoppingList;
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

async function extractUniqueTags() {
    const recipeFiles = ['data/recipes.json', 'data/recipes_2.json', 'data/recipes_4.json'];
    const allTags = new Set();

    try {
        const responses = await Promise.all(recipeFiles.map(file => fetch(file)));
        const jsonDataPromises = responses.map((response, index) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for ${recipeFiles[index]}`);
            }
            return response.json();
        });
        const allRecipeData = await Promise.all(jsonDataPromises);

        allRecipeData.forEach(recipes => {
            if (Array.isArray(recipes)) {
                recipes.forEach(recipe => {
                    if (recipe.tags && Array.isArray(recipe.tags)) {
                        recipe.tags.forEach(tag => allTags.add(tag));
                    }
                });
            }
        });
    } catch (error) {
        console.error("Error fetching or parsing recipe data for tag extraction:", error);
        // Return a default set of tags or an empty set in case of error to prevent UI breakage
        return new Set(['Vegetarisch', 'Vegan', 'Glutenfrei', 'Laktosefrei']); // Example fallback
    }
    return Array.from(allTags).sort();
}


// Export functions for testing if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    const ingredientMatcher = require('./ingredientMatcher.js');
    UNIT_STANDARDIZATION = ingredientMatcher.UNIT_STANDARDIZATION; // Make it available in this module's scope
    normalizeUnit = ingredientMatcher.normalizeUnit;
    normalizeIngredientName = ingredientMatcher.normalizeIngredientName;

    module.exports = {
        generateWeeklyPlan,
        parseIngredientString,
        generateShoppingList,
        findAlmostCompleteRecipes,
        extractUniqueTags
    };
}