'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const DIRECTIONS = [
  'N', 'NNE', 'NE', 'ENE',
  'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW',
  'W', 'WNW', 'NW', 'NNW',
]

interface PropertyFormProps {
  onSubmit: (data: {
    property: {
      length: number
      breadth: number
      entrance_direction: string
      floor_level: string
    }
    room_details?: {
      kitchen_zone?: string
      toilet_zones?: string[]
      brahmasthan_status?: string
      slope_direction?: string
    }
    user_name_initial?: string
  }) => void
  loading: boolean
}

export default function PropertyForm({ onSubmit, loading }: PropertyFormProps) {
  // Section 1 — required
  const [length, setLength] = useState('')
  const [breadth, setBreadth] = useState('')
  const [entranceDir, setEntranceDir] = useState('')
  const [floorLevel, setFloorLevel] = useState<'Ground' | 'Upper'>('Ground')

  // Section 2 — optional
  const [showRoomDetails, setShowRoomDetails] = useState(false)
  const [kitchenZone, setKitchenZone] = useState('')
  const [brahmasthansStatus, setBrahmasthansStatus] = useState<'Open' | 'Pillared' | 'Walled' | ''>('')
  const [slopeDir, setSlopeDir] = useState('')
  const [nameInitial, setNameInitial] = useState('')

  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const len = parseFloat(length)
    const br = parseFloat(breadth)

    if (!length || isNaN(len) || len <= 0) {
      setError('Please enter a valid length')
      return
    }
    if (!breadth || isNaN(br) || br <= 0) {
      setError('Please enter a valid breadth')
      return
    }
    if (!entranceDir) {
      setError('Please select the main entrance direction')
      return
    }

    const room_details =
      kitchenZone || brahmasthansStatus || slopeDir
        ? {
            kitchen_zone: kitchenZone || undefined,
            brahmasthan_status: brahmasthansStatus || undefined,
            slope_direction: slopeDir || undefined,
          }
        : undefined

    onSubmit({
      property: {
        length: len,
        breadth: br,
        entrance_direction: entranceDir,
        floor_level: floorLevel,
      },
      room_details,
      user_name_initial: nameInitial.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-5">

      {/* Length */}
      <div>
        <label className="block text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">
          Length (ft)
        </label>
        <input
          type="number"
          value={length}
          onChange={e => setLength(e.target.value)}
          placeholder="e.g. 30"
          min="1"
          step="any"
          className="w-full bg-nebula border border-white/10 rounded-xl px-4 py-3 text-star text-sm placeholder:text-muted focus:outline-none focus:border-violet/50 transition-colors"
        />
      </div>

      {/* Breadth */}
      <div>
        <label className="block text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">
          Breadth (ft)
        </label>
        <input
          type="number"
          value={breadth}
          onChange={e => setBreadth(e.target.value)}
          placeholder="e.g. 25"
          min="1"
          step="any"
          className="w-full bg-nebula border border-white/10 rounded-xl px-4 py-3 text-star text-sm placeholder:text-muted focus:outline-none focus:border-violet/50 transition-colors"
        />
      </div>

      {/* Main Entrance Direction */}
      <div>
        <label className="block text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">
          Main Entrance Direction
        </label>
        <select
          value={entranceDir}
          onChange={e => setEntranceDir(e.target.value)}
          className="w-full bg-nebula border border-white/10 rounded-xl px-4 py-3 text-star text-sm focus:outline-none focus:border-violet/50 transition-colors appearance-none cursor-pointer"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%236b7280' d='M1 1l5 5 5-5'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center' }}
        >
          <option value="" className="bg-nebula text-muted">Select direction</option>
          {DIRECTIONS.map(dir => (
            <option key={dir} value={dir} className="bg-nebula text-star">
              {dir}
            </option>
          ))}
        </select>
      </div>

      {/* Floor Level */}
      <div>
        <label className="block text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">
          Floor Level
        </label>
        <div className="flex gap-2">
          {(['Ground', 'Upper'] as const).map(level => (
            <button
              key={level}
              type="button"
              onClick={() => setFloorLevel(level)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold border transition-all ${
                floorLevel === level
                  ? 'bg-violet/20 text-violet-light border-violet/40'
                  : 'bg-nebula text-muted border-white/10 hover:border-white/20 hover:text-star'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Room Details Toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowRoomDetails(prev => !prev)}
          className="flex items-center gap-2 text-violet-light text-sm font-semibold tracking-wide hover:text-star transition-colors group"
        >
          <span
            className={`inline-block transition-transform duration-300 ${showRoomDetails ? 'rotate-45' : 'rotate-0'} text-base leading-none`}
          >
            +
          </span>
          <span>{showRoomDetails ? 'Hide Room Details' : 'Add Room Details'}</span>
        </button>

        <AnimatePresence initial={false}>
          {showRoomDetails && (
            <motion.div
              key="room-details"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="pt-5 space-y-5">

                {/* Kitchen Zone */}
                <div>
                  <label className="block text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">
                    Kitchen Zone <span className="text-muted font-normal normal-case">(optional)</span>
                  </label>
                  <select
                    value={kitchenZone}
                    onChange={e => setKitchenZone(e.target.value)}
                    className="w-full bg-nebula border border-white/10 rounded-xl px-4 py-3 text-star text-sm focus:outline-none focus:border-violet/50 transition-colors appearance-none cursor-pointer"
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%236b7280' d='M1 1l5 5 5-5'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center' }}
                  >
                    <option value="" className="bg-nebula text-muted">Select direction</option>
                    {DIRECTIONS.map(dir => (
                      <option key={dir} value={dir} className="bg-nebula text-star">
                        {dir}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Brahmasthan Status */}
                <div>
                  <label className="block text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">
                    Brahmasthan Status <span className="text-muted font-normal normal-case">(optional)</span>
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {(['Open', 'Pillared', 'Walled'] as const).map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setBrahmasthansStatus(prev => prev === status ? '' : status)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                          brahmasthansStatus === status
                            ? 'bg-violet/20 text-violet-light border-violet/40'
                            : 'bg-nebula text-muted border-white/10 hover:border-white/20 hover:text-star'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Plot Slope Direction */}
                <div>
                  <label className="block text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">
                    Plot Slope Direction <span className="text-muted font-normal normal-case">(optional)</span>
                  </label>
                  <select
                    value={slopeDir}
                    onChange={e => setSlopeDir(e.target.value)}
                    className="w-full bg-nebula border border-white/10 rounded-xl px-4 py-3 text-star text-sm focus:outline-none focus:border-violet/50 transition-colors appearance-none cursor-pointer"
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%236b7280' d='M1 1l5 5 5-5'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center' }}
                  >
                    <option value="" className="bg-nebula text-muted">Select direction</option>
                    {DIRECTIONS.map(dir => (
                      <option key={dir} value={dir} className="bg-nebula text-star">
                        {dir}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Name Initial */}
                <div>
                  <label className="block text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">
                    Name Initial <span className="text-muted font-normal normal-case">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={nameInitial}
                    onChange={e => setNameInitial(e.target.value.slice(0, 1).toUpperCase())}
                    placeholder="e.g. S"
                    maxLength={1}
                    className="w-full bg-nebula border border-white/10 rounded-xl px-4 py-3 text-star text-sm placeholder:text-muted focus:outline-none focus:border-violet/50 transition-colors"
                  />
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Validation Error */}
      {error && (
        <p className="text-rose text-sm">{error}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-violet to-rose text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-50 hover:shadow-lg hover:shadow-violet/30 transition-all"
      >
        {loading ? 'Analyzing...' : 'Analyze My Space \u2736'}
      </button>

    </form>
  )
}
