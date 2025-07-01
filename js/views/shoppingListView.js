import * as ui from '../ui.js';
import * as store from '../store.js';
import { generateShoppingList } from '../logic.js';

// This set will store the names of items marked as collected.
// It's managed locally within this module for now.
// For persistence, it would need to be saved to localStorage via store.js
let collectedShoppingListItems = new Set();

// DOM Elements
const exportShoppingListBtn = document.getElementById('export-shopping-list-btn');
const shoppingListContainer = document.getElementById('shopping-list-container');

// Variables to be populated by initShoppingListView or onShowShoppingListView
let currentWeeklyPlan = null;
let currentUserPantry = [];
let currentPersons = '2'; // Default, will be updated
let ALL_PANTRY_CATEGORIES = [];

function handleExportShoppingList() {
    const listToExport = generateShoppingList(currentWeeklyPlan, currentUserPantry, parseInt(currentPersons, 10), ALL_PANTRY_CATEGORIES);
    if (!listToExport || listToExport.length === 0) {
        alert("Die Einkaufsliste ist leer. Es gibt nichts zu kopieren.");
        return;
    }

    let listAsText = "Meine Einkaufsliste:\n";
    listToExport.forEach(item => {
        item.unitEntries.forEach(unitEntry => {
            const displayTotalQuantity = Number.isInteger(unitEntry.totalQuantity)
                ? unitEntry.totalQuantity
                : parseFloat(unitEntry.totalQuantity).toFixed(unitEntry.totalQuantity < 1 && unitEntry.totalQuantity > 0 ? 2 : (unitEntry.totalQuantity === 0 ? 0 : 1));
            listAsText += `- ${item.displayName}: ${displayTotalQuantity} ${unitEntry.unit}\n`;
        });
    });

    navigator.clipboard.writeText(listAsText)
        .then(() => {
            if (!exportShoppingListBtn) return;
            const originalButtonText = exportShoppingListBtn.innerHTML;
            exportShoppingListBtn.innerHTML = '<i class="ti ti-check"></i> Kopiert!';
            exportShoppingListBtn.disabled = true;
            setTimeout(() => {
                exportShoppingListBtn.innerHTML = originalButtonText;
                exportShoppingListBtn.disabled = false;
            }, 2000);
        })
        .catch(err => {
            console.error('Fehler beim Kopieren in die Zwischenablage:', err);
            alert('Kopieren fehlgeschlagen. Bitte versuche es manuell oder prüfe die Browser-Berechtigungen.');
        });
}

function handleShoppingListItemToggle(event) {
    if (event.target.classList.contains('shopping-list-item-checkbox')) {
        const card = event.target.closest('.shopping-list-item-card');
        if (!card) return;
        const itemName = card.dataset.ingredientName;
        if (!itemName) return;

        if (event.target.checked) {
            card.classList.add('collected');
            collectedShoppingListItems.add(itemName);
        } else {
            card.classList.remove('collected');
            collectedShoppingListItems.delete(itemName);
        }
        // To persist this: store.setItem('collectedShoppingItems', Array.from(collectedShoppingListItems));
        // And load it in init or onShow.
    }
}

// This function will be used to apply the 'collected' state after ui.renderShoppingList
function applyCollectedStateToDOM() {
    if (!shoppingListContainer) return;
    document.querySelectorAll('#shopping-list-container .shopping-list-item-card').forEach(card => {
        const itemName = card.dataset.ingredientName;
        const checkbox = card.querySelector('.shopping-list-item-checkbox');
        if (checkbox && itemName && collectedShoppingListItems.has(itemName)) {
            checkbox.checked = true;
            card.classList.add('collected');
        } else if (checkbox) {
            checkbox.checked = false;
            card.classList.remove('collected');
        }
    });
}

export function initShoppingListView(pantryCategories) {
    ALL_PANTRY_CATEGORIES = pantryCategories;
    // Load collected items if persisted
    // const persistedCollectedItems = store.getItem('collectedShoppingItems');
    // if (persistedCollectedItems && Array.isArray(persistedCollectedItems)) {
    //     collectedShoppingListItems = new Set(persistedCollectedItems);
    // }


    if (exportShoppingListBtn) {
        exportShoppingListBtn.addEventListener('click', handleExportShoppingList);
    }

    if (shoppingListContainer) {
        shoppingListContainer.addEventListener('change', handleShoppingListItemToggle);
    }
    console.log("Shopping List view initialized");
}

export function onShowShoppingListView() {
    currentWeeklyPlan = store.getWeeklyPlan();
    currentUserPantry = store.getUserPantry();
    currentPersons = store.getPersons();

    if (!currentWeeklyPlan) {
        ui.renderShoppingList([]); // Render empty list or "no plan" message
        console.log("Shopping List: No active plan found.");
        return;
    }

    const shoppingList = generateShoppingList(currentWeeklyPlan, currentUserPantry, parseInt(currentPersons, 10), ALL_PANTRY_CATEGORIES);
    ui.renderShoppingList(shoppingList);
    applyCollectedStateToDOM(); // Apply checked states after rendering
    console.log("Shopping List view shown and rendered.");
}
