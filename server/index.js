import app from './app.js'

const port = process.env.PORT || 4242

app.listen(port, () => {
  if (!process.env.ADMIN_PASSWORD) console.warn('Admin demo password is active. Set ADMIN_PASSWORD before deployment.')
  console.log(`Zanzibar API listening on http://localhost:${port}`)
})
