// jest.setup.js

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}), // Default empty object for JSON response
  })
);

// Mock ui.js functions that are heavily DOM-related or we don't want to test here
// This is necessary because app.js calls ui functions directly.
// In a more complex setup, we might try to import and mock ui.js itself.
// For now, global mocks for functions app.js expects from ui.js.
global.ui = {
  renderDashboard: jest.fn(),
  updateConfirmButtonState: jest.fn(),
  switchView: jest.fn(),
  showApp: jest.fn(),
  setButtonLoadingState: jest.fn(),
  openRecipeModal: jest.fn(),
  renderShoppingList: jest.fn(),
  renderInventoryResults: jest.fn(),
  clearInventoryResults: jest.fn(),
};

// Mock logic.js functions - app.js calls these.
// We've already unit-tested logic.js, so we mock its functions here.
// This assumes logic.js functions are available globally when app.js runs,
// or app.js would need to be modified to import them if we were testing it as a module.
// Since app.js includes logic.js via a script tag, its functions become global.
global.generateWeeklyPlan = jest.fn(() => []); // Default to returning an empty plan
global.generateShoppingList = jest.fn(() => []); // Default to returning an empty list
global.findAlmostCompleteRecipes = jest.fn(() => []); // Default to returning empty matches

// Prevent console.error and console.warn from polluting test output during app.js tests
// (e.g., from failed fetches if not properly mocked, or warnings from logic.js)
jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});

// Reset mocks before each test
beforeEach(() => {
  localStorageMock.clear();
  global.fetch.mockClear().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    })
  );

  // Reset UI and Logic mocks
  Object.values(global.ui).forEach(mockFn => mockFn.mockClear());
  global.generateWeeklyPlan.mockClear().mockReturnValue([]);
  global.generateShoppingList.mockClear().mockReturnValue([]);
  global.findAlmostCompleteRecipes.mockClear().mockReturnValue([]);

  console.error.mockClear();
  console.warn.mockClear();
});
