function normalizeValue(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function doesOfficeMatch(selectedOfficeNumber, providedOfficeNumber) {
  if (!selectedOfficeNumber || !providedOfficeNumber) return false
  return normalizeValue(selectedOfficeNumber) === normalizeValue(providedOfficeNumber)
}

function doesBranchLocationMatch(selectedBranchLocation, providedBranchLocation) {
  if (!selectedBranchLocation || !providedBranchLocation) return false
  return normalizeValue(selectedBranchLocation) === normalizeValue(providedBranchLocation)
}

module.exports = {
  normalizeValue,
  doesOfficeMatch,
  doesBranchLocationMatch,
}
