import type {Tense, Format} from './relative-time.js'
import RelativeTime from './relative-time.js'
import ExtendedTimeElement from './extended-time-element.js'
import {localeFromElement} from './utils.js'

export default class RelativeTimeElement extends ExtendedTimeElement {
  static get observedAttributes() {
    return [...ExtendedTimeElement.observedAttributes, 'prefix']
  }

  getFormattedDate(): string | undefined {
    const date = this.date
    if (!date) return
    const relativeTime = new RelativeTime(date, localeFromElement(this))
    const format = this.format
    const tense = this.tense
    const micro = format === 'micro'
    if (tense === 'past') {
      return micro ? relativeTime.microTimeAgo() : relativeTime.timeAgo()
    }
    if (tense === 'future') {
      return micro ? relativeTime.microTimeUntil() : relativeTime.timeUntil()
    }
    if (format === 'auto') {
      const ago = micro ? relativeTime.microTimeAgo() : relativeTime.timeElapsed()
      if (ago) {
        return ago
      }
      const ahead = micro ? relativeTime.microTimeUntil() : relativeTime.timeAhead()
      if (ahead) {
        return ahead
      }
    }
    if (format !== 'auto' && format !== 'micro') {
      return relativeTime.formatDate(format)
    }
    return `${this.prefix ? `${this.prefix} ` : ''}${relativeTime.formatDate()}`
  }

  /** @deprecated */
  get prefix(): string {
    return this.getAttribute('prefix') ?? 'on'
  }

  /** @deprecated */
  set prefix(value: string) {
    this.setAttribute('prefix', value)
  }

  get tense(): Tense {
    const tense = this.getAttribute('tense')
    if (tense === 'past') return 'past'
    if (tense === 'future') return 'future'
    return 'auto'
  }

  set tense(value: Tense) {
    this.setAttribute('tense', value)
  }

  get format(): Format {
    const format = this.getAttribute('format')
    if (format === 'micro') return 'micro'
    if (format && format.includes('%')) return format
    return 'auto'
  }

  set format(value: Format) {
    this.setAttribute('format', value)
  }

  connectedCallback(): void {
    nowElements.push(this)

    if (!updateNowElementsId) {
      updateNowElements()
      updateNowElementsId = window.setInterval(updateNowElements, 60 * 1000)
    }
    super.connectedCallback()
  }

  disconnectedCallback(): void {
    const ix = nowElements.indexOf(this)
    if (ix !== -1) {
      nowElements.splice(ix, 1)
    }

    if (!nowElements.length) {
      if (updateNowElementsId) {
        clearInterval(updateNowElementsId)
        updateNowElementsId = null
      }
    }
  }
}

// Internal: Array tracking all elements attached to the document that need
// to be updated every minute.
const nowElements: RelativeTimeElement[] = []

// Internal: Timer ID for `updateNowElements` interval.
let updateNowElementsId: number | null

// Internal: Install a timer to refresh all attached relative-time elements every
// minute.
function updateNowElements() {
  let time
  let i
  let len

  for (i = 0, len = nowElements.length; i < len; i++) {
    time = nowElements[i]
    time.textContent = time.getFormattedDate() || ''
  }
}

// Public: RelativeTimeElement constructor.
//
//   var time = new RelativeTimeElement()
//   # => <relative-time></relative-time>
//
if (!window.customElements.get('relative-time')) {
  window.RelativeTimeElement = RelativeTimeElement
  window.customElements.define('relative-time', RelativeTimeElement)
}

declare global {
  interface Window {
    RelativeTimeElement: typeof RelativeTimeElement
  }
  interface HTMLElementTagNameMap {
    'relative-time': RelativeTimeElement
  }
}
