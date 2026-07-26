const { doesOfficeMatch, doesBranchLocationMatch } = require('./dvla-office-validation')

function validateAdminOfficeSelection(office, providedOfficeNumber, providedBranchLocation) {
  if (!office) {
    return { isValid: false, error: 'Invalid DVLA office selected' }
  }

  const canonicalOfficeNumber = office.office_number
  const canonicalBranchLocation = office.branch_location
  const canonicalRegion = office.region || null

  if (!providedOfficeNumber && !providedBranchLocation) {
    return {
      isValid: true,
      canonicalOfficeNumber,
      canonicalBranchLocation,
      canonicalRegion,
    }
  }

  const officeMatches = !providedOfficeNumber || doesOfficeMatch(canonicalOfficeNumber, providedOfficeNumber)
  const branchMatches = !providedBranchLocation || doesBranchLocationMatch(canonicalBranchLocation, providedBranchLocation)

  if (!officeMatches || !branchMatches) {
    const mismatches = []
    if (providedOfficeNumber && !officeMatches) mismatches.push('office number')
    if (providedBranchLocation && !branchMatches) mismatches.push('branch location')

    return {
      isValid: false,
      error: `Provided ${mismatches.join(' and ')} do not match the selected DVLA office`,
      canonicalOfficeNumber,
      canonicalBranchLocation,
      canonicalRegion,
    }
  }

  return {
    isValid: true,
    canonicalOfficeNumber,
    canonicalBranchLocation,
    canonicalRegion,
  }
}

module.exports = { validateAdminOfficeSelection }
