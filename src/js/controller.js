// Support old browsers
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import { jsPDF } from 'jspdf';

import * as model from './model.js';
import { MODAL_CLOSE_SEC, PLANNER_MAX_ITEMS_PER_DAY } from './config.js';
import searchView from './views/searchView.js';
import resultsView from './views/resultsView.js';
import paginationView from './views/paginationView.js';
import recipeView from './views/recipeView.js';
import bookmarksView from './views/bookmarksView.js';
import addRecipeView from './views/addRecipeView.js';
import themeView from './views/themeView.js';
import shoppingListView from './views/shoppingListView.js';
import plannerView from './views/plannerView.js';
import errorView from './views/errorView.js';

////////// RECIPE //////////

const renderRecipe = (recipeId) => {
  recipeView.render(model.state.recipe);

  // Add event handlers for servings, planner, bookmark and ingredients buttons
  recipeView.addHandlerUpdateServings(controlServings);
  recipeView.addHandlerBookmark(controlUpdateBookmark);
  recipeView.addHandlerIngredients(controlAddIngredientsToShoppingList);

  // Check if the recipe has been added to meal planner and if so then indicate such days on datepicker
  const recipePlannerDays = model.state.mealPlanner.recipes
    .filter(({ recipeId: id }) => id === recipeId)
    .map(({ date }) => new Date(date));
  recipeView.addHandlerPlanner(recipePlannerDays, controlAddRecipeToPlanner);
};

const controlRecipe = async () => {
  try {
    const recipeId = window.location.hash.slice(1);
    if (!recipeId) return;

    recipeView.renderSpinner();

    // 1. Update results view to mark selected search result (recipe) as active
    resultsView.update(model.getSearchResultsPage());
    bookmarksView.update(model.state.bookmarks);
    if (model.state.mealPlanner.recipes.length)
      plannerView.update(model.state.mealPlanner.dates);

    // 2. Loading recipe
    await model.loadRecipe(recipeId);

    // 3. Rendering recipe
    renderRecipe(recipeId);
  } catch (err) {
    console.error(err);
    recipeView.renderError();
  }
};

const controlServings = (newServings) => {
  // Update the recipe servings (in state)
  model.updateServings(newServings);

  // Update the recipe view
  recipeView.update(model.state.recipe);
};

const controlAddRecipeToPlanner = (date) => {
  if (
    model.state.mealPlanner.dates[date]?.length >= PLANNER_MAX_ITEMS_PER_DAY
  ) {
    const errorMsg = `The limit for ${date} has been reached ( ${PLANNER_MAX_ITEMS_PER_DAY} items / day )`;
    errorView.show(errorMsg);
  } else {
    model.addRecipeToPlanner(date);
    recipeView.updateDatePickerEvents(date, 'add');
    plannerView.render(model.state.mealPlanner.dates);
  }
};

const controlUpdateBookmark = () => {
  // Add / remove bookmark
  model.updateBookmark();

  // Update the recipe view
  recipeView.update(model.state.recipe);

  // Render bookmarks
  bookmarksView.render(model.state.bookmarks);
};

const controlAddIngredientsToShoppingList = () => {
  // Add recipe ingredients to shopping list
  const errorMsg = model.addIngredientsToShoppingList();

  // If ingredients limit has been exceeded then show error message
  if (errorMsg) errorView.show(errorMsg);
  else renderShoppingList();
};

////////// SEARCH RESULTS //////////

const controlSearchResults = async () => {
  try {
    // 1. Get search query
    const query = searchView.getQuery();
    if (!query) return;

    // 2. Render a spinner
    resultsView.renderSpinner();

    // 3. Load search results
    await model.loadSearchResults(query);

    // 4. Render search results and pagination buttons
    resultsView.render(model.getSearchResultsPage());
    paginationView.render(model.state.search);
  } catch (err) {
    resultsView.renderError();
  }
};

const controlPagination = (goToPage) => {
  // Update search results and pagination buttons
  resultsView.update(model.getSearchResultsPage(goToPage));
  paginationView.update(model.state.search);
};

////////// UPLOAD RECIPE //////////

const controlAddRecipe = async (newRecipe) => {
  try {
    addRecipeView.renderSpinner();

    // Upload the new recipe data
    await model.uploadRecipe(newRecipe);

    // Render newly created recipe and update bookmarks view
    renderRecipe();
    bookmarksView.render(model.state.bookmarks);

    // Display success message
    addRecipeView.renderMessage();

    // Change ID in URL
    window.history.pushState(null, '', `#${model.state.recipe.id}`);

    // Close modal window
    setTimeout(
      addRecipeView.closeModal.bind(addRecipeView),
      MODAL_CLOSE_SEC * 1000
    );
  } catch (err) {
    addRecipeView.renderError(err.message);
  }
};

////////// THEME //////////

const controlToggleTheme = (newTheme) => {
  model.updateTheme(newTheme);
};

////////// SHOPPING LIST //////////

const renderShoppingList = () => {
  if (!model.state.shoppingList.length) shoppingListView.renderMessage();
  else shoppingListView.update(model.state.shoppingList);
};

const controlCloseShoppingListOnEditMode = () => {
  renderShoppingList();
};

const controlUpdateShoppingList = (newList) => {
  model.updateShoppingList(newList);
  renderShoppingList();
};

const controlDownloadShoppingList = () => {
  if (!model.state.shoppingList.length) return;

  // A4 papep dimensions: 210 x 297 mm
  const opts = {
    xL1: 20, // start point of line (x-axis)
    xT1: 22, // start point of text (x-axis)
    xL2: 190, // rightmost point of line (x-axis)
    xT2: 188, // rightmost point of text (x-axis)
    y1: 15, // start point of line / text (y-axis)
    y2: 282, // the lowest point (y-axis): 297 - 15
    padBottom: 4,
    padTop: 1,
    padCrossLine: 1.5,
  };

  const pdf = new jsPDF();
  pdf.setDrawColor(
    getComputedStyle(document.body).getPropertyValue('--color-text--2')
  );

  model.state.shoppingList.forEach(({ item, checked }) => {
    // Doing calculations for dynamic coordinates
    const lineHeight = pdf.getLineHeight(item) / pdf.internal.scaleFactor;
    const splittedText = pdf.splitTextToSize(item, opts.xT2 - opts.xT1);
    const lines = splittedText.length; // splitted text is a string array
    const blockHeight = lines * lineHeight;

    // Check if there is enough space for new text
    if (opts.y1 + blockHeight >= opts.y2) {
      pdf.addPage(); // adding new page to the pdf document
      opts.y1 = 15; // reset height position
    }

    // Print item value
    pdf.text(splittedText, opts.xT1, opts.y1);

    if (checked) {
      for (let i = 0; i < lines; i++) {
        const padLine = i * lineHeight;

        // Cross out item value
        opts.y1 -= opts.padCrossLine;
        pdf.setLineWidth(0.5);
        pdf.setDrawColor(231, 30, 44); // --color-primary--1
        pdf.line(opts.xL1, opts.y1 + padLine, opts.xL2, opts.y1 + padLine);
        pdf.setLineWidth(0);
        pdf.setDrawColor(145, 133, 129);
        opts.y1 += opts.padCrossLine;
      }
    }

    opts.y1 += blockHeight - lineHeight + opts.padBottom;

    // Print underline line
    pdf.line(opts.xL1, opts.y1, opts.xL2, opts.y1);
    opts.y1 += lineHeight + opts.padTop;
  });

  pdf.save('shopping-list.pdf');
};

////////// MEAL PLANNER //////////

const updatePlannerToCurrentDate = () => {
  if (!model.state.mealPlanner.recipes.length) plannerView.renderMessage();
  else plannerView.render(model.state.mealPlanner.dates);

  // If there is an active recipe then check and update its datepicker events
  const curRecipeId = window.location.hash.slice(1);
  if (curRecipeId)
    recipeView.updateDatePickerEvents(
      new Date(model.state.currentDateTS),
      'update'
    );
};

const controlCheckUpdateCurrentDate = () => {
  // Check if today's date is changed
  const forceRender = model.checkUpdateCurrentDate();
  if (forceRender) updatePlannerToCurrentDate();
};

const controlRemoveRecipeFromPlanner = (id, forceRender, isActiveRecipe) => {
  // Check if today's date is changed
  controlCheckUpdateCurrentDate();

  const date = model.removeRecipeFromPlanner(id);

  // Return if date is past
  if (!date) return;

  if (!model.state.mealPlanner.recipes.length) plannerView.renderMessage();
  else if (forceRender) plannerView.render(model.state.mealPlanner.dates);

  // Consider the datepicker for updating if entry of the active recipe was removed
  if (!isActiveRecipe) return;
  const curRecipeId = window.location.hash.slice(1);

  // Remove specified day from datepicker events if there are no the recipe entries at that day
  const entries = model.state.mealPlanner.dates[date]?.some(
    ({ recipeId }) => recipeId === curRecipeId
  );
  if (!entries) recipeView.updateDatePickerEvents(date, 'remove');
};

const init = () => {
  const state = model.state;

  // Load bookmarks data from local storage
  model.loadBookmarks();
  if (state.bookmarks.length) bookmarksView.render(state.bookmarks);

  // Load theme data from local storage
  model.loadTheme();
  if (state.theme !== 'light') themeView.setTheme(state.theme);

  // Load shopping list data from local storage
  model.loadShoppingList();
  if (state.shoppingList.length) shoppingListView.render(state.shoppingList);

  // Load meal planner data from local storage
  model.loadPlanner();
  if (state.mealPlanner.recipes.length)
    plannerView.render(model.state.mealPlanner.dates);

  searchView.addHandlerSearch(controlSearchResults);
  paginationView.addHandlerClick(controlPagination);
  recipeView.addHandlerRender(controlRecipe);
  addRecipeView.addHandlerUpload(controlAddRecipe);
  themeView.addHandlerToggleTheme(controlToggleTheme);
  shoppingListView.addHandlerCloseModal(controlCloseShoppingListOnEditMode);
  shoppingListView.addHandlerUpdateList(controlUpdateShoppingList);
  shoppingListView.addHandlerDownloadList(controlDownloadShoppingList);
  plannerView.addHandlerShowModal(controlCheckUpdateCurrentDate);
  plannerView.addHandlerRemoveRecipe(controlRemoveRecipeFromPlanner);
};

init();
