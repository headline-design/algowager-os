export const ADD_ERROR = 'Add Error';
export const REMOVE_ERROR = 'Remove Error';
export const ADD_SUCCESS = 'Add Success';
export const REMOVE_SUCCESS = 'Remove Success';

export const addError = (value) => {
    return {
        type: ADD_ERROR,
        payload: value
    };
};

export const removeError = () => {
    return {
        type: REMOVE_ERROR
    };
};

export const addSuccess = (value) => {
    return {
        type: ADD_SUCCESS,
        payload: value
    };
};

export const removeSuccess = () => {
    return {
        type: REMOVE_SUCCESS
    };
};

const reducer = (state = { error: '', success: '' }, action) => {
    switch (action.type) {
        case ADD_ERROR:
            return {
                ...state,
                error: action.payload
            };

        case REMOVE_ERROR:
            return {
                ...state,
                error: ''
            };

        case ADD_SUCCESS:
            return {
                ...state,
                success: action.payload
            };

        case REMOVE_SUCCESS:
            return {
                ...state,
                success: ''
            };

        default:
            return state;
    }
};

export default reducer;
