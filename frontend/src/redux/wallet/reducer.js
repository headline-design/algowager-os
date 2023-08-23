import {
    CHANGE_WALLET,
    UPDATE_ADDRESS,
    CHAIN_ADDRESS_STORE,
    CHANGE_NETWORK,
    UPDATE_ADMIN_ADDR,
    UPDATE_GOVERNANCE_ADDR
} from './types';

const INITIAL_WALLET_STATE = {
    selected: null,
    address: '',
    is_admin_logged: false,
    account_store: [],
    selected_network: null,
    admin_addr: null,
    governance_addr: null
};

const reducer = (state = INITIAL_WALLET_STATE, action) => {
    switch (action.type) {
        case CHANGE_WALLET:
            return {
                ...state,
                selected: action.payload
            };
        case UPDATE_ADDRESS:
            let admin = false;
            // admin logged in
            if (action.payload === state.admin_addr) {
                admin = true;
            }
            return {
                ...state,
                address: action.payload,
                is_admin_logged: admin
            };
        case CHAIN_ADDRESS_STORE:
            return {
                ...state,
                account_store: action.payload
            };
        case CHANGE_NETWORK:
            return {
                ...state,
                selected_network: action.payload
            };
        case UPDATE_ADMIN_ADDR:
            return {
                ...state,
                admin_addr: action.payload
            };
        case UPDATE_GOVERNANCE_ADDR:
            return {
                ...state,
                governance_addr: action.payload
            };
        default:
            return state;
    }
};

export default reducer;
