import RenderView from './RenderView.js';
import previewView from './previewView.js';

class BookmarksView extends RenderView {
  _parentElement = document.querySelector('.bookmarks__list');
  _errorMessage = 'No bookmarks yet. Find a nice recipe and bookmark it :)';

  /**
   * Generates 'Bookmarks List' component.
   * @returns {string} Markup of the component in string format
   */
  _generateMarkup() {
    return this._data.map(previewView.generateMarkup).join('');
  }
}

export default new BookmarksView();
