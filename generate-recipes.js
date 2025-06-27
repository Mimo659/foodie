// Dieses Skript wird mit Node.js ausgeführt, um die statische Rezept-JSON zu erstellen.
// Ausführung im Terminal: node generate-recipes.js

const fs = require('fs');
const path = require('path');

const recipeGenerator = (() => {
    const bases = [{n:'Nudeln', u:'g', c:0.8}, {n:'Reis', u:'g', c:0.7}, {n:'Kartoffeln', u:'g', c:0.5}, {n:'Brot', u:'Scheiben', c:0.9}];
    const proteins = [
        {n:'Hähnchenbrust', u:'g', c:2.5, v:false, vg:false}, {n:'Rinderhack', u:'g', c:3, v:false, vg:false}, 
        {n:'Linsen', u:'g', c:0.9, v:true, vg:true}, {n:'Kichererbsen', u:'g', c:1, v:true, vg:true},
        {n:'Tofu', u:'g', c:1.5, v:true, vg:true}, {n:'Eier', u:'Stück', c:0.8, v:true, vg:false},
        {n:'Halloumi', u:'g', c:2.2, v:true, vg:false}
    ];
    const vegetables = [
        {n:'Tomaten', u:'g', c:0.6}, {n:'Zwiebel', u:'Stück', c:0.2}, {n:'Paprika', u:'Stück', c:0.8},
        {n:'Brokkoli', u:'g', c:1.2}, {n:'Karotten', u:'Stück', c:0.3}, {n:'Spinat', u:'g', c:1.1},
        {n:'Zucchini', u:'Stück', c:0.7}, {n:'Knoblauch', u:'Zehen', c:0.1}
    ];
    const nameTemplates = [
        "{p} mit {b} und {v1}", "{b}-Pfanne mit {p}", "Gebackene {b} mit {v1}-Dip", 
        "{v1}-{v2}-Suppe", "Curry mit {p} und {b}", "{p}-Auflauf mit {v1}"
    ];
    
    const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const generateSingleRecipe = (id) => {
        const p = getRandom(proteins);
        const b = getRandom(bases);
        const v1 = getRandom(vegetables);
        let v2 = getRandom(vegetables);
        while (v1 === v2) v2 = getRandom(vegetables);

        let name = getRandom(nameTemplates).replace('{p}', p.n).replace('{b}', b.n).replace('{v1}', v1.n).replace('{v2}', v2.n);
        const ingredients = [ { name: p.n, quantity: p.u === 'g' ? 150 : 2, unit: p.u }, { name: b.n, quantity: b.u === 'g' ? 120 : 2, unit: b.u }, { name: v1.n, quantity: v1.u === 'g' ? 100 : 1, unit: v1.u }, { name: v2.n, quantity: v2.u === 'g' ? 100 : 1, unit: v2.u }, { name: "Olivenöl", quantity: 2, unit: "EL" } ];
        const cost = (p.c + b.c + v1.c + v2.c) * (0.8 + Math.random() * 0.4);

        return { id: `rezept${id}`, name: name, description: `Ein leckeres und ${Math.random() > 0.5 ? 'schnelles' : 'einfaches'} Gericht. Perfekt für den Alltag.`, ingredients: ingredients, instructions: [`Zutaten vorbereiten.`, `${p.n} und ${b.n} kochen/braten.`, `${v1.n} und ${v2.n} hinzufügen.`, `Abschmecken und servieren.`], estimatedCostPerServing: parseFloat(cost.toFixed(2)), isSimple: Math.random() > 0.2, isVegan: p.vg, isVegetarian: p.v, keywords: [p.n.toLowerCase(), b.n.toLowerCase(), Math.random() > 0.8 ? "resteverwertung" : "klassiker"] };
    };
    return { generateRecipes: (count) => Array.from({ length: count }, (_, i) => generateSingleRecipe(i + 1)) };
})();


console.log("Generiere 500+ Rezepte...");

const generatedRecipes = recipeGenerator.generateRecipes(505);
const manualRecipes = [
    { "id": "rezept_manual1", "name": "Milchreis mit Zimt & Zucker", "description": "Ein süßer Klassiker.", "ingredients": [ { "name": "Milch", "quantity": 500, "unit": "ml" }, { "name": "Milchreis", "quantity": 125, "unit": "g" }, { "name": "Zucker", "quantity": 2, "unit": "EL" }, { "name": "Zimt", "quantity": 1, "unit": "TL" } ], "instructions": ["Milch kochen, Reis einrühren, quellen lassen."], "estimatedCostPerServing": 0.90, "isSimple": true, "isVegan": false, "isVegetarian": true, "keywords": ["süß", "milch"] }
];
const allRecipes = [...manualRecipes, ...generatedRecipes];

const outputPath = path.join(__dirname, 'data', 'recipes.json');

fs.writeFileSync(outputPath, JSON.stringify(allRecipes, null, 2));

console.log(`Erfolgreich ${allRecipes.length} Rezepte generiert und in ${outputPath} gespeichert.`);