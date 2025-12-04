<template>
  <div class="reseller-events-container">
    <!-- Header -->
    <header class="page-header">
      <h1 class="page-title centered">Events & Bookinger</h1>
      <p class="page-subtitle centered">Administrer din tilgjengelighet, events og bookinger</p>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Laster data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
      <button @click="loadData" class="btn btn-primary">Prøv igjen</button>
    </div>

    <!-- Main Content -->
    <div v-else class="main-content">
      <!-- Tabs Navigation -->
      <div class="tabs-container">
        <!-- Desktop Tabs -->
        <nav class="tabs-nav desktop-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="['tab-btn', { 'active': activeTab === tab.id }]"
          >
            <span class="tab-icon">{{ tab.icon }}</span>
            <span class="tab-label">{{ tab.label }}</span>
            <span v-if="tab.count !== null" class="tab-count">{{ tab.count }}</span>
          </button>
        </nav>

        <!-- Mobile Dropdown -->
        <div class="mobile-tabs">
          <button @click="mobileMenuOpen = !mobileMenuOpen" class="mobile-tab-trigger">
            <span class="tab-icon">{{ activeTabData.icon }}</span>
            <span class="tab-label">{{ activeTabData.label }}</span>
            <span class="dropdown-arrow">{{ mobileMenuOpen ? '▲' : '▼' }}</span>
          </button>
          <div v-if="mobileMenuOpen" class="mobile-tab-menu">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="selectMobileTab(tab.id)"
              :class="['mobile-tab-item', { 'active': activeTab === tab.id }]"
            >
              <span class="tab-icon">{{ tab.icon }}</span>
              <span class="tab-label">{{ tab.label }}</span>
              <span v-if="tab.count !== null" class="tab-count">{{ tab.count }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- TAB 1: Event Settings -->
        <div v-if="activeTab === 'settings'" class="tab-panel">
          <div class="settings-grid-4">
            <!-- TOP LEFT: Availability Settings Card -->
            <div class="settings-card">
              <h3 class="card-title">
                <span class="card-icon">📅</span>
                Tilgjengelighet
              </h3>

              <div v-if="!availability" class="empty-state">
                <p>Du har ikke satt opp tilgjengelighet ennå.</p>
                <button @click="showAvailabilityModal = true" class="btn btn-confirm">
                  Sett opp tilgjengelighet
                </button>
              </div>

              <div v-else class="availability-info">
                <div class="info-row">
                  <span class="info-label">Dager:</span>
                  <span class="info-value">{{ formatDays(availability.days_input) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Timer:</span>
                  <span class="info-value">{{ formatHours(availability.hours_input) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Standard adresse:</span>
                  <span class="info-value">{{ availability.default_address || 'Ikke satt' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Kapasitet per time:</span>
                  <span class="info-value">{{ availability.default_capacity_per_hour }} booking(er)</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Status:</span>
                  <span :class="['status-badge', availability.active ? 'status-active' : 'status-inactive']">
                    {{ availability.active ? 'Aktiv' : 'Inaktiv' }}
                  </span>
                </div>
                <button @click="showAvailabilityModal = true" class="btn btn-secondary">
                  Endre tilgjengelighet
                </button>
              </div>
            </div>

            <!-- TOP RIGHT: Exceptions Card -->
            <div class="settings-card">
              <h3 class="card-title">
                <span class="card-icon">🚫</span>
                Utilgjengelige tider
              </h3>

              <p class="card-description">
                Legg til perioder hvor du ikke er tilgjengelig.
              </p>

              <div v-if="activeExceptions.length === 0" class="empty-state">
                <p>Ingen aktive unntak.</p>
              </div>

              <div v-else class="exceptions-list">
                <div
                  v-for="exception in activeExceptions"
                  :key="exception.id"
                  class="exception-item"
                >
                  <div class="exception-info">
                    <span class="exception-dates">
                      {{ formatDateTime(exception.start_datetime) }} - {{ formatDateTime(exception.end_datetime) }}
                    </span>
                    <span :class="['exception-type', exception.is_unavailable ? 'unavailable' : 'capacity-change']">
                      {{ exception.is_unavailable ? 'Utilgjengelig' : `Kapasitet: ${exception.capacity_override}` }}
                    </span>
                  </div>
                  <button @click="deleteException(exception.id)" class="btn-icon btn-delete">
                    🗑️
                  </button>
                </div>
              </div>

              <button @click="showExceptionModal = true" class="btn btn-secondary">
                + Legg til unntak
              </button>
            </div>

            <!-- BOTTOM LEFT: Locations Card -->
            <div class="settings-card">
              <h3 class="card-title">
                <span class="card-icon">📍</span>
                Lokasjoner
              </h3>

              <p class="card-description">
                Velg hvilke lokasjoner som skal knyttes til dine events.
              </p>

              <div class="locations-list">
                <label
                  v-for="location in companyLocations"
                  :key="location.id"
                  :class="['location-checkbox', { 'locked': isDefaultLocation(location.id) }]"
                >
                  <input
                    type="checkbox"
                    :checked="isLocationSelected(location.id)"
                    :disabled="isDefaultLocation(location.id)"
                    @change="toggleLocation(location.id)"
                  />
                  <span class="checkbox-label">
                    {{ location.location_name }}
                    <span v-if="isDefaultLocation(location.id)" class="locked-badge">Standard</span>
                  </span>
                </label>
              </div>

              <button
                @click="saveLocations"
                :disabled="savingLocations"
                class="btn btn-confirm"
              >
                {{ savingLocations ? 'Lagrer...' : 'Lagre lokasjoner' }}
              </button>
            </div>

            <!-- BOTTOM RIGHT: CC Colleagues Card -->
            <div class="settings-card">
              <h3 class="card-title">
                <span class="card-icon">👥</span>
                Kollegaer på kopi
              </h3>

              <p class="card-description">
                Velg hvilke kollegaer som skal få kopi av bookingvarsler.
              </p>

              <div v-if="colleagues.length === 0" class="empty-state">
                <p>Ingen kollegaer funnet i din bedrift.</p>
              </div>

              <div v-else class="colleagues-list">
                <label
                  v-for="colleague in colleagues"
                  :key="colleague.id"
                  class="colleague-checkbox"
                >
                  <input
                    type="checkbox"
                    :checked="isColleagueSelected(colleague.id)"
                    @change="toggleColleague(colleague.id)"
                  />
                  <span class="checkbox-label">
                    {{ colleague.first_name }} {{ colleague.last_name }}
                    <span class="colleague-email">{{ colleague.email }}</span>
                  </span>
                </label>
              </div>

              <button
                @click="saveCcResellers"
                :disabled="savingCcResellers"
                class="btn btn-confirm"
              >
                {{ savingCcResellers ? 'Lagrer...' : 'Lagre CC-valg' }}
              </button>
            </div>
          </div>
        </div>

        <!-- TAB 2: Open Events -->
        <div v-if="activeTab === 'events'" class="tab-panel">
          <!-- Filters -->
          <div class="filters-bar">
            <div class="search-box">
              <input
                v-model="eventsSearch"
                type="text"
                placeholder="Søk etter dato, adresse..."
                class="search-input"
              />
              <span class="search-icon">🔍</span>
            </div>
            <div class="filter-group">
              <select v-model="eventsStatusFilter" class="filter-select">
                <option value="all">Alle statuser</option>
                <option value="active">Aktive</option>
                <option value="inactive">Inaktive</option>
              </select>
              <select v-model="eventsLocationFilter" class="filter-select">
                <option value="all">Alle lokasjoner</option>
                <option v-for="loc in uniqueEventLocations" :key="loc" :value="loc">
                  {{ loc }}
                </option>
              </select>
            </div>
          </div>

          <!-- Events Table (Desktop) -->
          <div class="table-container desktop-only">
            <table class="data-table">
              <thead>
                <tr>
                  <th @click="sortEvents('start_datetime')" class="sortable">
                    Dato/Tid
                    <span class="sort-icon">{{ getSortIcon('start_datetime', 'events') }}</span>
                  </th>
                  <th>Adresse</th>
                  <th>Lokasjon</th>
                  <th>Status</th>
                  <th>Handling</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredEvents.length === 0">
                  <td colspan="5" class="empty-table">Ingen events funnet</td>
                </tr>
                <tr v-for="event in paginatedEvents" :key="event.id">
                  <td class="date-cell">
                    {{ formatEventDateTime(event.start_datetime, event.end_datetime) }}
                  </td>
                  <td class="address-cell">
                    {{ event.override_address || event.default_address || 'Ikke satt' }}
                  </td>
                  <td>{{ event.location_name || '-' }}</td>
                  <td>
                    <span :class="['status-badge', event.inactive ? 'status-inactive' : 'status-active']">
                      {{ event.inactive ? 'Inaktiv' : 'Aktiv' }}
                    </span>
                  </td>
                  <td>
                    <button @click="openEventModal(event)" class="btn btn-small">
                      Rediger
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Events Cards (Mobile) -->
          <div class="cards-container mobile-only">
            <div v-if="filteredEvents.length === 0" class="empty-state">
              <p>Ingen events funnet</p>
            </div>
            <div v-for="event in paginatedEvents" :key="event.id" class="data-card">
              <div class="card-header">
                <span class="card-date">{{ formatEventDateTime(event.start_datetime, event.end_datetime) }}</span>
                <span :class="['status-badge', event.inactive ? 'status-inactive' : 'status-active']">
                  {{ event.inactive ? 'Inaktiv' : 'Aktiv' }}
                </span>
              </div>
              <div class="card-body">
                <div class="card-row">
                  <span class="card-label">Adresse:</span>
                  <span class="card-value">{{ event.override_address || event.default_address || 'Ikke satt' }}</span>
                </div>
                <div class="card-row" v-if="event.location_name">
                  <span class="card-label">Lokasjon:</span>
                  <span class="card-value">{{ event.location_name }}</span>
                </div>
              </div>
              <div class="card-footer">
                <button @click="openEventModal(event)" class="btn btn-small btn-full">
                  Rediger
                </button>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div class="pagination" v-if="totalEventPages > 1">
            <button
              @click="eventsPage--"
              :disabled="eventsPage === 1"
              class="pagination-btn"
            >
              ← Forrige
            </button>
            <span class="pagination-info">
              Side {{ eventsPage }} av {{ totalEventPages }} ({{ filteredEvents.length }} events)
            </span>
            <button
              @click="eventsPage++"
              :disabled="eventsPage >= totalEventPages"
              class="pagination-btn"
            >
              Neste →
            </button>
          </div>
        </div>

        <!-- TAB 3: Bookings -->
        <div v-if="activeTab === 'bookings'" class="tab-panel">
          <!-- Filters -->
          <div class="filters-bar">
            <div class="search-box">
              <input
                v-model="bookingsSearch"
                type="text"
                placeholder="Søk etter navn, e-post, telefon..."
                class="search-input"
              />
              <span class="search-icon">🔍</span>
            </div>
            <div class="filter-group">
              <select v-model="bookingsStatusFilter" class="filter-select">
                <option value="all">Alle statuser</option>
                <option value="confirmed">Bekreftet</option>
                <option value="completed">Gjennomført</option>
                <option value="cancelled">Kansellert</option>
                <option value="no_show">No-show</option>
              </select>
              <select v-model="bookingsTimeFilter" class="filter-select">
                <option value="all">Alle</option>
                <option value="upcoming">Kommende</option>
                <option value="past">Tidligere</option>
              </select>
            </div>
          </div>

          <!-- Bookings Table (Desktop) -->
          <div class="table-container desktop-only">
            <table class="data-table">
              <thead>
                <tr>
                  <th @click="sortBookings('event_datetime')" class="sortable">
                    Dato/Tid
                    <span class="sort-icon">{{ getSortIcon('event_datetime', 'bookings') }}</span>
                  </th>
                  <th>Kunde</th>
                  <th>Kontakt</th>
                  <th>Status</th>
                  <th>Handling</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredBookings.length === 0">
                  <td colspan="5" class="empty-table">Ingen bookinger funnet</td>
                </tr>
                <tr v-for="booking in paginatedBookings" :key="booking.id">
                  <td class="date-cell">
                    {{ formatBookingDateTime(booking.event_datetime) }}
                  </td>
                  <td>
                    <span class="customer-name">{{ booking.customer_name || 'Ukjent' }}</span>
                  </td>
                  <td>
                    <div class="contact-info">
                      <span v-if="booking.customer_email" class="contact-email">{{ booking.customer_email }}</span>
                      <span v-if="booking.customer_phone" class="contact-phone">{{ booking.customer_phone }}</span>
                    </div>
                  </td>
                  <td>
                    <span :class="['status-badge', getBookingStatusClass(booking.status)]">
                      {{ getBookingStatusText(booking.status) }}
                    </span>
                  </td>
                  <td>
                    <button @click="openBookingModal(booking)" class="btn btn-small">
                      Detaljer
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Bookings Cards (Mobile) -->
          <div class="cards-container mobile-only">
            <div v-if="filteredBookings.length === 0" class="empty-state">
              <p>Ingen bookinger funnet</p>
            </div>
            <div v-for="booking in paginatedBookings" :key="booking.id" class="data-card">
              <div class="card-header">
                <span class="card-date">{{ formatBookingDateTime(booking.event_datetime) }}</span>
                <span :class="['status-badge', getBookingStatusClass(booking.status)]">
                  {{ getBookingStatusText(booking.status) }}
                </span>
              </div>
              <div class="card-body">
                <div class="card-row">
                  <span class="card-label">Kunde:</span>
                  <span class="card-value">{{ booking.customer_name || 'Ukjent' }}</span>
                </div>
                <div class="card-row" v-if="booking.customer_email">
                  <span class="card-label">E-post:</span>
                  <span class="card-value">{{ booking.customer_email }}</span>
                </div>
                <div class="card-row" v-if="booking.customer_phone">
                  <span class="card-label">Telefon:</span>
                  <span class="card-value">{{ booking.customer_phone }}</span>
                </div>
              </div>
              <div class="card-footer">
                <button @click="openBookingModal(booking)" class="btn btn-small btn-full">
                  Detaljer
                </button>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div class="pagination" v-if="totalBookingPages > 1">
            <button
              @click="bookingsPage--"
              :disabled="bookingsPage === 1"
              class="pagination-btn"
            >
              ← Forrige
            </button>
            <span class="pagination-info">
              Side {{ bookingsPage }} av {{ totalBookingPages }} ({{ filteredBookings.length }} bookinger)
            </span>
            <button
              @click="bookingsPage++"
              :disabled="bookingsPage >= totalBookingPages"
              class="pagination-btn"
            >
              Neste →
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODALS -->

    <!-- Availability Modal -->
    <div v-if="showAvailabilityModal" class="modal-overlay" @click.self="showAvailabilityModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ availability ? 'Rediger tilgjengelighet' : 'Sett opp tilgjengelighet' }}</h2>
          <button @click="showAvailabilityModal = false" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Tilgjengelige dager</label>
            <div class="checkbox-grid">
              <label v-for="day in allDays" :key="day.value" class="day-checkbox">
                <input
                  type="checkbox"
                  :value="day.value"
                  v-model="availabilityForm.days"
                />
                <span>{{ day.label }}</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>Tilgjengelige timer</label>
            <div class="hours-grid">
              <label v-for="hour in allHours" :key="hour" class="hour-checkbox">
                <input
                  type="checkbox"
                  :value="hour"
                  v-model="availabilityForm.hours"
                />
                <span>{{ hour }}</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label for="default-address">Standard adresse</label>
            <input
              id="default-address"
              v-model="availabilityForm.defaultAddress"
              type="text"
              placeholder="F.eks. Storgata 1, 0123 Oslo"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="maps-url">Google Maps URL (valgfritt)</label>
            <input
              id="maps-url"
              v-model="availabilityForm.mapsUrl"
              type="url"
              placeholder="https://maps.google.com/..."
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="capacity">Kapasitet per time</label>
            <input
              id="capacity"
              v-model.number="availabilityForm.capacity"
              type="number"
              min="1"
              max="10"
              class="form-input form-input-small"
            />
          </div>

          <div class="form-group">
            <label class="toggle-label">
              <input
                type="checkbox"
                v-model="availabilityForm.active"
              />
              <span>Aktiv</span>
            </label>
          </div>
        </div>
        <div class="modal-footer modal-footer-centered">
          <button @click="showAvailabilityModal = false" class="btn btn-secondary">Avbryt</button>
          <button @click="saveAvailability" :disabled="savingAvailability" class="btn btn-confirm">
            {{ savingAvailability ? 'Lagrer...' : 'Lagre' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Exception Modal -->
    <div v-if="showExceptionModal" class="modal-overlay" @click.self="showExceptionModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Legg til unntak</h2>
          <button @click="showExceptionModal = false" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="exception-start">Fra</label>
            <input
              id="exception-start"
              v-model="exceptionForm.startDatetime"
              type="datetime-local"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="exception-end">Til</label>
            <input
              id="exception-end"
              v-model="exceptionForm.endDatetime"
              type="datetime-local"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label class="toggle-label">
              <input
                type="checkbox"
                v-model="exceptionForm.isUnavailable"
              />
              <span>Helt utilgjengelig (hvis ikke: endre kapasitet)</span>
            </label>
          </div>

          <div v-if="!exceptionForm.isUnavailable" class="form-group">
            <label for="capacity-override">Ny kapasitet</label>
            <input
              id="capacity-override"
              v-model.number="exceptionForm.capacityOverride"
              type="number"
              min="0"
              max="10"
              class="form-input form-input-small"
            />
          </div>
        </div>
        <div class="modal-footer modal-footer-centered">
          <button @click="showExceptionModal = false" class="btn btn-secondary">Avbryt</button>
          <button @click="saveException" :disabled="savingException" class="btn btn-confirm">
            {{ savingException ? 'Lagrer...' : 'Lagre' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Event Edit Modal -->
    <div v-if="showEventModal" class="modal-overlay" @click.self="showEventModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Rediger event</h2>
          <button @click="showEventModal = false" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="event-summary">
            <p><strong>Dato:</strong> {{ formatEventDateTime(selectedEvent?.start_datetime, selectedEvent?.end_datetime) }}</p>
            <p><strong>Standard adresse:</strong> {{ selectedEvent?.default_address || 'Ikke satt' }}</p>
          </div>

          <div class="form-group">
            <label for="override-address">Overstyr adresse (valgfritt)</label>
            <input
              id="override-address"
              v-model="eventForm.overrideAddress"
              type="text"
              placeholder="La stå tom for å bruke standard adresse"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label class="toggle-label">
              <input
                type="checkbox"
                v-model="eventForm.inactive"
              />
              <span>Sett som inaktiv (skjult for booking)</span>
            </label>
          </div>
        </div>
        <div class="modal-footer modal-footer-centered">
          <button @click="showEventModal = false" class="btn btn-secondary">Avbryt</button>
          <button @click="saveEvent" :disabled="savingEvent" class="btn btn-confirm">
            {{ savingEvent ? 'Lagrer...' : 'Lagre' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Booking Details Modal -->
    <div v-if="showBookingModal" class="modal-overlay" @click.self="showBookingModal = false">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>Booking detaljer</h2>
          <button @click="showBookingModal = false" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="booking-details-grid">
            <div class="detail-section">
              <h3>Event</h3>
              <p><strong>Dato/tid:</strong> {{ formatBookingDateTime(selectedBooking?.event_datetime) }}</p>
              <p><strong>Adresse:</strong> {{ selectedBooking?.event_address || 'Ikke satt' }}</p>
              <p><strong>Lokasjon:</strong> {{ selectedBooking?.location_name || '-' }}</p>
            </div>

            <div class="detail-section">
              <h3>Kunde</h3>
              <p><strong>Navn:</strong> {{ selectedBooking?.customer_name || 'Ukjent' }}</p>
              <p><strong>E-post:</strong> {{ selectedBooking?.customer_email || '-' }}</p>
              <p><strong>Telefon:</strong> {{ selectedBooking?.customer_phone || '-' }}</p>
              <p><strong>Postnummer:</strong> {{ selectedBooking?.customer_postal_code || '-' }}</p>
            </div>

            <div class="detail-section full-width">
              <h3>Booking</h3>
              <p><strong>Status:</strong>
                <span :class="['status-badge', getBookingStatusClass(selectedBooking?.status)]">
                  {{ getBookingStatusText(selectedBooking?.status) }}
                </span>
              </p>
              <p><strong>Opprettet:</strong> {{ formatDateTime(selectedBooking?.created_at) }}</p>
              <p v-if="selectedBooking?.notes_customer"><strong>Kundenotat:</strong> {{ selectedBooking?.notes_customer }}</p>
              <p v-if="selectedBooking?.notes_internal"><strong>Internt notat:</strong> {{ selectedBooking?.notes_internal }}</p>
            </div>
          </div>

          <div class="form-group">
            <label for="internal-notes">Internt notat</label>
            <textarea
              id="internal-notes"
              v-model="bookingForm.notesInternal"
              rows="3"
              placeholder="Legg til et internt notat..."
              class="form-textarea"
            ></textarea>
          </div>

          <div class="form-group">
            <label>Endre status</label>
            <select v-model="bookingForm.status" class="form-select">
              <option value="confirmed">Bekreftet</option>
              <option value="completed">Gjennomført</option>
              <option value="cancelled_by_admin">Kansellert</option>
              <option value="no_show">No-show</option>
            </select>
          </div>
        </div>
        <div class="modal-footer modal-footer-centered">
          <button @click="showBookingModal = false" class="btn btn-secondary">Lukk</button>
          <button @click="saveBooking" :disabled="savingBooking" class="btn btn-confirm">
            {{ savingBooking ? 'Lagrer...' : 'Lagre endringer' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { createClient } from '@supabase/supabase-js'

export default {
  name: 'ResellerPortal',

  props: {
    content: { type: Object, required: true }
  },

  data() {
    return {
      // Core state
      loading: true,
      error: null,
      supabase: null,
      resellerId: null,
      companyId: null,
      realtimeChannel: null,

      // Tabs
      activeTab: 'settings',
      mobileMenuOpen: false,

      // Data
      availability: null,
      exceptions: [],
      events: [],
      bookings: [],
      allLocations: [],
      companyLocations: [],
      selectedLocations: [],
      colleagues: [],
      selectedCcResellers: [],

      // Filters & Search - Events
      eventsSearch: '',
      eventsStatusFilter: 'all',
      eventsLocationFilter: 'all',
      eventsPage: 1,
      eventsSortField: 'start_datetime',
      eventsSortDir: 'asc',

      // Filters & Search - Bookings
      bookingsSearch: '',
      bookingsStatusFilter: 'all',
      bookingsTimeFilter: 'upcoming',
      bookingsPage: 1,
      bookingsSortField: 'event_datetime',
      bookingsSortDir: 'asc',

      // Modals
      showAvailabilityModal: false,
      showExceptionModal: false,
      showEventModal: false,
      showBookingModal: false,

      // Selected items
      selectedEvent: null,
      selectedBooking: null,

      // Form data
      availabilityForm: {
        days: [],
        hours: [],
        defaultAddress: '',
        mapsUrl: '',
        capacity: 1,
        active: true
      },
      exceptionForm: {
        startDatetime: '',
        endDatetime: '',
        isUnavailable: true,
        capacityOverride: 0
      },
      eventForm: {
        overrideAddress: '',
        inactive: false
      },
      bookingForm: {
        status: 'confirmed',
        notesInternal: ''
      },

      // Saving states
      savingAvailability: false,
      savingLocations: false,
      savingException: false,
      savingEvent: false,
      savingBooking: false,
      savingCcResellers: false,

      // Constants
      allDays: [
        { value: 'Monday', label: 'Mandag' },
        { value: 'Tuesday', label: 'Tirsdag' },
        { value: 'Wednesday', label: 'Onsdag' },
        { value: 'Thursday', label: 'Torsdag' },
        { value: 'Friday', label: 'Fredag' },
        { value: 'Saturday', label: 'Lørdag' },
        { value: 'Sunday', label: 'Søndag' }
      ],
      allHours: [
        '06:00-07:00', '07:00-08:00', '08:00-09:00', '09:00-10:00',
        '10:00-11:00', '11:00-12:00', '12:00-13:00', '13:00-14:00',
        '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00',
        '18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-22:00'
      ]
    }
  },

  computed: {
    pageSize() {
      return this.content?.pageSize || 25
    },

    tabs() {
      return [
        { id: 'settings', label: 'Event Settings', icon: '⚙️', count: null },
        { id: 'events', label: 'Ledige Events', icon: '📅', count: this.filteredEvents.length },
        { id: 'bookings', label: 'Bookinger', icon: '📋', count: this.filteredBookings.length }
      ]
    },

    activeTabData() {
      return this.tabs.find(t => t.id === this.activeTab) || this.tabs[0]
    },

    // Filter out expired exceptions (end_datetime < now)
    activeExceptions() {
      const now = new Date()
      return this.exceptions.filter(e => new Date(e.end_datetime) >= now)
    },

    uniqueEventLocations() {
      const locations = this.events.map(e => e.location_name).filter(Boolean)
      return [...new Set(locations)].sort()
    },

    filteredEvents() {
      let result = this.events

      // Only future events without bookings
      const now = new Date()
      result = result.filter(e => new Date(e.start_datetime) > now && !e.has_booking)

      // Search filter
      if (this.eventsSearch) {
        const search = this.eventsSearch.toLowerCase()
        result = result.filter(e =>
          (e.override_address || e.default_address || '').toLowerCase().includes(search) ||
          (e.location_name || '').toLowerCase().includes(search) ||
          this.formatEventDateTime(e.start_datetime, e.end_datetime).toLowerCase().includes(search)
        )
      }

      // Status filter
      if (this.eventsStatusFilter !== 'all') {
        const isInactive = this.eventsStatusFilter === 'inactive'
        result = result.filter(e => e.inactive === isInactive)
      }

      // Location filter
      if (this.eventsLocationFilter !== 'all') {
        result = result.filter(e => e.location_name === this.eventsLocationFilter)
      }

      // Sort - always by start_datetime ascending (earliest first)
      result.sort((a, b) => {
        const aDate = new Date(a.start_datetime)
        const bDate = new Date(b.start_datetime)
        return aDate.getTime() - bDate.getTime()
      })

      return result
    },

    paginatedEvents() {
      const start = (this.eventsPage - 1) * this.pageSize
      return this.filteredEvents.slice(start, start + this.pageSize)
    },

    totalEventPages() {
      return Math.ceil(this.filteredEvents.length / this.pageSize)
    },

    filteredBookings() {
      let result = this.bookings

      // Search filter
      if (this.bookingsSearch) {
        const search = this.bookingsSearch.toLowerCase()
        result = result.filter(b =>
          (b.customer_name || '').toLowerCase().includes(search) ||
          (b.customer_email || '').toLowerCase().includes(search) ||
          (b.customer_phone || '').toLowerCase().includes(search)
        )
      }

      // Status filter
      if (this.bookingsStatusFilter !== 'all') {
        if (this.bookingsStatusFilter === 'cancelled') {
          result = result.filter(b => b.status.includes('cancelled'))
        } else {
          result = result.filter(b => b.status === this.bookingsStatusFilter)
        }
      }

      // Time filter
      const now = new Date()
      if (this.bookingsTimeFilter === 'upcoming') {
        result = result.filter(b => new Date(b.event_datetime) > now)
      } else if (this.bookingsTimeFilter === 'past') {
        result = result.filter(b => new Date(b.event_datetime) <= now)
      }

      // Sort - by event_datetime ascending (earliest first)
      result.sort((a, b) => {
        const aDate = new Date(a.event_datetime)
        const bDate = new Date(b.event_datetime)
        return aDate.getTime() - bDate.getTime()
      })

      return result
    },

    paginatedBookings() {
      const start = (this.bookingsPage - 1) * this.pageSize
      return this.filteredBookings.slice(start, start + this.pageSize)
    },

    totalBookingPages() {
      return Math.ceil(this.filteredBookings.length / this.pageSize)
    }
  },

  async mounted() {
    this.initSupabase()
    await this.loadData()
    this.setupRealtimeSubscriptions()
  },

  beforeUnmount() {
    // Cleanup realtime subscriptions
    if (this.realtimeChannel) {
      this.supabase.removeChannel(this.realtimeChannel)
    }
  },

  methods: {
    initSupabase() {
      const supabaseUrl = this.content?.supabaseUrl || 'https://prjefvmijalarmbxytjj.supabase.co'
      const supabaseKey = this.content?.supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByamVmdm1pamFsYXJtYnh5dGpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzODY1MjQsImV4cCI6MjA3Njk2MjUyNH0.4Czz_OjQIvmMDrz_lckxUcX3MUEu8O_WiDnP0q_6VWQ'
      this.supabase = createClient(supabaseUrl, supabaseKey)
    },

    setupRealtimeSubscriptions() {
      if (!this.supabase || !this.resellerId) return

      // Create a single channel for all subscriptions
      this.realtimeChannel = this.supabase
        .channel('reseller-portal-realtime')
        // Listen to events table changes
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'events'
          },
          (payload) => {
            console.log('realtime: events changed', payload.eventType)
            this.loadEvents()
          }
        )
        // Listen to bookings table changes
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings'
          },
          (payload) => {
            console.log('realtime: bookings changed', payload.eventType)
            this.loadBookings()
          }
        )
        // Listen to exceptions table changes
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'booking_availability_exceptions'
          },
          (payload) => {
            console.log('realtime: exceptions changed', payload.eventType)
            this.loadExceptions()
          }
        )
        // Listen to availability changes (for settings tab)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'booking_availability'
          },
          (payload) => {
            console.log('realtime: availability changed', payload.eventType)
            this.loadAvailability()
          }
        )
        .subscribe((status) => {
          console.log('realtime: subscription status', status)
        })
    },

    async loadData() {
      this.loading = true
      this.error = null

      try {
        // Get current user
        const { data: { user } } = await this.supabase.auth.getUser()
        if (!user) {
          this.error = 'Du må være innlogget for å se denne siden'
          return
        }

        // Get reseller ID and company_id
        const { data: reseller, error: resellerError } = await this.supabase
          .from('resellers')
          .select('id, company_id')
          .eq('auth_id', user.id)
          .single()

        if (resellerError || !reseller) {
          this.error = 'Kunne ikke finne reseller-konto'
          return
        }

        this.resellerId = reseller.id
        this.companyId = reseller.company_id

        // Load all data in parallel
        await Promise.all([
          this.loadAvailability(),
          this.loadExceptions(),
          this.loadEvents(),
          this.loadBookings(),
          this.loadLocations(),
          this.loadColleagues()
        ])

      } catch (err) {
        console.error('reseller_portal: Error loading data:', err)
        this.error = 'Kunne ikke laste data'
      } finally {
        this.loading = false
      }
    },

    async loadAvailability() {
      const { data, error } = await this.supabase
        .from('booking_availability')
        .select('*')
        .eq('reseller_id', this.resellerId)
        .single()

      if (!error && data) {
        this.availability = data
        // Also load selected locations
        const { data: locs } = await this.supabase
          .from('availability_locations')
          .select('location_id')
          .eq('availability_id', data.id)

        this.selectedLocations = locs?.map(l => l.location_id) || []
      }
    },

    async loadExceptions() {
      const { data, error } = await this.supabase
        .from('booking_availability_exceptions')
        .select('*')
        .eq('reseller_id', this.resellerId)
        .order('start_datetime', { ascending: true })

      if (!error) {
        this.exceptions = data || []
      }
    },

    async loadEvents() {
      const { data, error } = await this.supabase
        .from('events')
        .select(`
          id,
          start_datetime,
          end_datetime,
          capacity,
          override_address,
          inactive,
          booking_availability!inner (
            default_address,
            default_location_id,
            reseller_id
          )
        `)
        .eq('booking_availability.reseller_id', this.resellerId)
        .gte('start_datetime', new Date().toISOString())
        .order('start_datetime', { ascending: true })

      if (!error && data) {
        // Get location names
        const locationIds = [...new Set(data.map(e => e.booking_availability?.default_location_id).filter(Boolean))]

        let locationMap = {}
        if (locationIds.length > 0) {
          const { data: locations } = await this.supabase
            .from('locations')
            .select('id, location_name')
            .in('id', locationIds)

          locationMap = Object.fromEntries((locations || []).map(l => [l.id, l.location_name]))
        }

        // Check which events have bookings
        const eventIds = data.map(e => e.id)
        const { data: bookingsData } = await this.supabase
          .from('bookings')
          .select('event_id')
          .in('event_id', eventIds)
          .not('status', 'in', '("cancelled_by_admin","cancelled_by_customer")')

        const eventsWithBookings = new Set((bookingsData || []).map(b => b.event_id))

        this.events = data.map(e => ({
          ...e,
          default_address: e.booking_availability?.default_address,
          location_name: locationMap[e.booking_availability?.default_location_id] || null,
          has_booking: eventsWithBookings.has(e.id)
        }))
      }
    },

    async loadBookings() {
      const { data, error } = await this.supabase
        .from('bookings')
        .select(`
          id,
          status,
          notes_customer,
          notes_internal,
          created_at,
          customer:customers (
            first_name,
            last_name,
            email,
            phone,
            postal_code
          ),
          event:events!inner (
            start_datetime,
            override_address,
            booking_availability!inner (
              default_address,
              default_location_id,
              reseller_id
            )
          )
        `)
        .eq('event.booking_availability.reseller_id', this.resellerId)
        .order('created_at', { ascending: false })

      if (!error && data) {
        // Get location names
        const locationIds = [...new Set(data.map(b => b.event?.booking_availability?.default_location_id).filter(Boolean))]

        let locationMap = {}
        if (locationIds.length > 0) {
          const { data: locations } = await this.supabase
            .from('locations')
            .select('id, location_name')
            .in('id', locationIds)

          locationMap = Object.fromEntries((locations || []).map(l => [l.id, l.location_name]))
        }

        this.bookings = data.map(b => ({
          id: b.id,
          status: b.status,
          notes_customer: b.notes_customer,
          notes_internal: b.notes_internal,
          created_at: b.created_at,
          event_datetime: b.event?.start_datetime,
          event_address: b.event?.override_address || b.event?.booking_availability?.default_address,
          location_name: locationMap[b.event?.booking_availability?.default_location_id] || null,
          customer_name: b.customer ? `${b.customer.first_name || ''} ${b.customer.last_name || ''}`.trim() : null,
          customer_email: b.customer?.email,
          customer_phone: b.customer?.phone,
          customer_postal_code: b.customer?.postal_code
        }))
      }
    },

    async loadLocations() {
      // Load all locations (for fallback)
      const { data: allLocs } = await this.supabase
        .from('locations')
        .select('id, location_name')
        .eq('country_code', 'NO')
        .order('location_name')

      this.allLocations = allLocs || []

      // Load locations linked to reseller's company via locations_companies junction
      if (this.companyId) {
        const { data: companyLocs } = await this.supabase
          .from('locations_companies')
          .select('location_id, locations!inner(id, location_name)')
          .eq('company_id', this.companyId)

        if (companyLocs && companyLocs.length > 0) {
          this.companyLocations = companyLocs.map(lc => lc.locations).sort((a, b) =>
            a.location_name.localeCompare(b.location_name)
          )
        } else {
          // Fallback to all NO locations if no company-specific locations
          this.companyLocations = this.allLocations
        }
      } else {
        this.companyLocations = this.allLocations
      }
    },

    async loadColleagues() {
      if (!this.companyId) return

      // Load other resellers in the same company (excluding self)
      const { data, error } = await this.supabase
        .from('resellers')
        .select('id, first_name, last_name, email')
        .eq('company_id', this.companyId)
        .neq('id', this.resellerId)
        .eq('active', true)
        .order('first_name')

      if (!error) {
        this.colleagues = data || []
      }

      // Load current CC selections for this reseller's availability
      if (this.availability) {
        await this.loadCcResellers()
      }
    },

    async loadCcResellers() {
      // We need to load CC resellers from events_cc_resellers
      // For now, we'll store a "default" CC list on the availability level
      // This can be enhanced later to be per-event
      const { data } = await this.supabase
        .from('events_cc_resellers')
        .select('reseller_id')
        .in('event_id', this.events.map(e => e.id))

      if (data) {
        // Get unique reseller IDs that are CC'd on any of this reseller's events
        const ccIds = [...new Set(data.map(d => d.reseller_id))]
        this.selectedCcResellers = ccIds
      }
    },

    // Tab methods
    selectMobileTab(tabId) {
      this.activeTab = tabId
      this.mobileMenuOpen = false
    },

    // Formatting methods
    formatDays(days) {
      if (!days || days.length === 0) return 'Ingen'
      const dayMap = {
        'Monday': 'Man', 'Tuesday': 'Tir', 'Wednesday': 'Ons',
        'Thursday': 'Tor', 'Friday': 'Fre', 'Saturday': 'Lør', 'Sunday': 'Søn'
      }
      return days.map(d => dayMap[d] || d).join(', ')
    },

    formatHours(hours) {
      if (!hours || hours.length === 0) return 'Ingen'
      if (hours.length > 3) {
        const sorted = [...hours].sort()
        return `${sorted[0].split('-')[0]} - ${sorted[sorted.length - 1].split('-')[1]}`
      }
      return hours.join(', ')
    },

    formatDateTime(datetime) {
      if (!datetime) return '-'
      const d = new Date(datetime)
      return d.toLocaleDateString('nb-NO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    formatEventDateTime(start, end) {
      if (!start) return '-'
      const s = new Date(start)
      const e = end ? new Date(end) : null

      const dateStr = s.toLocaleDateString('nb-NO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
      const startTime = s.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })
      const endTime = e ? e.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' }) : ''

      return `${dateStr} ${startTime}${endTime ? ' - ' + endTime : ''}`
    },

    formatBookingDateTime(datetime) {
      if (!datetime) return '-'
      const d = new Date(datetime)
      return d.toLocaleDateString('nb-NO', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    // Status methods
    getBookingStatusClass(status) {
      const classes = {
        'confirmed': 'status-confirmed',
        'completed': 'status-completed',
        'cancelled_by_admin': 'status-cancelled',
        'cancelled_by_customer': 'status-cancelled',
        'no_show': 'status-no-show',
        'pending_verification': 'status-pending'
      }
      return classes[status] || 'status-default'
    },

    getBookingStatusText(status) {
      const texts = {
        'confirmed': 'Bekreftet',
        'completed': 'Gjennomført',
        'cancelled_by_admin': 'Kansellert',
        'cancelled_by_customer': 'Kansellert av kunde',
        'no_show': 'No-show',
        'pending_verification': 'Venter bekreftelse'
      }
      return texts[status] || status
    },

    // Sort methods
    sortEvents(field) {
      if (this.eventsSortField === field) {
        this.eventsSortDir = this.eventsSortDir === 'asc' ? 'desc' : 'asc'
      } else {
        this.eventsSortField = field
        this.eventsSortDir = 'asc'
      }
      this.eventsPage = 1
    },

    sortBookings(field) {
      if (this.bookingsSortField === field) {
        this.bookingsSortDir = this.bookingsSortDir === 'asc' ? 'desc' : 'asc'
      } else {
        this.bookingsSortField = field
        this.bookingsSortDir = 'asc'
      }
      this.bookingsPage = 1
    },

    getSortIcon(field, type) {
      const sortField = type === 'events' ? this.eventsSortField : this.bookingsSortField
      const sortDir = type === 'events' ? this.eventsSortDir : this.bookingsSortDir

      if (sortField !== field) return '↕'
      return sortDir === 'asc' ? '↑' : '↓'
    },

    // Location methods
    isLocationSelected(locationId) {
      return this.selectedLocations.includes(locationId)
    },

    isDefaultLocation(locationId) {
      // Check if this is the default_location_id from availability
      return this.availability?.default_location_id === locationId
    },

    toggleLocation(locationId) {
      // Don't allow toggling the default location
      if (this.isDefaultLocation(locationId)) return

      const index = this.selectedLocations.indexOf(locationId)
      if (index > -1) {
        this.selectedLocations.splice(index, 1)
      } else {
        this.selectedLocations.push(locationId)
      }
    },

    // CC Colleagues methods
    isColleagueSelected(resellerId) {
      return this.selectedCcResellers.includes(resellerId)
    },

    toggleColleague(resellerId) {
      const index = this.selectedCcResellers.indexOf(resellerId)
      if (index > -1) {
        this.selectedCcResellers.splice(index, 1)
      } else {
        this.selectedCcResellers.push(resellerId)
      }
    },

    async saveCcResellers() {
      this.savingCcResellers = true
      try {
        // Get all event IDs for this reseller
        const eventIds = this.events.map(e => e.id)

        if (eventIds.length === 0) {
          alert('Du har ingen events å knytte kollegaer til ennå.')
          return
        }

        // Delete existing CC entries for these events
        await this.supabase
          .from('events_cc_resellers')
          .delete()
          .in('event_id', eventIds)

        // Insert new CC entries for all selected colleagues on all events
        if (this.selectedCcResellers.length > 0) {
          const inserts = []
          for (const eventId of eventIds) {
            for (const resellerId of this.selectedCcResellers) {
              inserts.push({
                event_id: eventId,
                reseller_id: resellerId
              })
            }
          }

          const { error } = await this.supabase
            .from('events_cc_resellers')
            .insert(inserts)

          if (error) throw error
        }

        alert('CC-kollegaer lagret!')
      } catch (err) {
        console.error('reseller_portal: Error saving CC resellers:', err)
        alert('Kunne ikke lagre CC-valg')
      } finally {
        this.savingCcResellers = false
      }
    },

    async saveLocations() {
      if (!this.availability) {
        alert('Sett opp tilgjengelighet først')
        return
      }

      this.savingLocations = true
      try {
        // Delete existing
        await this.supabase
          .from('availability_locations')
          .delete()
          .eq('availability_id', this.availability.id)

        // Insert new
        if (this.selectedLocations.length > 0) {
          const inserts = this.selectedLocations.map(locId => ({
            availability_id: this.availability.id,
            location_id: locId
          }))

          const { error } = await this.supabase
            .from('availability_locations')
            .insert(inserts)

          if (error) throw error
        }

        alert('Lokasjoner lagret!')
      } catch (err) {
        console.error('reseller_portal: Error saving locations:', err)
        alert('Kunne ikke lagre lokasjoner')
      } finally {
        this.savingLocations = false
      }
    },

    // Modal methods
    openEventModal(event) {
      this.selectedEvent = event
      this.eventForm = {
        overrideAddress: event.override_address || '',
        inactive: event.inactive || false
      }
      this.showEventModal = true
    },

    openBookingModal(booking) {
      this.selectedBooking = booking
      this.bookingForm = {
        status: booking.status,
        notesInternal: booking.notes_internal || ''
      }
      this.showBookingModal = true
    },

    // Save methods
    async saveAvailability() {
      this.savingAvailability = true
      try {
        const data = {
          reseller_id: this.resellerId,
          days_input: this.availabilityForm.days,
          hours_input: this.availabilityForm.hours,
          default_address: this.availabilityForm.defaultAddress,
          default_address_maps_url: this.availabilityForm.mapsUrl,
          default_capacity_per_hour: this.availabilityForm.capacity,
          active: this.availabilityForm.active,
          updated_at: new Date().toISOString()
        }

        if (this.availability) {
          // Update
          const { error } = await this.supabase
            .from('booking_availability')
            .update(data)
            .eq('id', this.availability.id)

          if (error) throw error
        } else {
          // Insert
          const { error } = await this.supabase
            .from('booking_availability')
            .insert(data)

          if (error) throw error
        }

        await this.loadAvailability()
        this.showAvailabilityModal = false
        alert('Tilgjengelighet lagret!')
      } catch (err) {
        console.error('reseller_portal: Error saving availability:', err)
        alert('Kunne ikke lagre tilgjengelighet')
      } finally {
        this.savingAvailability = false
      }
    },

    async saveException() {
      if (!this.exceptionForm.startDatetime || !this.exceptionForm.endDatetime) {
        alert('Velg start og slutt-tidspunkt')
        return
      }

      this.savingException = true
      try {
        const { error } = await this.supabase
          .from('booking_availability_exceptions')
          .insert({
            reseller_id: this.resellerId,
            start_datetime: this.exceptionForm.startDatetime,
            end_datetime: this.exceptionForm.endDatetime,
            is_unavailable: this.exceptionForm.isUnavailable,
            capacity_override: this.exceptionForm.isUnavailable ? null : this.exceptionForm.capacityOverride
          })

        if (error) throw error

        await this.loadExceptions()
        this.showExceptionModal = false
        this.exceptionForm = {
          startDatetime: '',
          endDatetime: '',
          isUnavailable: true,
          capacityOverride: 0
        }
        alert('Unntak lagret!')
      } catch (err) {
        console.error('reseller_portal: Error saving exception:', err)
        alert('Kunne ikke lagre unntak')
      } finally {
        this.savingException = false
      }
    },

    async deleteException(id) {
      if (!confirm('Er du sikker på at du vil slette dette unntaket?')) return

      try {
        const { error } = await this.supabase
          .from('booking_availability_exceptions')
          .delete()
          .eq('id', id)

        if (error) throw error

        await this.loadExceptions()
      } catch (err) {
        console.error('reseller_portal: Error deleting exception:', err)
        alert('Kunne ikke slette unntak')
      }
    },

    async saveEvent() {
      if (!this.selectedEvent) return

      this.savingEvent = true
      try {
        const { error } = await this.supabase
          .from('events')
          .update({
            override_address: this.eventForm.overrideAddress || null,
            inactive: this.eventForm.inactive,
            updated_at: new Date().toISOString()
          })
          .eq('id', this.selectedEvent.id)

        if (error) throw error

        await this.loadEvents()
        this.showEventModal = false
        alert('Event oppdatert!')
      } catch (err) {
        console.error('reseller_portal: Error saving event:', err)
        alert('Kunne ikke lagre event')
      } finally {
        this.savingEvent = false
      }
    },

    async saveBooking() {
      if (!this.selectedBooking) return

      this.savingBooking = true
      try {
        const { error } = await this.supabase
          .from('bookings')
          .update({
            status: this.bookingForm.status,
            notes_internal: this.bookingForm.notesInternal,
            updated_at: new Date().toISOString()
          })
          .eq('id', this.selectedBooking.id)

        if (error) throw error

        await this.loadBookings()
        this.showBookingModal = false
        alert('Booking oppdatert!')
      } catch (err) {
        console.error('reseller_portal: Error saving booking:', err)
        alert('Kunne ikke lagre booking')
      } finally {
        this.savingBooking = false
      }
    }
  },

  watch: {
    eventsSearch() {
      this.eventsPage = 1
    },
    eventsStatusFilter() {
      this.eventsPage = 1
    },
    eventsLocationFilter() {
      this.eventsPage = 1
    },
    bookingsSearch() {
      this.bookingsPage = 1
    },
    bookingsStatusFilter() {
      this.bookingsPage = 1
    },
    bookingsTimeFilter() {
      this.bookingsPage = 1
    },
    showAvailabilityModal(val) {
      if (val && this.availability) {
        this.availabilityForm = {
          days: this.availability.days_input || [],
          hours: this.availability.hours_input || [],
          defaultAddress: this.availability.default_address || '',
          mapsUrl: this.availability.default_address_maps_url || '',
          capacity: this.availability.default_capacity_per_hour || 1,
          active: this.availability.active !== false
        }
      }
    }
  }
}
</script>

<style scoped>
/* Full CSS content - same as before, truncated for brevity */
/* See Frontend/pages/reseller/ResellerEventsPage.vue for complete styles */

.reseller-events-container {
  --color-primary: #000000;
  --color-accent: #FF6B35;
  accent-color: #FF6B35;
  --color-white: #FFFFFF;
  --color-gray-50: #FAFAFA;
  --color-gray-100: #F5F5F5;
  --color-gray-200: #E5E5E5;
  --color-gray-300: #D4D4D4;
  --color-gray-400: #A3A3A3;
  --color-gray-500: #737373;
  --color-gray-600: #525252;
  --color-gray-700: #404040;
  --color-error: #DC2626;
  --color-success: #16A34A;
  --color-warning: #F59E0B;

  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 1.5rem;
  --spacing-lg: 2rem;
  --spacing-xl: 3rem;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

  --transition: all 0.2s ease;

  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-md);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--color-primary);
  box-sizing: border-box;
}

.reseller-events-container *,
.reseller-events-container *::before,
.reseller-events-container *::after {
  box-sizing: border-box;
}

.page-header { margin-bottom: var(--spacing-lg); text-align: center; }
.page-title { font-size: 28px; font-weight: 700; margin: 0 0 var(--spacing-xs); }
.page-subtitle { font-size: 16px; color: var(--color-gray-500); margin: 0; }
.centered { text-align: center; }

.loading-container, .error-container {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: var(--spacing-xl); text-align: center;
}

.loading-spinner {
  width: 40px; height: 40px; border: 3px solid var(--color-gray-200);
  border-top-color: var(--color-accent); border-radius: 50%;
  animation: spin 1s linear infinite; margin-bottom: var(--spacing-sm);
}

@keyframes spin { to { transform: rotate(360deg); } }

.error-message { color: var(--color-error); margin-bottom: var(--spacing-md); }

.tabs-container { margin-bottom: var(--spacing-md); }
.tabs-nav { display: flex; gap: var(--spacing-xs); border-bottom: 2px solid var(--color-gray-200); }

.tab-btn {
  display: flex; align-items: center; gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md); background: none; border: none;
  border-bottom: 3px solid transparent; margin-bottom: -2px; cursor: pointer;
  font-size: 15px; font-weight: 500; color: var(--color-gray-500); transition: var(--transition);
}

.tab-btn:hover { color: var(--color-primary); }
.tab-btn.active { color: var(--color-primary); border-bottom-color: var(--color-accent); }
.tab-icon { font-size: 18px; }
.tab-count { background: var(--color-gray-100); padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; }
.tab-btn.active .tab-count { background: var(--color-accent); color: var(--color-white); }

.mobile-tabs { display: none; position: relative; }

.mobile-tab-trigger {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  gap: var(--spacing-sm); padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-white); border: 2px solid var(--color-gray-300);
  border-radius: var(--radius-md); cursor: pointer; font-size: 16px; font-weight: 500;
}

.dropdown-arrow { font-size: 12px; color: var(--color-gray-500); }

.mobile-tab-menu {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0;
  background: var(--color-white); border: 2px solid var(--color-gray-300);
  border-radius: var(--radius-md); box-shadow: var(--shadow-lg); z-index: 100; overflow: hidden;
}

.mobile-tab-item {
  width: 100%; display: flex; align-items: center; gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md); background: none; border: none;
  border-bottom: 1px solid var(--color-gray-100); cursor: pointer; font-size: 15px; text-align: left;
}

.mobile-tab-item:last-child { border-bottom: none; }
.mobile-tab-item.active { background: var(--color-gray-50); font-weight: 600; }
.mobile-tab-item:hover { background: var(--color-gray-50); }

@media (max-width: 767px) {
  .desktop-tabs { display: none; }
  .mobile-tabs { display: block; }
}

.tab-panel { padding: var(--spacing-md) 0; }

/* 4-box grid layout for settings */
.settings-grid-4 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md); }
@media (max-width: 991px) { .settings-grid-4 { grid-template-columns: 1fr; } }

.settings-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md); }
@media (max-width: 991px) { .settings-grid { grid-template-columns: 1fr; } }

.settings-card {
  background: var(--color-white); border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg); padding: var(--spacing-md);
}

.settings-card.full-width { grid-column: 1 / -1; }
.card-title { display: flex; align-items: center; gap: var(--spacing-xs); font-size: 18px; font-weight: 600; margin: 0 0 var(--spacing-md); }
.card-icon { font-size: 20px; }
.card-description { color: var(--color-gray-500); font-size: 14px; margin: 0 0 var(--spacing-md); }

.availability-info { display: flex; flex-direction: column; gap: var(--spacing-sm); }
.info-row { display: flex; justify-content: space-between; align-items: flex-start; padding: var(--spacing-xs) 0; border-bottom: 1px solid var(--color-gray-100); }
.info-row:last-of-type { border-bottom: none; }
.info-label { font-weight: 500; color: var(--color-gray-600); font-size: 14px; }
.info-value { text-align: right; font-size: 14px; max-width: 60%; }

.locations-list {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--spacing-xs); margin-bottom: var(--spacing-md); max-height: 250px;
  overflow-y: auto; padding: var(--spacing-xs); border: 1px solid var(--color-gray-200); border-radius: var(--radius-md);
}

.location-checkbox {
  display: flex; align-items: center; gap: var(--spacing-xs); cursor: pointer;
  font-size: 14px; padding: var(--spacing-xs); border-radius: var(--radius-sm); transition: var(--transition);
}

.location-checkbox:hover { background: var(--color-gray-50); }
.location-checkbox input[type="checkbox"] { accent-color: var(--color-accent); }
.location-checkbox.locked { background: var(--color-gray-100); }
.location-checkbox.locked input[type="checkbox"] { cursor: not-allowed; }
.locked-badge { font-size: 10px; background: var(--color-accent); color: white; padding: 2px 6px; border-radius: 4px; margin-left: 6px; }

/* Colleagues list styling */
.colleagues-list {
  display: flex; flex-direction: column;
  gap: var(--spacing-xs); margin-bottom: var(--spacing-md); max-height: 200px;
  overflow-y: auto; padding: var(--spacing-xs); border: 1px solid var(--color-gray-200); border-radius: var(--radius-md);
}
.colleague-checkbox {
  display: flex; align-items: center; gap: var(--spacing-xs); cursor: pointer;
  font-size: 14px; padding: var(--spacing-xs); border-radius: var(--radius-sm); transition: var(--transition);
}
.colleague-checkbox:hover { background: var(--color-gray-50); }
.colleague-checkbox input[type="checkbox"] { accent-color: var(--color-accent); }
.colleague-checkbox .checkbox-label { display: flex; flex-direction: column; gap: 2px; }
.colleague-email { font-size: 12px; color: var(--color-gray-500); }

.exceptions-list { display: flex; flex-direction: column; gap: var(--spacing-xs); margin-bottom: var(--spacing-md); }
.exception-item { display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-sm); background: var(--color-gray-50); border-radius: var(--radius-md); }
.exception-info { display: flex; flex-direction: column; gap: 4px; }
.exception-dates { font-size: 14px; font-weight: 500; }
.exception-type { font-size: 12px; padding: 2px 8px; border-radius: 4px; display: inline-block; width: fit-content; }
.exception-type.unavailable { background: var(--color-error); color: var(--color-white); }
.exception-type.capacity-change { background: var(--color-warning); color: var(--color-primary); }

.filters-bar { display: flex; gap: var(--spacing-md); margin-bottom: var(--spacing-md); flex-wrap: wrap; }
.search-box { position: relative; flex: 1; min-width: 200px; }
.search-input { width: 100%; padding: var(--spacing-sm) var(--spacing-md); padding-left: 40px; border: 2px solid var(--color-gray-300); border-radius: var(--radius-md); font-size: 15px; transition: var(--transition); }
.search-input:focus { outline: none; border-color: var(--color-accent); }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 16px; pointer-events: none; }
.filter-group { display: flex; gap: var(--spacing-sm); }
.filter-select {
  padding: var(--spacing-sm) var(--spacing-md);
  padding-right: 32px; /* Mer plass for pilen, men ikke for mye */
  border: 2px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: 14px;
  background: var(--color-white);
  cursor: pointer;
  min-width: 140px;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23737373' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
}
.filter-select:focus { outline: none; border-color: var(--color-accent); }

@media (max-width: 767px) {
  .filters-bar { flex-direction: column; }
  .filter-group { flex-direction: column; width: 100%; }
  .filter-select { width: 100%; min-width: unset; font-size: 16px; } /* 16px prevents iOS zoom on focus */
  .search-input { font-size: 16px; } /* 16px prevents iOS zoom on focus */
  .search-box { min-width: unset; }
}

.table-container { overflow-x: auto; border: 1px solid var(--color-gray-200); border-radius: var(--radius-lg); }
.data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.data-table th, .data-table td { padding: var(--spacing-sm); text-align: left; border-bottom: 1px solid var(--color-gray-100); }
.data-table th { background: var(--color-gray-50); font-weight: 600; color: var(--color-gray-600); font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
.data-table th.sortable { cursor: pointer; user-select: none; }
.data-table th.sortable:hover { background: var(--color-gray-100); }
.sort-icon { margin-left: 4px; font-size: 12px; }
.data-table tbody tr:hover { background: var(--color-gray-50); }
.data-table tbody tr:last-child td { border-bottom: none; }
.empty-table { text-align: center; color: var(--color-gray-500); padding: var(--spacing-xl) !important; }
.date-cell { white-space: nowrap; font-weight: 500; }
.address-cell { max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.customer-name { font-weight: 500; }
.contact-info { display: flex; flex-direction: column; gap: 2px; font-size: 13px; color: var(--color-gray-600); }

@media (max-width: 767px) { .hide-mobile { display: none; } }

.status-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
.status-active, .status-confirmed { background: rgba(22, 163, 74, 0.1); color: var(--color-success); }
.status-inactive { background: var(--color-gray-100); color: var(--color-gray-500); }
.status-completed { background: rgba(59, 130, 246, 0.1); color: #3B82F6; }
.status-cancelled { background: rgba(220, 38, 38, 0.1); color: var(--color-error); }
.status-no-show { background: rgba(245, 158, 11, 0.1); color: var(--color-warning); }
.status-pending { background: rgba(168, 85, 247, 0.1); color: #A855F7; }

.pagination { display: flex; justify-content: center; align-items: center; gap: var(--spacing-md); margin-top: var(--spacing-md); padding: var(--spacing-sm) 0; flex-wrap: wrap; }
.pagination-btn { padding: var(--spacing-xs) var(--spacing-md); background: var(--color-white); border: 2px solid var(--color-gray-300); border-radius: var(--radius-md); cursor: pointer; font-size: 14px; font-weight: 500; transition: var(--transition); white-space: nowrap; }
.pagination-btn:hover:not(:disabled) { border-color: var(--color-accent); color: var(--color-accent); }
.pagination-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.pagination-info { font-size: 14px; color: var(--color-gray-500); text-align: center; }

@media (max-width: 480px) {
  .pagination { gap: var(--spacing-sm); }
  .pagination-btn { padding: var(--spacing-xs) var(--spacing-sm); font-size: 13px; }
  .pagination-info { font-size: 12px; width: 100%; order: -1; margin-bottom: var(--spacing-xs); }
}

.btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--spacing-xs); padding: var(--spacing-sm) var(--spacing-md); border: none; border-radius: var(--radius-md); font-size: 15px; font-weight: 600; cursor: pointer; transition: var(--transition); }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-primary { background: var(--color-accent); color: var(--color-white); }
.btn-primary:hover:not(:disabled) { background: #E55A00; transform: translateY(-1px); }
.btn-confirm { background: var(--color-primary); color: var(--color-white); }
.btn-confirm:hover:not(:disabled) { background: #333; transform: translateY(-1px); }
.btn-secondary { background: var(--color-white); border: 2px solid var(--color-gray-300); color: var(--color-primary); }
.btn-secondary:hover:not(:disabled) { border-color: var(--color-accent); color: var(--color-accent); }
.btn-small { padding: var(--spacing-xs) var(--spacing-sm); font-size: 13px; }
.btn-icon { background: none; border: none; cursor: pointer; font-size: 18px; padding: var(--spacing-xs); border-radius: var(--radius-sm); transition: var(--transition); }
.btn-delete:hover { background: rgba(220, 38, 38, 0.1); }

.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: var(--spacing-md); }
.modal { background: var(--color-white); border-radius: var(--radius-lg); width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-lg); }
.modal-large { max-width: 700px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-md); border-bottom: 1px solid var(--color-gray-200); }
.modal-header h2 { margin: 0; font-size: 20px; font-weight: 600; }
.modal-close { background: none; border: none; font-size: 28px; cursor: pointer; color: var(--color-gray-400); line-height: 1; padding: 0; }
.modal-close:hover { color: var(--color-primary); }
.modal-body { padding: var(--spacing-md); }
.modal-footer { display: flex; justify-content: flex-end; gap: var(--spacing-sm); padding: var(--spacing-md); border-top: 1px solid var(--color-gray-200); }
.modal-footer-centered { justify-content: center; }

.form-group { margin-bottom: var(--spacing-md); text-align: center; }
.form-group label { display: block; margin-bottom: var(--spacing-xs); font-weight: 500; font-size: 14px; color: var(--color-gray-700); text-align: center; }
.form-input, .form-select, .form-textarea { width: 100%; padding: var(--spacing-sm); border: 2px solid var(--color-gray-300); border-radius: var(--radius-md); font-size: 15px; transition: var(--transition); font-family: inherit; }
.form-input:focus, .form-select:focus, .form-textarea:focus { outline: none; border-color: var(--color-accent); }
.form-input-small { width: 100%; max-width: 100%; }

/* Date picker orange accent color */
input[type="datetime-local"]::-webkit-calendar-picker-indicator { cursor: pointer; }
input[type="datetime-local"]:focus { border-color: var(--color-accent); }
input[type="date"]:focus { border-color: var(--color-accent); }

/* Override browser default blue selection */
::selection { background: rgba(255, 107, 0, 0.3); }
::-moz-selection { background: rgba(255, 107, 0, 0.3); }
.form-textarea { resize: vertical; min-height: 80px; }
.toggle-label { display: flex !important; align-items: center; gap: var(--spacing-sm); cursor: pointer; justify-content: center; }
.toggle-label input[type="checkbox"] { accent-color: var(--color-accent); width: 18px; height: 18px; }

/* All checkboxes and radio buttons use orange accent */
input[type="checkbox"], input[type="radio"] { accent-color: #FF6B35; }

/* Date inputs styling */
input[type="datetime-local"], input[type="date"], input[type="time"] {
  color-scheme: light;
}

.checkbox-grid { display: flex; flex-wrap: wrap; gap: var(--spacing-xs); }
.day-checkbox, .hour-checkbox { display: flex; align-items: center; gap: 6px; padding: var(--spacing-xs) var(--spacing-sm); background: var(--color-gray-50); border-radius: var(--radius-sm); cursor: pointer; font-size: 14px; transition: var(--transition); }
.day-checkbox:has(input:checked), .hour-checkbox:has(input:checked) { background: rgba(255, 107, 0, 0.1); color: var(--color-accent); }
.day-checkbox input, .hour-checkbox input { accent-color: var(--color-accent); }
.hours-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: var(--spacing-xs); }

.event-summary { background: var(--color-gray-50); padding: var(--spacing-sm); border-radius: var(--radius-md); margin-bottom: var(--spacing-md); }
.event-summary p { margin: 4px 0; font-size: 14px; }

.booking-details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md); margin-bottom: var(--spacing-md); }
@media (max-width: 600px) { .booking-details-grid { grid-template-columns: 1fr; } }
.detail-section { background: var(--color-gray-50); padding: var(--spacing-sm); border-radius: var(--radius-md); }
.detail-section.full-width { grid-column: 1 / -1; }
.detail-section h3 { margin: 0 0 var(--spacing-sm); font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-gray-500); }
.detail-section p { margin: 4px 0; font-size: 14px; }

.empty-state { text-align: center; padding: var(--spacing-lg); color: var(--color-gray-500); }
.empty-state p { margin: 0 0 var(--spacing-md); }

/* Desktop/Mobile visibility */
.desktop-only { display: block; }
.mobile-only { display: none; }

@media (max-width: 767px) {
  .desktop-only { display: none !important; }
  .mobile-only { display: block !important; }
}

/* Mobile Cards Styling */
.cards-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.data-card {
  background: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.data-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: var(--color-gray-50);
  border-bottom: 1px solid var(--color-gray-100);
  flex-wrap: wrap;
}

.data-card .card-date {
  font-weight: 600;
  font-size: 13px;
  line-height: 1.4;
  flex: 1;
  min-width: 0;
}

.data-card .card-body {
  padding: var(--spacing-sm);
}

.data-card .card-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-gray-100);
  font-size: 14px;
}

.data-card .card-row:last-child {
  border-bottom: none;
}

.data-card .card-label {
  color: var(--color-gray-500);
  font-weight: 500;
  font-size: 12px;
}

.data-card .card-value {
  word-break: break-word;
  line-height: 1.4;
}

.data-card .card-footer {
  padding: var(--spacing-sm);
  border-top: 1px solid var(--color-gray-100);
}

.btn-full {
  width: 100%;
}
</style>
