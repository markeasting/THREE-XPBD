module.exports = {
    moduleFileExtensions: [
        'js',
        'ts',
        'json',
    ],
    extensionsToTreatAsEsm: ['.ts'],
    transformIgnorePatterns: [],
    transform: {
        "^.+\\.(t|j)sx?$": "@swc/jest"
    }
}
