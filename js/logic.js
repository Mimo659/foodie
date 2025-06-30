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

// Helper function to parse ingredient strings
function parseIngredientString(ingString) {
    ingString = ingString.trim();
    let quantity = 1;
    let unit = 'Stk.'; // Default unit, especially for items like "1 Apfel"
    let name = ingString;

    // Pattern: "1 Prise Salz", "500 g Mehl", "1 Dose Tomaten"
    const qtyUnitNamePattern = /^(?:(\d+(?:[\.,]\d+)?)\s*)?(?:([\wßöäüÖÄÜ\.]+)\s+)?(.+)$/;
    // Pattern for things like "Salz", "Pfeffer", "1 Apfel", "Eier (Größe M)"
    // Where the "unit" might be part of the name or implicit.

    const match = ingString.match(qtyUnitNamePattern);

    if (match) {
        const numPart = match[1]; // e.g., "500"
        const potentialUnit = match[2]; // e.g., "g", "Prise", "Dose" or first word of name if no number
        const namePart = match[3]; // e.g., "Mehl", "Salz", "Tomaten"

        if (numPart) { // If there's a number, potentialUnit is likely a unit.
            quantity = parseFloat(numPart.replace(',', '.'));
            if (potentialUnit) {
                 const unitLower = potentialUnit.toLowerCase();
                if (["g", "gramm", "kg", "kilogramm", "ml", "milliliter", "l", "liter", "el", "esslöffel", "tl", "teelöffel", "pck.", "packung", "bd.", "bund", "stk.", "stück", "dose", "dosen", "glas", "prise", "knolle", "zehe", "zehen", "pck", "bd", "stk"].includes(unitLower)) {
                    // Normalize common units
                    if (unitLower === "g" || unitLower === "gramm") unit = "g";
                    else if (unitLower === "kg" || unitLower === "kilogramm") unit = "kg";
                    else if (unitLower === "ml" || unitLower === "milliliter") unit = "ml";
                    else if (unitLower === "l" || unitLower === "liter") unit = "L";
                    else if (unitLower === "el" || unitLower === "esslöffel") unit = "EL";
                    else if (unitLower === "tl" || unitLower === "teelöffel") unit = "TL";
                    else if (unitLower === "pck." || unitLower === "packung" || unitLower === "pck") unit = "Pck.";
                    else if (unitLower === "bd." || unitLower === "bund" || unitLower === "bd") unit = "Bund";
                    else if (unitLower === "stk." || unitLower === "stück" || unitLower === "stk") unit = "Stk.";
                    else if (unitLower === "dose" || unitLower === "dosen") unit = "Dose";
                    else if (unitLower === "glas") unit = "Glas";
                    else if (unitLower === "prise") unit = "Prise";
                    else if (unitLower === "knolle") unit = "Knolle";
                    else if (unitLower === "zehe" || unitLower === "zehen") unit = "Zehe(n)";
                    else unit = potentialUnit;
                    name = namePart.trim();
                } else { // Number present, but potentialUnit is not a recognized unit -> it's part of the name
                    unit = 'Stk.'; // Default if number is present but no clear unit
                    name = (potentialUnit ? potentialUnit + " " : "") + namePart.trim();
                }
            } else { // Number present, but no middle part (potentialUnit)
                unit = 'Stk.'; // e.g. "2 Äpfel"
                name = namePart.trim();
            }
        } else if (potentialUnit) { // No number, potentialUnit and namePart exist
            // This is for "Prise Salz", "Bd. Petersilie" or "Zwiebel"
            const unitLower = potentialUnit.toLowerCase();
             if (["prise", "bund", "bd.", "pck.", "pck", "dose", "glas", "knolle", "zehe", "zehen"].includes(unitLower)) {
                if (unitLower === "prise") unit = "Prise";
                else if (unitLower === "bund" || unitLower === "bd.") unit = "Bund";
                else if (unitLower === "pck." || unitLower === "pck") unit = "Pck.";
                else if (unitLower === "dose") unit = "Dose";
                else if (unitLower === "glas") unit = "Glas";
                else if (unitLower === "knolle") unit = "Knolle";
                else if (unitLower === "zehe" || unitLower === "zehen") unit = "Zehe(n)";
                else unit = potentialUnit;
                name = namePart.trim();
            } else { // No number, and potentialUnit is not a recognized unit -> whole thing is the name
                name = (potentialUnit ? potentialUnit + " " : "") + namePart.trim();
                // Default unit 'Stk' and quantity 1 are already set
            }
        } else { // Only namePart exists (e.g. "Salz")
            name = namePart.trim();
            // Default unit 'Stk' and quantity 1 are fine, but could be "Prise" for specific items
            if (name.toLowerCase() === "salz" || name.toLowerCase() === "pfeffer" || name.toLowerCase().includes("prise")) {
                unit = 'Prise';
            }
        }
    } else {
        // Fallback if regex fails, though it's designed to be quite broad
        name = ingString;
        if (name.toLowerCase() === "salz" || name.toLowerCase() === "pfeffer" || name.toLowerCase().includes("prise")) {
            unit = 'Prise';
        }
    }

    // Final check for some very common ingredients that might not specify quantity/unit
    if (quantity === 1 && unit === 'Stk.' && (name.toLowerCase() === "salz" || name.toLowerCase() === "pfeffer")) {
        unit = "Prise";
    }


    // Further name normalization: remove details in parentheses for cleaner matching, but keep for display
    // Example: "Eier (Größe M)" -> name for matching: "Eier", originalString will keep "(Größe M)"
    // This part needs to be careful not to remove essential info like "(frisch)" if user wants to keep it.
    // For now, let's keep name simpler and rely on originalString for display detail.
    // let normalizedName = name.replace(/\s*\(.*?\)\s*/g, '').trim();
    // if (!normalizedName) normalizedName = name; // if stripping parentheses removes everything

    return {
        originalString: ingString,
        quantity: quantity,
        unit: unit,
        name: name // Use the potentially more complex name for matching logic for now
    };
}


function generateShoppingList(plan, userPantry, persons = 1, pantryCategories) {
    if (!plan || plan.length === 0) return [];
    const required = {};

    plan.forEach(day => {
        if (day.selected && day.selected.ingredients) {
            day.selected.ingredients.forEach(ingString => {
                const parsedIng = parseIngredientString(ingString);
                // Adjust quantity by number of persons
                // This is tricky if the original recipe portion is not for 1 person.
                // Assuming recipe ingredients are for the portions stated in recipe.
                // For now, we will multiply the parsed quantity by `persons` if recipe.portions implies a per-person amount
                // This logic needs refinement based on how recipe.portions is structured and used.
                // For simplicity, let's assume parsedIng.quantity is the total for the recipe, and we scale it by `persons`
                // ONLY IF the recipe is for 1 person. If recipe is for e.g. 4 persons, and user sets 4 persons, no change.
                // This is complex. Let's assume for now that `persons` factor is applied to the base quantity from recipe.
                // A better model would be: quantity_for_list = (parsedIng.quantity / recipe.portions_value) * persons_value;
                // recipes.json has "portions": "für 4 Portionen". We need to parse this.
                let recipePortions = 1;
                if (day.selected.portions) {
                    const portionMatch = day.selected.portions.match(/für (\d+)/);
                    if (portionMatch && portionMatch[1]) {
                        recipePortions = parseInt(portionMatch[1], 10);
                    }
                }
                if (recipePortions <= 0) recipePortions = 1; // Safeguard against division by zero or invalid portion count

                const quantityPerPerson = parsedIng.quantity / recipePortions;
                const totalQuantity = quantityPerPerson * persons;


                const key = parsedIng.name.toLowerCase().trim() + "_" + parsedIng.unit.toLowerCase().trim();

                if (required[key]) {
                    required[key].quantity += totalQuantity;
                    required[key].combined = true; // Mark as combined
                } else {
                    required[key] = {
                        name: parsedIng.name, // Store the parsed name for matching
                        quantity: totalQuantity,
                        unit: parsedIng.unit,
                        originalString: parsedIng.originalString, // Keep original for display
                        combined: false // Initially not combined
                    };
                }
            });
        }
    });

    const pantryItemNamesLower = new Set(userPantry.map(item => item.name.toLowerCase().trim()));

    // Categorize ingredients
    const categorizedShoppingList = {};

    Object.values(required).forEach(ing => {
        let categoryName = "Sonstiges"; // Default category
        let longestMatchLength = 0;

        if (pantryCategories) {
            for (const category of pantryCategories) {
                if (category.items) {
                    for (const pItem of category.items) {
                        const pItemNameLower = pItem.name.toLowerCase();
                        const ingNameLower = ing.name.toLowerCase();
                        // Check if the parsed ingredient name contains the pantry item name.
                        if (ingNameLower.includes(pItemNameLower)) {
                            if (pItemNameLower.length > longestMatchLength) {
                                longestMatchLength = pItemNameLower.length;
                                categoryName = category.name;
                            }
                        }
                    }
                }
            }
        }
        // Assign the category determined by the longest match.
        // If no match, it remains "Sonstiges".

        if (!categorizedShoppingList[categoryName]) {
            categorizedShoppingList[categoryName] = {
                categoryName: categoryName, // Use the determined categoryName
                items: []
            };
        }
        categorizedShoppingList[categoryName].items.push({
            name: ing.originalString, // Display the original ingredient string
            quantity: ing.quantity,
            unit: ing.unit,
            haveAtHome: pantryItemNamesLower.has(ing.name.toLowerCase().trim()), // Match based on parsed name
            combined: ing.combined,
            parsedName: ing.name // for debugging or more advanced matching later
        });
    });

    const finalShoppingList = Object.values(categorizedShoppingList);

    // Sort categories (optional, but good for consistency)
    finalShoppingList.sort((a, b) => a.categoryName.localeCompare(b.categoryName));

    // Sort items within each category
    finalShoppingList.forEach(category => {
        category.items.sort((a, b) => {
            if (a.haveAtHome === b.haveAtHome) {
                return a.name.localeCompare(b.name);
            }
            return a.haveAtHome - b.haveAtHome;
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