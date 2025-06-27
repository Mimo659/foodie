// Version 1500+
// Erstellt eine große und vielfältige Rezeptdatenbank (~1500 Rezepte) mit verschiedenen Attributen und Küchenstilen.
const fs = require('fs');
const path = require('path');

const bases = [ { n: 'Nudeln', t:['mediterranean', 'defty'] }, { n: 'Reis', t:['asian', 'light'] }, { n: 'Kartoffeln', t:['defty'] }, { n: 'Quinoa', t:['light'] }, { n: 'Couscous', t:['mediterranean', 'light'] }, { n: 'Brot', t:['defty', 'mediterranean'] }, { n: 'Gnocchi', t:['mediterranean', 'defty'] }, { n: 'Polenta', t:['mediterranean'] }, { n: 'Bulgur', t:['mediterranean', 'light'] } ];
const proteins = [ { n: 'Hähnchenbrust', v:0, vg:0, t:['light', 'asian'] }, { n: 'Rinderhack', v:0, vg:0, t:['defty'] }, { n: 'Schweinefilet', v:0, vg:0, t:['defty', 'asian'] }, { n: 'Linsen', v:1, vg:1, t:['light', 'defty', 'mediterranean'] }, { n: 'Kichererbsen', v:1, vg:1, t:['light', 'mediterranean'] }, { n: 'Schwarze Bohnen', v:1, vg:1, t:['defty'] }, { n: 'Tofu', v:1, vg:1, t:['asian', 'light'] }, { n: 'Eier', v:1, vg:0, t:['defty', 'light'] }, { n: 'Halloumi', v:1, vg:0, t:['mediterranean'] }, { n: 'Feta', v:1, vg:0, t:['mediterranean'] } ];
const vegetables = [ { n: 'Tomaten', t:['mediterranean'] }, { n: 'Zwiebel', t:['all'] }, { n: 'Paprika', t:['mediterranean', 'defty'] }, { n: 'Brokkoli', t:['light', 'asian'] }, { n: 'Karotten', t:['all'] }, { n: 'Spinat', t:['light', 'mediterranean'] }, { n: 'Zucchini', t:['mediterranean'] }, { n: 'Knoblauch', t:['all'] }, { n: 'Pilze', t:['defty', 'asian'] }, { n: 'Aubergine', t:['mediterranean'] }, { n: 'Gurke', t:['light'] }, { n: 'Mais', t:['defty'] }, { n: 'Frühlingszwiebeln', t:['asian'] }, { n: 'Ingwer', t:['asian'] }, { n: 'Oliven', t:['mediterranean'] }, { n: 'Rotkohl', t:['defty'] } ];
const sauces = [ { n: 'Tomatensauce', t:['mediterranean'] }, { n: 'Sahnesauce', v:1, vg:0, t:['defty'] }, { n: 'Sojasauce', t:['asian'] }, { n: 'Pesto', t:['mediterranean'] }, { n: 'Vinaigrette', t:['light'] }, { n: 'Bratensauce', t:['defty'] } ];
const extras = [ { n: 'geriebenem Käse', v:1, vg:0 }, { n: 'frischen Kräutern', v:1, vg:1 }, { n: 'einem Klecks Joghurt', v:1, vg:0 }, { n: 'gerösteten Kernen', v:1, vg:1 }, { n: 'Röstzwiebeln', v:1, vg:1 } ];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const archetypes = [
    { name: 'Pfanne', t: ['asian', 'mediterranean'], generate: () => {
        const p = getRandom(proteins); const b = getRandom(bases.filter(base => ['Nudeln', 'Reis', 'Quinoa', 'Gnocchi'].includes(base.n))); const v = getRandom(vegetables, 2); const s = getRandom(sauces.filter(sauce => ['Sojasauce', 'Pesto'].includes(sauce.n)));
        return { name: `${p.n}-Pfanne mit ${b.n}`, ingredients: [p,b, ...v, s], cost: 3.5, tags: ['schnell', ...b.t, ...p.t, ...s.t], instructions: [`${b.n} kochen.`,`${p.n} mit ${v[0].n} und ${v[1].n} anbraten.`, `Gekochte ${b.n} und ${s.n} zugeben.`] };
    }},
    { name: 'Auflauf', t: ['defty', 'mediterranean'], generate: () => {
        const p = getRandom(proteins); const b = getRandom(bases.filter(base => ['Kartoffeln', 'Nudeln', 'Gnocchi'].includes(base.n))); const v = getRandom(vegetables); const s = getRandom(sauces.filter(sauce => ['Tomatensauce', 'Sahnesauce'].includes(sauce.n)));
        return { name: `${b.n}-Auflauf mit ${p.n}`, ingredients: [p, b, v, s, extras[0]], cost: 4, tags: ['für gäste', ...b.t, ...p.t, ...s.t], instructions: [`Zutaten mischen und in eine Form geben.`, `Mit ${s.n} übergießen und Käse bestreuen.`, `Bei 180°C ca. 30 Min backen.`] };
    }},
    { name: 'Eintopf', t: ['defty', 'light'], generate: () => {
        const p = getRandom(proteins.filter(pr => pr.n !== 'Halloumi')); const v = getUniqueRandom(vegetables.filter(veg => veg.n !== 'Gurke'), 3); const b = getRandom([bases[2], bases[8]]); const e = extras[1];
        return { name: `${p.n}-Eintopf mit ${v[0].n}`, ingredients: [p, ...v, b, e], cost: 3, tags: ['günstig', 'resteverwertung', ...p.t], instructions: [`${p.n} & Gemüse anbraten.`, `Mit Wasser/Brühe aufgießen und köcheln.`, `Mit ${e.n} servieren.`] };
    }},
    { name: 'Salat', t: ['light', 'mediterranean'], generate: () => {
        const p = getRandom(proteins.filter(pr => ['Hähnchenbrust', 'Feta', 'Halloumi', 'Tofu', 'Kichererbsen'].includes(pr.n))); const v = getUniqueRandom(vegetables.filter(veg => veg.n !== 'Rotkohl'), 2); const e = getRandom([extras[1], extras[3]]);
        return { name: `Großer Salat mit ${p.n}`, ingredients: [p, bases[5], ...v, e], cost: 4.5, tags: ['schnell', ...p.t], instructions: [`Zutaten vorbereiten und mischen.`, `Mit Dressing anmachen.`, `Mit ${e.n} garnieren.`] };
    }}
];

console.log("Generiere ~1500 vielfältige Rezepte...");
const allRecipes = [];
for (let i = 0; i < 1500; i++) {
    const archetype = getRandom(archetypes);
    const recipeData = archetype.generate();
    const ingredients = recipeData.ingredients.map(ing => ({ name: ing.n, quantity: 100 + Math.floor(Math.random() * 150), unit: ing.u || 'g' }));
    const isVegetarian = recipeData.ingredients.every(ing => ing.v !== 0);
    const isVegan = recipeData.ingredients.every(ing => ing.vg !== 0);
    const estimatedCostPerServing = parseFloat((recipeData.cost + (Math.random() - 0.5)).toFixed(2));
    const tags = new Set(recipeData.tags);
    recipeData.ingredients.forEach(ing => { if (ing.t) ing.t.forEach(tag => tags.add(tag)); });
    if (estimatedCostPerServing < 3.0) tags.add('günstig');
    if (Math.random() < 0.2) tags.add('resteverwertung');
    if (Math.random() < 0.25) tags.add('für gäste');
    if (Math.random() < 0.4) tags.add('schnell');
    allRecipes.push({ id: `rezept-${i + 1}`, name: recipeData.name, description: `Ein leckeres Gericht aus der Kategorie "${archetype.name}". Perfekt für jeden Anlass.`, ingredients, instructions: recipeData.instructions, estimatedCostPerServing, isSimple: Math.random() > 0.3, isVegetarian, isVegan, tags: Array.from(tags).filter(t => t !== 'all') });
}
fs.writeFileSync(path.join(__dirname, 'data', 'recipes.json'), JSON.stringify(allRecipes, null, 2));
console.log(`Erfolgreich ${allRecipes.length} Rezepte generiert.`);