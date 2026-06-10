<template>
  <div class="active-tour-wrapper">
    <button class="back-btn" @click="$emit('back')">← Back to Tours</button>

    <div v-if="loading" class="state-card">
      <div class="spinner"></div>
      <p>Loading tour…</p>
    </div>
    <div v-else-if="error" class="state-card error">{{ error }}</div>

    <template v-else>
      <div class="tour-header">
        <div>
          <h2 class="tour-name">{{ tour.name }}</h2>
          <p class="tour-desc">{{ tour.description }}</p>
        </div>
        <div class="header-right">
          <span class="difficulty-badge" :class="difficultyClass(tour.difficulty)">
            {{ difficultyText(tour.difficulty) }}
          </span>
          <span class="price-tag">${{ tour.price?.toFixed(2) }}</span>
        </div>
      </div>

      <div class="status-bar" :class="statusClass">
        <span class="status-dot"></span>
        <span class="status-label">{{ statusLabel }}</span>
        <span v-if="execution" class="status-progress">
          {{ completedCount }} / {{ keyPoints.length }} key points completed
        </span>
        <span v-if="pollTimer && execution?.status === 'ACTIVE'" class="poll-countdown">
          Next check in {{ secondsUntilPoll }}s
        </span>
      </div>

      <div class="main-grid">

        <div class="map-panel">
          <div class="panel-label">
             Tour Map
            <span class="map-hint">Click anywhere to set your position</span>
          </div>

          <div v-if="currentPosition" class="position-banner">
             Your position: <strong>{{ currentPosition.lat.toFixed(5) }}, {{ currentPosition.lng.toFixed(5) }}</strong>
            <button class="clear-pos-btn" @click="clearPosition">Clear</button>
          </div>
          <div v-else class="position-banner empty">
            Click the map to set your location
          </div>

          <div id="active-tour-map" class="map-container"></div>
        </div>

        
        <div class="info-panel">
          <div class="action-bar">
            <button
              v-if="!execution || execution.status === 'ABANDONED' || execution.status === 'COMPLETED'"
              class="btn btn-start"
              @click="startTour"
              :disabled="actionLoading"
            >
              {{ actionLoading ? 'Starting…' : '▶ Start Tour' }}
            </button>
            <button
              v-if="execution?.status === 'ACTIVE'"
              class="btn btn-abandon"
              @click="abandonTour"
              :disabled="actionLoading"
            >
              {{ actionLoading ? 'Abandoning…' : '✕ Abandon Tour' }}
            </button>
          </div>

          <h3 class="section-title">Key Points</h3>
          <div class="keypoints-list">
            <div
              v-for="(kp, idx) in keyPoints"
              :key="kp.id"
              class="kp-card"
              :class="{ completed: isCompleted(kp.id) }"
            >
              <div class="kp-index" :class="{ completed: isCompleted(kp.id) }">
                <span v-if="isCompleted(kp.id)">✓</span>
                <span v-else>{{ idx + 1 }}</span>
              </div>
              <div class="kp-info">
                <h4>{{ kp.name }}</h4>
                <p>{{ kp.description }}</p>
              </div>
              <div v-if="isCompleted(kp.id)" class="kp-time">
                {{ formatTime(execution.completedKeyPointsWithTime[kp.id]) }}
              </div>
            </div>
          </div>
        </div>

      </div>
    </template>
  </div>
</template>

<script>
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

const POSITION_KEY = 'tourist_position';
const POLL_INTERVAL = 10;
const BASE = 'http://localhost:8000';

const greenIcon = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;background:#16a34a;border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
  iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -30],
});

const blueIcon = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;background:#2563eb;border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
  iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -30],
});

const playerIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;background:#f97316;border-radius:50%;
    border:3px solid #fff;box-shadow:0 0 0 3px rgba(249,115,22,.35)"></div>`,
  iconSize: [18, 18], iconAnchor: [9, 9],
});

export default {
  name: 'ActiveTour',
  props: {
    tourId:    { type: Number, required: true },
    touristId: { type: Number, required: true },
  },
  data() {
    return {
      tour: null,
      keyPoints: [],
      execution: null,
      loading: true,
      error: null,
      actionLoading: false,
      map: null,
      markers: {},
      playerMarker: null,
      pollTimer: null,
      countdownTimer: null,
      secondsUntilPoll: POLL_INTERVAL,
      currentPosition: null,
    };
  },
  computed: {
    completedCount() {
      return Object.keys(this.execution?.completedKeyPointsWithTime ?? {}).length;
    },
    statusLabel() {
      if (!this.execution) return 'Not started';
      return { ACTIVE: ' Active', COMPLETED: ' Completed', ABANDONED: ' Abandoned' }[this.execution.status] ?? this.execution.status;
    },
    statusClass() {
      if (!this.execution) return 'status-idle';
      return { ACTIVE: 'status-active', COMPLETED: 'status-completed', ABANDONED: 'status-abandoned' }[this.execution.status] ?? '';
    },
  },
  async mounted() {
    this.syncPosition();
    await this.loadData();
  },
  beforeUnmount() {
    this.stopPolling();
    if (this.map) { this.map.remove(); this.map = null; }
  },
  methods: {
    async loadData() {
      this.loading = true;
      this.error = null;
      const token = localStorage.getItem('token');
      try {
        const [toursRes, kpRes] = await Promise.all([
          axios.get(`${BASE}/tour/${this.tourId}`),
          axios.get(`${BASE}/keypoint/getDtosByTour/${this.tourId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
      this.tour = tourRes.data;
      this.keyPoints = kpRes.data;
      } catch (e) {
        this.error = 'Failed to load tour data.';
        console.error(e);
      } finally {
        this.loading = false;
        this.$nextTick(() => this.initMap());
      }
    },

    /* ── Map ──────────────────────────────────────── */
    initMap() {
      if (!this.keyPoints.length) return;

      this.map = L.map('active-tour-map', { scrollWheelZoom: false });

      const el = document.getElementById('active-tour-map');
      el?.addEventListener('mouseenter', () => this.map.scrollWheelZoom.enable());
      el?.addEventListener('mouseleave', () => this.map.scrollWheelZoom.disable());

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(this.map);

      const latlngs = this.keyPoints.map(p => [p.latitude, p.longitude]);
      L.polyline(latlngs, { color: '#2563eb', weight: 3, dashArray: '6,8' }).addTo(this.map);

      this.keyPoints.forEach((kp, idx) => {
        const marker = L.marker([kp.latitude, kp.longitude], { icon: blueIcon })
          .addTo(this.map)
          .bindPopup(`<b>${idx + 1}. ${kp.name}</b><br><small>${kp.description}</small>`);
        this.markers[kp.id] = marker;
      });

      const group = L.featureGroup(Object.values(this.markers));
      this.map.fitBounds(group.getBounds().pad(0.25));

      this.map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        this.setPosition(lat, lng);
      });

      this.updateMapMarkers();
      this.placePlayerMarker();
    },

    setPosition(lat, lng) {
      this.currentPosition = { lat, lng };
      localStorage.setItem(POSITION_KEY, JSON.stringify({ lat, lng }));
      this.placePlayerMarker();
    },

    clearPosition() {
      this.currentPosition = null;
      localStorage.removeItem(POSITION_KEY);
      if (this.playerMarker) {
        this.map.removeLayer(this.playerMarker);
        this.playerMarker = null;
      }
    },

    placePlayerMarker() {
      if (!this.map || !this.currentPosition) return;
      const { lat, lng } = this.currentPosition;
      if (this.playerMarker) {
        this.playerMarker.setLatLng([lat, lng]);
      } else {
        this.playerMarker = L.marker([lat, lng], { icon: playerIcon, zIndexOffset: 1000 })
          .addTo(this.map)
          .bindPopup('<b>You are here</b>');
      }
    },

    updateMapMarkers() {
      if (!this.execution?.completedKeyPointsWithTime) return;
      const completed = this.execution.completedKeyPointsWithTime;
      Object.entries(this.markers).forEach(([kpId, marker]) => {
        marker.setIcon(completed[kpId] !== undefined ? greenIcon : blueIcon);
      });
    },

    async startTour() {
      this.actionLoading = true;
      const token = localStorage.getItem('token');
      try {
        const { data } = await axios.post(`${BASE}/session/start`, null, {
          params: { touristId: this.touristId, tourId: this.tourId },
          headers: { Authorization: `Bearer ${token}` },
        });
        this.execution = data;
        this.startPolling();
      } catch (e) {
        alert('Could not start the tour.');
        console.error(e);
      } finally {
        this.actionLoading = false;
      }
    },

    async abandonTour() {
      if (!confirm('Are you sure you want to abandon this tour?')) return;
      this.actionLoading = true;
      const token = localStorage.getItem('token');
      try {
        const { data } = await axios.post(
          `${BASE}/session/abandon/${this.execution.id}`, null,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        this.execution = data;
        this.stopPolling();
      } catch (e) {
        alert('Failed to abandon tour.');
        console.error(e);
      } finally {
        this.actionLoading = false;
      }
    },

    syncPosition() {
      const raw = localStorage.getItem(POSITION_KEY);
      this.currentPosition = raw ? JSON.parse(raw) : null;
    },

    startPolling() {
      this.stopPolling();
      this.secondsUntilPoll = POLL_INTERVAL;
      this.countdownTimer = setInterval(() => {
        this.secondsUntilPoll = Math.max(0, this.secondsUntilPoll - 1);
      }, 1000);
      this.pollTimer = setInterval(async () => {
        this.secondsUntilPoll = POLL_INTERVAL;
        await this.pollPosition();
      }, POLL_INTERVAL * 1000);
    },

    stopPolling() {
      clearInterval(this.pollTimer);
      clearInterval(this.countdownTimer);
      this.pollTimer = null;
      this.countdownTimer = null;
    },

    async pollPosition() {
      
      this.syncPosition();
      this.placePlayerMarker();

      if (!this.currentPosition) {
        console.warn('No position set – skipping check');
        return;
      }
      if (!this.execution || this.execution.status !== 'ACTIVE') {
        this.stopPolling();
        return;
      }

      const token = localStorage.getItem('token');
      try {
        const { data } = await axios.post(
          `${BASE}/session/check-position/${this.execution.id}`,
          { latitude: this.currentPosition.lat, longitude: this.currentPosition.lng },
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
        );
        this.execution = data;
        this.updateMapMarkers();

        if (data.status === 'COMPLETED') {
          this.stopPolling();
          alert('🎉 Congratulations! You completed the tour!');
        }
      } catch (e) {
        console.error('check-position failed:', e);
      }
    },

    isCompleted(kpId) {
      return !!(this.execution?.completedKeyPointsWithTime?.[kpId]);
    },
    formatTime(dt) {
      if (!dt) return '';
      return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    },
    difficultyText(level) {
      return { 1: 'Easy', 2: 'Moderate', 3: 'Hard', 4: 'Expert', 5: 'Extreme' }[level] ?? 'Unknown';
    },
    difficultyClass(level) {
      if (level <= 2) return 'easy';
      if (level === 3) return 'moderate';
      return 'hard';
    },
  },
};
</script>

<style scoped>
.active-tour-wrapper {
  padding: 24px;
  background: #f8fafc;
  border-radius: 24px;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.back-btn {
  background: none;
  border: 1px solid #cbd5e1;
  padding: 8px 16px;
  border-radius: 40px;
  cursor: pointer;
  font-size: 14px;
  color: #475569;
  width: fit-content;
  transition: all .2s;
}
.back-btn:hover { background: #e2e8f0; color: #1e293b; }

/* ── Header ── */
.tour-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
}
.tour-name { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
.tour-desc { color: #64748b; font-size: 14px; line-height: 1.5; max-width: 560px; }
.header-right { display: flex; gap: 10px; align-items: center; flex-shrink: 0; }
.price-tag { font-size: 18px; font-weight: 700; color: #2d6a4f; }

.status-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 11px 18px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 500;
  flex-wrap: wrap;
}
.status-bar .status-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.status-idle      { background: #f1f5f9; color: #64748b; }
.status-idle      .status-dot { background: #94a3b8; }
.status-active    { background: #dcfce7; color: #166534; }
.status-active    .status-dot { background: #16a34a; animation: pulse 1.5s infinite; }
.status-completed { background: #dbeafe; color: #1e40af; }
.status-completed .status-dot { background: #2563eb; }
.status-abandoned { background: #fee2e2; color: #991b1b; }
.status-abandoned .status-dot { background: #dc2626; }
.status-progress  { opacity: .8; }
.poll-countdown   { margin-left: auto; font-size: 12px; opacity: .7; font-variant-numeric: tabular-nums; }

.main-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 20px;
  align-items: start;
}

.map-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.panel-label {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
}
.map-hint {
  font-size: 12px;
  font-weight: 400;
  color: #94a3b8;
}
.position-banner {
  background: #d1fae5;
  border: 1px solid #6ee7b7;
  color: #065f46;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.position-banner.empty {
  background: #f1f5f9;
  border: 1px dashed #cbd5e1;
  color: #94a3b8;
}
.clear-pos-btn {
  margin-left: auto;
  background: none;
  border: 1px solid #6ee7b7;
  color: #065f46;
  padding: 3px 10px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
}
.clear-pos-btn:hover { background: #a7f3d0; }

.map-container {
  height: 500px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 14px rgba(0,0,0,.07);
  cursor: crosshair;
}

.info-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.action-bar { display: flex; gap: 10px; flex-wrap: wrap; }
.btn {
  padding: 11px 24px;
  border-radius: 40px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all .2s;
}
.btn:disabled { opacity: .6; cursor: not-allowed; }
.btn-start   { background: #2d6a4f; color: white; }
.btn-start:hover:not(:disabled)   { background: #1e4d38; }
.btn-abandon { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
.btn-abandon:hover:not(:disabled) { background: #fecaca; }

.section-title { font-size: 16px; font-weight: 600; color: #1e293b; }
.keypoints-list { display: flex; flex-direction: column; gap: 10px; }

.kp-card {
  background: white;
  border-radius: 14px;
  padding: 12px 14px;
  display: flex;
  gap: 12px;
  align-items: center;
  border: 1px solid #eef2f6;
  box-shadow: 0 2px 6px rgba(0,0,0,.04);
  transition: border-color .25s, background .25s;
}
.kp-card.completed { border-color: #bbf7d0; background: #f0fdf4; }

.kp-index {
  width: 30px; height: 30px; border-radius: 50%;
  background: #2563eb; color: white;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 13px; flex-shrink: 0;
  transition: background .3s;
}
.kp-index.completed { background: #16a34a; }

.kp-info { flex: 1; min-width: 0; }
.kp-info h4 { font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 2px; }
.kp-info p  { font-size: 12px; color: #64748b; line-height: 1.4; }

.kp-time { font-size: 11px; color: #16a34a; font-weight: 600; white-space: nowrap; }


.difficulty-badge { font-weight: 600; padding: 4px 12px; border-radius: 12px; font-size: 12px; }
.difficulty-badge.easy     { background: #d1fae5; color: #065f46; }
.difficulty-badge.moderate { background: #fef3c7; color: #92400e; }
.difficulty-badge.hard     { background: #fee2e2; color: #991b1b; }


.state-card { text-align: center; padding: 60px 20px; color: #64748b; }
.state-card.error { color: #dc2626; }



</style>
