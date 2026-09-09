import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

const starterRooms = [
  { id: 'garden', name: 'Garden Room', type: 'King bed · Garden view', price: 2200, capacity: 2, image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=85', amenities: ['Breakfast', 'Fast Wi-Fi', 'Private bath'], isActive: true },
  { id: 'lake', name: 'Lake View Suite', type: 'King bed · Balcony · Lake view', price: 3400, capacity: 2, image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1000&q=85', amenities: ['Breakfast', 'Lake view', 'Air conditioning'], isActive: true },
  { id: 'family', name: 'Family Residence', type: 'Two bedrooms · Living room', price: 4800, capacity: 4, image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85', amenities: ['Breakfast', 'Kitchenette', 'Extra space'], isActive: true }
]

const seedDir = path.join(__dirname, 'data')
const dataDir = process.env.VERCEL ? path.join('/tmp', 'zanzibar-data') : seedDir
const bookingsPath = path.join(dataDir, 'bookings.json')
const messagesPath = path.join(dataDir, 'messages.json')
const roomsPath = path.join(dataDir, 'rooms.json')

fs.mkdirSync(dataDir, { recursive: true })

const seedFile = (fileName, defaultValue = '[]') => {
  const targetPath = path.join(dataDir, fileName)
  const sourcePath = path.join(seedDir, fileName)
  if (!fs.existsSync(targetPath)) {
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath)
    } else {
      fs.writeFileSync(targetPath, defaultValue)
    }
  }
}

seedFile('bookings.json', '[]')
seedFile('messages.json', '[]')
seedFile('rooms.json', JSON.stringify(starterRooms, null, 2))

const readData = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))
const writeData = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2))

const adminUsername = process.env.ADMIN_USERNAME || 'admin'
const adminPassword = process.env.ADMIN_PASSWORD || 'zanzibar-admin'
const sessionHours = 8
const sessions = new Map()
const loginAttempts = new Map()

app.disable('x-powered-by')
app.use(express.json({ limit: '100kb' }))

const validDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false
  const parsed = new Date(`${value}T12:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}
const overlaps = (booking, checkIn, checkOut) => booking.checkIn < checkOut && booking.checkOut > checkIn
const blocksInventory = (booking) => booking.status !== 'cancelled'
const parseCookies = (header = '') => Object.fromEntries(header.split(';').map(part => part.trim().split('=').map(decodeURIComponent)).filter(([key]) => key))
const safeEqual = (left, right) => {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
const setSessionCookie = (res, id, maxAge) => res.setHeader('Set-Cookie', `zanzibar_admin=${encodeURIComponent(id)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge};${process.env.NODE_ENV === 'production' ? ' Secure;' : ''}`)

const requireAdmin = (req, res, next) => {
  const sessionId = parseCookies(req.headers.cookie).zanzibar_admin
  const session = sessionId && sessions.get(sessionId)
  if (!session || session.expiresAt < Date.now()) {
    if (sessionId) sessions.delete(sessionId)
    return res.status(401).json({ message: 'Please sign in to continue.' })
  }
  req.admin = session
  next()
}

const getDashboard = () => {
  const bookings = readData(bookingsPath).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const messages = readData(messagesPath).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const currentRooms = readData(roomsPath)
  const activeBookings = bookings.filter(blocksInventory)
  const todayStr = new Date().toISOString().slice(0, 10)
  const upcomingBookings = bookings.filter(booking => booking.status !== 'cancelled' && booking.status !== 'checked-out' && booking.checkOut >= todayStr)
  return {
    metrics: {
      bookingCount: activeBookings.length,
      confirmedRevenue: activeBookings.reduce((sum, booking) => sum + booking.total, 0),
      upcomingGuests: upcomingBookings.reduce((sum, booking) => sum + booking.guests, 0),
      unreadMessages: messages.length
    },
    bookings,
    messages,
    rooms: currentRooms
  }
}

app.get('/api/rooms', (req, res) => res.json({ rooms: readData(roomsPath).filter(room => room.isActive) }))

app.get('/api/availability', (req, res) => {
  const { checkIn, checkOut, guests = 1 } = req.query
  if (!validDate(checkIn) || !validDate(checkOut) || checkIn >= checkOut) return res.status(400).json({ message: 'Please select a valid check-in and check-out date.' })
  const bookings = readData(bookingsPath)
  const currentRooms = readData(roomsPath)
  const available = currentRooms.filter(room => room.isActive && room.capacity >= Number(guests) && !bookings.some(booking => booking.roomId === room.id && blocksInventory(booking) && overlaps(booking, checkIn, checkOut)))
  res.json({ rooms: available, message: available.length ? `${available.length} room${available.length > 1 ? 's' : ''} available for your stay.` : 'No rooms match those dates. Try adjusting your stay.' })
})

app.post('/api/bookings', (req, res) => {
  const { roomId, checkIn, checkOut, guests, name, email, phone, note = '' } = req.body
  const currentRooms = readData(roomsPath)
  const room = currentRooms.find(item => item.id === roomId && item.isActive)
  if (!room || !validDate(checkIn) || !validDate(checkOut) || checkIn >= checkOut || !name?.trim() || !email?.includes('@') || !phone?.trim()) return res.status(400).json({ message: 'Please complete the booking form with valid details.' })
  if (Number(guests) < 1 || Number(guests) > room.capacity) return res.status(400).json({ message: `This room accommodates up to ${room.capacity} guests.` })
  const bookings = readData(bookingsPath)
  if (bookings.some(booking => booking.roomId === roomId && blocksInventory(booking) && overlaps(booking, checkIn, checkOut))) return res.status(409).json({ message: 'That room was just reserved for these dates. Please choose another room.' })
  const nights = Math.round((new Date(`${checkOut}T12:00:00`) - new Date(`${checkIn}T12:00:00`)) / 86400000)
  const booking = { id: `ZGH-${Date.now().toString().slice(-6)}`, roomId, room: room.name, checkIn, checkOut, guests: Number(guests), name: name.trim(), email: email.trim(), phone: phone.trim(), note: note.trim(), nights, total: nights * room.price, status: 'confirmed', createdAt: new Date().toISOString() }
  bookings.push(booking)
  writeData(bookingsPath, bookings)
  res.status(201).json({ booking, message: 'Your stay is confirmed. We will be in touch shortly.' })
})

app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body
  if (!name?.trim() || !email?.includes('@') || !message?.trim()) return res.status(400).json({ message: 'Please add your name, email, and a message.' })
  const messages = readData(messagesPath)
  messages.push({ id: `MSG-${Date.now()}`, name: name.trim(), email: email.trim(), message: message.trim(), createdAt: new Date().toISOString() })
  writeData(messagesPath, messages)
  res.status(201).json({ message: 'Thank you — your message is safely with our team.' })
})

app.post('/api/admin/login', (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  const attempt = loginAttempts.get(ip)
  if (attempt && attempt.resetAt > Date.now() && attempt.count >= 5) return res.status(429).json({ message: 'Too many attempts. Please wait 15 minutes and try again.' })
  if (attempt?.resetAt <= Date.now()) loginAttempts.delete(ip)
  const { username = '', password = '' } = req.body
  if (!safeEqual(username, adminUsername) || !safeEqual(password, adminPassword)) {
    const current = loginAttempts.get(ip) || { count: 0, resetAt: Date.now() + 15 * 60 * 1000 }
    current.count += 1
    loginAttempts.set(ip, current)
    return res.status(401).json({ message: 'That email or password is not recognised.' })
  }
  loginAttempts.delete(ip)
  const id = crypto.randomBytes(32).toString('hex')
  sessions.set(id, { username: adminUsername, expiresAt: Date.now() + sessionHours * 60 * 60 * 1000 })
  setSessionCookie(res, id, sessionHours * 60 * 60)
  res.json({ user: { username: adminUsername } })
})

app.post('/api/admin/logout', requireAdmin, (req, res) => {
  const id = parseCookies(req.headers.cookie).zanzibar_admin
  sessions.delete(id)
  setSessionCookie(res, '', 0)
  res.status(204).end()
})

app.get('/api/admin/session', requireAdmin, (req, res) => res.json({ user: { username: req.admin.username } }))
app.get('/api/admin/dashboard', requireAdmin, (req, res) => res.json(getDashboard()))

app.patch('/api/admin/bookings/:id', requireAdmin, (req, res) => {
  const statuses = ['confirmed', 'checked-in', 'checked-out', 'cancelled']
  if (!statuses.includes(req.body.status)) return res.status(400).json({ message: 'Invalid booking status.' })
  const bookings = readData(bookingsPath)
  const booking = bookings.find(item => item.id === req.params.id)
  if (!booking) return res.status(404).json({ message: 'Booking not found.' })
  booking.status = req.body.status
  booking.updatedAt = new Date().toISOString()
  writeData(bookingsPath, bookings)
  res.json({ booking })
})

app.post('/api/admin/bookings', requireAdmin, (req, res) => {
  const { roomId, checkIn, checkOut, guests, name, email, phone, note = '' } = req.body
  const currentRooms = readData(roomsPath)
  const room = currentRooms.find(item => item.id === roomId)
  if (!room || !validDate(checkIn) || !validDate(checkOut) || checkIn >= checkOut || !name?.trim() || !phone?.trim()) {
    return res.status(400).json({ message: 'Please provide valid reservation details.' })
  }
  const bookings = readData(bookingsPath)
  const nights = Math.round((new Date(`${checkOut}T12:00:00`) - new Date(`${checkIn}T12:00:00`)) / 86400000)
  const booking = {
    id: `ZGH-${Date.now().toString().slice(-6)}`,
    roomId,
    room: room.name,
    checkIn,
    checkOut,
    guests: Number(guests || 1),
    name: name.trim(),
    email: email?.trim() || 'walkin@guest.local',
    phone: phone.trim(),
    note: note.trim(),
    nights,
    total: nights * room.price,
    status: 'confirmed',
    createdAt: new Date().toISOString()
  }
  bookings.push(booking)
  writeData(bookingsPath, bookings)
  res.status(201).json({ booking, message: 'Walk-in reservation created successfully.' })
})

app.delete('/api/admin/messages/:id', requireAdmin, (req, res) => {
  let messages = readData(messagesPath)
  const initialCount = messages.length
  messages = messages.filter(msg => msg.id !== req.params.id)
  if (messages.length === initialCount) return res.status(404).json({ message: 'Message not found.' })
  writeData(messagesPath, messages)
  res.json({ message: 'Message deleted.' })
})

app.post('/api/admin/rooms', requireAdmin, (req, res) => {
  const { name, type, price, capacity, image, amenities } = req.body
  if (!name?.trim() || !price || Number(price) < 100) {
    return res.status(400).json({ message: 'Please provide a valid room name and price.' })
  }
  let currentRooms = readData(roomsPath)
  const newRoom = {
    id: `room-${Date.now()}`,
    name: name.trim(),
    type: type?.trim() || 'Standard Room',
    price: Number(price),
    capacity: Number(capacity || 2),
    image: image?.trim() || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=85',
    amenities: Array.isArray(amenities) ? amenities : ['Breakfast', 'Fast Wi-Fi', 'Private bath'],
    isActive: true
  }
  currentRooms.push(newRoom)
  writeData(roomsPath, currentRooms)
  res.status(201).json({ room: newRoom, message: 'New room added successfully.' })
})

app.patch('/api/admin/rooms/:id', requireAdmin, (req, res) => {
  let currentRooms = readData(roomsPath)
  const room = currentRooms.find(item => item.id === req.params.id)
  if (!room) return res.status(404).json({ message: 'Room not found.' })
  const { name, type, price, capacity, image, amenities, isActive } = req.body
  if (price !== undefined && (!Number.isFinite(Number(price)) || Number(price) < 100)) return res.status(400).json({ message: 'Please provide a valid nightly rate.' })
  if (name !== undefined) room.name = name.trim()
  if (type !== undefined) room.type = type.trim()
  if (price !== undefined) room.price = Math.round(Number(price))
  if (capacity !== undefined) room.capacity = Number(capacity)
  if (image !== undefined) room.image = image.trim()
  if (amenities !== undefined) room.amenities = Array.isArray(amenities) ? amenities : (typeof amenities === 'string' ? amenities.split(',').map(s => s.trim()) : room.amenities)
  if (isActive !== undefined) room.isActive = Boolean(isActive)
  writeData(roomsPath, currentRooms)
  res.json({ room })
})

app.delete('/api/admin/rooms/:id', requireAdmin, (req, res) => {
  let currentRooms = readData(roomsPath)
  const initialCount = currentRooms.length
  currentRooms = currentRooms.filter(item => item.id !== req.params.id)
  if (currentRooms.length === initialCount) return res.status(404).json({ message: 'Room not found.' })
  writeData(roomsPath, currentRooms)
  res.json({ message: 'Room deleted from inventory.' })
})

const distDir = path.join(__dirname, '..', 'dist')
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get('*', (req, res) => res.sendFile(path.join(distDir, 'index.html')))
}

export default app
