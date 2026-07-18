function validateAdminOfficeSelection(office) {
  if (!office) {
    return { isValid: false, error: 'Invalid DVLA office selected' }
  }

  const canonicalOfficeNumber = office.office_number
  const canonicalBranchLocation = office.branch_location
  const canonicalRegion = office.region || null

  return {
    isValid: true,
    canonicalOfficeNumber,
    canonicalBranchLocation,
    canonicalRegion,
  }
}

module.exports = { validateAdminOfficeSelection }
