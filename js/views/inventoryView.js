import * as ui from '../ui.js';
import *ాలు from '../store.js';
import { findAlmostCompleteRecipes } from '../logic.js';
// PANTRY_CATEGORIES and ALL_RECIPES will be needed. These should be passed in or loaded.
// For now, they will be populated by an init function.

let ALL_RECIPES_DATA = [];
let PANTRY_CATEGORIES_DATA = [];
let allPantryItemsMasterList = []; // Flattened list of all possible pantry items for suggestions

let userPantry = [];
let matchingRecipesFromPantry = []; // Stores recipes found based on pantry
let selectedPantryItemForAdding = null;

// DOM Elements
const pantryItemSearchInput = document.getElementById('pantry-item-search');
const pantryItemSuggestionsContainer = document.getElementById('pantry-item-suggestions');
const pantryItemDetailsDiv = document.getElementById('pantry-item-details');
const pantryItemQuantityInput = document.getElementById('pantry-item-quantity');
const pantryItemUnitInput = document.getElementById('pantry-item-unit');
const pantryItemExpirationInput = document.getElementById('pantry-item-expiration');
const addItemToPantryBtn = document.getElementById('add-item-to-pantry-btn');
const findRecipesFromPantryBtn = document.getElementById('find-recipes-from-pantry-btn');
const currentPantryDisplay = document.getElementById('current-pantry-display');
const emptyPantryMessage = document.getElementById('empty-pantry-message');
const deleteInventoryRecipesBtn = document.getElementById('delete-inventory-recipes-btn');


function handleInfoClick(recipe) {
    ui.openRecipeModal(recipe);
}

function renderPantrySuggestions(searchTerm) {
    if (!pantryItemSuggestionsContainer) return;
    pantryItemSuggestionsContainer.innerHTML = '';
    if (!searchTerm) {
        pantryItemSuggestionsContainer.classList.add('hidden');
        return;
    }

    const filteredItems = allPantryItemsMasterList.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredItems.length > 0) {
        const ul = document.createElement('ul');
        filteredItems.slice(0, 7).forEach(item => { // Show top 7 suggestions
            const li = document.createElement('li');
            li.textContent = `${item.name} (${item.categoryName})`;
            li.addEventListener('click', () => {
                selectedPantryItemForAdding = item;
                if (pantryItemSearchInput) pantryItemSearchInput.value = item.name;
                pantryItemSuggestionsContainer.innerHTML = '';
                pantryItemSuggestionsContainer.classList.add('hidden');
                if (pantryItemDetailsDiv) pantryItemDetailsDiv.classList.remove('hidden');
                if (addItemToPantryBtn) addItemToPantryBtn.classList.remove('hidden');
                if (pantryItemQuantityInput) pantryItemQuantityInput.focus();
            });
            ul.appendChild(li);
        });
        pantryItemSuggestionsContainer.appendChild(ul);
        pantryItemSuggestionsContainer.classList.remove('hidden');
    } else {
        pantryItemSuggestionsContainer.classList.add('hidden');
    }
}

function renderCurrentPantryList() {
    if (!currentPantryDisplay || !emptyPantryMessage) return;

    currentPantryDisplay.innerHTML = '';
    if (userPantry.length === 0) {
        emptyPantryMessage.classList.remove('hidden');
        currentPantryDisplay.classList.add('hidden');
    } else {
        emptyPantryMessage.classList.add('hidden');
        currentPantryDisplay.classList.remove('hidden');
        const ul = document.createElement('ul');
        ul.className = 'current-pantry-list';
        userPantry.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'pantry-list-item';
            let expText = item.expiration ? ` - Haltbar bis: ${new Date(item.expiration).toLocaleDateString('de-DE')}` : '';
            li.innerHTML = `<span>${item.name} (${item.quantity} ${item.unit})${expText}</span>
                            <button class="btn-remove-pantry-item" data-index="${index}"><i class="fa-solid fa-trash-can"></i></button>`;
            ul.appendChild(li);
        });
        currentPantryDisplay.appendChild(ul);

        // Add event listeners for remove buttons
        document.querySelectorAll('.btn-remove-pantry-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const itemIndex = parseInt(e.currentTarget.dataset.index, 10);
                userPantry.splice(itemIndex, 1);
                store.setUserPantry(userPantry);
                renderCurrentPantryList(); // Re-render the list
            });
        });
    }
}

function handleAddItemToPantry() {
    if (!selectedPantryItemForAdding) {
        alert("Bitte wähle zuerst ein Lebensmittel aus der Liste aus.");
        return;
    }
    const quantity = parseFloat(pantryItemQuantityInput.value);
    const unit = pantryItemUnitInput.value.trim();
    const expiration = pantryItemExpirationInput.value;

    if (isNaN(quantity) || quantity <= 0) {
        alert("Bitte gib eine gültige Menge ein.");
        return;
    }
    if (!unit) {
        alert("Bitte gib eine Einheit ein (z.B. Stk, g, L).");
        return;
    }

    const newItem = {
        // Ensure selectedPantryItemForAdding has an id, or use a generated one
        itemId: selectedPantryItemForAdding.id || `custom-${Date.now()}`,
        name: selectedPantryItemForAdding.name,
        quantity: quantity,
        unit: unit,
        expiration: expiration || null
    };

    userPantry.push(newItem);
    store.setUserPantry(userPantry);
    renderCurrentPantryList();

    // Reset input fields
    if (pantryItemSearchInput) pantryItemSearchInput.value = '';
    selectedPantryItemForAdding = null;
    if (pantryItemDetailsDiv) pantryItemDetailsDiv.classList.add('hidden');
    if (addItemToPantryBtn) addItemToPantryBtn.classList.add('hidden');
    if (pantryItemQuantityInput) pantryItemQuantityInput.value = '1';
    if (pantryItemUnitInput) pantryItemUnitInput.value = 'Stk.';
    if (pantryItemExpirationInput) pantryItemExpirationInput.value = '';
    if (pantryItemSearchInput) pantryItemSearchInput.focus();
}

function handleFindRecipesFromPantry() {
    matchingRecipesFromPantry = findAlmostCompleteRecipes(ALL_RECIPES_DATA, userPantry);
    ui.renderInventoryResults(matchingRecipesFromPantry, handleInfoClick);
}

function handleDeleteInventoryRecipes() {
    matchingRecipesFromPantry = [];
    ui.clearInventoryResults();
}


export function initInventoryView(allRecipes, pantryCategories) {
    ALL_RECIPES_DATA = allRecipes;
    PANTRY_CATEGORIES_DATA = pantryCategories;
    allPantryItemsMasterList = PANTRY_CATEGORIES_DATA.flatMap(category =>
        category.items.map(item => ({ ...item, categoryName: category.name }))
    );
    userPantry = store.getUserPantry(); // Load initial pantry

    // Initial UI setup
    renderCurrentPantryList();
    // Initial render of inventory results (likely empty or from previous session if we decide to store it)
    // For now, let's assume matchingRecipesFromPantry is not persisted and starts empty.
    ui.renderInventoryResults(matchingRecipesFromPantry, handleInfoClick);


    if (pantryItemSearchInput) {
        pantryItemSearchInput.addEventListener('input', (e) => {
            renderPantrySuggestions(e.target.value);
            if (!e.target.value) {
                selectedPantryItemForAdding = null;
                if (pantryItemDetailsDiv) pantryItemDetailsDiv.classList.add('hidden');
                if (addItemToPantryBtn) addItemToPantryBtn.classList.add('hidden');
            }
        });

        // Hide suggestions if clicked outside - This should be a global listener in app.js or managed carefully
        // document.addEventListener('click', function(event) { ... });
        // For now, it's omitted here to avoid multiple global listeners. Will be handled in app.js.
    }

    if (addItemToPantryBtn) {
        addItemToPantryBtn.addEventListener('click', handleAddItemToPantry);
    }

    if (findRecipesFromPantryBtn) {
        findRecipesFromPantryBtn.addEventListener('click', handleFindRecipesFromPantry);
    }

    if (deleteInventoryRecipesBtn) {
        deleteInventoryRecipesBtn.addEventListener('click', handleDeleteInventoryRecipes);
    }

    console.log("Inventory view initialized");
}

export function onShowInventoryView() {
    userPantry = store.getUserPantry(); // Ensure pantry is up-to-date
    renderCurrentPantryList();
    // Re-render inventory recipe suggestions based on the current state
    // This ensures if user navigated away and came back, the suggestions are still there (if any)
    // or cleared if they were cleared.
    ui.renderInventoryResults(matchingRecipesFromPantry, handleInfoClick);
    console.log("Inventory view shown.");
}
