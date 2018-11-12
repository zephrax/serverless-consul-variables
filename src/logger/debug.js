
import debugLib from 'debug';
import {createPrefix} from './utils';

/**
 * Create debug instance
 * @param {string} filepath File path
 * @return {debug} New debug instance
 */
export default function createDebug(filepath) {
    return debugLib(createPrefix(filepath));
}
