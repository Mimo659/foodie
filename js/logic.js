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
    const originalInputString = ingString; // Preserve the original input for originalString

    if (typeof ingString !== 'string') {
        // Handle non-string inputs gracefully
        return {
            originalString: "Fehlerhafter Eintrag", // Placeholder for display
            quantity: 0,
            unit: "",
            name: "Unbekannt" // Parsed name for logic
        };
    }

    ingString = ingString.trim();
    let quantity = 1;
    let unit = 'Stk.'; // Default unit, especially for items like "1 Apfel"
    let name = ingString;

    // Pattern: "1 Prise Salz", "500 g Mehl", "1 Dose Tomaten"
    // Changed last group from (.+) to (.*) to allow empty namePart, critical for "123" case.
    const qtyUnitNamePattern = /^(?:(\d+(?:[\.,]\d+)?)\s*)?(?:([\wßöäüÖÄÜ\.]+)\s+)?(.*)$/;

    const commonUnitsMap = {
        "g": "g", "gramm": "g",
        "kg": "kg", "kilogramm": "kg",
        "ml": "ml", "milliliter": "ml",
        "l": "L", "liter": "L",
        "el": "EL", "esslöffel": "EL",
        "tl": "TL", "teelöffel": "TL",
        "pck.": "Pck.", "packung": "Pck.", "pck": "Pck.",
        "bd.": "Bund", "bund": "Bund", "bd": "Bund",
        "stk.": "Stk.", "stück": "Stk.", "stk": "Stk.",
        "dose": "Dose", "dosen": "Dose",
        "glas": "Glas",
        "prise": "Prise",
        "knolle": "Knolle",
        "zehe": "Zehe(n)", "zehen": "Zehe(n)"
    };
    const allUnitStrings = Object.keys(commonUnitsMap);

    const match = ingString.match(qtyUnitNamePattern);

    if (match) {
        const numPart = match[1];
        const potentialUnitWord = match[2]; // Word that might be a unit if numPart exists or if it's like "Liter Milch"
        let namePart = match[3];

        if (numPart) {
            quantity = parseFloat(numPart.replace(',', '.'));
            if (potentialUnitWord) {
                const unitLower = potentialUnitWord.toLowerCase();
                if (allUnitStrings.includes(unitLower)) {
                    unit = commonUnitsMap[unitLower];
                    name = namePart.trim();
                } else { // Number present, but potentialUnitWord is not a recognized unit -> it's part of the name
                    unit = 'Stk.';
                    name = (potentialUnitWord + " " + namePart).trim();
                }
            } else { // Number present, but no middle word (potentialUnitWord)
                unit = 'Stk.';
                name = namePart.trim();
            }
        } else if (potentialUnitWord) { // No number, but a potential unit word followed by the rest of the name. E.g. "Liter Milch"
            const unitLower = potentialUnitWord.toLowerCase();
            if (allUnitStrings.includes(unitLower)) {
                unit = commonUnitsMap[unitLower];
                name = namePart.trim(); // name is what comes after "Liter"
            } else { // Word is not a unit, so it's all part of the name. E.g. "Volle Kanne Freude"
                name = (potentialUnitWord + " " + namePart).trim();
            }
        } else { // No number, no potential unit word, only namePart. E.g. "Salz" or "g"
            name = namePart.trim();
            const nameLower = name.toLowerCase();
            if (allUnitStrings.includes(nameLower)) { // Check if the namePart itself is a unit (e.g. "g")
                unit = commonUnitsMap[nameLower];
                name = ""; // Name is empty if the whole string was just a unit
            } else if (nameLower === "salz" || nameLower === "pfeffer" || nameLower.includes("prise")) {
                unit = 'Prise'; // Keep name as is, e.g. "Salz", "Schwarzer Pfeffer"
            }
            // If name is not a recognized unit and not Salz/Pfeffer, it remains Stk. with the full name.
        }
    } else { // Regex didn't match (e.g. empty string, or very unusual format)
        name = ingString; // Keep original string as name
        // Apply default for Salz/Pfeffer even on non-match, as a fallback
        const nameLower = name.toLowerCase();
        if (nameLower === "salz" || nameLower === "pfeffer" || nameLower.includes("prise")) {
            unit = 'Prise';
        } else if (allUnitStrings.includes(nameLower)) { // Fallback for standalone units like "g" if regex fails
            unit = commonUnitsMap[nameLower];
            name = "";
        }
    }

    // Final check for common ingredients that might not specify quantity/unit and default to Stk.
    if (quantity === 1 && unit === 'Stk.' && (name.toLowerCase() === "salz" || name.toLowerCase() === "pfeffer")) {
        unit = "Prise";
    }

    // If after all parsing, name is empty but originalString was not, and unit is still Stk, use original string as name
    // This can happen if input was "123" -> numPart="123", namePart="", name="" -> quantity=123, unit=Stk, name=""
    // Or if input was "g" -> numPart=undef, potentialUnit=undef, namePart="g" -> name="g" -> unit="g", name=""
    // This seems fine. What if input was "Liter" -> namePart="Liter" -> unit="L", name="" -> OK
    if (name === "" && ingString !== "" && unit === "Stk.") {
         // If name ended up empty, but we had an input string, and unit is still default 'Stk.'
         // it implies the input was something like "123" that got parsed as quantity only.
         // Or it was a word not recognized as a unit. In this case, the word should be the name.
         if (!match || (!match[1] && !match[2])) { // if no numpart and no potentialunit from regex
            name = ingString;
         }
    }


    // Further name normalization: remove details in parentheses for cleaner matching, but keep for display
    // Example: "Eier (Größe M)" -> name for matching: "Eier", originalString will keep "(Größe M)"
    // This part needs to be careful not to remove essential info like "(frisch)" if user wants to keep it.
    // For now, let's keep name simpler and rely on originalString for display detail.
    // let normalizedName = name.replace(/\s*\(.*?\)\s*/g, '').trim();
    // if (!normalizedName) normalizedName = name; // if stripping parentheses removes everything

    return {
        originalString: originalInputString, // Return the original, unmodified input string
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

// Export functions for testing if in Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateWeeklyPlan,
        parseIngredientString,
        generateShoppingList,
        findAlmostCompleteRecipes
    };
}