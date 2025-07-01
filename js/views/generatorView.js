import * as ui from '../ui.js';
import * as store from '../store.js';
import { generateWeeklyPlan } from '../logic.js';
// import { ALL_RECIPES } from '../app.js'; // Or pass ALL_RECIPES if it's loaded centrally

// Variables that might be shared or passed from app.js or loaded here
let ALL_RECIPES_DATA = []; // Needs to be populated
let currentWeeklyPlan = null; // Specific to the generator's active construction
let currentlySelectedSingleRecipe = null;

// DOM Elements
const generatorForm = document.getElementById('generator-form');
const dailyOptionsDisplayContainer = document.getElementById('daily-options-display-container');
const confirmGeneratedPlanBtn = document.getElementById('confirm-generated-plan-btn');
const createSingleRecipePlanBtn = document.getElementById('create-single-recipe-plan-btn');
const suggestedRecipesContainer = document.getElementById('suggested-recipes-container'); // For event delegation if needed

// Confirmation Modal Elements (These might be better handled by a global modal manager in app.js)
const confirmNewPlanModal = document.getElementById('confirm-new-plan-modal');
const confirmNewPlanYesBtn = document.getElementById('confirm-new-plan-yes');
const confirmNewPlanNoBtn = document.getElementById('confirm-new-plan-no');


function handleInfoClick(recipe) {
    ui.openRecipeModal(recipe);
}

function handleRecipeSelectionInGenerator(dayIndex, selectedRecipeId) {
    if (!currentWeeklyPlan || !currentWeeklyPlan[dayIndex]) return;
    const day = currentWeeklyPlan[dayIndex];
    const selectedRecipe = day.options.find(option => option.id === selectedRecipeId);

    if (selectedRecipe) {
        day.selected = selectedRecipe;
        // No need to store.setItem('weeklyPlan', currentWeeklyPlan) here yet,
        // only when the user confirms the *entire* generated plan.
        ui.renderDailyOptionsInGeneratorView(currentWeeklyPlan, handleInfoClick, handleRecipeSelectionInGenerator);
        ui.updateGeneratorConfirmButtonState(currentWeeklyPlan);
    } else {
        console.error(`Generator: Recipe with ID ${selectedRecipeId} not found for day ${dayIndex}`);
    }
}

function handleGeneratorFormSubmit(event) {
    event.preventDefault();
    const submitButton = event.target.querySelector('button[type="submit"]');
    ui.setButtonLoadingState(submitButton, true);

    setTimeout(() => {
        try {
            // const dietPreferenceElement = document.querySelector('input[name="diet"]:checked');
            // const dietPreference = dietPreferenceElement ? dietPreferenceElement.value : 'all';

            const selectedPortionsElement = document.querySelector('input[name="portions"]:checked');
            const selectedPortions = selectedPortionsElement ? selectedPortionsElement.value : '2';

            const numberOfDaysElement = document.getElementById('number-of-days');
            const numberOfDays = numberOfDaysElement ? parseInt(numberOfDaysElement.value, 10) : 7;

            const selectedTagNodes = document.querySelectorAll('#dynamic-tags-checkboxes input[type="checkbox"]:checked');
            const selectedTags = Array.from(selectedTagNodes).map(node => node.value);

            const prefs = {
                persons: parseInt(selectedPortions, 10),
                // isVegetarian: dietPreference === 'vegetarian',
                // isVegan: dietPreference === 'vegan',
                selectedTags: selectedTags,
                numberOfDays: numberOfDays
            };

            currentWeeklyPlan = generateWeeklyPlan(ALL_RECIPES_DATA, prefs);

            if (!currentWeeklyPlan || currentWeeklyPlan.length === 0) {
                alert("Entschuldigung, mit diesen Filtern konnten wir keinen Plan erstellen. Bitte versuche es mit anderen Kriterien oder weniger Filtern.");
                return;
            }

            // Store the persons setting used for this plan generation attempt
            // This is important if they confirm THIS plan later.
            store.setPersons(prefs.persons.toString());


            ui.renderDailyOptionsInGeneratorView(currentWeeklyPlan, handleInfoClick, handleRecipeSelectionInGenerator);
            if (dailyOptionsDisplayContainer) dailyOptionsDisplayContainer.classList.remove('hidden');
            if (confirmGeneratedPlanBtn) {
                confirmGeneratedPlanBtn.classList.remove('hidden');
                ui.updateGeneratorConfirmButtonState(currentWeeklyPlan); // Should be disabled initially
            }

        } catch (error) {
            console.error("Fehler bei der Plangenerierung:", error);
            alert("Ein unerwarteter Fehler ist bei der Plangenerierung aufgetreten. Bitte versuche es erneut.");
        } finally {
            ui.setButtonLoadingState(submitButton, false);
        }
    }, 0);
}

function handleConfirmGeneratedPlan(callbacks) {
    // This function is called when the user clicks "Auswahl bestätigen und Plan anzeigen"
    if (currentWeeklyPlan && currentWeeklyPlan.every(day => day.selected)) {
        store.setWeeklyPlan(currentWeeklyPlan); // Save the fully selected plan
        // The 'persons' for this plan was already set during generation.

        if (dailyOptionsDisplayContainer) dailyOptionsDisplayContainer.classList.add('hidden');
        if (confirmGeneratedPlanBtn) confirmGeneratedPlanBtn.classList.add('hidden');

        currentWeeklyPlan = null; // Reset for next generation attempt

        if (callbacks && typeof callbacks.onPlanConfirmed === 'function') {
            callbacks.onPlanConfirmed(); // Notify app.js to switch to dashboard
        }
    } else {
        alert("Bitte wähle für jeden Tag ein Rezept aus.");
    }
}

function handleSuggestedRecipeSelect(recipe) {
    currentlySelectedSingleRecipe = recipe;
    if (createSingleRecipePlanBtn) createSingleRecipePlanBtn.disabled = false;
}

function handleCreateSingleRecipePlan(callbacks) {
    if (!currentlySelectedSingleRecipe) {
        alert("Bitte wähle zuerst ein Rezept aus den Vorschlägen aus.");
        return;
    }

    const singleDayPlan = [{
        day: "Tag 1",
        options: [currentlySelectedSingleRecipe],
        selected: currentlySelectedSingleRecipe
    }];

    const selectedPortionsElement = document.querySelector('input[name="portions"]:checked');
    const portions = selectedPortionsElement ? selectedPortionsElement.value : '2';

    store.setWeeklyPlan(singleDayPlan);
    store.setPersons(portions);

    currentlySelectedSingleRecipe = null;
    if (createSingleRecipePlanBtn) createSingleRecipePlanBtn.disabled = true;

    if (callbacks && typeof callbacks.onSingleRecipePlanCreated === 'function') {
        callbacks.onSingleRecipePlanCreated(); // Notify app.js to switch to dashboard
    }
}

// --- Confirmation Modal Logic (specific to generator view) ---
function showConfirmNewPlanModal(onConfirmYes, onConfirmNo) {
    if (confirmNewPlanModal) confirmNewPlanModal.classList.remove('hidden');
    if (confirmNewPlanYesBtn) {
        // Clone and replace to remove old listeners
        const newYesBtn = confirmNewPlanYesBtn.cloneNode(true);
        confirmNewPlanYesBtn.parentNode.replaceChild(newYesBtn, confirmNewPlanYesBtn);
        newYesBtn.addEventListener('click', () => {
            hideConfirmNewPlanModal();
            onConfirmYes();
        });
    }
    if (confirmNewPlanNoBtn) {
         const newNoBtn = confirmNewPlanNoBtn.cloneNode(true);
        confirmNewPlanNoBtn.parentNode.replaceChild(newNoBtn, confirmNewPlanNoBtn);
        newNoBtn.addEventListener('click', () => {
            hideConfirmNewPlanModal();
            if (onConfirmNo) onConfirmNo();
        });
    }
}

function hideConfirmNewPlanModal() {
    if (confirmNewPlanModal) confirmNewPlanModal.classList.add('hidden');
}


export function initGeneratorView(allRecipes, callbacks) {
    ALL_RECIPES_DATA = allRecipes;
    currentWeeklyPlan = null; // Reset any previously generated plan in this view
    currentlySelectedSingleRecipe = null;

    if (generatorForm) {
        generatorForm.addEventListener('submit', handleGeneratorFormSubmit);
    }

    if (dailyOptionsDisplayContainer) {
        dailyOptionsDisplayContainer.addEventListener('change', (e) => {
            if (e.target.classList.contains('recipe-select-radio-generator') && e.target.checked) {
                const dayCard = e.target.closest('.day-selection-card');
                if (dayCard) {
                    const dayIndex = parseInt(dayCard.dataset.dayIndex, 10);
                    const selectedRecipeId = e.target.value;
                    handleRecipeSelectionInGenerator(dayIndex, selectedRecipeId);
                }
            }
        });
    }

    if (confirmGeneratedPlanBtn) {
        confirmGeneratedPlanBtn.addEventListener('click', () => handleConfirmGeneratedPlan(callbacks));
    }

    if (createSingleRecipePlanBtn) {
        createSingleRecipePlanBtn.addEventListener('click', () => handleCreateSingleRecipePlan(callbacks));
    }

    // Initial rendering of suggested recipes when view is initialized (or shown)
    // This part is moved to onShowGeneratorView to ensure it happens every time the view is activated.

    // Modal close on outside click (if not handled globally)
    if (confirmNewPlanModal) {
        confirmNewPlanModal.addEventListener('click', (e) => {
            if (e.target === confirmNewPlanModal) {
                hideConfirmNewPlanModal();
                 if (callbacks && typeof callbacks.onModalCancel === 'function') {
                    callbacks.onModalCancel(); // e.g., to re-enable nav or switch to default view
                }
            }
        });
    }

    console.log("Generator view initialized");
}


export function onShowGeneratorView(callbacks) {
    // Check if an active plan exists. If so, prompt user.
    const existingPlan = store.getWeeklyPlan();
    if (existingPlan && existingPlan.length > 0) {
        showConfirmNewPlanModal(
            () => { // onYes: Clear old plan and proceed
                store.setWeeklyPlan(null);
                store.removeItem('persons');
                if(callbacks && callbacks.onExistingPlanCleared) callbacks.onExistingPlanCleared();
                prepareGeneratorInterface();
            },
            () => { // onNo: User cancels, navigate away or stay (app.js decides)
                if(callbacks && callbacks.onViewChangeRequired) callbacks.onViewChangeRequired('dashboard'); // Suggest going to dashboard
            }
        );
    } else {
        prepareGeneratorInterface();
    }
}

function prepareGeneratorInterface() {
    // Shuffle ALL_RECIPES_DATA before slicing for suggestions
    const shuffledRecipes = [...ALL_RECIPES_DATA].sort(() => 0.5 - Math.random());
    const suggested = shuffledRecipes.slice(0, 3);

    ui.renderSuggestedRecipes(suggested, handleSuggestedRecipeSelect, handleInfoClick);
    if (createSingleRecipePlanBtn) createSingleRecipePlanBtn.disabled = true;
    currentlySelectedSingleRecipe = null;

    // Reset and hide the daily options and confirm button from previous generation
    if (dailyOptionsDisplayContainer) {
        dailyOptionsDisplayContainer.innerHTML = '';
        dailyOptionsDisplayContainer.classList.add('hidden');
    }
    if (confirmGeneratedPlanBtn) {
        confirmGeneratedPlanBtn.classList.add('hidden');
    }
    currentWeeklyPlan = null; // Clear any plan being built

    // Set default portions based on localStorage or default to '2'
    const portionsRadios = document.getElementsByName('portions');
    const currentPortions = store.getPersons(); // getPersons defaults to '2'
    for (const radio of portionsRadios) {
        if (radio.value === currentPortions) {
            radio.checked = true;
            break;
        }
    }
    // If no radio was checked (e.g. invalid value in localStore), default to '2'
    if (!document.querySelector('input[name="portions"]:checked')) {
        const twoPortionsRadio = document.getElementById('portions-2');
        if (twoPortionsRadio) twoPortionsRadio.checked = true;
    }


    console.log("Generator interface prepared.");
}
