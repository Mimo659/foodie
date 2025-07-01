import * as ui from '../ui.js';
import * as store from '../store.js';

// Variables
let ALL_RECIPES_DATA = [];
let currentlySelectedSingleRecipe = null;
let viewCallbacks = {}; // To store callbacks like onSingleRecipePlanCreated

// DOM Elements relevant to this view
const suggestedRecipesContainer = document.getElementById('suggested-recipes-container');
const createSingleRecipePlanBtn = document.getElementById('create-single-recipe-plan-btn');

function handleInfoClick(recipe) {
    ui.openRecipeModal(recipe);
}

function handleSuggestedRecipeSelect(recipe) {
    currentlySelectedSingleRecipe = recipe;
    if (createSingleRecipePlanBtn) {
        createSingleRecipePlanBtn.disabled = false;
        // Optionally, visually highlight the selected card if ui.renderSuggestedRecipes doesn't handle it
    }
}

function handleCreateSingleRecipePlan() {
    if (!currentlySelectedSingleRecipe) {
        alert("Bitte wähle zuerst ein Rezept aus den Vorschlägen aus.");
        return;
    }

    const singleDayPlan = [{
        day: "Heute", // Or "Tag 1" or make it dynamic if needed
        options: [currentlySelectedSingleRecipe], // Store the selected recipe as the only option
        selected: currentlySelectedSingleRecipe
    }];

    // Get current portions preference from store, as generatorView portions might not be relevant here
    const portions = store.getPersons() || '2'; // Default to '2' if not set

    store.setWeeklyPlan(singleDayPlan);
    store.setPersons(portions); // Save the portions setting used for this single recipe plan

    currentlySelectedSingleRecipe = null; // Reset selection
    if (createSingleRecipePlanBtn) {
        createSingleRecipePlanBtn.disabled = true; // Disable button after planning
    }

    if (viewCallbacks && typeof viewCallbacks.onSingleRecipePlanCreated === 'function') {
        viewCallbacks.onSingleRecipePlanCreated(); // Notify app.js to switch to dashboard
    } else {
        console.warn("onSingleRecipePlanCreated callback not defined for randomRecipeView");
        // Fallback or default behavior if needed, e.g., alert("Plan erstellt!")
    }
}


export function initRandomRecipeView(allRecipes, callbacks) {
    ALL_RECIPES_DATA = allRecipes;
    viewCallbacks = callbacks || {}; // Store callbacks from app.js

    if (createSingleRecipePlanBtn) {
        createSingleRecipePlanBtn.addEventListener('click', handleCreateSingleRecipePlan);
    }

    // Note: Suggested recipes are rendered in onShowRandomRecipeView to refresh them each time.
    console.log("Random Recipe view initialized");
}

export function onShowRandomRecipeView(callbacks) {
    // Update callbacks if new ones are passed (e.g., if app.js structure changes)
    if (callbacks) {
        viewCallbacks = callbacks;
    }

    // Shuffle ALL_RECIPES_DATA before slicing for suggestions
    const shuffledRecipes = [...ALL_RECIPES_DATA].sort(() => 0.5 - Math.random());
    // Take a different number of suggestions, e.g., 5, or make it configurable
    const suggested = shuffledRecipes.slice(0, 5);

    if (suggestedRecipesContainer) {
        ui.renderSuggestedRecipes(suggested, handleSuggestedRecipeSelect, handleInfoClick);
    }

    if (createSingleRecipePlanBtn) {
        createSingleRecipePlanBtn.disabled = true; // Button should be disabled until a recipe is selected
    }
    currentlySelectedSingleRecipe = null; // Reset any prior selection

    console.log("Random Recipe view shown, suggested recipes rendered.");
}
