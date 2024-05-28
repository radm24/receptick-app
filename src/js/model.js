import {
  API_URL,
  RES_PER_PAGE,
  SPOONACULAR_ENDPOINT,
  SHOP_LIST_MAX_ITEMS,
} from './config.js';
import { AJAX, getCurrentDateTS } from './helpers.js';

const state = {
  currentDateTS: null,
  theme: 'light',
  recipe: {},
  search: {
    query: '',
    results: [],
    page: 1,
    resultsPerPage: RES_PER_PAGE,
  },
  bookmarks: [],
  shoppingList: [],
  mealPlanner: {
    recipes: [],
    dates: {},
  },
};

////////// HELPER FUNCTIONS //////////

const reformatRecipeObject = (recipeObj, fromAPI = true) => {
  let reformattedRecipeObj;
  if (fromAPI) {
    reformattedRecipeObj = (({
      createdAt, // throw away
      source_url: sourceUrl,
      image_url: image,
      cooking_time: cookingTime,
      ...recipeProps
    }) => ({ sourceUrl, image, cookingTime, ...recipeProps }))(recipeObj);
  } else {
    reformattedRecipeObj = (({
      sourceUrl: source_url,
      image: image_url,
      cookingTime: cooking_time,
      ...recipeProps
    }) => ({ source_url, image_url, cooking_time, ...recipeProps }))(recipeObj);
  }

  return reformattedRecipeObj;
};

const getNutrientAmountPerServing = (
  ingredientsData,
  nutrientName,
  servings
) => {
  const total = ingredientsData
    .map(
      ({ nutrition }) =>
        nutrition?.nutrients.find(
          (nutr) => nutr.name.toLowerCase() === nutrientName
        )?.amount ?? 0
    )
    .reduce((acc, amount) => acc + amount, 0);

  return Math.floor(total / servings);
};

const getIngredientsNutritionalData = async ({ ingredients, servings }) => {
  try {
    // Convert ingredients object into string for spoonacular API
    const ingredientList = ingredients
      .map(
        ({ quantity, unit, description }) =>
          `${quantity ?? ''} ${unit ?? ''} ${description}`
      )
      .join('\n');

    // Get nutritional data of specified ingredients from spoonacular API
    const spoonacularURL = `${SPOONACULAR_ENDPOINT}?apiKey=${process.env.SPOONACULAR_API_KEY}`;
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        ingredientList,
        servings,
        includeNutrition: true,
      }),
    };
    const ingredientsData = await AJAX(spoonacularURL, options);

    // Get amount of specified nutrients for per serving
    const nutrientNames = ['calories', 'carbohydrates', 'protein', 'fat'];

    const [calories, carbs, protein, fat] = nutrientNames.map((nutrient) =>
      getNutrientAmountPerServing(ingredientsData, nutrient, servings)
    );

    return { calories, carbs, protein, fat };
  } catch (err) {
    throw err;
  }
};

////////// RECIPE //////////

const loadRecipe = async (recipeId) => {
  try {
    // Get recipe data from forkify API
    const data = await AJAX(`${API_URL}${recipeId}?key=${process.env.API_KEY}`);

    // Get total amount of meal nutrients
    const nutrients = await getIngredientsNutritionalData(data.data.recipe);

    // Check if the recipe is bookmarked
    const bookmarked = state.bookmarks.some(({ id }) => id === recipeId);

    // Save recipe data to the app state
    state.recipe = {
      ...reformatRecipeObject(data.data.recipe),
      nutrients,
      bookmarked,
    };
  } catch (err) {
    throw err;
  }
};

const updateServings = (newServings) => {
  state.recipe.ingredients.forEach((ing) => {
    ing.quantity = (ing.quantity * newServings) / state.recipe.servings;
  });

  state.recipe.servings = newServings;
};

////////// SEARCH RESULTS //////////

const loadSearchResults = async (query) => {
  try {
    state.search.page = 1; // Reset pagination state
    state.search.query = query;

    const data = await AJAX(
      `${API_URL}?search=${query}&key=${process.env.API_KEY}`
    );

    state.search.results = data.data.recipes.map(
      ({ image_url: image, ...recipeProps }) => ({
        ...recipeProps,
        image,
      })
    );
  } catch (err) {
    throw err;
  }
};

const getSearchResultsPage = (page = state.search.page) => {
  state.search.page = page;

  const start = (page - 1) * state.search.resultsPerPage; // 0
  const end = page * state.search.resultsPerPage; // 9
  return state.search.results.slice(start, end);
};

////////// BOOKMARKS //////////

const updateBookmark = () => {
  // Get 'bookmarked' flag of the current recipe
  const { bookmarked, ...recipeProps } = state.recipe;

  if (bookmarked) {
    // Remove bookmark
    const idx = state.bookmarks.findIndex(({ id }) => id === recipeProps.id);
    state.bookmarks.splice(idx, 1);
  } else {
    // Add bookmark
    state.bookmarks.push(recipeProps);
  }

  // Mark the recipe as bookmarked or unbookmarked
  state.recipe.bookmarked = !bookmarked;

  // Save bookmarks data to local storage
  saveBookmarks();
};

const saveBookmarks = () => {
  localStorage.setItem('bookmarks', JSON.stringify(state.bookmarks));
};

const loadBookmarks = () => {
  const bookmarks = JSON.parse(localStorage.getItem('bookmarks'));
  if (bookmarks) state.bookmarks = bookmarks;
};

////////// UPLOAD RECIPE //////////

const uploadRecipe = async (newRecipe) => {
  try {
    // Separate recipe props and ingredients data
    const recipePropsObj = {};
    const ingsObj = {};

    for (const [key, value] of Object.entries(newRecipe)) {
      if (key.startsWith('ing')) {
        ingsObj[key] = value;
      } else {
        recipePropsObj[key] = value;
      }
    }

    // Extracting ingredients data
    const ingredients = [];
    for (let i = 1; i <= Object.keys(ingsObj).length / 3; i++) {
      const {
        [`ing-${i}-quantity`]: quantity,
        [`ing-${i}-unit`]: unit,
        [`ing-${i}-description`]: description,
      } = ingsObj;
      if (description)
        ingredients.push({
          quantity: quantity ? +quantity : null,
          unit,
          description,
        });
    }

    // Reformatting recipe data to API data format
    const recipe = {
      ...reformatRecipeObject(recipePropsObj, false),
      ingredients,
    };

    // Upload user recipe data and save
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recipe),
    };
    const data = await AJAX(`${API_URL}?key=${process.env.API_KEY}`, options);

    // Get total amount of meal nutrients
    const nutrients = await getIngredientsNutritionalData(data.data.recipe);

    state.recipe = {
      ...reformatRecipeObject(data.data.recipe),
      nutrients,
    };

    // Bookmark the uploaded recipe
    updateBookmark();
  } catch (err) {
    throw err;
  }
};

////////// THEME //////////

const updateTheme = (newTheme) => {
  // Update app state theme value
  state.theme = newTheme;

  // Save theme data to local storage
  saveTheme();
};

const saveTheme = () => {
  localStorage.setItem('theme', state.theme);
};

const loadTheme = () => {
  const theme = localStorage.getItem('theme');
  if (theme && theme !== 'light') state.theme = theme;
};

////////// SHOPPING LIST //////////

const addIngredientsToShoppingList = () => {
  const ingredients = state.recipe.ingredients.map((ing) => {
    return {
      item: Object.values(ing).filter(Boolean).join(' ').trim(),
      checked: false,
    };
  });

  // Check if ingredients limit is not exceeding
  if (state.shoppingList.length + ingredients.length > SHOP_LIST_MAX_ITEMS) {
    const errorMsg = `Cannot be more than ${SHOP_LIST_MAX_ITEMS} ingredients in the shopping list.`;
    return errorMsg;
  }

  state.shoppingList.push(...ingredients);
  saveShoppingList();
};

const updateShoppingList = (newList) => {
  // Get names of non-empty text inputs
  const itemKeys = Object.keys(newList).filter(
    (key) => key.startsWith('item-') && newList[key]
  );

  const itemsArr = itemKeys.map((itemKey) => {
    const id = itemKey.slice(5); // 'item-id'
    if (!newList[itemKey]) return;

    return {
      item: newList[itemKey],
      checked: !!newList[`checked-${id}`],
    };
  });

  state.shoppingList = itemsArr;

  // Save shopping list data to local storage
  saveShoppingList();
};

const saveShoppingList = () => {
  localStorage.setItem('shopping-list', JSON.stringify(state.shoppingList));
};

const loadShoppingList = () => {
  const list = JSON.parse(localStorage.getItem('shopping-list'));
  if (list) state.shoppingList = list;
};

////////// MEAL PLANNER //////////

const setCurrentDate = () => (state.currentDateTS = getCurrentDateTS());

const checkUpdateCurrentDate = () => {
  let forceRender;
  const todayTS = getCurrentDateTS();

  if (todayTS !== state.currentDateTS) {
    state.currentDateTS = todayTS;
    filterPlannerDatesAndSave(state.mealPlanner);
    forceRender = true;
  }
  return forceRender;
};

const filterPlannerDatesAndSave = (planner, init) => {
  // Check and remove days before today's date
  const filteredRecipes = planner.recipes.filter(
    ({ date }) => state.currentDateTS <= Date.parse(date)
  );

  if (filteredRecipes.length === planner.recipes.length) {
    // Check if it is application initial load
    if (init) state.mealPlanner = planner;
    return;
  }

  const filteredDatesEntries = Object.entries(planner.dates).filter(
    ([date]) => Date.parse(date) >= state.currentDateTS
  );
  const filteredDates = Object.fromEntries(filteredDatesEntries);

  state.mealPlanner = { recipes: filteredRecipes, dates: filteredDates };
  savePlanner();
};

const addRecipeToPlanner = (date) => {
  const { recipes, dates } = state.mealPlanner;
  const { id: recipeId, image, title } = state.recipe;
  const id = Date.now();

  recipes.push({ id, recipeId, date });
  dates[date] = [...(dates[date] || []), { id, recipeId, image, title }];

  savePlanner();
};

const removeRecipeFromPlanner = (removeId) => {
  const { recipes, dates } = state.mealPlanner;

  // Remove item from recipes array
  let idx = recipes.findIndex(({ id }) => id === removeId);
  const date = recipes[idx]?.date;

  // Return if date is past
  if (!date) return;

  recipes.splice(idx, 1);

  // Remove item from dates object
  idx = dates[date].findIndex(({ id }) => id === removeId);
  dates[date].splice(idx, 1);

  // Remove day if there are no recipes on that day
  if (!dates[date].length) delete dates[date];

  savePlanner();

  return date;
};

const savePlanner = () => {
  localStorage.setItem('meal-planner', JSON.stringify(state.mealPlanner));
};

const loadPlanner = () => {
  setCurrentDate();

  const planner = JSON.parse(localStorage.getItem('meal-planner'));
  if (!planner) return;

  filterPlannerDatesAndSave(planner, true);
};

export {
  state,
  loadRecipe,
  updateServings,
  loadSearchResults,
  getSearchResultsPage,
  updateBookmark,
  loadBookmarks,
  uploadRecipe,
  updateTheme,
  loadTheme,
  addIngredientsToShoppingList,
  updateShoppingList,
  loadShoppingList,
  checkUpdateCurrentDate,
  addRecipeToPlanner,
  removeRecipeFromPlanner,
  loadPlanner,
};
