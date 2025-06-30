// js/ingredientMatcher.js

const UNIT_STANDARDIZATION = {
    // Volume
    "ml": "ml", "milliliter": "ml", "millilitre": "ml",
    "l": "l", "liter": "l", "litre": "l",
    "el": "EL", "esslöffel": "EL",
    "tl": "TL", "teelöffel": "TL",
    // Weight
    "g": "g", "gramm": "g", "gram": "g",
    "kg": "kg", "kilogramm": "kg", "kilogram": "kg",
    // Pieces/Counts
    "stk.": "Stk.", "stück": "Stk.", "stk": "Stk.", "st": "Stk.", "st.": "Stk.",
    "pck.": "Pck.", "packung": "Pck.", "pck": "Pck.", "pack.": "Pck.",
    "bd.": "Bund", "bund": "Bund", "bd": "Bund",
    "dose": "Dose", "dosen": "Dose", "ds": "Dose",
    "glas": "Glas", "gl": "Glas",
    "knolle": "Knolle", "knoll": "Knolle",
    "zehe": "Zehe", "zehen": "Zehe", "zeh": "Zehe", // Standardize to singular "Zehe"
    "prise": "Prise", "prisen": "Prise",
    "scheibe": "Scheibe", "scheiben": "Scheibe",
    "stange": "Stange", "stangen": "Stange",
    "zweig": "Zweig", "zweige": "Zweig",
    "kopf": "Kopf", // e.g., Kopf Salat
    "beet": "Beet", // e.g., Beet Kresse
    "handvoll": "Handvoll",
    // Common abbreviations or variations from data
    "msp.": "Msp.", // Messerspitze
    "tl ": "TL", // Trailing space
    "el ": "EL", // Trailing space
    "gr": "g", // Common typo for g
    "stück(e)": "Stk.",
    "dose(n)": "Dose",
    "knolle(n)": "Knolle",
    "zehe(n)": "Zehe",
    "stiel(e)": "Stiel",
    "stange(n)": "Stange",
    "zweig(e)": "Zweig",
    "scheibe(n)": "Scheibe",
    "pck. ": "Pck.", // Trailing space
    "bd. ": "Bund", // Trailing space
    "tl.": "TL",
    "el.": "EL",
};

// For converting between units of the same type (e.g., g to kg)
const BASE_UNIT_CONVERSIONS = {
    "g": {"kg": 0.001, "mg": 1000},
    "kg": {"g": 1000, "mg": 1000000},
    "ml": {"l": 0.001, "cl": 0.1},
    "l": {"ml": 1000, "cl": 100},
    "el": {"ml": 15}, // 1 EL is approx 15 ml
    "tl": {"ml": 5},  // 1 TL is approx 5 ml
    // Add more as needed
};

// For ingredient-specific conversions, e.g., 1 Bund Petersilie -> 30g
// This is highly approximate and context-dependent.
const INGREDIENT_SPECIFIC_CONVERSIONS = {
    "petersilie": {
        "Bund": {"g": 30} // 1 Bund Petersilie is approx. 30g
    },
    "basilikum": {
        "Bund": {"g": 25},
        "Topf": {"g": 50} // 1 Topf Basilikum
    },
    "schnittlauch": {
        "Bund": {"g": 25}
    },
    "dill": {
        "Bund": {"g": 20}
    },
    "koriander": {
        "Bund": {"g": 30}
    },
    "knoblauch": {
        "Knolle": {"Zehe": 10} // 1 Knolle Knoblauch is approx. 10 Zehen
    },
    "zwiebel": { // Includes rote Zwiebel, Schalotte etc. if normalized name is "zwiebel"
        "Stk.": {"g": 100} // 1 mittelgroße Zwiebel approx 100g
    },
    "ei": { // For Eier
        "Stk.": {"g": 55} // 1 Ei Größe M approx 55g
    }
    // Add more ingredients and their typical conversions
};

const INGREDIENT_SYNONYMS = {
    "naturreis": "Reis",
    "basmatireis": "Reis",
    "langkorn-spitzenreis": "Reis",
    "langkorn-reis": "Reis",
    "10-minuten-reis": "Reis",
    "parboiled spitzenreis": "Reis",
    "champignons (braun)": "Champignons",
    "champignons": "Champignons",
    "braune champignons": "Champignons",
    "frühlingszwiebeln": "Frühlingszwiebel",
    "lauchzwiebeln": "Frühlingszwiebel",
    "rote zwiebel": "Zwiebel",
    "zwiebeln": "Zwiebel",
    "schalotte": "Zwiebel", // Often interchangeable in shopping
    "kleine zwiebel": "Zwiebel",
    "mittlere zwiebel": "Zwiebel",
    "große zwiebel": "Zwiebel",
    "knoblauchzehen": "Knoblauch",
    "knoblauchzehe": "Knoblauch",
    "knoblauch": "Knoblauch",
    "zehe(n) knoblauch": "Knoblauch",
    "knolle(n) knoblauch": "Knoblauch",
    "rote paprikaschoten": "Paprika",
    "gelbe paprikaschoten": "Paprika",
    "rote paprika": "Paprika",
    "gelbe paprika": "Paprika",
    "grüne paprika": "Paprika",
    "paprikaschoten": "Paprika",
    "möhren": "Möhre",
    "karotten": "Möhre",
    "karotte": "Möhre",
    "speisekartoffeln drillinge": "Kartoffel",
    "kartoffeln (festkochend)": "Kartoffel",
    "kartoffeln, festkochend": "Kartoffel",
    "kartoffeln": "Kartoffel",
    "kartoffeln (vorwiegend festkochend)": "Kartoffel",
    "kartoffeln, vorwiegend festkochend": "Kartoffel",
    "kartoffeln (überwiegend festkochend)": "Kartoffel",
    "kartoffeln (mehlig kochend)": "Kartoffel",
    "mehlige kartoffeln": "Kartoffel",
    "backkartoffeln": "Kartoffel",
    "drillinge kartoffeln": "Kartoffel",
    "eier": "Ei",
    "ei (größe m)": "Ei",
    "eier (größe m)": "Ei",
    "kirschtomaten": "Tomate",
    "cherrytomaten": "Tomate",
    "cherry-rispentomaten": "Tomate",
    "tomaten": "Tomate",
    "fleischtomaten": "Tomate",
    "stückige tomaten": "Tomaten (Dose)", // Keep distinct from fresh
    "gehackte tomaten": "Tomaten (Dose)",
    "pizza-tomaten": "Tomaten (Dose)",
    "tomaten in stücken": "Tomaten (Dose)",
    "passierte tomaten": "Tomaten (passiert)",
    "tomatencremesuppe": "Tomatensuppe (Fertigprodukt)", // Keep distinct
    "rote linsen": "Linsen (rot)",
    "berglinsen": "Linsen (Berg)",
    "linsen": "Linsen", // Generic, if not specified
    "hähnchenbrustfilet": "Hähnchenbrust",
    "hähnchenbrust-filetsteaks": "Hähnchenbrust",
    "hähnchen mini schnitzel": "Hähnchenschnitzel (Mini)",
    "schweine-schinkenschnitzel": "Schweineschnitzel",
    "ja! weizenmehl": "Weizenmehl",
    "weizenmehl type 405": "Weizenmehl",
    "dinkel-vollkornmehl": "Dinkelvollkornmehl",
    "ja! fettarme h-milch": "Milch",
    "fettarme h-milch": "Milch",
    "milch": "Milch",
    "ja! vollmilch": "Milch",
    "ja! sonnenblumenöl": "Sonnenblumenöl",
    "öl": "Öl", // Generic, try to be more specific if possible from context
    "olivenöl": "Olivenöl",
    "rapsöl": "Rapsöl",
    "natives olivenöl extra": "Olivenöl",
    "bratöl": "Öl",
    "ja! natives rapsöl": "Rapsöl",
    "ja! olivenöl": "Olivenöl",
    "salz": "Salz",
    "jodsalz": "Salz",
    "ja! jodsalz": "Salz",
    "fleur de sel": "Salz",
    "pfeffer": "Pfeffer",
    "pfeffer schwarz gemahlen": "Pfeffer",
    "weißer pfeffer": "Pfeffer",
    "bunter pfeffer aus der mühle": "Pfeffer",
    "zucker": "Zucker",
    "ja! raffinade zucker": "Zucker",
    "brauner zucker": "Zucker",
    "parmesan": "Parmesan",
    "parmesankäse": "Parmesan",
    "feta": "Feta",
    "hirtenkäse": "Feta", // Often used interchangeably or similar enough for shopping
    "ja! hirtenkäse": "Feta",
    "schafskäse": "Feta", // Often means Feta or similar white cheese in brine
    "schnittlauch": "Schnittlauch",
    "petersilie": "Petersilie",
    "glatte petersilie": "Petersilie",
    "basilikum": "Basilikum",
    "rosmarin": "Rosmarin",
    "thymian": "Thymian",
    "oregano": "Oregano",
    "oregano gerebelt": "Oregano",
    "getrocknete kräuter": "Kräuter (getrocknet)",
    "italienische kräuter": "Kräuter (italienisch)",
    "gemischte kräuter (frisch gehackt)": "Kräuter (frisch, gemischt)",
    "currypulver": "Currypulver",
    "mildes currypulver": "Currypulver",
    "paprikapulver": "Paprikapulver",
    "paprikapulver edelsüß": "Paprikapulver (edelsüß)",
    "ja! paprikapulver edelsüß": "Paprikapulver (edelsüß)",
    "rosenpaprika scharf": "Paprikapulver (scharf)",
    "paprikapulver rosenscharf": "Paprikapulver (scharf)",
    "kreuzkümmel": "Kreuzkümmel",
    "kreuzkümmel (gemahlen)": "Kreuzkümmel (gemahlen)",
    "kurkuma": "Kurkuma",
    "muskatnuss": "Muskatnuss",
    "muskat": "Muskatnuss",
    "muskatnuss (frisch gerieben)": "Muskatnuss",
    "chiliflocken": "Chiliflocken",
    "chili gewürzmischung gemahlen": "Chiligewürz",
    "chiligewürz": "Chiligewürz",
    "sambal oelek": "Sambal Oelek",
    "ajvar pikant": "Ajvar",
    "senf": "Senf",
    "mittelscharfer senf": "Senf (mittelscharf)",
    "ja! senf mittelscharf": "Senf (mittelscharf)",
    "tomatenmark": "Tomatenmark",
    "ja! tomatenmark 3-fach konzentriert": "Tomatenmark",
    "gemüsebrühe": "Gemüsebrühe",
    "gemüsebrühe (instant)": "Gemüsebrühe",
    "ja! klare gemüsebrühe (pulver)": "Gemüsebrühe",
    "gemüsebrühe (glutenfrei)": "Gemüsebrühe",
    "speisestärke": "Speisestärke",
    "küchenmeister speisestärke": "Speisestärke",
    "paniermehl": "Paniermehl",
    "ja! paniermehl": "Paniermehl",
    "semmelbrösel": "Paniermehl",
    "haferflocken": "Haferflocken",
    "zarte haferflocken": "Haferflocken",
    "cornflakes, ungezuckert": "Cornflakes (ungezuckert)",
    "sonnenblumenkerne": "Sonnenblumenkerne",
    "sonnenblumenkerne geschält": "Sonnenblumenkerne",
    "pinienkerne": "Pinienkerne",
    "ja! pinienkerne": "Pinienkerne",
    "kürbiskerne": "Kürbiskerne",
    "walnüsse": "Walnüsse",
    "haselnusskerne": "Haselnüsse",
    "pistazien": "Pistazien",
    "gesalzene pistazien": "Pistazien (gesalzen)",
    "erdnüsse": "Erdnüsse",
    "erdnussmus": "Erdnussmus",
    "mandeln gehobelt": "Mandeln (gehobelt)",
    "hefeflocken": "Hefeflocken",
    "backpulver": "Backpulver",
    "hefewürfel": "Hefe (frisch)",
    "honig": "Honig",
    "flüssiger honig": "Honig",
    "agavendicksaft": "Agavendicksaft",
    "ahornsirup": "Ahornsirup",
    "essig (hell)": "Essig (hell)",
    "weißweinessig": "Weißweinessig",
    "ja! condimento bianco": "Weißweinessig", // Often a white wine vinegar
    "obstessig": "Obstessig",
    "apfelessig": "Apfelessig",
    "aceto balsamico": "Balsamicoessig",
    "balsamico": "Balsamicoessig",
    "zitronensaft": "Zitronensaft",
    "limettensaft": "Limettensaft",
    "orangensaft": "Orangensaft", // For cooking
    "sojasauce": "Sojasauce",
    "sojasoße": "Sojasauce",
    "ketjap manis": "Ketjap Manis",
    "tabasco": "Tabasco",
    "rotwein (trocken)": "Rotwein (trocken)",
    "rotwein": "Rotwein",
    "weißwein-essig": "Weißweinessig",
    "crème fraîche": "Crème fraîche",
    "creme fraiche": "Crème fraîche",
    "schmand": "Schmand",
    "ja! schmand": "Schmand",
    "sahne": "Sahne", // Generic
    "schlagsahne": "Sahne",
    "ja! schlagsahne": "Sahne",
    "saure sahne": "Saure Sahne",
    "ja! saure sahne": "Saure Sahne",
    "sojacreme cuisine": "Sojacreme",
    "soja-kochcreme": "Sojacreme",
    "joghurt": "Joghurt",
    "naturjoghurt": "Joghurt (Natur)",
    "griechischer joghurt": "Joghurt (griechisch)",
    "ja! vollmilch-joghurt": "Joghurt (Natur)",
    "speisequark halbfettstufe": "Quark (Halbfett)",
    "butter": "Butter",
    "ja! markenbutter": "Butter",
    "butterschmalz": "Butterschmalz",
    "margarine (ggf. vegan)": "Margarine",
    "palmin kokosfett": "Kokosfett",
    "frischkäse": "Frischkäse",
    "frischkäse natur doppelrahmstufe": "Frischkäse",
    "ja! frischkäse natur doppelrahmstufe": "Frischkäse",
    "sahneschmelzkäse": "Schmelzkäse",
    "mozzarella": "Mozzarella",
    "ja! mozzarella": "Mozzarella",
    "mini-mozzarella": "Mozzarella (Mini)",
    "ja! geriebener gratin- und pizzakäse": "Reibekäse",
    "geriebener käse": "Reibekäse",
    "reibekäse": "Reibekäse",
    "ja! geriebener gouda": "Gouda (gerieben)",
    "gratinkäse": "Reibekäse",
    "cheddar": "Cheddar",
    "ja! cheddar": "Cheddar",
    "emmentaler": "Emmentaler",
    "bergkäse": "Bergkäse",
    "mittelalter gouda": "Gouda (mittelalt)",
    "pecorino": "Pecorino",
    "pecorino (gerieben)": "Pecorino (gerieben)",
    "tk-erbsen": "Erbsen (TK)",
    "junge erbsen": "Erbsen",
    "ja! junge erbsen": "Erbsen (TK)",
    "ja! tk-erbsen": "Erbsen (TK)",
    "erbsen (tk)": "Erbsen (TK)",
    "ja! tk erbsen": "Erbsen (TK)",
    "300 g ja! tk-erbsen": "Erbsen (TK)", // example of already quantity-prefixed
    "mais": "Mais (Dose)",
    "ja! super sweet mais": "Mais (Dose)",
    "kidneybohnen": "Kidneybohnen (Dose)",
    "kidney-bohnen": "Kidneybohnen (Dose)",
    "ja! kidney-bohnen": "Kidneybohnen (Dose)",
    "weiße bohnen": "Weiße Bohnen (Dose)",
    "weiße bohnen (dose)": "Weiße Bohnen (Dose)",
    "weiße riesenbohnen": "Weiße Bohnen (Riesen, Dose)",
    "kichererbsen": "Kichererbsen (Dose)",
    "2 gläser kichererbsen 220g": "Kichererbsen (Glas)",
    "blattspinat": "Blattspinat",
    "tk-rahmspinat": "Rahmspinat (TK)",
    "ja! rahmspinat": "Rahmspinat (TK)",
    "frischer spinat": "Spinat (frisch)",
    "spinat": "Spinat",
    "tiefgefrorener blattspinat": "Blattspinat (TK)",
    "ja! blumenkohl (tk)": "Blumenkohl (TK)",
    "blumenkohl": "Blumenkohl",
    "kopf blumenkohl": "Blumenkohl",
    "brokkoli": "Brokkoli",
    "ja! brokkoli (tk)": "Brokkoli (TK)",
    "zucchini": "Zucchini",
    "kleine zucchini": "Zucchini",
    "aubergine": "Aubergine",
    "chinakohl": "Chinakohl",
    "spitzkohl": "Spitzkohl",
    "wirsing": "Wirsing",
    "rotkohl mit apfelstücken": "Rotkohl (Glas/Dose)",
    "ja! rotkohl mit apfelstücken": "Rotkohl (Glas/Dose)",
    "kohlrabi": "Kohlrabi",
    "sellerie": "Sellerie", // Staudensellerie if not further specified
    "staudensellerie": "Staudensellerie",
    "lauch": "Lauch", // Porree
    "porree": "Lauch",
    "salatgurke": "Gurke",
    "gurke": "Gurke",
    "0,5 salatgurke": "Gurke", // example
    "gewürzgurken": "Gewürzgurke",
    "cornichons": "Cornichons",
    "ja! cornichons": "Cornichons",
    "feldsalat": "Feldsalat",
    "rucola": "Rucola",
    "kopfsalat": "Kopfsalat",
    "romana-salatherzen": "Romanasalat",
    "salatherzen": "Romanasalat", // Typically Romana
    "radieschen": "Radieschen",
    "radieschensprossen": "Radieschensprossen",
    "kresse": "Kresse",
    "0,5 beet(e) kresse": "Kresse", // example
    "pilze": "Pilze", // Generic
    "asiatische instant nudeln (yum yum, mit gewürzmischung)": "Instant Nudeln (Asiatisch)",
    "mie-nudeln": "Mie-Nudeln",
    "wok nudeln (chinesische eiernudeln)": "Wok Nudeln",
    "spaghetti": "Spaghetti",
    "ja! spaghetti": "Spaghetti",
    "vollkornspaghetti": "Vollkornspaghetti",
    "vollkorn-spaghetti": "Vollkornspaghetti",
    "penne": "Penne",
    "penne rigate": "Penne",
    "ja! penne": "Penne",
    "ja! penne rigate": "Penne",
    "penne mezzane rigate": "Penne",
    "kurze nudeln (z.b. penne)": "Nudeln (kurz)",
    "fusilli": "Fusilli",
    "ja! fusilli": "Fusilli",
    "vollkorn-fusilli": "Vollkornfusilli",
    "spiralnudeln": "Fusilli", // Often means Fusilli
    "farfalle": "Farfalle",
    "makkaroni": "Makkaroni",
    "rigatoni": "Rigatoni",
    "bandnudeln": "Bandnudeln",
    "tagliatelle": "Tagliatelle",
    "linguine": "Linguine",
    "orecchiette": "Orecchiette",
    "nudeln": "Nudeln", // Generic
    "ja! nudeln (z. b. fusilli)": "Nudeln",
    "gnocchi (kühlregal)": "Gnocchi",
    "gnocchi": "Gnocchi",
    "tortellini": "Tortellini",
    "spinat-ricotta-tortelloni": "Tortelloni (Spinat-Ricotta)",
    "couscous": "Couscous",
    "instant-couscous": "Couscous",
    "räuchertofu": "Räuchertofu",
    "basilikum-tofu": "Tofu (Basilikum)",
    "tofu": "Tofu",
    "soja-schnetzel": "Sojaschnetzel",
    "hackfleisch gemischt": "Hackfleisch (gemischt)",
    "ja! gemischtes hackfleisch": "Hackfleisch (gemischt)",
    "hackfleisch (gemischt)": "Hackfleisch (gemischt)",
    "gyrosfleisch": "Gyrosfleisch",
    "speckwürfel": "Speckwürfel",
    "ja! schinkenwürfel": "Schinkenwürfel", // Note difference Speck vs Schinken
    "schinkenwürfel": "Schinkenwürfel",
    "geräucherter speck": "Speck (geräuchert)",
    "ja! delicatess bacon": "Bacon",
    "delikatess kochschinken": "Kochschinken",
    "ja! delikatess kochschinken": "Kochschinken",
    "gekochter schinken": "Kochschinken",
    "kochschinken (in scheiben)": "Kochschinken",
    "mettenden": "Mettenden (geräuchert)", // Often geräuchert
    "geräucherte mettenden": "Mettenden (geräuchert)",
    "bockwürste": "Bockwurst",
    "fischstäbchen": "Fischstäbchen",
    "garnelen verzehrfertig": "Garnelen (verzehrfertig)",
    "blätterteig": "Blätterteig",
    "pizzateig (kühlregal)": "Pizzateig",
    "brot (z. b. ciabatta oder graubrot)": "Brot",
    "toastbrot": "Toastbrot",
    "ja! american sandwich": "Toastbrot (American)",
    "rustikales weizenbrot": "Weizenbrot (rustikal)",
    "tortilla-wraps": "Tortilla Wraps",
    "nachos": "Nachos",
    "getrocknete tomaten in öl mit oregano": "Getrocknete Tomaten in Öl",
    "getrocknete tomaten in öl": "Getrocknete Tomaten in Öl",
    "getrocknete tomaten": "Getrocknete Tomaten", // If not specified in oil
    "aprikosen, getrocknet": "Aprikosen (getrocknet)",
    "getrocknete cranberries": "Cranberries (getrocknet)",
    "grüne oliven": "Oliven (grün)",
    "oliven": "Oliven", // Generic
    "kürbis (600 g, butternut oder hokkaido)": "Kürbis", // Generic, specific type might be important
    "hokkaido kürbis (ca. 850 g)": "Hokkaido Kürbis",
    "süßkartoffeln (ca. 800 g)": "Süßkartoffel",
    "süßkartoffel": "Süßkartoffel",
    "ingwer": "Ingwer",
    "1 stück ingwer": "Ingwer",
    "daumengroßes stück ingwer (3 g)": "Ingwer",
    "fenchel": "Fenchel",
    "knolle(n) fenchel": "Fenchel",
    "rettich": "Rettich",
    "avocado": "Avocado",
    "limette": "Limette",
    "0,5 limette": "Limette", // example
    "zitrone": "Zitrone",
    "1 -zitrone": "Zitrone", // example
    "0,25 knolle(n) knoblauch": "Knoblauch", // example
    "ja! buttergemüse (tk, à 300 g)": "Buttergemüse (TK)",
    "ja! buttergemüse (tk)": "Buttergemüse (TK)",
    "ja! kaisergemüse tk": "Kaisergemüse (TK)",
    "suppengrün": "Suppengrün",
    "krautsalat mit grüner paprika": "Krautsalat",
    "apfelmus": "Apfelmus",
    // Specific items that are tricky:
    "tellicherry-pfeffer mühle (z. b. von feine welt)": "Pfeffer (Tellicherry)", // Keep specific
    "speisekartoffeln drillinge (z. b. von )": "Kartoffel (Drillinge)", // keep specific
    "kala namak (schwefelsalz)": "Kala Namak Salz",
    "geriebener gouda": "Gouda (gerieben)",
    "pizzakäse (gerieben)": "Pizzakäse (gerieben)",
    "ja! rinder minutensteaks": "Rinder Minutensteak",
    "wilhelm brandenburg hackfleisch (gemischt)": "Hackfleisch (gemischt)",
    "4 spitz & bube eier (m)": "Ei",
    "cherry rispentomaten dulcita": "Cherrytomaten",
    "ja! sonnen-mais natursüß": "Mais (Dose)",
    "ja! mini cordon bleu": "Cordon Bleu (Mini)",
};

function normalizeUnit(unitString) {
    if (typeof unitString !== 'string') return "";
    const lowerUnit = unitString.toLowerCase().trim();
    return UNIT_STANDARDIZATION[lowerUnit] || unitString; // Return original if not found
}

function normalizeIngredientName(nameString) {
    if (typeof nameString !== 'string') return "";
    let lowerName = nameString.toLowerCase().trim();

    // Remove details in parentheses, e.g., "Eier (Größe M)" -> "eier"
    // Also remove content after comma if it seems like a brand or detail
    // e.g. "ja! Weizenmehl, Type 405" -> "ja! weizenmehl"
    lowerName = lowerName.replace(/\s*\(.*?\)\s*/g, '').trim();
    // lowerName = lowerName.split(',')[0].trim(); // Be careful with this, might remove essential info

    // Specific known brand/prefix removals that are safe
    const prefixesToRemove = ["ja! ", "feine welt ", "wilhelm brandenburg "];
    for (const prefix of prefixesToRemove) {
        if (lowerName.startsWith(prefix)) {
            lowerName = lowerName.substring(prefix.length).trim();
        }
    }

    // Remove trailing descriptive words that are often part of units or quantities already handled
    // e.g. "Spinat tiefgefrorener" -> "Spinat" (if "tiefgefrorener" is not part of a specific product type)
    // This is risky and needs a well-defined list. For now, focus on synonyms.

    // Check against synonyms
    if (INGREDIENT_SYNONYMS[lowerName]) {
        return INGREDIENT_SYNONYMS[lowerName];
    }

    // Try to find a synonym by iterating if direct match failed (e.g. "Frische Petersilie" -> "Petersilie")
    for (const key in INGREDIENT_SYNONYMS) {
        if (lowerName.includes(key)) {
            // Ensure it's a meaningful part, not just "ei" in "weisswein"
            const regex = new RegExp(`\\b${key}\\b`);
            if (regex.test(lowerName)) {
                 // Could be more sophisticated, e.g. longest match, but for now, first meaningful match
                return INGREDIENT_SYNONYMS[key];
            }
        }
    }

    // Basic pluralization to singular for some common cases if no synonym found
    // This is very rudimentary and needs expansion or a library for robustness
    if (lowerName.endsWith('n') && !lowerName.endsWith('nen') && lowerName.length > 3) { // avoid "huhn" -> "huh"
        const singularAttempt = lowerName.slice(0, -1);
        if (INGREDIENT_SYNONYMS[singularAttempt]) { // Check if singular form is a known synonym key
            return INGREDIENT_SYNONYMS[singularAttempt];
        }
        // else return lowerName; // if singular not in synonyms, stick to original plural
    }


    return lowerName.charAt(0).toUpperCase() + lowerName.slice(1); // Capitalize first letter for consistency
}


function convertToBaseUnit(quantity, unit, ingredientName) {
    const normalizedName = normalizeIngredientName(ingredientName).toLowerCase(); // Ensure name is normalized for lookup
    const standardUnit = normalizeUnit(unit);

    // Attempt ingredient-specific conversion first (e.g., Bund Petersilie to g)
    if (INGREDIENT_SPECIFIC_CONVERSIONS[normalizedName] && INGREDIENT_SPECIFIC_CONVERSIONS[normalizedName][standardUnit]) {
        const conversions = INGREDIENT_SPECIFIC_CONVERSIONS[normalizedName][standardUnit];
        const targetUnit = Object.keys(conversions)[0]; // Assuming one target base unit, e.g., "g"
        const factor = conversions[targetUnit];
        return {
            quantity: quantity * factor,
            unit: targetUnit,
            converted: true
        };
    }

    // Attempt general base unit conversion (e.g., kg to g, EL to ml)
    if (BASE_UNIT_CONVERSIONS[standardUnit]) {
        const preferredConversions = { // Define preferred base units
            "kg": "g",
            "l": "ml",
            "el": "ml",
            "tl": "ml"
        };

        let targetUnit = preferredConversions[standardUnit];
        // Check if a preferred conversion exists for the current standardUnit
        // And if the specific conversion factor is defined in BASE_UNIT_CONVERSIONS
        if (targetUnit && BASE_UNIT_CONVERSIONS[standardUnit] && BASE_UNIT_CONVERSIONS[standardUnit][targetUnit]) {
            const factor = BASE_UNIT_CONVERSIONS[standardUnit][targetUnit];
            return {
                quantity: quantity * factor,
                unit: targetUnit,
                converted: true
            };
        }
    }

    return {
        quantity: quantity,
        unit: standardUnit, // Return the standardized unit even if no conversion happened
        converted: false
    };
}


// Make functions available for import in logic.js if using modules, or globally for script tags
// For now, assuming global scope via script tags in index.html
// If using Node.js for testing:
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        normalizeUnit,
        normalizeIngredientName,
        convertToBaseUnit,
        UNIT_STANDARDIZATION,
        INGREDIENT_SYNONYMS,
        INGREDIENT_SPECIFIC_CONVERSIONS,
        BASE_UNIT_CONVERSIONS
    };
}
console.log("ingredientMatcher.js loaded");
