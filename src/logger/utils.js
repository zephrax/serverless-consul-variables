import path from 'path';

const PROJECT_DIR = path.resolve(__dirname, '..');

export const createPrefix = function(filename) {
    let prefix = 'serverless.consul.variables';
    let pathDesc = path.relative(PROJECT_DIR, filename)
        .replace('/', '.')
        .replace(/(?:index)?\.js$/, '')
    ;
    prefix += `:${pathDesc}`;
    return prefix
        .replace(/[^a-z0-9\\.:]/ig, '')
        .replace(/[.]{2,}/g, '.')
        .replace(/[.]$/, '')
    ;
};
