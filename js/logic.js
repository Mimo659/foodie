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

    // Regex to capture quantity, unit, and name
    // Allows for quantities like "1", "1.5", "1,5"
    // Allows for units like "g", "EL", "Bund"
    // Name is the remainder
    const qtyUnitNamePattern = /^(?:(\d+(?:[\.,]\d+)?)\s*)?(?:([\wßöäüÖÄÜ\.\(\)]+)\s+)?(.*)$/;
    const match = tempIngString.match(qtyUnitNamePattern);

    let parsedUnit = '';
    let parsedNamePart = tempIngString;

    if (match) {
        const numPart = match[1]; // e.g., "500"
        const potentialUnitWord = match[2]; // e.g., "g", "EL", "Stück"
        const namePartAfterUnit = match[3]; // e.g., "Mehl", "Zucker"

        if (numPart) {
            quantity = parseFloat(numPart.replace(',', '.'));
        }

        if (potentialUnitWord) {
            // Is potentialUnitWord a recognized unit?
            const standardizedPotentialUnit = normalizeUnit(potentialUnitWord);
            if (UNIT_STANDARDIZATION[potentialUnitWord.toLowerCase().replace(/[()]/g, '')] || standardizedPotentialUnit !== potentialUnitWord) {
                // It's a unit
                parsedUnit = standardizedPotentialUnit;
                parsedNamePart = namePartAfterUnit.trim();
            } else {
                // It's part of the name
                parsedUnit = ''; // No unit found here, default or derive later
                parsedNamePart = (potentialUnitWord + " " + namePartAfterUnit).trim();
            }
        } else {
             // No middle word, numPart might exist or not. namePartAfterUnit is the rest.
            parsedNamePart = namePartAfterUnit.trim();
        }
        name = parsedNamePart;
    }
    // If after regex, name is empty but there was a numpart, it means the name was probably the potentialUnitWord
    if (name === "" && match && match[1] && match[2]) {
        name = match[2]; // e.g. "2 Zwiebeln" -> numPart="2", potentialUnitWord="Zwiebeln", namePartAfterUnit=""
                        // initial name becomes "", so set it to "Zwiebeln"
    }


    // Standardize the parsed unit
    let standardizedUnit = normalizeUnit(parsedUnit);
    let normalizedName = normalizeIngredientName(name);


    // If no unit was parsed explicitly, but the name itself is a unit (e.g. "Salz", "Pfeffer" often imply "Prise")
    // or if the name is a unit like "g" and quantity was given e.g. "500 g" parsed as qty:500, name:"g"
    if (standardizedUnit === '' || standardizedUnit === name) {
        if (normalizedName.toLowerCase() === 'salz' || normalizedName.toLowerCase() === 'pfeffer') {
            standardizedUnit = 'Prise';
        } else if (UNIT_STANDARDIZATION[normalizedName.toLowerCase()]) { // if the name itself is a unit like "g"
            standardizedUnit = UNIT_STANDARDIZATION[normalizedName.toLowerCase()];
            // normalizedName = ""; // Name is empty if the whole string was just a unit and quantity
        } else if (quantity > 0 && name !== "") { // If there's a quantity and a name, but no unit found yet
             standardizedUnit = 'Stk.'; // Default to "Stk." if a quantity and name exist but no unit
        }
    }
     if (name==="" && quantity > 0 && standardizedUnit !== "" && standardizedUnit !== "Stk.") {
        // if name is empty but we have quantity and a specific unit (e.g. "500 g" parsed as qty:500, unit:g, name:"")
        // then the original name was likely just the unit.
        // We don't want an empty name. We can try to set a generic name or leave it as is.
        // For now, let's allow empty name if unit is specific. Shopping list might need to handle this.
    }


    // Special handling for ingredients that are often unitless but imply "Stk."
    // or where the "name" parsed might actually be a unit for that quantity.
    // Example: "2 Zwiebeln" -> quantity=2, name="Zwiebeln". Unit should be "Stk."
    // Example: "Salz" -> quantity=1, name="Salz". Unit should be "Prise".
    if (standardizedUnit === '' && name !== '') {
        if (normalizedName.toLowerCase() === 'salz' || normalizedName.toLowerCase() === 'pfeffer') {
            standardizedUnit = 'Prise';
            if (quantity === 1 && numPart === undefined) quantity = 1; // ensure quantity if it was "Salz"
        } else if (quantity > 0) { // If there's a quantity, assume "Stk."
            standardizedUnit = 'Stk.';
        }
    }


    return {
        originalString: originalInputString,
        quantity: quantity,
        unit: parsedUnit || standardizedUnit, // The initially parsed or derived unit before full standardization for display
        name: name, // The initially parsed name before full normalization for display context
        normalizedName: normalizedName,
        standardizedUnit: standardizedUnit // Fully standardized unit for logic
    };
}


function generateShoppingList(plan, userPantry, persons = 1, pantryCategories) {
    if (!plan || plan.length === 0) return [];
    const required = {};

    plan.forEach(day => {
        if (day.selected && day.selected.ingredients) {
            day.selected.ingredients.forEach(ingString => {
                const parsedIng = parseIngredientString(ingString);

                let recipePortions = 1;
                if (day.selected.portions) {
                    const portionMatch = day.selected.portions.match(/für (\d+)/);
                    if (portionMatch && portionMatch[1]) {
                        recipePortions = parseInt(portionMatch[1], 10);
                    }
                }
                if (recipePortions <= 0) recipePortions = 1;

                const quantityPerPerson = parsedIng.quantity / recipePortions;
                let currentQuantity = quantityPerPerson * persons;
                let currentUnit = parsedIng.standardizedUnit;
                let currentName = parsedIng.normalizedName;

                // Attempt to convert to a base unit for aggregation
                const conversionResult = convertToBaseUnit(currentQuantity, currentUnit, currentName);
                if (conversionResult.converted) {
                    currentQuantity = conversionResult.quantity;
                    currentUnit = conversionResult.unit;
                }
                // Ensure currentName is the normalized name after potential conversion lookups
                currentName = normalizeIngredientName(currentName);


                // Key for aggregation: normalized name + standardized (and potentially base) unit
                const key = currentName.toLowerCase().trim() + "_" + currentUnit.toLowerCase().trim();

                if (required[key]) {
                    required[key].quantity += currentQuantity;
                    required[key].combined = true;
                    // Potentially update originalStrings if a more generic one is needed, or collect all
                    required[key].originalStrings.add(parsedIng.originalString);
                } else {
                    required[key] = {
                        displayName: currentName, // Default display name to normalized name
                        quantity: currentQuantity,
                        unit: currentUnit,
                        originalStrings: new Set([parsedIng.originalString]), // Store all original strings
                        combined: false,
                        normalizedForMatch: currentName // Store the name used for matching pantry items
                    };
                }
            });
        }
    });

    const pantryItemNamesLower = new Set(userPantry.map(item => normalizeIngredientName(item.name).toLowerCase().trim()));

    const categorizedShoppingList = {};

    Object.values(required).forEach(ing => {
        let categoryName = "Sonstiges";
        let longestMatchLength = 0;

        if (pantryCategories) {
            for (const category of pantryCategories) {
                if (category.items) {
                    for (const pItem of category.items) {
                        const pItemNameLower = normalizeIngredientName(pItem.name).toLowerCase();
                        // Use ing.normalizedForMatch for comparison
                        if (ing.normalizedForMatch.toLowerCase().includes(pItemNameLower)) {
                            if (pItemNameLower.length > longestMatchLength) {
                                longestMatchLength = pItemNameLower.length;
                                categoryName = category.name;
                            }
                        }
                    }
                }
            }
        }

        if (!categorizedShoppingList[categoryName]) {
            categorizedShoppingList[categoryName] = {
                categoryName: categoryName,
                items: []
            };
        }

        // The ing.displayName is already the normalized name (e.g., "Zwiebel", "Knoblauch").
        // This is suitable for display, especially when items are combined.
        // The ing.unit is the unit after potential conversion to a base unit.
        categorizedShoppingList[categoryName].items.push({
            name: ing.displayName,
            quantity: ing.quantity,
            unit: ing.unit,
            haveAtHome: pantryItemNamesLower.has(ing.normalizedForMatch.toLowerCase().trim()),
            combined: ing.combined,
        });
    });

    const finalShoppingList = Object.values(categorizedShoppingList);
    finalShoppingList.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
    finalShoppingList.forEach(category => {
        category.items.sort((a, b) => {
            if (a.haveAtHome === b.haveAtHome) {
                return a.name.localeCompare(b.name);
            }
            return a.haveAtHome ? 1 : -1; // Items not at home first
        });
    });

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

// Export functions for testing if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateWeeklyPlan,
        parseIngredientString,
        generateShoppingList,
        findAlmostCompleteRecipes
    };
}