<template>
  <div class="manage-container">
    <button class="back-btn" @click="$emit('back')">← Back to My Tours</button>

    <h2 class="page-title">Manage Key Points</h2>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>

    <div v-else>
       <!-- MAPA --> 
      <div class="map-section">
        <p class="map-hint" v-if="isAdding || isEditing">
           Click on the map to set the position
        </p>
        <div id="manage-map" class="map-container"></div>
      </div>

      <!-- Add Form -->
      <div class="form-section" v-if="isAdding">
        <h3>Add New Key Point</h3>
        <div class="form-grid">
          <input v-model="form.name" placeholder="Name" class="form-input" />
          <input v-model="form.description" placeholder="Description" class="form-input" />
          <input v-model="form.imagePath" placeholder="Image URL (optional)" class="form-input" />
          <div class="coord-display">
            📍 {{ form.latitude ? form.latitude.toFixed(5) : '—' }}, {{ form.longitude ? form.longitude.toFixed(5) : '—' }}
          </div>
        </div>
        <div class="form-actions">
          <button @click="submitAdd" class="save-btn" :disabled="!form.latitude">Save</button>
          <button @click="cancelForm" class="cancel-btn">Cancel</button>
        </div>
      </div>

      <!-- Edit Form -->
      <div class="form-section" v-if="isEditing">
        <h3>Edit Key Point</h3>
        <div class="form-grid">
          <input v-model="form.name" placeholder="Name" class="form-input" />
          <input v-model="form.description" placeholder="Description" class="form-input" />
          <input v-model="form.imagePath" placeholder="Image URL (optional)" class="form-input" />
          <div class="coord-display">
            📍 {{ form.latitude ? form.latitude.toFixed(5) : '—' }}, {{ form.longitude ? form.longitude.toFixed(5) : '—' }}
          </div>
        </div>
        <div class="form-actions">
          <button @click="submitEdit" class="save-btn">Save Changes</button>
          <button @click="cancelForm" class="cancel-btn">Cancel</button>
        </div>
      </div>

      <!-- Key Points List -->
      <div class="keypoints-section" v-if="!isAdding && !isEditing">
        <div class="section-header">
          <h3>Key Points</h3>
          <button @click="startAdding" class="add-btn">+ Add Key Point</button>
        </div>

        <div v-if="keyPoints.length === 0" class="empty-state">
          No key points yet. Click "Add Key Point" to get started.
        </div>

        <div class="keypoints-list">
          <div v-for="(point, index) in keyPoints" :key="point.id" class="keypoint-card">
            <div class="keypoint-index">{{ index + 1 }}</div>
            <div class="keypoint-info">
              <h4>{{ point.name }}</h4>
              <p>{{ point.description }}</p>
              <span class="coords">{{ point.latitude.toFixed(4) }}, {{ point.longitude.toFixed(4) }}</span>
            </div>
            <div class="keypoint-actions">
              <button @click="startEditing(point)" class="edit-btn">Edit</button>
              <button @click="deletePoint(point.id)" class="delete-btn">Delete</button>
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
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const token = localStorage.getItem('token');
        

export default {
  name: 'ManageKeyPoints',
  props: {
    tourId: { type: Number, required: true }
  },
  emits: ['back'],
  data() {
    return {
      keyPoints: [],
      loading: true,
      isAdding: false,
      isEditing: false,
      form: { id: null, name: '', description: '', imagePath: '', latitude: null, longitude: null },
      map: null,
      markers: [],
      tempMarker: null,
      polyline: null
    };
  },
  async mounted() {
    await this.fetchKeyPoints();
  },
  beforeUnmount() {
    if (this.map) { this.map.remove(); this.map = null; }
  },
  methods: {
    async fetchKeyPoints() {
      this.loading = true;
      
      if (!token) {
          this.errorMessage = 'You must be logged in to see ur keypoitns';
          return;
        }

      try {
        const res = await axios.get(`http://localhost:8000/keypoint/getDtosByTour/${this.tourId}`,{
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        this.keyPoints = res.data;
      } catch (err) {
        console.error(err);
      } finally {
        this.loading = false;
        this.$nextTick(() => this.initMap());
      }
    },

    initMap() {
      if (this.map) { this.map.remove(); this.map = null; }

      this.map = L.map('manage-map', { scrollWheelZoom: false });

      const mapContainer = document.getElementById('manage-map');
      mapContainer.addEventListener('mouseenter', () => this.map.scrollWheelZoom.enable());
      mapContainer.addEventListener('mouseleave', () => this.map.scrollWheelZoom.disable());

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      this.map.on('click', (e) => {
        if (!this.isAdding && !this.isEditing) return;
        const { lat, lng } = e.latlng;
        this.form.latitude = lat;
        this.form.longitude = lng;

        if (this.tempMarker) this.map.removeLayer(this.tempMarker);
        this.tempMarker = L.marker([lat, lng], {
          icon: L.divIcon({ className: 'temp-marker', html: '📍', iconSize: [30, 30] })
        }).addTo(this.map);
      });

      this.renderMarkers();
    },

    renderMarkers() {
      this.markers.forEach(m => this.map.removeLayer(m));
      this.markers = [];
      if (this.polyline) { this.map.removeLayer(this.polyline); this.polyline = null; }

      if (!this.keyPoints.length) {
        this.map.setView([45.267136, 19.833549], 13); // Novi Sad default
        return;
      }

      this.keyPoints.forEach((point, index) => {
        const marker = L.marker([point.latitude, point.longitude])
          .addTo(this.map)
          .bindPopup(`<b>${index + 1}. ${point.name}</b><br>${point.description}`);
        this.markers.push(marker);
      });

      const latlngs = this.keyPoints.map(p => [p.latitude, p.longitude]);
      this.polyline = L.polyline(latlngs, { color: '#2d6a4f', weight: 3, dashArray: '6, 8' }).addTo(this.map);

      const group = L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.2));
    },

    startAdding() {
      this.isAdding = true;
      this.isEditing = false;
      this.form = { id: null, name: '', description: '', imagePath: '', latitude: null, longitude: null };
      if (this.tempMarker) { this.map.removeLayer(this.tempMarker); this.tempMarker = null; }
    },

    startEditing(point) {
      this.isEditing = true;
      this.isAdding = false;
      this.form = { ...point };
      if (this.tempMarker) { this.map.removeLayer(this.tempMarker); this.tempMarker = null; }
      this.tempMarker = L.marker([point.latitude, point.longitude], {
        icon: L.divIcon({ className: 'temp-marker', html: '📍', iconSize: [30, 30] })
      }).addTo(this.map);
    },

    cancelForm() {
      this.isAdding = false;
      this.isEditing = false;
      if (this.tempMarker) { this.map.removeLayer(this.tempMarker); this.tempMarker = null; }
    },

    async submitAdd() {
      if (!this.form.latitude) return;
      if (!token) {
          this.errorMessage = 'You must be logged in to add ur keypoints';
          return;
        }
      try {
        await axios.post(`http://localhost:8000/keypoint/add/${this.tourId}`, this.form,{
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        await this.fetchKeyPoints();
        this.cancelForm();
        this.renderMarkers();
      } catch (err) {
        console.error(err);
      }
    },

    async submitEdit() {
      if (!token) {
          this.errorMessage = 'You must be logged in to update ur keypoints';
          return;
        }
      try {
        await axios.put('http://localhost:8000/keypoint/update', this.form,{
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        await this.fetchKeyPoints();
        this.cancelForm();
        this.renderMarkers();
      } catch (err) {
        console.error(err);
      }
    },

    async deletePoint(id) {
      if (!confirm('Delete this key point?')) return;
      if (!token) {
          this.errorMessage = 'You must be logged in to delete ur keypoints';
          return;
        }
      try {
        await axios.delete(`http://localhost:8000/keypoint/delete/${id}`,{
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        await this.fetchKeyPoints();
        this.renderMarkers();
      } catch (err) {
        console.error(err);
      }
    }
  }
};
</script>

<style scoped>
.manage-container {
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
  display: block;
  width: fit-content;
}
.back-btn:hover { background: #e2e8f0; }
.page-title {
  font-size: 26px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 20px;
}
.map-section { margin-bottom: 24px; }
.map-hint {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 14px;
  margin-bottom: 10px;
}
.map-container {
  height: 380px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}
.form-section {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.form-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 16px;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}
.form-input {
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  transition: border 0.2s;
  font-family: inherit;
}
.form-input:focus { border-color: #2d6a4f; }
.coord-display {
  grid-column: span 2;
  background: #f1f5f9;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  color: #475569;
}
.form-actions { display: flex; gap: 10px; }
.save-btn {
  background: linear-gradient(135deg, #2d6a4f, #1b4d3e);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 40px;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}
.save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.save-btn:hover:not(:disabled) { box-shadow: 0 4px 12px rgba(45,106,79,0.3); }
.cancel-btn {
  background: none;
  border: 1px solid #cbd5e1;
  padding: 10px 24px;
  border-radius: 40px;
  cursor: pointer;
  font-size: 14px;
  color: #475569;
  transition: all 0.2s;
}
.cancel-btn:hover { background: #f1f5f9; }
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.section-header h3 { font-size: 18px; font-weight: 600; color: #1e293b; }
.add-btn {
  background: linear-gradient(135deg, #2d6a4f, #1b4d3e);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 40px;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}
.add-btn:hover { box-shadow: 0 4px 12px rgba(45,106,79,0.3); }
.empty-state {
  text-align: center;
  padding: 40px;
  color: #94a3b8;
  background: white;
  border-radius: 16px;
  border: 1px dashed #cbd5e1;
}
.keypoints-list { display: flex; flex-direction: column; gap: 12px; }
.keypoint-card {
  background: white;
  border-radius: 14px;
  padding: 16px;
  display: flex;
  gap: 16px;
  align-items: center;
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
.keypoint-info { flex: 1; }
.keypoint-info h4 { font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 4px; }
.keypoint-info p { font-size: 13px; color: #64748b; margin-bottom: 4px; }
.coords { font-size: 11px; color: #94a3b8; }
.keypoint-actions { display: flex; gap: 8px; }
.edit-btn {
  background: #eff6ff;
  color: #3b82f6;
  border: 1px solid #bfdbfe;
  padding: 6px 14px;
  border-radius: 40px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}
.edit-btn:hover { background: #dbeafe; }
.delete-btn {
  background: #fff1f0;
  color: #ef4444;
  border: 1px solid #fecaca;
  padding: 6px 14px;
  border-radius: 40px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}
.delete-btn:hover { background: #fee2e2; }
.loading-state { text-align: center; padding: 60px 20px; }

</style>