/**
 * Tests are ran in this file's process. In case something it uses causes it to
 * crash, the test-host can report that crash.
 *
 * - report available assistive techs
 * - report available browsers
 * - receive test
 *   - run test
 *   - report result
 *   - repeat
 * - receive process interupt signal
 *   - stop test if running
 *   - exit
 */
