export const store = {
    getItem: (key) => {
        const item = localStorage.getItem(key);
        try {
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error(`Error parsing JSON from localStorage key "${key}":`, e);
            return null;
        }
    },
    setItem: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Error setting JSON to localStorage key "${key}":`, e);
        }
    },
    removeItem: (key) => {
        localStorage.removeItem(key);
    }
};

// Specific getters/setters can be added here if more complex logic is needed
// For example, providing default values or performing validation.

export function getWeeklyPlan() {
    return store.getItem('weeklyPlan') || null;
}

export function setWeeklyPlan(plan) {
    store.setItem('weeklyPlan', plan);
}

export function getUserPantry() {
    return store.getItem('userPantry') || [];
}

export function setUserPantry(pantry) {
    store.setItem('userPantry', pantry);
}

export function getTheme() {
    return store.getItem('theme');
}

export function setTheme(theme) {
    store.setItem('theme', theme);
}

export function getPersons() {
    // Ensure 'persons' is a string and defaults to '2' if invalid or not set.
    let persons = store.getItem('persons') || '2';
    if (persons !== '2' && persons !== '4') {
        persons = '2';
    }
    return persons;
}

export function setPersons(personsVal) {
    // Ensure 'persons' is stored as a string '2' or '4'.
    let valToStore = '2';
    if (personsVal === '4' || parseInt(personsVal, 10) === 4) {
        valToStore = '4';
    }
    store.setItem('persons', valToStore);
}
