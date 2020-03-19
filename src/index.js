import 'bootstrap/dist/css/bootstrap.min.css';
import app from './application';
import {
  inputChangeHandle,
  addFeedHandle,
  updateFeedsHandle,
  renderer,
} from './render';

app(renderer, addFeedHandle, inputChangeHandle, updateFeedsHandle);
