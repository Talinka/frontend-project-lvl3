import 'bootstrap/dist/css/bootstrap.min.css';
import app from './application';
import {
  inputChangeHandle,
  addFeedHandle,
  updateFeedsHandle,
  renderer,
} from './renders';

app(renderer, addFeedHandle, inputChangeHandle, updateFeedsHandle);
