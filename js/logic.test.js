// Tests for js/logic.js
const { parseIngredientString, generateWeeklyPlan, generateShoppingList, findAlmostCompleteRecipes } = require('./logic.js');

describe('parseIngredientString', () => {
    const testCases = [
        { input: "1 Prise Salz", expected: { originalString: "1 Prise Salz", quantity: 1, unit: "Prise", name: "Salz", normalizedName: "Salz", standardizedUnit: "Prise" } },
        { input: "1 prise Salz", expected: { originalString: "1 prise Salz", quantity: 1, unit: "Prise", name: "Salz", normalizedName: "Salz", standardizedUnit: "Prise" } },
        { input: "500 g Mehl", expected: { originalString: "500 g Mehl", quantity: 500, unit: "g", name: "Mehl", normalizedName: "Mehl", standardizedUnit: "g" } },
        { input: "500g Mehl", expected: { originalString: "500g Mehl", quantity: 500, unit: "g", name: "Mehl", normalizedName: "Mehl", standardizedUnit: "g" } },
        { input: "1 Dose Tomaten", expected: { originalString: "1 Dose Tomaten", quantity: 1, unit: "Dose", name: "Tomaten", normalizedName: "Tomate", standardizedUnit: "Dose" } },
        { input: "Salz", expected: { originalString: "Salz", quantity: 1, unit: "Prise", name: "Salz", normalizedName: "Salz", standardizedUnit: "Prise" } },
        { input: "Pfeffer", expected: { originalString: "Pfeffer", quantity: 1, unit: "Prise", name: "Pfeffer", normalizedName: "Pfeffer", standardizedUnit: "Prise" } },
        { input: "1 Apfel", expected: { originalString: "1 Apfel", quantity: 1, unit: "Stk.", name: "Apfel", normalizedName: "Apfel", standardizedUnit: "Stk." } },
        { input: "2 Äpfel", expected: { originalString: "2 Äpfel", quantity: 2, unit: "Stk.", name: "Äpfel", normalizedName: "Äpfel", standardizedUnit: "Stk." } },
        { input: "Eier (Größe M)", expected: { originalString: "Eier (Größe M)", quantity: 1, unit: "", name: "Eier (Größe M)", normalizedName: "Ei", standardizedUnit: "" } }, // No numPart, unit is empty. Name includes details.
        { input: "1 EL Öl", expected: { originalString: "1 EL Öl", quantity: 1, unit: "EL", name: "Öl", normalizedName: "Öl", standardizedUnit: "EL" } },
        { input: "2 TL Honig", expected: { originalString: "2 TL Honig", quantity: 2, unit: "TL", name: "Honig", normalizedName: "Honig", standardizedUnit: "TL" } },
        { input: "1 Pck. Vanillezucker", expected: { originalString: "1 Pck. Vanillezucker", quantity: 1, unit: "Pck.", name: "Vanillezucker", normalizedName: "Vanillezucker", standardizedUnit: "Pck." } },
        { input: "1 Bund Petersilie", expected: { originalString: "1 Bund Petersilie", quantity: 1, unit: "Bund", name: "Petersilie", normalizedName: "Petersilie", standardizedUnit: "Bund" } },
        { input: "1kg Kartoffeln", expected: { originalString: "1kg Kartoffeln", quantity: 1, unit: "kg", name: "Kartoffeln", normalizedName: "Kartoffel", standardizedUnit: "kg" } },
        { input: "0.5 L Milch", expected: { originalString: "0.5 L Milch", quantity: 0.5, unit: "l", name: "Milch", normalizedName: "Milch", standardizedUnit: "l" } }, // Standardized to lowercase 'l'
        { input: "0,5 L Milch", expected: { originalString: "0,5 L Milch", quantity: 0.5, unit: "l", name: "Milch", normalizedName: "Milch", standardizedUnit: "l" } }, // Comma as decimal, standardized to lowercase 'l'
        { input: "1 Zehe Knoblauch", expected: { originalString: "1 Zehe Knoblauch", quantity: 1, unit: "Zehe", name: "Knoblauch", normalizedName: "Knoblauch", standardizedUnit: "Zehe" } }, // Standardized to singular "Zehe"
        { input: "2 Zehen Knoblauch", expected: { originalString: "2 Zehen Knoblauch", quantity: 2, unit: "Zehe", name: "Knoblauch", normalizedName: "Knoblauch", standardizedUnit: "Zehe" } }, // Standardized to singular "Zehe"
        { input: "1 Knolle Ingwer", expected: { originalString: "1 Knolle Ingwer", quantity: 1, unit: "Knolle", name: "Ingwer", normalizedName: "Ingwer", standardizedUnit: "Knolle" } },
        { input: "Mehl", expected: { originalString: "Mehl", quantity: 1, unit: "", name: "Mehl", normalizedName: "Mehl", standardizedUnit: "" } }, // MODIFIED: No longer Stk.
        { input: "Zucker", expected: { originalString: "Zucker", quantity: 1, unit: "", name: "Zucker", normalizedName: "Zucker", standardizedUnit: "" } }, // ADDED: Test for Zucker specifically
        { input: " Prise Salz ", expected: { originalString: " Prise Salz ", quantity: 1, unit: "Prise", name: "Salz", normalizedName: "Salz", standardizedUnit: "Prise" } }, // originalString keeps spaces
        { input: "1Stück Kuchen", expected: { originalString: "1Stück Kuchen", quantity: 1, unit: "Stk.", name: "Kuchen", normalizedName: "Kuchen", standardizedUnit: "Stk." } },
        { input: "1 Packung Milch", expected: { originalString: "1 Packung Milch", quantity: 1, unit: "Pck.", name: "Milch", normalizedName: "Milch", standardizedUnit: "Pck." } },
        { input: "1 Glas Oliven", expected: { originalString: "1 Glas Oliven", quantity: 1, unit: "Glas", name: "Oliven", normalizedName: "Oliven", standardizedUnit: "Glas" } },
        { input: "Bd. Schnittlauch", expected: { originalString: "Bd. Schnittlauch", quantity: 1, unit: "Bund", name: "Schnittlauch", normalizedName: "Schnittlauch", standardizedUnit: "Bund" } },
        { input: "Pck Hefe", expected: { originalString: "Pck Hefe", quantity: 1, unit: "Pck.", name: "Hefe", normalizedName: "Hefe", standardizedUnit: "Pck." } },
        { input: "  1   EL   Zucker  ", expected: { originalString: "  1   EL   Zucker  ", quantity: 1, unit: "EL", name: "Zucker", normalizedName: "Zucker", standardizedUnit: "EL" } },
        { input: "1 ml Wasser", expected: { originalString: "1 ml Wasser", quantity: 1, unit: "ml", name: "Wasser", normalizedName: "Wasser", standardizedUnit: "ml" } },
        { input: "liter milch", expected: { originalString: "liter milch", quantity: 1, unit: "l", name: "milch", normalizedName: "Milch", standardizedUnit: "l" } },
        { input: "prise zucker", expected: { originalString: "prise zucker", quantity: 1, unit: "Prise", name: "zucker", normalizedName: "Zucker", standardizedUnit: "Prise" } },

        // Edge cases
        { input: "", expected: { originalString: "", quantity: 1, unit: "", name: "", normalizedName: "", standardizedUnit: "" } }, // MODIFIED: No longer Stk.
        { input: "  ", expected: { originalString: "  ", quantity: 1, unit: "", name: "", normalizedName: "", standardizedUnit: "" } }, // MODIFIED: No longer Stk., originalString keeps spaces
        { input: "123", expected: { originalString: "123", quantity: 123, unit: "Stk.", name: "", normalizedName: "", standardizedUnit: "Stk." } }, // Corrected: Should be Stk.
        { input: "g", expected: { originalString: "g", quantity: 1, unit: "g", name: "g", normalizedName: "G", standardizedUnit: "g" } }, // Only unit, name becomes the unit itself

        // More complex names
        { input: "1 rote Zwiebel", expected: { originalString: "1 rote Zwiebel", quantity: 1, unit: "Stk.", name: "rote Zwiebel", normalizedName: "Zwiebel", standardizedUnit: "Stk." } },
        { input: "2 EL gehackte Mandeln", expected: { originalString: "2 EL gehackte Mandeln", quantity: 2, unit: "EL", name: "gehackte Mandeln", normalizedName: "Gehackte mandeln", standardizedUnit: "EL" } }, // Normalized name might be "Mandeln" depending on synonym logic
        { input: "1 Dose gehackte Tomaten (400g)", expected: { originalString: "1 Dose gehackte Tomaten (400g)", quantity: 1, unit: "Dose", name: "gehackte Tomaten (400g)", normalizedName: "Tomaten (Dose)", standardizedUnit: "Dose" } },
        { input: "Frische Hefe", expected: { originalString: "Frische Hefe", quantity: 1, unit: "", name: "Frische Hefe", normalizedName: "Frische hefe", standardizedUnit: "" } }, // MODIFIED: No longer Stk.
        { input: "Salz und Pfeffer", expected: { originalString: "Salz und Pfeffer", quantity: 1, unit: "Prise", name: "Salz und Pfeffer", normalizedName: "Salz", standardizedUnit: "Prise" } }, // Normalized to first known "Salz", gets Prise
    ];

    testCases.forEach(tc => {
        test(`should correctly parse "${tc.input}" to ${JSON.stringify(tc.expected)}`, () => {
            const result = parseIngredientString(tc.input);
            // Match only the properties defined in tc.expected to avoid issues with extra properties
            // However, for this fix, we *want* to ensure all properties are as expected.
            expect(result).toEqual(tc.expected);
        });
    });

    // Specific test for "Salz und Pfeffer" which might be tricky
    test('should parse "Salz und Pfeffer" and prioritize "Salz" for Prise', () => {
        expect(parseIngredientString("Salz und Pfeffer")).toEqual({
            originalString: "Salz und Pfeffer",
            quantity: 1,
            unit: "Prise",
            name: "Salz und Pfeffer",
            normalizedName: "Salz", // Normalized to the first recognized component "Salz"
            standardizedUnit: "Prise" // "Salz" gets "Prise"
        });
    });

     test('should parse "1 Liter Wasser" correctly', () => {
        expect(parseIngredientString("1 Liter Wasser")).toEqual({
            originalString: "1 Liter Wasser",
            quantity: 1,
            unit: "l", // Standardized from "Liter"
            name: "Wasser",
            normalizedName: "Wasser",
            standardizedUnit: "l"
        });
    });

    test('should parse "1 Gramm Zucker" correctly', () => {
        expect(parseIngredientString("1 Gramm Zucker")).toEqual({
            originalString: "1 Gramm Zucker",
            quantity: 1,
            unit: "g", // Standardized from "Gramm"
            name: "Zucker",
            normalizedName: "Zucker",
            standardizedUnit: "g"
        });
    });
});

describe('generateWeeklyPlan', () => {
    const mockRecipes = [
        { id: "1", title: "Vegan Delight", tags: ["Vegan", "schnell"], estimatedCostPerServing: 2.5 },
        { id: "2", title: "Veggie Feast", tags: ["Vegetarisch", "für gäste"], estimatedCostPerServing: 3.0 },
        { id: "3", title: "Meat Lover", tags: [], estimatedCostPerServing: 5.0 },
        { id: "4", title: "Quick Chicken", tags: ["schnell"], estimatedCostPerServing: 4.0 },
        { id: "5", title: "Budget Pasta", tags: [], estimatedCostPerServing: 1.5 },
        { id: "6", title: "Asian Fusion", tags: ["Asiatisch", "Vegan"], estimatedCostPerServing: 3.5 },
        { id: "7", title: "Mediterranean Salad", tags: ["Mediterran", "Vegetarisch", "schnell"], estimatedCostPerServing: 2.0 },
        { id: "8", title: "Hearty Stew", tags: ["Deftig / Hausmannskost", "resteverwertung"], estimatedCostPerServing: 4.5 },
        { id: "9", title: "Light Fish", tags: ["Leicht & Gesund"], estimatedCostPerServing: 5.5 },
        { id: "10", title: "Spicy Tofu", tags: ["Vegan", "Asiatisch"], estimatedCostPerServing: 3.0 },
        { id: "11", title: "Simple Soup", tags: ["Vegetarisch", "schnell", "resteverwertung"], estimatedCostPerServing: 1.0 },
        { id: "12", title: "Grandma's Pie", tags: ["Deftig / Hausmannskost", "für gäste"], estimatedCostPerServing: 5.0 },
        { id: "13", title: "Another Vegan", tags: ["Vegan"], estimatedCostPerServing: 2.8 },
        { id: "14", title: "Another Veggie", tags: ["Vegetarisch"], estimatedCostPerServing: 2.2 },
        { id: "15", title: "Generic Recipe 1", tags: [], estimatedCostPerServing: 3.0 },
        { id: "16", title: "Generic Recipe 2", tags: [], estimatedCostPerServing: 3.0 },
    ];

    // console.warn is globally mocked in jest.setup.js
    // Individual tests can still check for calls using expect(console.warn).toHaveBeenCalled...

    test('should return a 7-day plan if enough recipes are available', () => {
        const prefs = { isVegan: false, isVegetarian: false, budget: null, isQuick: false, isGuestFriendly: false, isForLeftovers: false, cuisine: 'all' };
        const plan = generateWeeklyPlan(mockRecipes, prefs);
        expect(plan.length).toBe(7); // Needs at least 14 recipes
        plan.forEach(day => {
            expect(day.options.length).toBe(2);
            expect(day.selected).toBeNull();
        });
    });

    test('should filter by vegan preference', () => {
        const prefs = { isVegan: true };
        const plan = generateWeeklyPlan(mockRecipes, prefs); // Vegan recipes: 1, 6, 10, 13 (4 recipes)
        // Needs 2 recipes for 1 day, 4 for 2 days.
        expect(plan.length).toBe(Math.floor(mockRecipes.filter(r => r.tags.includes("Vegan")).length / 2)); // 4 vegan recipes -> 2 days
        plan.forEach(day => {
            day.options.forEach(recipe => expect(recipe.tags).toContain('Vegan'));
        });
    });

    test('should filter by vegetarian preference (includes vegan)', () => {
        const prefs = { isVegetarian: true }; // Vegan is a subset of vegetarian in current data/logic
        const plan = generateWeeklyPlan(mockRecipes, prefs);
        const vegetarianCount = mockRecipes.filter(r => r.tags.includes("Vegetarisch") || r.tags.includes("Vegan")).length;
        expect(plan.length).toBe(Math.floor(vegetarianCount / 2));
        plan.forEach(day => {
            day.options.forEach(recipe => expect(recipe.tags.includes('Vegetarisch') || recipe.tags.includes('Vegan')).toBe(true));
        });
    });

    test('should filter by budget', () => {
        // Warns if no recipes have estimatedCostPerServing, but our mock data does.
        const prefs = { budget: 2.0 }; // Recipes: 5, 7, 11 (3 recipes)
        const plan = generateWeeklyPlan(mockRecipes, prefs);
        const budgetCount = mockRecipes.filter(r => r.estimatedCostPerServing <= 2.0).length;
        expect(plan.length).toBe(Math.floor(budgetCount / 2)); // 3 recipes -> 1 day
        plan.forEach(day => {
            day.options.forEach(recipe => expect(recipe.estimatedCostPerServing).toBeLessThanOrEqual(2.0));
        });
    });

    test('should filter by "schnell" (quick) tag', () => {
        const prefs = { isQuick: true };
        const plan = generateWeeklyPlan(mockRecipes, prefs);
        const quickCount = mockRecipes.filter(r => r.tags.includes("schnell")).length;
        expect(plan.length).toBe(Math.floor(quickCount / 2));
        plan.forEach(day => {
            day.options.forEach(recipe => expect(recipe.tags).toContain('schnell'));
        });
    });

    test('should filter by cuisine style', () => {
        const prefs = { cuisine: "Asiatisch" };
        const plan = generateWeeklyPlan(mockRecipes, prefs); // Recipes 6, 10
        const cuisineCount = mockRecipes.filter(r => r.tags.includes("Asiatisch")).length;
        expect(plan.length).toBe(Math.floor(cuisineCount / 2)); // 2 recipes -> 1 day
        plan.forEach(day => {
            day.options.forEach(recipe => expect(recipe.tags).toContain('Asiatisch'));
        });
    });

    test('should return an empty array if fewer than 2 matching recipes found', () => {
        const prefs = { budget: 0.5 }; // No recipes this cheap
        const plan = generateWeeklyPlan(mockRecipes, prefs);
        expect(plan).toEqual([]);
        expect(console.warn).toHaveBeenCalledWith("Konnte keinen Plan erstellen: weniger als 2 passende Rezepte nach Filterung gefunden. Überprüfen Sie die Filtereinstellungen und die Rezeptdaten.");
    });

    test('should return a shorter plan if not enough recipes for 7 days', () => {
        const fewRecipes = mockRecipes.slice(0, 5); // 5 recipes
        const prefs = {};
        const plan = generateWeeklyPlan(fewRecipes, prefs);
        expect(plan.length).toBe(Math.floor(5/2)); // Should be 2 days
    });

    test('should handle undefined tags array in recipes gracefully', () => {
        const recipesWithMissingTags = [
            { id: "1", title: "No Tags Recipe 1", estimatedCostPerServing: 3.0 },
            { id: "2", title: "No Tags Recipe 2", estimatedCostPerServing: 3.0 },
            { id: "3", title: "Vegan With Tags", tags: ["Vegan"], estimatedCostPerServing: 3.0 },
            { id: "4", title: "Vegan With Tags 2", tags: ["Vegan"], estimatedCostPerServing: 3.0 },
        ];
        const prefs = { isVegan: true };
        const plan = generateWeeklyPlan(recipesWithMissingTags, prefs);
        expect(plan.length).toBe(1); // Only 2 vegan recipes with tags
        plan.forEach(day => {
            day.options.forEach(recipe => expect(recipe.tags).toContain('Vegan'));
        });
    });

    test('should warn if budget filtering is on but no recipes have cost', () => {
        const recipesWithoutCost = [
            { id: "1", title: "Recipe A", tags: ["Vegan"] },
            { id: "2", title: "Recipe B", tags: ["Vegetarisch"] },
            { id: "3", title: "Recipe C", tags: [] },
            { id: "4", title: "Recipe D", tags: [] },
        ];
        const prefs = { budget: 5.0 };
        generateWeeklyPlan(recipesWithoutCost, prefs);
        expect(console.warn).toHaveBeenCalledWith("Budget filtering is enabled, but recipes in data/recipes.json do not have 'estimatedCostPerServing'. This filter may not work correctly.");
    });
});

describe('generateShoppingList', () => {
    const mockPantryCategories = [
        { name: "Obst & Gemüse", items: [{id: "zwiebel", name: "Zwiebel"}, {id: "tomate", name: "Tomate"}, {id: "apfel", name: "Apfel"}] },
        { name: "Milchprodukte", items: [{id: "milch", name: "Milch"}, {id: "käse", name: "Käse"}] },
        { name: "Sonstiges", items: [{id: "salz", name: "Salz"}, {id: "mehl", name: "Mehl"}] }
    ];

    const mockPlan = [
        {
            day: "Montag",
            selected: {
                id: "r1", title: "Spaghetti Aglio e Olio", portions: "für 2 Portionen",
                ingredients: ["200g Spaghetti", "4 Zehen Knoblauch", "1 Prise Chiliflocken", "50ml Olivenöl", "Salz"]
            },
            options: []
        },
        {
            day: "Dienstag",
            selected: {
                id: "r2", title: "Tomatensuppe", portions: "für 4 Portionen",
                ingredients: ["1 Dose gehackte Tomaten (400g)", "1 Zwiebel", "500ml Gemüsebrühe", "Salz", "Pfeffer"]
            },
            options: []
        }
    ];

    test('should correctly aggregate ingredients and adjust for persons', () => {
        const userPantry = [];
        const persons = 2; // Recipe 1 is for 2, Recipe 2 is for 4.
                           // If user wants for 2: R1 qty should be same, R2 qty should be halved.

        const list = generateShoppingList(mockPlan, userPantry, persons, mockPantryCategories);
        // Example: Zwiebel from Tomatensuppe (recipe for 4, user wants 2 -> 0.5 Zwiebel)
        const zwiebel = list.find(cat => cat.categoryName === "Obst & Gemüse").items.find(item => item.parsedName === "Zwiebel");
        expect(zwiebel.quantity).toBe(0.5); // 1 Zwiebel for 4p / 4 * 2 = 0.5

        // Example: Salz (1 Prise from R1 for 2p, 1 Prise from R2 for 4p)
        // R1: 1 Prise / 2p * 2p = 1 Prise
        // R2: 1 Prise / 4p * 2p = 0.5 Prise
        // Total: 1.5 Prisen
        const salz = list.find(cat => cat.categoryName === "Sonstiges").items.find(item => item.parsedName === "Salz");
        expect(salz.quantity).toBe(1.5);
        expect(salz.combined).toBe(true);
    });

    test('should correctly identify items already in pantry', () => {
        const userPantry = [{ itemId: "zwiebel", name: "Zwiebel", quantity: 2, unit: "Stk." }];
        const persons = 1;
        const list = generateShoppingList(mockPlan, userPantry, persons, mockPantryCategories);

        const zwiebel = list.find(cat => cat.categoryName === "Obst & Gemüse").items.find(item => item.parsedName === "Zwiebel");
        expect(zwiebel.haveAtHome).toBe(true);

        const spaghetti = list.find(cat => cat.categoryName === "Sonstiges").items.find(item => item.parsedName === "Spaghetti"); // Assuming Spaghetti falls into Sonstiges
        expect(spaghetti.haveAtHome).toBe(false);
    });

    test('should return an empty list if plan is null or empty', () => {
        expect(generateShoppingList(null, [], 1, mockPantryCategories)).toEqual([]);
        expect(generateShoppingList([], [], 1, mockPantryCategories)).toEqual([]);
    });

    test('should handle recipes with no selected dish for a day', () => {
        const planWithUnselected = [
            { day: "Montag", selected: null, options: [] },
            mockPlan[1] // Tomatensuppe
        ];
        const list = generateShoppingList(planWithUnselected, [], 1, mockPantryCategories);
        // Should only contain ingredients from Tomatensuppe
        expect(list.find(cat => cat.items.some(item => item.parsedName === "Spaghetti"))).toBeUndefined();
        expect(list.find(cat => cat.items.some(item => item.parsedName === "Zwiebel"))).toBeDefined();
    });

    test('should categorize items correctly, with "Sonstiges" as default', () => {
        const planForCategorization = [{
            day: "Mittwoch",
            selected: {
                id: "r3", title: "Exotic Dish", portions: "für 1 Portion",
                ingredients: ["1 Apfel", "100g UnbekanntesPulver", "1 Prise MagischesGewürz"]
            },
            options: []
        }];
        const list = generateShoppingList(planForCategorization, [], 1, mockPantryCategories);

        const obstGemuese = list.find(c => c.categoryName === "Obst & Gemüse");
        expect(obstGemuese.items.some(i => i.parsedName === "Apfel")).toBe(true);

        const sonstiges = list.find(c => c.categoryName === "Sonstiges");
        expect(sonstiges.items.some(i => i.parsedName === "UnbekanntesPulver")).toBe(true);
        expect(sonstiges.items.some(i => i.parsedName === "MagischesGewürz")).toBe(true);
    });

    test('should correctly scale quantities when recipe portions are "1"', () => {
        const singlePortionPlan = [{
            day: "Donnerstag", selected: {
                id: "r4", title: "Single Snack", portions: "für 1 Portion",
                ingredients: ["2 Kekse", "100ml Milch"]
            }, options: []
        }];
        const persons = 3;
        const list = generateShoppingList(singlePortionPlan, [], persons, mockPantryCategories);

        const kekse = list.find(cat => cat.items.find(item => item.parsedName === "Kekse")).items.find(item => item.parsedName === "Kekse");
        expect(kekse.quantity).toBe(6); // 2 Kekse/1p * 3p = 6 Kekse

        const milch = list.find(cat => cat.categoryName === "Milchprodukte").items.find(item => item.parsedName === "Milch");
        expect(milch.quantity).toBe(300); // 100ml/1p * 3p = 300ml
    });

    test('should handle recipe portions not specified or invalid, defaulting to 1', () => {
        const planNoPortions = [{
            day: "Freitag", selected: {
                id: "r5", title: "Mysterious Meal", /* portions missing */
                ingredients: ["1 Mysterium"]
            }, options: []
        }, {
            day: "Samstag", selected: {
                id: "r6", title: "Zero Portions", portions: "für 0 Personen", // Invalid
                ingredients: ["1 Nichts"]
            }, options: []
        }];
        const persons = 2;
        const list = generateShoppingList(planNoPortions, [], persons, mockPantryCategories);

        const mysterium = list.find(cat => cat.items.find(item => item.parsedName === "Mysterium")).items.find(item => item.parsedName === "Mysterium");
        expect(mysterium.quantity).toBe(2); // 1 Mysterium / 1p (default) * 2p = 2

        const nichts = list.find(cat => cat.items.find(item => item.parsedName === "Nichts")).items.find(item => item.parsedName === "Nichts");
        expect(nichts.quantity).toBe(2); // 1 Nichts / 1p (default for invalid) * 2p = 2
    });
});

describe('findAlmostCompleteRecipes', () => {
    const mockAllRecipes = [
        { id: "R1", title: "Pasta Carbonara", ingredients: ["100g Spaghetti", "50g Pancetta", "1 Ei", "Parmesan"] },
        { id: "R2", title: "Omelette", ingredients: ["2 Eier", "Salz", "Pfeffer", "Butter"] },
        { id: "R3", title: "Salad Nicoise", ingredients: ["Salat", "Thunfisch", "Ei", "Oliven", "Tomaten"] },
        { id: "R4", title: "Pancakes", ingredients: ["Mehl", "Milch", "Ei", "Zucker", "Butter"] },
        { id: "R5", title: "No ingredients recipe", ingredients: []}
    ];

    // console.warn is globally mocked in jest.setup.js

    test('should return empty array if user pantry is empty or null', () => {
        expect(findAlmostCompleteRecipes(mockAllRecipes, [])).toEqual([]);
        expect(findAlmostCompleteRecipes(mockAllRecipes, null)).toEqual([]);
    });

    test('should find recipes where most ingredients are present', () => {
        const userPantry = [
            { name: "Ei", quantity: 6, unit: "Stk." },
            { name: "Salz", quantity: 1, unit: "Pck." },
            { name: "Pfeffer", quantity: 1, unit: "Pck." },
            { name: "Butter", quantity: 1, unit: "Stk." },
            { name: "Mehl", quantity: 1, unit: "kg" },
        ];
        // Omelette: Eier, Salz, Pfeffer, Butter (4/4 = 100%)
        // Pancakes: Mehl, Ei, Butter (missing Milch, Zucker) (3/5 = 60%)
        // Carbonara: Ei (missing Spaghetti, Pancetta, Parmesan) (1/4 = 25%) -> below threshold
        const results = findAlmostCompleteRecipes(mockAllRecipes, userPantry, 0.55);
        expect(results.length).toBe(2);
        expect(results[0].id).toBe("R2"); // Omelette (100%)
        expect(results[0].matchPercentage).toBe(1);
        expect(results[0].missingIngredients).toEqual([]);

        expect(results[1].id).toBe("R4"); // Pancakes (60%)
        expect(results[1].matchPercentage).toBe(0.6);
        expect(results[1].missingIngredients).toEqual(["Milch", "Zucker"]); // Order might vary
    });

    test('should respect the matching threshold', () => {
        const userPantry = [{ name: "Ei", quantity: 2, unit: "Stk." }]; // Only "Ei"
        // R1 (Carbonara): 1/4 = 0.25
        // R2 (Omelette): 1/4 = 0.25
        // R3 (Salad): 1/5 = 0.20
        // R4 (Pancakes): 1/5 = 0.20
        let results = findAlmostCompleteRecipes(mockAllRecipes, userPantry, 0.5); // Threshold 50%
        expect(results.length).toBe(0);

        results = findAlmostCompleteRecipes(mockAllRecipes, userPantry, 0.20); // Threshold 20%
        expect(results.length).toBe(4); // All recipes with 'Ei' should now appear
    });

    test('should sort results by matchPercentage (desc) then by missingIngredients.length (asc)', () => {
        const userPantry = [
            { name: "Ei", quantity: 1 }, { name: "Butter", quantity: 1 }, { name: "Salz", quantity: 1 }
        ];
        const slightlyMoreRecipes = [
            ...mockAllRecipes,
            { id: "R6", title: "Scrambled Eggs", ingredients: ["2 Eier", "Butter", "Salz"] }, // 3/3 = 100%
            { id: "R7", title: "Fried Egg", ingredients: ["1 Ei", "Butter"] } // 2/2 = 100%
        ];
        // R6: 3/3 = 100%, 0 missing
        // R7: 2/2 = 100%, 0 missing
        // R2 (Omelette): Ei, Salz, Butter (missing Pfeffer) - 3/4 = 75%
        const results = findAlmostCompleteRecipes(slightlyMoreRecipes, userPantry, 0.70);
        expect(results.length).toBe(3);
        expect(results[0].matchPercentage).toBe(1); // R6 or R7
        expect(results[1].matchPercentage).toBe(1); // R6 or R7
        // Check that the ones with 100% match (0 missing) come before 75% match
        expect(results[0].missingIngredients.length).toBe(0);
        expect(results[1].missingIngredients.length).toBe(0);
        expect(results[2].id).toBe("R2"); // Omelette
        expect(results[2].matchPercentage).toBe(0.75);
        expect(results[2].missingIngredients.length).toBe(1);
    });

    test('should handle recipes with no ingredients (matchPercentage 0)', () => {
        const userPantry = [{ name: "Mehl", quantity: 1 }];
        const results = findAlmostCompleteRecipes(mockAllRecipes, userPantry, 0.0); // Threshold 0
        const noIngRecipe = results.find(r => r.id === "R5");
        expect(noIngRecipe.matchPercentage).toBe(0);
        expect(noIngRecipe.missingIngredients).toEqual([]);
    });

    test('should provide missing ingredients correctly', () => {
        const userPantry = [{ name: "Spaghetti", quantity: 1 }, { name: "Parmesan", quantity: 1 }];
        // R1: Has Spaghetti, Parmesan. Missing Pancetta, Ei.
        const results = findAlmostCompleteRecipes(mockAllRecipes, userPantry, 0.4); // 2/4 = 50%
        const carbonara = results.find(r => r.id === "R1");
        expect(carbonara).toBeDefined();
    // The missingIngredients array stores the original strings from the recipe
    expect(carbonara.missingIngredients).toContain("50g Pancetta");
        expect(carbonara.missingIngredients).toContain("1 Ei"); //Original string
        expect(carbonara.missingIngredients.length).toBe(2);
    });

    test('ingredient matching should be case-insensitive and trim spaces', () => {
        const userPantry = [{ name: "  eI  ", quantity: 1 }]; // Spaced and mixed case
        const results = findAlmostCompleteRecipes(mockAllRecipes, userPantry, 0.1);
        // All recipes containing "Ei" in their ingredients list should be found
        const recipesWithEgg = mockAllRecipes.filter(r => r.ingredients.some(i => i.toLowerCase().includes("ei")));
        expect(results.length).toBe(recipesWithEgg.length);
    });
});

// Future: Add tests for generateWeeklyPlan with more complex filter combinations
// Future: Add tests for generateShoppingList with more complex pantry/recipe interactions
// Future: Add tests for findAlmostCompleteRecipes with more nuanced ingredient name matching (if logic evolves)
