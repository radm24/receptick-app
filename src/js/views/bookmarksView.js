import RenderView from './RenderView.js';
import previewView from './previewView.js';

class BookmarksView extends RenderView {
  _parentElement = document.querySelector('.bookmarks__list');
  _errorMessage = 'No bookmarks yet. Find a nice recipe and bookmark it :)';

  _generateMarkup() {
    return this._data.map(previewView.generateMarkup).join('');
  }
}

export default new BookmarksView();
