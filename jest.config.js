module.exports = {
    moduleFileExtensions: [
        'js',
        'ts',
        'json',
    ],
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
    transformIgnorePatterns: [
        "<rootDir>/node_modules/(?!@assemblyscript/.*)"
    ],
    transform: {
        // '^.+\\.ts$': 'ts-jest',
        // '^.+\\.(ts|js)$': 'ts-jest',
        "^.+\\.(t|j)sx?$": "@swc/jest"
    }
}
