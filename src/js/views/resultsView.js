import RenderView from './RenderView.js';
import previewView from './previewView.js';

class ResultsView extends RenderView {
  _parentElement = document.querySelector('.results');
  _errorMessage = 'No recipes found for your query! Please try again!';

  update(...args) {
    const searchResult = !!this._parentElement.querySelector('.preview');
    if (searchResult) super.update(...args);
  }

  _generateMarkup() {
    return this._data.map(previewView.generateMarkup).join('');
  }
}

export default new ResultsView();
