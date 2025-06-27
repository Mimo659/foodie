const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'https://www.themealdb.com/api/json/v1/1/';
const FILTER_BY_INGREDIENT_URL = (ingredient) => `${API_BASE_URL}filter.php?i=${ingredient}`;
const FILTER_BY_CATEGORY_URL = (category) => `${API_BASE_URL}filter.php?c=${category}`;
const LOOKUP_BY_ID_URL = (id) => `${API_BASE_URL}lookup.php?i=${id}`;

// Output directly to recipes.json
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'recipes.json');

const NON_VEGAN_KEYWORDS = [
    "egg", "eggs", "cheese", "milk", "honey", "yogurt", "butter", "cream",
    "gelatin", "casein", "whey", "lactose", "ghee", "paneer", "halloumi",
    "sausage", "mince", "pork", "beef", "chicken", "fish", "prawns",
    "salami", "ham", "bacon", "turkey", "duck", "salmon", "tuna",
    "oyster sauce", "fish sauce", "anchovy", "anchovies", "rennet", "isinglass", "cochineal", "carmine",
    "chicken stock", "beef stock", "pork stock", "fish stock" // Added stock types
];

function parseMeasure(measureStr) {
    if (!measureStr || measureStr.trim() === "") {
        return { quantity: null, unit: null };
    }
    measureStr = measureStr.trim();
    let quantity = null;
    let unit = '';

    // Improved regex to capture various numeric formats and units
    // Handles: "1", "1.5", "1/2", "1 1/2", "100 g", "2-3" (takes first number)
    const measureRegex = /^((\d+\s*\/\s*\d+)|(\d+\s*-\s*\d+)|(\d*\.?\d+))\s*(.*)/;
    const match = measureStr.match(measureRegex);

    if (match) {
        let qtyPart = match[1];
        unit = match[5] ? match[5].trim() : null;

        if (qtyPart.includes('/')) { // Fraction e.g. "1/2", "1 1/2" (though latter is not directly handled by regex, commonFractionMatch was better for "1 1/2")
            const parts = qtyPart.split('/');
            if (parts.length === 2 && !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1])) && parseFloat(parts[1]) !== 0) {
                quantity = parseFloat(parts[0]) / parseFloat(parts[1]);
            } else { // Malformed fraction
                quantity = 1; // Default
                if (!unit) unit = qtyPart; // Use the unparsed part as unit
            }
        } else if (qtyPart.includes('-')) { // Range e.g. "2-3"
             quantity = parseFloat(qtyPart.split('-')[0]); // Take the first number in a range
        } else if (!isNaN(parseFloat(qtyPart))) {
            quantity = parseFloat(qtyPart);
        }

        if (unit === "") unit = null;

    } else {
        // No standard number at the start, e.g. "Pinch", "Dash" or just text
        const lowerMeasureStr = measureStr.toLowerCase();
        if (lowerMeasureStr.includes('pinch') || lowerMeasureStr.includes('dash')) {
            quantity = 1;
            unit = measureStr.replace(/^a\s+/i, '').trim();
        } else {
            quantity = 1;
            unit = measureStr;
        }
    }
    if (unit === "") unit = null;
    return { quantity, unit };
}

function transformRecipe(apiRecipe) {
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
        const ingredientName = apiRecipe[`strIngredient${i}`];
        const measureStr = apiRecipe[`strMeasure${i}`];
        if (ingredientName && ingredientName.trim() !== "") {
            const { quantity, unit } = parseMeasure(measureStr);
            ingredients.push({
                name: ingredientName.trim(),
                quantity: quantity,
                unit: unit
            });
        }
    }

    let description = `A delicious ${apiRecipe.strCategory} dish.`;
    if (apiRecipe.strArea && apiRecipe.strArea.trim() !== "") {
        description = `A delicious ${apiRecipe.strCategory} dish from ${apiRecipe.strArea} cuisine.`;
    }

    const instructions = apiRecipe.strInstructions ? apiRecipe.strInstructions
        .split(/\r\n|\n/) // Split by newlines first
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .flatMap(line => line.split(/(?<=\.)\s+/)) // Further split by period followed by space, keeping period
        .map(step => step.trim())
        .filter(step => step.length > 0)
        .map(step => step.endsWith('.') || step.endsWith('!') || step.endsWith('?') ? step : step + '.')
        : [];

    let isRecipeVegetarian = apiRecipe.strCategory === 'Vegetarian';
    if (['Beef', 'Chicken', 'Lamb', 'Pork', 'Seafood', 'Fish', 'Shellfish', 'Pasta', 'Miscellaneous'].includes(apiRecipe.strCategory)) {
        // Check ingredients for meat if category is ambiguous like Pasta or Miscellaneous
        let hasMeatIngredient = false;
        for (const ing of ingredients) {
            const ingNameLower = ing.name.toLowerCase();
            if (NON_VEGAN_KEYWORDS.some(keyword => ingNameLower.includes(keyword) &&
                ["beef", "chicken", "pork", "lamb", "fish", "sausage", "ham", "bacon", "mince", "prawns", "salmon", "tuna", "turkey", "duck"].includes(keyword))) {
                hasMeatIngredient = true;
                break;
            }
        }
        if (hasMeatIngredient) isRecipeVegetarian = false;
        else if (apiRecipe.strCategory === 'Vegetarian') isRecipeVegetarian = true;
        // If category is not vegetarian and no meat ingredients, it *could* be vegetarian.
        // This part is tricky; TheMealDB isn't always perfectly categorized.
        // For now, if category IS 'Vegetarian', it's vegetarian. If it's clearly meat category, it's not.
        // Otherwise, rely on ingredient check for meat.
    }


    let isRecipeVegan = false;
    if (isRecipeVegetarian) {
        isRecipeVegan = true; // Assume vegan unless a non-vegan keyword is found
        const allRecipeText = [
            apiRecipe.strMeal.toLowerCase(),
            ...ingredients.map(ing => ing.name.toLowerCase()),
            // Don't check instructions for keywords, could be "serve with a side of cheese (optional)"
        ].join(' ');

        if (NON_VEGAN_KEYWORDS.some(keyword => allRecipeText.includes(keyword))) {
            isRecipeVegan = false;
        }
    }

    // Explicitly mark beef/chicken as not vegetarian/vegan
    if (apiRecipe.strCategory === 'Beef' || apiRecipe.strCategory === 'Chicken' ||
        (apiRecipe.strMeal && (apiRecipe.strMeal.toLowerCase().includes('beef') || apiRecipe.strMeal.toLowerCase().includes('chicken')))
       ) {
        isRecipeVegetarian = false;
        isRecipeVegan = false;
    }


    const tags = [];
    if (apiRecipe.strCategory) tags.push(apiRecipe.strCategory);
    if (apiRecipe.strArea) tags.push(apiRecipe.strArea);
    if (apiRecipe.strTags) {
        tags.push(...apiRecipe.strTags.split(',').map(tag => tag.trim()).filter(tag => tag));
    }
    if (isRecipeVegetarian) tags.push("vegetarian");
    if (isRecipeVegan) tags.push("vegan");

    return {
        id: `rezept-api-${apiRecipe.idMeal}`,
        name: apiRecipe.strMeal,
        description: description,
        ingredients: ingredients,
        instructions: instructions,
        isVegetarian: isRecipeVegetarian,
        isVegan: isRecipeVegan,
        tags: [...new Set(tags)].filter(tag => tag) // Unique and non-empty tags
    };
}

async function fetchRecipeDetails(mealId) {
    try {
        // console.log(`Fetching details for ${mealId}`);
        const response = await axios.get(LOOKUP_BY_ID_URL(mealId));
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to be nice to API
        if (response.data && response.data.meals && response.data.meals.length > 0) {
            return response.data.meals[0];
        }
    } catch (error) {
        console.error(`Error fetching details for meal ID ${mealId}:`, error.message.substring(0, 200));
    }
    return null;
}

async function fetchMealIdsByUrl(url, limit) {
    const mealIds = [];
    try {
        // console.log(`Fetching meal IDs from ${url}`);
        const response = await axios.get(url);
        if (response.data && response.data.meals) {
            // Shuffle the array to get different recipes if limit is less than total
            const shuffledMeals = response.data.meals.sort(() => 0.5 - Math.random());
            for (const meal of shuffledMeals) {
                if (mealIds.length < limit) {
                    mealIds.push(meal.idMeal);
                } else {
                    break;
                }
            }
        }
    } catch (error) {
        console.error(`Error fetching meal list from ${url}:`, error.message.substring(0, 200));
    }
    return mealIds;
}

async function fetchRecipesForCategory(categoryName, count, isIngredientFilter = false) {
    const recipes = [];
    const fetchedRecipeIds = new Set();
    console.log(`Fetching ${count} recipes for category: ${categoryName}...`);

    const url = isIngredientFilter ? FILTER_BY_INGREDIENT_URL(categoryName) : FILTER_BY_CATEGORY_URL(categoryName);
    const mealIds = await fetchMealIdsByUrl(url, count * 2); // Fetch more IDs initially due to potential null details or duplicates

    for (const id of mealIds) {
        if (recipes.length >= count) break;
        if (fetchedRecipeIds.has(id)) continue;

        const detail = await fetchRecipeDetails(id);
        if (detail) {
            const transformedRecipe = transformRecipe(detail);
            recipes.push(transformedRecipe);
            fetchedRecipeIds.add(id);
        }
    }
    console.log(`Successfully fetched ${recipes.length} recipes for ${categoryName}.`);
    return recipes;
}

async function main() {
    console.log("Starting recipe fetch process...");
    const allRecipes = [];
    const recipeIdMasterSet = new Set(); // To track IDs across all categories

    const TARGET_COUNT_PER_CATEGORY = 80;
    const VEGETARIAN_FETCH_TARGET = TARGET_COUNT_PER_CATEGORY * 2.5; // Fetch more vegetarian to filter for vegan

    // Fetch Beef recipes
    const beefRecipes = await fetchRecipesForCategory('beef', TARGET_COUNT_PER_CATEGORY, true);
    beefRecipes.forEach(r => {
        r.isVegetarian = false; r.isVegan = false; // Ensure flags
        if (!recipeIdMasterSet.has(r.id)) { allRecipes.push(r); recipeIdMasterSet.add(r.id); }
    });

    // Fetch Chicken recipes
    const chickenRecipes = await fetchRecipesForCategory('chicken', TARGET_COUNT_PER_CATEGORY, true);
    chickenRecipes.forEach(r => {
        r.isVegetarian = false; r.isVegan = false; // Ensure flags
         if (!recipeIdMasterSet.has(r.id)) { allRecipes.push(r); recipeIdMasterSet.add(r.id); }
    });

    // Fetch all Vegetarian recipes first
    console.log(`Fetching up to ${VEGETARIAN_FETCH_TARGET} vegetarian recipes for filtering...`);
    const allVegetarianApiRecipes = await fetchRecipesForCategory('Vegetarian', VEGETARIAN_FETCH_TARGET, false);

    const vegetarianRecipes = [];
    const veganRecipes = [];

    for (const recipe of allVegetarianApiRecipes) {
        if (recipeIdMasterSet.has(recipe.id)) continue; // Already added (e.g. if it was miscategorized and fetched by ingredient)

        // Re-evaluate vegan status based on full transformed data
        let isActuallyVegan = true;
        if (!recipe.isVegetarian) { // Should be vegetarian by category, but double check
            isActuallyVegan = false;
        } else {
            const allRecipeText = [
                recipe.name.toLowerCase(),
                ...recipe.ingredients.map(ing => ing.name.toLowerCase()),
            ].join(' ');
            if (NON_VEGAN_KEYWORDS.some(keyword => allRecipeText.includes(keyword))) {
                isActuallyVegan = false;
            }
        }
        recipe.isVegan = isActuallyVegan; // Update based on detailed check
        recipe.isVegetarian = true; // It came from vegetarian category

        if (recipe.isVegan && veganRecipes.length < TARGET_COUNT_PER_CATEGORY) {
            if (!recipeIdMasterSet.has(recipe.id)) {
                 veganRecipes.push(recipe);
                 recipeIdMasterSet.add(recipe.id);
            }
        } else if (!recipe.isVegan && vegetarianRecipes.length < TARGET_COUNT_PER_CATEGORY) {
             if (!recipeIdMasterSet.has(recipe.id)) {
                vegetarianRecipes.push(recipe);
                recipeIdMasterSet.add(recipe.id);
            }
        }
    }

    allRecipes.push(...veganRecipes, ...vegetarianRecipes);

    // Ensure unique recipes one last time (though recipeIdMasterSet should handle it)
    const finalUniqueRecipes = Array.from(new Map(allRecipes.map(recipe => [recipe.id, recipe])).values());


    console.log(`Total unique recipes fetched: ${finalUniqueRecipes.length}`);
    console.log(` - Beef: ${beefRecipes.filter(r => finalUniqueRecipes.find(fr => fr.id === r.id)).length}`);
    console.log(` - Chicken: ${chickenRecipes.filter(r => finalUniqueRecipes.find(fr => fr.id === r.id)).length}`);
    console.log(` - Vegetarian (non-vegan): ${vegetarianRecipes.filter(r => finalUniqueRecipes.find(fr => fr.id === r.id)).length}`);
    console.log(` - Vegan: ${veganRecipes.filter(r => finalUniqueRecipes.find(fr => fr.id === r.id)).length}`);

    try {
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(finalUniqueRecipes, null, 2), 'utf-8');
        console.log(`Successfully wrote ${finalUniqueRecipes.length} recipes to ${OUTPUT_PATH}`);
    } catch (error) {
        console.error("Error writing recipes to file:", error.message);
    }
}

main().catch(error => {
    console.error("Unhandled error in main execution:", error);
});
