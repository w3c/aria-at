/**
 * @typedef CommandRelated
 * @property {CommandDecoded} decoded
 * @property {KeyRelated} key
 * @property {CommandsRelated[]} commands
 */

/**
 * @typedef CommandsRelated
 * @property {CommandsDecoded} decoded
 * @property {AssistiveTechRelated} assistiveTech
 * @property {CommandRelated[]} commands
 */

/**
 * @typedef ReferenceRelated
 * @property {ReferenceDecoded} decoded
 * @property {TestRelated[]} tests
 */

/**
 * @typedef TestRelated
 * @property {TestDecoded} decoded
 * @property {AssistiveTechRelated[]} appliesTo
 * @property {CommandsRelated[]} task
 * @property {ReferenceRelated[]} references
 */

/**
 * @typedef AssistiveTechRelated
 * @property {AssistiveTechDecoded} decoded
 * @property {CommandsRelated[]} commands
 * @property {TestRelated[]} tests
 */

/**
 * @typedef KeyRelated
 * @property {KeyDecoded} decoded
 * @property {CommandRelated} command
 */

/**
 * @typedef SuiteRelated
 * @property {SuiteDecoded} decoded
 * @property {CommandsRelated[]} commands
 * @property {ReferenceRelated[]} references
 * @property {TestRelated[]} tests
 * @property {AssistiveTechRelated[]} assistiveTechs
 * @property {KeyRelated[]} keys
 */
