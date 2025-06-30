const fs = require('fs');
const path = require('path');

const RECIPES_FILE_PATH = path.join('data', 'recipes.json');
const RECIPES_2_FILE_PATH = path.join('data', 'recipes_2.json');
const RECIPES_4_FILE_PATH = path.join('data', 'recipes_4.json');

let originalRecipes = [];

// 1. Parse `recipes.json`
try {
    const rawData = fs.readFileSync(RECIPES_FILE_PATH, 'utf-8');
    originalRecipes = JSON.parse(rawData);
    console.log(`Successfully loaded ${originalRecipes.length} recipes.`);
} catch (error) {
    console.error("Error loading or parsing recipes.json:", error);
    process.exit(1); // Exit if we can't load the base data
}

// Placeholder for unscalable ingredients reporting
const unscalableIngredients = new Set();

// 2. Create Helper Functions (JavaScript)

/**
 * Parses the portions string (e.g., "für 4 Portionen") to extract the number of portions.
 * @param {string} portionsString - The string describing the portions.
 * @returns {number|null} The number of portions, or null if not parsable.
 */
function getPortionCount(portionsString) {
    if (!portionsString || typeof portionsString !== 'string') {
        return null;
    }
    const match = portionsString.match(/für (\d+)\s+(Portionen|Personen)/i);
    if (match && match[1]) {
        return parseInt(match[1], 10);
    }
    // Fallback for just a number
    const simpleMatch = portionsString.match(/(\d+)/);
    if (simpleMatch && simpleMatch[1]) {
        return parseInt(simpleMatch[1], 10);
    }
    return null;
}

/**
 * Formats the new portion number back into a string, trying to match original wording.
 * @param {number} count - The number of portions.
 * @param {string} originalPortionsString - The original portions string to match wording.
 * @returns {string} The formatted portions string.
 */
function formatPortions(count, originalPortionsString) {
    if (originalPortionsString && originalPortionsString.toLowerCase().includes("personen")) {
        return `für ${count} Personen`;
    }
    return `für ${count} Portionen`;
}

// 3. Develop Ingredient Scaling Logic (JavaScript)

/**
 * Scales an ingredient string based on original and target portion sizes.
 * @param {string} ingredientString - The ingredient string (e.g., "500 g Flour").
 * @param {number} originalPortions - The original number of portions for the recipe.
 * @param {number} targetPortions - The target number of portions.
 * @param {Set<string>} unscalableIngredientsSet - A Set to store unscalable ingredient strings.
 * @returns {string} The scaled ingredient string, or original if not scalable.
 */
function scaleIngredient(ingredientString, originalPortions, targetPortions, unscalableIngredientsSet) {
    if (originalPortions === null || originalPortions <= 0 || targetPortions <= 0) {
        unscalableIngredientsSet.add(ingredientString);
        return ingredientString; // Cannot scale if original portions are unknown or invalid
    }

    // Regex to capture quantity (integer or decimal with comma/dot), unit, and rest of the string
    // Allows for optional space between quantity and unit
    const ingredientRegex = /^(\d+([.,]\d+)?)\s*([a-zA-ZäöüÄÖÜßéèàêâûôîç°§]+(?:\([a-zA-ZäöüÄÖÜßéèàêâûôîç°§]+\))?)?\s*(.*)/;
    const match = ingredientString.match(ingredientRegex);

    if (match && match[1]) {
        let quantity = parseFloat(match[1].replace(',', '.')); // Normalize comma to dot for parseFloat
        const unit = match[3] || ""; // Unit might be undefined
        const name = match[4] || ""; // Name of the ingredient

        // Check for units that should not be scaled or have specific handling
        const nonScalableUnits = ["prise", "msp.", "pck.", "dose(n)", "glas", "becher", "knolle(n)", "stange(n)", "zweig(e)", "topf", "handvoll"];
        // Pck. and Dose(n) might be scalable in some contexts, but for now, let's be cautious.
        // User feedback indicated "1 Pck. ja! Buttergemüse (TK, à 300 g)" - the "à 300g" implies the pack size is fixed.

        if (unit && nonScalableUnits.some(nsUnit => unit.toLowerCase().startsWith(nsUnit))) {
             // For specific units like Pck or Dose where the size is fixed (e.g. "1 Pck. (à 300g)")
             // we might want to scale the number of packs, but not the "à XXXg" part.
             // For now, if the unit is in nonScalableUnits, we scale the leading number of these items.
        }


        if (isNaN(quantity)) {
            unscalableIngredientsSet.add(ingredientString);
            return ingredientString;
        }

        let scaledQuantity = (quantity / originalPortions) * targetPortions;

        // Basic rounding: integers remain integers if whole, otherwise 1 decimal place.
        // More sophisticated rounding might be needed depending on typical kitchen measurements.
        if (Number.isInteger(scaledQuantity) || scaledQuantity % 1 === 0) {
            scaledQuantity = Math.round(scaledQuantity);
        } else if (scaledQuantity < 1 && scaledQuantity > 0) {
            // For small quantities, round to 2 decimal places, or handle as fractions if desired
            scaledQuantity = parseFloat(scaledQuantity.toFixed(2));
        }
        else {
            scaledQuantity = parseFloat(scaledQuantity.toFixed(1));
        }

        // Avoid 0 quantity unless it was originally 0
        if (scaledQuantity === 0 && quantity !== 0) {
            // This might happen if originalPortions is much larger than targetPortions.
            // Decide on a minimum quantity or keep as is. For now, let's keep a small fraction.
            // Or, if it's like "0,5 EL", it should become "0.25 EL" for half.
            // Let's stick to toFixed(1) or toFixed(2) which handles this.
            // If scaled quantity becomes very small, e.g. 0.01, it might be better to list it as "a pinch" or similar.
            // For now, just use the scaled value.
        }


        // Reconstruct the string, replacing comma with dot for consistency in output if desired, or keep original.
        // Here, we output with a dot as the decimal separator.
        let quantityStr = String(scaledQuantity).replace('.', ',');


        // Handle cases like "1 Zehe(n) Knoblauch" -> "0,5 Zehe(n) Knoblauch" is weird.
        // For "Zehe(n)", "Stück", etc., maybe round to nearest whole or half?
        const wholeItemUnits = ["zehe(n)", "stück", "knoblauchzehen"]; // Add more as identified
        if (unit && wholeItemUnits.some(wiUnit => unit.toLowerCase().startsWith(wiUnit))) {
            if (scaledQuantity < 0.5 && scaledQuantity > 0) scaledQuantity = 0.5; // Minimum 0.5 for these
            else scaledQuantity = Math.round(scaledQuantity * 2) / 2; // Round to nearest 0.5
            quantityStr = String(scaledQuantity).replace('.', ',');
        }


        return `${quantityStr}${unit ? ' ' + unit : ''} ${name}`.trim();
    } else {
        // No numeric quantity found at the beginning, or structure doesn't match
        // Check for "eine Prise", "ein Bund" etc.
        const textQuantities = [
            { pattern: /^(eine|einen|ein)\s+Prise/i, base: 1, unitText: "Prise" },
            { pattern: /^(eine|einen|ein)\s+Msp./i, base: 1, unitText: "Msp." },
            { pattern: /^(eine|einen|ein)\s+Bd\./i, base: 1, unitText: "Bd." },
            // Add more textual quantities if needed
        ];

        for (const tq of textQuantities) {
            if (tq.pattern.test(ingredientString)) {
                // These are typically not scaled or scaled carefully.
                // For now, keep them as is, and add to unscalable.
                unscalableIngredientsSet.add(ingredientString);
                return ingredientString;
            }
        }

        unscalableIngredientsSet.add(ingredientString);
        return ingredientString;
    }
}


// Main processing function
function processRecipes() {
    console.log("Processing recipes...");

    const allRecipesFor2 = [];
    const allRecipesFor4 = [];

    originalRecipes.forEach(originalRecipe => {
        const originalPortionCount = getPortionCount(originalRecipe.portions);

        if (originalPortionCount === null) {
            console.warn(`Could not parse portion count for recipe: "${originalRecipe.title}". Skipping this recipe.`);
            unscalableIngredients.add(`Recipe: "${originalRecipe.title}" - Invalid portions: ${originalRecipe.portions}`);
            return; // Skip this recipe
        }

        // Create recipe for 2 portions
        const recipeFor2 = JSON.parse(JSON.stringify(originalRecipe)); // Deep copy
        recipeFor2.portions = formatPortions(2, originalRecipe.portions);
        recipeFor2.ingredients = originalRecipe.ingredients.map(ing =>
            scaleIngredient(ing, originalPortionCount, 2, unscalableIngredients)
        );
        allRecipesFor2.push(recipeFor2);

        // Create recipe for 4 portions
        const recipeFor4 = JSON.parse(JSON.stringify(originalRecipe)); // Deep copy
        recipeFor4.portions = formatPortions(4, originalRecipe.portions);
        recipeFor4.ingredients = originalRecipe.ingredients.map(ing =>
            scaleIngredient(ing, originalPortionCount, 4, unscalableIngredients)
        );
        allRecipesFor4.push(recipeFor4);
    });

    // Step 5: Write New JSON Files (JavaScript)
    try {
        fs.writeFileSync(RECIPES_2_FILE_PATH, JSON.stringify(allRecipesFor2, null, 2), 'utf-8');
        console.log(`Successfully wrote ${allRecipesFor2.length} recipes to ${RECIPES_2_FILE_PATH}`);
        fs.writeFileSync(RECIPES_4_FILE_PATH, JSON.stringify(allRecipesFor4, null, 2), 'utf-8');
        console.log(`Successfully wrote ${allRecipesFor4.length} recipes to ${RECIPES_4_FILE_PATH}`);
    } catch (error) {
        console.error("Error writing recipe files:", error);
    }

    // Step 6: Report Unscalable Ingredients
    if (unscalableIngredients.size > 0) {
        console.log("\n--- Unscalable Ingredients Report ---");
        unscalableIngredients.forEach(ing => console.log(ing));
        console.log("--- End of Report ---");
        // This message will also be sent to the user via message_user tool later
    }
}

// Call main function if this script is executed directly
if (require.main === module) {
    processRecipes();
}

module.exports = {
    originalRecipes,
    unscalableIngredients,
    getPortionCount,
    formatPortions
    // Will export other functions for testing or modular use later
};
