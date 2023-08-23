import {
    CHANGE_WALLET,
    UPDATE_ADDRESS,
    CHAIN_ADDRESS_STORE,
    CHANGE_NETWORK,
    UPDATE_ADMIN_ADDR,
    UPDATE_GOVERNANCE_ADDR
} from './types';

export const changeWallet = (value) => {
    return {
        type: CHANGE_WALLET,
        payload: value
    };
};

export const updateAddress = (value) => {
    return {
        type: UPDATE_ADDRESS,
        payload: value
    };
};

export const addChainAddressStore = (value) => {
    return {
        type: CHAIN_ADDRESS_STORE,
        payload: value
    };
};

export const changeNetwork = (value) => {
    return {
        type: CHANGE_NETWORK,
        payload: value
    };
};

export const updateAdminAddr = (value) => {
    return {
        type: UPDATE_ADMIN_ADDR,
        payload: value
    };
};

export const updateGovernanceAddr = (value) => {
    return {
        type: UPDATE_GOVERNANCE_ADDR,
        payload: value
    };
};
