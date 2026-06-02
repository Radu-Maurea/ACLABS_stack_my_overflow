require('dotenv').config()
const app = require('./app')

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`SMO Backend pornit pe http://localhost:${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/health`)
})
