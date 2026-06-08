<template>
  <div class="tour-detail-container">
    <button @click="$emit('back')" class="back-btn">← Back to Drafts</button>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading tour...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="fetchTour" class="retry-btn">Retry</button>
    </div>

    <div v-else class="tour-detail">

      <div class="tour-header">
        <h1 class="tour-name">{{ tour.name }}</h1>
        <span class="status-badge" :class="getStatusClass(tour.status)">
          {{ tour.status }}
        </span>
      </div>

      <div class="tour-section">
        <h3 class="section-title">Description</h3>
        <p class="tour-description">{{ tour.description || 'No description available' }}</p>
      </div>

      <div class="tour-meta-grid">
        <div class="meta-card">
          <span class="meta-label">Difficulty</span>
          <span class="difficulty-level" :class="getDifficultyClass(tour.difficulty)">
            {{ getDifficultyText(tour.difficulty) }}
          </span>
        </div>
        <div class="meta-card">
          <span class="meta-label">Price</span>
          <span class="price">${{ formatPrice(tour.price) }}</span>
        </div>
        <div class="meta-card" v-if="tour.totalDistance > 0">
          <span class="meta-label">Distance</span>
          <span class="distance">{{ tour.totalDistance.toFixed(2) }} km</span>
        </div>
        <div class="meta-card" v-if="tour.tags">
          <span class="meta-label">Tags</span>
          <span class="tags">{{ tour.tags }}</span>
        </div>
      </div>

      <div class="tour-section">
        <div class="section-header">
          <h3 class="section-title">Transport Duration</h3>
          <button @click="startAddingDuration" class="add-keypoint-btn" v-if="tour.status === 'DRAFT'">
            + Add Duration
          </button>
        </div>

        <div v-if="isAddingDuration" class="add-duration-form">
          <div class="form-row">
            <select v-model="newDuration.transportType" class="form-input">
              <option value="WALKING">Walking</option>
              <option value="BIKE">Bike</option>
              <option value="CAR">Car</option>
            </select>
            <input type="number" v-model="newDuration.minutes" placeholder="Minutes" class="form-input" />
          </div>
          <div class="form-actions">
            <button @click="cancelAddDuration" class="cancel-btn">Cancel</button>
            <button @click="addDuration" class="submit-btn" :disabled="!newDuration.transportType || !newDuration.minutes">
              Save
            </button>
          </div>
        </div>

        <div v-if="tour.durationByTransport && Object.keys(tour.durationByTransport).length > 0" class="duration-list">
          <div v-for="(minutes, type) in tour.durationByTransport" :key="type" class="duration-item">
            <span class="duration-type">
              {{ getTransportName(type) }}
            </span>
            <span class="duration-minutes">{{ minutes }} min</span>
          </div>
        </div>
        <div v-else-if="!isAddingDuration" class="empty-duration">
          <p>No transport duration set yet. Add duration before publishing.</p>
        </div>
      </div>

      <div class="tour-section">
        <div class="section-header">
          <h3 class="section-title">Key Points</h3>
          <button @click="startAdding" class="add-keypoint-btn" v-if="tour.status === 'DRAFT'">
            + Add Key Point
          </button>
        </div>

        <div v-if="isAdding" class="add-keypoint-form">
          <h4>Add New Key Point</h4>

          <div class="map-section">
            <p class="map-hint">Click on the map to set the position</p>
            <div id="point-map" class="map-container"></div>
          </div>

          <div class="form-row">
            <input v-model="newKeyPoint.name" placeholder="Name" class="form-input" />
            <input v-model="newKeyPoint.description" placeholder="Description" class="form-input" />
          </div>
          <div class="form-row">
            <input v-model="newKeyPoint.imagePath" placeholder="Image URL (optional)" class="form-input" />
          </div>
          <div class="coord-display">
            Coordinates: {{ newKeyPoint.latitude ? newKeyPoint.latitude.toFixed(5) : '—' }},
            {{ newKeyPoint.longitude ? newKeyPoint.longitude.toFixed(5) : '—' }}
          </div>
          <div class="form-actions">
            <button @click="cancelAdd" class="cancel-btn">Cancel</button>
            <button @click="addKeyPoint" class="submit-btn" :disabled="!newKeyPoint.latitude || adding">
              {{ adding ? 'Adding...' : 'Add' }}
            </button>
          </div>
        </div>

        <div v-if="keyPoints.length === 0 && !isAdding" class="empty-keypoints">
          <p>No key points yet. Add your first key point!</p>
        </div>

        <div v-else class="keypoints-grid">
          <div v-for="point in keyPoints" :key="point.id" class="keypoint-card">
            <div class="keypoint-header">
              <h4 class="keypoint-name">{{ point.name }}</h4>
              <button @click="deleteKeyPoint(point.id)" class="delete-point-btn" title="Delete">✖</button>
            </div>
            <p class="keypoint-description">{{ point.description || 'No description' }}</p>
            <div class="keypoint-coords">
              {{ point.latitude.toFixed(5) }}, {{ point.longitude.toFixed(5) }}
            </div>
            <img v-if="point.imagePath" :src="point.imagePath" class="keypoint-image" />
          </div>
        </div>
      </div>

      <div class="publish-wrapper" v-if="tour.status === 'DRAFT'">
        <button @click="publishTour" class="publish-btn">
          Publish Tour
        </button>
      </div>
    </div>
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
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export default {
  name: 'DraftTourDetail',
  props: {
    tourId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      tour: null,
      keyPoints: [],
      loading: true,
      error: null,
      isAdding: false,
      adding: false,
      newKeyPoint: {
        name: '',
        description: '',
        latitude: null,
        longitude: null,
        imagePath: ''
      },
      map: null,
      tempMarker: null,
      isAddingDuration: false,
      newDuration: {
        transportType: 'WALKING',
        minutes: null
      }
    };
  },
  mounted() {
    this.fetchTour();
    this.fetchKeyPoints();
  },
  beforeUnmount() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  },
  methods: {
    async fetchTour() {
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:8000/tour/${this.tourId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        this.tour = response.data;
      } catch (err) {
        this.error = 'Failed to load tour';
      } finally {
        this.loading = false;
      }
    },

    async fetchKeyPoints() {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:8000/keypoint/getDtosByTour/${this.tourId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        this.keyPoints = response.data;

        this.$nextTick(() => {
          if (this.isAdding && !this.map) {
            this.initMap();
          } else if (this.map) {
            this.renderMarkersOnMap();
          }
        });
      } catch (err) {
        console.error('Error fetching key points:', err);
      }
    },

    initMap() {
      if (this.map) {
        this.map.remove();
        this.map = null;
      }

      setTimeout(() => {
        const mapContainer = document.getElementById('point-map');
        if (!mapContainer) return;

        this.map = L.map('point-map', { scrollWheelZoom: false });

        mapContainer.addEventListener('mouseenter', () => this.map.scrollWheelZoom.enable());
        mapContainer.addEventListener('mouseleave', () => this.map.scrollWheelZoom.disable());

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        if (this.keyPoints.length > 0) {
          this.map.setView([this.keyPoints[0].latitude, this.keyPoints[0].longitude], 13);
        } else {
          this.map.setView([45.267136, 19.833549], 13);
        }

        this.map.on('click', (e) => {
          if (!this.isAdding) return;
          const { lat, lng } = e.latlng;
          this.newKeyPoint.latitude = lat;
          this.newKeyPoint.longitude = lng;

          if (this.tempMarker) this.map.removeLayer(this.tempMarker);
          this.tempMarker = L.marker([lat, lng], {
            icon: L.divIcon({ className: 'temp-marker', html: '📍', iconSize: [30, 30] })
          }).addTo(this.map);
        });

        this.renderMarkersOnMap();
      }, 100);
    },

    renderMarkersOnMap() {
      if (!this.map) return;

      this.map.eachLayer((layer) => {
        if (layer instanceof L.Marker && !(layer.options.icon instanceof L.Icon.Default)) {
          this.map.removeLayer(layer);
        }
      });

      this.keyPoints.forEach((point) => {
        L.marker([point.latitude, point.longitude])
            .addTo(this.map)
            .bindPopup(`<b>${point.name}</b><br>${point.description}`);
      });

      if (this.keyPoints.length > 1) {
        const latlngs = this.keyPoints.map(p => [p.latitude, p.longitude]);
        L.polyline(latlngs, { color: '#2d6a4f', weight: 3, dashArray: '6, 8' }).addTo(this.map);
      }
    },

    startAdding() {
      this.isAdding = true;
      this.newKeyPoint = { name: '', description: '', latitude: null, longitude: null, imagePath: '' };
      this.$nextTick(() => {
        this.initMap();
      });
    },

    cancelAdd() {
      this.isAdding = false;
      if (this.tempMarker) {
        this.map.removeLayer(this.tempMarker);
        this.tempMarker = null;
      }
    },

    async addKeyPoint() {
      if (!this.newKeyPoint.name || !this.newKeyPoint.latitude) {
        alert('Please fill name and click on map to select position');
        return;
      }

      this.adding = true;
      try {
        const token = localStorage.getItem('token');
        await axios.post(`http://localhost:8000/keypoint/add/${this.tourId}`, this.newKeyPoint, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        this.isAdding = false;
        this.adding = false;
        if (this.tempMarker) {
          this.map.removeLayer(this.tempMarker);
          this.tempMarker = null;
        }
        await this.fetchKeyPoints();
      } catch (err) {
        alert('Failed to add key point');
        this.adding = false;
      }
    },

    async deleteKeyPoint(pointId) {
      if (confirm('Delete this key point?')) {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`http://localhost:8000/keypoint/delete/${pointId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          await this.fetchKeyPoints();
        } catch (err) {
          alert('Failed to delete key point');
        }
      }
    },

    startAddingDuration() {
      this.isAddingDuration = true;
      this.newDuration = { transportType: 'WALKING', minutes: null };
    },

    cancelAddDuration() {
      this.isAddingDuration = false;
    },

    async addDuration() {
      if (!this.newDuration.minutes) {
        alert('Please enter minutes');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        await axios.post(`http://localhost:8000/tour/${this.tourId}/duration`, {
          transportType: this.newDuration.transportType,
          minutes: parseInt(this.newDuration.minutes)
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        this.isAddingDuration = false;
        await this.fetchTour();
      } catch (err) {
        alert('Failed to add duration');
      }
    },

    getTransportName(type) {
      const names = { 'WALKING': 'Walking', 'BIKE': 'Bike', 'CAR': 'Car' };
      return names[type] || type;
    },

    async publishTour() {
      if (this.keyPoints.length < 2) {
        alert('Tour must have at least 2 key points to publish');
        return;
      }

      if (!this.tour.durationByTransport || Object.keys(this.tour.durationByTransport).length === 0) {
        alert('Please add at least one transport duration before publishing');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        await axios.put(`http://localhost:8000/tour/${this.tourId}/publish`, {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        await this.fetchTour();
        alert('Tour published successfully!');
      } catch (err) {
        alert('Failed to publish tour');
      }
    },

    formatPrice(price) {
      if (!price && price !== 0) return 'N/A';
      return price.toFixed(2);
    },

    getDifficultyText(level) {
      const levels = { 1: 'Easy', 2: 'Moderate', 3: 'Hard', 4: 'Expert', 5: 'Extreme' };
      return levels[level] || 'Not rated';
    },

    getDifficultyClass(level) {
      if (level <= 2) return 'easy';
      if (level <= 3) return 'moderate';
      return 'hard';
    },

    getStatusClass(status) {
      return status === 'DRAFT' ? 'status-draft' : 'status-published';
    }
  }
};
</script>

<style scoped>

.tour-detail-container {
  background: #f8fafc;
  border-radius: 24px;
  padding: 24px;
  min-height: 100%;
}

.back-btn {
  background: none;
  border: none;
  color: #2d6a4f;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 24px;
  padding: 8px 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.back-btn:hover {
  color: #1b4d3e;
}

.tour-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e2e8f0;
}

.tour-name {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.status-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 30px;
}

.status-badge.status-draft {
  background: #fef3c7;
  color: #92400e;
}

.tour-section {
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.add-keypoint-btn {
  background: #e2e8f0;
  border: none;
  padding: 6px 14px;
  border-radius: 30px;
  font-size: 13px;
  cursor: pointer;
  color: #475569;
  transition: all 0.2s;
}

.add-keypoint-btn:hover {
  background: #cbd5e1;
}

.tour-description {
  font-size: 15px;
  line-height: 1.6;
  color: #334155;
  background: white;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
}

.tour-meta-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.meta-card {
  background: white;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  text-align: center;
}

.meta-label {
  display: block;
  font-size: 13px;
  color: #64748b;
  margin-bottom: 8px;
}

.difficulty-level {
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  display: inline-block;
}

.difficulty-level.easy {
  background: #d1fae5;
  color: #065f46;
}

.difficulty-level.moderate {
  background: #fef3c7;
  color: #92400e;
}

.difficulty-level.hard {
  background: #fee2e2;
  color: #991b1b;
}

.price {
  font-weight: 700;
  color: #2d6a4f;
  font-size: 18px;
}

.tags {
  background: #eff6ff;
  color: #3b82f6;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  display: inline-block;
}

.distance {
  font-weight: 700;
  color: #2d6a4f;
  font-size: 16px;
}

/* Duration styles */
.add-duration-form {
  background: white;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  margin-bottom: 20px;
}

.duration-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}

.duration-item {
  background: #f1f5f9;
  padding: 8px 16px;
  border-radius: 30px;
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 14px;
}

.duration-type {
  font-weight: 500;
  color: #1e293b;
}

.duration-minutes {
  color: #2d6a4f;
  font-weight: 600;
}

.empty-duration {
  text-align: center;
  padding: 20px;
  background: white;
  border-radius: 16px;
  border: 1px dashed #cbd5e1;
  color: #64748b;
  font-size: 14px;
}

/* Map styles */
.map-section {
  margin-bottom: 20px;
}

.map-hint {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 12px;
  margin-bottom: 10px;
}

.map-container {
  height: 300px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.add-keypoint-form {
  background: white;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  margin-bottom: 20px;
}

.add-keypoint-form h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #1e293b;
}

.form-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.form-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
}

.coord-display {
  background: #f1f5f9;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  color: #475569;
  margin-bottom: 16px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancel-btn, .submit-btn {
  padding: 8px 20px;
  border-radius: 30px;
  border: none;
  cursor: pointer;
  font-size: 13px;
}

.cancel-btn {
  background: #f1f5f9;
  color: #64748b;
}

.submit-btn {
  background: #2d6a4f;
  color: white;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.keypoints-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.keypoint-card {
  background: white;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  position: relative;
}

.keypoint-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.keypoint-name {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.delete-point-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #ef4444;
  font-size: 14px;
  padding: 4px 6px;
  border-radius: 20px;
}

.delete-point-btn:hover {
  background: #fee2e2;
}

.keypoint-description {
  font-size: 13px;
  color: #475569;
  margin-bottom: 8px;
}

.keypoint-coords {
  font-size: 11px;
  color: #94a3b8;
  font-family: monospace;
}

.keypoint-image {
  margin-top: 12px;
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 12px;
}

.empty-keypoints {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 16px;
  border: 1px dashed #cbd5e1;
  color: #64748b;
}

.publish-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.publish-btn {
  background: linear-gradient(135deg, #2d6a4f, #1b4d3e);
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 40px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.publish-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(45, 106, 79, 0.3);
}

.loading-state, .error-state {
  text-align: center;
  padding: 60px 20px;
}

.retry-btn {
  background: #2d6a4f;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 40px;
  cursor: pointer;
  margin-top: 16px;
}
</style>