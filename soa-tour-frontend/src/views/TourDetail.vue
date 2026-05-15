<template>
  <div class="tour-detail">
    <button class="back-btn" @click="$emit('back')">← Back to Tours</button>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading tour...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
    </div>

    <div v-else>
      <div class="tour-header">
        <h2 class="tour-name">{{ tour.name }}</h2>
        <div class="tour-badges">
          <span class="difficulty-level" :class="getDifficultyClass(tour.difficulty)">
            {{ getDifficultyText(tour.difficulty) }}
          </span>
          <span class="price">${{ tour.price?.toFixed(2) }}</span>
        </div>
      </div>

      <p class="tour-description">{{ tour.description }}</p>

      <div class="map-section">
        <h3 class="section-title">Key Points on Map</h3>
        <div id="tour-map" class="map-container"></div>
      </div>

      <div class="keypoints-section">
        <h3 class="section-title">Key Points</h3>
        <div class="keypoints-list">
          <div v-for="(point, index) in keyPoints" :key="point.id" class="keypoint-card">
            <div class="keypoint-index">{{ index + 1 }}</div>
            <div class="keypoint-info">
              <h4>{{ point.name }}</h4>
              <p>{{ point.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default marker icons
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
  name: 'TourDetail',
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
      map: null
    };
  },
  async mounted() {
    await this.loadData();
  },
  beforeUnmount() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  },
  methods: {
    async loadData() {
      this.loading = true;
      this.error = null;
      try {
        const [toursRes, pointsRes] = await Promise.all([
          axios.get('http://localhost:8080/tour/getAllDtos'),
          axios.get(`http://localhost:8080/keypoint/getDtosByTour/${this.tourId}`)
        ]);

        this.tour = toursRes.data.find(t => t.id === this.tourId);
        this.keyPoints = pointsRes.data;
      } catch (err) {
        this.error = 'Failed to load tour details.';
        console.error(err);
      } finally {
        this.loading = false;
        this.$nextTick(() => this.initMap());
      }
    },

    initMap() {
      if (!this.keyPoints.length) return;

      this.map = L.map('tour-map');

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      const markers = this.keyPoints.map((point, index) => {
        const marker = L.marker([point.latitude, point.longitude])
          .addTo(this.map)
          .bindPopup(`<b>${index + 1}. ${point.name}</b><br>${point.description}`);
        return marker;
      });

      const latlngs = this.keyPoints.map(p => [p.latitude, p.longitude]);
      L.polyline(latlngs, { color: '#2d6a4f', weight: 3, dashArray: '6, 8' }).addTo(this.map);

      const group = L.featureGroup(markers);
      this.map.fitBounds(group.getBounds().pad(0.2));
    },

    getDifficultyText(level) {
      const levels = { 1: 'Easy', 2: 'Moderate', 3: 'Hard', 4: 'Expert', 5: 'Extreme' };
      return levels[level] || 'Not rated';
    },

    getDifficultyClass(level) {
      if (level <= 2) return 'easy';
      if (level <= 3) return 'moderate';
      return 'hard';
    }
  }
};
</script>

<style scoped>
.tour-detail {
  padding: 24px;
  background: #f8fafc;
  border-radius: 24px;
  min-height: 100%;
}

.back-btn {
  background: none;
  border: 1px solid #cbd5e1;
  padding: 8px 16px;
  border-radius: 40px;
  cursor: pointer;
  font-size: 14px;
  color: #475569;
  margin-bottom: 24px;
  transition: all 0.2s;
  display: block;  /* ← add this */
  width: fit-content;  /* ← and this */
}

.back-btn:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.tour-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 12px;
}

.tour-name {
  font-size: 26px;
  font-weight: 700;
  color: #0f172a;
}

.tour-badges {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tour-description {
  color: #475569;
  font-size: 15px;
  line-height: 1.6;
  margin-bottom: 32px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
}

.map-section {
  margin-bottom: 32px;
}

.map-container {
  height: 420px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}

.keypoints-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.keypoint-card {
  background: white;
  border-radius: 14px;
  padding: 16px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  border: 1px solid #eef2f6;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.keypoint-index {
  background: #2d6a4f;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}

.keypoint-info h4 {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 4px;
}

.keypoint-info p {
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
}

.difficulty-level {
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.difficulty-level.easy { background: #d1fae5; color: #065f46; }
.difficulty-level.moderate { background: #fef3c7; color: #92400e; }
.difficulty-level.hard { background: #fee2e2; color: #991b1b; }

.price {
  font-weight: 700;
  color: #2d6a4f;
  font-size: 18px;
}

.loading-state, .error-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #2d6a4f;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}


</style>