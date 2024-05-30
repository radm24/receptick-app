import RenderView from './RenderView.js';
import icons from '../../img/icons.svg';

class PaginationView extends RenderView {
  _parentElement = document.querySelector('.pagination');

  /**
   * Adds event listener to change page of search results on the 'pagination' buttons click.
   * @param {callback} handler
   */
  addHandlerClick(handler) {
    this._parentElement.addEventListener('click', (e) => {
      const btn = e.target.closest('.pagination__btn');
      if (btn) handler(+btn.dataset.goto);
    });
  }

  /**
   * Generates 'Pagination' component.
   * @returns {string} Markup of the component in string format
   */
  _generateMarkup() {
    const { page, results, resultsPerPage } = this._data;
    const numPages = Math.ceil(results.length / resultsPerPage);

    return !results.length
      ? ''
      : `
      <button class="btn--inline pagination__btn ${
        page === 1 ? 'hidden btn--disabled' : ''
      }" data-goto="${page - 1}">
        <svg class="search__icon">
            <use href="${icons}#icon-arrow-left"></use>
        </svg>
        <span>Page ${page - 1}</span>
      </button>

      <span class="pagination__page">${page} of ${numPages}</span>

      <button class="btn--inline pagination__btn ${
        page === numPages ? 'hidden btn--disabled' : ''
      }" data-goto="${page + 1}">
          <span>Page ${page + 1}</span>
          <svg class="search__icon">
              <use href="${icons}#icon-arrow-right"></use>
          </svg>
      </button>
    `;
  }
}

export default new PaginationView();
