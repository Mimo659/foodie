import * as ui from '../ui.js';
import * as store from '../store.js';
// import { generateShoppingList } from '../logic.js'; // Might be needed if confirmPlanBtn logic moves here fully

// Variables that might be shared or passed from app.js
let ALL_RECIPES = []; // This will need to be populated from app.js or a shared context
let PANTRY_CATEGORIES = []; // Same as above
let userPantry = []; // Same as above

// Store DOM elements relevant to the dashboard view
const deletePlanBtn = document.getElementById('delete-plan-btn');
const confirmPlanBtn = document.getElementById('confirm-plan-btn');
const createPlanBtn = document.getElementById('create-plan-btn'); // Button on empty dashboard
const weeklyPlanContainerElement = document.getElementById('weekly-plan-container');

function handleInfoClick(recipe) {
    ui.openRecipeModal(recipe);
}

// This function might be simplified or removed if dashboard selections are no longer primary
function handleDashboardRecipeSelect(dayIndex, selectedRecipeId, currentWeeklyPlan) {
    if (!currentWeeklyPlan || !currentWeeklyPlan[dayIndex]) return;

    const day = currentWeeklyPlan[dayIndex];
    const selectedRecipe = day.options.find(option => option.id === selectedRecipeId);

    if (selectedRecipe) {
        day.selected = selectedRecipe;
        store.setWeeklyPlan(currentWeeklyPlan);
        // Re-render dashboard to show selection (if visual feedback is desired here)
        // ui.renderDashboard(currentWeeklyPlan, handleInfoClick, handleDashboardRecipeSelect);
        // For now, renderDashboard is called by app.js after view switch or by initDashboard.
        ui.updateConfirmButtonState(currentWeeklyPlan);
        return currentWeeklyPlan; // Return updated plan
    }
    return currentWeeklyPlan; // Return original plan if no change
}

function handleDeletePlan() {
    if (confirm("Bist du sicher, dass du den aktuellen Wochenplan löschen möchtest?")) {
        store.setWeeklyPlan(null);
        store.removeItem('persons'); // Also clear persons associated with the plan
        ui.renderDashboard(null, handleInfoClick);
        ui.updateConfirmButtonState(null);
        // ensureNavItemsVisibility(); // This function was in app.js, might need to be exposed or handled by app.js
        // For now, the dashboard view itself doesn't control nav item visibility directly.
    }
}

// The actual navigation to shopping list view should be handled by app.js
// This function's role is to prepare the data for the shopping list.
function handleConfirmPlan(currentWeeklyPlan, currentUserPantry, currentPersons, currentPantryCategories) {
    const planPortions = store.getPersons() || '2';
    const personsForList = parseInt(planPortions, 10);

    const shoppingList = generateShoppingList(currentWeeklyPlan, currentUserPantry, personsForList, currentPantryCategories);
    ui.renderShoppingList(shoppingList);
    // The actual view switch and nav update will be done by app.js
    return shoppingList; // Return for app.js to handle
}


export function initDashboard(navigateToGeneratorCb, initialWeeklyPlan, initialUserPantry, allRecipesData, pantryCategoriesData) {
    ALL_RECIPES = allRecipesData;
    PANTRY_CATEGORIES = pantryCategoriesData;
    userPantry = initialUserPantry;
    let weeklyPlan = initialWeeklyPlan;

    ui.renderDashboard(weeklyPlan, handleInfoClick);
    ui.updateConfirmButtonState(weeklyPlan);

    if (deletePlanBtn) {
        deletePlanBtn.addEventListener('click', () => {
            handleDeletePlan();
            weeklyPlan = null; // Update local reference
            // Potentially call a callback to inform app.js that plan is deleted.
        });
    }

    if (confirmPlanBtn) {
        confirmPlanBtn.addEventListener('click', () => {
            // This button should now primarily trigger the shopping list generation
            // and then the app controller would switch to the shopping list view.
            // For now, let's assume it calls a function that app.js will handle for navigation.
            // const shoppingList = handleConfirmPlan(weeklyPlan, userPantry, store.getPersons(), PANTRY_CATEGORIES);
            // The navigation should be handled by app.js based on this action.
            // We need a way for this module to communicate back to app.js or for app.js to handle the event.
            // For now, this event listener will be simplified and app.js will handle the full logic.
        });
    }

    if (createPlanBtn) {
        createPlanBtn.addEventListener('click', () => {
            if (navigateToGeneratorCb && typeof navigateToGeneratorCb === 'function') {
                navigateToGeneratorCb();
            }
        });
    }

    // Event delegation for recipe selection (if still applicable on dashboard)
    // This was complex in app.js. If selection is primarily on generator, this can be simplified/removed.
    // For now, removing the direct event listener here. App.js will manage it or it will be removed.
    /*
    if (weeklyPlanContainerElement) {
        weeklyPlanContainerElement.addEventListener('change', (e) => {
            if (e.target.classList.contains('recipe-select-radio') && e.target.checked) {
                const dayCard = e.target.closest('.day-selection-card');
                if (dayCard) {
                    const dayIndex = parseInt(dayCard.dataset.dayIndex, 10);
                    const selectedRecipeId = e.target.value;
                    weeklyPlan = handleDashboardRecipeSelect(dayIndex, selectedRecipeId, weeklyPlan);
                    // Need to re-render or update UI accordingly.
                    // This might involve calling ui.renderDashboard again or a more targeted update.
                }
            }
        });
    }
    */
    console.log("Dashboard view initialized");
}

// Function to be called when the dashboard view is shown
export function onShowDashboardView() {
    let currentWeeklyPlan = store.getWeeklyPlan();
    userPantry = store.getUserPantry(); // Refresh pantry in case it changed

    ui.renderDashboard(currentWeeklyPlan, handleInfoClick);
    ui.updateConfirmButtonState(currentWeeklyPlan);
    console.log("Dashboard view shown, re-rendered with current plan.");
}
