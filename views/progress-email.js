
module.exports = (p) => `
${p.name} completed sheet ${p.sheet_id}
past week: ${p.past_week} / 7
past month: ${p.past_month} / 30
${p.sheet_url}
`
