class SearchView {
  #parentEl = document.querySelector('.search');

  /**
   * Gets query value from the search input field.
   * @returns {string} Search query value
   */
  getQuery() {
    const query = this.#parentEl.querySelector('.search__field').value;
    this.#clearInput();
    return query;
  }

  /** Clears the search input field. */
  #clearInput() {
    this.#parentEl.querySelector('.search__field').value = '';
  }

  /**
   * Adds event listener to search for specific query on the search form submit.
   * @param {callback} handler
   */
  addHandlerSearch(handler) {
    this.#parentEl.addEventListener('submit', (e) => {
      e.preventDefault();
      handler();
    });
  }
}

export default new SearchView();
