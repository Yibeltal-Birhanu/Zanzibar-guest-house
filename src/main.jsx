import { createRoot } from 'react-dom/client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDownRight, ArrowRight, BadgeDollarSign, BedDouble, CalendarCheck2, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, CircleCheck, ClipboardList, Coffee, ConciergeBell, Edit3, LayoutDashboard, LogOut, Mail, MapPin, Menu, Phone, Plus, Search, Send, Settings2, ShieldCheck, Sparkles, Star, Trash2, UserRound, Users, UtensilsCrossed, Wifi, X } from 'lucide-react'
import './styles.css'

const ETB = new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 })
const today = new Date().toISOString().slice(0, 10)
const addDays = (amount) => { const date = new Date(); date.setDate(date.getDate() + amount); return date.toISOString().slice(0, 10) }

function AirbnbDatePicker({ checkIn, checkOut, onChange })
{
  const [isOpen, setIsOpen] = useState(false)
  const [activeField, setActiveField] = useState('checkIn')
  const [hoverDate, setHoverDate] = useState(null)

  const initialDate = useMemo(() =>
  {
    if (checkIn) return new Date(`${checkIn}T00:00:00`)
    return new Date()
  }, [checkIn])

  const [currentMonth, setCurrentMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1))
  const containerRef = useRef(null)

  useEffect(() =>
  {
    const handleClickOutside = (event) =>
    {
      if (containerRef.current && !containerRef.current.contains(event.target))
      {
        setIsOpen(false)
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)
    return () => document.removeEventListener('pointerdown', handleClickOutside)
  }, [])

  const nights = useMemo(() =>
  {
    if (!checkIn || !checkOut) return 0
    const dIn = new Date(`${checkIn}T00:00:00`)
    const dOut = new Date(`${checkOut}T00:00:00`)
    return Math.max(0, Math.round((dOut - dIn) / 86400000))
  }, [checkIn, checkOut])

  const dayAfterStr = (dateStr) =>
  {
    const d = new Date(`${dateStr}T00:00:00`)
    d.setDate(d.getDate() + 1)
    return d.toISOString().slice(0, 10)
  }

  const handleDateClick = (dateStr) =>
  {
    if (activeField === 'checkIn' || !checkIn || (checkIn && checkOut && activeField === 'checkIn'))
    {
      const nextOut = (checkOut && dateStr < checkOut) ? checkOut : dayAfterStr(dateStr)
      onChange({ checkIn: dateStr, checkOut: nextOut })
      setActiveField('checkOut')
    } else
    {
      if (dateStr > checkIn)
      {
        onChange({ checkIn, checkOut: dateStr })
        setIsOpen(false)
      } else
      {
        onChange({ checkIn: dateStr, checkOut: dayAfterStr(dateStr) })
        setActiveField('checkOut')
      }
    }
  }

  const prevMonth = () =>
  {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const nextMonth = () =>
  {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const formatDisplay = (str) =>
  {
    if (!str) return 'Add date'
    const parts = str.split('-')
    const d = new Date(parts[0], parts[1] - 1, parts[2])
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d)
  }

  const clearDates = (e) =>
  {
    e.stopPropagation()
    onChange({ checkIn: today, checkOut: dayAfterStr(today) })
    setActiveField('checkIn')
  }

  const month1 = currentMonth
  const month2 = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)

  const renderMonthGrid = (year, monthIndex) =>
  {
    const monthTitle = new Date(year, monthIndex, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
    const firstDay = new Date(year, monthIndex, 1).getDay()
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()

    const cells = []
    for (let i = 0; i < firstDay; i++)
    {
      cells.push(<div key={`blank-${i}`} className="airbnb-day empty" />)
    }

    for (let day = 1; day <= daysInMonth; day++)
    {
      const mStr = String(monthIndex + 1).padStart(2, '0')
      const dStr = String(day).padStart(2, '0')
      const dateStr = `${year}-${mStr}-${dStr}`

      const isPast = dateStr < today
      const isStart = dateStr === checkIn
      const isEnd = dateStr === checkOut
      const isInRange = checkIn && checkOut && dateStr > checkIn && dateStr < checkOut
      const isHover = checkIn && !checkOut && hoverDate && dateStr > checkIn && dateStr <= hoverDate
      const isToday = dateStr === today

      let cellClass = 'airbnb-day'
      if (isPast) cellClass += ' disabled'
      if (isStart) cellClass += ' start-date'
      if (isEnd) cellClass += ' end-date'
      if (isInRange) cellClass += ' in-range'
      if (isHover) cellClass += ' hover-range'
      if (isToday) cellClass += ' is-today'

      cells.push(
        <button
          key={dateStr}
          type="button"
          disabled={isPast}
          className={cellClass}
          onClick={() => handleDateClick(dateStr)}
          onMouseEnter={() => !checkOut && setHoverDate(dateStr)}
        >
          <span>{day}</span>
        </button>
      )
    }

    return (
      <div className="airbnb-month-col" key={`${year}-${monthIndex}`}>
        <div className="airbnb-month-title">{monthTitle}</div>
        <div className="airbnb-weekdays">
          <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
        </div>
        <div className="airbnb-days-grid" onMouseLeave={() => setHoverDate(null)}>
          {cells}
        </div>
      </div>
    )
  }

  return (
    <div className="airbnb-date-picker" ref={containerRef}>
      <div className="airbnb-picker-fields">
        <button
          type="button"
          className={`airbnb-field-btn ${isOpen && activeField === 'checkIn' ? 'active' : ''}`}
          onClick={() => { setActiveField('checkIn'); setIsOpen(true) }}
        >
          <span className="airbnb-field-label">CHECK-IN</span>
          <span className={`airbnb-field-value ${!checkIn ? 'placeholder' : ''}`}>{formatDisplay(checkIn)}</span>
        </button>
        <div className="airbnb-field-divider" />
        <button
          type="button"
          className={`airbnb-field-btn ${isOpen && activeField === 'checkOut' ? 'active' : ''}`}
          onClick={() => { setActiveField('checkOut'); setIsOpen(true) }}
        >
          <span className="airbnb-field-label">CHECK-OUT</span>
          <span className={`airbnb-field-value ${!checkOut ? 'placeholder' : ''}`}>{formatDisplay(checkOut)}</span>
        </button>
      </div>

      {isOpen && (
        <div className="airbnb-calendar-popover">
          <div className="airbnb-popover-header">
            <div>
              <strong className="airbnb-popover-title">
                {nights > 0 ? `${nights} night${nights > 1 ? 's' : ''} in Hawassa` : 'Select dates'}
              </strong>
              <small className="airbnb-popover-sub">
                {checkIn && checkOut ? `${formatDisplay(checkIn)} – ${formatDisplay(checkOut)}` : 'Add your travel dates for exact pricing'}
              </small>
            </div>
            <button type="button" className="airbnb-clear-btn" onClick={clearDates}>Clear dates</button>
          </div>

          <div className="airbnb-calendar-nav">
            <button type="button" className="airbnb-nav-btn" onClick={prevMonth} aria-label="Previous month">
              <ChevronLeft size={18} />
            </button>
            <button type="button" className="airbnb-nav-btn" onClick={nextMonth} aria-label="Next month">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="airbnb-months-container">
            {renderMonthGrid(month1.getFullYear(), month1.getMonth())}
            {renderMonthGrid(month2.getFullYear(), month2.getMonth())}
          </div>

          <div className="airbnb-popover-footer">
            <button type="button" className="airbnb-close-btn" onClick={() => setIsOpen(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  )
}

function App()
{
  const [rooms, setRooms] = useState([])
  const [search, setSearch] = useState({ checkIn: addDays(7), checkOut: addDays(9), guests: '2' })
  const [availability, setAvailability] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => { fetch('/api/rooms').then(r => r.json()).then(data => setRooms(data.rooms)).catch(() => setAvailability('The booking service is getting ready. Please try again in a moment.')) }, [])

  const searchRooms = async (event) =>
  {
    event?.preventDefault()
    setIsSearching(true)
    setAvailability('')
    try
    {
      const params = new URLSearchParams(search)
      const response = await fetch(`/api/availability?${params}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      setRooms(data.rooms)
      setAvailability(data.message)
      document.querySelector('#rooms')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch (error) { setAvailability(error.message) } finally { setIsSearching(false) }
  }

  return <>
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Zanzibar home"><span className="brand-mark">Z</span><span>ZANZIBAR<small>GUEST HOUSE & RESTAURANT</small></span></a>
      <nav className={menuOpen ? 'nav open' : 'nav'}><a href="#stay" onClick={() => setMenuOpen(false)}>Stay</a><a href="#dining" onClick={() => setMenuOpen(false)}>Dining</a><a href="#hawassa" onClick={() => setMenuOpen(false)}>Hawassa guide</a><a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a></nav>
      <button className="header-book" onClick={() => document.querySelector('#booking')?.scrollIntoView({ behavior: 'smooth' })}>Book a stay <ArrowUpRight /></button>
      <button className="menu-button" aria-label="Open navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
    </header>

    <main id="top">
      <section className="hero">
        <div className="hero-media" />
        <div className="hero-overlay" />
        <div className="hero-content wrap">
          <p className="eyebrow light"><span /> HAWASSA, ETHIOPIA</p>
          <h1>Stay a little<br /><em>closer to the lake.</em></h1>
          <p className="hero-copy">A welcoming, quietly characterful place to rest, eat well, and discover the rhythm of Hawassa.</p>
          <a className="round-link" href="#stay">Explore your stay <span><ArrowDownRight /></span></a>
        </div>
        <div className="hero-bottom wrap"><span>EST. 2016</span><span>7 ROOMS · 1 RESTAURANT · ENDLESS WELCOME</span></div>
      </section>

      <section className="booking-shell" id="booking">
        <form className="booking-card wrap" onSubmit={searchRooms}>
          <div className="booking-title"><CalendarDays /><span><strong>Find your room</strong><small>Best rate, direct booking</small></span></div>
          <AirbnbDatePicker checkIn={search.checkIn} checkOut={search.checkOut} onChange={({ checkIn, checkOut }) => setSearch(prev => ({ ...prev, checkIn, checkOut }))} />
          <label>Guests<span className="select-input"><Users size={17} /><select value={search.guests} onChange={e => setSearch({ ...search, guests: e.target.value })}><option value="1">1 guest</option><option value="2">2 guests</option><option value="3">3 guests</option><option value="4">4 guests</option></select><ChevronDown size={15} /></span></label>
          <button className="primary-button" disabled={isSearching}>{isSearching ? 'Checking...' : <>Check availability <ArrowRight /></>}</button>
        </form>
        {availability && <p className="availability wrap">{availability}</p>}
      </section>

      <section className="intro wrap" id="stay">
        <div><p className="eyebrow"><span /> A WARM HAWASSA WELCOME</p><h2>More than a place<br />to <em>spend the night.</em></h2></div>
        <div className="intro-copy"><p>At the edge of the fish market and a short stroll from Lake Hawassa, Zanzibar is your soft landing in the city: genuine hospitality, thoughtfully kept rooms, and food made with care.</p><a href="#contact" className="text-link">Meet our story <ArrowRight /></a></div>
      </section>

      <section className="rooms-section" id="rooms">
        <div className="wrap section-heading"><div><p className="eyebrow"><span /> REST EASY</p><h2>Rooms with <em>room to breathe.</em></h2></div><p>Every stay includes a generous breakfast, reliable Wi-Fi, and people who know Hawassa by heart.</p></div>
        <div className="room-grid wrap">{rooms.length ? rooms.map((room, i) => <RoomCard key={room.id} room={room} number={`0${i + 1}`} onBook={() => setSelectedRoom(room)} />) : <div className="empty-rooms"><BedDouble /><h3>No rooms found</h3><p>Try nearby dates or contact us directly.</p></div>}</div>
      </section>

      <section className="experience wrap" id="dining">
        <div className="experience-image"><img src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85" alt="Freshly prepared food on a restaurant table" /><div className="image-note"><UtensilsCrossed /><span>From market<br />to table</span></div></div>
        <div className="experience-copy"><p className="eyebrow"><span /> THE RESTAURANT</p><h2>A taste of<br /><em>the good life.</em></h2><p>Come for breakfast, linger for lunch, or settle in over dinner. Our kitchen celebrates satisfying Ethiopian favourites alongside fresh, simple plates made from the day’s market finds.</p><div className="feature-list"><span><Coffee /> Breakfast from 7:00</span><span><UtensilsCrossed /> Local & international dishes</span><span><Sparkles /> Vegetarian friendly</span></div><a href="#contact" className="round-link dark">Reserve a table <span><ArrowRight /></span></a></div>
      </section>

      <section className="guide" id="hawassa"><div className="wrap guide-inner"><p className="eyebrow light"><span /> WHY HAWASSA</p><h2>Wake up where<br />the city meets <em>the water.</em></h2><p>Lake walks at first light. The colourful fish market. Coffee that earns another hour. Let us point you toward Hawassa’s most memorable corners.</p><a className="text-link light-link" href="#contact">Ask us for local tips <ArrowRight /></a><div className="guide-stats"><span><strong>8 min</strong>Walk to Lake Hawassa</span><span><strong>4.7 / 5</strong>From our guests</span><span><strong>24 / 7</strong>Friendly support</span></div></div></section>

      <section className="testimonials wrap"><p className="eyebrow"><span /> GUEST NOTES</p><div className="quote"><span className="quote-mark">“</span><blockquote>The beds were very comfortable, the bathroom was spotless, and breakfast was delicious. Mittu made us feel completely at home.</blockquote><div className="reviewer"><div className="avatar">AA</div><span><strong>Amy Adams</strong><small>Stayed in Hawassa</small></span><span className="stars"><Star fill="currentColor" /><Star fill="currentColor" /><Star fill="currentColor" /><Star fill="currentColor" /><Star fill="currentColor" /></span></div></div></section>

      <ContactSection />
    </main>
    <footer><div className="wrap footer-inner"><a className="brand footer-brand" href="#top"><span className="brand-mark">Z</span><span>ZANZIBAR<small>GUEST HOUSE & RESTAURANT</small></span></a><p>Fish Market, Kebele 05<br />Hawassa, Ethiopia</p><div><a href="tel:+251969845660">+251 969 845 660</a><a href="mailto:stay@zanzibarhawassa.com">stay@zanzibarhawassa.com</a></div><p className="copyright">© 2026 Zanzibar Guest House</p></div></footer>
    {selectedRoom && <BookingModal room={selectedRoom} search={search} onClose={() => setSelectedRoom(null)} />}
  </>
}

function RoomCard({ room, number, onBook })
{
  return <article className="room-card"><div className="room-image"><img src={room.image} alt={room.name} /><span>{number}</span><div className="room-cap"><Users size={15} /> Up to {room.capacity}</div></div><div className="room-details"><p>{room.type}</p><h3>{room.name}</h3><div className="room-meta">{room.amenities.map(item => <span key={item}><Check />{item}</span>)}</div><div className="room-bottom"><span><strong>{ETB.format(room.price)}</strong> / night</span><button onClick={onBook}>Choose room <ArrowRight /></button></div></div></article>
}

function BookingModal({ room, search, onClose })
{
  const [form, setForm] = useState({ ...search, name: '', email: '', phone: '', note: '' })
  const [status, setStatus] = useState({ type: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const nights = useMemo(() => Math.max(0, Math.round((new Date(`${form.checkOut}T12:00:00`) - new Date(`${form.checkIn}T12:00:00`)) / 86400000)), [form.checkIn, form.checkOut])
  const update = (key, value) => setForm({ ...form, [key]: value })
  const submit = async event => { event.preventDefault(); setSubmitting(true); setStatus({ type: '', message: '' }); try { const response = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, roomId: room.id }) }); const data = await response.json(); if (!response.ok) throw new Error(data.message); setStatus({ type: 'success', message: `${data.message} Your reference is ${data.booking.id}.` }) } catch (error) { setStatus({ type: 'error', message: error.message }) } finally { setSubmitting(false) } }
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={`Book ${room.name}`}><div className="booking-modal"><button className="close-modal" onClick={onClose} aria-label="Close booking form"><X /></button>{status.type === 'success' ? <div className="confirmation"><CircleCheck /><p className="eyebrow"><span /> BOOKING COMPLETE</p><h2>You’re on the <em>list.</em></h2><p>{status.message}</p><button className="primary-button" onClick={onClose}>Done <ArrowRight /></button></div> : <><div className="modal-room"><img src={room.image} alt="" /><div><p className="eyebrow"><span /> YOUR SELECTION</p><h3>{room.name}</h3><p>{ETB.format(room.price)} / night</p></div></div><form className="reservation-form" onSubmit={submit}><div className="form-heading"><h2>Make it <em>official.</em></h2><p>We'll hold your room and confirm the details by phone or email.</p></div><div className="form-grid"><div className="modal-date-picker-span"><AirbnbDatePicker checkIn={form.checkIn} checkOut={form.checkOut} onChange={({ checkIn, checkOut }) => setForm(prev => ({ ...prev, checkIn, checkOut }))} /></div><label>Guests<select value={form.guests} onChange={e => update('guests', e.target.value)}>{Array.from({ length: room.capacity }, (_, i) => <option value={i + 1} key={i}>{i + 1} guest{i ? 's' : ''}</option>)}</select></label><label>Your name<input required placeholder="Full name" value={form.name} onChange={e => update('name', e.target.value)} /></label><label>Email address<input required type="email" placeholder="you@email.com" value={form.email} onChange={e => update('email', e.target.value)} /></label><label>Phone number<input required placeholder="+251 ..." value={form.phone} onChange={e => update('phone', e.target.value)} /></label></div><label>Anything we should know? <span className="optional">(optional)</span><textarea placeholder="Arrival time, dietary needs, special occasion..." value={form.note} onChange={e => update('note', e.target.value)}></textarea></label><div className="price-summary"><span>{nights} night{nights !== 1 ? 's' : ''} × {ETB.format(room.price)}</span><strong>{ETB.format(nights * room.price)}</strong></div><button className="primary-button" disabled={submitting} style={{ width: '100%', marginTop: 16 }}>{submitting ? 'Confirming...' : <>Confirm booking <ArrowRight /></>}</button></form></>}</div></div>
}

function ContactSection()
{
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [state, setState] = useState('')
  const submit = async event => { event.preventDefault(); setState('Sending…'); try { const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); const data = await response.json(); if (!response.ok) throw new Error(data.message); setState(data.message); setForm({ name: '', email: '', message: '' }) } catch (error) { setState(error.message) } }
  return <section className="contact" id="contact"><div className="wrap contact-grid"><div><p className="eyebrow light"><span /> COME AS YOU ARE</p><h2>Let’s plan your<br /><em>Hawassa stay.</em></h2><p>Need a pickup, an early breakfast, or just a recommendation? Send a note. We’re here.</p><div className="contact-details"><a href="tel:+251969845660"><Phone />+251 969 845 660</a><a href="https://maps.google.com/?q=Fish+Market+Kebele+05+Hawassa" target="_blank" rel="noreferrer"><MapPin />Fish Market, Kebele 05, Hawassa</a></div></div><form className="contact-form" onSubmit={submit}><label>Name<input required placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label><label>Email<input required type="email" placeholder="you@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label><label>Message<textarea required placeholder="How can we help?" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} /></label><button className="send-button" aria-label="Send message"><Send /></button>{state && <p className="form-status contact-status">{state}</p>}</form></div></section>
}

const formatAdminDate = (value) => new Intl.DateTimeFormat('en-ET', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`))
const api = async (url, options = {}) =>
{
  const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } })
  const data = response.status === 204 ? {} : await response.json()
  if (!response.ok) throw new Error(data.message || 'Something went wrong. Please try again.')
  return data
}

function AdminApp()
{
  const [user, setUser] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [checking, setChecking] = useState(true)
  const loadDashboard = async () =>
  {
    try { setDashboard(await api('/api/admin/dashboard')) } catch (error) { if (error.message.includes('sign in')) setUser(null) }
  }
  useEffect(() => { api('/api/admin/session').then(data => { setUser(data.user); return loadDashboard() }).catch(() => setUser(null)).finally(() => setChecking(false)) }, [])
  if (checking) return <div className="admin-loading"><span className="brand-mark">Z</span><p>Opening Zanzibar workspace…</p></div>
  if (!user) return <AdminLogin onSuccess={async (nextUser) => { setUser(nextUser); await loadDashboard() }} />
  return <AdminDashboard user={user} dashboard={dashboard} reload={loadDashboard} onLogout={async () => { await api('/api/admin/logout', { method: 'POST' }); setUser(null); setDashboard(null) }} />
}

function AdminLogin({ onSuccess }) {
  const [form, setForm] = useState({ username: 'admin', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = async (event) => {
    event.preventDefault(); setLoading(true); setError('')
    try { const data = await api('/api/admin/login', { method: 'POST', body: JSON.stringify(form) }); await onSuccess(data.user) } catch (requestError) { setError(requestError.message) } finally { setLoading(false) }
  }
  return <main className="admin-login"><div className="admin-login-image"><div className="login-image-overlay" /><a className="brand" href="/"><span className="brand-mark">Z</span><span>ZANZIBAR<small>GUEST HOUSE & RESTAURANT</small></span></a><div className="login-quote"><p>“Great hospitality<br />is in the details.”</p><span>HAWASSA, ETHIOPIA</span></div></div><section className="login-panel"><a className="admin-back" href="/"><ArrowDownRight /> Back to website</a><div className="login-card"><div className="admin-lock"><ShieldCheck /></div><p className="admin-kicker">PRIVATE WORKSPACE</p><h1>Welcome <em>back.</em></h1><p className="login-copy">Sign in to manage reservations, guests, rooms, and the little details that make a stay memorable.</p><form onSubmit={login}><label>Username<input autoComplete="username" value={form.username} onChange={event => setForm({ ...form, username: event.target.value })} /></label><label>Password<input autoComplete="current-password" type="password" placeholder="Enter your password" required value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} /></label>{error && <p className="admin-error">{error}</p>}<button className="admin-primary" disabled={loading}>{loading ? 'Signing in…' : <>Open workspace <ArrowRight /></>}</button></form><p className="login-security"><ShieldCheck /> Protected with secure, time-limited access</p></div></section></main>
}

function AdminDashboard({ user, dashboard, reload, onLogout })
{
  const [tab, setTab] = useState('overview')
  const [busy, setBusy] = useState('')
  const [notice, setNotice] = useState('')
  const [showRoomModal, setShowRoomModal] = useState(null)
  const [showWalkinModal, setShowWalkinModal] = useState(false)

  const setBookingStatus = async (id, status) =>
  {
    setBusy(id); setNotice('')
    try { await api(`/api/admin/bookings/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); await reload(); setNotice('Reservation updated.') } catch (error) { setNotice(error.message) } finally { setBusy('') }
  }

  const saveRoom = async (room, values) =>
  {
    setBusy(room.id || 'new'); setNotice('')
    try {
      if (room.id) {
        await api(`/api/admin/rooms/${room.id}`, { method: 'PATCH', body: JSON.stringify(values) })
        setNotice(`${values.name || room.name} updated.`)
      } else {
        await api('/api/admin/rooms', { method: 'POST', body: JSON.stringify(values) })
        setNotice(`New room "${values.name}" added to inventory.`)
      }
      await reload()
      setShowRoomModal(null)
    } catch (error) { setNotice(error.message) } finally { setBusy('') }
  }

  const createWalkinBooking = async (bookingData) => {
    setBusy('walkin'); setNotice('')
    try {
      const res = await api('/api/admin/bookings', { method: 'POST', body: JSON.stringify(bookingData) })
      await reload()
      setNotice(`Reservation ${res.booking.id} created for ${res.booking.name}.`)
      setShowWalkinModal(false)
    } catch (error) { setNotice(error.message) } finally { setBusy('') }
  }

  const deleteMessage = async (id) => {
    setBusy(id); setNotice('')
    try {
      await api(`/api/admin/messages/${id}`, { method: 'DELETE' })
      await reload()
      setNotice('Guest message removed.')
    } catch (error) { setNotice(error.message) } finally { setBusy('') }
  }

  const deleteRoom = async (room) => {
    if (!window.confirm(`Are you sure you want to delete "${room.name}" from inventory?`)) return
    setBusy(room.id); setNotice('')
    try {
      await api(`/api/admin/rooms/${room.id}`, { method: 'DELETE' })
      await reload()
      setNotice(`Room "${room.name}" deleted successfully.`)
    } catch (error) { setNotice(error.message) } finally { setBusy('') }
  }

  if (!dashboard) return <div className="admin-loading"><span className="brand-mark">Z</span><p>Loading your workspace…</p></div>
  const nav = [{ id: 'overview', label: 'Overview', icon: LayoutDashboard }, { id: 'reservations', label: 'Reservations', icon: ClipboardList }, { id: 'inbox', label: 'Guest messages', icon: Mail }, { id: 'rooms', label: 'Rooms & rates', icon: Settings2 }]

  return <main className="admin-app"><aside className="admin-sidebar"><a className="brand" href="/"><span className="brand-mark">Z</span><span>ZANZIBAR<small>GUEST HOUSE & RESTAURANT</small></span></a><div className="admin-sidebar-label">WORKSPACE</div><nav>{nav.map(item => { const Icon = item.icon; return <button key={item.id} onClick={() => setTab(item.id)} className={tab === item.id ? 'active' : ''}><Icon />{item.label}{item.id === 'inbox' && dashboard.metrics.unreadMessages > 0 ? <b>{dashboard.metrics.unreadMessages}</b> : null}</button> })}</nav><div className="admin-sidebar-bottom"><div className="admin-user"><span>{user.username.slice(0, 1).toUpperCase()}</span><div><strong>{user.username}</strong><small>Property manager</small></div></div><button onClick={onLogout}><LogOut />Sign out</button></div></aside><section className="admin-content"><header className="admin-topbar"><div><p className="admin-kicker">ZANZIBAR OPERATIONS</p><h2>{tab === 'overview' ? 'Good morning, manager.' : nav.find(item => item.id === tab).label}</h2></div><div className="admin-actions"><span className="admin-date"><CalendarDays />{new Intl.DateTimeFormat('en-ET', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</span><a href="/" target="_blank" rel="noreferrer">View website <ArrowRight /></a></div></header>{notice && <p className="admin-notice"><CircleCheck />{notice}</p>}{tab === 'overview' && <Overview dashboard={dashboard} onReservations={() => setTab('reservations')} onRooms={() => setTab('rooms')} setBookingStatus={setBookingStatus} busy={busy} />}{tab === 'reservations' && <ReservationTable bookings={dashboard.bookings} setBookingStatus={setBookingStatus} busy={busy} onAddWalkin={() => setShowWalkinModal(true)} />}{tab === 'inbox' && <Inbox messages={dashboard.messages} onDelete={deleteMessage} busy={busy} />}{tab === 'rooms' && <RoomManager rooms={dashboard.rooms} saveRoom={saveRoom} deleteRoom={deleteRoom} busy={busy} onEditRoom={(room) => setShowRoomModal(room)} onAddRoom={() => setShowRoomModal({})} />}</section>
    {showRoomModal && <RoomModal room={showRoomModal} onSave={(vals) => saveRoom(showRoomModal, vals)} onClose={() => setShowRoomModal(null)} busy={busy === (showRoomModal.id || 'new')} />}
    {showWalkinModal && <WalkinModal rooms={dashboard.rooms} onSave={createWalkinBooking} onClose={() => setShowWalkinModal(false)} busy={busy === 'walkin'} />}
  </main>
}

function Overview({ dashboard, onReservations, onRooms, setBookingStatus, busy })
{
  const metrics = [
    { label: 'Active bookings', value: dashboard.metrics.bookingCount, note: 'All current reservations', icon: CalendarCheck2, color: 'coral' },
    { label: 'Confirmed revenue', value: ETB.format(dashboard.metrics.confirmedRevenue), note: 'Before adjustments', icon: BadgeDollarSign, color: 'gold' },
    { label: 'Upcoming guests', value: dashboard.metrics.upcomingGuests, note: 'Across future stays', icon: Users, color: 'mint' },
    { label: 'Guest messages', value: dashboard.metrics.unreadMessages, note: 'Waiting in your inbox', icon: Mail, color: 'blue' }
  ]
  const upcoming = dashboard.bookings.filter(item => item.status !== 'cancelled' && item.status !== 'checked-out').slice(0, 5)
  return <div className="admin-view"><section className="metric-grid">{metrics.map(metric => { const Icon = metric.icon; return <article className={`metric-card ${metric.color}`} key={metric.label}><div className="metric-icon"><Icon /></div><p>{metric.label}</p><strong>{metric.value}</strong><span>{metric.note}</span></article> })}</section><section className="admin-panels"><article className="admin-panel upcoming-panel"><div className="panel-heading"><div><p className="admin-kicker">RESERVATIONS</p><h3>Upcoming stays</h3></div><button onClick={onReservations}>All bookings <ArrowRight /></button></div>{upcoming.length ? <div className="stay-list">{upcoming.map(booking => <div className="stay-row" key={booking.id}><div className="guest-initial">{booking.name.slice(0, 1).toUpperCase()}</div><div className="stay-guest"><strong>{booking.name}</strong><span>{booking.room} · {booking.guests} guest{booking.guests !== 1 ? 's' : ''}</span></div><div className="stay-dates"><strong>{formatAdminDate(booking.checkIn)}</strong><span>to {formatAdminDate(booking.checkOut)}</span></div><StatusSelect booking={booking} update={setBookingStatus} busy={busy} /></div>)}</div> : <EmptyState icon={CalendarCheck2} title="No stays booked yet" copy="New direct reservations will appear here." />}</article><article className="admin-panel property-panel"><p className="admin-kicker">AT A GLANCE</p><h3>Your rooms</h3><div className="room-health">{dashboard.rooms.map(room => <div key={room.id}><div><span className={`availability-dot ${room.isActive ? '' : 'offline'}`} /><strong>{room.name}</strong></div><span>{room.isActive ? 'Available online' : 'Hidden online'}</span></div>)}</div><button className="admin-secondary" onClick={onRooms}>Manage rooms & rates <ArrowRight /></button></article></section></div>
}

function ReservationTable({ bookings, setBookingStatus, busy, onAddWalkin }) {
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    return bookings.filter(booking => {
      const matchFilter = filter === 'all' || booking.status === filter
      const q = query.toLowerCase().trim()
      const matchQuery = !q || booking.name.toLowerCase().includes(q) || booking.email.toLowerCase().includes(q) || booking.phone.toLowerCase().includes(q) || booking.id.toLowerCase().includes(q) || booking.room.toLowerCase().includes(q)
      return matchFilter && matchQuery
    })
  }, [bookings, filter, query])

  return (
    <div className="admin-view">
      <section className="admin-panel reservation-panel">
        <div className="panel-heading">
          <div>
            <p className="admin-kicker">STAY MANAGEMENT</p>
            <h3>Reservations</h3>
          </div>
          <div className="panel-header-actions">
            <div className="admin-search-wrap">
              <Search size={15} />
              <input type="text" placeholder="Search guest, room or ID…" value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            <button className="admin-btn-primary" onClick={onAddWalkin}>
              <Plus size={15} /> Add Stay
            </button>
          </div>
        </div>
        <div className="filter-bar">
          <div className="filter-pills">
            {['all', 'confirmed', 'checked-in', 'checked-out', 'cancelled'].map(item => (
              <button className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)} key={item}>
                {item === 'all' ? 'All Stays' : item.replace('-', ' ')}
              </button>
            ))}
          </div>
          <span className="panel-count">{filtered.length} stay{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        {filtered.length ? (
          <div className="booking-table-wrap">
            <table className="booking-table">
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Stay</th>
                  <th>Room</th>
                  <th>Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(booking => (
                  <tr key={booking.id}>
                    <td><strong>{booking.name}</strong><span>{booking.email}<br />{booking.phone}</span></td>
                    <td><strong>{formatAdminDate(booking.checkIn)}</strong><span>{booking.nights} night{booking.nights !== 1 ? 's' : ''} · {booking.guests} guest{booking.guests !== 1 ? 's' : ''}</span></td>
                    <td>{booking.room}<small>{booking.id}</small></td>
                    <td><strong>{ETB.format(booking.total)}</strong></td>
                    <td><StatusSelect booking={booking} update={setBookingStatus} busy={busy} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={ClipboardList} title="No reservations found" copy="Try adjusting your filter or search keywords." />
        )}
      </section>
    </div>
  )
}

function StatusSelect({ booking, update, busy }) { return <span className={`status-select ${booking.status}`}><select value={booking.status} disabled={busy === booking.id} onChange={event => update(booking.id, event.target.value)} aria-label={`Update status for ${booking.name}`}><option value="confirmed">Confirmed</option><option value="checked-in">Checked in</option><option value="checked-out">Checked out</option><option value="cancelled">Cancelled</option></select><ChevronDown /></span> }

function Inbox({ messages, onDelete, busy }) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return messages
    return messages.filter(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.message.toLowerCase().includes(q))
  }, [messages, query])

  return (
    <div className="admin-view">
      <section className="admin-panel inbox-panel">
        <div className="panel-heading">
          <div>
            <p className="admin-kicker">GUEST COMMUNICATION</p>
            <h3>Messages</h3>
          </div>
          <div className="admin-search-wrap">
            <Search size={15} />
            <input type="text" placeholder="Search inquiries…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
        </div>
        {filtered.length ? (
          <div className="message-list">
            {filtered.map(message => (
              <article className="message-card" key={message.id}>
                <div className="message-avatar">{message.name.slice(0, 1).toUpperCase()}</div>
                <div>
                  <div className="message-meta">
                    <strong>{message.name}</strong>
                    <span>{new Intl.DateTimeFormat('en-ET', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(message.createdAt))}</span>
                  </div>
                  <a href={`mailto:${message.email}`}>{message.email}</a>
                  <p>{message.message}</p>
                </div>
                <div className="message-actions">
                  <a className="reply-link" href={`mailto:${message.email}?subject=Your stay at Zanzibar Guest House`}>
                    Reply <ArrowRight />
                  </a>
                  <button type="button" className="delete-msg-btn" onClick={() => onDelete(message.id)} disabled={busy === message.id} aria-label="Delete message">
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState icon={Mail} title="Your inbox is peaceful" copy="Guest messages from the website will arrive here." />
        )}
      </section>
    </div>
  )
}

function RoomManager({ rooms, saveRoom, deleteRoom, busy, onEditRoom, onAddRoom }) {
  return (
    <div className="admin-view">
      <section className="admin-panel room-manager">
        <div className="panel-heading">
          <div>
            <p className="admin-kicker">INVENTORY & PRICING</p>
            <h3>Rooms & rates</h3>
          </div>
          <button className="admin-btn-primary" onClick={onAddRoom}>
            <Plus size={15} /> Add New Room
          </button>
        </div>
        <div className="admin-room-list">
          {rooms.map(room => (
            <AdminRoom
              key={room.id}
              room={room}
              saveRoom={saveRoom}
              onDelete={() => deleteRoom(room)}
              busy={busy}
              onEdit={() => onEditRoom(room)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

function AdminRoom({ room, saveRoom, onDelete, busy, onEdit }) {
  const [price, setPrice] = useState(room.price)
  useEffect(() => setPrice(room.price), [room.price])
  return (
    <article className="admin-room">
      <img src={room.image} alt="" />
      <div className="admin-room-name">
        <span className={`availability-dot ${room.isActive ? '' : 'offline'}`} />
        <div>
          <strong>{room.name}</strong>
          <small>{room.type} · Up to {room.capacity} guests</small>
        </div>
      </div>
      <label className="rate-input">
        Nightly rate
        <input
          type="number"
          min="100"
          value={price}
          onChange={event => setPrice(event.target.value)}
          onBlur={() => Number(price) !== room.price && saveRoom(room, { price })}
        />
      </label>
      <div className="room-actions">
        <button
          type="button"
          className={`room-toggle ${room.isActive ? 'on' : ''}`}
          disabled={busy === room.id}
          onClick={() => saveRoom(room, { isActive: !room.isActive })}
        >
          <span />
          {room.isActive ? 'Bookable' : 'Hidden'}
        </button>
        <button type="button" className="edit-room-btn" onClick={onEdit}>
          <Edit3 size={14} /> Edit
        </button>
        <button
          type="button"
          className="delete-room-btn"
          onClick={onDelete}
          disabled={busy === room.id}
          aria-label={`Delete ${room.name}`}
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </article>
  )
}

function RoomModal({ room, onSave, onClose, busy }) {
  const [form, setForm] = useState({
    name: room.name || '',
    type: room.type || 'King bed · Garden view',
    price: room.price || 2500,
    capacity: room.capacity || 2,
    image: room.image || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=85',
    amenities: Array.isArray(room.amenities) ? room.amenities.join(', ') : 'Breakfast, Fast Wi-Fi, Private bath',
    isActive: room.isActive !== undefined ? room.isActive : true
  })

  const submit = (e) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true"><div className="booking-modal admin-edit-modal"><button className="close-modal" onClick={onClose} aria-label="Close"><X /></button><form onSubmit={submit} className="reservation-form"><div className="form-heading"><h2>{room.id ? 'Edit' : 'Add'} <em>Room.</em></h2><p>Configure room details, amenities, and nightly rates.</p></div><div className="form-grid"><label>Room name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Deluxe Lake Suite" /></label><label>Type / Subtitle<input required value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} placeholder="e.g. King bed · Lake view" /></label><label>Nightly rate (ETB)<input type="number" required min="100" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></label><label>Max capacity<input type="number" required min="1" max="10" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} /></label><label className="full-width">Image URL<input required value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://images.unsplash.com/..." /></label><label className="full-width">Amenities (comma-separated)<input required value={form.amenities} onChange={e => setForm({ ...form, amenities: e.target.value })} placeholder="Breakfast, Fast Wi-Fi, Lake view" /></label></div><div className="price-summary" style={{ alignItems: 'center' }}><span>Visible on public website?</span><button type="button" className={`room-toggle ${form.isActive ? 'on' : ''}`} onClick={() => setForm({ ...form, isActive: !form.isActive })}><span />{form.isActive ? 'Bookable' : 'Hidden'}</button></div><button className="primary-button" disabled={busy} style={{ width: '100%', marginTop: 16 }}>{busy ? 'Saving...' : 'Save Room Details'}</button></form></div></div>
  )
}

function WalkinModal({ rooms, onSave, onClose, busy }) {
  const [form, setForm] = useState({
    roomId: rooms[0]?.id || '',
    checkIn: today,
    checkOut: addDays(2),
    guests: '1',
    name: '',
    phone: '',
    email: '',
    note: 'Walk-in / Phone booking'
  })

  const submit = (e) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true"><div className="booking-modal admin-edit-modal"><button className="close-modal" onClick={onClose} aria-label="Close"><X /></button><form onSubmit={submit} className="reservation-form"><div className="form-heading"><h2>Add <em>Stay.</em></h2><p>Create a walk-in or phone reservation directly into the PMS.</p></div><div className="form-grid"><label className="full-width">Select Room<select value={form.roomId} onChange={e => setForm({ ...form, roomId: e.target.value })}>{rooms.map(r => <option value={r.id} key={r.id}>{r.name} ({ETB.format(r.price)}/night)</option>)}</select></label><div className="modal-date-picker-span"><AirbnbDatePicker checkIn={form.checkIn} checkOut={form.checkOut} onChange={({ checkIn, checkOut }) => setForm(prev => ({ ...prev, checkIn, checkOut }))} /></div><label>Guest count<select value={form.guests} onChange={e => setForm({ ...form, guests: e.target.value })}><option value="1">1 Guest</option><option value="2">2 Guests</option><option value="3">3 Guests</option><option value="4">4 Guests</option></select></label><label>Guest full name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" /></label><label>Phone number<input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+251 ..." /></label><label>Email (optional)<input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="guest@email.com" /></label></div><label style={{ marginTop: 14 }}>Internal notes<textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Walk-in details, arrival notes..." /></label><button className="primary-button" disabled={busy} style={{ width: '100%', marginTop: 16 }}>{busy ? 'Creating Stay...' : 'Confirm Stay'}</button></form></div></div>
  )
}

function EmptyState({ icon: Icon, title, copy }) { return <div className="admin-empty"><Icon /><h3>{title}</h3><p>{copy}</p></div> }

function ArrowUpRight() { return <ArrowRight className="arrow-up" /> }

createRoot(document.getElementById('root')).render(window.location.pathname.startsWith('/admin') ? <AdminApp /> : <App />)
