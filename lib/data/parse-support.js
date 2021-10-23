/// <reference path="../../types/aria-at-csv.js" />
/// <reference path="../../types/aria-at-parsed.js" />

'use strict';

/**
 * @param {AriaATCSV.Support} supportRaw
 * @returns {AriaATParsed.Support}
 */
function parseSupport(supportRaw) {
  return {
    ats: supportRaw.ats,
    atGroups: [
      ...Object.entries(supportRaw.applies_to).map(([name, value]) => ({
        key: name.toLowerCase(),
        name,
        ats: value.map(key => supportRaw.ats.find(at => at.key === key) || { key }),
      })),
      ...supportRaw.ats.map(at => ({
        key: at.key,
        name: at.name,
        ats: [at],
      })),
    ],
  };
}

exports.parseSupport = parseSupport;
