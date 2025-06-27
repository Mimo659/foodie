// Version 1600+
// Erstellt eine große und vielfältige Rezeptdatenbank (1600 Rezepte) mit verschiedenen Attributen und Küchenstilen.
const fs = require('fs');
const path = require('path');

const bases = [ { n: 'Nudeln', t:['mediterranean', 'defty'] }, { n: 'Reis', t:['asian', 'light'] }, { n: 'Kartoffeln', t:['defty'] }, { n: 'Quinoa', t:['light'] }, { n: 'Couscous', t:['mediterranean', 'light'] }, { n: 'Brot', t:['defty', 'mediterranean'] }, { n: 'Gnocchi', t:['mediterranean', 'defty'] }, { n: 'Polenta', t:['mediterranean'] }, { n: 'Bulgur', t:['mediterranean', 'light'] } ];
const proteins = [
    { n: 'Hähnchenbrust', v:0, vg:0, t:['light', 'asian'], type: 'chicken' },
    { n: 'Rinderhack', v:0, vg:0, t:['defty'], type: 'beef' },
    { n: 'Schweinefilet', v:0, vg:0, t:['defty', 'asian'], type: 'pork' }, // Pork can be filtered out if not needed
    { n: 'Linsen', v:1, vg:1, t:['light', 'defty', 'mediterranean'], type: 'vegetarian' },
    { n: 'Kichererbsen', v:1, vg:1, t:['light', 'mediterranean'], type: 'vegetarian' },
    { n: 'Schwarze Bohnen', v:1, vg:1, t:['defty'], type: 'vegetarian' },
    { n: 'Tofu', v:1, vg:1, t:['asian', 'light'], type: 'vegan' },
    { n: 'Eier', v:1, vg:0, t:['defty', 'light'], type: 'vegetarian' },
    { n: 'Halloumi', v:1, vg:0, t:['mediterranean'], type: 'vegetarian' },
    { n: 'Feta', v:1, vg:0, t:['mediterranean'], type: 'vegetarian' }
];
const vegetables = [ { n: 'Tomaten', t:['mediterranean'] }, { n: 'Zwiebel', t:['all'] }, { n: 'Paprika', t:['mediterranean', 'defty'] }, { n: 'Brokkoli', t:['light', 'asian'] }, { n: 'Karotten', t:['all'] }, { n: 'Spinat', t:['light', 'mediterranean'] }, { n: 'Zucchini', t:['mediterranean'] }, { n: 'Knoblauch', t:['all'] }, { n: 'Pilze', t:['defty', 'asian'] }, { n: 'Aubergine', t:['mediterranean'] }, { n: 'Gurke', t:['light'] }, { n: 'Mais', t:['defty'] }, { n: 'Frühlingszwiebeln', t:['asian'] }, { n: 'Ingwer', t:['asian'] }, { n: 'Oliven', t:['mediterranean'] }, { n: 'Rotkohl', t:['defty'] } ];
const saucesAndFats = [
    { n: 'Tomatensauce', t:['mediterranean'], vg:1, v:1 },
    { n: 'Sahnesauce', v:1, vg:0, t:['defty'] },
    { n: 'Sojasauce', t:['asian'], vg:1, v:1 },
    { n: 'Pesto', t:['mediterranean'], vg:0, v:1 }, // Traditional pesto has cheese
    { n: 'Veganes Pesto', t:['mediterranean'], vg:1, v:1 },
    { n: 'Vinaigrette', t:['light'], vg:1, v:1 },
    { n: 'Bratensauce', t:['defty'], vg:0, v:0 },
    { n: 'Olivenöl', t:['mediterranean', 'light'], vg:1, v:1 },
    { n: 'Butter', t:['defty'], vg:0, v:1 },
    { n: 'Kokosmilch', t:['asian', 'light'], vg:1, v:1 }
];
const spicesAndHerbs = [
    { n: 'Salz', quantity: 1, unit: 'Prise', vg:1, v:1 },
    { n: 'Pfeffer', quantity: 1, unit: 'Prise', vg:1, v:1 },
    { n: 'Paprikapulver', quantity: 1, unit: 'TL', vg:1, v:1 },
    { n: 'Currypulver', quantity: 1, unit: 'TL', vg:1, v:1 },
    { n: 'Oregano', quantity: 1, unit: 'TL', vg:1, v:1 },
    { n: 'Basilikum', quantity: 1, unit: 'TL', vg:1, v:1 },
    { n: 'Chiliflocken', quantity: 0.5, unit: 'TL', vg:1, v:1 }
];
const extras = [
    { n: 'geriebenem Käse', v:1, vg:0 },
    { n: 'frischen Kräutern (z.B. Petersilie oder Koriander)', v:1, vg:1 },
    { n: 'einem Klecks Joghurt', v:1, vg:0 },
    { n: 'einem Klecks veganem Joghurt', v:1, vg:1 },
    { n: 'gerösteten Kernen (z.B. Sonnenblumenkerne oder Pinienkerne)', v:1, vg:1 },
    { n: 'Röstzwiebeln', v:1, vg:1 }
];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getUniqueRandom = (arr, num) => {
    const result = new Set();
    while(result.size < num && result.size < arr.length) {
        result.add(getRandom(arr));
    }
    return Array.from(result);
};

const archetypes = [
    {
        name: 'Pfanne',
        t: ['asian', 'mediterranean'],
        generate: (targetProteinType) => {
            let p;
            if (targetProteinType === 'beef') p = proteins.find(pr => pr.type === 'beef');
            else if (targetProteinType === 'chicken') p = proteins.find(pr => pr.type === 'chicken');
            else if (targetProteinType === 'vegetarian') p = getRandom(proteins.filter(pr => pr.v === 1 && pr.vg === 0 && pr.type === 'vegetarian'));
            else if (targetProteinType === 'vegan') p = getRandom(proteins.filter(pr => pr.vg === 1 && pr.type === 'vegan'));
            else p = getRandom(proteins);

            const b = getRandom(bases.filter(base => ['Nudeln', 'Reis', 'Quinoa', 'Gnocchi', 'Couscous', 'Bulgur'].includes(base.n)));
            const vegs = getUniqueRandom(vegetables, Math.random() < 0.5 ? 2 : 3);
            const fat = getRandom(saucesAndFats.filter(sf => sf.n === 'Olivenöl' || sf.n === 'Butter' || (p.vg && sf.vg)));
            const sauce = getRandom(saucesAndFats.filter(s => (p.vg ? s.vg : p.v ? s.v : s.v === 0 && s.vg === 0) && (s.n.includes('sauce') || s.n.includes('Pesto') || s.n.includes('Kokosmilch'))));
            const spiceCount = Math.floor(Math.random() * 2) + 1; // 1 or 2 spices
            const selectedSpices = getUniqueRandom(spicesAndHerbs, spiceCount);

            return {
                name: `${p.n}-Pfanne mit ${b.n} und ${vegs[0].n}`,
                ingredients: [p, b, ...vegs, fat, sauce, ...selectedSpices, spicesAndHerbs[0], spicesAndHerbs[1]], // Salz & Pfeffer
                cost: 3.5 + Math.random(),
                tags: ['schnell', ...b.t, ...p.t, ...(sauce.t || []), ...(fat.t || [])],
                instructions: [
                    `${b.n} nach Packungsanweisung kochen.`,
                    `${p.n} in ${fat.n} anbraten. ${vegs.map(v => v.n).join(', ')} hinzufügen und mitbraten, bis sie gar sind.`,
                    `Mit ${selectedSpices.map(s => s.n).join(' und ')}, ${spicesAndHerbs[0].n} und ${spicesAndHerbs[1].n} würzen.`,
                    `Gekochte ${b.n} und ${sauce.n} zugeben, gut vermengen und kurz erwärmen.`,
                    `Optional: Mit ${ (getRandom(extras.filter(e => p.vg ? e.vg : p.v ? e.v : e.v===0 && e.vg === 0)) || extras.find(ex => ex.n.includes("Kräuter"))).n} servieren.`
                ]
            };
        }
    },
    {
        name: 'Auflauf',
        t: ['defty', 'mediterranean'],
        generate: (targetProteinType) => {
            let p;
            if (targetProteinType === 'beef') p = proteins.find(pr => pr.type === 'beef');
            else if (targetProteinType === 'chicken') p = proteins.find(pr => pr.type === 'chicken');
            else if (targetProteinType === 'vegetarian') p = getRandom(proteins.filter(pr => pr.v === 1 && pr.vg === 0 && pr.type === 'vegetarian'));
            else if (targetProteinType === 'vegan') p = getRandom(proteins.filter(pr => pr.vg === 1 && pr.type === 'vegan'));
            else p = getRandom(proteins);

            const b = getRandom(bases.filter(base => ['Kartoffeln', 'Nudeln', 'Gnocchi', 'Polenta'].includes(base.n)));
            const vegs = getUniqueRandom(vegetables, Math.random() < 0.4 ? 1 : 2);
            let sauce = getRandom(saucesAndFats.filter(s => (p.vg ? s.vg : p.v ? s.v : s.v === 0 && s.vg === 0) && (s.n.includes('Tomatensauce') || s.n.includes('Sahnesauce') || s.n.includes('Kokosmilch'))));
            if (!sauce) sauce = saucesAndFats.find(s => s.n === 'Tomatensauce'); // Fallback sauce
            const topping = p.vg ? extras.find(e=> e.n.includes('veganem Käse') || e.n.includes('Röstzwiebeln')) || getRandom(extras.filter(e=>e.vg)) : extras[0]; // geriebener Käse or vegan alternative
            const spiceCount = Math.floor(Math.random() * 2) + 1;
            const selectedSpices = getUniqueRandom(spicesAndHerbs, spiceCount);

            return {
                name: `${b.n}-Auflauf mit ${p.n} und ${vegs[0].n}`,
                ingredients: [p, b, ...vegs, sauce, topping, ...selectedSpices, spicesAndHerbs[0], spicesAndHerbs[1]],
                cost: 4 + Math.random(),
                tags: ['für gäste', 'comfort food', ...b.t, ...p.t, ...(sauce && sauce.t ? sauce.t : [])],
                instructions: [
                    `${b.n} vorkochen, falls nötig (z.B. Kartoffeln in Scheiben schneiden, Nudeln al dente kochen).`,
                    `${p.n} anbraten (falls roh). Gemüse klein schneiden.`,
                    `Alle Zutaten (außer ${topping.n}) in einer Auflaufform mischen. Mit ${selectedSpices.map(s => s.n).join(' und ')}, ${spicesAndHerbs[0].n} und ${spicesAndHerbs[1].n} würzen.`,
                    `Mit ${sauce.n} übergießen und mit ${topping.n} bestreuen.`,
                    `Im vorgeheizten Ofen bei 180°C (Umluft) ca. 25-35 Minuten backen, bis der Auflauf goldbraun ist.`
                ]
            };
        }
    },
    {
        name: 'Eintopf',
        t: ['defty', 'light'],
        generate: (targetProteinType) => {
            let p;
            if (targetProteinType === 'beef') p = proteins.find(pr => pr.type === 'beef');
            else if (targetProteinType === 'chicken') p = proteins.find(pr => pr.type === 'chicken');
            else if (targetProteinType === 'vegetarian') p = getRandom(proteins.filter(pr => pr.v === 1 && pr.vg === 0 && pr.type === 'vegetarian' && pr.n !== 'Halloumi' && pr.n !== 'Feta'));
            else if (targetProteinType === 'vegan') p = getRandom(proteins.filter(pr => pr.vg === 1 && pr.type === 'vegan'));
            else p = getRandom(proteins.filter(pr => pr.n !== 'Halloumi' && pr.n !== 'Feta'));


            const vegs = getUniqueRandom(vegetables.filter(veg => veg.n !== 'Gurke'), Math.random() < 0.3 ? 3: 4);
            const b = getRandom([bases.find(b=>b.n==='Kartoffeln'), bases.find(b=>b.n==='Bulgur'), bases.find(b=>b.n==='Linsen') || proteins.find(p=>p.n==='Linsen')]); // Linsen can be a base too
            const liquid = { n: 'Gemüsebrühe', quantity: 500, unit: 'ml', vg:1, v:1 };
            const fat = getRandom(saucesAndFats.filter(sf => sf.n === 'Olivenöl' || sf.n === 'Butter' || (p.vg && sf.vg)));
            let ex = getRandom(extras.filter(e => (p.vg ? e.vg : p.v ? e.v : e.v === 0 && e.vg === 0) && (e.n.includes('Kräuter') || e.n.includes('Joghurt') || e.n.includes('Röstzwiebeln')) ));
            if (!ex) ex = extras.find(e => e.n.includes('Kräuter')); // Fallback extra
            const spiceCount = Math.floor(Math.random() * 2) + 2; // 2 or 3 spices
            const selectedSpices = getUniqueRandom(spicesAndHerbs, spiceCount);

            return {
                name: `${p.n}-Eintopf mit ${vegs[0].n} und ${vegs[1].n}`,
                ingredients: [p, ...vegs, b, liquid, fat, ex, ...selectedSpices, spicesAndHerbs[0], spicesAndHerbs[1]],
                cost: 3 + Math.random(),
                tags: ['günstig', 'resteverwertung', 'herzhaft', ...p.t, ...b.t],
                instructions: [
                    `Gemüse waschen und klein schneiden. ${p.n} ggf. würfeln oder vorbereiten.`,
                    `${p.n} in ${fat.n} in einem großen Topf anbraten. Dann das härtere Gemüse (z.B. ${vegs.filter(v=>v.n==='Karotten'||v.n==='Kartoffeln').map(v=>v.n).join(' oder ') || vegs[0].n}) hinzufügen und kurz mitdünsten.`,
                    `Restliches Gemüse (${vegs.filter(v=>v.n!=='Karotten'&&v.n!=='Kartoffeln').map(v=>v.n).join(', ') || vegs[1].n}) und ${b.n} (falls nicht vorgekocht) zugeben. Mit ${liquid.n} aufgießen.`,
                    `Mit ${selectedSpices.map(s => s.n).join(' und ')}, ${spicesAndHerbs[0].n} und ${spicesAndHerbs[1].n} würzen. Aufkochen lassen und dann bei mittlerer Hitze 20-30 Minuten köcheln lassen, bis alle Zutaten gar sind.`,
                    `Abschmecken und optional mit ${ex.n} servieren.`
                ]
            };
        }
    },
    {
        name: 'Salat',
        t: ['light', 'mediterranean'],
        generate: (targetProteinType) => {
            let p;
            if (targetProteinType === 'chicken') p = proteins.find(pr => pr.type === 'chicken');
            // For salads, beef is less common, so we might pick another if beef is requested but not ideal for salad.
            // Or we ensure there's a "beef salad" protein if desired. For now, let's stick to typical salad proteins.
            else if (targetProteinType === 'vegetarian') p = getRandom(proteins.filter(pr => pr.v === 1 && pr.vg === 0 && ['Feta', 'Halloumi', 'Eier', 'Kichererbsen'].includes(pr.n)));
            else if (targetProteinType === 'vegan') p = getRandom(proteins.filter(pr => pr.vg === 1 && ['Tofu', 'Kichererbsen', 'Schwarze Bohnen', 'Linsen'].includes(pr.n)));
            else p = getRandom(proteins.filter(pr => ['Hähnchenbrust', 'Feta', 'Halloumi', 'Tofu', 'Kichererbsen', 'Linsen'].includes(pr.n)));


            const vegs = getUniqueRandom(vegetables.filter(veg => veg.n !== 'Rotkohl' && veg.n !== 'Aubergine' && veg.n !== 'Ingwer'), Math.random() < 0.5 ? 3 : 4); // More veggies for salad
            const baseSalad = getRandom([bases.find(b=>b.n==='Brot'), {n: 'Blattsalat Mix', quantity:150, unit:'g', t:['light']}]); // Brot for croutons or side
            const dressing = getRandom(saucesAndFats.filter(s => s.n.includes('Vinaigrette') || (p.vg ? s.vg && s.n.includes('Joghurt') : p.v ? s.v && s.n.includes('Joghurt') : false) || s.n === 'Olivenöl'));
            const ex = getRandom(extras.filter(e => (p.vg ? e.vg : p.v ? e.v : true) && (e.n.includes('Kräuter') || e.n.includes('Kerne') || e.n.includes('Röstzwiebeln'))));
            const selectedSpices = [spicesAndHerbs[0], spicesAndHerbs[1]]; // Salt and Pepper usually enough for salad dressing

            return {
                name: `Bunter Salat mit ${p.n} und ${vegs[0].n}`,
                ingredients: [p, baseSalad, ...vegs, dressing, ex, ...selectedSpices],
                cost: 4.5 + Math.random(),
                tags: ['schnell', 'frisch', 'gesund', ...p.t, ...(dressing.t || [])],
                instructions: [
                    `${p.n} vorbereiten (z.B. Hähnchen braten und in Streifen schneiden, Tofu würfeln und anbraten, Halloumi grillen).`,
                    `Alle Salat Zutaten (${baseSalad.n}, ${vegs.map(v => v.n).join(', ')}) waschen und mundgerecht zerkleinern. In einer großen Schüssel vermengen.`,
                    `${dressing.n} mit ${selectedSpices.map(s => s.n).join(' und ')} anrühren. Ggf. weitere Kräuter hinzufügen.`,
                    `Dressing über den Salat geben und gut vermischen. ${p.n} darauf anrichten.`,
                    `Mit ${ex.n} garnieren und sofort servieren.`
                ]
            };
        }
    }
];

console.log("Generiere 1600 vielfältige Rezepte...");
const allRecipes = [];
const recipesPerType = 400;
const proteinTypes = ['beef', 'chicken', 'vegetarian', 'vegan'];
let recipeCounter = 0;

proteinTypes.forEach(type => {
    for (let i = 0; i < recipesPerType; i++) {
        recipeCounter++;
        let archetype;
        if (type === 'beef') { // Beef is better for certain archetypes
            archetype = getRandom(archetypes.filter(a => a.name === 'Pfanne' || a.name === 'Auflauf' || a.name === 'Eintopf'));
        } else {
            archetype = getRandom(archetypes);
        }
        const recipeData = archetype.generate(type);

        const ingredients = recipeData.ingredients.map(ing => {
            let quantity, unit;
            if (ing.quantity && ing.unit) { // Predefined like Salz, Pfeffer, Brühe
                quantity = ing.quantity;
                unit = ing.unit;
            } else if (['Salz', 'Pfeffer'].includes(ing.n)) {
                quantity = 1; unit = 'Prise';
            } else if (ing.n.toLowerCase().includes('öl') || ing.n.toLowerCase().includes('butter') || ing.n.toLowerCase().includes('sauce') || ing.n.toLowerCase().includes('pesto')) {
                quantity = Math.floor(Math.random() * 30) + 20; // 20-50
                unit = ing.n.toLowerCase().includes('öl') || ing.n.toLowerCase().includes('butter') ? 'g' : 'ml';
            } else {
                quantity = 100 + Math.floor(Math.random() * 150); // Default 100-250g
                unit = 'g';
            }
            return { name: ing.n, quantity: quantity, unit: unit };
        });

        const isVegetarian = recipeData.ingredients.every(ing => ing.v !== 0 || proteins.find(p=>p.n===ing.n)?.v !==0 || saucesAndFats.find(s=>s.n===ing.n)?.v !==0 || spicesAndHerbs.find(s=>s.n===ing.n)?.v !==0 || extras.find(e=>e.n===ing.n)?.v !==0 );
        const isVegan = recipeData.ingredients.every(ing => ing.vg !== 0 || proteins.find(p=>p.n===ing.n)?.vg !==0 || saucesAndFats.find(s=>s.n===ing.n)?.vg !==0 || spicesAndHerbs.find(s=>s.n===ing.n)?.vg !==0 || extras.find(e=>e.n===ing.n)?.vg !==0);

        // Correct isVegetarian/isVegan based on target type if generation logic had a mismatch (should be rare)
        let finalIsVegetarian = isVegetarian;
        let finalIsVegan = isVegan;

        if (type === 'vegan') {
            finalIsVegan = true;
            finalIsVegetarian = true;
        } else if (type === 'vegetarian') {
            finalIsVegan = false; // Could be vegan, but we are targeting vegetarian specifically
            finalIsVegetarian = true;
        } else if (type === 'chicken' || type === 'beef') {
            finalIsVegan = false;
            finalIsVegetarian = false;
        }


        const estimatedCostPerServing = parseFloat((recipeData.cost + (Math.random() - 0.5)).toFixed(2));
        const tags = new Set(recipeData.tags);
        recipeData.ingredients.forEach(ing => {
            const item = proteins.find(p=>p.n===ing.n) || bases.find(b=>b.n===ing.n) || vegetables.find(v=>v.n===ing.n) || saucesAndFats.find(s=>s.n===ing.n) || extras.find(e=>e.n===ing.n);
            if (item && item.t) item.t.forEach(tag => tags.add(tag));
        });

        if (estimatedCostPerServing < 3.0) tags.add('günstig');
        if (Math.random() < 0.2) tags.add('resteverwertung');
        if (archetype.name !== 'Salat' && Math.random() < 0.25) tags.add('für kinder');
        if (Math.random() < 0.4) tags.add('schnell');
        if (Math.random() < 0.3) tags.add('einfach');


        allRecipes.push({
            id: `rezept-${recipeCounter}`,
            name: recipeData.name,
            description: `Ein ${recipeData.tags.includes('schnell') ? 'schnelles und ' : ''}leckeres ${archetype.name}-Gericht mit ${recipeData.ingredients[0].n}. ${recipeData.tags.includes('für gäste') ? 'Ideal für Gäste oder einen besonderen Anlass.' : 'Perfekt für ein zufriedenstellendes Mittag- oder Abendessen.'}`,
            ingredients,
            instructions: recipeData.instructions,
            estimatedCostPerServing: Math.max(1.5, estimatedCostPerServing), // Ensure cost is not too low
            isSimple: Math.random() > 0.3,
            isVegetarian: finalIsVegetarian,
            isVegan: finalIsVegan,
            tags: Array.from(tags).filter(t => t !== 'all' && t)
        });
    }
});

// Shuffle recipes for more randomness in the final list if desired
for (let i = allRecipes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allRecipes[i], allRecipes[j]] = [allRecipes[j], allRecipes[i]];
}


fs.writeFileSync(path.join(__dirname, '..', 'data', 'recipes.json'), JSON.stringify(allRecipes, null, 2));
console.log(`Erfolgreich ${allRecipes.length} Rezepte generiert.`);
console.log(`Verteilung:`);
console.log(`Rind: ${allRecipes.filter(r => !r.isVegetarian && r.ingredients.some(i => i.name === 'Rinderhack')).length}`);
console.log(`Huhn: ${allRecipes.filter(r => !r.isVegetarian && r.ingredients.some(i => i.name === 'Hähnchenbrust')).length}`);
console.log(`Vegetarisch (nicht vegan): ${allRecipes.filter(r => r.isVegetarian && !r.isVegan).length}`);
console.log(`Vegan: ${allRecipes.filter(r => r.isVegan).length}`);