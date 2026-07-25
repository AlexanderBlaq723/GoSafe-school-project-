const test = require('node:test')
const assert = require('node:assert/strict')

const { validateAdminOfficeSelection } = require('../lib/admin-office-validation')

test('accepts matching office number and branch location from the selected DVLA office', () => {
  const office = {
    office_number: 'DVLA-ACC-002',
    branch_location: 'Accra Central',
    region: 'Greater Accra',
  }

  const result = validateAdminOfficeSelection(office, 'DVLA-ACC-002', 'Accra Central')

  assert.equal(result.isValid, true)
  assert.equal(result.canonicalOfficeNumber, 'DVLA-ACC-002')
  assert.equal(result.canonicalBranchLocation, 'Accra Central')
})

test('uses the selected office as the source of truth even if other values are provided', () => {
  const office = {
    office_number: 'DVLA-ACC-002',
    branch_location: 'Accra Central',
    region: 'Greater Accra',
  }

  const result = validateAdminOfficeSelection(office)

  assert.equal(result.isValid, true)
  assert.equal(result.canonicalOfficeNumber, 'DVLA-ACC-002')
  assert.equal(result.canonicalBranchLocation, 'Accra Central')
})

test('rejects mismatched office number or branch location supplied by the admin', () => {
  const office = {
    office_number: 'DVLA-ACC-002',
    branch_location: 'Accra Central',
    region: 'Greater Accra',
  }

  const result = validateAdminOfficeSelection(office, 'DVLA-ACC-999', 'Kumasi')

  assert.equal(result.isValid, false)
  assert.match(result.error, /do not match/i)
})
