import { combineReducers } from 'redux';

import walletReducer from './wallet/reducer';
import feedbackReducer from './feedback_reducer';

const rootReducer = combineReducers({
    wallet: walletReducer,
    feedback: feedbackReducer
});

export default rootReducer;
