<template>
  <div class="simulator-container">
    <h2 class="page-title">Position Simulator</h2>
    <p class="subtitle">Click on the map to set your current location</p>

    <div class="location-banner" v-if="currentPosition">
      📍 Current position: <strong>{{ currentPosition.lat.toFixed(5) }}, {{ currentPosition.lng.toFixed(5) }}</strong>
      <button @click="clearPosition" class="clear-btn">Clear</button>
    </div>

    <div class="location-banner empty" v-else>
      No position set yet. Click on the map to set your location.
    </div>

    <div id="simulator-map" class="map-container"></div>
  </div>
</template>

<script>
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const STORAGE_KEY = 'tourist_position';

export default {
  name: 'PositionSimulator',
  data() {
    return {
      currentPosition: null,
      map: null,
      marker: null
    };
  },
  mounted() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      this.currentPosition = JSON.parse(saved);
    }
    this.$nextTick(() => this.initMap());
  },
  beforeUnmount() {
    if (this.map) { this.map.remove(); this.map = null; }
  },
  methods: {
    initMap() {
      const center = this.currentPosition
        ? [this.currentPosition.lat, this.currentPosition.lng]
        : [45.267136, 19.833549];

      this.map = L.map('simulator-map', { scrollWheelZoom: false });

      const mapContainer = document.getElementById('simulator-map');
      mapContainer.addEventListener('mouseenter', () => this.map.scrollWheelZoom.enable());
      mapContainer.addEventListener('mouseleave', () => this.map.scrollWheelZoom.disable());

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      this.map.setView(center, 14);

      if (this.currentPosition) {
        this.placeMarker(this.currentPosition.lat, this.currentPosition.lng);
      }

      this.map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        this.setPosition(lat, lng);
      });
    },

    setPosition(lat, lng) {
      this.currentPosition = { lat, lng };
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ lat, lng }));
      this.placeMarker(lat, lng);
    },

    placeMarker(lat, lng) {
      if (this.marker) this.map.removeLayer(this.marker);
      this.marker = L.marker([lat, lng])
        .addTo(this.map)
        .bindPopup(`<b>Your location</b><br>${lat.toFixed(5)}, ${lng.toFixed(5)}}`)
        .openPopup();
    },

    clearPosition() {
      this.currentPosition = null;
      localStorage.removeItem(STORAGE_KEY);
      if (this.marker) { this.map.removeLayer(this.marker); this.marker = null; }
    }
  }
};
</script>

<style scoped>
.simulator-container {
  padding: 24px;
  background: #f8fafc;
  border-radius: 24px;
  min-height: 100%;
}
.page-title {
  font-size: 26px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 6px;
}
.subtitle {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 20px;
}
.location-banner {
  background: #d1fae5;
  border: 1px solid #6ee7b7;
  color: #065f46;
  padding: 12px 18px;
  border-radius: 12px;
  font-size: 14px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.location-banner.empty {
  background: #f1f5f9;
  border: 1px dashed #cbd5e1;
  color: #94a3b8;
}
.clear-btn {
  margin-left: auto;
  background: none;
  border: 1px solid #6ee7b7;
  color: #065f46;
  padding: 4px 12px;
  border-radius: 40px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}
.clear-btn:hover { background: #a7f3d0; }
.map-container {
  height: 500px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}
</style>